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

## v1.7.0 - Pickup Assignment

- Thêm mục **Pickup Assignment** trong drawer navigation.
- Lấy danh sách đơn từ `/api/admin/pickup/fm_hub/pickup_order/search` với `status=2` và dùng `assigned_count` làm số đơn thực tế.
- Mỗi đơn hiển thị mã SPX, ETA, số lần pickup, loại đơn, điểm pickup, địa chỉ, tài xế, thời gian xử lý gần nhất và lý do/trạng thái.
- `pickup_order_type=0` lấy `seller_addr`; `pickup_order_type=5` lấy `buyer_addr`.
- Tài xế lấy từ `pickup_info`, ưu tiên `pickup_driver_name` có `ctime` mới nhất.
- Có filter riêng cho từng cột và phân trang 25 dòng.
- Detail được lấy theo batch nhỏ, retry khi SPX trả 429/503; lỗi detail của một shipment không làm hỏng toàn bộ bảng.

## v1.7.1 - Compact UI

- Chuyển nút mở extension lên góc phải trên cùng và thu gọn thành nút **SPX**.
- Bỏ các mô tả kỹ thuật/trạng thái không cần thiết trong header, drawer và các màn hình.
- Bỏ **Connected**, **SPX session ready**, dòng session SPX, dòng chạy trực tiếp trên spx.shopee.vn và chữ **OPS-FTE UI**.
- Pickup Assignment chỉ còn một bộ lọc **Tài xế** dạng select.
- Bỏ hàng filter theo từng cột và các mô tả kỹ thuật của Pickup Assignment.

## v1.7.2 - Pickup Table & Typography

- Đổi toàn bộ UI sang **Be Vietnam Pro** với fallback hệ thống.
- Bảng Pickup ưu tiên 5 cột chính nằm liền nhau: **Mã đơn → Tài xế → Attempt → Địa chỉ → ETA**.
- Thu hẹp padding/cột và dùng fixed column width để bảng dễ quét mắt hơn.
- Đổi **Lần pickup** thành **Attempt**.

## v1.7.3 - Extension Icon

- Thay icon extension bằng logo **X trắng nền cam** từ file người dùng cung cấp.
- Tạo bộ icon chuẩn 16 / 32 / 48 / 128 px cho Chrome.
- Nút mở **SPX** góc phải dùng cùng icon mới.

## v1.8.0 - Responsive Design System

- Chuẩn hóa design token cho màu sắc, spacing, radius, control height, typography và shadow.
- Responsive theo desktop / tablet / mobile với safe-area và touch target.
- FMS, Pickup Assignment và Delivery Performance có layout mobile dạng card.
- Tablet tự co form, filter và action theo 2 cột; mobile chuyển về 1 cột.
- KPI, table, pagination, drawer và preview modal dùng cùng một hệ UI.
- Mobile không còn phụ thuộc vào bảng ngang cho Pickup và Delivery.
- Hỗ trợ coarse pointer, reduced motion và increased contrast.

## v1.8.1 - FMS Interaction & Launcher Fix

- Fix **Next Station** bị đóng ngay khi mở do xung đột `data-next` với nút phân trang.
- Đổi Next Station sang `data-next-station` và giới hạn pagination selector vào đúng button.
- Fix dropdown **Order Status cần lấy** bị card cắt mất; filter card cho phép dropdown overflow và có z-index riêng.
- Launcher góc phải chỉ còn favicon, bỏ chữ **SPX** và nền pill.
- Header bỏ favicon, chỉ giữ menu và tên **SPX Operations Tools**.

## v1.8.2 - Pickup Address & Driver Logic

- `pickup_order_type = 0` → `seller_addr`.
- `pickup_order_type = 5` → `buyer_addr`.
- Không tự suy đoán địa chỉ cho các pickup type khác.
- Tài xế lấy từ `pickup_order_tracking[].pickup_driver_name` có `ctime` gần thời điểm hiện tại nhất.
- Chỉ fallback sang `driver_name[0]` nếu không có tracking driver.

## v1.9.0 - Operations Dashboard Redesign

- Làm mới giao diện theo dashboard vận hành SPX cam-trắng.
- Desktop có sidebar điều hướng cố định, header gọn và vùng nội dung rộng.
- Làm nổi bật KPI, bộ lọc và bảng dữ liệu; giữ trải nghiệm drawer trên mobile.
- Đồng bộ giao diện giữa Chrome Extension và Safari Userscript.
- Giữ nguyên logic FMS Audit, Pickup Assignment, Delivery Performance và SeaTalk.

## v1.9.1 - Notion Paper Theme

- Áp dụng nền giấy ấm, thẻ trắng viền mảnh và kiểu chữ Inter theo design reference.
- Dùng xanh dương Notion cho hành động chính; nút phụ dùng nền xanh nhạt.
- Loại bỏ bóng đổ và gradient khỏi các bề mặt dashboard.
- Đồng bộ chủ đề giữa Chrome Extension và Safari Userscript.


## v1.9.2 - Pickup Address Cache

- Lưu địa chỉ Pickup theo mã đơn trong local storage sau lần lấy thành công đầu tiên.
- Dùng lại địa chỉ đã lưu khi mã đơn còn trong kết quả lần tải tiếp theo.
- Xóa địa chỉ của các mã đơn không còn xuất hiện; tự hết hạn cache sau 3 ngày.
- Đồng bộ cache cho Chrome Extension và Safari Userscript.

## v1.9.3 - Monthly Delivery Performance

- Thêm mục Delivery Performance (Month), export với `frequency=4` và tháng `YYYY-MM`.
- Dùng chung luồng theo dõi export task và tải CSV với báo cáo ngày.
- Đọc các cột ngày làm việc, đơn phân công, đơn giao thành công và tỷ lệ giao thành công.
- Hiển thị bảng desktop/mobile cùng tổng hợp KPI.

## v2.0.0 - shadcn/ui Visual System

- Thay toàn bộ giao diện bằng hệ màu neutral, surface, border, radius và focus style kiểu shadcn/ui.
- Đồng bộ button, input, select, card, navigation, table, dialog và mobile cards.
- Giữ nguyên cấu trúc responsive và toàn bộ nghiệp vụ hiện có.
