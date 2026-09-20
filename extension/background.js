"use strict";

const SEATALK_HOST = "openapi.seatalk.io";
const MAX_IMAGE_BASE64_BYTES = 5 * 1024 * 1024;

function isValidSeaTalkWebhook(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" &&
      url.hostname === SEATALK_HOST &&
      url.pathname.startsWith("/webhook/group/");
  } catch (_) {
    return false;
  }
}

async function sendSeaTalkImage(webhook, imageBase64) {
  if (!isValidSeaTalkWebhook(webhook)) {
    throw new Error("SeaTalk Webhook không hợp lệ.");
  }

  const content = String(imageBase64 || "").trim();
  if (!content) {
    throw new Error("Ảnh report đang trống.");
  }

  const encodedBytes = new TextEncoder().encode(content).length;
  if (encodedBytes > MAX_IMAGE_BASE64_BYTES) {
    throw new Error("Ảnh report vượt giới hạn 5MB Base64 của SeaTalk.");
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      tag: "image",
      image_base64: {content}
    })
  });

  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (_) {}

  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.msg ||
      ("SeaTalk HTTP " + response.status + (text ? ": " + text.slice(0, 180) : ""))
    );
  }

  const code = payload?.code ?? payload?.retcode ?? payload?.errcode;
  if (code != null && Number(code) !== 0) {
    throw new Error(payload?.message || payload?.msg || ("SeaTalk error code " + code));
  }

  return payload || {success: true};
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SEATALK_SEND_IMAGE") return;

  sendSeaTalkImage(message.webhook, message.imageBase64)
    .then(result => sendResponse({ok: true, result}))
    .catch(error => sendResponse({ok: false, error: String(error?.message || error)}));

  return true;
});
