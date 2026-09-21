# SPX Operations Tools v1.3.0

Chrome Extension chạy trực tiếp trên `https://spx.shopee.vn/` bằng session đăng nhập hiện tại. Không cần copy/paste Cookie.

## Tab 1 — FMS Audit

- Current/Next Station: 1030 Pleiku SOC / 1812 Pleiku 03 Hub.
- Multi-select Order Status.
- Chỉ request khi bấm **Tải dữ liệu**.
- Tracking detail theo batch.
- Lọc kết quả theo Order Status của đúng dataset đã tải.

## Tab 2 — Export Delivery Performance

1. Chọn `start_date` (`YYYY-MM-DD`), mặc định ngày hiện tại.
2. Gọi `/api/driverservice/admin/performance/delivery/export/list?function_type=0&frequency=1&start_date=...`.
3. Lấy `task_id`.
4. Poll `/spxdata/api/export_platform/export_task/list_for_portal`.
5. Dò đúng `task_id` cho tới `export_status=2` và có `downloads/...csv`.
6. Tải CSV vào RAM, không lưu extension storage.
7. Map report:
   - Driver → `Driver`
   - Đơn Nhận → `Number of Delivery Parcels Assigned (VN) with all Exclusions`
   - Đơn Giao TC → `Number of Parcels Delivered (VN) with all Exclusions`
   - Delay → `Number of Parcels Onhold (VN) with all Exclusions`
   - Tỷ Lệ GTC → `Delivery Success Rate (VN) with all Exclusions`
8. Xếp hạng theo Tỷ Lệ GTC giảm dần; tỷ lệ bằng nhau cùng hạng.
9. Có **Preview JPG** và tải JPG.

## Cài đặt

1. Chrome → `chrome://extensions`.
2. Bật Developer mode.
3. Load unpacked thư mục `extension`.
4. Refresh `https://spx.shopee.vn/`.
5. Nhấn nút **SPX Tools**.


## v1.4.0 - SeaTalk Delivery Report

- Thêm cấu hình SeaTalk System Account Webhook trong tab Export Delivery Performance.
- Webhook được lưu bằng `chrome.storage.local` trên thiết bị hiện tại.
- Nút **Gửi SeaTalk** nằm cạnh **Preview JPG**.
- Extension tự tạo JPG từ report và gửi ảnh Base64 qua webhook.
- Không tự gửi; chỉ gửi khi người dùng bấm nút.
- Chỉ chấp nhận webhook dạng `https://openapi.seatalk.io/webhook/group/...`.
- Ảnh Base64 được kiểm tra giới hạn 5MB trước khi gửi.


## v1.5.0 - Modern Operations UI

- Remake giao diện theo phong cách operations dashboard hiện đại.
- Full-screen responsive cho desktop / tablet / mobile.
- Header glassmorphism + gradient accent + trạng thái SPX Connected.
- Navigation tabs mới, hover/press animation.
- KPI cards cho FMS Audit và Delivery Performance.
- Card, form, button, dropdown, table và modal preview được thiết kế lại.
- Sticky table header, zebra rows và hover highlight.
- Loading/progress shimmer và hiệu ứng chuyển động nhẹ.
- Giữ nguyên toàn bộ logic FMS, Delivery Performance và SeaTalk.


## v1.5.1 - Delivery Driver Filter

- Không đưa driver vào report nếu toàn bộ KPI đều bằng 0.
- Driver vẫn được giữ nếu ít nhất một KPI lớn hơn 0.
- Áp dụng cho bảng report, xếp hạng, total, preview JPG và ảnh gửi SeaTalk.


## v1.5.2 - Tab Layout Fix

- Fix thanh tab FMS Audit / Delivery Performance bị stretch thành khối cao trên màn hình nhỏ.
- Khóa chiều cao tab bar về 48px.
- `.main` không còn stretch các grid row theo chiều cao viewport.
- Giữ 2 tab nằm cùng một hàng trên mobile.


## v1.6.0 - OPS-FTE UI Alignment

- Thay tab ngang bằng sticky navbar + drawer navigation giống OPS-FTE.
- Đồng bộ SPX orange, spacing, surface/card, typography scale và touch target.
- Thêm page header riêng cho FMS Audit và Delivery Performance.
- FMS mobile chuyển từ bảng ngang sang card list.
- Multi-select Order Status có ô tìm kiếm theo tên/mã status.
- Giữ desktop table, sticky header, KPI cards và pagination.
- Delivery Performance giữ nguyên export / ranking / JPG / SeaTalk.
- Responsive theo mobile / tablet / desktop và hỗ trợ safe-area.
- Giữ Shadow DOM để không ảnh hưởng CSS của spx.shopee.vn.


## v1.6.1 - Typography & Icon Refresh

- Đổi font UI sang Segoe UI Variable / system font để hiển thị ổn định và hiện đại.
- Thay các icon ký tự cũ bằng inline SVG đồng nhất.
- Cập nhật icon cho launcher, header, drawer, FMS, Delivery, Preview, Download, SeaTalk và pagination.
- Không dùng CDN hoặc icon library ngoài; icon đi cùng source extension.
- Giữ nguyên toàn bộ logic FMS, Delivery Performance và SeaTalk.


## v1.6.2 - Button Interaction Fix

- Fix button không phản hồi sau khi chuyển sang inline SVG icon.
- Toàn bộ click action dùng event delegation với `closest()` thay vì kiểm tra trực tiếp `event.target`.
- Fix Open/Close tool, drawer, navigation, picker, FMS load, pagination, Delivery actions và preview modal.
- Backdrop modal/drawer được xử lý riêng để không đóng nhầm khi click nội dung bên trong.
- SeaTalk actions tiếp tục dùng `closest()` và không bị ảnh hưởng.
