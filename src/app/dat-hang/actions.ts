"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CheckoutState = { success?: boolean; code?: string; message?: string };

const checkoutSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().regex(/^[0-9+ .()-]{8,20}$/),
  email: z.string().trim().email().or(z.literal("")),
  city: z.string().trim().min(2),
  district: z.string().trim().min(2),
  ward: z.string().trim().min(2),
  address: z.string().trim().min(3),
  note: z.string().trim().max(1000),
  paymentMethod: z.string().trim().min(1),
  installation: z.boolean(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(99) })).min(1),
});

function orderCode() {
  return `DMH-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function createOrder(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { success: false, message: "Giỏ hàng không hợp lệ. Vui lòng tải lại trang." };
  }

  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"), phone: formData.get("phone"), email: formData.get("email") ?? "",
    city: formData.get("city"), district: formData.get("district"), ward: formData.get("ward"),
    address: formData.get("address"), note: formData.get("note") ?? "",
    paymentMethod: formData.get("paymentMethod"), installation: formData.get("installation") === "on",
    items: rawItems,
  });
  if (!parsed.success) return { success: false, message: "Vui lòng nhập đầy đủ và kiểm tra lại thông tin nhận hàng." };

  try {
    const user = await getCurrentUser();
    const quantities = new Map<string, number>();
    for (const item of parsed.data.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    const requestedItems = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
    if (requestedItems.some(item => item.quantity > 99)) return { success: false, message: "Số lượng của một sản phẩm không được vượt quá 99." };
    const fullAddress = `${parsed.data.address}, ${parsed.data.ward}, ${parsed.data.district}, ${parsed.data.city}`;

    const code = await prisma.$transaction(async tx => {
      const products = await tx.product.findMany({
        where: { id: { in: requestedItems.map(item => item.productId) }, visible: true },
        select: { id: true, name: true, salePrice: true, price: true, stock: true },
      });
      if (products.length !== requestedItems.length) throw new Error("PRODUCT_UNAVAILABLE");
      const byId = new Map(products.map(product => [product.id, product]));
      const items = requestedItems.map(item => ({ ...item, product: byId.get(item.productId)! }));
      const total = items.reduce((sum, item) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity, 0);

      const existingCustomer = await tx.customer.findFirst({ where: { phone: parsed.data.phone }, select: { id: true } });
      const customer = existingCustomer
        ? await tx.customer.update({ where: { id: existingCustomer.id }, data: { name: parsed.data.name, email: parsed.data.email || null } })
        : await tx.customer.create({ data: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || null } });
      const code = orderCode();
      const order = await tx.order.create({ data: {
        code, customerId: customer.id, userId: user?.id, total, address: fullAddress,
        note: parsed.data.note || null, paymentMethod: parsed.data.paymentMethod,
        installation: parsed.data.installation,
        items: { create: items.map(item => ({ productId: item.product.id, productName: item.product.name, quantity: item.quantity, unitPrice: item.product.salePrice ?? item.product.price })) },
        statusEvents: { create: { toStatus: "PENDING", actorId: user?.id, note: "Đơn hàng được tạo và giữ tồn kho." } },
      } });

      for (const item of items) {
        const reserved = await tx.product.updateMany({
          where: { id: item.product.id, visible: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) throw new Error("INSUFFICIENT_STOCK");
        const current = await tx.product.findUniqueOrThrow({ where: { id: item.product.id }, select: { stock: true } });
        await tx.inventoryMovement.create({ data: {
          productId: item.product.id, orderId: order.id, actorId: user?.id,
          type: "ORDER_RESERVED", quantity: -item.quantity, stockAfter: current.stock,
          note: `Giữ hàng cho đơn ${code}`,
        } });
      }
      const admins = await tx.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      if (admins.length) await tx.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          orderId: order.id,
          title: "Có đơn hàng mới cần xác nhận",
          message: `Khách hàng ${parsed.data.name} vừa đặt đơn ${code}. Nhấn để xem và xác nhận đơn hàng.`,
        })),
      });
      return code;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/", "layout");
    return { success: true, code };
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_UNAVAILABLE") return { success: false, message: "Một số sản phẩm không còn bán. Vui lòng cập nhật lại giỏ hàng." };
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") return { success: false, message: "Một sản phẩm vừa hết hoặc không còn đủ số lượng. Vui lòng cập nhật lại giỏ hàng." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return { success: false, message: "Tồn kho vừa thay đổi do có đơn khác. Vui lòng thử đặt hàng lại." };
    console.error("Create order failed:", error);
    return { success: false, message: "Không thể tạo đơn hàng lúc này. Vui lòng thử lại hoặc gọi hotline." };
  }
}
