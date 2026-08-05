import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/product-card";
import { products, categories } from "@/lib/data";
import {
  Snowflake,
  Refrigerator,
  WashingMachine,
  Tv,
  Wind,
  ShieldCheck,
  Truck,
  Headphones,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
const icons = [
  Snowflake,
  Refrigerator,
  WashingMachine,
  Wind,
  Tv,
  ShieldCheck,
  Refrigerator,
  Wind,
];
export default function Home() {
  return (
    <main id="top">
      <section className="bg-gradient-to-br from-[#073b78] via-[#07509d] to-[#021c35] text-white overflow-hidden">
        <div className="container grid md:grid-cols-[.9fr_1.1fr] min-h-[470px] items-center py-12 gap-10">
          <div className="relative z-10">
            <span className="inline-block bg-[#ffd21c] text-black font-bold rounded-full px-4 py-2">
              Tận tâm phục vụ gia đình Việt
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.08] mt-5">
              ĐIỆN MÁY
              <br />
              <span className="text-[#ffd21c]">CHÍNH HÃNG</span>
            </h1>
            <p className="text-xl text-blue-100 mt-5">
              Giá minh bạch · Giao lắp tận tâm · Bảo hành chính hãng
            </p>
            <Link href="/danh-muc/khuyen-mai" className="btn btn-primary mt-7">
              Khám phá sản phẩm <ChevronRight />
            </Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-blue-300/20 blur-3xl rounded-full" />
            <div className="relative aspect-[3/2] overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl">
              <Image
                src="/cua-hang-dien-may-hinh.png"
                alt="Mặt tiền cửa hàng Điện máy Hinh tại Bình Sơn, Quảng Ngãi"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#021c35]/95 to-transparent pt-20 pb-5 px-6">
                <b className="text-lg md:text-xl">
                  Điện máy Hinh – Uy tín từ cửa hàng gia đình
                </b>
                <span className="block text-sm text-blue-100 mt-1">
                  274 Phạm Văn Đồng, Bình Sơn, Quảng Ngãi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container -mt-5 relative z-10">
        <div className="card grid grid-cols-2 md:grid-cols-4 divide-x p-5 shadow-lg">
          {[
            [BadgeCheck, "Hàng chính hãng", "Nguồn gốc rõ ràng"],
            [Truck, "Giao lắp tận nơi", "Nhanh chóng, chu đáo"],
            [ShieldCheck, "Bảo hành uy tín", "Đúng tiêu chuẩn hãng"],
            [Headphones, "Tư vấn tận tâm", "Hotline 0914 845 274"],
          ].map(([I, t, d], i) => {
            const Icon = I as typeof BadgeCheck;
            return (
              <div key={i} className="flex gap-3 items-center px-3 py-2">
                <Icon className="text-[#073b78]" size={30} />
                <div>
                  <b className="block">{t as string}</b>
                  <small className="text-gray-500">{d as string}</small>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="container py-12">
        <div className="flex justify-between items-end mb-5">
          <div>
            <span className="text-[#073b78] font-bold">MUA SẮM DỄ DÀNG</span>
            <h2 className="text-2xl md:text-3xl font-black">
              Danh mục nổi bật
            </h2>
          </div>
          <Link
            href="/danh-muc/khuyen-mai"
            className="text-[#073b78] font-bold"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-8 gap-3">
          {categories.slice(0, 8).map((c, i) => {
            const I = icons[i];
            return (
              <Link
                href={"/danh-muc/" + c[0]}
                key={c[0]}
                className="card p-4 text-center hover:border-[#073b78] hover:-translate-y-1 transition"
              >
                <I className="mx-auto text-[#073b78]" size={36} />
                <b className="block text-sm mt-3">{c[1]}</b>
              </Link>
            );
          })}
        </div>
      </section>
      <Section
        title="Sản phẩm khuyến mãi"
        subtitle="GIÁ SỐC HÔM NAY"
        list={products.slice(0, 8)}
      />
      <section className="container my-12 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#ffd21c] p-8">
          <span className="font-bold">MÁY LẠNH CHÍNH HÃNG</span>
          <h2 className="text-3xl font-black mt-2">
            Mát nhanh, tiết kiệm điện
          </h2>
          <p className="mt-3">Miễn phí công lắp đặt trong khu vực.</p>
          <Link
            href="/danh-muc/may-lanh"
            className="btn bg-black text-white mt-5"
          >
            Mua ngay
          </Link>
        </div>
        <div className="rounded-2xl bg-[#073b78] text-white p-8">
          <span className="font-bold text-blue-200">TỦ LẠNH INVERTER</span>
          <h2 className="text-3xl font-black mt-2">Tươi ngon trọn vị</h2>
          <p className="mt-3">Bảo hành chính hãng, giao hàng tận nơi.</p>
          <Link href="/danh-muc/tu-lanh" className="btn btn-primary mt-5">
            Khám phá
          </Link>
        </div>
      </section>
      <Section
        title="Máy lạnh bán chạy"
        subtitle="MÁT LẠNH CẢ NHÀ"
        list={products.filter((p) => p.category === "may-lanh")}
      />
      <Section
        title="Tủ lạnh & Máy giặt nổi bật"
        subtitle="TIẾT KIỆM ĐIỆN"
        list={products
          .filter((p) => ["tu-lanh", "may-giat"].includes(p.category))
          .slice(0, 4)}
      />
      <section className="container py-12">
        <h2 className="text-3xl font-black">Kinh nghiệm hay</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-5">
          {[
            "Cách chọn công suất máy lạnh phù hợp",
            "5 bí quyết chọn tủ lạnh tiết kiệm điện",
            "Hướng dẫn vệ sinh máy giặt tại nhà",
          ].map((x, i) => (
            <article className="card overflow-hidden" key={x}>
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-300 grid place-content-center text-6xl">
                {["❄️", "🧊", "🫧"][i]}
              </div>
              <div className="p-5">
                <small className="text-[#073b78] font-bold">
                  TƯ VẤN MUA SẮM
                </small>
                <h3 className="font-bold text-lg mt-2">{x}</h3>
                <p className="text-gray-500 mt-2">
                  Những lưu ý thiết thực giúp gia đình sử dụng thiết bị hiệu quả
                  và an toàn.
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
function Section({
  title,
  subtitle,
  list,
}: {
  title: string;
  subtitle: string;
  list: typeof products;
}) {
  return (
    <section className="container py-8">
      <span className="text-[#073b78] font-bold">{subtitle}</span>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl md:text-3xl font-black">{title}</h2>
        <Link href="/danh-muc/khuyen-mai" className="text-[#073b78] font-bold">
          Xem tất cả →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
