# NLK 3D Energy Card

<p align="center">
  <img src="https://img.shields.io/badge/version-1.7.1-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/HACS-Default-orange?style=for-the-badge" alt="HACS">
  <img src="https://img.shields.io/badge/Home%20Assistant-2024.1+-green?style=for-the-badge" alt="HA">
</p>

A beautiful 3D-styled energy flow card for Home Assistant with animated power flows, customizable colors, and multi-language support.

Thẻ năng lượng 3D đẹp mắt cho Home Assistant với dòng chảy năng lượng động, màu sắc tùy chỉnh và hỗ trợ đa ngôn ngữ.

---

## ✨ Features / Tính năng

| Feature | Description / Mô tả |
|---------|---------------------|
| 🎯 **Animated Flow** | Dashed or Dots animation styles / Kiểu nét đứt hoặc chấm tròn |
| 📊 **Self-Sufficiency** | Shows % based on daily consumption / Hiển thị % dựa trên tiêu thụ |
| 🌡️ **Temperature Colors** | Inverter color changes with temperature (10°C→70°C) / Màu inverter thay đổi theo nhiệt độ |
| 🎨 **Color Editor** | Visual color pickers in editor / Chọn màu trực quan |
| 🔋 **Battery Display** | Large SoC %, time remaining / Hiển thị % pin lớn, thời gian còn lại |
| 📐 **Compact Mode** | Hide sub-info for cleaner look / Ẩn thông tin phụ |
| 💡 **Node Pulse** | Nodes pulse when high power / Node nhấp nháy khi công suất cao |
| 🌐 **Multi-Language** | English & Vietnamese / Hỗ trợ tiếng Anh & Việt |
| 📱 **Responsive** | Better fonts on mobile / Font tối ưu trên mobile |
| 🔌 **Off-grid Load** | Auto-switch load sensor when grid is down / Tự chuyển sensor tải khi mất lưới |
| 🌓 **Theme-friendly** | Refined surfaces for both light and dark HA modes / Giao diện hợp cả Light và Dark |

---

## 📦 Installation / Cài đặt

### HACS - Custom Repository (Recommended)

This card is **not** in the HACS default store; add it as a custom repository:

1. Open HACS → click the **⋮** menu (top right) → **Custom repositories**
2. Repository: `https://github.com/nlkcodenew/my-3d-energy-card`
3. Type / Category: **Dashboard** (older HACS: **Lovelace** / **Plugin**)
4. Click **Add**, then find "NLK 3D Energy Card" in HACS and click **Download**
5. Restart Home Assistant (or reload resources) and clear your browser cache

Thẻ này **không có** trong kho mặc định của HACS, cần thêm dưới dạng custom repository:

1. Mở HACS → menu **⋮** (góc trên phải) → **Custom repositories**
2. Repository: `https://github.com/nlkcodenew/my-3d-energy-card`
3. Type / Category: **Dashboard** (HACS cũ: **Lovelace** / **Plugin**)
4. Bấm **Add**, tìm "NLK 3D Energy Card" trong HACS rồi bấm **Download**
5. Khởi động lại Home Assistant và xoá cache trình duyệt

Once installed this way, HACS checks this repository's **GitHub Releases** and will notify you
automatically whenever a new version is published.

Sau khi cài theo cách này, HACS sẽ theo dõi **GitHub Releases** của repo và **tự động thông báo**
mỗi khi có phiên bản mới.

### Manual

1. Download `NLK-3d-energy-card.js` from the latest release
2. Copy to `/config/www/NLK-3d-energy-card.js`
3. Add to Lovelace resources:
   ```yaml
   resources:
     - url: /local/NLK-3d-energy-card.js
       type: module
   ```

---

## ⚙️ Configuration / Cấu hình

### Basic / Cơ bản

