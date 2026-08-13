import { ArrowRight, ClipboardCheck, Database, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

export const HomePage = () => (
  <div className="app-page space-y-5 sm:space-y-6">
    <section className="surface-card p-5 sm:p-7 lg:p-8">
      <div className="max-w-3xl">
        <span className="soft-kicker">Pleiku 03 Audit</span>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] text-[#44373d] sm:text-4xl lg:text-5xl">
          Đối soát gọn, rõ và dễ theo dõi.
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#786970] sm:text-base">
          Tập trung vào dữ liệu aging cần audit, giữ giao diện tối giản và dùng màu hồng chỉ như một điểm nhấn.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/doi-soat"
            className="btn btn-primary min-h-11 rounded-xl border-0 px-5 font-bold shadow-sm"
          >
            <ClipboardCheck className="h-4.5 w-4.5" />
            Mở đối soát
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/cai-dat"
            className="btn min-h-11 rounded-xl border border-[#e6d9de] bg-white px-5 font-bold text-[#8f4d63] shadow-none hover:bg-[#faf4f6]"
          >
            <KeyRound className="h-4.5 w-4.5" />
            Cài đặt Cookie
          </Link>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      <Link
        to="/doi-soat"
        className="group surface-card p-5 transition hover:border-[#dcb8c4] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e5ea] text-[#a64e6b]">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <ArrowRight className="h-5 w-5 text-[#b89aa5] transition group-hover:translate-x-0.5 group-hover:text-[#a64e6b]" />
        </div>
        <h2 className="mt-4 text-lg font-black text-[#493a40]">Đối soát aging</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#796970]">
          Theo dõi riêng hai nhóm 24H → 36H và &gt; 36H, có tìm kiếm và lọc nhanh theo aging.
        </p>
      </Link>

      <Link
        to="/cai-dat"
        className="group surface-card p-5 transition hover:border-[#dcb8c4] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e5ea] text-[#a64e6b]">
            <KeyRound className="h-5 w-5" />
          </span>
          <ArrowRight className="h-5 w-5 text-[#b89aa5] transition group-hover:translate-x-0.5 group-hover:text-[#a64e6b]" />
        </div>
        <h2 className="mt-4 text-lg font-black text-[#493a40]">Cookie SPX</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#796970]">
          Một chỗ duy nhất để lưu hoặc thay Cookie SPX trên thiết bị hiện tại.
        </p>
      </Link>
    </section>

    <div className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-[#9c858e]">
      <Database className="h-3.5 w-3.5" />
      Pleiku 03 · Audit workspace
    </div>
  </div>
);
