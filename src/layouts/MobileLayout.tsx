import type { ReactNode } from "react";
import { ClipboardCheck, Heart, Home, KeyRound, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

interface MobileLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: "/", label: "Trang chủ", icon: Home },
  { path: "/doi-soat", label: "Đối soát", icon: ClipboardCheck },
  { path: "/cai-dat", label: "Cookie", icon: KeyRound },
] as const;

export const MobileLayout = ({ children }: MobileLayoutProps) => (
  <div className="relative min-h-screen overflow-x-hidden text-[#4f3b45]">
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-rose-200/35 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-100/40 blur-3xl" />
    </div>

    <header className="sticky top-0 z-40 border-b border-pink-100/80 bg-[#fff9fb]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-[0_8px_24px_rgba(219,107,145,.28)]">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-pink-400">
              Pleiku 03 <Sparkles className="h-3 w-3" />
            </span>
            <span className="block truncate text-base font-black tracking-tight text-[#573b47]">
              Audit Corner
            </span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 rounded-2xl border border-pink-100 bg-white/70 p-1.5 shadow-sm sm:flex">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition ${
                  isActive
                    ? "bg-pink-100 text-pink-700 shadow-sm"
                    : "text-[#765866] hover:bg-pink-50 hover:text-pink-700"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>

    <main className="relative z-10 pb-28 sm:pb-10">{children}</main>

    <nav className="fixed inset-x-3 bottom-3 z-50 mx-auto grid max-w-md grid-cols-3 rounded-[1.4rem] border border-pink-100 bg-white/90 p-1.5 shadow-[0_18px_50px_rgba(128,67,91,.18)] backdrop-blur-xl sm:hidden">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-extrabold transition ${
              isActive ? "bg-pink-100 text-pink-700" : "text-[#8b6a78]"
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  </div>
);
