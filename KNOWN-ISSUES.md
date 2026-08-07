# Known Issues & Roadmap — NLK 3D Energy Card

Tài liệu này ghi lại kết quả rà soát codebase, những gì đã sửa, và những gì còn lại.
Mục đích: bất kỳ ai (kể cả tác giả sau này) mở repo đều biết ngay đang ở đâu và nên làm gì tiếp.

This document records a codebase audit, what has been fixed, and what remains. Its purpose is so
that anyone opening this repo — including the author later — can immediately see where things stand.

- **Rà soát lần đầu / First audited:** 2026-08-07
- **Cập nhật lần cuối / Last updated:** 2026-08-07
- **Phiên bản hiện tại / Current version:** **v1.9.0**
- **Phạm vi / Scope:** `NLK-3d-energy-card.js`, `README.md`, `package.json`, `hacs.json`

> **Đọc phần 13 trước** — đó là bảng trạng thái đầy đủ của tất cả các mục (đã xong / chưa làm / đã xoá).
> Các phần 1–10 là nội dung rà soát gốc, giữ nguyên để tham chiếu. Phần 11–12 là ghi chú lịch sử.
>
> **Start with section 13** — the full status table for every item. Sections 1–10 are the original
> audit, kept for reference. Sections 11–12 are historical notes.

---

## 1. Bug / rủi ro chức năng

### 1.1 `_drawWires` chỉ chạy một lần, nhưng `render()` reset `d=""` mỗi lần re-render
- **Vị trí:** `updated()` + `_drawWires()`, và các thẻ `<path ... d="" />` trong `render()`
- **Vấn đề:** `updated()` có guard `if (!this._wired)` nên `_drawWires()` chỉ được gọi 1 lần (sau 100ms) và khi `resize`.
  Trong khi đó template Lit khai báo `d=""` cho cả 8 path (`base-*`, `flow-*`), còn `_drawWires()` lại ghi `d`
  bằng `setAttribute()` — tức là ghi ngoài phạm vi quản lý của Lit.
- **Rủi ro:** đây là vùng dễ sinh bug. Nếu Lit re-render và đồng bộ lại thuộc tính `d` (hoặc template thay đổi
  cấu trúc / thay đổi `class` của path khi `flow_style` đổi), các đường dây có thể bị xóa và không được vẽ lại
  vì `_wired` đã là `true`.
- **Hướng sửa gợi ý:** đưa path `d` vào state của component (dùng chính `_pathData` đã có) và bind qua template
  `d=${this._pathData?.solar}` thay vì `setAttribute`. Hoặc gọi lại `_drawWires()` mỗi lần `updated()` với
  điều kiện so sánh kích thước thay vì guard chạy-một-lần.

### 1.2 Không vẽ lại dây khi kích thước card đổi mà không có sự kiện `resize`
- **Vấn đề:** chỉ lắng nghe `window.resize`. Các trường hợp đổi kích thước không phát ra `resize`:
  đổi `card_size` trong config, đổi sidebar HA, chuyển tab Lovelace, thay đổi layout masonry,
  bật/tắt `compact_mode`, node đổi chiều cao khi thêm/bớt PV1/PV2/`total_yield`.
- **Hướng sửa gợi ý:** dùng `ResizeObserver` trên `#scene` thay cho / bổ sung cho `window.resize`.

### 1.3 Rò rỉ listener `resize` — thiếu `disconnectedCallback`
- **Vị trí:** `updated()` → `window.addEventListener('resize', () => this._drawWires())`
- **Vấn đề:** listener được thêm bằng arrow function ẩn danh, không lưu tham chiếu, và không có
  `disconnectedCallback()` để `removeEventListener`. Mỗi lần card bị tháo/gắn lại (edit dashboard,
  đổi view) sẽ để lại listener treo trỏ tới element đã chết.
- **Hướng sửa gợi ý:** lưu handler vào `this._onResize`, thêm `disconnectedCallback()` để remove;
  cũng nên `clearTimeout` cho `setTimeout(..., 100)`.

### 1.4 `setTimeout(..., 100)` là timing giả định, không đảm bảo
- **Vấn đề:** chờ cứng 100ms để DOM/font ổn định trước khi đo `getBoundingClientRect()`.
  Nếu font Orbitron hoặc `ha-icon` load chậm hơn 100ms, node đổi kích thước sau khi đo → dây lệch tâm.
- **Hướng sửa gợi ý:** dùng `await this.updateComplete` + `requestAnimationFrame`, và/hoặc
  `document.fonts.ready`, kết hợp `ResizeObserver` ở 1.2.

### 1.5 Chia cho 0 / giá trị vô hạn trong tính thời gian pin
- **Vị trí:** khối `batTimeRemaining` trong `render()`
- **Vấn đề:** `batCapacity` lấy từ config `battery_capacity || 10`. Nếu người dùng nhập `0`
  thì `|| 10` sẽ cứu được, nhưng nếu nhập giá trị âm hoặc `NaN` (editor dùng `parseFloat` trên input tự do)
  thì kết quả `toFixed(1)` có thể ra `NaN` hoặc số âm vô nghĩa hiển thị lên UI.
- **Ghi chú thêm:** logic giả định `battery_capacity` là kWh và `battery_power` là W (`absBatP / 1000`).
  Không có kiểm tra đơn vị thực tế của entity — nếu entity trả về kW thì kết quả sai 1000 lần.
- **Hướng sửa gợi ý:** validate `battery_capacity > 0` trong `setConfig()`; đọc
  `attributes.unit_of_measurement` để tự chuẩn hóa W/kW.

### 1.6 Giả định đơn vị W ở khắp nơi, không chuẩn hóa
- **Vấn đề:** `solarP`, `gridP`, `batP`, `loadP` đều được hiển thị `.toFixed(0) W` cứng và so sánh với
  `max_power` (mặc định 5000, ngụ ý W). Nếu entity của người dùng ở kW, toàn bộ hiển thị, ngưỡng pulse
  (`> 30% max_power`), ngưỡng ẩn dòng chảy (`< 5`) và tốc độ animation đều sai.
- **Hướng sửa gợi ý:** đọc `unit_of_measurement` và quy đổi về W tại `_getState`, hoặc thêm option
  `power_unit` / `power_factor` trong config.

### 1.7 `_getDisplay` cứng `toFixed(1)`
- **Vấn đề:** mọi giá trị "daily" đều làm tròn 1 chữ số thập phân bất kể đơn vị. Với Wh thì `12345.0 Wh`
  quá dài; với kWh nhỏ thì mất độ chính xác.
- **Hướng sửa gợi ý:** thêm option số chữ số thập phân, hoặc dùng
  `hass.formatEntityState()` / `Intl.NumberFormat` theo locale của HA.

### 1.8 Self-sufficiency có thể sai khi thiếu entity
- **Vị trí:** `selfSufficiency` trong `render()`
- **Vấn đề:** nếu `load_daily` có nhưng `grid_buy_daily` thiếu (`_getState` trả `0`), công thức
  `(loadDaily - 0) / loadDaily * 100` sẽ luôn ra **100%** — hiển thị sai lệch nghiêm trọng
  thay vì báo "không đủ dữ liệu".
- **Hướng sửa gợi ý:** chỉ tính khi cả hai entity đều tồn tại; nếu không thì ẩn chỉ số hoặc hiện `--`.

### 1.9 `_getState` trả `0` cho mọi trường hợp lỗi — không phân biệt "0 W" và "không có dữ liệu"
- **Vấn đề:** entity `unavailable` / `unknown` / thiếu cấu hình đều thành `0`. Người dùng không thể
  phân biệt "đang thực sự 0 W" với "sensor chết". Ảnh hưởng lan sang cả `loadP` fallback,
  self-sufficiency, chi phí, thời gian pin.
- **Hướng sửa gợi ý:** trả `null` khi không đọc được và xử lý riêng ở UI (badge cảnh báo / màu xám).

### 1.10 Không có báo lỗi khi entity không tồn tại
- **Vấn đề:** `setConfig()` chỉ kiểm tra `config.entities` có tồn tại hay không, không kiểm tra
  các entity_id bên trong có thật trong `hass.states` không. Card sẽ render toàn số 0 / `--`
  mà không nói gì cho người dùng biết là sai entity.
- **Hướng sửa gợi ý:** hiển thị warning trong card khi entity được cấu hình nhưng không tìm thấy.

