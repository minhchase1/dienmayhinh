import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import ProductCard from "@/components/product-card";
import { money, products } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { productInclude, toStoreProduct } from "@/lib/product-data";
import ProductActions from "./product-actions";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stored = await prisma.product.findFirst({ where: { slug, visible: true }, include: productInclude });
  const product = stored ? toStoreProduct(stored) : products.find((item) => item.slug === slug);
  if (!product) notFound();
  const imageGallery = product.images?.length ? product.images : [product.image];
  const discount = Math.max(0, Math.round((1 - product.salePrice / product.price) * 100));
  const relatedStored = await prisma.product.findMany({ where: { visible: true, category: { slug: product.category }, slug: { not: product.slug } }, take: 4, include: productInclude });
  const related = [...relatedStored.map(toStoreProduct), ...products.filter((item) => item.category === product.category && item.slug !== product.slug)].slice(0, 4);

  return <main className="container py-8"><div className="text-sm text-gray-500"><Link href="/">Trang chủ</Link> / <Link href={`/danh-muc/${product.category}`}>Danh mục</Link> / {product.name}</div><div className="card mt-5 grid gap-8 p-5 md:grid-cols-2 md:p-8"><div><div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50"><Image src={product.image} alt={product.name} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-cover"/></div><div className="mt-3 grid grid-cols-4 gap-3">{imageGallery.slice(0,4).map((image,index)=><div key={image} className="relative aspect-square overflow-hidden rounded-lg border"><Image src={image} fill sizes="120px" alt={`${product.name} - ảnh ${index+1}`} className="object-cover"/></div>)}</div></div><div><span className="font-bold text-[#18181b]">{product.brand} · Mã: {product.sku}</span><h1 className="mt-2 text-3xl font-black">{product.name}</h1><div className="mt-3 flex flex-wrap gap-2"><span className="flex items-center gap-1"><Star fill="#fbbf24" color="#fbbf24" size={18}/><b>{product.rating.toFixed(1)}</b></span><span className="text-gray-400">{product.reviews} đánh giá</span><span className={`font-bold ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>● {product.stock > 0 ? "Còn hàng" : "Tạm hết hàng"}</span></div><div className="mt-5 rounded-xl bg-red-50 p-5"><del className="text-gray-500">{money(product.price)}</del><div className="flex items-center gap-3"><strong className="text-3xl text-red-600">{money(product.salePrice)}</strong>{discount>0&&<span className="rounded bg-red-600 px-2 text-white">-{discount}%</span>}</div><small>Giá đã bao gồm VAT</small></div><div className="mt-5 rounded-xl border border-yellow-300 bg-yellow-50 p-5"><b>🎁 Khuyến mãi đi kèm</b><ul className="ml-5 mt-2 list-disc space-y-2 text-sm"><li>Miễn phí giao hàng trong khu vực Bình Sơn</li><li>Hỗ trợ công lắp đặt tiêu chuẩn</li><li>Trả góp 0% qua thẻ tín dụng</li></ul></div><ProductActions p={product}/><div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">{[[Truck,"Giao tận nơi"],[ShieldCheck,"Bảo hành hãng"],[RotateCcw,"Đổi trả dễ"]].map(([Icon,label])=>{const ItemIcon=Icon as typeof Truck;return <div className="rounded-lg border p-3" key={label as string}><ItemIcon className="mx-auto text-[#18181b]"/><span>{label as string}</span></div>})}</div></div></div><section className="card mt-8 p-6 md:p-8"><h2 className="text-2xl font-black">Thông tin sản phẩm</h2><p className="mt-4 whitespace-pre-line leading-7 text-gray-600">{product.description}</p><h2 className="mt-8 text-2xl font-black">Thông số kỹ thuật</h2><div className="mt-4 max-w-2xl">{Object.entries(product.specs).map(([name,value],index)=><div className={`grid grid-cols-2 p-3 ${index%2?"bg-white":"bg-gray-100"}`} key={name}><b>{name}</b><span>{value}</span></div>)}</div></section>{related.length>0&&<section className="mt-10"><h2 className="mb-5 text-2xl font-black">Sản phẩm tương tự</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map(item=><ProductCard key={item.id} p={item}/>)}</div></section>}</main>;
}
