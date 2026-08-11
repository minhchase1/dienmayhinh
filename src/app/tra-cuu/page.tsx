import { prisma } from "@/lib/prisma";
import { money } from "@/lib/data";

const statusLabels = { PENDING: "Đang chờ cửa hàng xác nhận", CONFIRMED: "Cửa hàng đã nhận đơn", PREPARING: "Đang chuẩn bị hàng", SHIPPING: "Đơn hàng sắp được giao", COMPLETED: "Đã giao thành công", CANCELLED: "Đơn hàng đã hủy" } as const;

export default async function Track({ searchParams }: { searchParams: Promise<{ code?: string; phone?: string }> }) {
  const params = await searchParams;
  const code = (params.code ?? "").trim().toUpperCase();
  const phone = (params.phone ?? "").trim();
  const searched = Boolean(code && phone);
  const order = searched ? await prisma.order.findFirst({ where: { code, customer: { phone } }, select: { code: true, status: true, total: true, address: true, createdAt: true, items: { select: { productName: true, quantity: true, unitPrice: true, product: { select: { name: true } } } } } }) : null;

  return <main className="container py-16"><div className="card mx-auto max-w-xl p-8"><h1 className="text-3xl font-black">Tra cứu đơn hàng</h1><p className="mt-2 text-gray-500">Nhập mã đơn và số điện thoại đặt hàng.</p>
    <form method="get" className="mt-6 grid gap-4"><input name="code" defaultValue={code} required className="rounded-lg border p-3" placeholder="Mã đơn hàng (VD: DMH12345678)"/><input name="phone" defaultValue={phone} required className="rounded-lg border p-3" placeholder="Số điện thoại"/><button className="btn btn-blue">Tra cứu</button></form>
    {order && <section className="mt-6 rounded-xl border bg-zinc-100 p-5"><div className="flex items-center justify-between gap-3"><div><small className="text-gray-500">Mã đơn</small><b className="block text-lg text-[#18181b]">{order.code}</b></div><span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#18181b]">{statusLabels[order.status]}</span></div>
      <div className="mt-4 border-t pt-3">{order.items.map((item, index) => <div className="flex justify-between py-1 text-sm" key={index}><span>{item.productName || item.product?.name || "Sản phẩm"} × {item.quantity}</span><b>{money(Number(item.unitPrice) * item.quantity)}</b></div>)}</div><div className="mt-3 flex justify-between border-t pt-3"><b>Tổng tiền</b><strong className="text-red-600">{money(Number(order.total))}</strong></div><p className="mt-3 text-xs text-gray-500">Đặt lúc {order.createdAt.toLocaleString("vi-VN")} · Giao đến {order.address}</p>
    </section>}
    {searched && !order && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại.</p>}
  </div></main>;
}
