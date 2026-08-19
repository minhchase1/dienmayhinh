import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { initializeDefaultCategories } from "@/lib/categories";
import CategoryManager from "../category-manager";
export const metadata: Metadata = { title: "Quản lý danh mục" };
export const dynamic = "force-dynamic";
export default async function CategoriesPage() {
  await initializeDefaultCategories();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, description: true, _count: { select: { products: true } } } });
  return <CategoryManager categories={categories.map(category => ({ ...category, productCount: category._count.products }))}/>;
}