```yaml
type: custom:nlk-3d-energy-card
max_power: 5000
language: vi
entities:
  solar: sensor.solar_power
  solar_daily: sensor.solar_energy_daily
  grid: sensor.grid_power
  grid_buy_daily: sensor.grid_import_daily
  grid_sell_daily: sensor.grid_export_daily
  battery_soc: sensor.battery_level
  battery_power: sensor.battery_power
  battery_daily_charge: sensor.battery_charge_daily
  battery_daily_discharge: sensor.battery_discharge_daily
  load: sensor.load_power
  load_daily: sensor.load_energy_daily
  inverter_temp: sensor.inverter_temperature
```

### Full Options / Đầy đủ

```yaml
type: custom:nlk-3d-energy-card
max_power: 5000
language: vi  # en | vi
show_self_sufficiency: true
compact_mode: false
battery_invert: false
battery_capacity: 10  # kWh
flow_style: dashed  # dashed | dots

# Off-grid load switching (see "Off-grid Load" section below)
offgrid_grid_threshold: 1   # W. |grid| below this = grid considered down
offgrid_min_power: 0        # W. 0 = disabled
buy_price: 3000
sell_price: 2000
currency: "đ"

colors:
  solar: "#ffdd00"
  grid: "#00f3ff"
  battery: "#00ff9d"
  load: "#ff0055"
  inverter: "#a855f7"

entities:
  solar: sensor.solar_power
  solar_daily: sensor.solar_energy_daily
  total_yield: sensor.total_yield  # Optional
  pv1: sensor.pv1_power  # Optional
  pv2: sensor.pv2_power  # Optional
  grid: sensor.grid_power
  grid_buy_daily: sensor.grid_import_daily
  grid_sell_daily: sensor.grid_export_daily
  battery_soc: sensor.battery_level
  battery_power: sensor.battery_power
  battery_daily_charge: sensor.battery_charge_daily
  battery_daily_discharge: sensor.battery_discharge_daily
  load: sensor.load_power
  load_offgrid: sensor.inverter_ac_output_power  # Optional
  load_daily: sensor.load_energy_daily
  inverter_temp: sensor.inverter_temperature
```

---

## 🔌 Off-grid Load / Tải khi mất điện lưới

Some inverters (Lumentree and others) report an **unreliable `load_power`** while running
off-grid, but report a correct **AC output power**. Configure `load_offgrid` and the card will
switch to it automatically during a blackout.

Một số inverter (Lumentree và tương tự) báo **`load_power` sai lệch khi mất điện lưới**, nhưng
`ac_output_power` vẫn đúng. Cấu hình `load_offgrid` để thẻ tự động chuyển sang sensor này.

```yaml
entities:
  grid: sensor.lumentree_local_pXXXXXXXXX_grid_power
  load: sensor.lumentree_local_pXXXXXXXXX_load_power          # Power (Primary)
  load_offgrid: sensor.lumentree_local_pXXXXXXXXX_ac_output_power  # Power (Off-grid)

offgrid_grid_threshold: 1
offgrid_min_power: 0
```

### How the switch works / Cơ chế chuyển

The card uses `load_offgrid` when **both** are true:

1. `load_offgrid` is configured and reporting a valid number, **and**
2. `abs(grid) < offgrid_grid_threshold` — the grid is effectively idle

| Grid Power | Result |
|-----------|--------|
| `800 W` (importing) | Uses **Power (Primary)** |
| `0 W` (blackout) | Uses **Power (Off-grid)** ⚠️ badge shown |
| `-0.3 W` (sensor noise) | Uses **Power (Off-grid)** |
| `-900 W` (exporting to grid) | Uses **Power (Primary)** — grid is still up |

> 💡 **Why `abs(grid) < threshold` and not `grid <= 0`?**
> With this card's sign convention, negative grid means **exporting**, which happens while the
> grid is perfectly healthy. Testing `grid <= 0` would wrongly switch sources every time you sell
> power. Using the absolute value only matches a genuine "grid at ~0 W" blackout, and also
> tolerates small negative sensor noise.
>
> 💡 **Vì sao dùng `abs(grid) < ngưỡng` chứ không phải `grid <= 0`?**
> Grid âm nghĩa là đang **xuất điện lên lưới**, lúc đó lưới vẫn bình thường. Nếu kiểm tra
> `grid <= 0` thì mỗi lần bán điện thẻ sẽ chuyển nguồn sai. Dùng giá trị tuyệt đối chỉ khớp
> đúng trường hợp lưới ~0 W (mất điện thật), đồng thời chịu được nhiễu sensor âm nhỏ.

