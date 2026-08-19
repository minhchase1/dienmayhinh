import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminNav from "./admin-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return <main className="min-h-[70vh] bg-slate-100 py-8"><div className="container"><div className="mb-6"><p className="text-sm font-semibold text-zinc-700">HINH ADMIN</p><AdminNav/></div>{children}</div></main>;
}
