import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { BrandMark } from '../brand/BrandMark';

export function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#051424] text-[#d4e4fa] light:bg-[#F8FAFC] light:text-[#0F172A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <BrandMark className="w-12 h-12" />
          <span className="font-headline font-bold text-2xl tracking-tight">
            <span className="text-[#d4e4fa] light:text-slate-900">Campus</span>
            <span className="text-[#3b9eff]">Flow</span>
          </span>
        </Link>
        <p className="mt-2 text-[11px] text-[#8e8fa3] uppercase tracking-wider font-semibold light:text-slate-500">
          Organize · Engage · Grow
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#122131] border border-[#273647]/80 rounded-xl p-6 sm:p-8 shadow-sm light:bg-white light:border-[#E2E8F0]">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}