### 1.11 `_handlePopup` gán `detail` sau khi tạo `Event`
- **Vị trí:** `_handlePopup(e)`
- **Vấn đề:** dùng `new Event(...)` rồi gán `ev.detail = {...}` thủ công thay vì `new CustomEvent(..., { detail })`.
  Cách này hiện vẫn chạy được với HA nhưng là anti-pattern, dễ vỡ nếu HA siết kiểu event.
- **Hướng sửa gợi ý:** đổi sang `CustomEvent`. Lưu ý: lỗi tương tự lặp lại ở **editor** —
  tất cả các chỗ `new Event("config-changed", ...)` rồi gán `.detail`.

### 1.12 Click vào inverter mở popup của entity nhiệt độ
- **Vị trí:** `@click=${() => this._handlePopup(E.inverter_temp)}` trên `.inverter`
- **Vấn đề:** nếu không cấu hình `inverter_temp`, click không làm gì (im lặng). Con trỏ vẫn là
  `cursor: pointer` gây nhầm lẫn. Ngoài ra popup nhiệt độ không hẳn là thứ người dùng mong đợi khi
  bấm vào "Inverter".
- **Hướng sửa gợi ý:** thêm option `inverter_tap_entity`, hoặc bỏ `cursor: pointer` khi không có entity.

---

## 2. Dead code / code chưa dùng

### 2.1 `_pathData` và khối so sánh `JSON.stringify` cuối `_drawWires()`
- **Vấn đề:** `_pathData` được khai báo trong `static get properties()` (nên là reactive property) và được
  set ở cuối `_drawWires()`, nhưng **không được đọc ở bất kỳ đâu** trong `render()`.
  Comment trong code ghi `// Save data for dots style` — nhưng thực tế style "dots" dùng chung path SVG
  với "dashed", chỉ khác `stroke-dasharray` trong CSS.
- **Hệ quả:** việc set `_pathData` trigger một lần re-render vô ích (may mắn là guard `_wired`
  ngăn được vòng lặp vô hạn).
- **Hướng sửa gợi ý:** hoặc **xóa** hẳn, hoặc **dùng đúng** cách nó vốn nên được dùng (xem 1.1) —
  bind `d` qua template. Cách thứ hai giải quyết luôn 1.1.

### 2.2 Hàm `getFlowClass` được định nghĩa nhưng không bao giờ gọi
- **Vị trí:** trong `render()`, ngay sau `getFlowStyle`
- **Vấn đề:** khai báo `const getFlowClass = (power, reverse = false) => {...}` nhưng không có call site nào.
  Template dùng trực tiếp `class="wire-flow ${flowStyle}"`. Tham số `reverse` cũng không được dùng
  bên trong hàm.
- **Hướng sửa gợi ý:** xóa.

### 2.3 Biến `nodeKey` trong `_drawWires()` là no-op
- **Vị trí:** `const nodeKey = key === 'bat' ? 'bat' : key;`
- **Vấn đề:** cả hai nhánh trả về `key`. Dòng này hoàn toàn vô nghĩa (dấu vết refactor cũ).
- **Hướng sửa gợi ý:** xóa, dùng trực tiếp `key`.

### 2.4 CSS `.main-val.flash` + keyframe `val-flash` không được sử dụng
- **Vấn đề:** có định nghĩa animation "flash khi giá trị đổi" trong `styles`, nhưng không có
  logic JS nào thêm class `flash` vào element. Feature nửa vời.
- **Hướng sửa gợi ý:** hoặc implement (so sánh giá trị cũ/mới trong `updated()` rồi toggle class),
  hoặc xóa CSS.

### 2.5 `card_size` có trong config & CSS nhưng không có control trong editor
- **Vấn đề:** `getStubConfig()` khai `card_size: "normal"`, CSS có
  `:host([data-size="compact"])` và `:host([data-size="large"])`, template set
  `data-size` lên `<ha-card>`. Nhưng **editor không có trường nào để đổi `card_size`** →
  người dùng UI-only không bao giờ dùng được feature này.
- **Vấn đề phụ (quan trọng):** selector CSS là `:host([data-size=...])` nhưng thuộc tính `data-size`
  lại được đặt trên `<ha-card>` **bên trong** shadow root, không phải trên `:host`.
  → **CSS này gần như chắc chắn không có tác dụng.** `--card-height` không bao giờ đổi;
  card luôn cao 420px.
- **Hướng sửa gợi ý:** đổi selector thành `ha-card[data-size="large"]`, và thêm select `card_size` vào editor.

### 2.6 `:host([data-compact])` có cùng lỗi selector như 2.5
- **Vấn đề:** `?data-compact=${isCompact}` được bind lên `<ha-card>`, nhưng CSS dùng `:host([data-compact])`.
  → **Compact Mode có checkbox trong editor nhưng không hoạt động** (`.sub-info` không bị ẩn).
- **Hướng sửa gợi ý:** đổi CSS sang `ha-card[data-compact] .sub-info { display: none; }` v.v.,
  hoặc set attribute lên host trong `updated()`.
- **Mức độ:** đây có thể là **bug người dùng thấy được rõ nhất** trong toàn bộ file.

### 2.7 `border-top-color` / `border-bottom-color` inline không thấy được
- **Vị trí:** các node đặt `style="border-top-color: ${cSolar};"` (solar/grid) và
  `border-bottom-color` (battery/load).
- **Vấn đề:** `.node` khai `border: 1px solid var(--border-color)` — border chỉ 1px và bị bo góc 16px,
  nên màu accent đặt ở một cạnh gần như không nhìn thấy. Ý định thiết kế (viền màu theo nguồn) không đạt.
- **Hướng sửa gợi ý:** tăng `border-top-width` cho cạnh đó (vd 3px), hoặc dùng
  `box-shadow inset` / dải màu riêng.

---

## 3. Phụ thuộc & khả năng hoạt động offline

### 3.1 Import LitElement từ CDN unpkg
- **Vị trí:** `import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module"`
- **Vấn đề:**
  - Card **không load được nếu HA không có internet ra ngoài** (mạng nội bộ, firewall, air-gapped).
  - Phụ thuộc uptime của unpkg.com.
  - `lit-element@2.4.0` đã cũ; HA hiện đại dùng Lit 2/3.
  - Mỗi lần load dashboard là một request ra internet (chậm + lộ thông tin).
- **Hướng sửa gợi ý (theo thứ tự ưu tiên):**
  1. Lấy Lit từ chính HA frontend, ví dụ
     `const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"))` (pattern phổ biến trong cộng đồng HA);
  2. Hoặc thêm bundler (rollup/esbuild) và ship 1 file self-contained (`.gitignore` đã chuẩn bị sẵn `dist/`).

### 3.2 Google Fonts được inject vào `document.head`
- **Vị trí:** khối `if (!document.querySelector('link[href*="fonts.googleapis.com..."]'))` ở đầu file
- **Vấn đề:**
  - Cũng cần internet; offline thì font Orbitron không có → fallback `'Segoe UI', sans-serif`
    (thay đổi kích thước chữ → có thể làm lệch phép đo `getBoundingClientRect` ở 1.4).
  - **Ghi thẳng vào `document.head` là side-effect toàn cục**, ảnh hưởng cả trang HA chứ không chỉ card.
  - Vấn đề quyền riêng tư / GDPR: gọi tới server Google trên mỗi lần load.
  - Side-effect chạy **ở thời điểm import module**, kể cả khi người dùng không dùng card nào.
- **Hướng sửa gợi ý:** nhúng font dưới dạng `@font-face` với base64/woff2 kèm theo repo,
  hoặc bỏ font tùy chỉnh, hoặc thêm option `use_custom_font: false`.

---

## 4. Thiếu API chuẩn của Lovelace card

### 4.1 Không implement `getCardSize()`
- **Vấn đề:** HA dùng `getCardSize()` để tính layout masonry. Không có nó, HA giả định giá trị mặc định
  và card cao 420px có thể bị xếp lệch so với các card khác.
- **Hướng sửa gợi ý:** thêm `getCardSize()` trả về số tương ứng chiều cao thực (theo `card_size`).

### 4.2 Không implement `getLayoutOptions()` / grid options
- **Vấn đề:** HA 2024.x+ có "Sections view" dùng grid; card không khai báo
  `grid_rows` / `grid_columns` / `getLayoutOptions()` → trải nghiệm kém trong sections view.

