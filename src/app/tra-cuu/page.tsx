import { Check, Circle, PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { paymentLabel } from "@/lib/payments";
import { money } from "@/lib/data";

const statusLabels = {
  PENDING: "Đang chờ cửa hàng xác nhận", CONFIRMED: "Cửa hàng đã nhận đơn",
  PREPARING: "Đang chuẩn bị hàng", SHIPPING: "Đang giao hàng",
  COMPLETED: "Đã giao thành công", CANCELLED: "Đơn hàng đã hủy",
} as const;
const statusSteps = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPING", "COMPLETED"] as const;

export default async function Track({ searchParams }: { searchParams: Promise<{ code?: string; q?: string }> }) {
  const params = await searchParams;
  const code = (params.code ?? params.q ?? "").trim().toUpperCase();
  const searched = Boolean(code);
  const order = searched ? await prisma.order.findFirst({
    where: { code },
    select: {
      code: true, status: true, total: true, address: true, note: true, paymentMethod: true, paymentStatus: true, paymentRequired: true, paidAmount: true, installation: true,
      cancellationReason: true, createdAt: true, customer: { select: { name: true, phone: true } },
      items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
      statusEvents: { orderBy: { createdAt: "asc" }, select: { id: true, toStatus: true, note: true, createdAt: true } },
    },
  }) : null;

  return <main className="container py-12 md:py-16"><div className="card mx-auto max-w-3xl p-5 md:p-8">
    <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-content-center rounded-xl bg-[#ffd21c]"><PackageSearch /></span><div><h1 className="text-2xl font-black md:text-3xl">Tra cứu đơn hàng</h1><p className="mt-1 text-gray-500">Nhập mã đơn hàng để xem tình trạng xử lý và giao hàng.</p></div></div>
    <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row"><input name="code" defaultValue={code} required autoComplete="off" className="min-w-0 flex-1 rounded-lg border p-3" placeholder="Mã đơn hàng" aria-label="Mã đơn hàng"/><button className="btn btn-blue">Xem đơn</button></form>
    {order && <article className="mt-6 overflow-hidden rounded-xl border">
      <div className="flex flex-col justify-between gap-3 bg-zinc-100 p-5 sm:flex-row"><div><small className="text-gray-500">Mã đơn hàng</small><b className="block text-lg">{order.code}</b><span className="text-xs text-gray-500">Đặt lúc {order.createdAt.toLocaleString("vi-VN")}</span></div><span className="h-fit w-fit rounded-full bg-white px-3 py-1.5 text-sm font-bold">{statusLabels[order.status]}</span></div>
      {order.status !== "CANCELLED" && <div className="grid grid-cols-5 gap-1 border-b px-3 py-5">{statusSteps.map((step,index)=>{const current=statusSteps.indexOf(order.status as typeof statusSteps[number]);const reached=index<=current;return <div className="relative flex flex-col items-center text-center" key={step}>{index>0&&<span className={`absolute right-1/2 top-3 h-0.5 w-full ${index<=current?'bg-zinc-800':'bg-gray-200'}`}/>}<span className={`relative z-10 grid h-6 w-6 place-content-center rounded-full ${reached?'bg-zinc-800 text-white':'bg-gray-200 text-gray-400'}`}>{reached?<Check size={14}/>:<Circle size={10}/>}</span><span className="mt-2 hidden text-[11px] sm:block">{statusLabels[step]}</span></div>})}</div>}
      <div className="p-5"><h2 className="font-bold">Sản phẩm đã đặt</h2><div className="mt-2 divide-y">{order.items.map(item=><div className="flex justify-between gap-4 py-3 text-sm" key={item.id}><span>{item.productName} × {item.quantity}</span><b>{money(Number(item.unitPrice)*item.quantity)}</b></div>)}</div><div className="flex justify-between border-t pt-3"><b>Tổng tiền</b><strong className="text-lg text-red-600">{money(Number(order.total))}</strong></div>
        <dl className="mt-5 grid gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">Người nhận</dt><dd className="font-semibold">{order.customer.name} · {order.customer.phone}</dd></div><div><dt className="text-gray-500">Thanh toán</dt><dd className="font-semibold">{paymentLabel(order.paymentMethod)}</dd><dd className={order.paymentStatus === "PENDING" ? "text-amber-700" : "text-emerald-700"}>{order.paymentStatus === "PENDING" && Number(order.paymentRequired) > 0 ? `Chờ thanh toán ${Number(order.paymentRequired).toLocaleString("vi-VN")}đ` : order.paymentStatus === "PARTIALLY_PAID" ? `Đã cọc ${Number(order.paidAmount).toLocaleString("vi-VN")}đ` : order.paymentStatus === "PAID" ? "Đã thanh toán" : "Thanh toán khi nhận tại cửa hàng"}</dd></div><div className="sm:col-span-2"><dt className="text-gray-500">Địa chỉ giao hàng</dt><dd className="font-semibold">{order.address}</dd></div>{order.cancellationReason&&<div className="sm:col-span-2"><dt className="text-gray-500">Lý do hủy</dt><dd className="font-semibold text-red-700">{order.cancellationReason}</dd></div>}</dl>
        <h2 className="mt-5 font-bold">Lịch sử trạng thái</h2><ol className="mt-2 space-y-2 text-sm">{order.statusEvents.map(event=><li key={event.id} className="border-l-2 pl-3"><b>{statusLabels[event.toStatus]}</b><span className="ml-2 text-gray-500">{event.createdAt.toLocaleString("vi-VN")}</span>{event.note&&<p className="text-gray-600">{event.note}</p>}</li>)}</ol>
      </div>
    </article>}
    {searched&&!order&&<p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn.</p>}
  </div></main>;
}
