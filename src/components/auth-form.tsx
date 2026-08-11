"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { login, register, type AuthState } from "@/app/auth-actions";

const initialState: AuthState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600" role="alert">{errors[0]}</p>;
}

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const isRegister = mode === "register";
  const [state, action, pending] = useActionState(isRegister ? register : login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {!isRegister && next && (
        <input type="hidden" name="next" value={next}/>
      )}
      {isRegister && (
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="name">Họ và tên</label>
          <div className="relative">
            <UserRound className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-[#18181b] focus:ring-2 focus:ring-zinc-200" id="name" name="name" autoComplete="name" placeholder="Nguyễn Văn An" required />
          </div>
          <FieldError errors={state.errors?.name} />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <input className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-[#18181b] focus:ring-2 focus:ring-zinc-200" id="email" name="email" type="email" autoComplete="email" placeholder="ban@example.com" required />
        </div>
        <FieldError errors={state.errors?.email} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="password">Mật khẩu</label>
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <input className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-12 outline-none transition focus:border-[#18181b] focus:ring-2 focus:ring-zinc-200" id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Ít nhất 8 ký tự" required />
          <button className="absolute right-3 top-3.5 text-gray-500" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <FieldError errors={state.errors?.password} />
      </div>

      {isRegister && (
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="confirmPassword">Nhập lại mật khẩu</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-[#18181b] focus:ring-2 focus:ring-zinc-200" id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required />
          </div>
          <FieldError errors={state.errors?.confirmPassword} />
        </div>
      )}

      {state.message && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.message}</p>}

      <button className="btn btn-blue w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
        {pending && <LoaderCircle className="animate-spin" size={19} />}
        {pending ? "Đang xử lý..." : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <Link className="font-bold text-[#18181b] hover:underline" href={isRegister ? "/dang-nhap" : "/dang-ky"}>
          {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
        </Link>
      </p>
    </form>
  );
}
