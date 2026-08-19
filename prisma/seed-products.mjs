import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";

const { PrismaClient } = prismaClientPackage;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const products = [
  { sku: "HH-WM90-GR", slug: "may-giat-cua-truoc-hinhhome-9kg", name: "Máy giặt cửa trước HINH Home 9 kg", category: "may-giat", price: 8_990_000, salePrice: 7_490_000, stock: 12, image: "/uploads/products/may-giat-hinhhome-9kg.png", short: "Máy giặt cửa trước 9 kg, vận hành êm và phù hợp gia đình 3–5 người.", description: "Thiết kế cửa trước hiện đại với lồng giặt dung tích 9 kg. Nhiều chương trình giặt tiện dụng, chế độ giặt nhanh và khóa trẻ em giúp việc chăm sóc quần áo hằng ngày thuận tiện hơn.", specs: [["Khối lượng giặt", "9 kg"], ["Kiểu máy", "Cửa trước"], ["Tốc độ vắt", "1200 vòng/phút"], ["Màu sắc", "Xám than"], ["Bảo hành", "24 tháng"]] },
  { sku: "HH-RF350-SL", slug: "tu-lanh-hinhhome-inverter-350-lit", name: "Tủ lạnh HINH Home Inverter 350 lít", category: "tu-lanh", price: 12_990_000, salePrice: 10_990_000, stock: 8, image: "/uploads/products/tu-lanh-hinhhome-350l.png", short: "Tủ lạnh ngăn đá dưới 350 lít, tiết kiệm điện và bảo quản thực phẩm tiện lợi.", description: "Không gian lưu trữ rộng rãi với ngăn đá dưới dễ sử dụng. Công nghệ Inverter hỗ trợ vận hành ổn định, hệ thống làm lạnh đa chiều giúp nhiệt độ phân bố đồng đều.", specs: [["Dung tích sử dụng", "350 lít"], ["Kiểu tủ", "Ngăn đá dưới"], ["Công nghệ", "Inverter"], ["Màu sắc", "Bạc"], ["Bảo hành", "24 tháng"]] },
  { sku: "HH-TV55-UHD", slug: "smart-tivi-hinhhome-4k-55-inch", name: "Smart Tivi HINH Home 4K 55 inch", category: "tivi", price: 11_990_000, salePrice: 9_990_000, stock: 15, image: "/uploads/products/tivi-hinhhome-55-4k.png", short: "Smart TV 55 inch độ phân giải 4K, thiết kế viền mỏng và kho ứng dụng giải trí.", description: "Màn hình 55 inch 4K sắc nét phù hợp phòng khách hiện đại. Thiết kế viền mỏng, kết nối Wi-Fi, Bluetooth, HDMI và USB đáp ứng nhu cầu xem phim, nghe nhạc và trình chiếu.", specs: [["Kích thước màn hình", "55 inch"], ["Độ phân giải", "4K UHD"], ["Kết nối", "Wi-Fi, Bluetooth, HDMI, USB"], ["Thiết kế", "Viền mỏng"], ["Bảo hành", "24 tháng"]] },
];

try {
  const brand = await prisma.brand.upsert({ where: { slug: "hinh-home" }, update: { name: "HINH Home" }, create: { name: "HINH Home", slug: "hinh-home" } });
  for (const item of products) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: item.category } });
    const product = await prisma.product.upsert({ where: { sku: item.sku }, update: { name: item.name, slug: item.slug, price: item.price, salePrice: item.salePrice, stock: item.stock, visible: true, shortDescription: item.short, description: item.description, categoryId: category.id, brandId: brand.id }, create: { name: item.name, slug: item.slug, sku: item.sku, price: item.price, salePrice: item.salePrice, stock: item.stock, visible: true, shortDescription: item.short, description: item.description, categoryId: category.id, brandId: brand.id } });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productSpecification.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({ data: { productId: product.id, url: item.image, alt: item.name, position: 0 } });
    await prisma.productSpecification.createMany({ data: item.specs.map(([name, value]) => ({ productId: product.id, name, value })) });
    console.log(`Published: ${item.name}`);
  }
} finally {
  await prisma.$disconnect();
}
