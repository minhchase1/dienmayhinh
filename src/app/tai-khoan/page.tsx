import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Package, Star, Trash2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { money } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AddressForm, ProfileForm } from "./account-forms";
import { deleteAddress, setDefaultAddress } from "./actions";

const statuses = { PENDING: "Chờ xác nhận", CONFIRMED: "Đã nhận đơn", PREPARING: "Đang chuẩn bị", SHIPPING: "Sắp giao", COMPLETED: "Đã giao", CANCELLED: "Đã hủy" } as const;
export default async function AccountPage() {
  const current = await getCurrentUser(); if (!current) redirect("/dang-nhap?next=/tai-khoan");
  const user = await prisma.user.findUnique({ where: { id: current.id }, select: { name: true, email: true, addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }, orders: { orderBy: { createdAt: "desc" }, select: { id: true, code: true, status: true, total: true, createdAt: true, _count: { select: { items: true } } } } } });
  if (!user) redirect("/dang-nhap");
  return <main className="container py-10"><h1 className="text-3xl font-black">Tài khoản của tôi</h1><p className="mt-1 text-gray-500">Quản lý hồ sơ, địa chỉ nhận hàng và các đơn đã mua.</p>
    <div className="mt-6 grid gap-6"><ProfileForm name={user.name} email={user.email}/><section><div className="mb-3 flex items-center gap-2"><MapPin/><h2 className="text-xl font-bold">Địa chỉ đã lưu ({user.addresses.length})</h2></div><div className="grid gap-3 md:grid-cols-2">{user.addresses.map(address => <article className="card p-5" key={address.id}><div className="flex justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><b>{address.label}</b>{address.isDefault && <span className="rounded-full bg-[#ffd21c] px-2 py-0.5 text-xs font-bold">Mặc định</span>}</div><p className="mt-2 font-semibold">{address.recipientName} · {address.phone}</p><p className="mt-1 text-sm text-gray-600">{address.address}, {address.ward}, {address.district}, {address.city}</p></div><form action={deleteAddress.bind(null, address.id)}><button aria-label="Xóa địa chỉ" className="text-gray-400 hover:text-red-600"><Trash2 size={18}/></button></form></div>{!address.isDefault && <form action={setDefaultAddress.bind(null, address.id)} className="mt-3"><button className="text-sm font-bold hover:underline"><Star className="mr-1 inline" size={15}/>Đặt làm mặc định</button></form>}<details className="mt-3"><summary className="cursor-pointer text-sm font-bold">Chỉnh sửa</summary><AddressForm address={address}/></details></article>)}{!user.addresses.length && <p className="card p-6 text-sm text-gray-500">Bạn chưa lưu địa chỉ nhận hàng.</p>}</div></section><AddressForm/>
      <section><div className="mb-3 flex items-center gap-2"><Package/><h2 className="text-xl font-bold">Lịch sử mua hàng ({user.orders.length})</h2></div><div className="card overflow-hidden">{user.orders.map(order => <Link href={`/tra-cuu?q=${encodeURIComponent(order.code)}`} className="flex flex-col justify-between gap-3 border-b p-5 last:border-0 hover:bg-gray-50 sm:flex-row sm:items-center" key={order.id}><div><b>{order.code}</b><p className="mt-1 text-sm text-gray-500">{order._count.items} sản phẩm · {order.createdAt.toLocaleString("vi-VN")}</p></div><div className="sm:text-right"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold">{statuses[order.status]}</span><strong className="mt-2 block text-red-600">{money(Number(order.total))}</strong></div></Link>)}{!user.orders.length && <p className="p-8 text-center text-gray-500">Bạn chưa có đơn hàng nào trong tài khoản này.</p>}</div></section>
    </div></main>;
}
