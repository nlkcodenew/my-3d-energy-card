# HIASM Energy Card

<p align="center">
  <img src="https://img.shields.io/badge/version-3.7.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/HACS-Default-orange?style=for-the-badge" alt="HACS">
  <img src="https://img.shields.io/badge/Home%20Assistant-2024.1+-green?style=for-the-badge" alt="HA">
</p>

A beautiful 3D-styled energy flow card for Home Assistant with animated power flows, customizable colors, and multi-language support.

Thẻ năng lượng 3D đẹp mắt cho Home Assistant với dòng chảy năng lượng động, màu sắc tùy chỉnh và hỗ trợ đa ngôn ngữ.

---

## ✨ Features / Tính năng

| Feature | Description / Mô tả |
|---------|---------------------|
| 🎯 **Animated Flow** | Multiple animated dots show energy direction / Nhiều chấm động hiển thị hướng năng lượng |
| 📊 **Self-Sufficiency** | Shows % of load covered by solar / Hiển thị % tải được cấp bởi solar |
| 🎨 **Custom Colors** | Override default neon colors / Tùy chỉnh màu neon mặc định |
| 💡 **Node Pulse** | Nodes pulse when high power flow / Node nhấp nháy khi công suất cao |
| 🌐 **Multi-Language** | English & Vietnamese support / Hỗ trợ tiếng Anh & Việt |
| 📱 **Responsive** | Works on mobile & desktop / Hoạt động trên mobile & desktop |
| 🌙 **Theme Support** | Adapts to HA light/dark themes / Tự động theo theme HA |

---

## 📦 Installation / Cài đặt

### HACS (Recommended)

1. Open HACS → Frontend → + Explore & Download Repositories
2. Search for "HIASM Energy Card"
3. Click Download
4. Restart Home Assistant

### Manual

1. Download `hiasm-energy-card.js` from the latest release
2. Copy to `/config/www/hiasm-energy-card.js`
3. Add to Lovelace resources:
   ```yaml
   resources:
     - url: /local/hiasm-energy-card.js
       type: module
   ```

---

## ⚙️ Configuration / Cấu hình

### Basic / Cơ bản

```yaml
type: custom:hiasm-energy-card
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
type: custom:hiasm-energy-card
max_power: 5000
language: vi  # en | vi
dots_per_line: 3  # 1-5 dots per flow line
show_self_sufficiency: true  # Show self-sufficiency %
battery_invert: false  # Invert battery sign convention
buy_price: 3000  # Cost per kWh (VND)
sell_price: 2000  # Sell price per kWh
currency: "đ"

# Custom colors (optional)
colors:
  solar: "#ffdd00"
  grid: "#00f3ff"
  battery: "#00ff9d"
  load: "#ff0055"
  inverter: "#a855f7"

entities:
  solar: sensor.solar_power
  solar_daily: sensor.solar_energy_daily
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
| `grid` | Import from grid / Nhập từ lưới | Export to grid / Xuất ra lưới |
| `battery_power` | Discharge / Xả pin | Charge / Sạc pin |

> 💡 If your inverter uses opposite convention, enable `battery_invert: true`
>
> Nếu inverter của bạn dùng quy ước ngược, bật `battery_invert: true`

---

## 🎨 Custom Colors / Tùy chỉnh màu

Override default colors in your config:

```yaml
colors:
  solar: "#ffa500"    # Orange solar
  grid: "#0066ff"     # Blue grid
  battery: "#00cc44"  # Green battery
  load: "#cc0033"     # Red load
  inverter: "#9933ff" # Purple inverter
```

---

## 📊 Self-Sufficiency Calculation / Tính toán tự cấp

The self-sufficiency percentage shows how much of your load is covered by solar:

**Formula / Công thức:**
```
Self% = (Solar Used Locally / Load) × 100
Solar Used Locally = Solar Production - Grid Export
```

**Example / Ví dụ:**
- Solar: 3000W, Load: 2500W, Export: 500W
- Self% = (3000 - 500) / 2500 × 100 = **100%**

---

## 🔧 Troubleshooting / Xử lý sự cố

### Animation not showing / Animation không hiển thị
1. Clear browser cache: `Ctrl + Shift + R`
2. Check console for errors: `F12` → Console
3. Verify card version shows `3.7.0`

### Wrong battery direction / Hướng pin sai
Enable `battery_invert: true` in config

### Dots moving too fast/slow / Chấm chạy quá nhanh/chậm
Adjust `max_power` to match your system's peak power

---

## 📝 Changelog

### v3.7.0 (2026-01-13)
- ✨ **Multiple dots per flow line** (configurable 1-5)
- ✨ **Self-sufficiency percentage** display
- ✨ **Customizable colors** via config
- ✨ **Node pulse animation** when power > 30%
- ✨ **Enhanced glow effect** on flow dots
- 🔧 Improved editor layout

### v3.6.0 (2026-01-13)
- 🎉 **Working flow animation** using `getPointAtLength()`
- 🔧 Fixed animation timing issues

### v3.5.0 - v3.3.0
- Various animation attempts and fixes

### v3.2.0 (2026-01-13)
- ✨ Responsive design
- ✨ HA theme support
- ✨ Energy cost calculation
- ✨ Multi-language (EN/VI)

### v3.1.0 (2026-01-13)
- 🔧 Memory leak fixes
- ✨ Dynamic battery icons
- ✨ Status badges

### v3.0.0 (2026-01-13)
- 🎉 Initial release with 3D design

---

## 📄 License

MIT License - Feel free to modify and share!

---

## 🙏 Credits

- Inspired by [Power Flow Card Plus](https://github.com/flixlix/power-flow-card-plus)
- Animation pattern from [TB Energy Flow Card](https://github.com/tongtbgl/tb-energy-flow-card)
- Built with [LitElement](https://lit.dev/)

---

<p align="center">
  Made with ❤️ by HIASM<br>
  <a href="https://github.com/hiasm/hiasm-energy-card">GitHub</a>
</p>
