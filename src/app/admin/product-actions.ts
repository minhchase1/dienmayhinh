"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { deleteProductImages, uploadProductImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export type ProductActionState = { success?: boolean; message?: string; errors?: Record<string, string[]> };

const productSchema = z.object({
  name: z.string().trim().min(3, "Tên sản phẩm phải có ít nhất 3 ký tự.").max(180),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang."),
  sku: z.string().trim().min(2, "Vui lòng nhập mã sản phẩm.").max(50),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục."),
  brand: z.string().trim().min(2, "Vui lòng nhập thương hiệu.").max(80),
  price: z.coerce.number().int().positive("Giá niêm yết phải lớn hơn 0."),
  salePrice: z.coerce.number().int().positive("Giá bán phải lớn hơn 0."),
  stock: z.coerce.number().int().min(0, "Tồn kho không được âm."),
  shortDescription: z.string().trim().max(300),
  description: z.string().trim().min(10, "Mô tả chi tiết phải có ít nhất 10 ký tự."),
  visible: z.boolean(),
  specifications: z.string().trim().max(5000),
}).refine((data) => data.salePrice <= data.price, { path: ["salePrice"], message: "Giá bán không được cao hơn giá niêm yết." });

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Bạn không có quyền đăng sản phẩm.");
  return user;
}

function parseSpecifications(value: string) {
  return value.split(/\r?\n/).map((line) => {
    const separator = line.indexOf(":");
    if (separator < 1) return null;
    const name = line.slice(0, separator).trim();
    const specificationValue = line.slice(separator + 1).trim();
    return name && specificationValue ? { name, value: specificationValue } : null;
  }).filter((item): item is { name: string; value: string } => Boolean(item));
}

const allowedImages = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function saveImages(files: File[]) {
  const validFiles = files.filter((file) => file.size > 0);
  if (!validFiles.length) throw new Error("Vui lòng tải lên ít nhất một hình ảnh sản phẩm.");
  if (validFiles.length > 6) throw new Error("Mỗi sản phẩm được tải tối đa 6 hình ảnh.");
  const saved: { publicId: string; url: string }[] = [];
  try {
    for (const file of validFiles) {
      if (!allowedImages.has(file.type)) throw new Error("Ảnh chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF.");
      if (file.size > 4 * 1024 * 1024) throw new Error(`Ảnh “${file.name}” vượt quá giới hạn 4 MB.`);
      saved.push(await uploadProductImage(Buffer.from(await file.arrayBuffer()), randomUUID()));
    }
    return saved;
  } catch (error) {
    await deleteProductImages(saved.map((image) => image.url)).catch(() => undefined);
    throw error;
  }
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"), slug: formData.get("slug"), sku: formData.get("sku"), categoryId: formData.get("categoryId"),
    brand: formData.get("brand"), price: formData.get("price"), salePrice: formData.get("salePrice"), stock: formData.get("stock"),
    shortDescription: formData.get("shortDescription") ?? "", description: formData.get("description") ?? "",
    visible: formData.get("visible") === "on", specifications: formData.get("specifications") ?? "",
  });
}

export async function createProduct(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  let savedImages: { publicId: string; url: string }[] = [];
  try {
    const admin = await requireAdmin();
    const parsed = parseProductForm(formData);
    if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    savedImages = await saveImages(formData.getAll("images").filter((value): value is File => value instanceof File));
    const data = parsed.data;
    const brandSlug = slugify(data.brand);
    const product = await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: data.categoryId }, select: { id: true, slug: true } });
      if (!category) throw new Error("Danh mục đã chọn không tồn tại.");
      const brand = await tx.brand.upsert({ where: { slug: brandSlug }, update: { name: data.brand }, create: { name: data.brand, slug: brandSlug } });
      const created = await tx.product.create({ data: {
        name: data.name, slug: data.slug, sku: data.sku.toUpperCase(), price: data.price, salePrice: data.salePrice,
        stock: data.stock, shortDescription: data.shortDescription || null, description: data.description, visible: data.visible,
        categoryId: data.categoryId, brandId: brand.id,
        images: { create: savedImages.map((image, position) => ({ url: image.url, alt: data.name, position })) },
        specifications: { create: parseSpecifications(data.specifications) },
      } });
      if (data.stock > 0) await tx.inventoryMovement.create({ data: { productId: created.id, actorId: admin.id, type: "MANUAL_ADJUSTMENT", quantity: data.stock, stockAfter: data.stock, note: "Tồn kho ban đầu khi tạo sản phẩm" } });
      return { ...created, categorySlug: category.slug };
    });
    revalidatePath("/admin"); revalidatePath(`/danh-muc/${product.categorySlug}`); revalidatePath(`/san-pham/${product.slug}`); revalidatePath("/");
    return { success: true, message: "Đã đăng sản phẩm thành công." };
  } catch (error) {
    await deleteProductImages(savedImages.map((image) => image.url)).catch(() => undefined);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false, message: "Đường dẫn sản phẩm hoặc mã SKU đã được sử dụng." };
    console.error("Create product failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Không thể đăng sản phẩm." };
  }
}

