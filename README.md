# Điện máy Hinh

Website bán hàng điện máy bằng Next.js 16, TypeScript, PostgreSQL và Prisma. Storefront chỉ hiển thị và nhận đặt các sản phẩm thật đang có trong database.

## Chạy local

```bash
npm install
npm run db:setup
npm run dev
```

Sao chép `.env.example` thành `.env` và thay toàn bộ giá trị mẫu trước khi chạy. Dashboard quản trị nằm tại `/admin`.

## Database production

Các migration được commit trong `prisma/migrations`. Quy trình triển khai:

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
npm start
```

`db:seed` tạo/cập nhật danh mục mặc định. Tài khoản quản trị đầu tiên chỉ được tạo khi có `ADMIN_INITIAL_EMAIL` và `ADMIN_INITIAL_PASSWORD`; mật khẩu phải dài ít nhất 12 ký tự và được băm bằng bcrypt. Sau lần seed đầu, nên xóa các biến mật khẩu khởi tạo khỏi môi trường triển khai.

Luôn sao lưu database trước khi chạy migration production. Dùng một tài khoản PostgreSQL riêng cho ứng dụng, bật SSL theo yêu cầu của nhà cung cấp và chạy `npm run db:deploy` như một bước release duy nhất, không chạy đồng thời trên nhiều instance.

## Đơn hàng và tồn kho

- Checkout đọc lại sản phẩm, giá và tồn kho từ PostgreSQL.
- Tồn kho được giữ trong transaction `Serializable` với cập nhật có điều kiện, tránh bán vượt số lượng.
- Sản phẩm trùng trong payload được gộp trước khi kiểm tra kho.
- Hủy đơn hoàn kho đúng một lần.
- Mọi lần giữ, hoàn và điều chỉnh kho được ghi vào `InventoryMovement`.
- Mọi thay đổi trạng thái đơn được ghi vào `OrderStatusEvent`.

Vòng đời hợp lệ: `PENDING → CONFIRMED → PREPARING → SHIPPING → COMPLETED`. Admin có thể hủy đơn chưa hoàn tất và bắt buộc nhập lý do.

## Bảo mật tra cứu

Khách chưa đăng nhập phải nhập đúng cả mã đơn hàng và số điện thoại. Người đăng nhập có thể mở bằng mã đơn nếu đơn thuộc tài khoản của họ. Không hỗ trợ liệt kê toàn bộ đơn chỉ từ một số điện thoại.

## Ảnh và triển khai

Ảnh upload hiện lưu trong `public/uploads/products`, phù hợp khi chạy trên máy chủ có ổ đĩa bền vững. Với serverless hoặc nhiều instance, cần chuyển sang Cloudinary/S3 trước khi vận hành. Khai báo `NEXT_PUBLIC_SITE_URL` bằng domain production để sitemap sinh đúng URL.
