import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

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

const COLORS = ["#fb7185", "#f9a8d4", "#fde68a", "#7dd3fc", "#c4b5fd", "#86efac"];

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
      Array.from({ length: 96 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        delay: `${((index * 19) % 55) / 10}s`,
        duration: `${5.4 + ((index * 11) % 34) / 10}s`,
        color: COLORS[index % COLORS.length],
        width: `${5 + (index % 6)}px`,
        height: `${8 + (index % 9)}px`,
      })),
    [],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => ({
        id: index,
        left: `${(index * 31) % 100}%`,
        top: `${(index * 43) % 92}%`,
        delay: `${((index * 13) % 36) / 10}s`,
        size: `${2 + (index % 4)}px`,
      })),
    [],
  );

  const fireworks = useMemo(
    () =>
      Array.from({ length: 3 }, (_, fireworkIndex) => ({
        id: fireworkIndex,
        left: [21, 76, 51][fireworkIndex],
        top: [28, 24, 72][fireworkIndex],
        delay: [0.4, 1.65, 3.1][fireworkIndex],
        particles: Array.from({ length: 18 }, (_, particleIndex) => ({
          id: particleIndex,
          angle: particleIndex * 20,
          distance: 62 + (particleIndex % 4) * 15,
          color: COLORS[(particleIndex + fireworkIndex) % COLORS.length],
        })),
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
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#0d0715] transition-opacity duration-1000 ${
        closing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Chúc mừng sinh nhật"
    >
      <style>{`
        @keyframes birthdayCurtain {
          0% { transform: scale(1.45); opacity: 1; }
          100% { transform: scale(.01); opacity: 0; }
        }
        @keyframes birthdayFlash {
          0%,100% { opacity: 0; transform: scale(.65); }
          12% { opacity: .95; }
          42% { opacity: .32; transform: scale(1.08); }
          70% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes birthdayAurora {
          0%,100% { transform: translate3d(-10%, -4%, 0) scale(1); opacity: .65; }
          50% { transform: translate3d(10%, 8%, 0) scale(1.16); opacity: 1; }
        }
        @keyframes birthdayConfetti {
          0% { transform: translate3d(0,-14vh,0) rotate(0deg); opacity: 0; }
          7% { opacity: 1; }
          100% { transform: translate3d(42px,116vh,0) rotate(1080deg); opacity: .94; }
        }
        @keyframes birthdayTwinkle {
          0%,100% { transform: scale(.35); opacity: .15; }
          50% { transform: scale(2); opacity: 1; box-shadow: 0 0 22px rgba(255,255,255,.95); }
        }
        @keyframes birthdayFloat {
          0%,100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-24px) rotate(6deg); }
        }
        @keyframes birthdayReveal {
          0% { opacity: 0; transform: translateY(34px) scale(.88); filter: blur(16px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes birthdayCake {
          0% { opacity: 0; transform: scale(.2) rotate(-18deg); filter: blur(10px); }
          55% { opacity: 1; transform: scale(1.18) rotate(5deg); filter: blur(0); }
          76% { transform: scale(.94) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes birthdayGlow {
          0%,100% { text-shadow: 0 0 22px rgba(255,185,220,.35), 0 0 72px rgba(236,72,153,.22); }
          50% { text-shadow: 0 0 36px rgba(254,240,138,.82), 0 0 110px rgba(244,114,182,.52); }
        }
        @keyframes birthdayProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        @keyframes birthdayRing {
          0% { transform: translate(-50%,-50%) scale(.48); opacity: .8; }
          100% { transform: translate(-50%,-50%) scale(1.65); opacity: 0; }
        }
        @keyframes birthdayParticle {
          0% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--angle)) translateX(0) scale(.4); }
          14% { opacity: 1; }
          72% { opacity: .95; }
          100% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--angle)) translateX(var(--distance)) scale(1.25); }
        }
        @keyframes birthdayShimmer {
          0% { transform: translateX(-180%) skewX(-18deg); }
          65%,100% { transform: translateX(240%) skewX(-18deg); }
        }
        .birthday-curtain { animation: birthdayCurtain 1.35s cubic-bezier(.7,0,.2,1) .18s both; }
        .birthday-flash { animation: birthdayFlash 2.6s ease-out .55s both; }
        .birthday-aurora { animation: birthdayAurora 7s ease-in-out infinite; }
        .birthday-confetti { animation-name: birthdayConfetti; animation-timing-function: linear; animation-iteration-count: infinite; }
        .birthday-star { animation: birthdayTwinkle 2.2s ease-in-out infinite; }
        .birthday-float { animation: birthdayFloat 3.2s ease-in-out infinite; }
        .birthday-reveal { animation: birthdayReveal .95s cubic-bezier(.16,1,.3,1) both; }
        .birthday-cake { animation: birthdayCake 1.25s cubic-bezier(.16,1,.3,1) .75s both; }
        .birthday-glow { animation: birthdayGlow 2.6s ease-in-out infinite; }
        .birthday-ring { animation: birthdayRing 3.2s ease-out infinite; }
        .birthday-progress { transform-origin: left; animation: birthdayProgress ${DISPLAY_MS}ms linear forwards; }
        .birthday-particle { animation: birthdayParticle 1.65s ease-out infinite; animation-delay: var(--delay); }
        .birthday-shimmer::after { content:""; position:absolute; inset:-30% auto -30% -40%; width:26%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent); animation:birthdayShimmer 3.8s ease-in-out 2.3s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .birthday-aurora,.birthday-confetti,.birthday-star,.birthday-float,.birthday-glow,.birthday-ring,.birthday-particle { animation: none !important; }
        }
      `}</style>

      <div className="birthday-aurora absolute -left-[24vw] -top-[34vh] h-[92vh] w-[92vw] rounded-full bg-[radial-gradient(circle,rgba(244,114,182,.5),rgba(124,58,237,.2)_48%,transparent_72%)] blur-3xl" />
      <div className="birthday-aurora absolute -bottom-[38vh] -right-[28vw] h-[96vh] w-[96vw] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,.42),rgba(99,102,241,.2)_48%,transparent_72%)] blur-3xl [animation-delay:-2.3s]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.1),transparent_40%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.05)_45%,transparent_70%)]" />

      <div className="birthday-flash absolute left-1/2 top-1/2 h-[55vmin] w-[55vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl" />
      <div className="birthday-curtain absolute inset-0 z-40 origin-center rounded-full bg-black" />

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

      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="pointer-events-none absolute"
          style={{ left: `${firework.left}%`, top: `${firework.top}%` }}
        >
          {firework.particles.map((particle) => (
            <span
              key={particle.id}
              className="birthday-particle absolute h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]"
              style={
                {
                  backgroundColor: particle.color,
                  color: particle.color,
                  "--angle": `${particle.angle}deg`,
                  "--distance": `${particle.distance}px`,
                  "--delay": `${firework.delay + (particle.id % 3) * 0.035}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}

      <div className="birthday-ring absolute left-1/2 top-1/2 h-[48vmin] w-[48vmin] rounded-full border border-white/25" />
      <div className="birthday-ring absolute left-1/2 top-1/2 h-[68vmin] w-[68vmin] rounded-full border border-pink-300/15 [animation-delay:1.1s]" />

      <div className="birthday-float absolute left-[6%] top-[15%] select-none text-5xl drop-shadow-2xl sm:text-7xl">🎈</div>
      <div className="birthday-float absolute right-[7%] top-[13%] select-none text-5xl drop-shadow-2xl sm:text-7xl [animation-delay:-1.4s]">🎈</div>
      <div className="birthday-float absolute bottom-[13%] left-[11%] select-none text-4xl sm:text-6xl [animation-delay:-2.2s]">✨</div>
      <div className="birthday-float absolute bottom-[14%] right-[10%] select-none text-4xl sm:text-6xl [animation-delay:-.8s]">🎉</div>

      <button
        type="button"
        onClick={closeNow}
        className="absolute right-4 top-4 z-50 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white sm:right-6 sm:top-6"
      >
        Bỏ qua
      </button>

      <div className="relative z-20 grid min-h-full place-items-center px-5 py-16 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <div className="birthday-reveal mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.26em] text-pink-100 backdrop-blur-xl [animation-delay:1.05s]">
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(253,224,71,.95)]" />
            16 · 08
          </div>

          <div className="birthday-cake mb-4 select-none text-7xl drop-shadow-[0_0_35px_rgba(255,255,255,.25)] sm:text-9xl">🎂</div>

          <h1 className="birthday-reveal birthday-glow birthday-shimmer relative overflow-hidden bg-gradient-to-r from-pink-200 via-amber-100 to-sky-200 bg-clip-text text-4xl font-black leading-[.95] tracking-[-.05em] text-transparent sm:text-6xl md:text-8xl [animation-delay:1.35s]">
            CHÚC MỪNG
            <br />
            SINH NHẬT NHA!
          </h1>

          <p className="birthday-reveal mx-auto mt-6 max-w-xl text-base font-bold leading-7 text-white/85 sm:text-xl [animation-delay:1.7s]">
            Chúc bạn tuổi mới thật nhiều niềm vui và luôn gặp những điều dễ thương nhất. ✨
          </p>

          <div className="birthday-reveal mx-auto mt-7 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black tracking-[.16em] text-pink-100 backdrop-blur-lg [animation-delay:2s]">
            HAPPY BIRTHDAY 🎉
          </div>

          <div className="birthday-reveal mx-auto mt-8 flex items-center justify-center gap-3 text-3xl sm:text-5xl [animation-delay:2.25s]">
            <span className="birthday-float">🎊</span>
            <span className="birthday-float [animation-delay:-1s]">🥳</span>
            <span className="birthday-float [animation-delay:-2s]">🎁</span>
            <span className="birthday-float [animation-delay:-.5s]">🌟</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-50 h-1.5 bg-white/10">
        <div className="birthday-progress h-full w-full bg-gradient-to-r from-pink-400 via-amber-300 to-sky-400" />
      </div>
    </div>
  );
};
