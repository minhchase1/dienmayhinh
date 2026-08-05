import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeDefaultCategories } from "@/lib/categories";
import CategoryManager from "./category-manager";
import ProductManager from "./product-manager";

export const metadata: Metadata = { title: "Quản lý danh mục" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  await initializeDefaultCategories();
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, description: true, _count: { select: { products: true } } } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, sku: true, salePrice: true, price: true, stock: true, visible: true, shortDescription: true, description: true, categoryId: true, category: { select: { name: true } }, brand: { select: { name: true } }, images: { orderBy: { position: "asc" }, select: { url: true } }, specifications: { select: { name: true, value: true } } } }),
  ]);

  return (
    <main className="min-h-[70vh] bg-slate-100 py-8">
      <div className="container">
        <div className="mb-7">
          <p className="text-sm font-semibold text-[#073b78]">HINH ADMIN</p>
          <h1 className="mt-1 text-3xl font-black">Quản lý danh mục sản phẩm</h1>
          <p className="mt-2 text-gray-500">Thêm, chỉnh sửa và xóa nhóm sản phẩm hiển thị trên cửa hàng.</p>
        </div>
        <ProductManager categories={categories.map(({ id, name }) => ({ id, name }))} products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug, sku: product.sku, category: product.category.name, categoryId: product.categoryId, brand: product.brand.name, price: Number(product.price), salePrice: Number(product.salePrice ?? product.price), stock: product.stock, visible: product.visible, shortDescription: product.shortDescription ?? "", description: product.description ?? "", specifications: product.specifications.map(item => `${item.name}: ${item.value}`).join("\n"), images: product.images.map(image => image.url) }))}/>
        <CategoryManager categories={categories.map((category) => ({
          ...category,
          productCount: category._count.products,
        }))} />
      </div>
    </main>
  );
}
