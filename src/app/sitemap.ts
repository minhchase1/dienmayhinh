import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dienmayhinh.vn";
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.product.findMany({ where: { visible: true }, select: { slug: true, createdAt: true } }),
  ]);
  return [
    { url: base, priority: 1 },
    { url: `${base}/danh-muc/khuyen-mai`, priority: 0.8 },
    ...categories.map(category => ({ url: `${base}/danh-muc/${category.slug}`, priority: 0.8 })),
    ...products.map(product => ({ url: `${base}/san-pham/${product.slug}`, priority: 0.7, lastModified: product.createdAt })),
  ];
}