export async function updateProduct(id: string, _state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  let newImages: { publicId: string; url: string }[] = [];
  try {
    const admin = await requireAdmin();
    const parsed = parseProductForm(formData);
    if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    const current = await prisma.product.findUnique({ where: { id }, select: { slug: true, stock: true, category: { select: { slug: true } }, images: { select: { url: true } } } });
    if (!current) return { success: false, message: "Sản phẩm không còn tồn tại." };
    const uploadedFiles = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
    if (uploadedFiles.length) newImages = await saveImages(uploadedFiles);
    const data = parsed.data;
    const brandSlug = slugify(data.brand);
    const result = await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: data.categoryId }, select: { slug: true } });
      if (!category) throw new Error("Danh mục đã chọn không tồn tại.");
      const brand = await tx.brand.upsert({ where: { slug: brandSlug }, update: { name: data.brand }, create: { name: data.brand, slug: brandSlug } });
      if (newImages.length) await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productSpecification.deleteMany({ where: { productId: id } });
      const product = await tx.product.update({ where: { id }, data: {
        name: data.name, slug: data.slug, sku: data.sku.toUpperCase(), price: data.price, salePrice: data.salePrice, stock: data.stock,
        shortDescription: data.shortDescription || null, description: data.description, visible: data.visible, categoryId: data.categoryId, brandId: brand.id,
        ...(newImages.length ? { images: { create: newImages.map((image, position) => ({ url: image.url, alt: data.name, position })) } } : {}),
        specifications: { create: parseSpecifications(data.specifications) },
      } });
      if (data.stock !== current.stock) await tx.inventoryMovement.create({ data: { productId: id, actorId: admin.id, type: "MANUAL_ADJUSTMENT", quantity: data.stock - current.stock, stockAfter: data.stock, note: "Điều chỉnh tồn kho trong quản trị sản phẩm" } });
      return { product, categorySlug: category.slug };
    });
    if (newImages.length) {
      await deleteProductImages(current.images.map((image) => image.url)).catch(error => console.error("Delete replaced Cloudinary images failed:", error));
    }
    revalidatePath("/admin"); revalidatePath(`/danh-muc/${current.category.slug}`); revalidatePath(`/danh-muc/${result.categorySlug}`); revalidatePath(`/san-pham/${current.slug}`); revalidatePath(`/san-pham/${result.product.slug}`); revalidatePath("/");
    return { success: true, message: "Đã cập nhật sản phẩm." };
  } catch (error) {
    await deleteProductImages(newImages.map((image) => image.url)).catch(() => undefined);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false, message: "Đường dẫn sản phẩm hoặc mã SKU đã được sử dụng." };
    console.error("Update product failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Không thể cập nhật sản phẩm." };
  }
}

export async function deleteProduct(id: string, _state: ProductActionState, _formData: FormData): Promise<ProductActionState> {
  try {
    void _state;
    void _formData;
    await requireAdmin();
    const product = await prisma.product.findUnique({ where: { id }, select: { slug: true, category: { select: { slug: true } }, images: { select: { url: true } } } });
    if (!product) return { success: false, message: "Sản phẩm không còn tồn tại." };
    await prisma.product.delete({ where: { id } });
    await deleteProductImages(product.images.map((image) => image.url)).catch(error => console.error("Delete Cloudinary product images failed:", error));
    revalidatePath("/admin"); revalidatePath(`/danh-muc/${product.category.slug}`); revalidatePath(`/san-pham/${product.slug}`); revalidatePath("/");
    return { success: true, message: "Đã xóa sản phẩm." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { success: false, message: "Không thể xóa sản phẩm đã phát sinh trong đơn hàng. Bạn có thể sửa và chuyển sang trạng thái ẩn." };
    console.error("Delete product failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Không thể xóa sản phẩm." };
  }
}
