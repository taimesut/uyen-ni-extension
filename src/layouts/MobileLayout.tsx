import { ClipboardCheck, House, KeyRound, Menu, Package, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ToggleTheme from "../components/ToggleTheme";
import { getSoc } from "../utils/config";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: "/", label: "Trang Chủ", icon: House },
  { path: "/doi-soat", label: "Đối soát", icon: ClipboardCheck },
  { path: "/cai-dat", label: "Cài đặt Cookie", icon: KeyRound },
] as const;

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const location = useLocation();
  const currentSoc = getSoc() || "PLEIKU 03";

  const closeDrawer = () => {
    const checkbox = document.getElementById(
      "mobile-sidebar-drawer",
    ) as HTMLInputElement | null;
    if (checkbox) checkbox.checked = false;
  };

  const toggleDrawer = () => {
    const checkbox = document.getElementById(
      "mobile-sidebar-drawer",
    ) as HTMLInputElement | null;
    if (checkbox) checkbox.checked = !checkbox.checked;
  };

  return (
    <div className="drawer app-shell min-h-screen bg-base-100 font-sans relative overflow-x-clip">
      <input
        id="mobile-sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
      />

      <div className="drawer-content flex min-h-screen min-w-0 flex-col relative z-10">
        <header className="navbar h-14 min-h-14 bg-base-100/90 backdrop-blur-md border-b border-base-200 sticky top-0 z-40 w-full px-2 sm:px-3 md:px-6">
          <div className="flex-none">
            <button
              type="button"
              onClick={toggleDrawer}
              aria-label="Mở menu"
              className="btn btn-square btn-ghost drawer-button relative z-50 min-h-11 min-w-11 touch-manipulation rounded-xl p-2"
            >
              <Menu className="pointer-events-none h-6 w-6" />
            </button>
          </div>

          <div className="mx-1 min-w-0 flex-1 px-1 sm:mx-2 sm:px-2 font-black text-base sm:text-lg md:text-xl tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-primary/10 text-primary rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            <span className="truncate" title={currentSoc}>
              <span className="text-primary font-black">SPX</span>{" "}
              <span className="align-middle">{currentSoc}</span>
            </span>
          </div>

          <div className="flex-none flex items-center gap-2">
            <ToggleTheme />
          </div>
        </header>

        <main className="app-main min-w-0 flex-1 bg-base-200/40 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-12">
          {children}
        </main>
      </div>

      <div className="drawer-side z-50">
        <label
          htmlFor="mobile-sidebar-drawer"
          aria-label="Đóng menu"
          className="drawer-overlay"
        />

        <div className="menu bg-base-100 text-base-content min-h-full w-[min(86vw,20rem)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 flex flex-col shadow-2xl">
          <div className="space-y-5">
            <div className="pb-4 border-b border-base-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-primary-content font-bold shadow-md">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-base block leading-tight">
                    Ops FTE
                  </span>
                  <span className="text-xs text-base-content/60 font-medium">
                    {currentSoc}
                  </span>
                </div>
              </div>

              <label
                htmlFor="mobile-sidebar-drawer"
                className="btn btn-sm btn-circle btn-ghost min-h-11 min-w-11"
              >
                <X className="w-4 h-4" />
              </label>
            </div>

            <ul className="space-y-1.5 text-sm font-semibold">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeDrawer}
                      className={`flex min-h-11 items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary text-primary-content font-bold shadow-xs"
                          : "hover:bg-base-200 text-base-content/80"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