`offgrid_min_power` (default `0` = disabled) suppresses the switch when inverter output is below
a floor. **Leave it at 0 unless you have a specific reason** — setting it to e.g. `50` means a
blackout with only 30 W of consumption would fall back to the unreliable sensor.

`offgrid_min_power` (mặc định `0` = tắt) bỏ qua việc chuyển nguồn khi công suất inverter thấp hơn
mức sàn. **Nên để 0** — nếu đặt `50`, khi mất điện mà nhà chỉ tiêu thụ 30 W thẻ sẽ quay lại dùng
sensor sai lệch.

When the off-grid source is active, an orange **⚠ Off-grid / Mất lưới** badge appears on the Load
node (visible even in compact mode) so you always know which sensor is being displayed.

---

## 📐 Entity Sign Conventions / Quy ước dấu

| Entity | Positive (+) | Negative (-) |
|--------|--------------|--------------|
| `grid` | Import / Nhập từ lưới | Export / Xuất ra lưới |
| `battery_power` | Discharge / Xả pin | Charge / Sạc pin |

> 💡 If your inverter uses opposite convention, enable `battery_invert: true`

---

## 🌡️ Inverter Temperature Colors

The inverter circle automatically changes color based on temperature:

| Temperature | Color |
|-------------|-------|
| 10°C | Cyan (Cool) |
| 40°C | Green/Yellow |
| 70°C | Red (Hot) |

---

## 📝 Changelog

### v1.7.1 (2026-08-07)
- 🐛 **Fixed** - Sub-info rows (PV1/PV2, Today, Buy/Sell, Charge/Discharge) disappeared from all
  nodes when `compact_mode` was enabled. A CSS rule added in v1.7.0 for the off-grid badge was
  hiding them unconditionally
- 🐛 **Fixed** - `compact_mode` and `card_size` now actually work. Both were scoped to
  `:host([data-...])` while the attribute is set on the inner `<ha-card>`, so neither had any
  effect before

### v1.7.0 (2026-08-07)
- 🔌 **Off-grid Load Source** - New `load_offgrid` entity. The card automatically switches from
  `load` to `load_offgrid` during a blackout, for inverters that report an unreliable
  `load_power` when off-grid
- ⚙️ **New options** - `offgrid_grid_threshold` (default `1` W) and `offgrid_min_power` (default `0`, disabled)
- ⚠️ **Off-grid badge** - Load node shows which source is active; stays visible in compact mode
- 🐛 **Fixed** - A genuine `0 W` load reading no longer triggers the estimated-sum fallback
- 🐛 **Fixed** - Editor no longer writes `NaN` into the config when a number field is cleared
- 🐛 **Fixed** - Load node tap now opens the sensor actually being displayed

### v1.6.2 (2026-05-23)
- 🌓 **Theme-friendly surfaces** - Better fit for both HA light and dark modes
- ✨ **Modernized card shell** - Softer glassy surfaces, cleaner shadows, better borders

### v1.5.0 (2026-01-14)
- ✨ **Flow Styles** - Dashed or Dots animation
- 🌡️ **Temperature Colors** - Inverter color changes with temp (10°C→70°C)
- 📱 **Responsive Fonts** - Better mobile display
- 📦 **Compact Mode** - Hide sub-info for cleaner look
- 🔋 **Better Battery Display** - Large SoC %, gold power value
- ⚡ **Total Yield** - Optional total solar yield entity
- 🛡️ **Error Handling** - Better handling of missing entities

### v1.1.0 (2026-01-13)
- ✨ Color Editor in UI
- ✨ Battery Time Remaining
- ✨ Card Size Options

---

## 📄 License

MIT License - Feel free to modify and share!

---

<p align="center">
  Made with ❤️ by nlkcodenew<br>
  <a href="https://github.com/nlkcodenew/my-3d-energy-card">GitHub</a>
</p>
