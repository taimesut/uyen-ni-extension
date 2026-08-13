import { ArrowRight, ClipboardCheck, Flower2, Heart, KeyRound, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const HomePage = () => (
  <div className="app-page space-y-5 sm:space-y-7">
    <section className="relative overflow-hidden rounded-[2rem] border border-pink-100 bg-white/80 p-5 shadow-[0_22px_60px_rgba(181,93,126,.12)] backdrop-blur sm:p-8 lg:p-10">
      <div aria-hidden="true" className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-pink-100/80 blur-2xl" />
      <div aria-hidden="true" className="absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-rose-100/70 blur-2xl" />

      <div className="relative max-w-3xl">
        <span className="soft-kicker">
          <Sparkles className="h-3.5 w-3.5" /> Một góc nhỏ xinh
        </span>

        <div className="mt-5 flex items-start gap-3 sm:gap-4">
          <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pink-100 text-pink-600 sm:h-14 sm:w-14">
            <Flower2 className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-[#563c47] sm:text-4xl lg:text-5xl">
              Đối soát nhẹ nhàng hơn mỗi ngày 🌷
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#876b78] sm:text-base">
              Giao diện được giữ thật gọn để tập trung vào những đơn cần audit, với một chút sắc hồng dịu để làm việc đỡ khô khan hơn.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link to="/doi-soat" className="btn btn-primary min-h-12 rounded-2xl border-0 px-5 font-extrabold shadow-[0_10px_30px_rgba(219,107,145,.24)]">
            <ClipboardCheck className="h-5 w-5" />
            Mở đối soát
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/cai-dat" className="btn min-h-12 rounded-2xl border border-pink-100 bg-white px-5 font-extrabold text-pink-700 shadow-sm hover:bg-pink-50">
            <KeyRound className="h-5 w-5" />
            Cài đặt Cookie
          </Link>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      <Link to="/doi-soat" className="group soft-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(181,93,126,.13)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-600">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <ArrowRight className="h-5 w-5 text-pink-300 transition group-hover:translate-x-1 group-hover:text-pink-500" />
        </div>
        <h2 className="mt-5 text-xl font-black text-[#5b414c]">Đối soát đơn aging</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#8d707c]">
          Chỉ hiển thị nhóm 24H → 36H và &gt; 36H để tập trung audit đúng những đơn cần chú ý.
        </p>
      </Link>

      <Link to="/cai-dat" className="group soft-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(181,93,126,.13)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-100 text-pink-600">
            <KeyRound className="h-5 w-5" />
          </span>
          <ArrowRight className="h-5 w-5 text-pink-300 transition group-hover:translate-x-1 group-hover:text-pink-500" />
        </div>
        <h2 className="mt-5 text-xl font-black text-[#5b414c]">Cookie SPX</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#8d707c]">
          Một nơi duy nhất để lưu hoặc thay Cookie, không còn các cấu hình cũ làm rối giao diện.
        </p>
      </Link>
    </section>

    <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-pink-400">
      <Heart className="h-3.5 w-3.5 fill-current" />
      Pleiku 03 · simple, soft & focused
    </div>
  </div>
);
