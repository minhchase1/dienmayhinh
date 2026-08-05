import "server-only";

import type { Prisma } from "@prisma/client";
import type { Product } from "@/lib/data";

export const productInclude = {
  category: { select: { slug: true } },
  brand: { select: { name: true } },
  images: { orderBy: { position: "asc" as const }, select: { url: true } },
  specifications: { select: { name: true, value: true } },
  reviews: { where: { approved: true }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

type DatabaseProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toStoreProduct(product: DatabaseProduct): Product {
  const ratings = product.reviews.map((review) => review.rating);
  const rating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 5;
  const images = product.images.map((image) => image.url);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category: product.category.slug,
    brand: product.brand.name,
    price: Number(product.price),
    salePrice: Number(product.salePrice ?? product.price),
    stock: product.stock,
    image: images[0] ?? "/file.svg",
    images,
    badge: product.stock > 0 ? "Còn hàng" : "Tạm hết hàng",
    rating,
    reviews: ratings.length,
    warranty: product.specifications.find((item) => item.name.toLocaleLowerCase("vi").includes("bảo hành"))?.value ?? "Theo hãng",
    description: product.description ?? product.shortDescription ?? "",
    specs: Object.fromEntries(product.specifications.map((item) => [item.name, item.value])),
  };
}
