# HIASM 3D Energy Card for Home Assistant

[![Version](https://img.shields.io/badge/version-3.2.0-blue.svg)](https://github.com/hiasm/energy-card)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)

A custom Lovelace card that visualizes your home energy flow in a stunning 3D/Hologram style with animated electric flows.

![Preview](preview.png)

## ✨ Features

### Core Features
- **3D Visualization**: Solar, Grid, Battery, Load nodes arranged around central Inverter hub
- **Dynamic Electric Flow**: Animated energy flow with speed based on power (W)
- **Glassmorphism UI**: Modern glass effects with neon glows and backdrop blur
- **Smart Connections**: SVG paths connect nodes dynamically, auto-adjusting on resize

### V3.2 New Features
- **📱 Responsive Design**: Optimized for mobile screens (< 400px)
- **🎨 Theme Support**: Auto-adapts to Home Assistant light/dark themes
- **💰 Energy Cost Display**: Shows buy/sell costs in your currency
- **🔋 Dynamic Battery Icon**: Icon changes based on SoC level
- **⚡ Status Badges**: Visual indicators for charging/discharging, import/export

---

## 📦 Installation

### HACS (Recommended)
1. Open HACS → Frontend
2. Click ⋮ → Custom repositories
3. Add URL: `https://github.com/hiasm/3d-energy-card`
4. Select category: **Lovelace**
5. Search for "HIASM Energy Card" and install

### Manual Installation
1. Download `hiasm-energy-card.js`
2. Copy to `/config/www/hiasm-energy-card.js`
3. Add resource in **Settings → Dashboards → Resources**:
   ```yaml
   url: /local/hiasm-energy-card.js
   type: module
   ```
4. Refresh your browser (Ctrl+F5)

---

## ⚙️ Configuration

### Full Example
```yaml
type: custom:hiasm-energy-card
max_power: 5000

# Energy Cost (optional)
buy_price: 3000      # đ/kWh - Grid import price
sell_price: 2000     # đ/kWh - Grid export price
currency: "đ"        # Currency symbol

entities:
  # Solar
  solar: sensor.solar_power              # Công suất solar (W)
  solar_daily: sensor.solar_energy_daily # Sản lượng hôm nay (kWh)
  
  # Grid
  grid: sensor.grid_power                # Công suất lưới (W), + = nhập, - = xuất
  grid_buy_daily: sensor.grid_import     # Điện mua hôm nay (kWh)
  grid_sell_daily: sensor.grid_export    # Điện bán hôm nay (kWh)
  
  # Battery
  battery_soc: sensor.battery_level      # Dung lượng pin (%)
  battery_power: sensor.battery_power    # Công suất pin (W), + = xả, - = sạc
  battery_daily_charge: sensor.bat_charge_daily     # Điện sạc hôm nay
  battery_daily_discharge: sensor.bat_discharge_daily # Điện xả hôm nay
  
  # Load
  load: sensor.load_power                # Công suất tiêu thụ (W)
  load_daily: sensor.load_energy_daily   # Tiêu thụ hôm nay (kWh)
  
  # Inverter (optional)
  inverter: sensor.inverter_power        # Entity cho popup
```

### Minimal Example
```yaml
type: custom:hiasm-energy-card
entities:
  solar: sensor.solar_power
  grid: sensor.grid_power
  battery_soc: sensor.battery_level
  battery_power: sensor.battery_power
```

---

## 📊 Entity Conventions

| Entity | Unit | Sign Convention |
|--------|------|-----------------|
| `solar` | W | Always positive (generating) |
| `grid` | W | **Positive** = importing (buying), **Negative** = exporting (selling) |
| `battery_power` | W | **Positive** = discharging, **Negative** = charging |
| `load` | W | Always positive (consuming) |
| `*_daily` | kWh | Cumulative energy for today |

---

## 💰 Energy Cost Display

When `buy_price` and `sell_price` are configured:
- **Importing**: Shows `-12.5kđ` in red (cost)
- **Exporting**: Shows `+8.2kđ` in green (earnings)

Formula:
```
Buy Cost = grid_buy_daily (kWh) × buy_price
Sell Earnings = grid_sell_daily (kWh) × sell_price
```

---

## 🎨 Theme Support

The card automatically uses Home Assistant theme variables:

| CSS Variable | Fallback | Usage |
|--------------|----------|-------|
| `--ha-card-background` | `#141414` | Card background |
| `--primary-text-color` | `#fff` | Main text |
| `--secondary-text-color` | `#888` | Secondary text |
| `--divider-color` | `rgba(255,255,255,0.1)` | Borders |

Works with both **Light** and **Dark** themes out of the box.

---

## 📱 Responsive Breakpoints

| Screen Width | Adjustments |
|--------------|-------------|
| < 400px | Smaller nodes (100px), reduced padding, smaller fonts |
| ≥ 400px | Full size nodes (120px), standard layout |

---

## 🔧 Troubleshooting

### Card not showing
1. Clear browser cache (Ctrl+Shift+R)
2. Check browser console for errors (F12)
3. Verify resource is loaded correctly

### Flow animation not working
- Ensure power values are > 10W (threshold for animation)
- Check entity values in Developer Tools → States

### Wrong flow direction
- Verify your inverter's sign convention matches:
  - Grid: positive = import, negative = export
  - Battery: positive = discharge, negative = charge

---

## 📝 Changelog

### V3.2.0 (2026-01-13)
- ✅ Responsive design for mobile
- ✅ Home Assistant theme support (light/dark)
- ✅ Energy cost display with buy/sell prices
- ✅ Visual Editor improvements

### V3.1.0
- Fixed memory leak (resize listener cleanup)
- Improved inverter hub display with total power
- Dynamic battery icons based on SoC
- Status badges (charging/discharging, import/export)

### V3.0.0
- Initial release with 3D visualization
- Dynamic SVG path connections
- Electric flow animations

---

## 📄 License

MIT License - Free to use and modify.

---

**Made with ⚡ by HIASM**
