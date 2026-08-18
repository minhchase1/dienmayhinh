"use client";

/* eslint-disable @next/next/no-img-element -- VietQR is generated dynamically by the bank/account configuration. */

import Link from "next/link";
import { BadgeCheck, Check, Clock3, History, Phone, ShoppingBag } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/lib/data";
import { checkPaymentStatus, createOrder, type CheckoutState } from "./actions";
import { paymentMethodLabels, paymentMethods, type PaymentMethod } from "@/lib/payments";

export type SavedAddress = { id: string; label: string; recipientName: string; phone: string; city: string; district: string; ward: string; address: string; isDefault: boolean };
type Receiver = { name: string; phone: string; email: string; city: string; district: string; ward: string; address: string };
const initialState: CheckoutState = {};

export default function CheckoutForm({ user, addresses, bankTransferAvailable }: { user: { name: string; email: string } | null; addresses: SavedAddress[]; bankTransferAvailable: boolean }) {
  const { items, clear } = useCart();
  const [state, action, pending] = useActionState(createOrder, initialState);
  const clearedCode = useRef<string | undefined>(undefined);
  const initialAddress = addresses.find(item => item.isDefault) ?? addresses[0];
  const [selectedId, setSelectedId] = useState(initialAddress?.id ?? "");
  const [receiver, setReceiver] = useState<Receiver>({ name: initialAddress?.recipientName ?? user?.name ?? "", phone: initialAddress?.phone ?? "", email: user?.email ?? "", city: initialAddress?.city ?? "", district: initialAddress?.district ?? "", ward: initialAddress?.ward ?? "", address: initialAddress?.address ?? "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(bankTransferAvailable ? paymentMethods.COD : paymentMethods.PAY_AT_STORE);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const total = items.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  useEffect(() => { if (state.success && state.code && clearedCode.current !== state.code) { clearedCode.current = state.code; clear(); } }, [state.success, state.code, clear]);
  useEffect(() => {
    if (!state.success || !state.code || !state.paymentRequired || !state.paymentStatusToken || paymentConfirmed) return;
    let active = true;
    async function refreshPayment() {
      const result = await checkPaymentStatus(state.code!, state.paymentStatusToken!);
      if (active && result.paid) setPaymentConfirmed(true);
    }
    void refreshPayment();
    const timer = window.setInterval(() => void refreshPayment(), 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [state.success, state.code, state.paymentRequired, state.paymentStatusToken, paymentConfirmed]);
  function chooseAddress(id: string) { setSelectedId(id); const address = addresses.find(item => item.id === id); if (address) setReceiver(current => ({ ...current, name: address.recipientName, phone: address.phone, city: address.city, district: address.district, ward: address.ward, address: address.address })); }
  function field(name: keyof Receiver, value: string) { setReceiver(current => ({ ...current, [name]: value })); }

  if (state.success && state.code) return <OrderSuccess state={state} paymentConfirmed={paymentConfirmed} signedIn={Boolean(user)} />;

  return <main className="container py-5 sm:py-8"><h1 className="text-2xl font-black sm:text-3xl">Thông tin đặt hàng</h1>
    <form action={action} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="items" value={JSON.stringify(items.map(item => ({ productId: String(item.product.id), quantity: item.quantity })))}/>
      <section className="card p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">Thông tin người nhận</h2>{user && <Link href="/tai-khoan" className="text-sm font-bold hover:underline">Quản lý địa chỉ</Link>}</div>
        {addresses.length > 0 && <label className="mt-5 block"><span className="text-sm font-semibold">Chọn địa chỉ đã lưu</span><select value={selectedId} onChange={event => chooseAddress(event.target.value)} className="mt-1 w-full rounded-lg border bg-white p-3"><option value="">Nhập địa chỉ khác</option>{addresses.map(item => <option value={item.id} key={item.id}>{item.label}{item.isDefault ? " (Mặc định)" : ""} — {item.recipientName}, {item.phone}</option>)}</select></label>}
        {!user && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><Link href="/dang-nhap?next=/dat-hang" className="font-bold underline">Đăng nhập</Link> để tự điền thông tin và lưu lịch sử mua hàng.</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Họ và tên *" name="name" value={receiver.name} onChange={value => field("name", value)}/><Field label="Số điện thoại *" name="phone" type="tel" value={receiver.phone} onChange={value => field("phone", value)}/><Field label="Email" name="email" type="email" required={false} value={receiver.email} onChange={value => field("email", value)}/><Field label="Tỉnh / Thành phố *" name="city" value={receiver.city} onChange={value => field("city", value)}/><Field label="Quận / Huyện *" name="district" value={receiver.district} onChange={value => field("district", value)}/><Field label="Phường / Xã *" name="ward" value={receiver.ward} onChange={value => field("ward", value)}/></div>
        <Field label="Địa chỉ chi tiết *" name="address" className="mt-4" value={receiver.address} onChange={value => field("address", value)}/><label className="mt-4 block"><span className="text-sm font-semibold">Ghi chú đơn hàng</span><textarea name="note" className="mt-1 w-full rounded-lg border p-3" rows={3}/></label><label className="mt-4 flex gap-2"><input type="checkbox" name="installation"/> Tôi cần hỗ trợ lắp đặt</label>
        <h2 className="mt-7 text-xl font-bold">Phương thức thanh toán</h2>{Object.values(paymentMethods).map(method => { const needsBank = method !== paymentMethods.PAY_AT_STORE; const disabled = needsBank && !bankTransferAvailable; return <label className={`mt-3 flex gap-3 rounded-lg border p-3.5 sm:p-4 ${paymentMethod === method ? "border-red-500 bg-red-50" : ""} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`} key={method}><input className="mt-1 shrink-0" required type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} disabled={disabled} onChange={() => setPaymentMethod(method)}/><span className="min-w-0"><b>{paymentMethodLabels[method]}</b>{method === paymentMethods.COD && <small className="mt-1 block text-gray-600">Cọc trước 200.000đ để giữ đơn và chi phí vận chuyển; phần còn lại trả khi nhận hàng.</small>}{method === paymentMethods.BANK_TRANSFER && <small className="mt-1 block text-gray-600">Thanh toán toàn bộ đơn qua mã VietQR.</small>}{disabled && <small className="mt-1 block text-red-700">Tạm chưa khả dụng — cửa hàng chưa cấu hình tài khoản nhận tiền.</small>}</span></label>})}
      </section>
      <aside className="card h-fit p-4 sm:p-5"><h2 className="text-xl font-bold">Đơn hàng ({items.length})</h2>{items.map(item => <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b py-3 text-sm" key={item.product.id}><span className="min-w-0 break-words">{item.product.name} × {item.quantity}</span><b className="whitespace-nowrap">{money(item.product.salePrice * item.quantity)}</b></div>)}<div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 text-lg sm:text-xl"><b>Tổng tiền</b><strong className="text-red-600">{money(total)}</strong></div>{state.message && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}<button disabled={!items.length || pending} className="btn mt-5 w-full bg-red-600 text-white disabled:opacity-50">{pending ? "Đang tạo đơn..." : "Đặt hàng"}</button><p className="mt-3 text-xs text-gray-500">Bằng việc đặt hàng, bạn đồng ý với chính sách mua hàng của Điện máy Hinh.</p></aside>
    </form>
  </main>;
}

function OrderSuccess({ state, paymentConfirmed, signedIn }: { state: CheckoutState; paymentConfirmed: boolean; signedIn: boolean }) {
  const code = state.code!;
  const awaitingPayment = Boolean(state.paymentRequired) && !paymentConfirmed;
  return (
    <main className="container py-5 sm:py-14">
      <article className="card mx-auto max-w-2xl overflow-hidden shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <header className="border-b border-zinc-100 px-4 py-6 text-center sm:px-10 sm:py-8">
          <div className={`mx-auto flex size-14 items-center justify-center rounded-full text-white shadow-lg sm:size-16 ${awaitingPayment ? "bg-amber-500 shadow-amber-500/20" : "bg-zinc-950 shadow-zinc-950/15"}`}>
            {awaitingPayment ? <Clock3 aria-hidden="true" size={29} strokeWidth={2.25}/> : <Check aria-hidden="true" size={30} strokeWidth={2.5}/>}
          </div>
          <p className={`mt-5 text-xs font-bold uppercase tracking-[0.18em] ${awaitingPayment ? "text-amber-700" : "text-zinc-500"}`}>
            {awaitingPayment ? "Đơn hàng đang chờ thanh toán" : "Đơn hàng đã được ghi nhận"}
          </p>
          <h1 className="mt-2 text-xl font-black text-zinc-950 sm:text-3xl">
            {awaitingPayment ? "Hoàn tất thanh toán để xác nhận đơn" : "Cảm ơn bạn đã đặt hàng"}
          </h1>
          <div className="mx-auto mt-5 w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 sm:px-5">
            <span className="block text-xs font-medium text-zinc-500">Mã đơn hàng</span>
            <strong className="mt-0.5 block break-all text-lg tracking-wide text-zinc-950 min-[380px]:text-xl sm:text-2xl">{code}</strong>
          </div>
        </header>

        <div className="px-3 py-4 min-[380px]:px-5 min-[380px]:py-6 sm:px-10 sm:py-8">
          {state.paymentRequired ? paymentConfirmed ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center sm:p-7">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                <BadgeCheck aria-hidden="true" size={28} strokeWidth={2.25} />
              </div>
              <h2 className="mt-4 text-xl font-black text-emerald-950 sm:text-2xl">Thanh toán đã được xác nhận</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-emerald-900">
                Hệ thống đã ghi nhận <strong>{money(state.paymentRequired)}</strong> cho đơn hàng của bạn.
              </p>
              {state.paymentMethod === paymentMethods.COD && (
                <div className="mx-auto mt-5 grid max-w-md gap-1 rounded-xl bg-white px-4 py-3 text-center text-sm shadow-sm ring-1 ring-emerald-100 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:text-left">
                  <span className="text-zinc-600">Thanh toán khi nhận hàng</span>
                  <strong className="text-base text-zinc-950 sm:whitespace-nowrap">{money(state.remainingOnDelivery ?? 0)}</strong>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center sm:p-6">
              <h2 className="text-lg font-black text-amber-950 sm:text-xl">Hoàn tất thanh toán <span className="whitespace-nowrap">{money(state.paymentRequired)}</span></h2>
              <p className="mt-2 text-sm leading-6 text-amber-900">Quét mã QR và giữ nguyên số tiền cùng nội dung chuyển khoản. Trang sẽ tự cập nhật khi giao dịch được ghi nhận.</p>
              {state.qrUrl && <img src={state.qrUrl} alt={`Mã QR thanh toán đơn ${code}`} className="mx-auto mt-4 w-full max-w-72 rounded-xl bg-white p-2 shadow-sm"/>}
              <dl className="mx-auto mt-4 grid max-w-sm gap-3 rounded-xl bg-white p-3 text-left text-sm sm:p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] gap-3"><dt className="text-zinc-500">Số tài khoản</dt><dd className="break-all text-right font-bold">{state.bank?.accountNo}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] gap-3"><dt className="text-zinc-500">Chủ tài khoản</dt><dd className="break-words text-right font-bold">{state.bank?.accountName}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] gap-3"><dt className="text-zinc-500">Nội dung</dt><dd className="break-all text-right font-black text-red-700">{code.replaceAll("-", "")}</dd></div>
              </dl>
              {state.paymentMethod === paymentMethods.COD && <p className="mt-4 text-sm font-semibold text-amber-950">Đây là tiền cọc vận chuyển. Còn lại {money(state.remainingOnDelivery ?? 0)} thanh toán khi nhận hàng.</p>}
              <p className="mt-4 text-xs font-semibold text-amber-800">Đang chờ xác nhận giao dịch…</p>
            </section>
          ) : (
            <p className="rounded-xl bg-zinc-50 p-4 text-center text-sm leading-6 text-zinc-600">Bạn thanh toán tại cửa hàng khi đến nhận hàng. Cửa hàng sẽ liên hệ xác nhận sớm nhất.</p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {paymentConfirmed && <Link href="/" className="btn bg-red-600 text-white"><ShoppingBag aria-hidden="true" size={18}/>Tiếp tục mua sắm</Link>}
            {signedIn && <Link href="/tai-khoan" className="btn btn-primary"><History aria-hidden="true" size={18}/>Lịch sử đơn hàng</Link>}
            <a href="tel:0914845274" className="btn border border-zinc-200 bg-white text-zinc-800 sm:col-span-2"><Phone aria-hidden="true" size={18}/>Hỗ trợ: 0914 845 274</a>
          </div>
        </div>
      </article>
    </main>
  );
}

function Field({ label, name, value, onChange, type = "text", required = true, className = "" }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; className?: string }) { return <label className={`block ${className}`}><span className="text-sm font-semibold">{label}</span><input name={name} value={value} onChange={event => onChange(event.target.value)} required={required} type={type} className="mt-1 w-full rounded-lg border p-3"/></label>; }
