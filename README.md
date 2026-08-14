# Audit workspace

Ứng dụng nội bộ hỗ trợ theo dõi và đối soát dữ liệu aging từ Google Sheet `raw` và dữ liệu FMS từ SPX.

**Author:** uyenni.nguyentran@spxexpress.com

## Chức năng

- **Trang chủ**: truy cập nhanh các tác vụ chính.
- **Đối soát**: chỉ lấy các dòng có `aging_group` bằng `24H -> 36H` hoặc `> 36H`.
- **FMS**: gọi SPX FMS theo station `1030 -> 1812`, status `880,36,15`, sau đó lấy tracking detail cho từng `shipment_id` và hiển thị `status + timestamp`.
- **Cookie**: lưu SPX Cookie cục bộ trên trình duyệt.

## Dữ liệu đối soát

- `trip_number`
- `to_number`
- `fleet_order_id` → hiển thị là **SPX Tracking Number**
- `bulky_type`
- `arrived_time`
- `last_status_tracking`
- `aging_group`

## Dữ liệu FMS

Search endpoint:

- `POST /api/fleet_order/order/tracking_list/search`
- `count`: `24`
- `current_station_ids`: `1030`
- `next_station_ids`: `1812`
- `order_status`: `880,36,15`

Mỗi `shipment_id` tiếp tục gọi `/api/fleet_order/order/detail/tracking_info` để lấy lịch sử tracking. Frontend hiển thị SPX Tracking Number, TO, order status, bulky type, station và toàn bộ `status + timestamp` trong tracking list.

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

Backend Apps Script đọc sheet `raw` qua `getDoiSoatRaw()`, proxy các request FMS qua `gas/fms.gs` và kiểm tra quyền truy cập dựa trên sheet `account`.

SPX Cookie chỉ được truyền từ trình duyệt sang GAS khi tab FMS gọi dữ liệu; code không ghi Cookie vào Google Sheet hoặc log.

Sau khi build, cập nhật `gas/index.html` theo quy trình deploy hiện tại rồi push bằng `clasp`.