### 4.3 `setConfig()` validate quá lỏng
- **Vấn đề:** chỉ `if (!config.entities) throw`. Không kiểm tra các entity bắt buộc
  (`solar`, `grid`, `battery_power`, `battery_soc`, `load`), không kiểm tra kiểu của
  `max_power` / `buy_price` / `battery_capacity`, không chuẩn hóa giá trị.
- **Hướng sửa gợi ý:** validate + throw message rõ ràng; gán default ngay trong `setConfig` thay vì
  rải `|| default` khắp `render()`.

---

## 5. Vấn đề trong Editor

### 5.1 Không dùng `ha-entity-picker` / `ha-form`
- **Vấn đề:** editor dùng `<input type="text">` thuần cho entity_id. Người dùng phải tự nhớ và gõ đúng
  entity_id, không có autocomplete, không validate. Trải nghiệm rất kém so với các card HACS khác.
- **Hướng sửa gợi ý:** thay bằng `<ha-entity-picker .hass=${this.hass} .includeDomains=${['sensor']}>`,
  hoặc chuyển toàn bộ editor sang `ha-form` với schema khai báo.

### 5.2 Lặp code `config-changed` rất nhiều lần
- **Vấn đề:** pattern `const ev = new Event("config-changed", {...}); ev.detail = {...}; this.dispatchEvent(ev)`
  được copy-paste ~8 lần inline trong template (language, show_self_sufficiency, compact_mode,
  battery_invert, flow_style, và trong `_setColor`).
- **Hướng sửa gợi ý:** gom thành một helper duy nhất `_emit(partialConfig)`.

### 5.3 Editor dùng màu hard-code, không theo theme
- **Vị trí:** `styles` của editor: `border-bottom: 1px solid #444`, `color: #888`, `border: 1px solid #444`
- **Vấn đề:** hard-code màu tối → editor trông xấu/khó đọc trên HA theme sáng.
  (Ironically, card chính đã được làm theme-friendly ở v1.6.2 nhưng editor thì chưa.)
- **Hướng sửa gợi ý:** dùng `var(--divider-color)`, `var(--secondary-text-color)` như card chính.

### 5.4 Không có ô nhập màu cho phép reset về mặc định
- **Vấn đề:** `<input type="color">` luôn có giá trị; sau khi người dùng chỉnh một lần thì không có cách
  nào xóa để quay về `DEFAULT_COLORS`. Cũng không hỗ trợ `var(--...)` của theme.
- **Hướng sửa gợi ý:** thêm nút "Reset" cho mỗi màu (xóa key khỏi `config.colors`).

### 5.5 Input số dùng `parseFloat` không guard `NaN`
- **Vị trí:** `_val()`: `n[t.configValue] = t.type === 'number' ? parseFloat(t.value) : t.value`
- **Vấn đề:** nếu ô trống, `parseFloat("")` → `NaN` được ghi vào config. `NaN` trong YAML/JSON
  là giá trị bất hợp lệ và làm hỏng logic downstream (vd `max_power: NaN`).
- **Hướng sửa gợi ý:** kiểm tra `Number.isFinite()`, nếu không hợp lệ thì xóa key hoặc giữ default.

### 5.6 `.subValue` / `.configValue` gán `undefined` bằng property binding
- **Vị trí:** `_i()`: `.configValue=${s ? undefined : k} .subValue=${s ? k : undefined}`
- **Vấn đề:** hoạt động được nhưng khó đọc; đồng thời `_val()` phân biệt hai loại field bằng
  truthiness của `sub` → nếu sau này có key rỗng sẽ sai. Nên tách thành 2 hàm rõ ràng.

### 5.7 Editor thiếu nhiều option đã hỗ trợ trong card
- **Thiếu:** `card_size` (xem 2.5), `colors.inverter` có nhưng bị vô hiệu khi `inverter_temp` được cấu hình
  (vì `_getTempColor` ghi đè), `total_yield`/`pv1`/`pv2` có nhưng không ghi rõ là tùy chọn.

---

## 6. Logic / thiết kế cần xem lại

### 6.1 Màu inverter tùy chỉnh bị vô hiệu hóa âm thầm
- **Vấn đề:** `cInv = this._getTempColor(invTemp, 10, 70)`. Hàm này chỉ trả `this._getColor('inverter')`
  khi `!temp || temp <= 0`. Nghĩa là **nếu người dùng cấu hình `inverter_temp`, ô chọn màu Inverter
  trong editor trở thành vô dụng** — nhưng UI không hề nói gì.
- **Hướng sửa gợi ý:** thêm option `inverter_temp_color: true/false` để người dùng chọn giữa
  "màu theo nhiệt độ" và "màu cố định".

### 6.2 Ngưỡng nhiệt độ 10–70 °C hard-code
- **Vấn đề:** không cấu hình được; inverter khác nhau có dải nhiệt bình thường khác nhau.
  Cũng giả định đơn vị là °C — nếu HA đang dùng °F thì bảng màu hoàn toàn sai.
- **Hướng sửa gợi ý:** thêm `temp_min` / `temp_max` vào config; đọc `unit_of_measurement` để quy đổi °F.

### 6.3 Ngưỡng ẩn dòng chảy `< 5` hard-code, không theo `max_power`
- **Vấn đề:** `if (absP < 5) return 'opacity: 0;'` — với hệ 5000 W thì 5 W hợp lý, nhưng với hệ 100 kW
  hoặc entity đơn vị kW thì ngưỡng này vô nghĩa.
- **Hướng sửa gợi ý:** dùng tỉ lệ theo `max_power` hoặc thêm option `flow_threshold`.

### 6.4 Ngưỡng pulse `> 30% max_power` hard-code
- **Vấn đề:** `shouldPulse = |p| > maxP * 0.3`. Không cấu hình được, và áp dụng chung cho cả 4 node
  (kể cả battery — pin xả 30% max_power có ý nghĩa khác solar 30%).
- **Hướng sửa gợi ý:** thêm option `pulse_threshold`, hoặc ngưỡng riêng theo từng node.

### 6.5 Chiều dòng chảy solar và load không phản ánh thực tế
- **Vấn đề:** `flow-solar` không bao giờ đảo chiều (`getFlowStyle(solarP, cSolar)` — không truyền `reverse`),
  `flow-load` luôn `reverse = true`. Điều này đúng trong hầu hết trường hợp, nhưng không xử lý
  giá trị âm bất thường (một số inverter báo solar âm ban đêm do tiêu thụ nội bộ).
- **Ghi chú:** `getFlowStyle` dùng `Math.abs(p)` để tính tốc độ nên giá trị âm vẫn chạy animation
  nhưng sai chiều.

### 6.6 `loadP` fallback có thể sai dấu
- **Vị trí:** `const loadP = this._getState(E.load) || Math.abs(solarP + gridP + batP)`
- **Vấn đề 1:** dùng `||` nên nếu `load` thực sự = 0 W (nhà không tiêu thụ) sẽ rơi vào fallback tính toán.
- **Vấn đề 2:** công thức `solar + grid + bat` chỉ đúng với một quy ước dấu cụ thể;
  **không tính đến `battery_invert`** — khi `battery_invert: true` thì dấu của `batP` bị đảo và
  phép cộng này sai.
- **Hướng sửa gợi ý:** dùng kiểm tra tồn tại entity thay vì `||`; chuẩn hóa `batP` theo `battery_invert`
  **trước** khi dùng trong mọi phép tính.

### 6.7 `battery_invert` chỉ ảnh hưởng `isBatCharge`, không chuẩn hóa `batP`
- **Vấn đề:** `batteryInvert` chỉ được dùng ở một dòng (`isBatCharge`). Các chỗ khác dùng
  `absBatP = Math.abs(batP)` nên "may mắn" không sai, nhưng fallback `loadP` (6.6) và chiều
  animation `flow-bat` phụ thuộc dấu gốc → dễ sai.
- **Hướng sửa gợi ý:** tạo một `batPNormalized` ngay sau khi đọc state và dùng nhất quán về sau.

### 6.8 Chi phí giả định đơn vị năng lượng là kWh
- **Vấn đề:** `buyCost = grid_buy_daily × buy_price`. Nếu entity trả Wh thì chi phí sai 1000 lần.
  Không có kiểm tra đơn vị.

