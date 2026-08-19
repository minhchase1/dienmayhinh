import { createHash, timingSafeEqual } from "node:crypto";
import { PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const sepayPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  gateway: z.string().trim().min(1).max(100),
  transactionDate: z.string().trim().optional().nullable(),
  accountNumber: z.string().trim().min(1).max(50),
  code: z.string().trim().optional().nullable(),
  content: z.string().trim().optional().nullable(),
  transferType: z.string().trim().toLowerCase(),
  transferAmount: z.coerce.number().finite().positive().max(999_999_999_999),
  referenceCode: z.string().trim().max(255).optional().nullable(),
}).passthrough();

function secureEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function authorized(request: Request, apiKey: string) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const suppliedKey = authorization.replace(/^apikey\s+/i, "");
  return suppliedKey.length > 0 && secureEqual(suppliedKey, apiKey);
}

function paymentReference(payload: z.infer<typeof sepayPayloadSchema>) {
  const candidates = [payload.code, payload.content];
  for (const candidate of candidates) {
    const match = candidate?.toUpperCase().match(/DMH[A-F0-9]{12}/);
    if (match) return match[0];
  }
  return null;
}

function parseTransactionDate(value?: string | null) {
  if (!value) return null;
  // SePay sends local Vietnam time as YYYY-MM-DD HH:mm:ss.
  const date = new Date(`${value.replace(" ", "T")}+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  const apiKey = process.env.SEPAY_WEBHOOK_API_KEY?.trim();
  const expectedAccount = process.env.SEPAY_WEBHOOK_ACCOUNT_NO?.trim();
  if (!apiKey || !expectedAccount) {
    console.error("SePay webhook is missing SEPAY_WEBHOOK_API_KEY or SEPAY_WEBHOOK_ACCOUNT_NO");
    return Response.json({ success: false, message: "Webhook is not configured" }, { status: 503 });
  }
  if (!authorized(request, apiKey)) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = sepayPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, message: "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;
  if (payload.transferType !== "in") {
    return Response.json({ success: true, ignored: "not_incoming" });
  }
  if (!secureEqual(payload.accountNumber, expectedAccount)) {
    return Response.json({ success: true, ignored: "account_mismatch" });
  }
  const reference = paymentReference(payload);
  if (!reference) {
    return Response.json({ success: true, ignored: "payment_reference_missing" });
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({
        where: { paymentReference: reference },
        select: {
          id: true, code: true, userId: true, status: true, total: true,
          paymentRequired: true, paidAmount: true, paymentStatus: true,
        },
      });
      if (!order || order.status === "CANCELLED" || Number(order.paymentRequired) <= 0) {
        return { kind: "ignored" as const, reason: "order_not_payable" };
      }

      const duplicate = await tx.paymentTransaction.findUnique({
        where: { provider_providerTransactionId: { provider: "SEPAY", providerTransactionId: payload.id } },
        select: { id: true },
      });
      if (duplicate) return { kind: "duplicate" as const, orderCode: order.code };

      await tx.paymentTransaction.create({ data: {
        provider: "SEPAY",
        providerTransactionId: payload.id,
        referenceCode: payload.referenceCode || null,
        gateway: payload.gateway,
        accountNumber: payload.accountNumber,
        amount: new Prisma.Decimal(payload.transferAmount),
        transactionDate: parseTransactionDate(payload.transactionDate),
        rawPayload: body as Prisma.InputJsonValue,
        orderId: order.id,
      } });

      const received = Number(order.paidAmount) + payload.transferAmount;
      const required = Number(order.paymentRequired);
      const total = Number(order.total);
      const paymentStatus = received >= total ? PaymentStatus.PAID
        : received >= required ? PaymentStatus.PARTIALLY_PAID
        : PaymentStatus.PENDING;
      const paymentComplete = received >= required;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paidAmount: new Prisma.Decimal(received),
          paymentStatus,
          ...(paymentComplete && Number(order.paidAmount) < required ? { paidAt: new Date() } : {}),
        },
      });

      if (paymentComplete && order.paymentStatus === PaymentStatus.PENDING) {
        if (order.userId) {
          await tx.notification.create({ data: {
            userId: order.userId,
            orderId: order.id,
            title: "Đã nhận thanh toán",
            message: `Hệ thống đã tự động ghi nhận ${received.toLocaleString("vi-VN")}đ cho đơn ${order.code}.`,
          } });
        }
        const admins = await tx.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        if (admins.length) await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            orderId: order.id,
            title: "Có đơn hàng mới cần xác nhận",
            message: `Đơn ${order.code} đã nhận đủ ${required.toLocaleString("vi-VN")}đ và sẵn sàng để xác nhận.`,
          })),
        });
      }
      return { kind: "processed" as const, orderCode: order.code, paymentComplete };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (result.kind === "ignored") return Response.json({ success: true, ignored: result.reason });
    revalidatePath("/admin");
    revalidatePath("/tra-cuu");
    revalidatePath("/tai-khoan");
    revalidatePath("/", "layout");
    return Response.json({ success: true, status: result.kind, orderCode: result.orderCode });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ success: true, status: "duplicate" });
    }
    console.error("SePay webhook failed:", error);
    return Response.json({ success: false, message: "Processing failed" }, { status: 500 });
  }
}
