# NLK 3D Energy Card

<p align="center">
  <img src="https://img.shields.io/badge/version-1.6.2-blue?style=for-the-badge" alt="Version">
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
| 🌓 **Theme-friendly** | Refined surfaces for both light and dark HA modes / Giao diện hợp cả Light và Dark |

---

## 📦 Installation / Cài đặt

### HACS (Recommended)

1. Open HACS → Frontend → + Explore & Download Repositories
2. Search for "NLK 3D Energy Card"
3. Click Download
4. Restart Home Assistant

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
  load_daily: sensor.load_energy_daily
  inverter_temp: sensor.inverter_temperature
```

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
  <a href="https://github.com/nlkcodenew/nlk-3d-energy-card">GitHub</a>
</p>
