"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, PackagePlus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createProduct, deleteProduct, updateProduct, type ProductActionState } from "./product-actions";

type CategoryOption = { id: string; name: string };
type ProductRow = { id: string; name: string; slug: string; sku: string; category: string; categoryId: string; brand: string; price: number; salePrice: number; stock: number; visible: boolean; shortDescription: string; description: string; specifications: string; images: string[] };
const initialState: ProductActionState = {};

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function ErrorText({ errors }: { errors?: string[] }) { return errors?.length ? <span className="mt-1 block text-xs text-red-600">{errors[0]}</span> : null; }

function ProductForm({ categories, product, close }: { categories: CategoryOption[]; product: ProductRow | null; close: () => void }) {
  const serverAction = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, action, pending] = useActionState(serverAction, initialState);
  const [name, setName] = useState(product?.name ?? ""); const [slug, setSlug] = useState(product?.slug ?? ""); const [manualSlug, setManualSlug] = useState(Boolean(product));
  const inputClass = "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-[#18181b]";
  useEffect(() => { if (!state.message) return; if (state.success) { toast.success(state.message); close(); } else toast.error(state.message); }, [state, close]);
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4" onMouseDown={event => { if (event.currentTarget === event.target) close(); }}><section className="card mx-auto my-4 w-full max-w-4xl p-6 shadow-2xl" role="dialog" aria-modal="true">
    <div className="flex justify-between"><div><h2 className="text-2xl font-black">{product ? "Sửa sản phẩm" : "Đăng sản phẩm mới"}</h2><p className="mt-1 text-sm text-gray-500">Nhập đầy đủ nội dung và hình ảnh khách hàng sẽ nhìn thấy.</p></div><button onClick={close} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Đóng"><X/></button></div>
    <form action={action} className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Tên sản phẩm<input className={inputClass} name="name" value={name} onChange={e => { setName(e.target.value); if (!manualSlug) setSlug(slugify(e.target.value)); }} required/><ErrorText errors={state.errors?.name}/></label>
        <label className="text-sm font-semibold">Đường dẫn sản phẩm<input className={inputClass} name="slug" value={slug} onChange={e => { setManualSlug(true); setSlug(slugify(e.target.value)); }} required/><span className="mt-1 block text-xs font-normal text-gray-500">Dùng trong địa chỉ trang sản phẩm, được tạo tự động từ tên.</span><ErrorText errors={state.errors?.slug}/></label>
        <label className="text-sm font-semibold">Mã SKU<input className={inputClass} name="sku" defaultValue={product?.sku} placeholder="VD: TL-SAMSUNG-236" required/><ErrorText errors={state.errors?.sku}/></label>
        <label className="text-sm font-semibold">Danh mục<select className={inputClass} name="categoryId" required defaultValue={product?.categoryId ?? ""}><option value="" disabled>Chọn danh mục</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ErrorText errors={state.errors?.categoryId}/></label>
        <label className="text-sm font-semibold">Thương hiệu<input className={inputClass} name="brand" defaultValue={product?.brand} placeholder="Samsung, LG, Panasonic..." required/><ErrorText errors={state.errors?.brand}/></label>
        <label className="text-sm font-semibold">Số lượng tồn kho<input className={inputClass} name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required/><ErrorText errors={state.errors?.stock}/></label>
        <label className="text-sm font-semibold">Giá niêm yết (₫)<input className={inputClass} name="price" type="number" min="1000" step="1000" defaultValue={product?.price} placeholder="13990000" required/><ErrorText errors={state.errors?.price}/></label>
        <label className="text-sm font-semibold">Giá bán (₫)<input className={inputClass} name="salePrice" type="number" min="1000" step="1000" defaultValue={product?.salePrice} placeholder="11490000" required/><ErrorText errors={state.errors?.salePrice}/></label>
      </div>
      <label className="block text-sm font-semibold">Mô tả ngắn<input className={inputClass} name="shortDescription" defaultValue={product?.shortDescription} maxLength={300} placeholder="Điểm nổi bật hiển thị trong danh sách sản phẩm"/><ErrorText errors={state.errors?.shortDescription}/></label>
      <label className="block text-sm font-semibold">Mô tả chi tiết<textarea className={`${inputClass} min-h-32 resize-y`} name="description" defaultValue={product?.description} required placeholder="Thông tin tính năng, công nghệ, lợi ích của sản phẩm..."/><ErrorText errors={state.errors?.description}/></label>
      <label className="block text-sm font-semibold">Thông số kỹ thuật <span className="font-normal text-gray-400">(mỗi dòng: Tên: Giá trị)</span><textarea className={`${inputClass} min-h-32 font-mono text-sm`} name="specifications" defaultValue={product?.specifications} placeholder={"Dung tích: 344 lít\nCông nghệ: Inverter\nBảo hành: 24 tháng"}/><ErrorText errors={state.errors?.specifications}/></label>
      {product?.images.length ? <div><p className="mb-2 text-sm font-semibold">Hình ảnh hiện tại</p><div className="flex gap-2">{product.images.slice(0,6).map(image => <div className="relative h-20 w-20 overflow-hidden rounded-lg border" key={image}><Image src={image} alt="" fill sizes="80px" className="object-cover"/></div>)}</div></div> : null}
      <label className="block rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-5 text-center"><ImagePlus className="mx-auto text-[#18181b]"/><span className="mt-2 block font-semibold">{product ? "Thay toàn bộ hình ảnh" : "Chọn hình ảnh sản phẩm"}</span><span className="mt-1 block text-xs text-gray-500">{product ? "Không chọn ảnh mới nếu muốn giữ nguyên ảnh hiện tại. " : ""}Tối đa 6 ảnh; JPG, PNG, WebP, AVIF; mỗi ảnh tối đa 4 MB.</span><input className="mt-3 text-sm" type="file" name="images" accept="image/jpeg,image/png,image/webp,image/avif" multiple required={!product}/></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="visible" defaultChecked={product?.visible ?? true}/> Hiển thị sản phẩm trên cửa hàng</label>
      {state.message && !state.success && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
      <div className="flex justify-end gap-3"><button type="button" className="btn border" onClick={close}>Hủy</button><button disabled={pending} className="btn btn-blue disabled:opacity-60">{pending ? "Đang lưu..." : product ? "Lưu thay đổi" : "Đăng sản phẩm"}</button></div>
    </form>
  </section></div>;
}

