import { normalizeFmsResult, type FmsResult } from "./fms";

const CONNECTION_ERROR = "Không thể kết nối Google Apps Script.";

interface FmsGasRunner {
  withSuccessHandler(handler: (value: unknown) => void): FmsGasRunner;
  withFailureHandler(handler: (error: unknown) => void): FmsGasRunner;
  getFmsData(cookie: string, pageNo: number): void;
}

interface FmsGasWindow {
  google?: {
    script?: {
      run?: FmsGasRunner;
    };
  };
}

const getFmsGasRunner = (): FmsGasRunner | undefined => {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as FmsGasWindow).google?.script?.run;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return CONNECTION_ERROR;
};

export const fetchFmsData = (
  cookie: string,
  pageNo: number,
): Promise<FmsResult> =>
  new Promise((resolve, reject) => {
    const runner = getFmsGasRunner();
    if (!runner) {
      reject(new Error("Tab FMS chỉ hoạt động trên Google Apps Script."));
      return;
    }

    if (!cookie.trim()) {
      reject(new Error("Chưa có SPX Cookie. Hãy nhập Cookie trong tab Cookie."));
      return;
    }

    runner
      .withSuccessHandler((value: unknown) => resolve(normalizeFmsResult(value)))
      .withFailureHandler((error: unknown) =>
        reject(new Error(getErrorMessage(error))),
      )
      .getFmsData(cookie.trim(), Math.max(1, Math.floor(pageNo)));
  });
