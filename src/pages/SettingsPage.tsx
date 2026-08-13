import { CheckCircle2,Save, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { showToast } from "../components/Toast";
import { getConfigs, saveConfigs } from "../utils/config";

export const SettingsPage = () => {
  const [cookies, setCookies] = useState(() => getConfigs().cookies);

  const handleSave = () => {
    const normalizedCookies = cookies.trim();
    saveConfigs({ cookies: normalizedCookies });
    setCookies(normalizedCookies);
    showToast(
      normalizedCookies ? "Đã lưu SPX Cookie." : "Đã xóa SPX Cookie.",
      normalizedCookies ? "success" : "info",
    );
  };

  const handleClear = () => {
    if (!cookies.trim()) return;
    if (!window.confirm("Xóa SPX Cookie đang lưu trên thiết bị này?")) return;
    saveConfigs({ cookies: "" });
    setCookies("");
    showToast("Đã xóa SPX Cookie.", "info");
  };

  return (
    <div className="app-page">
      <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
        <section>
          <span className="soft-kicker">Cấu hình</span>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#44373d] sm:text-4xl">
            Cài đặt Cookie
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#786970]">
            Lưu SPX Cookie dùng cho các yêu cầu cần xác thực trên thiết bị hiện tại.
          </p>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-[#eadde2] bg-[#faf7f8] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e5d7dc] bg-white text-[#a64e6b]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-black text-[#493a40]">SPX Cookie</h2>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#817078]">
                    Cookie được lưu cục bộ trong trình duyệt của thiết bị đang sử dụng.
                  </p>
                </div>
              </div>

              {cookies.trim() ? (
                <span className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã nhập
                </span>
              ) : (
                <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-[0.68rem] font-bold text-amber-700">
                  Chưa có
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <label htmlFor="spx-cookie" className="block text-sm font-bold text-[#57474e]">
              Cookie của tài khoản SPX
            </label>
            <textarea
              id="spx-cookie"
              value={cookies}
              onChange={(event) => setCookies(event.target.value)}
              rows={9}
              autoComplete="off"
              spellCheck={false}
              placeholder="Dán Cookie SPX tại đây..."
              className="textarea min-h-52 w-full resize-y rounded-xl border-[#e6d9de] bg-[#fcfafb] p-4 font-mono text-xs leading-6 text-[#493d42] outline-none transition placeholder:text-[#b79da7] focus:border-[#c98ba0] focus:bg-white"
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClear}
                disabled={!cookies.trim()}
                className="btn min-h-11 rounded-xl border border-[#e6d9de] bg-white px-4 font-bold text-rose-700 shadow-none hover:bg-rose-50 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Xóa Cookie
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary min-h-11 rounded-xl border-0 px-5 font-bold shadow-sm"
              >
                <Save className="h-4 w-4" />
                Lưu Cookie
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
