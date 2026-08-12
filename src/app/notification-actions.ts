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

export async function deleteAllNotifications() {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  revalidatePath("/", "layout");
}

export async function openOrderNotification(notificationId: string, orderId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId: user.id, orderId }, select: { order: { select: { code: true } } } });
  if (!notification?.order) redirect("/tra-cuu");
  await prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
  redirect(`/tra-cuu?q=${encodeURIComponent(notification.order.code)}`);
}
