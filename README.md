# SPX Operations Tools

Mã nguồn Chrome Extension nằm trong `extension/`. File Safari/Tampermonkey/Violentmonkey Userscript được **build từ cùng mã nguồn**, tránh việc sửa hai bản riêng biệt.

## Build userscript

Yêu cầu **Node.js** (không cần `npm install` hoặc thư viện ngoài).

- **Windows:** nhấp đúp `build-userscript.bat` ở thư mục gốc.
- **Terminal (Windows / macOS / Linux):** `node scripts/build-userscript.cjs`
- **Kiểm tra userscript đã được build lại chưa:** `node scripts/build-userscript.cjs --check`

File đầu ra: `userscript/spx-operations-tools-safari.user.js`.

## Nguồn build

```text
userscript/safari-bootstrap.js   -> metadata + Safari GM / chrome compatibility
extension/bridge.js              -> same-origin SPX API bridge
extension/status-data.js         -> order statuses
extension/ui.js                  -> responsive UI and business logic
extension/menu.js                -> native SPX sidebar menu
  => userscript/spx-operations-tools-safari.user.js
```

Builder đọc version từ `extension/manifest.json`, và đồng bộ `@version` theo dạng bốn số (ví dụ `2.0.0` → `2.0.0.0`). Khi phát hành bản mới để userscript manager tự cập nhật, hãy tăng `version` trong manifest trước khi build.

**Không chỉnh sửa file `.user.js` đầu ra bằng tay** vì lần build sau sẽ ghi đè. Cập nhật `extension/` khi thay đổi nghiệp vụ/UI; nếu cần thay đổi cơ chế chạy hoặc metadata của userscript, chỉnh `userscript/safari-bootstrap.js`.

Chrome Extension vẫn cài trực tiếp bằng `Load unpacked` → `extension/`; không cần build.

## Tích hợp menu gốc SPX

Bản Extension và Safari Userscript chèn **Uyen Ni** sau **Outbound**, gồm FMS Audit, Delivery Performance (ngày/tháng) và Pickup Assignment. Khi mở từ menu mới, trang công cụ hiển thị bên phải sidebar SPX. Có thể quay về SPX bằng nút đóng hoặc chuyển sang mục menu gốc. Nếu SPX thay đổi DOM menu, launcher cũ vẫn được dùng làm dự phòng.
