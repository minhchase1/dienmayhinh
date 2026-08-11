"use client";

import { useActionState, useEffect } from "react";
import { CheckCheck, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus, type OrderActionState } from "./order-actions";

type Status = "PENDING" | "CONFIRMED" | "PREPARING" | "SHIPPING" | "COMPLETED" | "CANCELLED";
type OrderRow = { id: string; code: string; status: Status; total: number; address: string; createdAt: string; customer: { name: string; phone: string }; itemCount: number };
const initialState: OrderActionState = {};
const labels: Record<Status, string> = { PENDING: "Chờ xác nhận", CONFIRMED: "Đã nhận đơn", PREPARING: "Đang chuẩn bị", SHIPPING: "Sắp giao", COMPLETED: "Hoàn tất", CANCELLED: "Đã hủy" };

function StatusButton({ order, status, children }: { order: OrderRow; status: "CONFIRMED" | "SHIPPING"; children: React.ReactNode }) {
  const [state, action, pending] = useActionState(updateOrderStatus.bind(null, order.id, status), initialState);
  useEffect(() => { if (state.message) (state.success ? toast.success : toast.error)(state.message); }, [state]);
  return <form action={action}><button disabled={pending} className={`btn text-sm disabled:opacity-50 ${status === "CONFIRMED" ? "btn-blue" : "bg-amber-500 text-white"}`}>{status === "CONFIRMED" ? <CheckCheck size={17}/> : <Truck size={17}/>} {pending ? "Đang cập nhật..." : children}</button></form>;
}

export default function OrderManager({ orders }: { orders: OrderRow[] }) {
  return <section id="orders" className="card mb-7 scroll-mt-28 overflow-hidden">
    <div className="border-b p-5"><h2 className="flex items-center gap-2 text-xl font-bold"><PackageCheck className="text-[#18181b]"/>Đơn hàng ({orders.length})</h2><p className="mt-1 text-sm text-gray-500">Xác nhận đã nhận đơn và báo cho khách khi đơn sắp được giao.</p></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead className="bg-gray-50 text-sm text-gray-600"><tr><th className="px-5 py-3">Mã đơn</th><th className="px-5 py-3">Khách hàng</th><th className="px-5 py-3">Đơn hàng</th><th className="px-5 py-3">Tổng tiền</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thao tác</th></tr></thead>
      <tbody>{orders.map(order => <tr className="border-t align-top" key={order.id}><td className="px-5 py-4"><b className="text-[#18181b]">{order.code}</b><small className="mt-1 block text-gray-500">{new Date(order.createdAt).toLocaleString("vi-VN")}</small></td><td className="px-5 py-4"><b>{order.customer.name}</b><span className="block text-sm text-gray-500">{order.customer.phone}</span><span className="block max-w-64 text-xs text-gray-400">{order.address}</span></td><td className="px-5 py-4">{order.itemCount} sản phẩm</td><td className="px-5 py-4 font-bold text-red-600">{new Intl.NumberFormat("vi-VN").format(order.total)}₫</td><td className="px-5 py-4"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-[#18181b]">{labels[order.status]}</span></td><td className="px-5 py-4">{order.status === "PENDING" ? <StatusButton order={order} status="CONFIRMED">Đã nhận đơn</StatusButton> : ["CONFIRMED", "PREPARING"].includes(order.status) ? <StatusButton order={order} status="SHIPPING">Báo sắp giao</StatusButton> : <span className="text-sm text-gray-400">Đã cập nhật</span>}</td></tr>)}</tbody>
    </table>{!orders.length && <p className="p-10 text-center text-gray-500">Chưa có đơn hàng nào.</p>}</div>
  </section>;
}
