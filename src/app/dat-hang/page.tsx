import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckoutForm, { type SavedAddress } from "./checkout-form";

export default async function Checkout() {
  const user = await getCurrentUser();
  const addresses = user ? await prisma.userAddress.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], select: { id: true, label: true, recipientName: true, phone: true, city: true, district: true, ward: true, address: true, isDefault: true } }) : [];
  return <CheckoutForm user={user ? { name: user.name, email: user.email } : null} addresses={addresses satisfies SavedAddress[]}/>;
}
