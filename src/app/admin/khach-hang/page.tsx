import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CustomerManager from "../customer-manager";
export const metadata: Metadata = { title: "Quản lý khách hàng" };
export const dynamic = "force-dynamic";
export default async function CustomersPage() {
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, createdAt: true, isBlocked: true, blockedAt: true, blockedReason: true, _count: { select: { orders: true } } } });
  return <CustomerManager customers={customers.map(customer => ({ id: customer.id, name: customer.name, email: customer.email, createdAt: customer.createdAt.toISOString(), isBlocked: customer.isBlocked, blockedAt: customer.blockedAt?.toISOString() ?? null, blockedReason: customer.blockedReason, orderCount: customer._count.orders }))}/>;
}