### 6.9 `formatCost` chỉ có một bậc rút gọn
- **Vấn đề:** `≥1000 → k`. Với tiền VND, chi phí ngày có thể lên hàng trăm nghìn → `250.0k đ`
  vẫn ổn, nhưng không có bậc `M`. Với tiền USD thì `1.2k$` lại vô nghĩa.
- **Hướng sửa gợi ý:** dùng `Intl.NumberFormat` với locale, hoặc thêm option format.

### 6.10 Chi phí chỉ hiện một chiều tại một thời điểm
- **Vấn đề:** node grid chỉ hiện Buy **hoặc** Sell tùy `isGridImport` tại thời điểm hiện tại.
  Nhưng cả hai đều là số liệu **tích lũy trong ngày** — người dùng thường muốn thấy cả hai.
  Buổi tối (đang import) sẽ không thấy được đã bán bao nhiêu trong ngày.
- **Hướng sửa gợi ý:** hiển thị cả Buy và Sell, dùng badge/highlight để chỉ chiều hiện tại.

### 6.11 Trạng thái pin nhị phân, không có "Idle"
- **Vấn đề:** `isBatCharge` chia làm 2 trạng thái. Khi pin đứng yên (0 W) card vẫn hiện
  "↗ Đang xả" — sai thông tin.
- **Hướng sửa gợi ý:** thêm trạng thái thứ ba (idle / standby) với ngưỡng deadband.

### 6.12 Trạng thái lưới cũng nhị phân
- **Vấn đề:** `isGridImport = gridP > 0`. Khi lưới = 0 W hiển thị như đang xuất.
  Ngoài ra CSS đã có `.status-import` / `.status-export` nhưng node grid **không dùng chúng**
  (chỉ node battery dùng `.status-charging` / `.status-discharging`) → thêm dead CSS.

---

## 7. Vấn đề repo / metadata

### 7.1 Thiếu file `LICENSE`
- `package.json` khai `"license": "MIT"`, README ghi "MIT License", nhưng **không có file LICENSE**
  trong repo. Cần thêm `LICENSE` (MIT, ghi tên tác giả + năm).

### 7.2 `hacs.json` thiếu key nên có
- Hiện có: `name`, `render_readme`, `filename`.
- **Thiếu:** `homeassistant` (phiên bản HA tối thiểu — README nói 2024.1+ nhưng HACS không biết).
- Cân nhắc: `hide_default_branch`, `country`.

### 7.3 README link tới repo sai tên
- Footer README: `https://github.com/nlkcodenew/nlk-3d-energy-card`
- Repo thật: `https://github.com/nlkcodenew/my-3d-energy-card`
- → link 404. Cần sửa.

### 7.4 README không tài liệu hóa `card_size`
- `card_size` tồn tại trong code nhưng không có trong phần "Full Options" của README.
  (Xem thêm 2.5 — feature này hiện đang hỏng.)

### 7.5 Không có `test` thực
- `package.json`: `"test": "echo \"Error: no test specified\" && exit 1"`.
  Không có lint, không có CI (`.github/workflows/` không tồn tại).
- **Hướng sửa gợi ý:** thêm ESLint + `hacs/action` validate + `prettier` check trong GitHub Actions.

### 7.6 Lịch sử commit không rõ ràng
- Rất nhiều commit chỉ có message `"1"` (ac263aa, c47e33a, 628b13e, 2a3109e, ee9d6cb, 5e2a1f7, 5b8af5b,
  ae01e8d, c6071ea, 818545e, 7bcb045...). Khó truy vết thay đổi.
- **Chỉ là ghi chú** — không nên rewrite history của repo đã publish.
- **Hướng sửa gợi ý:** áp dụng conventional commits từ nay (3 commit gần nhất đã làm đúng).

### 7.7 Không có git tag / GitHub Release
- README hướng dẫn "Download từ latest release" nhưng cần xác nhận có release/tag hay không.
  HACS dựa vào tag/release để quản lý phiên bản. Nếu chưa có, cần tạo tag `v1.6.2`.

### 7.8 Version được khai ở 3 nơi, dễ lệch
- `CARD_VERSION` trong JS, `version` trong `package.json`, badge trong `README.md`.
  Hiện cả 3 đều là `1.6.2` (khớp), nhưng không có cơ chế đồng bộ.
- **Hướng sửa gợi ý:** script bump version, hoặc sinh `CARD_VERSION` lúc build.

### 7.9 Changelog thiếu v1.6.0 và v1.6.1
- README changelog nhảy từ v1.5.0 → v1.6.2. Git log có commit `v1.6.1` (`d845db5`) và
  `feat: add theme-friendly solar card shell` (`faba25a`) nhưng không có entry changelog tương ứng.

### 7.10 Không có ảnh/screenshot trong README
- Card thiên về hình ảnh nhưng README không có screenshot/GIF nào. Ảnh hưởng lớn tới việc
  người dùng chọn cài đặt (và HACS render README).
- `.gitattributes` đã chuẩn bị sẵn rule cho `*.png`/`*.jpg` → có ý định thêm ảnh nhưng chưa làm.

---

## 8. Khả năng tiếp cận (a11y) & UX

### 8.1 Node click được nhưng không tiếp cận được bằng bàn phím
- `.node` và `.inverter` có `@click` + `cursor: pointer` nhưng không có `tabindex`, `role="button"`,
  `aria-label`, và không xử lý `keydown` (Enter/Space). Không dùng được với bàn phím / screen reader.

### 8.2 Không tôn trọng `prefers-reduced-motion`
- Card có nhiều animation liên tục (`flow-dashed`, `flow-dots`, `node-pulse`, `ring-pulse`)
  chạy vô hạn. Không có `@media (prefers-reduced-motion: reduce)` để tắt.
- **Đây là vấn đề tiếp cận thật sự** (có thể gây khó chịu / nguy hiểm với người nhạy cảm chuyển động),
  và cũng tốn CPU/battery.

### 8.3 Animation vô hạn chạy cả khi card không nhìn thấy
- Animation CSS tiếp tục chạy khi card ở tab khác hoặc scroll ra ngoài viewport → tốn pin trên mobile.
- **Hướng sửa gợi ý:** dùng `IntersectionObserver` để tạm dừng (`animation-play-state: paused`).

### 8.4 Độ tương phản màu có thể không đạt
- Nhiều màu neon trên nền có thể fail WCAG, đặc biệt trên HA theme **sáng**:
  `#ffdd00` (solar) và `#00f3ff` (grid) trên nền trắng gần như không đọc được.
  Tương tự `.cost-row { color: #00a86b }`, `#ffd700` (số W của pin), `.self-sufficiency { color: #00ff9d }`.
- v1.6.2 đã làm surface theme-friendly nhưng **màu chữ/accent vẫn hard-code**.

### 8.5 `filter: drop-shadow(0 0 4px currentColor)` trên path animation
- Áp dụng filter lên phần tử đang animate liên tục là tốn kém về hiệu năng (buộc repaint GPU).
  Trên thiết bị yếu (tablet cũ làm wall panel) có thể gây lag rõ rệt.

### 8.6 `backdrop-filter: blur(18px)` nhiều lớp
- `ha-card`, `.node`, `.inverter` đều dùng `backdrop-filter`. Nhiều lớp blur lồng nhau rất nặng,
  và trên nền chỉ có `.bg-grid` thì hiệu ứng gần như không thấy được → chi phí cao, lợi ích thấp.

### 8.7 Layout tuyệt đối dễ vỡ
- 4 node đặt `position: absolute` với `width: 120px` cố định (95px trên mobile), card cao cố định 420px.
  Nội dung node thay đổi (thêm PV1/PV2/total_yield, chuỗi dịch dài, font lớn theo cài đặt HA)
  có thể tràn hoặc chồng lên inverter ở giữa.
- Chỉ có 1 breakpoint duy nhất (`max-width: 400px`) — khoảng 400–600px chưa được xử lý.

### 8.8 `color-mix()` cần trình duyệt mới
- `color-mix(in srgb, ...)` được dùng nhiều trong `:host`. Hỗ trợ từ Chrome 111 / Safari 16.2.
  Trên tablet Android cũ dùng làm wall panel (WebView cũ) → **các biến surface sẽ invalid
  và card có thể mất hoàn toàn background/border**. Không có fallback.
