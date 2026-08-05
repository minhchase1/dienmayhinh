import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/product-card";
import { categories, products } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { productInclude, toStoreProduct } from "@/lib/product-data";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const databaseCategory = slug === "khuyen-mai" ? null : await prisma.category.findUnique({ where: { slug }, select: { name: true, description: true } });
  const databaseProducts = await prisma.product.findMany({
    where: { visible: true, ...(slug === "khuyen-mai" ? { salePrice: { not: null } } : { category: { slug } }) },
    orderBy: { createdAt: "desc" }, include: productInclude,
  });
  const title = databaseCategory?.name ?? categories.find((category) => category[0] === slug)?.[1] ?? "Sản phẩm";
  const sampleProducts = slug === "khuyen-mai" ? products : products.filter((product) => product.category === slug);
  const storedProducts = databaseProducts.map(toStoreProduct);
  const storedSlugs = new Set(storedProducts.map((product) => product.slug));
  const list = [...storedProducts, ...sampleProducts.filter((product) => !storedSlugs.has(product.slug))];

  return <main className="container py-8"><div className="text-sm text-gray-500"><Link href="/">Trang chủ</Link> / {title}</div><h1 className="mt-4 text-3xl font-black">{title}</h1><p className="mt-2 text-gray-500">{databaseCategory?.description || `Khám phá ${title.toLowerCase()} chính hãng, giá minh bạch và hỗ trợ giao lắp tận nơi.`}</p><div className="mt-8 grid gap-6 md:grid-cols-[250px_1fr]"><aside className="card h-fit p-5"><h2 className="flex gap-2 font-bold"><SlidersHorizontal/>Bộ lọc</h2>{["Khoảng giá","Thương hiệu","Công nghệ Inverter","Tình trạng hàng"].map((item,index)=><div className="mt-5 border-t pt-4" key={item}><b>{item}</b><label className="mt-3 flex gap-2 text-sm"><input type="checkbox"/> {index===0?"Dưới 10 triệu":index===1?"Samsung / LG / Panasonic":index===2?"Có Inverter":"Còn hàng"}</label><label className="mt-2 flex gap-2 text-sm"><input type="checkbox"/> {index===0?"Từ 10 - 20 triệu":"Lựa chọn khác"}</label></div>)}<button className="mt-5 font-bold text-[#073b78]">Xóa tất cả bộ lọc</button></aside><section><div className="card mb-5 flex items-center justify-between p-4"><b>{list.length} sản phẩm</b><select className="rounded-lg border bg-white p-2"><option>Nổi bật</option><option>Giá thấp đến cao</option><option>Giá cao đến thấp</option><option>Giảm giá nhiều nhất</option></select></div>{list.length?<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{list.map(product=><ProductCard key={product.id} p={product}/>)}</div>:<div className="card p-12 text-center"><h2 className="text-xl font-bold">Chưa có sản phẩm phù hợp</h2><p className="mt-2 text-gray-500">Hãy thử danh mục hoặc bộ lọc khác.</p></div>}</section></div></main>;
}
