"use server";

import { OrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        select: { code: true, status: true, userId: true, items: { select: { productId: true, quantity: true } } },
      });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (!transitions[order.status].includes(status)) throw new Error("INVALID_TRANSITION");

      const changed = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status, ...(status === OrderStatus.CANCELLED ? { cancelledAt: new Date(), cancellationReason: parsed.data.reason } : {}) },
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
    if (error instanceof Error && error.message === "ORDER_CHANGED") return { success: false, message: "Đơn vừa được người khác cập nhật. Vui lòng tải lại trang." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return { success: false, message: "Dữ liệu vừa thay đổi. Vui lòng thử lại." };
    console.error("Update order status failed:", error);
    return { success: false, message: "Không thể cập nhật đơn hàng. Vui lòng thử lại." };
  }
}