function DeleteProductButton({ product }: { product: ProductRow }) {
  const [state, action, pending] = useActionState(deleteProduct.bind(null, product.id), initialState);
  useEffect(() => { if (state.message) { if (state.success) toast.success(state.message); else toast.error(state.message); } }, [state]);
  return <form action={action} onSubmit={event => { if (!confirm(`Xóa sản phẩm “${product.name}”? Hình ảnh đã tải lên cũng sẽ bị xóa và không thể khôi phục.`)) event.preventDefault(); }}><button disabled={pending} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" title="Xóa sản phẩm" aria-label={`Xóa ${product.name}`}><Trash2 size={18}/></button></form>;
}

export default function ProductManager({ categories, products }: { categories: CategoryOption[]; products: ProductRow[] }) {
  const [editing, setEditing] = useState<ProductRow | null | undefined>(undefined);
  return <section className="card mb-7 overflow-hidden"><div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 text-xl font-bold"><PackagePlus className="text-[#18181b]"/>Sản phẩm ({products.length})</h2><p className="mt-1 text-sm text-gray-500">Đăng sản phẩm cùng hình ảnh và thông tin bán hàng đầy đủ.</p></div><button className="btn btn-blue" onClick={() => setEditing(null)}><PackagePlus size={19}/>Thêm sản phẩm</button></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-gray-50 text-sm text-gray-600"><tr><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">SKU</th><th className="px-5 py-3">Danh mục</th><th className="px-5 py-3">Giá bán</th><th className="px-5 py-3 text-center">Tồn kho</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody>{products.map(product => <tr className="border-t" key={product.id}><td className="px-5 py-4 font-semibold">{product.name}</td><td className="px-5 py-4 text-sm">{product.sku}</td><td className="px-5 py-4 text-sm">{product.category}</td><td className="px-5 py-4 font-bold text-red-600">{new Intl.NumberFormat("vi-VN").format(product.salePrice)}₫</td><td className="px-5 py-4 text-center">{product.stock}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{product.visible ? "Đang hiển thị" : "Đã ẩn"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => setEditing(product)} className="rounded-lg p-2 text-[#18181b] hover:bg-zinc-100" title="Sửa sản phẩm" aria-label={`Sửa ${product.name}`}><Pencil size={18}/></button><DeleteProductButton product={product}/></div></td></tr>)}</tbody></table>{!products.length && <p className="border-t p-8 text-center text-gray-500">Chưa có sản phẩm trong cơ sở dữ liệu.</p>}</div>
    {editing !== undefined && <ProductForm key={editing?.id ?? "new"} categories={categories} product={editing} close={() => setEditing(undefined)}/>} </section>;
}
