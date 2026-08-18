export const COD_DEPOSIT = 200_000;

export const paymentMethods = {
  COD: "COD",
  BANK_TRANSFER: "BANK_TRANSFER",
  PAY_AT_STORE: "PAY_AT_STORE",
} as const;

export type PaymentMethod = (typeof paymentMethods)[keyof typeof paymentMethods];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (cọc 200.000đ)",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  PAY_AT_STORE: "Thanh toán tại cửa hàng",
};

export function requiredPrepayment(method: PaymentMethod, total: number) {
  if (method === paymentMethods.COD) return Math.min(COD_DEPOSIT, total);
  if (method === paymentMethods.BANK_TRANSFER) return total;
  return 0;
}

export function paymentLabel(method: string) {
  return paymentMethodLabels[method as PaymentMethod] ?? method;
}

export function bankTransferConfig() {
  const bankId = process.env.BANK_ID?.trim();
  const accountNo = process.env.BANK_ACCOUNT_NO?.trim();
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim();
  return bankId && accountNo && accountName ? { bankId, accountNo, accountName } : null;
}

export function vietQrUrl(amount: number, reference: string) {
  const bank = bankTransferConfig();
  if (!bank) return null;
  const base = `https://img.vietqr.io/image/${encodeURIComponent(bank.bankId)}-${encodeURIComponent(bank.accountNo)}-compact2.png`;
  const query = new URLSearchParams({ amount: String(amount), addInfo: reference, accountName: bank.accountName });
  return `${base}?${query}`;
}
