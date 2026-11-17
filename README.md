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

Builder đọc version từ `extension/manifest.json`, đồng bộ `@version` theo dạng bốn số (ví dụ `2.0.0` → `2.0.0.0`). Khi build thủ công, tăng version trong manifest để các trình quản lý nhận diện phiên bản mới. Lệnh `node scripts/build-userscript.cjs --release` tự tăng patch version nếu script thay đổi mà chưa tăng version.

## Cài đặt trực tiếp và tự cập nhật qua GitHub

- **Link cài đặt:** https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/userscript/spx-operations-tools-safari.user.js
- **Link metadata kiểm tra phiên bản:** https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/userscript/spx-operations-tools-safari.meta.js
- Dùng Tampermonkey/Violentmonkey: mở link cài đặt và bấm Install. Bật tính năng kiểm tra cập nhật trong cài đặt trình quản lý. Không copy/paste script thủ công vào editor, để giữ liên kết cập nhật tự động.
- Safari: cập nhật tự động tùy thuộc trình quản lý Userscripts và cấu hình.
- GitHub Actions `.github/workflows/build-userscript.yml` chạy khi push thay đổi mã nguồn lên `main` hoặc khi bấm **Run workflow**. Workflow tạo và kiểm tra script, tự tăng phiên bản khi cần rồi commit lại file `.user.js` và `.meta.js` lên `main`.
- `@updateURL` trỏ tới file metadata nhỏ, còn `@downloadURL` trỏ tới toàn bộ script. Hai file được build cùng nhau.
- Giữ nguyên `@name` và `@namespace` giữa các bản cập nhật để không bị cài trùng.

**Lưu ý:** Chrome Extension cài bằng `Load unpacked` không tự cập nhật theo cơ chế Userscript. Cơ chế cập nhật qua GitHub này áp dụng cho Userscript.

**Không chỉnh sửa file `.user.js` đầu ra bằng tay** vì lần build sau sẽ ghi đè. Cập nhật `extension/` khi thay đổi nghiệp vụ/UI; nếu cần thay đổi cơ chế chạy hoặc metadata của userscript, chỉnh `userscript/safari-bootstrap.js`.

Chrome Extension vẫn cài trực tiếp bằng `Load unpacked` → `extension/`; không cần build.

## Tích hợp menu gốc SPX

Bản Extension và Safari Userscript chèn **Uyen Ni** sau **Outbound**, gồm FMS Audit, Delivery Performance (ngày/tháng) và Pickup Assignment. Khi mở từ menu mới, trang công cụ hiển thị bên phải sidebar SPX. Có thể quay về SPX bằng nút đóng hoặc chuyển sang mục menu gốc. Nếu SPX thay đổi DOM menu, launcher cũ vẫn được dùng làm dự phòng.
