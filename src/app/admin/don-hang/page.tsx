import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import OrderManager from "../order-manager";
export const metadata: Metadata = { title: "Quản lý đơn hàng" };
export const dynamic = "force-dynamic";
export default async function OrdersPage() {
  const orders = await prisma.order.findMany({ where: { OR: [{ paymentRequired: { lte: 0 } }, { paymentStatus: { not: "PENDING" } }] }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, code: true, status: true, total: true, address: true, createdAt: true, paymentMethod: true, paymentStatus: true, paymentRequired: true, paidAmount: true, paymentReference: true, customer: { select: { name: true, phone: true } }, _count: { select: { items: true } } } });
  return <OrderManager orders={orders.map(order => ({ id: order.id, code: order.code, status: order.status, total: Number(order.total), address: order.address, createdAt: order.createdAt.toISOString(), paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, paymentRequired: Number(order.paymentRequired), paidAmount: Number(order.paidAmount), paymentReference: order.paymentReference, customer: order.customer, itemCount: order._count.items }))}/>;
}
