import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#051424] text-[#d4e4fa] light:bg-[#F8FAFC] light:text-[#0F172A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0047FF] flex items-center justify-center text-white shadow-sm">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 9L29 14.5V25.5L20 31L11 25.5V14.5L20 9Z" stroke="#7bd0ff" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M20 15L24.5 17.5V22.5L20 25L15.5 22.5V17.5L20 15Z" fill="#7bd0ff"/>
            </svg>
          </div>
          <span className="font-headline font-bold text-2xl text-[#d4e4fa] tracking-tight light:text-slate-900">
            CampusFlow
          </span>
        </Link>
        <p className="mt-2 text-[11px] text-[#8e8fa3] uppercase tracking-wider font-semibold light:text-slate-500">
          OS for Student Organizations
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
