export interface AppConfig {
  cookies: string;
}

const STORAGE_KEY = "spx-audit-config";
const LEGACY_STORAGE_KEY = "configs";
const EMPTY_CONFIG: AppConfig = { cookies: "" };

const parseConfig = (raw: string | null): AppConfig | null => {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const cookies = (parsed as { cookies?: unknown }).cookies;
    return {
      cookies: typeof cookies === "string" ? cookies : "",
    };
  } catch {
    return null;
  }
};

export const getConfigs = (): AppConfig => {
  if (typeof window === "undefined") return EMPTY_CONFIG;

  return (
    parseConfig(window.localStorage.getItem(STORAGE_KEY)) ??
    parseConfig(window.localStorage.getItem(LEGACY_STORAGE_KEY)) ??
    EMPTY_CONFIG
  );
};

export const saveConfigs = (config: AppConfig): void => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ cookies: config.cookies.trim() }),
  );
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
};

export const getCookies = (): string => getConfigs().cookies;
