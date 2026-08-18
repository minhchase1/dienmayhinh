import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeDefaultCategories } from "@/lib/categories";
import CategoryManager from "./category-manager";
import ProductManager from "./product-manager";
import OrderManager from "./order-manager";

export const metadata: Metadata = { title: "Quản lý danh mục" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  await initializeDefaultCategories();
  const [categories, products, orders] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, description: true, _count: { select: { products: true } } } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, sku: true, salePrice: true, price: true, stock: true, visible: true, shortDescription: true, description: true, categoryId: true, category: { select: { name: true } }, brand: { select: { name: true } }, images: { orderBy: { position: "asc" }, select: { url: true } }, specifications: { select: { name: true, value: true } } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, code: true, status: true, total: true, address: true, createdAt: true, paymentMethod: true, paymentStatus: true, paymentRequired: true, paidAmount: true, paymentReference: true, customer: { select: { name: true, phone: true } }, _count: { select: { items: true } } } }),
  ]);

  return (
    <main className="min-h-[70vh] bg-slate-100 py-8">
      <div className="container">
        <div className="mb-7">
          <p className="text-sm font-semibold text-[#18181b]">HINH ADMIN</p>
          <h1 className="mt-1 text-3xl font-black">Quản lý cửa hàng</h1>
          <p className="mt-2 text-gray-500">Theo dõi đơn hàng, sản phẩm và danh mục của cửa hàng.</p>
        </div>
        <OrderManager orders={orders.map(order => ({ id: order.id, code: order.code, status: order.status, total: Number(order.total), address: order.address, createdAt: order.createdAt.toISOString(), paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, paymentRequired: Number(order.paymentRequired), paidAmount: Number(order.paidAmount), paymentReference: order.paymentReference, customer: order.customer, itemCount: order._count.items }))}/>
        <ProductManager categories={categories.map(({ id, name }) => ({ id, name }))} products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug, sku: product.sku, category: product.category.name, categoryId: product.categoryId, brand: product.brand.name, price: Number(product.price), salePrice: Number(product.salePrice ?? product.price), stock: product.stock, visible: product.visible, shortDescription: product.shortDescription ?? "", description: product.description ?? "", specifications: product.specifications.map(item => `${item.name}: ${item.value}`).join("\n"), images: product.images.map(image => image.url) }))}/>
        <CategoryManager categories={categories.map((category) => ({
          ...category,
          productCount: category._count.products,
        }))} />
      </div>
    </main>
  );
}
