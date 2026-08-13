import type { ReactNode } from "react";
import { ClipboardCheck, Home, KeyRound } from "lucide-react";
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
  <div className="min-h-screen bg-[#faf8f9] text-[#41363b]">
    <header className="sticky top-0 z-40 border-b border-[#eadde2] bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c45d7c] text-white shadow-sm">
            <ClipboardCheck className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#a76579]">
              SPX Operations
            </span>
            <span className="block truncate text-base font-black tracking-tight text-[#45373d]">
              Audit workspace
            </span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 rounded-xl border border-[#eadde2] bg-[#fcfafb] p-1 sm:flex">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-bold transition ${
                  isActive
                    ? "bg-[#f3e5ea] text-[#9f4664]"
                    : "text-[#6d5d64] hover:bg-white hover:text-[#9f4664]"
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

    <main className="pb-24 sm:pb-10">{children}</main>

    <nav className="fixed inset-x-3 bottom-3 z-50 mx-auto grid max-w-md grid-cols-3 rounded-2xl border border-[#eadde2] bg-white/95 p-1.5 shadow-[0_12px_35px_rgba(75,55,64,.12)] backdrop-blur-xl sm:hidden">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] font-bold transition ${
              isActive ? "bg-[#f3e5ea] text-[#9f4664]" : "text-[#796971]"
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
