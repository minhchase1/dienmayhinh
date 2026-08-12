import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import type { Prisma } from "@prisma/client";
import ProductCard from "@/components/product-card";
import { categories } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { productInclude, toStoreProduct } from "@/lib/product-data";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const priceOptions = [
  { value: "under-10", label: "Dưới 10 triệu", min: 0, max: 10_000_000 },
  { value: "10-20", label: "Từ 10 - 20 triệu", min: 10_000_000, max: 20_000_000 },
  { value: "over-20", label: "Trên 20 triệu", min: 20_000_000 },
] as const;
const sorts = new Set(["newest", "price-asc", "price-desc", "discount-desc"]);

function values(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function priceWhere(price: string): Prisma.ProductWhereInput | undefined {
  const option = priceOptions.find(item => item.value === price);
  if (!option) return undefined;
  const range = { gte: option.min, ...("max" in option ? { lt: option.max } : {}) };
  return { OR: [{ salePrice: range }, { salePrice: null, price: range }] };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: SearchParams }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const price = typeof query.price === "string" ? query.price : "";
  const selectedBrands = values(query.brand).filter(value => value.length <= 80).slice(0, 20);
  const inverter = query.inverter === "1";
  const inStock = query.stock === "1";
  const requestedSort = typeof query.sort === "string" ? query.sort : "newest";
  const sort = sorts.has(requestedSort) ? requestedSort : "newest";
  const categoryWhere: Prisma.ProductWhereInput = slug === "khuyen-mai" ? { salePrice: { not: null } } : { category: { slug } };
  const filterWhere: Prisma.ProductWhereInput = { AND: [
    { visible: true }, categoryWhere,
    ...(selectedBrands.length ? [{ brand: { slug: { in: selectedBrands } } }] : []),
    ...(inStock ? [{ stock: { gt: 0 } }] : []),
    ...(inverter ? [{ OR: [
      { name: { contains: "inverter", mode: "insensitive" as const } },
      { specifications: { some: { OR: [{ name: { contains: "inverter", mode: "insensitive" as const } }, { value: { contains: "inverter", mode: "insensitive" as const } }] } } },
    ] }] : []),
    ...(priceWhere(price) ? [priceWhere(price)!] : []),
  ] };

  const [databaseCategory, databaseProducts, availableBrands] = await Promise.all([
    slug === "khuyen-mai" ? null : prisma.category.findUnique({ where: { slug }, select: { name: true, description: true } }),
    prisma.product.findMany({ where: filterWhere, orderBy: { createdAt: "desc" }, include: productInclude }),
    prisma.brand.findMany({
      where: { products: { some: { visible: true, ...categoryWhere } } },
      orderBy: { name: "asc" }, select: { name: true, slug: true },
    }),
  ]);
  const title = databaseCategory?.name ?? categories.find(category => category[0] === slug)?.[1] ?? "Sản phẩm";
  const list = databaseProducts.map(toStoreProduct);
  if (sort === "price-asc") list.sort((a,b)=>a.salePrice-b.salePrice);
  if (sort === "price-desc") list.sort((a,b)=>b.salePrice-a.salePrice);
  if (sort === "discount-desc") list.sort((a,b)=>(1-b.salePrice/b.price)-(1-a.salePrice/a.price));
  const hasFilters = Boolean(price || selectedBrands.length || inverter || inStock);

  return <main className="container py-8">
    <div className="text-sm text-gray-500"><Link href="/">Trang chủ</Link> / {title}</div>
    <h1 className="mt-4 text-3xl font-black">{title}</h1>
    <p className="mt-2 text-gray-500">{databaseCategory?.description || `Khám phá ${title.toLowerCase()} chính hãng, giá minh bạch và hỗ trợ giao lắp tận nơi.`}</p>
    <div className="mt-8 grid gap-6 md:grid-cols-[250px_1fr]">
      <aside className="card h-fit p-5">
        <form method="get">
          <input type="hidden" name="sort" value={sort}/>
          <h2 className="flex gap-2 font-bold"><SlidersHorizontal/>Bộ lọc</h2>
          <fieldset className="mt-5 border-t pt-4"><legend className="font-bold">Khoảng giá</legend>
            {priceOptions.map(option=><label className="mt-3 flex gap-2 text-sm" key={option.value}><input type="radio" name="price" value={option.value} defaultChecked={price===option.value}/>{option.label}</label>)}
          </fieldset>
          <fieldset className="mt-5 border-t pt-4"><legend className="font-bold">Thương hiệu</legend>
            <div className="mt-2 max-h-48 space-y-2 overflow-auto">{availableBrands.map(brand=><label className="flex gap-2 text-sm" key={brand.slug}><input type="checkbox" name="brand" value={brand.slug} defaultChecked={selectedBrands.includes(brand.slug)}/>{brand.name}</label>)}{!availableBrands.length&&<p className="text-sm text-gray-400">Chưa có thương hiệu</p>}</div>
          </fieldset>
          <fieldset className="mt-5 border-t pt-4"><legend className="font-bold">Tính năng và tồn kho</legend>
            <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" name="inverter" value="1" defaultChecked={inverter}/>Có Inverter</label>
            <label className="mt-2 flex gap-2 text-sm"><input type="checkbox" name="stock" value="1" defaultChecked={inStock}/>Còn hàng</label>
          </fieldset>
          <button className="btn btn-blue mt-5 w-full">Áp dụng bộ lọc</button>
          {hasFilters&&<Link href={`/danh-muc/${slug}?sort=${sort}`} className="mt-3 block text-center text-sm font-bold text-red-600 hover:underline">Xóa tất cả bộ lọc</Link>}
        </form>
      </aside>
      <section>
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 p-4"><b>{list.length} sản phẩm</b>
          <form method="get" className="flex items-center gap-2">
            {price&&<input type="hidden" name="price" value={price}/>} {selectedBrands.map(brand=><input type="hidden" name="brand" value={brand} key={brand}/>)} {inverter&&<input type="hidden" name="inverter" value="1"/>} {inStock&&<input type="hidden" name="stock" value="1"/>}
            <label className="text-sm font-semibold" htmlFor="sort">Sắp xếp</label><select id="sort" name="sort" defaultValue={sort} className="rounded-lg border bg-white p-2"><option value="newest">Mới nhất</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option><option value="discount-desc">Giảm giá nhiều nhất</option></select><button className="btn btn-blue text-sm">Sắp xếp</button>
          </form>
        </div>
        {list.length?<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{list.map(product=><ProductCard key={product.id} p={product}/>)}</div>:<div className="card p-12 text-center"><h2 className="text-xl font-bold">Chưa có sản phẩm phù hợp</h2><p className="mt-2 text-gray-500">Hãy thử bỏ bớt điều kiện lọc.</p>{hasFilters&&<Link href={`/danh-muc/${slug}`} className="btn btn-blue mt-5">Xóa bộ lọc</Link>}</div>}
      </section>
    </div>
  </main>;
}
