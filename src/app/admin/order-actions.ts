"use server";

import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentMethods } from "@/lib/payments";

export type OrderActionState = { success?: boolean; message?: string };

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  SHIPPING: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  COMPLETED: [], CANCELLED: [],
};
const labels: Record<OrderStatus, string> = {
  PENDING: "chờ xác nhận", CONFIRMED: "đã xác nhận", PREPARING: "đang chuẩn bị",
  SHIPPING: "đang giao", COMPLETED: "hoàn tất", CANCELLED: "đã hủy",
};

export async function updateOrderStatus(orderId: string, status: OrderStatus, _state: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") return { success: false, message: "Bạn không có quyền cập nhật đơn hàng." };
  const parsed = z.object({ orderId: z.string().cuid(), status: z.nativeEnum(OrderStatus), reason: z.string().trim().max(500) }).safeParse({ orderId, status, reason: formData.get("reason") ?? "" });
  if (!parsed.success) return { success: false, message: "Dữ liệu cập nhật không hợp lệ." };
  if (status === OrderStatus.CANCELLED && parsed.data.reason.length < 3) return { success: false, message: "Vui lòng nhập lý do hủy đơn." };

  try {
    await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { code: true, status: true, userId: true, total: true, paymentMethod: true, paymentStatus: true, paymentRequired: true, items: { select: { productId: true, quantity: true } } },
      });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (!transitions[order.status].includes(status)) throw new Error("INVALID_TRANSITION");
      if (status === OrderStatus.CONFIRMED && order.paymentMethod !== paymentMethods.PAY_AT_STORE && Number(order.paymentRequired) > 0 && order.paymentStatus === PaymentStatus.PENDING) throw new Error("PAYMENT_REQUIRED");

      const changed = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status, ...(status === OrderStatus.CANCELLED ? { cancelledAt: new Date(), cancellationReason: parsed.data.reason } : {}), ...(status === OrderStatus.COMPLETED ? { paidAmount: order.total, paymentStatus: PaymentStatus.PAID, paidAt: new Date() } : {}) },
      });
      if (changed.count !== 1) throw new Error("ORDER_CHANGED");

      if (status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (!item.productId) continue;
          const product = await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } }, select: { stock: true } });
          await tx.inventoryMovement.create({ data: { productId: item.productId, orderId, actorId: admin.id, type: "ORDER_CANCELLED", quantity: item.quantity, stockAfter: product.stock, note: `Hoàn kho do hủy đơn ${order.code}` } });
        }
      }

      await tx.orderStatusEvent.create({ data: { orderId, actorId: admin.id, fromStatus: order.status, toStatus: status, note: parsed.data.reason || null } });
      if (order.userId) await tx.notification.create({ data: {
        userId: order.userId, orderId,
        title: status === OrderStatus.CANCELLED ? "Đơn hàng đã bị hủy" : `Đơn hàng chuyển sang ${labels[status]}`,
        message: status === OrderStatus.CANCELLED ? `Đơn ${order.code} đã hủy. Lý do: ${parsed.data.reason}` : `Đơn ${order.code} hiện ${labels[status]}.`,
      } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/admin"); revalidatePath("/tra-cuu"); revalidatePath("/tai-khoan"); revalidatePath("/", "layout");
    return { success: true, message: status === OrderStatus.CANCELLED ? "Đã hủy đơn và hoàn lại tồn kho." : `Đã chuyển đơn sang ${labels[status]}.` };
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return { success: false, message: "Đơn hàng không còn tồn tại." };
    if (error instanceof Error && error.message === "INVALID_TRANSITION") return { success: false, message: "Không thể chuyển đơn sang trạng thái này." };
    if (error instanceof Error && error.message === "PAYMENT_REQUIRED") return { success: false, message: "Chưa thể xác nhận: đơn này chưa nhận đủ tiền cọc/thanh toán." };
    if (error instanceof Error && error.message === "ORDER_CHANGED") return { success: false, message: "Đơn vừa được người khác cập nhật. Vui lòng tải lại trang." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return { success: false, message: "Dữ liệu vừa thay đổi. Vui lòng thử lại." };
    console.error("Update order status failed:", error);
    return { success: false, message: "Không thể cập nhật đơn hàng. Vui lòng thử lại." };
  }
}

export async function confirmOrderPayment(orderId: string, _state: OrderActionState): Promise<OrderActionState> {
  void _state;
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") return { success: false, message: "Bạn không có quyền xác nhận thanh toán." };
  const parsed = z.string().cuid().safeParse(orderId);
  if (!parsed.success) return { success: false, message: "Đơn hàng không hợp lệ." };
  try {
    await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { code: true, total: true, paymentRequired: true, paymentStatus: true, userId: true } });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.paymentStatus !== PaymentStatus.PENDING || Number(order.paymentRequired) <= 0) throw new Error("PAYMENT_CHANGED");
      const required = Number(order.paymentRequired);
      const status = required >= Number(order.total) ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
      const changed = await tx.order.updateMany({ where: { id: orderId, paymentStatus: PaymentStatus.PENDING }, data: { paidAmount: order.paymentRequired, paymentStatus: status, paidAt: new Date() } });
      if (changed.count !== 1) throw new Error("PAYMENT_CHANGED");
      if (order.userId) await tx.notification.create({ data: { userId: order.userId, orderId, title: "Đã nhận thanh toán", message: `Cửa hàng đã nhận ${required.toLocaleString("vi-VN")}đ cho đơn ${order.code}.` } });
    });
    revalidatePath("/admin"); revalidatePath("/tra-cuu"); revalidatePath("/tai-khoan");
    return { success: true, message: "Đã xác nhận nhận tiền. Đơn hàng có thể được xác nhận xử lý." };
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return { success: false, message: "Đơn hàng không còn tồn tại." };
    if (error instanceof Error && error.message === "PAYMENT_CHANGED") return { success: false, message: "Thanh toán đã được cập nhật trước đó. Vui lòng tải lại trang." };
    console.error("Confirm payment failed:", error);
    return { success: false, message: "Không thể xác nhận thanh toán. Vui lòng thử lại." };
  }
}
