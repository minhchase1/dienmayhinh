INSERT INTO "Brand" ("id", "name", "slug")
VALUES ('hinhhomebrand0000000000001', 'HINH Home', 'hinh-home')
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "Product" ("id", "name", "slug", "sku", "price", "salePrice", "stock", "shortDescription", "description", "visible", "categoryId", "brandId", "createdAt")
SELECT 'hinhhomewasher00000000001', 'Máy giặt cửa trước HINH Home 9 kg', 'may-giat-cua-truoc-hinhhome-9kg', 'HH-WM90-GR', 8990000, 7490000, 12,
  'Máy giặt cửa trước 9 kg, vận hành êm và phù hợp gia đình 3–5 người.',
  'Thiết kế cửa trước hiện đại với lồng giặt dung tích 9 kg. Nhiều chương trình giặt tiện dụng, chế độ giặt nhanh và khóa trẻ em giúp việc chăm sóc quần áo hằng ngày thuận tiện hơn.', true, c."id", b."id", CURRENT_TIMESTAMP
FROM "Category" c, "Brand" b WHERE c."slug" = 'may-giat' AND b."slug" = 'hinh-home'
ON CONFLICT ("sku") DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "price" = EXCLUDED."price", "salePrice" = EXCLUDED."salePrice", "stock" = EXCLUDED."stock", "shortDescription" = EXCLUDED."shortDescription", "description" = EXCLUDED."description", "visible" = true, "categoryId" = EXCLUDED."categoryId", "brandId" = EXCLUDED."brandId";

INSERT INTO "Product" ("id", "name", "slug", "sku", "price", "salePrice", "stock", "shortDescription", "description", "visible", "categoryId", "brandId", "createdAt")
SELECT 'hinhhomerefrigerator00001', 'Tủ lạnh HINH Home Inverter 350 lít', 'tu-lanh-hinhhome-inverter-350-lit', 'HH-RF350-SL', 12990000, 10990000, 8,
  'Tủ lạnh ngăn đá dưới 350 lít, tiết kiệm điện và bảo quản thực phẩm tiện lợi.',
  'Không gian lưu trữ rộng rãi với ngăn đá dưới dễ sử dụng. Công nghệ Inverter hỗ trợ vận hành ổn định, hệ thống làm lạnh đa chiều giúp nhiệt độ phân bố đồng đều.', true, c."id", b."id", CURRENT_TIMESTAMP
FROM "Category" c, "Brand" b WHERE c."slug" = 'tu-lanh' AND b."slug" = 'hinh-home'
ON CONFLICT ("sku") DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "price" = EXCLUDED."price", "salePrice" = EXCLUDED."salePrice", "stock" = EXCLUDED."stock", "shortDescription" = EXCLUDED."shortDescription", "description" = EXCLUDED."description", "visible" = true, "categoryId" = EXCLUDED."categoryId", "brandId" = EXCLUDED."brandId";

INSERT INTO "Product" ("id", "name", "slug", "sku", "price", "salePrice", "stock", "shortDescription", "description", "visible", "categoryId", "brandId", "createdAt")
SELECT 'hinhhometv000000000000001', 'Smart Tivi HINH Home 4K 55 inch', 'smart-tivi-hinhhome-4k-55-inch', 'HH-TV55-UHD', 11990000, 9990000, 15,
  'Smart TV 55 inch độ phân giải 4K, thiết kế viền mỏng và kho ứng dụng giải trí.',
  'Màn hình 55 inch 4K sắc nét phù hợp phòng khách hiện đại. Thiết kế viền mỏng, kết nối Wi-Fi, Bluetooth, HDMI và USB đáp ứng nhu cầu xem phim, nghe nhạc và trình chiếu.', true, c."id", b."id", CURRENT_TIMESTAMP
FROM "Category" c, "Brand" b WHERE c."slug" = 'tivi' AND b."slug" = 'hinh-home'
ON CONFLICT ("sku") DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "price" = EXCLUDED."price", "salePrice" = EXCLUDED."salePrice", "stock" = EXCLUDED."stock", "shortDescription" = EXCLUDED."shortDescription", "description" = EXCLUDED."description", "visible" = true, "categoryId" = EXCLUDED."categoryId", "brandId" = EXCLUDED."brandId";

DELETE FROM "ProductImage" WHERE "productId" IN (SELECT "id" FROM "Product" WHERE "sku" IN ('HH-WM90-GR', 'HH-RF350-SL', 'HH-TV55-UHD'));
DELETE FROM "ProductSpecification" WHERE "productId" IN (SELECT "id" FROM "Product" WHERE "sku" IN ('HH-WM90-GR', 'HH-RF350-SL', 'HH-TV55-UHD'));

INSERT INTO "ProductImage" ("id", "url", "alt", "position", "productId") SELECT 'hinhhomeimgwasher00000001', '/uploads/products/may-giat-hinhhome-9kg.png', "name", 0, "id" FROM "Product" WHERE "sku" = 'HH-WM90-GR';
INSERT INTO "ProductImage" ("id", "url", "alt", "position", "productId") SELECT 'hinhhomeimgfridge00000001', '/uploads/products/tu-lanh-hinhhome-350l.png', "name", 0, "id" FROM "Product" WHERE "sku" = 'HH-RF350-SL';
INSERT INTO "ProductImage" ("id", "url", "alt", "position", "productId") SELECT 'hinhhomeimgtv0000000000001', '/uploads/products/tivi-hinhhome-55-4k.png', "name", 0, "id" FROM "Product" WHERE "sku" = 'HH-TV55-UHD';

INSERT INTO "ProductSpecification" ("id", "name", "value", "productId")
SELECT 'hhspecwm' || row_number() OVER (), s.name, s.value, p."id" FROM "Product" p CROSS JOIN (VALUES ('Khối lượng giặt','9 kg'),('Kiểu máy','Cửa trước'),('Tốc độ vắt','1200 vòng/phút'),('Màu sắc','Xám than'),('Bảo hành','24 tháng')) AS s(name,value) WHERE p."sku"='HH-WM90-GR';
INSERT INTO "ProductSpecification" ("id", "name", "value", "productId")
SELECT 'hhspecrf' || row_number() OVER (), s.name, s.value, p."id" FROM "Product" p CROSS JOIN (VALUES ('Dung tích sử dụng','350 lít'),('Kiểu tủ','Ngăn đá dưới'),('Công nghệ','Inverter'),('Màu sắc','Bạc'),('Bảo hành','24 tháng')) AS s(name,value) WHERE p."sku"='HH-RF350-SL';
INSERT INTO "ProductSpecification" ("id", "name", "value", "productId")
SELECT 'hhspectv' || row_number() OVER (), s.name, s.value, p."id" FROM "Product" p CROSS JOIN (VALUES ('Kích thước màn hình','55 inch'),('Độ phân giải','4K UHD'),('Kết nối','Wi-Fi, Bluetooth, HDMI, USB'),('Thiết kế','Viền mỏng'),('Bảo hành','24 tháng')) AS s(name,value) WHERE p."sku"='HH-TV55-UHD';