- **Hướng sửa gợi ý:** khai báo giá trị fallback trước dòng `color-mix`, hoặc dùng
  `@supports (color: color-mix(in srgb, red, blue))`.

### 8.9 Không có trạng thái loading / error hiển thị
- `render()` trả `html``` (rỗng) khi thiếu `hass`/`config` → card trắng, không phản hồi.

---

## 9. Ưu tiên đề xuất

**P0 — hỏng chức năng người dùng thấy được:**
- 2.6 Compact Mode không hoạt động (sai selector `:host([data-compact])`)
- 2.5 `card_size` không hoạt động (sai selector `:host([data-size])`) + thiếu control trong editor
- 1.1 Rủi ro mất đường dây khi re-render
- 8.8 `color-mix()` không fallback → có thể vỡ giao diện trên WebView cũ

**P1 — sai dữ liệu / dễ gây hiểu nhầm:**
- 1.8 Self-sufficiency luôn 100% khi thiếu `grid_buy_daily`
- 6.6 / 6.7 `loadP` fallback + `battery_invert` không chuẩn hóa dấu
- 6.1 Màu inverter tùy chỉnh bị vô hiệu âm thầm
- 6.11 / 6.12 Thiếu trạng thái Idle cho pin và lưới
- 1.6 / 1.5 / 6.8 Giả định đơn vị W/kWh không kiểm tra

**P2 — độ bền & vận hành:**
- 3.1 Bỏ phụ thuộc CDN unpkg (quan trọng cho cài đặt offline)
- 3.2 Bỏ / nhúng Google Fonts
- 1.3 Rò rỉ listener `resize`
- 1.2 / 1.4 Dùng `ResizeObserver` + `document.fonts.ready` thay `setTimeout`
- 4.1 / 4.2 Thêm `getCardSize()` / layout options

**P3 — dọn dẹp & chất lượng:**
- 2.1 / 2.2 / 2.3 / 2.4 Xóa dead code
- 5.1 Dùng `ha-entity-picker` trong editor
- 5.2 / 5.3 / 5.5 Dọn editor
- 8.1 / 8.2 A11y: keyboard + `prefers-reduced-motion`
- 7.1 / 7.2 / 7.3 / 7.9 Sửa metadata repo, thêm LICENSE, sửa link README, bổ sung changelog
- 7.5 Thêm lint + CI
- 7.10 Thêm screenshot

---

## 10. Kết luận nhanh

Codebase nhỏ (1 file, ~400 dòng), không dependency build, dễ đọc và dễ sửa.
Hai vấn đề đáng sửa trước nhất là **cặp selector CSS sai** (`:host([data-compact])` /
`:host([data-size])` trong khi attribute nằm trên `<ha-card>`) — làm 2 feature đã quảng cáo
trong README không hoạt động — và **phụ thuộc CDN unpkg** làm card không dùng được offline.

Ngoài ra có một cụm vấn đề nhất quán về **giả định đơn vị (W / kWh / °C)** cần một lần refactor
chuẩn hóa ở tầng `_getState`, sẽ giải quyết đồng thời nhiều mục ở phần 6.


---

## 11. Trạng thái sửa chữa

### Đã sửa trong v1.7.0 (2026-08-07) — cùng lượt làm feature off-grid load

| Mục | Nội dung | Ghi chú |
|-----|----------|---------|
| **6.6** | `loadP` fallback dùng `\|\|` nên load = 0 W thật bị rơi vào công thức ước lượng | Đã đổi sang kiểm tra tồn tại entity qua `_hasState()` |
| **1.9** (một phần) | `_getState` không phân biệt "0 W" với "không có dữ liệu" | Đã thêm helper `_hasState()`. `_getState` vẫn trả `0` như cũ (không đổi để tránh vỡ chỗ khác), nhưng giờ đã có công cụ để phân biệt |
| **1.10** (một phần) | Không báo gì khi entity thiếu | Riêng `load_offgrid` và `grid` đã được kiểm tra hợp lệ trước khi dùng để quyết định nguồn |
| **5.5** | Editor ghi `NaN` vào config khi ô số bị bỏ trống | Đã guard bằng `Number.isFinite()`; input không hợp lệ sẽ xoá key để card dùng default |
| **1.12** (một phần) | Click node mở popup của entity không đúng | Node Load giờ mở đúng sensor đang được hiển thị (`loadEntity`), không cứng `E.load` |
| **2.6** (một phần) | `:host([data-compact])` sai selector | **Chưa sửa gốc.** Nhưng đã thêm rule `ha-card[data-compact]` để badge off-grid hiển thị được trong compact mode. Việc sửa gốc vẫn còn ở mục 2.6 |

### Vẫn còn nguyên — ưu tiên cao

- **2.5 / 2.6** — `card_size` và `compact_mode` vẫn hỏng do sai selector `:host([...])`
  trong khi attribute nằm trên `<ha-card>`. **Đây vẫn là P0.**
  (Rule mới thêm cho badge off-grid dùng đúng `ha-card[...]` — có thể tham khảo làm mẫu để sửa.)
- **1.1** — rủi ro mất đường dây khi re-render (chưa chạm)
- **8.8** — `color-mix()` không fallback (chưa chạm)
- **1.8** — self-sufficiency luôn 100% khi thiếu `grid_buy_daily`.
  Giờ đã có `_hasState()` nên sửa mục này rất dễ: chỉ tính khi cả hai entity đều hợp lệ.
- **6.7** — `battery_invert` chưa chuẩn hoá dấu `batP`. Lưu ý: công thức fallback
  `Math.abs(solarP + gridP + batP)` vẫn còn đó (chỉ ít bị gọi hơn), nên lỗi này vẫn tiềm ẩn.
- **1.6 / 6.8 / 6.2** — giả định đơn vị W / kWh / °C, chưa chuẩn hoá
- **3.1 / 3.2** — vẫn phụ thuộc CDN unpkg + Google Fonts
- **1.3 / 1.2 / 1.4** — rò rỉ listener `resize`, chưa dùng `ResizeObserver`
- Toàn bộ phần **2** (dead code), **4**, **5** (trừ 5.5), **7**, **8** (trừ ghi chú badge) chưa chạm

### Ghi chú kỹ thuật cho lần sau

Khi chèn khối logic mới vào đầu `render()`, đã phát sinh **ReferenceError do temporal dead zone**:
`absGridP` được dùng trước dòng `const absGridP = ...`. Đã xử lý bằng cách di chuyển nhóm khai báo
`isGridImport` / `isBatCharge` / `absBatP` / `absGridP` lên trước khối off-grid.
→ `render()` hiện đã dài và thứ tự khai báo khá dễ vỡ. Nếu còn thêm logic nữa, nên tách các phép
tính ra một hàm riêng (vd `_computeMetrics()`) trả về object, thay vì tiếp tục nhồi vào `render()`.

### Cách chạy lại test logic chọn nguồn

Test dùng stub Lit + stub `hass`, không cần Home Assistant:

```bash
mkdir -p test-suite && cd test-suite
# tạo litstub.js xuất LitElement/html/css rỗng
sed 's|https://unpkg.com/lit-element@2.4.0/lit-element.js?module|./litstub.js|' \
  /path/to/NLK-3d-energy-card.js > card.mjs
node test.mjs   # 16 case: blackout, export, noise, entity thiếu, ngưỡng tuỳ chỉnh
```

Kết quả lần chạy 2026-08-07: **16 passed, 0 failed**.
Test này **chưa được commit vào repo** (mục 7.5 vẫn còn: repo không có test/CI).


---

## 12. TRẠNG THÁI CHỐT — 2026-08-07 (sau v1.7.2)

### Trạng thái repo

| | |
|---|---|
| HEAD | `2569485` revert: restore v1.6.2 compact-mode and card_size CSS verbatim |
| Release Latest | `v1.7.2` |
| `CARD_VERSION` | `1.7.2` |
| CSS compact/`card_size` | **giống hệt v1.6.2** (đã xác nhận bằng `diff`) |
| Feature off-grid | hoạt động, đã xác nhận trên HA thật bởi người dùng |

### Phát hành trong đợt này

