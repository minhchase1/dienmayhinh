"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AccountState = { success?: boolean; message?: string };
const phone = z.string().trim().regex(/^[0-9+ .()-]{8,20}$/, "Số điện thoại không hợp lệ.");
const addressSchema = z.object({
  label: z.string().trim().min(2).max(40), recipientName: z.string().trim().min(2).max(80), phone,
  city: z.string().trim().min(2).max(80), district: z.string().trim().min(2).max(80),
  ward: z.string().trim().min(2).max(80), address: z.string().trim().min(3).max(200), isDefault: z.boolean(),
});

export async function updateProfile(_state: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Vui lòng đăng nhập lại." };
  const result = z.object({ name: z.string().trim().min(2).max(80) }).safeParse({ name: formData.get("name") });
  if (!result.success) return { message: "Họ tên phải có ít nhất 2 ký tự." };
  await prisma.user.update({ where: { id: user.id }, data: { name: result.data.name } });
  revalidatePath("/", "layout"); revalidatePath("/tai-khoan");
  return { success: true, message: "Đã cập nhật hồ sơ." };
}

export async function saveAddress(_state: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Vui lòng đăng nhập lại." };
  const result = addressSchema.safeParse({ label: formData.get("label"), recipientName: formData.get("recipientName"), phone: formData.get("phone"), city: formData.get("city"), district: formData.get("district"), ward: formData.get("ward"), address: formData.get("address"), isDefault: formData.get("isDefault") === "on" });
  if (!result.success) return { message: "Vui lòng nhập đầy đủ và kiểm tra lại thông tin địa chỉ." };
  const addressId = String(formData.get("addressId") ?? "");
  const count = await prisma.userAddress.count({ where: { userId: user.id } });
  await prisma.$transaction(async tx => {
    if (result.data.isDefault || count === 0) await tx.userAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (addressId) {
      await tx.userAddress.updateMany({ where: { id: addressId, userId: user.id }, data: result.data });
    } else {
      await tx.userAddress.create({ data: { ...result.data, isDefault: result.data.isDefault || count === 0, userId: user.id } });
    }
  });
  revalidatePath("/tai-khoan"); revalidatePath("/dat-hang");
  return { success: true, message: addressId ? "Đã cập nhật địa chỉ." : "Đã lưu địa chỉ mới." };
}

export async function setDefaultAddress(addressId: string) {
  const user = await getCurrentUser(); if (!user) return;
  await prisma.$transaction(async tx => {
    await tx.userAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    await tx.userAddress.updateMany({ where: { id: addressId, userId: user.id }, data: { isDefault: true } });
  });
  revalidatePath("/tai-khoan"); revalidatePath("/dat-hang");
}

export async function deleteAddress(addressId: string) {
  const user = await getCurrentUser(); if (!user) return;
  const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId: user.id }, select: { isDefault: true } });
  if (!address) return;
  await prisma.userAddress.delete({ where: { id: addressId } });
  if (address.isDefault) { const next = await prisma.userAddress.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }); if (next) await prisma.userAddress.update({ where: { id: next.id }, data: { isDefault: true } }); }
  revalidatePath("/tai-khoan"); revalidatePath("/dat-hang");
}
