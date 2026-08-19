import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Toaster } from "sonner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categories as fallbackCategories } from "@/lib/data";

const beVietnamPro = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--font-be-vietnam-pro" });
export const metadata: Metadata = { title: { default: "Điện máy Hinh – Giá tốt cho mọi nhà", template: "%s | Điện máy Hinh" }, description: "Điện máy, điện lạnh chính hãng tại Bình Sơn, Quảng Ngãi.", openGraph: { title: "Điện máy Hinh", description: "Điện máy chính hãng – Giá tốt cho mọi nhà", type: "website" } };

async function getHeaderCategories() {
  try {
    const stored = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } });
    if (stored.length) return stored;
  } catch (error) {
    console.error("Could not load categories for header:", error);
  }
  return fallbackCategories.map(([slug, name]) => ({ slug, name }));
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, categories] = await Promise.all([getCurrentUser(), getHeaderCategories()]);
  const notifications = user ? await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, message: true, readAt: true, createdAt: true, orderId: true } }) : [];
  return <html lang="vi"><body className={beVietnamPro.variable}><CartProvider><Header user={user ? { name: user.name, email: user.email, role: user.role } : null} categories={categories} notifications={notifications.map(notification => ({ id: notification.id, title: notification.title, message: notification.message, read: Boolean(notification.readAt), createdAt: notification.createdAt.toISOString(), orderId: notification.orderId }))}/>{children}<Footer/><Toaster richColors position="top-center"/></CartProvider></body></html>;
}
