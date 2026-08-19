import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductManager from "../product-manager";
export const metadata: Metadata = { title: "Quản lý sản phẩm" };
export const dynamic = "force-dynamic";
export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, sku: true, salePrice: true, price: true, stock: true, visible: true, shortDescription: true, description: true, categoryId: true, category: { select: { name: true } }, brand: { select: { name: true } }, images: { orderBy: { position: "asc" }, select: { url: true } }, specifications: { select: { name: true, value: true } } } }),
  ]);
  return <ProductManager categories={categories} products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug, sku: product.sku, category: product.category.name, categoryId: product.categoryId, brand: product.brand.name, price: Number(product.price), salePrice: Number(product.salePrice ?? product.price), stock: product.stock, visible: product.visible, shortDescription: product.shortDescription ?? "", description: product.description ?? "", specifications: product.specifications.map(item => `${item.name}: ${item.value}`).join("\n"), images: product.images.map(image => image.url) }))}/>;
}
