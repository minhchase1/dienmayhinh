"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}

export async function openAdminOrderNotification(notificationId: string, orderId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  await prisma.notification.updateMany({ where: { id: notificationId, userId: user.id, orderId }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
  redirect("/admin#orders");
}
