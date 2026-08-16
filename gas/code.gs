var ACCESS_SHEET_NAME = "account";
var ACCESS_EMAIL_COLUMN = 1;
var ACCESS_FIRST_DATA_ROW = 2;

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function getAllowedEmails_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(ACCESS_SHEET_NAME);

  if (!sheet) {
    throw new Error("Access sheet is missing");
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < ACCESS_FIRST_DATA_ROW) return [];

  return sheet
    .getRange(
      ACCESS_FIRST_DATA_ROW,
      ACCESS_EMAIL_COLUMN,
      lastRow - ACCESS_FIRST_DATA_ROW + 1,
      1
    )
    .getDisplayValues()
    .map(function (row) {
      return normalizeEmail_(row[0]);
    })
    .filter(function (email) {
      return email !== "";
    });
}

function getCurrentUserAccess_() {
  var email = "";

  try {
    email = normalizeEmail_(Session.getActiveUser().getEmail());
    if (!email) {
      return { allowed: false, email: "", reason: "EMAIL_UNAVAILABLE" };
    }

    var allowed = getAllowedEmails_().indexOf(email) !== -1;
    return {
      allowed: allowed,
      email: email,
      reason: allowed ? "AUTHORIZED" : "NOT_LISTED"
    };
  } catch (error) {
    console.error("Access check failed");
    return { allowed: false, email: email, reason: "ACCESS_CHECK_FAILED" };
  }
}

function escapeHtml_(value) {
  return String(value || "").replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[character];
  });
}

function createAccessDeniedOutput_(access) {
  var accountMessage = access.email
    ? "Tài khoản hiện tại: <strong>" + escapeHtml_(access.email) + "</strong>"
    : "Không xác định được email đăng nhập. Hãy mở lại bằng tài khoản công ty.";

  var html = [
    "<!doctype html>",
    '<html lang="vi">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>Không có quyền truy cập</title>",
    "<style>",
    "*{box-sizing:border-box}",
    "body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:#faf8f9;color:#41363b;font-family:Arial,sans-serif}",
    ".card{width:min(100%,430px);padding:30px;background:#fff;border:1px solid #eadde2;border-radius:16px;box-shadow:0 8px 28px rgba(68,47,56,.08);text-align:center}",
    ".icon{width:48px;height:48px;margin:0 auto 18px;display:grid;place-items:center;border-radius:12px;background:#f3e5ea;color:#a64e6b;font-size:24px;font-weight:800}",
    "h1{margin:0 0 12px;font-size:1.55rem}",
    "p{margin:8px 0;color:#786970;line-height:1.6;overflow-wrap:anywhere}",
    "strong{color:#41363b}",
    "</style>",
    "</head>",
    "<body>",
    '<main class="card">',
    '<div class="icon">!</div>',
    "<h1>Không có quyền truy cập</h1>",
    "<p>" + accountMessage + "</p>",
    "<p>Liên hệ quản trị viên để được thêm vào danh sách sử dụng.</p>",
    "</main>",
    "</body>",
    "</html>"
  ].join("");

  return HtmlService.createHtmlOutput(html)
    .setTitle("Không có quyền truy cập")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}

function doGet() {
  var access = getCurrentUserAccess_();
  if (!access.allowed) {
    return createAccessDeniedOutput_(access);
  }

  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("Audit workspace")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
