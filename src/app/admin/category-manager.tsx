"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createCategory, deleteCategory, updateCategory, type CategoryActionState } from "./actions";

type Category = { id: string; name: string; slug: string; description: string | null; productCount: number };
const initialState: CategoryActionState = {};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function SubmitButton({ pending, editing }: { pending: boolean; editing: boolean }) {
  return <button className="btn btn-blue disabled:cursor-not-allowed disabled:opacity-60" disabled={pending}>{pending ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm danh mục"}</button>;
}

function CategoryForm({ category, close }: { category: Category | null; close: () => void }) {
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [manualSlug, setManualSlug] = useState(Boolean(category));

  useEffect(() => {
    if (!state.message) return;
    if (state.success) toast.success(state.message);
    else toast.error(state.message);
    if (state.success) close();
  }, [state, close]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}>
    <section className="card w-full max-w-lg p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="category-form-title" className="text-xl font-bold">{category ? "Sửa danh mục" : "Thêm danh mục"}</h2><p className="mt-1 text-sm text-gray-500">Thông tin này sẽ hiển thị trên menu cửa hàng.</p></div>
        <button onClick={close} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Đóng"><X size={20}/></button>
      </div>
      <form action={formAction} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Tên danh mục
          <input className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#073b78]" name="name" value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!manualSlug) setSlug(slugify(value)); }} required maxLength={80}/>
          {state.errors?.name?.map(error => <span className="mt-1 block text-xs text-red-600" key={error}>{error}</span>)}
        </label>
        <label className="block text-sm font-semibold">Đường dẫn danh mục
          <div className="mt-1.5 flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-[#073b78]"><span className="pl-3 text-sm text-gray-400">/danh-muc/</span><input className="min-w-0 flex-1 rounded-lg px-1 py-2.5 outline-none" name="slug" value={slug} onChange={(event) => { setManualSlug(true); setSlug(slugify(event.target.value)); }} required maxLength={100}/></div>
          {state.errors?.slug?.map(error => <span className="mt-1 block text-xs text-red-600" key={error}>{error}</span>)}
        </label>
        <label className="block text-sm font-semibold">Mô tả <span className="font-normal text-gray-400">(không bắt buộc)</span>
          <textarea className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#073b78]" name="description" defaultValue={category?.description ?? ""} maxLength={300}/>
          {state.errors?.description?.map(error => <span className="mt-1 block text-xs text-red-600" key={error}>{error}</span>)}
        </label>
        {state.message && !state.success && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
        <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn border" onClick={close}>Hủy</button><SubmitButton pending={pending} editing={Boolean(category)}/></div>
      </form>
    </section>
  </div>;
}

function DeleteButton({ category }: { category: Category }) {
  const [state, action, pending] = useActionState(deleteCategory.bind(null, category.id), initialState);
  useEffect(() => { if (state.message) { if (state.success) toast.success(state.message); else toast.error(state.message); } }, [state]);
  return <form action={action} onSubmit={(event) => { if (!confirm(`Xóa danh mục “${category.name}”? Thao tác này không thể hoàn tác.`)) event.preventDefault(); }}>
    <button disabled={pending} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" title={category.productCount ? "Danh mục đang có sản phẩm" : "Xóa danh mục"} aria-label={`Xóa ${category.name}`}><Trash2 size={18}/></button>
  </form>;
}

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [formCategory, setFormCategory] = useState<Category | null | undefined>(undefined);
  const filtered = useMemo(() => { const value = query.trim().toLocaleLowerCase("vi"); return value ? categories.filter(item => `${item.name} ${item.slug} ${item.description ?? ""}`.toLocaleLowerCase("vi").includes(value)) : categories; }, [categories, query]);

  return <section className="card overflow-hidden">
    <div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center">
      <div><h2 className="flex items-center gap-2 text-xl font-bold"><Tags className="text-[#073b78]"/>Danh mục ({categories.length})</h2><p className="mt-1 text-sm text-gray-500">{categories.reduce((sum, item) => sum + item.productCount, 0)} sản phẩm đã được phân loại</p></div>
      <button className="btn btn-blue" onClick={() => setFormCategory(null)}><Plus size={19}/>Thêm danh mục</button>
    </div>
    <div className="p-5">
      <label className="flex max-w-md items-center gap-2 rounded-lg border bg-white px-3 py-2.5"><Search className="text-gray-400" size={19}/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full outline-none" placeholder="Tìm theo tên hoặc đường dẫn..."/><span className="sr-only">Tìm danh mục</span></label>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left"><thead className="bg-gray-50 text-sm text-gray-600"><tr><th className="px-5 py-3">Tên danh mục</th><th className="px-5 py-3">Đường dẫn</th><th className="px-5 py-3">Mô tả</th><th className="px-5 py-3 text-center">Sản phẩm</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
        <tbody>{filtered.map(category => <tr className="border-t hover:bg-slate-50" key={category.id}><td className="px-5 py-4 font-semibold">{category.name}</td><td className="px-5 py-4"><code className="rounded bg-slate-100 px-2 py-1 text-sm">{category.slug}</code></td><td className="max-w-xs truncate px-5 py-4 text-sm text-gray-500">{category.description || "—"}</td><td className="px-5 py-4 text-center"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold text-[#073b78]">{category.productCount}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-[#073b78] hover:bg-blue-50" onClick={() => setFormCategory(category)} title="Sửa danh mục" aria-label={`Sửa ${category.name}`}><Pencil size={18}/></button><DeleteButton category={category}/></div></td></tr>)}</tbody></table>
      {!filtered.length && <div className="border-t p-12 text-center text-gray-500">{categories.length ? "Không tìm thấy danh mục phù hợp." : "Chưa có danh mục. Hãy thêm danh mục đầu tiên."}</div>}
    </div>
    {formCategory !== undefined && <CategoryForm key={formCategory?.id ?? "new"} category={formCategory} close={() => setFormCategory(undefined)}/>} 
  </section>;
}
