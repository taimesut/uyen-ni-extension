import { CheckCircle2, KeyRound, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { showToast } from "../components/Toast";
import { getConfigs, saveConfigs } from "../utils/config";

export const SettingsPage = () => {
  const [cookies, setCookies] = useState(() => getConfigs().cookies || "");

  const handleSave = () => {
    const normalizedCookies = cookies.trim();
    const currentConfig = getConfigs();

    saveConfigs({
      ...currentConfig,
      cookies: normalizedCookies,
    });

    setCookies(normalizedCookies);
    showToast(
      normalizedCookies ? "Đã lưu SPX Cookie." : "Đã xóa SPX Cookie.",
      normalizedCookies ? "success" : "info",
    );
  };

  const handleClear = () => {
    const currentConfig = getConfigs();
    saveConfigs({
      ...currentConfig,
      cookies: "",
    });
    setCookies("");
    showToast("Đã xóa SPX Cookie.", "info");
  };

  return (
    <div className="app-page mx-auto max-w-3xl space-y-5 text-base-content md:space-y-6">
      <PageHeader
        icon={KeyRound}
        title="Cài đặt Cookie"
        description="Chỉ lưu SPX Cookie dùng để xác thực các yêu cầu tới SPX."
      />

      <section className="app-surface space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor="spx-cookie"
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <KeyRound className="h-4 w-4" />
            SPX Cookie
          </label>

          {cookies.trim() ? (
            <span className="badge badge-success gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã nhập
            </span>
          ) : (
            <span className="badge badge-warning">Chưa có Cookie</span>
          )}
        </div>

        <textarea
          id="spx-cookie"
          value={cookies}
          onChange={(event) => setCookies(event.target.value)}
          rows={8}
          autoComplete="off"
          spellCheck={false}
          placeholder="Dán Cookie của tài khoản SPX tại đây..."
          className="textarea textarea-bordered w-full rounded-xl font-mono text-xs leading-relaxed focus:textarea-primary"
        />

        <p className="text-xs leading-relaxed text-base-content/60">
          Cookie được lưu trong cấu hình trình duyệt hiện tại. Khi thay Cookie mới,
          bấm Lưu Cookie trước khi sử dụng chức năng cần xác thực SPX.
        </p>

        <div className="grid gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={handleClear}
            disabled={!cookies.trim()}
            className="btn min-h-11 rounded-xl btn-ghost text-error sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Xóa Cookie
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn min-h-11 rounded-xl btn-primary sm:w-auto"
          >
            <Save className="h-4 w-4" />
            Lưu Cookie
          </button>
        </div>
      </section>
    </div>
  );
};
