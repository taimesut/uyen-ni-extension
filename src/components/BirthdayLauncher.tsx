import { useEffect, useMemo, useState } from "react";

const BIRTHDAY_EMAIL = "uyenni.nguyentran@spxexpress.com";
const BIRTHDAY_MONTH_INDEX = 7;
const BIRTHDAY_DAY = 16;
const DISPLAY_MS = 18_000;
const FADE_MS = 1_200;

interface CurrentUserProfile {
  allowed?: boolean;
  email?: string;
}

interface BirthdayGasRunner {
  withSuccessHandler(handler: (value: unknown) => void): BirthdayGasRunner;
  withFailureHandler(handler: () => void): BirthdayGasRunner;
  getCurrentUserProfile(): void;
}

interface BirthdayWindow {
  google?: {
    script?: {
      run?: BirthdayGasRunner;
    };
  };
}

const COLORS = ["#ff7aa2", "#ffd166", "#7dd3fc", "#a78bfa", "#86efac", "#f9a8d4"];

const isBirthdayToday = () => {
  const now = new Date();
  return now.getMonth() === BIRTHDAY_MONTH_INDEX && now.getDate() === BIRTHDAY_DAY;
};

const getBirthdayRunner = (): BirthdayGasRunner | undefined => {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as BirthdayWindow).google?.script?.run;
};

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const BirthdayLauncher = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const confetti = useMemo(
    () =>
      Array.from({ length: 72 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        delay: `${((index * 17) % 45) / 10}s`,
        duration: `${6 + ((index * 13) % 35) / 10}s`,
        color: COLORS[index % COLORS.length],
        width: `${6 + (index % 5)}px`,
        height: `${10 + (index % 7)}px`,
      })),
    [],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: index,
        left: `${(index * 29) % 100}%`,
        top: `${(index * 41) % 90}%`,
        delay: `${((index * 11) % 30) / 10}s`,
        size: `${2 + (index % 4)}px`,
      })),
    [],
  );

  useEffect(() => {
    if (!isBirthdayToday()) return;

    const runner = getBirthdayRunner();
    if (!runner) return;

    runner
      .withSuccessHandler((value: unknown) => {
        if (!value || typeof value !== "object") return;
        const profile = value as CurrentUserProfile;
        if (normalizeEmail(profile.email) !== BIRTHDAY_EMAIL) return;
        if (profile.allowed === false) return;
        setVisible(true);
      })
      .withFailureHandler(() => undefined)
      .getCurrentUserProfile();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const fadeTimer = window.setTimeout(() => setClosing(true), DISPLAY_MS - FADE_MS);
    const closeTimer = window.setTimeout(() => setVisible(false), DISPLAY_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(closeTimer);
    };
  }, [visible]);

  if (!visible) return null;

  const closeNow = () => {
    setClosing(true);
    window.setTimeout(() => setVisible(false), 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#160d22] transition-opacity duration-1000 ${
        closing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Chúc mừng sinh nhật"
    >
      <style>{`
        @keyframes birthdayAurora {
          0%,100% { transform: translate3d(-8%, -4%, 0) scale(1); opacity: .78; }
          50% { transform: translate3d(8%, 6%, 0) scale(1.12); opacity: 1; }
        }
        @keyframes birthdayConfetti {
          0% { transform: translate3d(0,-16vh,0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate3d(36px,116vh,0) rotate(920deg); opacity: .95; }
        }
        @keyframes birthdayTwinkle {
          0%,100% { transform: scale(.45); opacity: .25; }
          50% { transform: scale(1.75); opacity: 1; box-shadow: 0 0 18px rgba(255,255,255,.9); }
        }
        @keyframes birthdayFloat {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-22px) rotate(5deg); }
        }
        @keyframes birthdayReveal {
          0% { opacity: 0; transform: translateY(24px) scale(.9); filter: blur(12px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes birthdayGlow {
          0%,100% { text-shadow: 0 0 20px rgba(255,190,220,.38), 0 0 60px rgba(196,93,124,.28); }
          50% { text-shadow: 0 0 34px rgba(255,222,120,.7), 0 0 90px rgba(244,114,182,.52); }
        }
        @keyframes birthdayProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        @keyframes birthdayRing {
          0% { transform: translate(-50%,-50%) scale(.75); opacity: .75; }
          100% { transform: translate(-50%,-50%) scale(1.55); opacity: 0; }
        }
        .birthday-aurora { animation: birthdayAurora 7s ease-in-out infinite; }
        .birthday-confetti { animation-name: birthdayConfetti; animation-timing-function: linear; animation-iteration-count: infinite; }
        .birthday-star { animation: birthdayTwinkle 2.4s ease-in-out infinite; }
        .birthday-float { animation: birthdayFloat 3.4s ease-in-out infinite; }
        .birthday-reveal { animation: birthdayReveal .95s cubic-bezier(.16,1,.3,1) both; }
        .birthday-glow { animation: birthdayGlow 2.8s ease-in-out infinite; }
        .birthday-ring { animation: birthdayRing 3.4s ease-out infinite; }
        .birthday-progress { transform-origin: left; animation: birthdayProgress ${DISPLAY_MS}ms linear forwards; }
        @media (prefers-reduced-motion: reduce) {
          .birthday-aurora,.birthday-confetti,.birthday-star,.birthday-float,.birthday-glow,.birthday-ring { animation: none !important; }
        }
      `}</style>

      <div className="birthday-aurora absolute -left-[20vw] -top-[30vh] h-[85vh] w-[85vw] rounded-full bg-[radial-gradient(circle,rgba(244,114,182,.48),rgba(124,58,237,.18)_48%,transparent_72%)] blur-3xl" />
      <div className="birthday-aurora absolute -bottom-[35vh] -right-[25vw] h-[90vh] w-[90vw] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,.38),rgba(99,102,241,.2)_48%,transparent_72%)] blur-3xl [animation-delay:-2.4s]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.08),transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.05)_45%,transparent_70%)]" />

      {stars.map((star) => (
        <span
          key={star.id}
          className="birthday-star absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}

      {confetti.map((piece) => (
        <span
          key={piece.id}
          className="birthday-confetti absolute -top-8 rounded-sm"
          style={{
            left: piece.left,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}

      <div className="birthday-ring absolute left-1/2 top-1/2 h-[52vmin] w-[52vmin] rounded-full border border-white/20" />
      <div className="birthday-ring absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] rounded-full border border-pink-300/15 [animation-delay:1.2s]" />

      <div className="birthday-float absolute left-[7%] top-[16%] select-none text-5xl sm:text-7xl">🎈</div>
      <div className="birthday-float absolute right-[8%] top-[12%] select-none text-5xl sm:text-7xl [animation-delay:-1.3s]">🎈</div>
      <div className="birthday-float absolute bottom-[13%] left-[12%] select-none text-4xl sm:text-6xl [animation-delay:-2.1s]">✨</div>
      <div className="birthday-float absolute bottom-[14%] right-[11%] select-none text-4xl sm:text-6xl [animation-delay:-.7s]">🎉</div>

      <button
        type="button"
        onClick={closeNow}
        className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white sm:right-6 sm:top-6"
      >
        Bỏ qua
      </button>

      <div className="relative z-10 grid min-h-full place-items-center px-5 py-16 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <div className="birthday-reveal mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.28em] text-pink-100 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(253,224,71,.9)]" />
            16 · 08 · SPECIAL DAY
          </div>

          <div className="birthday-reveal mb-4 text-6xl sm:text-8xl [animation-delay:.18s]">🎂</div>

          <h1 className="birthday-reveal birthday-glow bg-gradient-to-r from-pink-200 via-amber-100 to-sky-200 bg-clip-text text-4xl font-black leading-[.95] tracking-[-.05em] text-transparent sm:text-6xl md:text-8xl [animation-delay:.32s]">
            CHÚC MỪNG
            <br />
            SINH NHẬT!
          </h1>

          <p className="birthday-reveal mx-auto mt-6 max-w-2xl text-base font-bold leading-7 text-white/88 sm:text-xl [animation-delay:.62s]">
            Chúc bạn một ngày 16/08 thật rực rỡ, nhiều niềm vui, nhiều năng lượng và thật nhiều điều tuyệt vời. ✨
          </p>

          <div className="birthday-reveal mx-auto mt-7 inline-flex max-w-full items-center rounded-2xl border border-white/15 bg-black/15 px-4 py-3 font-mono text-xs font-bold text-pink-100/90 backdrop-blur-lg sm:text-sm [animation-delay:.82s]">
            {BIRTHDAY_EMAIL}
          </div>

          <div className="birthday-reveal mx-auto mt-8 flex items-center justify-center gap-3 text-3xl sm:text-5xl [animation-delay:1.05s]">
            <span className="birthday-float">🎊</span>
            <span className="birthday-float [animation-delay:-1s]">🥳</span>
            <span className="birthday-float [animation-delay:-2s]">🎁</span>
            <span className="birthday-float [animation-delay:-.5s]">🌟</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 h-1.5 bg-white/10">
        <div className="birthday-progress h-full w-full bg-gradient-to-r from-pink-400 via-amber-300 to-sky-400" />
      </div>
    </div>
  );
};