| Version | Trạng thái | Ghi chú |
|---|---|---|
| `v1.7.0` | ⚠️ **KHÔNG DÙNG** | Có feature off-grid, nhưng CSS badge ẩn sub-info khi bật compact mode |
| `v1.7.1` | ⚠️ **KHÔNG DÙNG** | Sửa v1.7.0 nhưng lại kích hoạt compact mode lần đầu → vẫn ẩn sub-info |
| `v1.7.2` | ✅ **ỔN ĐỊNH** | Revert toàn bộ CSS về v1.6.2. Chỉ còn feature off-grid |

### Bài học — nguyên nhân gốc của cả 2 lần hỏng

Cả hai lỗi **không phải lỗi kỹ thuật CSS**, mà là **lỗi phạm vi**:

1. Yêu cầu của người dùng: thêm option sensor cho lúc mất điện lưới.
2. Tôi tự quyết rằng badge off-grid "phải" hiển thị trong compact mode → chạm vào CSS
   ngoài phạm vi → **v1.7.0 hỏng**.
3. Sửa v1.7.0 bằng cách sửa luôn bug selector gốc (mục 2.6) → compact mode hoạt động lần
   đầu tiên → người dùng đang bật checkbox đó mất sub-info **đúng theo thiết kế** → **v1.7.1 hỏng nặng hơn**.

**Quy tắc rút ra:**
- Sửa một bug đã tồn tại lâu **là một thay đổi hành vi**. Hành vi "hỏng" có thể đã thành
  hành vi người dùng quen dùng. Không bao giờ sửa kèm — phải là quyết định riêng, có chủ ý.
- Khi feature mới va vào một bug đã biết, **hỏi người dùng**, đừng tự quyết.
- Mục 2.5/2.6 vẫn để nguyên **có chủ ý**. Sửa nó sẽ đổi giao diện của bất kỳ ai đang bật
  `compact_mode` (hiện đang vô hại). Phải là opt-in.

### Công cụ test đã có (dùng lại cho lần sau)

Ở `test-suite/` (⚠️ `/tmp` mất khi reboot — copy đi nếu cần giữ):

| File | Mục đích | Kết quả lần chạy |
|---|---|---|
| `litstub.js` | Stub `LitElement`/`html`/`css` để load file ngoài HA | — |
| `test.mjs` | 16 case logic chọn nguồn off-grid (blackout, export, noise, entity thiếu, ngưỡng) | 16/16 pass |
| `domtest.mjs` | 11 case **selector matching trên DOM thật** (jsdom) | 11/11 pass |

`domtest.mjs` **tái hiện được cả 2 bug đã gây ra** (mục C = bug v1.7.0, mục D = rule v1.7.1).
Nếu có harness này từ đầu, bug v1.7.0 đã bị bắt trước khi phát hành.
**Bắt buộc chạy cả 2 file trước mọi lần phát hành có chạm CSS.**

**Giới hạn cần biết:** máy không có Chrome/Chromium/puppeteer/playwright, nên jsdom chỉ
kiểm chứng được **selector có khớp đúng element hay không**. Nó **không** tính cascade,
specificity, hay computed style thật. Với thay đổi CSS phức tạp, vẫn cần người xem bằng mắt
trên HA thật.

### Ghi chú về xác minh

Không dùng long-lived token của HA. Lý do: các bug còn lại đều là **CSS/DOM trong shadow root**,
mà REST API của HA không quan sát được lớp render. Token tạo cảm giác "đã kiểm chứng" mà thực chất
không kiểm được đúng lớp đã gây lỗi. Dùng harness jsdom ở trên thay thế, kèm nêu rõ giới hạn.


---

# 13. BẢNG TRẠNG THÁI CHỐT — v1.9.0 (2026-08-07)

## Trạng thái repo

| | |
|---|---|
| HEAD | `a0e715d` fix: add color-mix() fallback; stop faking 100% self-sufficiency |
| Release Latest | **v1.9.0** |
| `CARD_VERSION` | `1.9.0` |
| Người dùng xác nhận | ✅ Đã kiểm tra trên HA thật, Web UI ổn, off-grid hoạt động đúng |
| Test tự động | **57/57 pass** (5 suite) |

## Ký hiệu

- ✅ **XONG** — đã sửa và phát hành
- 🗑️ **ĐÃ XOÁ** — bỏ hẳn feature thay vì sửa
- ⬜ **CHƯA LÀM** — còn nguyên, có chủ ý
- ⛔ **KHÔNG LÀM** — đã điều tra và quyết định không làm

---

## Phần 1 — Bug / rủi ro chức năng

| Mục | Nội dung | Trạng thái | Version |
|---|---|---|---|
| 1.1 | `_drawWires` chỉ chạy 1 lần, `render()` reset `d=""` | ⬜ CHƯA LÀM | — |
| 1.2 | Không vẽ lại dây khi đổi kích thước không có `resize` | ✅ **XONG một phần** | v1.7.3 |
| 1.3 | Rò rỉ listener `resize` — thiếu `disconnectedCallback` | ✅ **XONG** | v1.7.3 |
| 1.4 | `setTimeout(100)` là timing giả định | ⬜ CHƯA LÀM | — |
| 1.5 | Chia cho 0 trong tính thời gian pin | ⬜ CHƯA LÀM | — |
| 1.6 | Giả định đơn vị W, không chuẩn hoá | ⬜ CHƯA LÀM | — |
| 1.7 | `_getDisplay` cứng `toFixed(1)` | ⬜ CHƯA LÀM | — |
| 1.8 | Self-sufficiency sai 100% khi thiếu `grid_buy_daily` | ✅ **XONG** | v1.9.0 |
| 1.9 | `_getState` không phân biệt "0 W" và "không có dữ liệu" | ✅ **XONG một phần** | v1.7.0 |
| 1.10 | Không báo lỗi khi entity không tồn tại | ⬜ CHƯA LÀM | — |
| 1.11 | `_handlePopup` gán `detail` sau `new Event` | ✅ **XONG** | v1.7.3 |
| 1.12 | Click inverter mở popup entity nhiệt độ | ✅ **XONG một phần** | v1.7.0 |

**Ghi chú 1.2:** `disconnectedCallback` reset `_wired = false`, nên dây được vẽ lại khi re-attach
(đổi view, sửa dashboard). Chưa dùng `ResizeObserver` nên các trường hợp đổi kích thước khác
vẫn chưa xử lý.

**Ghi chú 1.9:** đã thêm helper `_hasState()` (5 chỗ dùng). `_getState` vẫn trả `0` như cũ để không
vỡ chỗ khác, nhưng giờ đã có công cụ phân biệt.

**Ghi chú 1.12:** node Load giờ mở đúng sensor đang hiển thị (`loadEntity`). Node inverter vẫn mở
popup `inverter_temp`.

---

## Phần 2 — Dead code

| Mục | Nội dung | Trạng thái | Version |
|---|---|---|---|
| 2.1 | `_pathData` + khối `JSON.stringify` cuối `_drawWires()` | ⬜ CHƯA LÀM | — |
| 2.2 | `getFlowClass` khai báo nhưng không gọi | ✅ **XONG** | v1.7.3 |
| 2.3 | `nodeKey` là no-op | ✅ **XONG** | v1.7.3 |
| 2.4 | CSS `.main-val.flash` + `val-flash` không dùng | ✅ **XONG** | v1.7.3 |
| 2.5 | `card_size` không hoạt động (sai selector) | 🗑️ **ĐÃ XOÁ** | v1.8.1 |
| 2.6 | `compact_mode` không hoạt động (sai selector) | 🗑️ **ĐÃ XOÁ** | v1.8.0 |
| 2.7 | `border-top-color` inline không thấy được | ⬜ CHƯA LÀM | — |

**Ghi chú 2.1:** cố ý giữ `_pathData` (4 chỗ). Xoá nó sẽ **bỏ một lần re-render**, có thể ảnh hưởng
việc vẽ dây. Gắn chặt với mục 1.1 — phải làm cùng nhau, không tách rời.

**Ghi chú 2.5:** xoá `card_size` nhưng **giữ biến `--card-height`**, nên vẫn đổi được chiều cao
qua `card-mod`:
```yaml
card_mod:
  style: |
    ha-card { --card-height: 520px; }
```

---

## Phần 3 — Phụ thuộc & offline

| Mục | Nội dung | Trạng thái |
|---|---|---|
| 3.1 | Import LitElement từ CDN unpkg | ⛔ **KHÔNG LÀM** |
| 3.2 | Google Fonts inject vào `document.head` | ⬜ CHƯA LÀM |

