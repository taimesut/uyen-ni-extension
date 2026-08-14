# Audit workspace

Ứng dụng nội bộ hỗ trợ theo dõi và đối soát dữ liệu aging từ Google Sheet `raw` và dữ liệu FMS từ SPX.

**Author:** uyenni.nguyentran@spxexpress.com

## Chức năng

- **Trang chủ**: truy cập nhanh các tác vụ chính.
- **Đối soát**: chỉ lấy các dòng có `aging_group` bằng `24H -> 36H` hoặc `> 36H`.
- **FMS**: gọi SPX FMS theo station `1030 -> 1812`, status `880,36,15`, lấy toàn bộ các trang kết quả rồi mới lấy trạng thái tracking cuối cùng của từng `shipment_id`.
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
- `count`: `50`
- `current_station_ids`: `1030`
- `next_station_ids`: `1812`
- `order_status`: `880,36,15`
- Bắt đầu từ `page_no = 1`; nếu `total` cho biết còn dữ liệu thì tiếp tục gọi `page_no = 2, 3, ...` cho đến khi lấy hết danh sách đơn.

Sau khi đã lấy xong **toàn bộ danh sách FMS**, backend mới gọi `/api/fleet_order/order/detail/tracking_info` cho từng `shipment_id`.

Tracking detail được chia thành batch để giảm burst request:

- `5` shipment mỗi batch.
- Dùng `UrlFetchApp.fetchAll()` trong từng batch.
- Nghỉ `1000 ms` giữa hai batch liên tiếp.
- Backend duyệt `tracking_list`, `children` và `event_children`, chỉ giữ event có `timestamp` lớn nhất rồi trả về frontend dưới dạng `latest_tracking_event`.

Frontend hiển thị mỗi SPX đúng một dòng với SPX Tracking Number, TO Number, trạng thái cuối, thời gian cập nhật cuối, số giờ đã qua và nhóm aging (`< 24H`, `24H → 36H`, `> 36H`).

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
