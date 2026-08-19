"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { LockKeyhole, Search, ShieldCheck, UnlockKeyhole, Users } from "lucide-react";
import { toast } from "sonner";
import { setCustomerBlocked, type CustomerActionState } from "./customer-actions";

type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  orderCount: number;
};

const initialState: CustomerActionState = {};

function AccountAction({ customer }: { customer: CustomerAccount }) {
  const blocked = !customer.isBlocked;
  const [state, action, pending] = useActionState(setCustomerBlocked.bind(null, customer.id, blocked), initialState);
  useEffect(() => { if (state.message) (state.success ? toast.success : toast.error)(state.message); }, [state]);

  if (customer.isBlocked) return <form action={action}><button disabled={pending} className="btn border border-emerald-300 text-sm text-emerald-800 disabled:opacity-50"><UnlockKeyhole size={16}/>{pending ? "Đang mở..." : "Mở khóa"}</button></form>;
  return <form action={action} className="flex min-w-72 items-center justify-end gap-2">
    <input name="reason" required minLength={3} maxLength={300} className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm" placeholder="Lý do khóa..." aria-label={`Lý do khóa ${customer.name}`}/>
    <button disabled={pending} className="btn border border-red-300 text-sm text-red-700 disabled:opacity-50"><LockKeyhole size={16}/>{pending ? "Đang khóa..." : "Khóa"}</button>
  </form>;
}

export default function CustomerManager({ customers }: { customers: CustomerAccount[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("vi");
    return value ? customers.filter(customer => `${customer.name} ${customer.email} ${customer.blockedReason ?? ""}`.toLocaleLowerCase("vi").includes(value)) : customers;
  }, [customers, query]);
  const blockedCount = customers.filter(customer => customer.isBlocked).length;

  return <section id="customers" className="card mb-7 scroll-mt-28 overflow-hidden">
    <div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center">
      <div><h2 className="flex items-center gap-2 text-xl font-bold"><Users/>Tài khoản khách hàng ({customers.length})</h2><p className="mt-1 text-sm text-gray-500">Khóa tài khoản spam sẽ thu hồi toàn bộ phiên đăng nhập và ngăn đặt hàng bằng email đó.</p></div>
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${blockedCount ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}><ShieldCheck size={17}/>{blockedCount} tài khoản đang bị khóa</span>
    </div>
    <div className="p-5"><label className="flex max-w-md items-center gap-2 rounded-lg border bg-white px-3 py-2.5"><Search className="text-gray-400" size={19}/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full outline-none" placeholder="Tìm theo tên, email hoặc lý do..."/><span className="sr-only">Tìm tài khoản</span></label></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-gray-50 text-sm"><tr><th className="px-5 py-3">Khách hàng</th><th className="px-5 py-3">Ngày tạo</th><th className="px-5 py-3 text-center">Đơn hàng</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
      <tbody>{filtered.map(customer => <tr className="border-t align-top hover:bg-slate-50" key={customer.id}><td className="px-5 py-4"><b>{customer.name}</b><span className="block text-sm text-gray-500">{customer.email}</span></td><td className="px-5 py-4 text-sm">{new Date(customer.createdAt).toLocaleString("vi-VN")}</td><td className="px-5 py-4 text-center font-semibold">{customer.orderCount}</td><td className="px-5 py-4">{customer.isBlocked ? <><span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Đã khóa</span><small className="mt-2 block max-w-64 text-gray-500">{customer.blockedReason}</small>{customer.blockedAt && <small className="block text-gray-400">{new Date(customer.blockedAt).toLocaleString("vi-VN")}</small>}</> : <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đang hoạt động</span>}</td><td className="px-5 py-4"><div className="flex justify-end"><AccountAction customer={customer}/></div></td></tr>)}</tbody>
    </table>{!filtered.length && <p className="border-t p-10 text-center text-gray-500">Không tìm thấy tài khoản phù hợp.</p>}</div>
  </section>;
}
