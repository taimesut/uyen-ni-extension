import {
  ArrowRight,
  ClipboardCheck,
  Database,
  KeyRound,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";

export const HomePage = () => (
  <div className="app-page space-y-5 sm:space-y-6">
    <section className="surface-card p-5 sm:p-7 lg:p-8">
      <div className="max-w-3xl">
        <span className="soft-kicker">Audit workspace</span>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] text-[#44373d] sm:text-4xl lg:text-5xl">
          Theo dõi và đối soát dữ liệu vận hành rõ ràng hơn.
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#786970] sm:text-base">
          Tổng hợp dữ liệu aging từ Google Sheet và dữ liệu FMS từ SPX để hỗ trợ tra cứu Trip, TO, SPX Tracking Number và lịch sử status nhanh hơn.
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
            to="/fms"
            className="btn min-h-11 rounded-xl border border-[#e6d9de] bg-white px-5 font-bold text-[#8f4d63] shadow-none hover:bg-[#faf4f6]"
          >
            <Database className="h-4.5 w-4.5" />
            Xem dữ liệu FMS
          </Link>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
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
          Xem các đơn thuộc nhóm 24H → 36H và &gt; 36H từ sheet raw, có tìm kiếm và lọc nhanh.
        </p>
      </Link>

      <Link
        to="/fms"
        className="group surface-card p-5 transition hover:border-[#dcb8c4] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e5ea] text-[#a64e6b]">
            <Database className="h-5 w-5" />
          </span>
          <ArrowRight className="h-5 w-5 text-[#b89aa5] transition group-hover:translate-x-0.5 group-hover:text-[#a64e6b]" />
        </div>
        <h2 className="mt-4 text-lg font-black text-[#493a40]">Dữ liệu FMS</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#796970]">
          Lấy danh sách đơn từ FMS và ghép lịch sử status, timestamp theo từng SPX Tracking Number.
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
          Lưu và cập nhật SPX Cookie trên thiết bị hiện tại để sử dụng cho dữ liệu FMS.
        </p>
      </Link>
    </section>

    <footer className="flex flex-col items-center justify-center gap-1 py-2 text-center text-xs font-medium text-[#927e87] sm:flex-row sm:gap-2">
      <span>Audit workspace</span>
      <span className="hidden sm:inline" aria-hidden="true">·</span>
      <a
        href="mailto:uyenni.nguyentran@spxexpress.com"
        className="inline-flex items-center gap-1.5 font-semibold text-[#8f4d63] hover:underline"
      >
        <Mail className="h-3.5 w-3.5" />
        uyenni.nguyentran@spxexpress.com
      </a>
    </footer>
  </div>
);
