import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = prismaClientPackage;
const { hash } = bcrypt;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const categories = [
  ["may-lanh", "Máy lạnh"], ["tu-lanh", "Tủ lạnh"], ["may-giat", "Máy giặt"],
  ["may-say", "Máy sấy"], ["tivi", "Tivi"], ["may-nuoc-nong", "Máy nước nóng"],
  ["tu-dong", "Tủ đông, tủ mát"], ["quat-dien", "Quạt điện"], ["noi-com-dien", "Nồi cơm điện"],
  ["bep-tu", "Bếp từ, bếp gas"], ["may-loc-nuoc", "Máy lọc nước"], ["may-hut-bui", "Máy hút bụi"],
  ["gia-dung", "Đồ gia dụng"], ["phu-kien", "Phụ kiện"],
];

try {
  for (const [slug, name] of categories) await prisma.category.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  const email = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  const name = process.env.ADMIN_INITIAL_NAME?.trim() || "Quản trị viên";
  if (email && password) {
    if (password.length < 12) throw new Error("ADMIN_INITIAL_PASSWORD must contain at least 12 characters");
    const passwordHash = await hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { name, role: "ADMIN", passwordHash },
      create: { name, email, role: "ADMIN", passwordHash },
    });
    console.log(`Seeded categories and admin ${email}`);
  } else {
    console.log("Seeded categories. Admin was skipped because ADMIN_INITIAL_EMAIL/PASSWORD are not set.");
  }
} finally {
  await prisma.$disconnect();
}
