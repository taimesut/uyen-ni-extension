// ==UserScript==
// @name         SPX Operations Tools - Safari
// @namespace    https://github.com/taimesut/uyen-ni-extension
// @version      2.1.2.0
// @description  FMS, Pickup, Delivery Performance ngày/tháng và SeaTalk trực tiếp trên SPX.
// @author       taimesut
// @match        https://spx.shopee.vn/*
// @run-at       document-idle
// @noframes
// @inject-into  content
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.xmlHttpRequest
// @connect      openapi.seatalk.io
// @connect      spx.shopee.vn
// @icon         https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/extension/icons/icon-48.png
// @downloadURL  https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/userscript/spx-operations-tools-safari.user.js
// @updateURL    https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/userscript/spx-operations-tools-safari.user.js
// ==/UserScript==



(() => {
  "use strict";

  // Safari Userscripts compatibility layer.
  // The extension UI expects chrome.storage.local + chrome.runtime.sendMessage.
  // This userscript maps those calls to GM APIs so the same UI/business logic can run unchanged.

  const GM_API = globalThis.GM || {};

  function normalizeKeys(keys) {
    if (Array.isArray(keys)) return keys;
    if (typeof keys === "string") return [keys];
    if (keys && typeof keys === "object") return Object.keys(keys);
    return [];
  }

  async function gmGetValue(key, defaultValue) {
    if (typeof GM_API.getValue === "function") {
      return GM_API.getValue(key, defaultValue);
    }

    try {
      const raw = localStorage.getItem("__spx_userscript_" + key);
      return raw == null ? defaultValue : JSON.parse(raw);
    } catch (_) {
      return defaultValue;
    }
  }

  async function gmSetValue(key, value) {
    if (typeof GM_API.setValue === "function") {
      return GM_API.setValue(key, value);
    }

    localStorage.setItem(
      "__spx_userscript_" + key,
      JSON.stringify(value)
    );
  }

  async function gmDeleteValue(key) {
    if (typeof GM_API.deleteValue === "function") {
      return GM_API.deleteValue(key);
    }

    localStorage.removeItem("__spx_userscript_" + key);
  }

  const runtime = {
    lastError: null,

    getURL(path) {
      const value = String(path || "");
      if (/^icons\/icon-(?:16|32|48|128)\.png$/i.test(value)) {
        return "data:image/png;base64,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";
      }
      try {
        return new URL(value, window.location.href).href;
      } catch (_) {
        return value;
      }
    },

    sendMessage(message, callback) {
      runtime.lastError = null;

      if (message?.type !== "SEATALK_SEND_IMAGE") {
        callback?.({
          ok: false,
          error: "Unsupported userscript message."
        });
        return;
      }

      const webhook = String(message.webhook || "").trim();
      const imageBase64 = String(message.imageBase64 || "").trim();

      let parsed;
      try {
        parsed = new URL(webhook);
      } catch (_) {
        callback?.({
          ok: false,
          error: "SeaTalk Webhook không hợp lệ."
        });
        return;
      }

      if (
        parsed.protocol !== "https:" ||
        parsed.hostname !== "openapi.seatalk.io" ||
        !parsed.pathname.startsWith("/webhook/group/")
      ) {
        callback?.({
          ok: false,
          error: "SeaTalk Webhook không hợp lệ."
        });
        return;
      }

      if (!imageBase64) {
        callback?.({
          ok: false,
          error: "Ảnh report đang trống."
        });
        return;
      }

      if (
        new TextEncoder().encode(imageBase64).length >
        5 * 1024 * 1024
      ) {
        callback?.({
          ok: false,
          error: "Ảnh report vượt giới hạn 5MB Base64 của SeaTalk."
        });
        return;
      }

      if (typeof GM_API.xmlHttpRequest !== "function") {
        callback?.({
          ok: false,
          error:
            "Userscript manager không hỗ trợ GM.xmlHttpRequest. " +
            "Hãy dùng Safari Userscripts bản mới."
        });
        return;
      }

      GM_API.xmlHttpRequest({
        method: "POST",
        url: webhook,
        headers: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify({
          tag: "image",
          image_base64: {
            content: imageBase64
          }
        }),
        timeout: 30000,

        onload(response) {
          let payload = null;

          try {
            payload = response.responseText
              ? JSON.parse(response.responseText)
              : null;
          } catch (_) {}

          if (
            response.status < 200 ||
            response.status >= 300
          ) {
            callback?.({
              ok: false,
              error:
                payload?.message ||
                payload?.msg ||
                "SeaTalk HTTP " + response.status
            });
            return;
          }

          const code =
            payload?.code ??
            payload?.retcode ??
            payload?.errcode;

          if (
            code != null &&
            Number(code) !== 0
          ) {
            callback?.({
              ok: false,
              error:
                payload?.message ||
                payload?.msg ||
                "SeaTalk error code " + code
            });
            return;
          }

          callback?.({
            ok: true,
            result:
              payload || {
                success: true
              }
          });
        },

        onerror() {
          callback?.({
            ok: false,
            error: "Không thể kết nối SeaTalk webhook."
          });
        },

        ontimeout() {
          callback?.({
            ok: false,
            error: "SeaTalk webhook timeout."
          });
        }
      });
    }
  };

  const storageLocal = {
    get(keys, callback) {
      Promise.resolve()
        .then(async () => {
          const result = {};

          if (
            keys &&
            typeof keys === "object" &&
            !Array.isArray(keys)
          ) {
            for (const key of Object.keys(keys)) {
              result[key] = await gmGetValue(
                key,
                keys[key]
              );
            }
          } else {
            for (const key of normalizeKeys(keys)) {
              result[key] = await gmGetValue(
                key,
                undefined
              );
            }
          }

          runtime.lastError = null;
          callback?.(result);
        })
        .catch(error => {
          runtime.lastError = {
            message: String(
              error?.message ||
              error
            )
          };

          callback?.({});
          runtime.lastError = null;
        });
    },

    set(items, callback) {
      Promise.resolve()
        .then(async () => {
          for (
            const [key, value]
            of Object.entries(items || {})
          ) {
            await gmSetValue(key, value);
          }

          runtime.lastError = null;
          callback?.();
        })
        .catch(error => {
          runtime.lastError = {
            message: String(
              error?.message ||
              error
            )
          };

          callback?.();
          runtime.lastError = null;
        });
    },

    remove(keys, callback) {
      Promise.resolve()
        .then(async () => {
          for (
            const key
            of normalizeKeys(keys)
          ) {
            await gmDeleteValue(key);
          }

          runtime.lastError = null;
          callback?.();
        })
        .catch(error => {
          runtime.lastError = {
            message: String(
              error?.message ||
              error
            )
          };

          callback?.();
          runtime.lastError = null;
        });
    }
  };

  const existingChrome =
    globalThis.chrome &&
    typeof globalThis.chrome === "object"
      ? globalThis.chrome
      : {};

  existingChrome.storage =
    existingChrome.storage || {};

  existingChrome.storage.local =
    storageLocal;

  existingChrome.runtime =
    runtime;

  try {
    globalThis.chrome =
      existingChrome;
  } catch (_) {
    Object.defineProperty(
      globalThis,
      "chrome",
      {
        value: existingChrome,
        configurable: true
      }
    );
  }
})();
