"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, deleteSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthState = {
  errors?: Partial<Record<"name" | "email" | "password" | "confirmPassword", string[]>>;
  message?: string;
};

const emailSchema = z.string().trim().toLowerCase().email("Email không hợp lệ.");
const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
  .regex(/[A-Za-z]/, "Mật khẩu phải có ít nhất một chữ cái.")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số.");

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự.").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp.",
  });

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Vui lòng nhập mật khẩu.") });

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const result = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const existingUser = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (existingUser) return { errors: { email: ["Email này đã được đăng ký."] } };

  try {
    const user = await prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        passwordHash: await hash(result.data.password, 12),
      },
    });
    await createSession(user.id);
  } catch (error) {
    console.error("Register failed:", error);
    return { message: "Không thể tạo tài khoản lúc này. Vui lòng thử lại." };
  }

  redirect("/");
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (!user || !(await compare(result.data.password, user.passwordHash))) {
    return { message: "Email hoặc mật khẩu không chính xác." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/dang-nhap");
}
