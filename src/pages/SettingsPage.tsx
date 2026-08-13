import { CheckCircle2, KeyRound, Save, ShieldCheck, Trash2 } from "lucide-react";
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
          <span className="soft-kicker">
            <KeyRound className="h-3.5 w-3.5" /> Private setting
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#563c47] sm:text-4xl">
            Cài đặt Cookie
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#8c707c]">
            Chỉ còn một cấu hình duy nhất: SPX Cookie. Gọn, dễ thay và không lẫn với những thiết lập cũ.
          </p>
        </section>

        <section className="soft-card overflow-hidden">
          <div className="border-b border-pink-100 bg-gradient-to-r from-pink-50/80 to-rose-50/60 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-pink-600 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-black text-[#5b414c]">SPX Cookie</h2>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#947783]">
                    Cookie được lưu cục bộ trên trình duyệt của thiết bị đang sử dụng.
                  </p>
                </div>
              </div>

              {cookies.trim() ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-black text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã nhập
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[0.68rem] font-black text-amber-700">
                  Chưa có
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <label htmlFor="spx-cookie" className="block text-sm font-extrabold text-[#6d4f5c]">
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
              className="textarea min-h-52 w-full resize-y rounded-2xl border-pink-100 bg-pink-50/45 p-4 font-mono text-xs leading-6 text-[#5f4651] outline-none transition placeholder:text-pink-300 focus:border-pink-300 focus:bg-white"
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClear}
                disabled={!cookies.trim()}
                className="btn min-h-11 rounded-2xl border border-pink-100 bg-white px-4 font-extrabold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Xóa Cookie
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary min-h-11 rounded-2xl border-0 px-5 font-extrabold shadow-[0_10px_28px_rgba(219,107,145,.2)]"
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
