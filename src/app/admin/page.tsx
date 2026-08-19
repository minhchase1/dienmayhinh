import type { Metadata } from "next";
import Link from "next/link";
import { FolderTree, PackageCheck, PackageOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tổng quan quản trị" };
export const dynamic = "force-dynamic";

const items = [
  { href: "/admin/don-hang", label: "Quản lý đơn hàng", description: "Xác nhận thanh toán và cập nhật trạng thái đơn.", icon: PackageCheck, key: "orders" },
  { href: "/admin/khach-hang", label: "Quản lý khách hàng", description: "Tra cứu, khóa và mở khóa tài khoản khách.", icon: Users, key: "customers" },
  { href: "/admin/san-pham", label: "Quản lý sản phẩm", description: "Thêm, chỉnh sửa, hiển thị và quản lý tồn kho.", icon: PackageOpen, key: "products" },
  { href: "/admin/danh-muc", label: "Quản lý danh mục", description: "Tổ chức các nhóm sản phẩm của cửa hàng.", icon: FolderTree, key: "categories" },
] as const;

export default async function AdminPage() {
  const [orders, customers, products, categories] = await Promise.all([
    prisma.order.count({ where: { OR: [{ paymentRequired: { lte: 0 } }, { paymentStatus: { not: "PENDING" } }] } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }), prisma.product.count(), prisma.category.count(),
  ]);
  const counts = { orders, customers, products, categories };
  return <><div className="mb-7"><h1 className="text-3xl font-black">Tổng quan quản trị</h1><p className="mt-2 text-gray-500">Chọn chức năng bạn muốn quản lý.</p></div><div className="grid gap-5 sm:grid-cols-2">{items.map(item => { const Icon = item.icon; return <Link href={item.href} key={item.href} className="card group p-6 transition hover:-translate-y-1 hover:border-zinc-400 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-content-center rounded-xl bg-zinc-100 group-hover:bg-[#18181b] group-hover:text-white"><Icon size={25}/></span><b className="text-2xl">{counts[item.key]}</b></div><h2 className="mt-5 text-xl font-bold">{item.label}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p></Link>; })}</div></>;
}