### ⛔ 3.1 — quan trọng: đã điều tra, cách phổ biến KHÔNG hoạt động

Pattern phổ biến trong cộng đồng HA:
```js
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const { html, css } = LitElement.prototype;   // ❌ SAI
```

Đã **kiểm chứng bằng lit-element 2.4.0 và lit 2.x thật** (jsdom + `npm install`):

| | `prototype.html` | `prototype.css` | `static finalize` |
|---|---|---|---|
| lit-element 2.4.0 | `undefined` | `undefined` | `function` |
| lit 2.x | `undefined` | `undefined` | `function` |

`html`/`css` **không nằm trên prototype**. Đã thử thêm: lấy từ `static styles`, từ `TemplateResult`
— không có đường nào đáng tin cậy để lấy hàm tag `html`/`css` từ element HA.

Code đã viết xong rồi **hoàn nguyên**, không phát hành. Nếu sau này muốn làm 3.1, cách duy nhất
hoạt động là **bundle Lit vào file** (rollup/esbuild), đánh đổi:
- File tăng ~35KB → ~60-70KB
- Cần build step: sửa `src/` → build → push (hiện tại chỉ cần sửa 1 file)
- Cần Node.js + `npm install`

Quyết định: bỏ qua, vì HA của người dùng có internet (`<your-ha-host>`).

**Ghi chú 3.2:** vẫn ghi vào `document.head` toàn cục, ảnh hưởng cả trang HA. Không cần build step
để sửa — có thể làm độc lập với 3.1.

---

## Phần 4 — API Lovelace

| Mục | Nội dung | Trạng thái | Version |
|---|---|---|---|
| 4.1 | Không có `getCardSize()` | ✅ **XONG** | v1.7.3 |
| 4.2 | Không có `getLayoutOptions()` / grid options | ⬜ CHƯA LÀM | — |
| 4.3 | `setConfig()` validate quá lỏng | ⬜ CHƯA LÀM | — |

---

## Phần 5 — Editor

| Mục | Nội dung | Trạng thái | Version |
|---|---|---|---|
| 5.1 | Không dùng `ha-entity-picker` / `ha-form` | ⬜ CHƯA LÀM | — |
| 5.2 | Lặp code `config-changed` ~7 lần | ⬜ CHƯA LÀM | — |
| 5.3 | Editor hard-code màu tối, không theo theme | ⬜ CHƯA LÀM | — |
| 5.4 | Không reset màu về mặc định | ⬜ CHƯA LÀM | — |
| 5.5 | Input số ghi `NaN` vào config | ✅ **XONG** | v1.7.0 |
| 5.6 | `.subValue`/`.configValue` gán `undefined` | ⬜ CHƯA LÀM | — |
| 5.7 | Editor thiếu option đã hỗ trợ | ✅ **Không còn áp dụng** | v1.8.1 |

**Ghi chú 5.7:** hai option thiếu control (`card_size`, `compact_mode`) đã bị xoá hẳn, nên mục này
tự hết. Đã **thêm mới** vào editor: `load_offgrid`, `offgrid_grid_threshold`, `offgrid_min_power`.

---

## Phần 6 — Logic / thiết kế

| Mục | Nội dung | Trạng thái | Version |
|---|---|---|---|
| 6.1 | Màu inverter tuỳ chỉnh bị nhiệt độ ghi đè âm thầm | ⬜ CHƯA LÀM | — |
| 6.2 | Ngưỡng nhiệt 10–70 °C hard-code | ⬜ CHƯA LÀM | — |
| 6.3 | Ngưỡng ẩn dòng chảy `< 5` hard-code | ⬜ CHƯA LÀM | — |
| 6.4 | Ngưỡng pulse 30% hard-code | ⬜ CHƯA LÀM | — |
| 6.5 | Chiều dòng chảy solar/load không phản ánh giá trị âm | ⬜ CHƯA LÀM | — |
| 6.6 | `loadP` fallback dùng `\|\|` — load 0 W thật bị mất | ✅ **XONG** | v1.7.0 |
| 6.7 | `battery_invert` chưa chuẩn hoá dấu `batP` | ⬜ CHƯA LÀM | — |
| 6.8 | Chi phí giả định đơn vị kWh | ⬜ CHƯA LÀM | — |
| 6.9 | `formatCost` chỉ 1 bậc rút gọn | ⬜ CHƯA LÀM | — |
| 6.10 | Grid chỉ hiện Buy **hoặc** Sell | ⬜ CHƯA LÀM | — |
| 6.11 | Pin nhị phân, thiếu trạng thái Idle | ⬜ CHƯA LÀM | — |
| 6.12 | Grid nhị phân + CSS `.status-import/.status-export` dead | ⬜ CHƯA LÀM | — |

**Ghi chú 6.7:** vẫn tiềm ẩn. Công thức fallback `Math.abs(solarP + gridP + batP)` còn đó
(ít bị gọi hơn sau v1.7.0 nhưng chưa mất) và **không tính `battery_invert`**.

---

## Phần 7 — Repo / metadata

| Mục | Nội dung | Trạng thái | Version |
|---|---|---|---|
| 7.1 | Thiếu file `LICENSE` | ✅ **XONG** | v1.7.0 |
| 7.2 | `hacs.json` thiếu key | ✅ **XONG** | v1.7.0 |
| 7.3 | README link tới repo sai tên (404) | ✅ **XONG** | v1.7.0 |
| 7.4 | README không tài liệu hoá `card_size` | ✅ **Không còn áp dụng** | v1.8.1 |
| 7.5 | Không có test / lint / CI trong repo | ⬜ CHƯA LÀM | — |
| 7.6 | Lịch sử commit nhiều message `"1"` | ⛔ KHÔNG LÀM (không rewrite history đã publish) |
| 7.7 | Không có git tag / Release | ✅ **XONG** | v1.7.0+ |
| 7.8 | Version khai ở 3 nơi, dễ lệch | ⬜ CHƯA LÀM | — |
| 7.9 | Changelog thiếu v1.6.0 / v1.6.1 | ⬜ CHƯA LÀM | — |
| 7.10 | Không có screenshot trong README | ⬜ CHƯA LÀM | — |

**Ghi chú 7.2:** đã thêm `homeassistant: 2024.1.0` và `hide_default_branch: true`.
`hide_default_branch` quan trọng: buộc HACS chỉ theo Releases, bỏ qua tag rác.

**Ghi chú 7.5:** ⚠️ **57 test đang nằm ở `test-suite/`, CHƯA commit vào repo.**
`/tmp` mất khi reboot. Xem phần "Công cụ test" bên dưới.

**Ghi chú 7.7:** đã dọn 15 tag rác `v3.x` (dự án cũ `hiasm-energy-card.js`) khỏi remote.
Backup mapping tag→commit ở `(local backup, not in repo)` (cũng sẽ mất khi reboot).

---

## Phần 8 — A11y & UX

| Mục | Nội dung | Trạng thái | Version |
|---|---|---|---|
| 8.1 | Node click được nhưng không dùng được bàn phím | ⬜ CHƯA LÀM | — |
| 8.2 | Không tôn trọng `prefers-reduced-motion` | ⬜ CHƯA LÀM | — |
| 8.3 | Animation chạy cả khi card không nhìn thấy | ⬜ CHƯA LÀM | — |
| 8.4 | Độ tương phản màu có thể fail WCAG (theme sáng) | ⬜ CHƯA LÀM | — |
| 8.5 | `filter: drop-shadow` trên path animation (tốn GPU) | ⬜ CHƯA LÀM | — |
| 8.6 | Nhiều lớp `backdrop-filter: blur` | ⬜ CHƯA LÀM | — |
| 8.7 | Layout tuyệt đối dễ vỡ, chỉ 1 breakpoint | ⬜ CHƯA LÀM | — |
| 8.8 | `color-mix()` không fallback | ✅ **XONG** | v1.9.0 |
| 8.9 | Không có trạng thái loading / error | ⬜ CHƯA LÀM | — |

---

## Tổng kết số liệu

| Trạng thái | Số mục |
|---|---|
| ✅ Đã xong (gồm "một phần") | **17** |
| 🗑️ Đã xoá feature | **2** |
| ⛔ Quyết định không làm | **2** |
| ⬜ Chưa làm | **43** |
| **Tổng** | **64** |

