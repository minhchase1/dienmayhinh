import ProductCard from "@/components/product-card";
import { prisma } from "@/lib/prisma";
import { productInclude, toStoreProduct } from "@/lib/product-data";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = ((await searchParams).q ?? "").trim();
  const stored = query ? await prisma.product.findMany({ where: { visible: true, OR: [{ name: { contains: query, mode: "insensitive" } }, { sku: { contains: query, mode: "insensitive" } }, { brand: { name: { contains: query, mode: "insensitive" } } }, { category: { name: { contains: query, mode: "insensitive" } } }, { category: { slug: { contains: query, mode: "insensitive" } } }] }, include: productInclude }) : [];
  const list = stored.map(toStoreProduct);
  return <main className="container py-10"><h1 className="text-3xl font-black">Kết quả tìm kiếm</h1><p className="mt-2 text-gray-500">Tìm thấy {list.length} sản phẩm cho “{query}”</p>{list.length?<div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{list.map(product=><ProductCard p={product} key={product.id}/>)}</div>:<div className="card mt-6 p-16 text-center"><h2 className="text-xl font-bold">Không tìm thấy sản phẩm</h2><p className="mt-2 text-gray-500">Thử từ khóa ngắn hơn hoặc tên thương hiệu.</p></div>}</main>;
}
