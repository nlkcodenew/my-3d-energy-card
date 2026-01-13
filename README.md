# 3D Energy Card for Home Assistant

A custom Lovelace card that visualizes your home energy flow in a stunning 3D/Hologram style.

## Features
- **3D Visualization**: Nodes (Solar, Grid, Battery, Home) are suspended in 3D space.
- **Dynamic Flow**: Energy flow speed adjusts based on power usage (W).
- **Glassmorphism**: Modern UI with glass effects and neon glows.
- **Responsive Connections**: Lines connect nodes dynamically even when layout changes.

## Installation

### HACS (Recommended)
1. Add this repository to HACS as a Custom Repository.
2. Search for "3D Energy Card" and install.

### Manual
1. Copy `hiasm-energy-card.js` to your `www` folder.
2. Add resource in Lovelace Dashboard configuration:
   ```yaml
   resources:
     - url: /local/hiasm-energy-card.js
       type: module
   ```

## Configuration

```yaml
type: custom:hiasm-energy-card
entities:
  solar: sensor.solar_power          # Power output from solar (W)
  grid: sensor.grid_power            # Power from/to grid (W) - positive = import, negative = export
  battery: sensor.battery_soc        # Battery State of Charge (%) - for display
  battery_power: sensor.battery_power # (Optional) Battery Power (W) - for flow animation
                                      # Negative = charging, Positive = discharging
  load: sensor.home_power            # (Optional) Home consumption (W) - auto-calculated if omitted
```