---

## Feature MỚI đã thêm (không có trong audit ban đầu)

**Off-grid Load Source** — yêu cầu chính của người dùng, phát hành v1.7.0, ổn định từ v1.7.2:

| Thành phần | Chi tiết |
|---|---|
| Entity mới | `load_offgrid` (Power (Off-grid / AC output)) |
| Option mới | `offgrid_grid_threshold` (mặc định `1` W) |
| Option mới | `offgrid_min_power` (mặc định `0` = tắt) |
| UI | Badge cam ⚠ **Mất lưới** trên node Load |
| Editor | 2 ô Power + 2 ô ngưỡng + 2 dòng hướng dẫn |

**Quyết định thiết kế quan trọng:** dùng `abs(grid) < ngưỡng` thay vì `grid <= 0` như ý tưởng ban
đầu của người dùng. Lý do: grid âm nghĩa là **đang xuất điện lên lưới** (lưới vẫn bình thường);
`grid <= 0` sẽ chuyển nguồn sai mỗi lần bán điện. Giá trị tuyệt đối chỉ khớp đúng blackout thật,
đồng thời chịu được nhiễu sensor âm nhỏ.

Cũng đã thuyết phục người dùng bỏ điều kiện `ac_output > 50W` khỏi logic chính (chuyển thành option
mặc định tắt): nếu mất điện mà nhà chỉ tiêu thụ 30 W thì điều kiện 50 W sẽ thất bại và quay về
sensor sai — đúng lúc cần chính xác nhất.

**Cấu hình thực tế của người dùng (Lumentree):**
```yaml
entities:
  grid: sensor.lumentree_local_XXXXXXXXX_grid_power
  load: sensor.lumentree_local_XXXXXXXXX_load_power
  load_offgrid: sensor.lumentree_local_XXXXXXXXX_ac_output_power
  grid_buy_daily: sensor.lumentree_local_XXXXXXXXX_daily_grid_import_energy
  grid_sell_daily: sensor.lumentree_local_XXXXXXXXX_daily_grid_export_energy
offgrid_grid_threshold: 1
offgrid_min_power: 0
```

---

## Công cụ test

✅ **Đã lưu ra `test-suite/`** (an toàn qua reboot) — **72 test, 6 suite**.
Chạy bằng `./run.sh`. Có `README.md` riêng mô tả từng suite và giới hạn.

⚠️ Vẫn **chưa commit vào repo** — xem mục 7.5.

Backup tag rác đã lưu ở `(local backup, not in repo)`.

| File | Case | Kiểm gì |
|---|---|---|
| `litstub.js` | — | Stub `LitElement`/`html`/`css` để load card ngoài HA |
| `test.mjs` | 16 | Logic chọn nguồn off-grid: blackout, export, noise, entity thiếu, ngưỡng |
| `selfsuf.mjs` | 12 | Self-sufficiency, gồm 4 case chứng minh config đủ entity không đổi số |
| `supports.mjs` | 14 | Mọi `color-mix()` nằm trong `@supports`, mọi biến có fallback |
| `legacy2.mjs` | 8 | Config cũ còn `compact_mode`/`card_size` không gây lỗi |
| `lifecycle.mjs` | 7 | Không rò rỉ listener `resize` qua các chu kỳ attach/detach |
| `domtest.mjs` | 15 | Selector matching trên DOM thật (jsdom) — **tái hiện được bug v1.7.0/v1.7.1** |

**Cách chạy:**
```bash
cd test-suite
sed 's|https://unpkg.com/lit-element@2.4.0/lit-element.js?module|./litstub.js|' \
  NLK-3d-energy-card.js > card.mjs
for f in test.mjs selfsuf.mjs supports.mjs legacy2.mjs lifecycle.mjs; do node $f; done
```

**Việc nên làm sớm:** commit các test này vào repo (mục 7.5). Chúng đã chứng minh giá trị —
`domtest.mjs` tái hiện chính xác cả 2 bug đã gây ra ở v1.7.0/v1.7.1.

### Giới hạn của bộ test — PHẢI biết

Máy **không có** Chrome/Chromium/puppeteer/playwright. jsdom chỉ kiểm chứng được
**selector có khớp đúng element hay không**. Nó **KHÔNG** kiểm được:
- CSS cascade và specificity
- Computed style thật
- Layout / kích thước thật
- `@supports` có thực sự được browser áp dụng đúng

→ Với mọi thay đổi CSS, **vẫn cần người xem bằng mắt trên HA thật.**

---

## Bài học quan trọng nhất từ đợt này

**v1.7.0 và v1.7.1 đều hỏng vì cùng một nguyên nhân: vượt phạm vi yêu cầu.**

1. Người dùng nhờ: thêm option sensor cho lúc mất điện lưới.
2. Tự quyết badge off-grid "phải" hiện trong compact mode → chạm CSS ngoài phạm vi → **v1.7.0 hỏng**.
3. Sửa v1.7.0 bằng cách sửa luôn bug selector gốc → compact mode hoạt động lần đầu → người dùng
   đang bật checkbox đó mất sub-info **đúng theo thiết kế** → **v1.7.1 hỏng nặng hơn**.

**Quy tắc:**
- **Sửa một bug tồn tại lâu LÀ một thay đổi hành vi.** Hành vi "hỏng" có thể đã thành hành vi người
  dùng quen dùng. Không bao giờ sửa kèm — phải là quyết định riêng, có chủ ý, được người dùng đồng ý.
- Khi feature mới va vào một bug đã biết → **hỏi**, đừng tự quyết.
- Biết một bug (đã ghi vào file này!) mà vẫn vá nửa vời là tệ hơn không chạm vào.
- **Kiểm chứng giả định TRƯỚC khi phát hành.** Mục 3.1 là ví dụ làm đúng: đã viết xong code, kiểm
  chứng bằng thư viện thật, phát hiện giả định sai, hoàn nguyên — thay vì đẩy cho người dùng một
  bản hỏng.

**Chẩn đoán sai cũng tốn thời gian người dùng:** khi người dùng báo editor chưa hiện mục mới, đã
khẳng định là cache và bắt họ hard reload / xoá cache / sửa URL. Sai — Console cho thấy code đã
đúng version. Nguyên nhân thật là `flexible-horseshoe-card` bị 404 chặn chuỗi khởi tạo editor.
→ **Xin log/dữ liệu trước, kết luận sau.**

---

## Nếu làm tiếp, thứ tự đề xuất

**Ưu tiên cao — rủi ro thấp:**
1. **Mục 7.5** — commit 57 test vào repo + thêm GitHub Actions (lint + test). Bảo vệ mọi thay đổi sau này.
2. **Mục 3.2** — bỏ/nhúng Google Fonts. Đang ghi vào `document.head` toàn cục. Không cần build step.
3. **Mục 8.2** — `prefers-reduced-motion`. Vấn đề tiếp cận thật, sửa dễ, chỉ thêm 1 khối `@media`.
4. **Mục 7.10** — thêm screenshot vào README. Card thiên về hình ảnh nhưng README không có ảnh nào.

**Ưu tiên trung bình:**
5. **Mục 6.1** — màu inverter tuỳ chỉnh bị nhiệt độ ghi đè âm thầm. Thêm option `inverter_temp_color`.
6. **Mục 6.11 / 6.12** — thêm trạng thái Idle cho pin và lưới. CSS `.status-import`/`.status-export`
   đã có sẵn nhưng chưa dùng.
7. **Mục 5.1** — `ha-entity-picker` trong editor. Cải thiện UX rõ rệt nhưng là refactor lớn.
8. **Mục 1.6 / 6.8 / 6.2** — chuẩn hoá đơn vị (W/kWh/°C) ở tầng `_getState`. Một lần refactor
   giải quyết nhiều mục cùng lúc.

**Rủi ro cao — cân nhắc kỹ:**
9. **Mục 1.1 + 2.1** — `_pathData` + vẽ lại dây. **Phải làm cùng nhau.** Dây hiện vẽ đúng, nên
   lợi ích thấp mà rủi ro cao. Khuyến nghị: **để nguyên** trừ khi có báo lỗi thật.
10. **Mục 3.1** — bundle Lit. Cần build step, đổi quy trình phát triển. Chỉ làm nếu cần chạy offline.
