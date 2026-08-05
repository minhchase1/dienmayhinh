# Điện máy Hinh

Website bán hàng điện máy, điện lạnh bằng Next.js, TypeScript và Tailwind CSS. Bản demo có 24 sản phẩm minh họa, giỏ hàng lưu trên trình duyệt và quy trình đặt hàng mô phỏng nên chạy được ngay cả khi chưa cấu hình dịch vụ ngoài.

## Chạy nhanh

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Dashboard mẫu ở `/admin`.

## Biến môi trường và PostgreSQL

Sao chép `.env.example` thành `.env`, cập nhật `DATABASE_URL` và `AUTH_SECRET`. Tạo database PostgreSQL rồi chạy:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Schema nằm tại `prisma/schema.prisma`. Dữ liệu giao diện hiện nằm tại `src/lib/data.ts`; khi tích hợp thật, thay lớp dữ liệu này bằng Prisma queries. Mật khẩu quản trị phải được băm bằng bcrypt/argon2, không lưu văn bản thuần. Dùng Auth.js credentials hoặc OAuth và middleware kiểm tra vai trò `ADMIN` cho `/admin`.

## Hình ảnh và dịch vụ ngoài

Ảnh demo dùng Unsplash. Khi vận hành, cấu hình Cloudinary bằng các biến trong `.env.example`, lưu URL ảnh vào `ProductImage`. Form đặt hàng hiện mô phỏng phía trình duyệt; production cần API route kiểm tra Zod, lấy lại giá từ database trong transaction, tạo `Order`/`OrderItem`, không tin giá gửi từ client.

## Kiến trúc

- `src/app`: route storefront, checkout, chính sách và admin.
- `src/components`: header, footer, product card, cart provider.
- `src/lib/data.ts`: 24 sản phẩm demo và danh mục.
- `prisma/schema.prisma`: các model dữ liệu chính.

Sitemap và robots được tạo bởi `src/app/sitemap.ts` và `robots.ts`. Metadata mặc định nằm trong layout; nên thêm metadata động theo dữ liệu database cho từng sản phẩm khi triển khai.

## Tài khoản quản trị

Sau khi nối Auth.js, tạo script seed dùng mật khẩu lấy từ biến môi trường, băm trước khi lưu. Tuyệt đối không commit mật khẩu hoặc `.env`.

## Triển khai

1. Đẩy mã nguồn lên GitHub.
2. Tạo PostgreSQL trên Neon, Supabase hoặc dịch vụ tương đương.
3. Import dự án vào Vercel, khai báo các biến môi trường.
4. Chạy migration production bằng `npx prisma migrate deploy`.
5. Cấu hình domain, Cloudinary và cập nhật `NEXT_PUBLIC_SITE_URL`.

> Tất cả sản phẩm, giá và đánh giá hiện là dữ liệu minh họa. Điện máy Hinh không tự nhận là đại lý chính thức của các thương hiệu được đề cập.
