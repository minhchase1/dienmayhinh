"use client";

import Link from "next/link";
import { Bell, ChevronDown, LayoutDashboard, LogIn, LogOut, MapPin, Menu, PackageSearch, Search, ShoppingCart, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/auth-actions";
import { deleteAllNotifications, markNotificationsRead, openOrderNotification } from "@/app/notification-actions";
import { useCart } from "./cart-provider";

type HeaderUser = { name: string; email: string; role: string } | null;
type HeaderCategory = { slug: string; name: string };
type HeaderNotification = { id: string; title: string; message: string; read: boolean; createdAt: string; orderId: string | null };

export default function Header({ user, categories, notifications }: { user: HeaderUser; categories: HeaderCategory[]; notifications: HeaderNotification[] }) {
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const router = useRouter();
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const unreadCount = notifications.filter(notification => !notification.read).length;

  function search() {
    const value = query.trim();
    if (value) router.push(`/tim-kiem?q=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <div className="bg-[#09090b] text-sm text-white">
        <div className="container flex justify-between py-2">
          <span>Miễn phí giao hàng & lắp đặt tại Bình Sơn</span>
          <div className="desktop flex gap-5">
            <Link href="/chinh-sach/bao-hanh">Chính sách bảo hành</Link>
            <span className="flex gap-1"><MapPin size={16} />274 Phạm Văn Đồng</span>
            <a href="tel:0914845274">Hotline: 0914 845 274</a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#18181b] text-white shadow">
        <div className="container flex items-center gap-4 py-4">
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Mở menu"><Menu /></button>
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="grid h-11 w-11 place-content-center rounded-xl bg-[#ffd21c] text-xl font-black text-[#18181b]">H</div>
            <div><b className="text-xl">ĐIỆN MÁY HINH</b><small className="desktop block text-zinc-300">Giá tốt cho mọi nhà</small></div>
          </Link>

          <form className="desktop relative flex-1" onSubmit={(event) => { event.preventDefault(); search(); }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl bg-white py-3 pl-4 pr-12 text-gray-900 outline-none" placeholder="Bạn cần tìm sản phẩm gì?" />
            <button className="absolute right-1 top-1 rounded-lg bg-[#ffd21c] p-2 text-black" aria-label="Tìm kiếm"><Search /></button>
          </form>

          <Link href="/tra-cuu" className="desktop flex items-center gap-2"><PackageSearch /><span className="text-sm">Tra cứu<br /><b>đơn hàng</b></span></Link>
          {user ? (
            user.role === "ADMIN" ? <Link href="/admin" className="desktop flex items-center gap-2" title={user.email}><LayoutDashboard size={21}/><span className="text-sm font-semibold">Quản trị</span></Link> : <Link href="/tai-khoan" className="desktop flex max-w-36 items-center gap-2 rounded-lg p-2 hover:bg-white/10" title="Xem tài khoản"><UserRound size={21} /><span className="truncate text-sm font-semibold">{user.name}</span></Link>
          ) : (
            <Link href="/dang-nhap" className="desktop flex items-center gap-1 text-sm font-semibold"><LogIn size={21} />Đăng nhập</Link>
          )}

          {user && <div className="relative">
            <button type="button" onClick={() => setNotificationOpen(value => !value)} className="relative grid h-10 w-10 place-content-center rounded-lg hover:bg-white/10" aria-label="Thông báo" aria-expanded={notificationOpen}><Bell size={22}/>{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-content-center rounded-full bg-red-500 px-1 text-xs">{unreadCount > 9 ? "9+" : unreadCount}</span>}</button>
            {notificationOpen && <div className="absolute right-0 top-12 z-50 w-[min(90vw,380px)] overflow-hidden rounded-xl border bg-white text-gray-900 shadow-2xl">
              <div className="border-b p-4"><div className="flex items-center justify-between gap-3"><b>Thông báo</b>{unreadCount > 0 && <form action={markNotificationsRead}><button className="text-xs font-semibold text-[#18181b]">Đánh dấu đã đọc</button></form>}</div>{notifications.length > 0 && <form action={deleteAllNotifications} className="mt-2 text-right"><button className="text-xs font-semibold text-red-600 hover:underline">Xóa tất cả thông báo</button></form>}</div>
              <div className="max-h-96 overflow-y-auto">{notifications.map(notification => {
                const content = <div className="flex gap-2 text-left"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-gray-300" : "bg-zinc-800"}`}/><div><b className="text-sm">{notification.title}</b><p className="mt-1 text-sm text-gray-600">{notification.message}</p><small className="mt-2 block text-gray-400">{new Date(notification.createdAt).toLocaleString("vi-VN")}</small></div></div>;
                return notification.orderId
                  ? <form action={openOrderNotification.bind(null, notification.id, notification.orderId)} className={`border-b last:border-0 ${notification.read ? "bg-white" : "bg-zinc-100"}`} key={notification.id}><button className="block w-full p-4 hover:bg-zinc-200">{content}</button></form>
                  : <div className={`border-b p-4 last:border-0 ${notification.read ? "bg-white" : "bg-zinc-100"}`} key={notification.id}>{content}</div>;
              })}{!notifications.length && <p className="p-8 text-center text-sm text-gray-500">Bạn chưa có thông báo mới.</p>}</div>
            </div>}
          </div>}

          <Link href="/gio-hang" className="relative flex items-center gap-2">
            <ShoppingCart /><b className="desktop">Giỏ hàng</b>
            <span className="absolute -right-2 -top-3 grid h-5 w-5 place-content-center rounded-full bg-red-500 text-xs">{cartCount}</span>
          </Link>

          {user && (
            <form action={logout}>
              <button className="flex items-center gap-1 rounded-lg border border-zinc-400 px-2.5 py-2 text-sm font-semibold hover:bg-white/10" title="Đăng xuất">
                <LogOut size={20} /><span className="desktop">Đăng xuất</span>
              </button>
            </form>
          )}
        </div>

        <div className="container pb-3 md:hidden">
          <form className="relative" onSubmit={(event) => { event.preventDefault(); search(); }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg bg-white p-3 text-black" placeholder="Tìm sản phẩm..." />
          </form>
          {!user && <Link className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" href="/dang-nhap"><LogIn size={18} />Đăng nhập / Đăng ký</Link>}
          {user?.role === "ADMIN" && <Link className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" href="/admin"><LayoutDashboard size={18}/>Quản trị danh mục</Link>}
          {user && user.role !== "ADMIN" && <Link className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" href="/tai-khoan"><UserRound size={18}/>Tài khoản của tôi</Link>}
        </div>
      </header>

      <nav className={`${open ? "block" : "desktop"} relative z-30 border-b bg-white`}>
        <div className="container relative flex flex-wrap">
          <button type="button" onClick={() => setCategoryOpen(value => !value)} className="flex items-center gap-2 bg-[#ffd21c] px-4 py-3 font-bold hover:bg-[#f5c900]" aria-expanded={categoryOpen} aria-controls="category-menu">
            <Menu size={20} />Danh mục sản phẩm<ChevronDown size={17} className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`}/>
          </button>
          {categories.slice(0, 7).map((category) => <Link className="px-4 py-3 text-sm font-semibold hover:bg-zinc-100 hover:text-[#18181b]" key={category.slug} href={`/danh-muc/${category.slug}`}>{category.name}</Link>)}
          {categoryOpen && <div id="category-menu" className="absolute left-0 top-full z-50 grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-b-xl border bg-white p-2 shadow-xl sm:grid-cols-2 md:grid-cols-3">
            {categories.map(category => <Link onClick={() => { setCategoryOpen(false); setOpen(false); }} className="rounded-lg px-4 py-3 text-sm font-semibold hover:bg-zinc-100 hover:text-[#18181b]" key={category.slug} href={`/danh-muc/${category.slug}`}>{category.name}</Link>)}
            {!categories.length && <span className="px-4 py-3 text-sm text-gray-500">Chưa có danh mục sản phẩm.</span>}
          </div>}
        </div>
      </nav>
    </>
  );
}
