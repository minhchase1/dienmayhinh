import { Check, Circle, PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/data";

const statusLabels = {
  PENDING: "Đang chờ cửa hàng xác nhận", CONFIRMED: "Cửa hàng đã nhận đơn",
  PREPARING: "Đang chuẩn bị hàng", SHIPPING: "Đơn hàng sắp được giao",
  COMPLETED: "Đã giao thành công", CANCELLED: "Đơn hàng đã hủy",
} as const;
const statusSteps = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPING", "COMPLETED"] as const;
const paymentLabels: Record<string, string> = { COD: "Thanh toán khi nhận hàng", BANK_TRANSFER: "Chuyển khoản ngân hàng", CASH: "Tiền mặt" };

export default async function Track({ searchParams }: { searchParams: Promise<{ q?: string; code?: string; phone?: string }> }) {
  const params = await searchParams;
  const query = (params.q ?? params.code ?? params.phone ?? "").trim();
  const searched = Boolean(query);
  const orders = searched ? await prisma.order.findMany({
    where: { OR: [{ code: query.toUpperCase() }, { customer: { phone: query } }] },
    orderBy: { createdAt: "desc" },
    select: {
      code: true, status: true, total: true, address: true, note: true, paymentMethod: true, installation: true, createdAt: true,
      customer: { select: { name: true, phone: true } },
      items: { select: { id: true, productName: true, quantity: true, unitPrice: true, product: { select: { name: true } } } },
    },
  }) : [];

  return <main className="container py-12 md:py-16"><div className="card mx-auto max-w-3xl p-5 md:p-8">
    <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-content-center rounded-xl bg-[#ffd21c]"><PackageSearch /></span><div><h1 className="text-2xl font-black md:text-3xl">Tra cứu đơn hàng</h1><p className="mt-1 text-gray-500">Nhập mã đơn hàng hoặc số điện thoại đã dùng khi đặt hàng.</p></div></div>
    <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row"><input name="q" defaultValue={query} required className="min-w-0 flex-1 rounded-lg border p-3 outline-none focus:border-zinc-700" placeholder="Mã đơn hàng hoặc số điện thoại" aria-label="Mã đơn hàng hoặc số điện thoại"/><button className="btn btn-blue">Xem đơn hàng</button></form>
    {orders.length > 1 && <p className="mt-6 text-sm font-semibold">Tìm thấy {orders.length} đơn hàng</p>}
    <div className="mt-6 grid gap-5">{orders.map(order => {
      const currentStep = statusSteps.indexOf(order.status as (typeof statusSteps)[number]);
      return <article className="overflow-hidden rounded-xl border" key={order.code}>
        <div className="flex flex-col justify-between gap-3 bg-zinc-100 p-5 sm:flex-row sm:items-center"><div><small className="text-gray-500">Mã đơn hàng</small><b className="block text-lg text-[#18181b]">{order.code}</b><span className="text-xs text-gray-500">Đặt lúc {order.createdAt.toLocaleString("vi-VN")}</span></div><span className={`w-fit rounded-full px-3 py-1.5 text-sm font-bold ${order.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-white text-[#18181b]"}`}>{statusLabels[order.status]}</span></div>
        {order.status !== "CANCELLED" && <div className="grid grid-cols-5 gap-1 border-b px-3 py-5 sm:px-5">{statusSteps.map((step, index) => { const reached = index <= currentStep; return <div className="relative flex flex-col items-center text-center" key={step}>{index > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${index <= currentStep ? "bg-zinc-800" : "bg-gray-200"}`}/>}<span className={`relative z-10 grid h-6 w-6 place-content-center rounded-full ${reached ? "bg-zinc-800 text-white" : "bg-gray-200 text-gray-400"}`}>{reached ? <Check size={14}/> : <Circle size={10}/>}</span><span className="mt-2 hidden text-[11px] text-gray-600 sm:block">{statusLabels[step]}</span></div>; })}</div>}
        <div className="p-5"><h2 className="font-bold">Sản phẩm đã đặt</h2><div className="mt-2 divide-y">{order.items.map(item => <div className="flex justify-between gap-4 py-3 text-sm" key={item.id}><span>{item.productName || item.product?.name || "Sản phẩm"} × {item.quantity}</span><b className="shrink-0">{money(Number(item.unitPrice) * item.quantity)}</b></div>)}</div><div className="flex justify-between border-t pt-3"><b>Tổng tiền</b><strong className="text-lg text-red-600">{money(Number(order.total))}</strong></div>
          <dl className="mt-5 grid gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">Người nhận</dt><dd className="font-semibold">{order.customer.name} · {order.customer.phone}</dd></div><div><dt className="text-gray-500">Thanh toán</dt><dd className="font-semibold">{paymentLabels[order.paymentMethod] ?? order.paymentMethod}</dd></div><div className="sm:col-span-2"><dt className="text-gray-500">Địa chỉ giao hàng</dt><dd className="font-semibold">{order.address}</dd></div>{order.installation && <div><dt className="text-gray-500">Lắp đặt</dt><dd className="font-semibold">Có yêu cầu lắp đặt</dd></div>}{order.note && <div className={order.installation ? "" : "sm:col-span-2"}><dt className="text-gray-500">Ghi chú</dt><dd className="font-semibold">{order.note}</dd></div>}</dl>
        </div>
      </article>;
    })}</div>
    {searched && !orders.length && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hàng hoặc số điện thoại.</p>}
  </div></main>;
}
