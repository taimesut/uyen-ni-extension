# Audit workspace

Ứng dụng nội bộ hỗ trợ theo dõi và đối soát dữ liệu aging từ Google Sheet `raw`.

**Author:** uyenni.nguyentran@spxexpress.com

## Chức năng

- **Trang chủ**: truy cập nhanh các tác vụ chính.
- **Đối soát**: chỉ lấy các dòng có `aging_group` bằng `24H -> 36H` hoặc `> 36H`.
- **Cookie**: lưu SPX Cookie cục bộ trên trình duyệt.

## Dữ liệu hiển thị

- `trip_number`
- `to_number`
- `fleet_order_id` → hiển thị là **SPX Tracking Number**
- `bulky_type`
- `arrived_time`
- `last_status_tracking`
- `aging_group`

## Stack

- React + TypeScript + Vite
- Tailwind CSS + DaisyUI
- Google Apps Script
- Google Sheets

## Development

```bash
npm install
npm run dev
```

Kiểm tra trước khi deploy:

```bash
npm test
npm run build
```

## Google Apps Script

Backend Apps Script đọc sheet `raw` qua `getDoiSoatRaw()` và kiểm tra quyền truy cập dựa trên sheet `account`.

Sau khi build, cập nhật `gas/index.html` theo quy trình deploy hiện tại rồi push bằng `clasp`.
