"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/lib/data";
import { createOrder, type CheckoutState } from "./actions";

export type SavedAddress = { id: string; label: string; recipientName: string; phone: string; city: string; district: string; ward: string; address: string; isDefault: boolean };
type Receiver = { name: string; phone: string; email: string; city: string; district: string; ward: string; address: string };
const initialState: CheckoutState = {};

export default function CheckoutForm({ user, addresses }: { user: { name: string; email: string } | null; addresses: SavedAddress[] }) {
  const { items, clear } = useCart();
  const [state, action, pending] = useActionState(createOrder, initialState);
  const clearedCode = useRef<string | undefined>(undefined);
  const initialAddress = addresses.find(item => item.isDefault) ?? addresses[0];
  const [selectedId, setSelectedId] = useState(initialAddress?.id ?? "");
  const [receiver, setReceiver] = useState<Receiver>({ name: initialAddress?.recipientName ?? user?.name ?? "", phone: initialAddress?.phone ?? "", email: user?.email ?? "", city: initialAddress?.city ?? "", district: initialAddress?.district ?? "", ward: initialAddress?.ward ?? "", address: initialAddress?.address ?? "" });
  const total = items.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  useEffect(() => { if (state.success && state.code && clearedCode.current !== state.code) { clearedCode.current = state.code; clear(); } }, [state.success, state.code, clear]);
  function chooseAddress(id: string) { setSelectedId(id); const address = addresses.find(item => item.id === id); if (address) setReceiver(current => ({ ...current, name: address.recipientName, phone: address.phone, city: address.city, district: address.district, ward: address.ward, address: address.address })); }
  function field(name: keyof Receiver, value: string) { setReceiver(current => ({ ...current, [name]: value })); }

  if (state.success && state.code) return <main className="container py-20"><div className="card mx-auto max-w-xl p-10 text-center"><div className="text-6xl">✅</div><h1 className="mt-5 text-3xl font-black">Đặt hàng thành công!</h1><p className="mt-3">Mã đơn hàng của bạn</p><b className="mt-2 block text-2xl text-[#18181b]">{state.code}</b><p className="mt-4 text-gray-500">Cửa hàng sẽ xác nhận trong thời gian sớm nhất. Bạn có thể theo dõi đơn trong phần tài khoản hoặc qua biểu tượng thông báo.</p><div className="mt-6 flex flex-wrap justify-center gap-3">{user && <Link href="/tai-khoan" className="btn btn-primary">Xem lịch sử đơn hàng</Link>}<a href="tel:0914845274" className="btn btn-blue">Gọi xác nhận: 0914 845 274</a></div></div></main>;

  return <main className="container py-8"><h1 className="text-3xl font-black">Thông tin đặt hàng</h1>
    <form action={action} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="items" value={JSON.stringify(items.map(item => ({ productId: String(item.product.id), quantity: item.quantity })))}/>
      <section className="card p-6"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">Thông tin người nhận</h2>{user && <Link href="/tai-khoan" className="text-sm font-bold hover:underline">Quản lý địa chỉ</Link>}</div>
        {addresses.length > 0 && <label className="mt-5 block"><span className="text-sm font-semibold">Chọn địa chỉ đã lưu</span><select value={selectedId} onChange={event => chooseAddress(event.target.value)} className="mt-1 w-full rounded-lg border bg-white p-3"><option value="">Nhập địa chỉ khác</option>{addresses.map(item => <option value={item.id} key={item.id}>{item.label}{item.isDefault ? " (Mặc định)" : ""} — {item.recipientName}, {item.phone}</option>)}</select></label>}
        {!user && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><Link href="/dang-nhap?next=/dat-hang" className="font-bold underline">Đăng nhập</Link> để tự điền thông tin và lưu lịch sử mua hàng.</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Họ và tên *" name="name" value={receiver.name} onChange={value => field("name", value)}/><Field label="Số điện thoại *" name="phone" type="tel" value={receiver.phone} onChange={value => field("phone", value)}/><Field label="Email" name="email" type="email" required={false} value={receiver.email} onChange={value => field("email", value)}/><Field label="Tỉnh / Thành phố *" name="city" value={receiver.city} onChange={value => field("city", value)}/><Field label="Quận / Huyện *" name="district" value={receiver.district} onChange={value => field("district", value)}/><Field label="Phường / Xã *" name="ward" value={receiver.ward} onChange={value => field("ward", value)}/></div>
        <Field label="Địa chỉ chi tiết *" name="address" className="mt-4" value={receiver.address} onChange={value => field("address", value)}/><label className="mt-4 block"><span className="text-sm font-semibold">Ghi chú đơn hàng</span><textarea name="note" className="mt-1 w-full rounded-lg border p-3" rows={3}/></label><label className="mt-4 flex gap-2"><input type="checkbox" name="installation"/> Tôi cần hỗ trợ lắp đặt</label>
        <h2 className="mt-7 text-xl font-bold">Phương thức thanh toán</h2>{["Thanh toán khi nhận hàng", "Chuyển khoản ngân hàng", "Thanh toán tại cửa hàng"].map((method, index) => <label className="mt-3 flex gap-3 rounded-lg border p-4" key={method}><input required type="radio" name="paymentMethod" value={method} defaultChecked={index === 0}/>{method}</label>)}
      </section>
      <aside className="card h-fit p-5"><h2 className="text-xl font-bold">Đơn hàng ({items.length})</h2>{items.map(item => <div className="flex justify-between border-b py-3 text-sm" key={item.product.id}><span>{item.product.name} × {item.quantity}</span><b>{money(item.product.salePrice * item.quantity)}</b></div>)}<div className="mt-5 flex justify-between text-xl"><b>Tổng tiền</b><strong className="text-red-600">{money(total)}</strong></div>{state.message && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}<button disabled={!items.length || pending} className="btn mt-5 w-full bg-red-600 text-white disabled:opacity-50">{pending ? "Đang tạo đơn..." : "Đặt hàng"}</button><p className="mt-3 text-xs text-gray-500">Bằng việc đặt hàng, bạn đồng ý với chính sách mua hàng của Điện máy Hinh.</p></aside>
    </form>
  </main>;
}

function Field({ label, name, value, onChange, type = "text", required = true, className = "" }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; className?: string }) { return <label className={`block ${className}`}><span className="text-sm font-semibold">{label}</span><input name={name} value={value} onChange={event => onChange(event.target.value)} required={required} type={type} className="mt-1 w-full rounded-lg border p-3"/></label>; }
