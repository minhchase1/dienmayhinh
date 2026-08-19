"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CustomerActionState = { success?: boolean; message?: string };

const blockSchema = z.object({
  userId: z.string().cuid(),
  blocked: z.boolean(),
  reason: z.string().trim().max(300),
});

export async function setCustomerBlocked(
  userId: string,
  blocked: boolean,
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") return { success: false, message: "Bạn không có quyền quản lý tài khoản." };

  const parsed = blockSchema.safeParse({ userId, blocked, reason: formData.get("reason") ?? "" });
  if (!parsed.success) return { success: false, message: "Dữ liệu không hợp lệ." };
  if (blocked && parsed.data.reason.length < 3) return { success: false, message: "Vui lòng nhập lý do khóa tài khoản." };

  try {
    await prisma.$transaction(async tx => {
      const customer = await tx.user.findFirst({ where: { id: userId, role: "CUSTOMER" }, select: { id: true } });
      if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
      await tx.user.update({
        where: { id: customer.id },
        data: blocked
          ? { isBlocked: true, blockedAt: new Date(), blockedReason: parsed.data.reason }
          : { isBlocked: false, blockedAt: null, blockedReason: null },
      });
      if (blocked) await tx.session.deleteMany({ where: { userId: customer.id } });
    });
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { success: true, message: blocked ? "Đã khóa tài khoản và thu hồi các phiên đăng nhập." : "Đã mở khóa tài khoản." };
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") return { success: false, message: "Không tìm thấy tài khoản khách hàng." };
    console.error("Set customer blocked failed:", error);
    return { success: false, message: "Không thể cập nhật tài khoản lúc này." };
  }
}
