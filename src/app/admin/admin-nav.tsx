"use client";
import Link from "next/link";
import { FolderTree, LayoutDashboard, PackageCheck, PackageOpen, Users } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: PackageCheck },
  { href: "/admin/khach-hang", label: "Khách hàng", icon: Users },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: PackageOpen },
  { href: "/admin/danh-muc", label: "Danh mục", icon: FolderTree },
];
export default function AdminNav() {
  const pathname = usePathname();
  return <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Chức năng quản trị">{links.map(link => { const Icon = link.icon; const active = pathname === link.href; return <Link href={link.href} key={link.href} className={`btn shrink-0 border text-sm ${active ? "border-[#18181b] bg-[#18181b] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"}`}><Icon size={17}/>{link.label}</Link>; })}</nav>;
}
