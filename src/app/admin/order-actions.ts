"use server";

import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OrderActionState = { success?: boolean; message?: string };

const notices: Partial<Record<OrderStatus, { title: string; message: (code: string) => string }>> = {
  CONFIRMED: { title: "Đơn hàng đã được xác nhận", message: code => `Cửa hàng đã nhận và xác nhận đơn ${code}. Chúng tôi đang chuẩn bị hàng cho bạn.` },
  SHIPPING: { title: "Đơn hàng sắp được giao", message: code => `Đơn ${code} đã sẵn sàng và sắp được giao. Vui lòng chú ý điện thoại của người giao hàng.` },
};

export async function updateOrderStatus(orderId: string, status: OrderStatus, _state: OrderActionState, _formData: FormData): Promise<OrderActionState> {
  try {
    void _state;
    void _formData;
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") return { success: false, message: "Bạn không có quyền cập nhật đơn hàng." };
    if (status !== OrderStatus.CONFIRMED && status !== OrderStatus.SHIPPING) return { success: false, message: "Trạng thái không hợp lệ." };

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { code: true, status: true, userId: true } });
    if (!order) return { success: false, message: "Đơn hàng không còn tồn tại." };
    const allowed = status === OrderStatus.CONFIRMED
      ? order.status === OrderStatus.PENDING
      : order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING;
    if (!allowed) return { success: false, message: "Đơn hàng không thể chuyển sang trạng thái này." };

    await prisma.$transaction(async tx => {
      await tx.order.update({ where: { id: orderId }, data: { status } });
      const notice = notices[status];
      if (order.userId && notice) await tx.notification.create({ data: { userId: order.userId, orderId, title: notice.title, message: notice.message(order.code) } });
    });
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { success: true, message: status === OrderStatus.CONFIRMED ? "Đã xác nhận nhận đơn và thông báo cho khách." : "Đã báo đơn sắp giao cho khách." };
  } catch (error) {
    console.error("Update order status failed:", error);
    return { success: false, message: "Không thể cập nhật đơn hàng. Vui lòng thử lại." };
  }
}
