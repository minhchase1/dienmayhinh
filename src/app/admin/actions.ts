"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CategoryActionState = {
  success?: boolean;
  message?: string;
  errors?: Partial<Record<"name" | "slug" | "description", string[]>>;
};

const categorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục phải có ít nhất 2 ký tự.").max(80, "Tên danh mục tối đa 80 ký tự."),
  slug: z.string().trim().toLowerCase().min(2, "Đường dẫn phải có ít nhất 2 ký tự.").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Chỉ dùng chữ thường không dấu, số và dấu gạch ngang."),
  description: z.string().trim().max(300, "Mô tả tối đa 300 ký tự."),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Bạn không có quyền thực hiện thao tác này.");
}

function values(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
  };
}

function refreshCategoryPages(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/danh-muc/${slug}`);
}

function databaseError(error: unknown): CategoryActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { success: false, errors: { slug: ["Đường dẫn này đã được sử dụng."] } };
  }
  console.error("Category mutation failed:", error);
  return { success: false, message: error instanceof Error ? error.message : "Không thể lưu danh mục. Vui lòng thử lại." };
}

export async function createCategory(_state: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(values(formData));
    if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
    await prisma.category.create({ data: { ...parsed.data, description: parsed.data.description || null } });
    refreshCategoryPages(parsed.data.slug);
    return { success: true, message: "Đã thêm danh mục mới." };
  } catch (error) {
    return databaseError(error);
  }
}

export async function updateCategory(id: string, _state: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(values(formData));
    if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
    const previous = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
    if (!previous) return { success: false, message: "Danh mục không còn tồn tại." };
    await prisma.category.update({ where: { id }, data: { ...parsed.data, description: parsed.data.description || null } });
    refreshCategoryPages(previous.slug);
    refreshCategoryPages(parsed.data.slug);
    return { success: true, message: "Đã cập nhật danh mục." };
  } catch (error) {
    return databaseError(error);
  }
}

export async function deleteCategory(id: string, _state: CategoryActionState, _formData: FormData): Promise<CategoryActionState> {
  try {
    void _state;
    void _formData;
    await requireAdmin();
    const category = await prisma.category.findUnique({
      where: { id },
      select: { slug: true, _count: { select: { products: true } } },
    });
    if (!category) return { success: false, message: "Danh mục không còn tồn tại." };
    if (category._count.products > 0) {
      return { success: false, message: `Không thể xóa: danh mục đang có ${category._count.products} sản phẩm.` };
    }
    await prisma.category.delete({ where: { id } });
    refreshCategoryPages(category.slug);
    return { success: true, message: "Đã xóa danh mục." };
  } catch (error) {
    return databaseError(error);
  }
}
