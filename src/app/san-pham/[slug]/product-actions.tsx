'use client';
import {Product} from '@/lib/data';
import {useCart} from '@/components/cart-provider';
import {Phone,ShoppingCart,MessageCircle,GitCompare} from 'lucide-react';
import {useRouter} from 'next/navigation';

export default function ProductActions({p}:{p:Product}){
  const {add}=useCart();const router=useRouter();const unavailable=p.stock<=0;
  return <div className="grid grid-cols-2 gap-3 mt-5"><button disabled={unavailable} className="btn bg-red-600 text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={()=>{add(p);router.push('/gio-hang')}}>Mua ngay</button><button disabled={unavailable} className="btn btn-blue disabled:cursor-not-allowed disabled:opacity-50" onClick={()=>add(p)}><ShoppingCart size={19}/>{unavailable?'Hết hàng':'Thêm giỏ'}</button><a className="btn border border-[#18181b] text-[#18181b]" href="tel:0914845274"><Phone size={18}/>Gọi tư vấn</a><a className="btn border border-blue-500 text-blue-600" href="https://zalo.me/0914845274"><MessageCircle size={18}/>Chat Zalo</a><button className="col-span-2 text-sm text-gray-500 flex justify-center gap-2"><GitCompare size={17}/>Thêm vào so sánh</button></div>;
}
