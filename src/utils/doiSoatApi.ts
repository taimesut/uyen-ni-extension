import {
  normalizeDoiSoatRows,
  summarizeDoiSoatRows,
  type DoiSoatResult,
} from "./doiSoat";

const CONNECTION_ERROR = "Không thể kết nối Google Apps Script.";

interface DoiSoatGasRunner {
  withSuccessHandler(handler: (value: unknown) => void): DoiSoatGasRunner;
  withFailureHandler(handler: (error: unknown) => void): DoiSoatGasRunner;
  getDoiSoatRaw(): void;
}

interface DoiSoatGasWindow {
  google?: {
    script?: {
      run?: DoiSoatGasRunner;
    };
  };
}

const getDoiSoatGasRunner = (): DoiSoatGasRunner | undefined => {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as DoiSoatGasWindow).google?.script?.run;
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

export const fetchDoiSoatRaw = (): Promise<DoiSoatResult> =>
  new Promise((resolve, reject) => {
    const runner = getDoiSoatGasRunner();
    if (!runner) {
      reject(new Error("Tab Đối soát chỉ hoạt động trên Google Apps Script."));
      return;
    }

    runner
      .withSuccessHandler((value: unknown) => {
        const rawRows =
          typeof value === "object" && value !== null && "rows" in value
            ? (value as { rows?: unknown }).rows
            : value;
        resolve(summarizeDoiSoatRows(normalizeDoiSoatRows(rawRows)));
      })
      .withFailureHandler((error: unknown) =>
        reject(new Error(getErrorMessage(error))),
      )
      .getDoiSoatRaw();
  });
