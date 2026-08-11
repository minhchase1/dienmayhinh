"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { products as sampleProducts } from "@/lib/data";

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
  return `DMH${Date.now().toString().slice(-6)}${randomInt(10, 100)}`;
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
    const productIds = [...new Set(parsed.data.items.map(item => item.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, visible: true }, select: { id: true, name: true, salePrice: true, price: true, stock: true } });
    const byId = new Map<string, { databaseId: string | null; name: string; salePrice: number; stock: number }>();
    products.forEach(product => byId.set(product.id, { databaseId: product.id, name: product.name, salePrice: Number(product.salePrice ?? product.price), stock: product.stock }));
    sampleProducts.forEach(product => { const id = String(product.id); if (!byId.has(id)) byId.set(id, { databaseId: null, name: product.name, salePrice: product.salePrice, stock: product.stock }); });
    if (productIds.some(id => !byId.has(id))) return { success: false, message: "Một số sản phẩm không còn bán. Vui lòng cập nhật lại giỏ hàng." };
    const items = parsed.data.items.map(item => ({ ...item, product: byId.get(item.productId)! }));
    if (items.some(item => item.quantity > item.product.stock)) return { success: false, message: "Số lượng đặt vượt quá tồn kho của một sản phẩm." };
    const total = items.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
    const fullAddress = `${parsed.data.address}, ${parsed.data.ward}, ${parsed.data.district}, ${parsed.data.city}`;

    const code = await prisma.$transaction(async tx => {
      const existingCustomer = await tx.customer.findFirst({ where: { phone: parsed.data.phone }, select: { id: true } });
      const customer = existingCustomer
        ? await tx.customer.update({ where: { id: existingCustomer.id }, data: { name: parsed.data.name, email: parsed.data.email || null } })
        : await tx.customer.create({ data: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || null } });
      const code = orderCode();
      const order = await tx.order.create({ data: {
        code, customerId: customer.id, userId: user?.id, total, address: fullAddress,
        note: parsed.data.note || null, paymentMethod: parsed.data.paymentMethod,
        installation: parsed.data.installation,
        items: { create: items.map(item => ({ productId: item.product.databaseId, productName: item.product.name, quantity: item.quantity, unitPrice: item.product.salePrice })) },
      } });
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
    });
    revalidatePath("/", "layout");
    return { success: true, code };
  } catch (error) {
    console.error("Create order failed:", error);
    return { success: false, message: "Không thể tạo đơn hàng lúc này. Vui lòng thử lại hoặc gọi hotline." };
  }
}
