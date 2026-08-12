"use client";

import { useActionState, useEffect } from "react";
import { Ban, CheckCheck, ChefHat, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus, type OrderActionState } from "./order-actions";

type Status = "PENDING" | "CONFIRMED" | "PREPARING" | "SHIPPING" | "COMPLETED" | "CANCELLED";
type OrderRow = { id: string; code: string; status: Status; total: number; address: string; createdAt: string; customer: { name: string; phone: string }; itemCount: number };
const initialState: OrderActionState = {};
const labels: Record<Status,string>={PENDING:"Chờ xác nhận",CONFIRMED:"Đã xác nhận",PREPARING:"Đang chuẩn bị",SHIPPING:"Đang giao",COMPLETED:"Hoàn tất",CANCELLED:"Đã hủy"};
const nextStatus: Partial<Record<Status,{status:Status;label:string}>>={PENDING:{status:"CONFIRMED",label:"Xác nhận"},CONFIRMED:{status:"PREPARING",label:"Chuẩn bị hàng"},PREPARING:{status:"SHIPPING",label:"Bắt đầu giao"},SHIPPING:{status:"COMPLETED",label:"Hoàn tất"}};

function StatusForm({order,status,label,cancel=false}:{order:OrderRow;status:Status;label:string;cancel?:boolean}){
  const [state,action,pending]=useActionState(updateOrderStatus.bind(null,order.id,status),initialState);
  useEffect(()=>{if(state.message)(state.success?toast.success:toast.error)(state.message)},[state]);
  const Icon=cancel?Ban:status==="CONFIRMED"?CheckCheck:status==="PREPARING"?ChefHat:status==="SHIPPING"?Truck:PackageCheck;
  return <form action={action} className={cancel?"mt-2":""}>{cancel&&<input name="reason" required minLength={3} maxLength={500} className="mb-2 w-44 rounded border p-2 text-xs" placeholder="Lý do hủy đơn"/>}<button disabled={pending} className={`btn text-sm disabled:opacity-50 ${cancel?'border border-red-300 text-red-700':'btn-blue'}`}><Icon size={16}/>{pending?'Đang cập nhật...':label}</button></form>;
}

export default function OrderManager({orders}:{orders:OrderRow[]}){return <section id="orders" className="card mb-7 scroll-mt-28 overflow-hidden"><div className="border-b p-5"><h2 className="flex items-center gap-2 text-xl font-bold"><PackageCheck/>Đơn hàng ({orders.length})</h2><p className="mt-1 text-sm text-gray-500">Xử lý tuần tự từ xác nhận đến hoàn tất; hủy đơn sẽ tự động hoàn kho.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-gray-50 text-sm"><tr><th className="px-5 py-3">Mã đơn</th><th className="px-5 py-3">Khách hàng</th><th className="px-5 py-3">Đơn hàng</th><th className="px-5 py-3">Tổng tiền</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thao tác</th></tr></thead><tbody>{orders.map(order=>{const next=nextStatus[order.status];const canCancel=!['COMPLETED','CANCELLED'].includes(order.status);return <tr className="border-t align-top" key={order.id}><td className="px-5 py-4"><b>{order.code}</b><small className="block text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</small></td><td className="px-5 py-4"><b>{order.customer.name}</b><span className="block text-sm">{order.customer.phone}</span><span className="block max-w-64 text-xs text-gray-400">{order.address}</span></td><td className="px-5 py-4">{order.itemCount} sản phẩm</td><td className="px-5 py-4 font-bold text-red-600">{new Intl.NumberFormat('vi-VN').format(order.total)}₫</td><td className="px-5 py-4"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold">{labels[order.status]}</span></td><td className="px-5 py-4">{next&&<StatusForm order={order} status={next.status} label={next.label}/>} {canCancel&&<StatusForm order={order} status="CANCELLED" label="Hủy đơn" cancel/>}{!next&&!canCancel&&<span className="text-sm text-gray-400">Đã kết thúc</span>}</td></tr>})}</tbody></table>{!orders.length&&<p className="p-10 text-center text-gray-500">Chưa có đơn hàng nào.</p>}</div></section>}
