import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="container flex min-h-[68vh] items-center justify-center py-12">
      <section className="card w-full max-w-md overflow-hidden shadow-lg">
        <div className="bg-[#073b78] px-7 py-7 text-center text-white">
          <h1 className="text-2xl font-extrabold">Chào mừng bạn trở lại</h1>
          <p className="mt-2 text-sm text-blue-100">Đăng nhập để mua sắm thuận tiện hơn</p>
        </div>
        <div className="p-7"><AuthForm mode="login" /></div>
      </section>
    </main>
  );
}
