import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Đăng ký" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="container flex min-h-[68vh] items-center justify-center py-12">
      <section className="card w-full max-w-md overflow-hidden shadow-lg">
        <div className="bg-[#18181b] px-7 py-7 text-center text-white">
          <h1 className="text-2xl font-extrabold">Tạo tài khoản</h1>
          <p className="mt-2 text-sm text-zinc-300">Đăng ký nhanh để theo dõi và đặt hàng</p>
        </div>
        <div className="p-7"><AuthForm mode="register" /></div>
      </section>
    </main>
  );
}
