# NLK 3D Energy Card

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/HACS-Default-orange?style=for-the-badge" alt="HACS">
  <img src="https://img.shields.io/badge/Home%20Assistant-2024.1+-green?style=for-the-badge" alt="HA">
</p>

A beautiful 3D-styled energy flow card for Home Assistant with animated power flows, customizable colors, and multi-language support.

Thẻ năng lượng 3D đẹp mắt cho Home Assistant với dòng chảy năng lượng động, màu sắc tùy chỉnh và hỗ trợ đa ngôn ngữ.

---

## ✨ Features / Tính năng

| Feature | Description / Mô tả |
|---------|---------------------|
| 🎯 **Animated Flow** | Multiple animated dots with comet tail glow / Nhiều chấm động với hiệu ứng đuôi sao |
| 📊 **Self-Sufficiency** | Shows % based on daily consumption / Hiển thị % dựa trên tiêu thụ hàng ngày |
| 🎨 **Color Editor** | Visual color pickers in editor / Chọn màu trực quan trong editor |
| 🔋 **Battery Time** | Shows time remaining / to full / Hiển thị thời gian còn lại / đầy |
| ➡️ **Flow Arrows** | Direction arrows on wires / Mũi tên hướng trên dây |
| 📐 **Card Sizes** | Compact, Normal, Large modes / Chế độ nhỏ, thường, lớn |
| 💡 **Node Pulse** | Nodes pulse when high power / Node nhấp nháy khi công suất cao |
| 🌐 **Multi-Language** | English & Vietnamese / Hỗ trợ tiếng Anh & Việt |

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
battery_invert: false
battery_capacity: 10  # kWh for time remaining
card_size: normal  # compact | normal | large
buy_price: 3000
sell_price: 2000
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
3. Verify card version shows `1.1.0`

### Wrong battery direction / Hướng pin sai
Enable `battery_invert: true` in config

### Dots moving too fast/slow / Chấm chạy quá nhanh/chậm
Adjust `max_power` to match your system's peak power

---

## 📝 Changelog

### v1.1.0 (2026-01-13)
- ✨ **Color Editor in UI** - Visual color pickers for all elements
- ✨ **Battery Time Remaining** - Shows "~Xh left" or "~Xh → 100%"
- ✨ **Flow Direction Arrows** - Arrow markers on wires
- ✨ **Card Size Options** - Compact (320px), Normal (420px), Large (520px)
- ✨ **Enhanced Comet Tail** - Triple drop-shadow glow effect

### v1.0.4 (2026-01-13)
- ✨ Multi-dots animation (3 per line)
- ✨ Self-sufficiency % (daily-based, matches HA Energy)
- ✨ Node pulse animation
- 🔧 Renamed to NLK 3D Energy Card
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
  Made with ❤️ by nlkcodenew<br>
  <a href="https://github.com/nlkcodenew/nlk-3d-energy-card">GitHub</a>
</p>
