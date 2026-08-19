"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { saveAddress, updateProfile, type AccountState } from "./actions";

const initialState: AccountState = {};
function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) { return <button disabled={pending} className="btn btn-blue disabled:opacity-50">{pending && <LoaderCircle className="animate-spin" size={17}/>} {children}</button>; }
function Feedback({ state }: { state: AccountState }) { useEffect(() => { if (state.message) (state.success ? toast.success : toast.error)(state.message); }, [state]); return null; }
const inputClass = "mt-1 w-full rounded-lg border p-3 outline-none focus:border-zinc-700";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  return <form action={action} className="card p-5"><Feedback state={state}/><h2 className="text-xl font-bold">Thông tin cá nhân</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-semibold">Họ và tên</span><input name="name" defaultValue={name} required className={inputClass}/></label><label><span className="text-sm font-semibold">Email đăng nhập</span><input value={email} readOnly className={`${inputClass} bg-gray-100 text-gray-500`}/></label></div><div className="mt-4"><Submit pending={pending}>Lưu hồ sơ</Submit></div></form>;
}

type EditableAddress = { id: string; label: string; recipientName: string; phone: string; city: string; district: string; ward: string; address: string; isDefault: boolean };
export function AddressForm({ address }: { address?: EditableAddress }) {
  const [state, action, pending] = useActionState(saveAddress, initialState);
  return <form action={action} className={address ? "mt-4 border-t pt-4" : "card p-5"}><Feedback state={state}/>{address && <input type="hidden" name="addressId" value={address.id}/>}<h2 className={address ? "font-bold" : "text-xl font-bold"}>{address ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ nhận hàng"}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field name="label" label="Tên địa chỉ" placeholder="Nhà riêng, Công ty..." value={address?.label}/><Field name="recipientName" label="Tên người nhận" value={address?.recipientName}/><Field name="phone" label="Số điện thoại" type="tel" value={address?.phone}/><Field name="city" label="Tỉnh / Thành phố" value={address?.city}/><Field name="district" label="Quận / Huyện" value={address?.district}/><Field name="ward" label="Phường / Xã" value={address?.ward}/><Field name="address" label="Địa chỉ chi tiết" wide value={address?.address}/></div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" defaultChecked={address?.isDefault}/> Dùng làm địa chỉ mặc định</label><div className="mt-4"><Submit pending={pending}>{address ? "Cập nhật" : "Lưu địa chỉ"}</Submit></div></form>;
}
function Field({ name, label, type = "text", placeholder, wide, value }: { name: string; label: string; type?: string; placeholder?: string; wide?: boolean; value?: string }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="text-sm font-semibold">{label}</span><input name={name} type={type} placeholder={placeholder} defaultValue={value} required className={inputClass}/></label>; }
