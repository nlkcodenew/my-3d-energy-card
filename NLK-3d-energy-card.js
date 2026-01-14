import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

const CARD_VERSION = "2.1.0"; // Sharp 3D - No blur

// Load Google Fonts for stylized typography
if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Orbitron"]')) {
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@500;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
}

console.info(
  `%c NLK 3D ENERGY CARD %c ${CARD_VERSION} `,
  "color: white; background: linear-gradient(90deg, #a855f7, #00f3ff); font-weight: 700;",
  "color: #a855f7; background: #0a0a0f;"
);

const TRANSLATIONS = {
  en: { solar: "Solar", grid: "Grid", battery: "Battery", load: "Consumption", inverter: "Inverter", today: "Today", buy: "Buy", sell: "Sell", importing: "← Import", exporting: "→ Export", charging: "⚡ Charging", discharging: "↗ Discharging", charge: "Charge", discharge: "Discharge", self: "Self" },
  vi: { solar: "Solar", grid: "Lưới điện", battery: "Pin", load: "Tiêu thụ", inverter: "Inverter", today: "Hôm nay", buy: "Mua", sell: "Bán", importing: "← Nhập", exporting: "→ Xuất", charging: "⚡ Đang sạc", discharging: "↗ Đang xả", charge: "Sạc", discharge: "Xả", self: "Tự cấp" }
};

const DEFAULT_COLORS = {
  solar: "#ffdd00",
  grid: "#00f3ff",
  battery: "#00ff9d",
  load: "#ff0055",
  inverter: "#a855f7"
};

class NLK3DEnergyCard extends LitElement {
  static get properties() { return { hass: { type: Object }, config: { type: Object } }; }

  static getStubConfig() {
    return {
      max_power: 5000, buy_price: 3000, sell_price: 2000, currency: "đ", language: "vi", battery_invert: false,
      show_self_sufficiency: true,
      battery_capacity: 10, // kWh for time remaining calc
      card_size: "normal", // compact | normal | large
      colors: {},
      entities: { solar: "sensor.solar_power", solar_daily: "sensor.solar_energy_daily", grid: "sensor.grid_power", grid_buy_daily: "sensor.grid_import_daily", grid_sell_daily: "sensor.grid_export_daily", battery_soc: "sensor.battery_level", battery_power: "sensor.battery_power", battery_daily_charge: "sensor.battery_charge_daily", battery_daily_discharge: "sensor.battery_discharge_daily", load: "sensor.load_power", load_daily: "sensor.load_energy_daily", inverter_temp: "sensor.inverter_temperature" }
    };
  }

  static getConfigElement() { return document.createElement("nlk-3d-energy-card-editor"); }

  constructor() {
    super();
    this._dots = {};
    this._animationFrame = null;
    this._lastAnimateTime = null;
  }

  setConfig(config) {
    if (!config.entities) throw new Error("Please check config via Editor.");
    this.config = config;
  }

  // Get color with custom override support
  _getColor(key) {
    return this.config?.colors?.[key] || DEFAULT_COLORS[key] || "#ffffff";
  }

  static get styles() {
    return css`
      /* === BASE VARIABLES === */
      :host { 
        display: block; 
        padding: 0; 
        --bg-card: var(--ha-card-background, #0a0a0f); 
        --text-primary: var(--primary-text-color, #fff); 
        --text-secondary: var(--secondary-text-color, #888); 
        --border-color: var(--divider-color, rgba(255,255,255,0.08));
        font-family: 'Rajdhani', 'Segoe UI', sans-serif;
      }
      
      ha-card { 
        background: linear-gradient(145deg, #0d0d12 0%, #080810 100%);
        overflow: hidden; 
        border-radius: 20px; 
        position: relative; 
        height: var(--card-height, 420px); 
        border: 1px solid rgba(255,255,255,0.05);
        box-shadow: 
          0 25px 50px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.05);
      }
      :host([data-size="compact"]) { --card-height: 320px; } 
      :host([data-size="large"]) { --card-height: 520px; }
      @media (max-width: 400px) { ha-card { height: calc(var(--card-height, 420px) - 40px); } }
      
      /* === ANIMATED BACKGROUND GRID === */
      .bg-grid { 
        position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
        background-image: 
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); 
        background-size: 35px 35px; 
        mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%); 
        opacity: 0.8;
        animation: grid-move 20s linear infinite;
      }
      @keyframes grid-move {
        0% { background-position: 0 0; }
        100% { background-position: 35px 35px; }
      }
      
      /* === 3D SCENE === */
      .scene { 
        width: 100%; height: 100%; 
        position: relative; 
        perspective: 1200px;
        perspective-origin: 50% 50%;
        transform-style: preserve-3d;
      }
      
      /* === 3D EMBOSSED NODES === */
      .node { 
        position: absolute; 
        width: 125px; 
        padding: 12px 10px; 
        background: linear-gradient(145deg, #1e1e26 0%, #12121a 100%);
        border: 2px solid rgba(255,255,255,0.12); 
        border-top-color: rgba(255,255,255,0.2);
        border-left-color: rgba(255,255,255,0.15);
        border-radius: 14px; 
        display: flex; flex-direction: column; align-items: center; 
        color: var(--text-primary); 
        z-index: 5; 
        cursor: pointer; 
        transform-style: preserve-3d;
        transition: all 0.3s ease;
        
        /* Sharp 3D embossed shadows - no blur */
        box-shadow: 
          /* Hard outer shadow for depth */
          6px 6px 0 rgba(0,0,0,0.4),
          8px 8px 0 rgba(0,0,0,0.2),
          /* Subtle ambient */
          0 10px 20px rgba(0,0,0,0.3);
      }
      
      /* Sharp edge highlight */
      .node::after {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 3px;
        background: linear-gradient(90deg, 
          transparent 0%,
          var(--node-color, rgba(255,255,255,0.3)) 20%,
          var(--node-color, rgba(255,255,255,0.3)) 80%,
          transparent 100%
        );
        border-radius: 14px 14px 0 0;
        pointer-events: none;
      }
      
      /* 3D tilt transforms for each corner */
      .solar { 
        top: 15px; left: 15px; 
        --node-color: #ffdd00;
        transform: rotateX(-5deg) rotateY(6deg) translateZ(25px);
        border-top-color: rgba(255,221,0,0.5);
      }
      .grid { 
        top: 15px; right: 15px; 
        --node-color: #00f3ff;
        transform: rotateX(-5deg) rotateY(-6deg) translateZ(25px);
        border-top-color: rgba(0,243,255,0.5);
      }
      .battery { 
        bottom: 15px; left: 15px; 
        --node-color: #00ff9d;
        transform: rotateX(5deg) rotateY(6deg) translateZ(25px);
        border-bottom-color: rgba(0,255,157,0.5);
      }
      .load { 
        bottom: 15px; right: 15px; 
        --node-color: #ff0055;
        transform: rotateX(5deg) rotateY(-6deg) translateZ(25px);
        border-bottom-color: rgba(255,0,85,0.5);
      }
      
      /* Hover - lift higher with sharp shadow */
      .node:hover { 
        transform: translateZ(45px) scale(1.03) !important;
        box-shadow: 
          8px 8px 0 rgba(0,0,0,0.5),
          12px 12px 0 rgba(0,0,0,0.25),
          0 15px 30px rgba(0,0,0,0.4);
      }
      
      /* Pulse animation - subtle scale only */
      .node.pulse { animation: node-pulse-3d 2s ease-in-out infinite; }
      @keyframes node-pulse-3d { 
        0%, 100% { transform: var(--node-transform) scale(1); } 
        50% { transform: var(--node-transform) scale(1.02); } 
      }
      
      @media (max-width: 400px) { 
        .node { width: 105px; padding: 10px 8px; border-radius: 14px; } 
        .solar, .grid { top: 10px; } 
        .battery, .load { bottom: 10px; } 
        .solar, .battery { left: 8px; } 
        .grid, .load { right: 8px; } 
      }
      
      /* === 3D SPHERE INVERTER === */
      .inverter { 
        position: absolute; 
        top: 50%; left: 50%; 
        width: 115px; height: 115px; 
        transform: translate(-50%, -50%); 
        border-radius: 50%; 
        display: flex; flex-direction: column; align-items: center; justify-content: center; 
        z-index: 10; 
        cursor: pointer;
        
        /* 3D Sphere gradient */
        background: radial-gradient(circle at 35% 30%, 
          rgba(168, 85, 247, 0.25) 0%,
          rgba(50,45,65,0.9) 25%, 
          rgba(25,22,35,0.98) 60%,
          rgba(10,8,18,1) 100%
        );
        border: 2px solid rgba(168, 85, 247, 0.25);
        
        /* Enhanced 3D sphere shadows */
        box-shadow:
          /* Inner sphere depth */
          inset -25px -25px 50px rgba(0,0,0,0.9),
          inset 15px 15px 30px rgba(168, 85, 247, 0.15),
          inset 5px 5px 15px rgba(200,150,255,0.1),
          /* Outer glow rings */
          0 0 50px rgba(168, 85, 247, 0.25),
          0 0 100px rgba(168, 85, 247, 0.1),
          /* Drop shadow */
          0 15px 40px rgba(0,0,0,0.5);
      }
      
      /* Highlight spot on sphere */
      .inverter::after {
        content: '';
        position: absolute;
        top: 12%; left: 20%;
        width: 25px; height: 15px;
        background: radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(3px);
      }
      
      .inverter ha-icon { 
        --mdc-icon-size: 30px; 
        color: var(--inv-color, #a855f7); 
        filter: drop-shadow(0 0 12px var(--inv-color, #a855f7)) drop-shadow(0 0 6px var(--inv-color, #a855f7)); 
      }
      .inverter .inv-label { 
        font-size: 0.55rem; 
        color: rgba(255,255,255,0.4); 
        margin-top: 2px; 
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      .inverter .inv-power { 
        font-size: 0.75rem; 
        font-weight: 700; 
        color: var(--inv-color, #a855f7); 
        text-shadow: 0 0 10px var(--inv-color, #a855f7);
      }
      .inverter .self-sufficiency { 
        font-size: 0.6rem; 
        color: #00ff9d; 
        margin-top: 2px; 
        font-weight: 700;
        text-shadow: 0 0 8px rgba(0,255,157,0.5);
      }
      
      /* Animated ring pulse */
      .inverter::before { 
        content: ''; 
        position: absolute; 
        width: 140%; height: 140%; 
        border-radius: 50%; 
        border: 1.5px solid rgba(168, 85, 247, 0.25); 
        animation: ring-pulse-3d 3s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.1);
      }
      @keyframes ring-pulse-3d { 
        0%, 100% { transform: scale(0.85); opacity: 0.3; } 
        50% { transform: scale(1); opacity: 0.8; } 
      }
      
      /* Inverter hover - 3D pop out effect */
      .inverter:hover {
        transform: translate(-50%, -50%) scale(1.15);
        box-shadow:
          inset -25px -25px 50px rgba(0,0,0,0.9),
          inset 15px 15px 30px rgba(168, 85, 247, 0.2),
          0 0 60px rgba(168, 85, 247, 0.4),
          0 20px 50px rgba(0,0,0,0.6);
        border-color: rgba(168, 85, 247, 0.5);
      }
      .inverter:hover ha-icon {
        transform: scale(1.2);
      }
      .inverter, .inverter ha-icon {
        transition: all 0.3s ease;
      }
      
      /* === SHARP TYPOGRAPHY === */
      .main-val { 
        font-family: 'Orbitron', 'Rajdhani', 'Segoe UI', sans-serif;
        font-size: 1.4rem; 
        font-weight: 800; 
        margin: 5px 0;
        letter-spacing: 1px;
        /* Sharp text shadow - no blur */
        text-shadow: 
          1px 1px 0 rgba(0,0,0,0.5),
          2px 2px 0 rgba(0,0,0,0.3);
      }
      
      .label { 
        font-size: 0.7rem; 
        text-transform: uppercase; 
        letter-spacing: 2px; 
        font-weight: 600;
        color: rgba(255,255,255,0.7);
      }
      
      .sub-info { 
        display: flex; flex-direction: column; align-items: center; 
        margin-top: 8px; padding-top: 8px; 
        border-top: 1px solid rgba(255,255,255,0.08); 
        width: 100%; 
      }
      .sub-row { 
        font-size: 0.68rem; 
        color: var(--text-secondary); 
        display: flex; justify-content: space-between; 
        width: 100%; padding: 2px 0; 
      }
      .sub-row span:last-child { color: var(--text-primary); font-weight: 600; }
      .cost-row { 
        font-size: 0.65rem; 
        color: #00ff9d; 
        margin-top: 3px;
        font-weight: 700;
      } 
      .cost-row.negative { 
        color: #ff0055; 
      }
      
      /* Status badges with glow */
      .status-badge { 
        font-size: 0.58rem; 
        padding: 3px 8px; 
        border-radius: 10px; 
        margin-top: 5px; 
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .status-charging { 
        background: #00ff9d; 
        color: #000; 
        font-weight: 700;
      }
      .status-discharging { 
        background: #ffdd00; 
        color: #000;
        font-weight: 700;
      }
      .status-import { 
        background: #ff0055; 
        color: #fff;
        font-weight: 700;
      }
      .status-export { 
        background: #00f3ff; 
        color: #000;
        font-weight: 700;
      }
      
      /* === SVG CONNECTIONS === */
      svg.connections { 
        position: absolute; top: 0; left: 0; 
        width: 100%; height: 100%; 
        pointer-events: none; z-index: 3; 
        overflow: visible; 
      }
      path.wire { 
        fill: none; 
        stroke: rgba(255,255,255,0.1); 
        stroke-width: 2.5;
        filter: drop-shadow(0 0 3px rgba(255,255,255,0.1));
      }
      
      /* === ENHANCED FLOW DOTS === */
      .flow-dot { 
        filter: 
          drop-shadow(0 0 12px currentColor) 
          drop-shadow(0 0 6px currentColor) 
          drop-shadow(0 0 3px currentColor);
        opacity: 0.95;
      }
      .flow-dot-tail { opacity: 0.4; filter: blur(2px); }
      .flow-dot-tail2 { opacity: 0.2; filter: blur(4px); }
    `;
  }

  _getState(e) { return (this.hass && this.hass.states[e]) ? parseFloat(this.hass.states[e].state) : 0; }
  _getDisplay(e) { if (!this.hass || !this.hass.states[e]) return "N/A"; const s = this.hass.states[e]; const v = parseFloat(s.state); return isNaN(v) ? s.state : `${v.toFixed(1)} ${s.attributes.unit_of_measurement || ''}`; }
  _handlePopup(e) { if (!e) return; const ev = new Event("hass-more-info", { bubbles: true, composed: true }); ev.detail = { entityId: e }; this.dispatchEvent(ev); }
  _getBatteryIcon(s) { if (s >= 90) return "mdi:battery"; if (s >= 70) return "mdi:battery-80"; if (s >= 50) return "mdi:battery-60"; if (s >= 30) return "mdi:battery-40"; if (s >= 10) return "mdi:battery-20"; return "mdi:battery-outline"; }
  _t(k) { const l = this.config?.language || 'vi'; return TRANSLATIONS[l]?.[k] || TRANSLATIONS['vi'][k] || k; }

  render() {
    if (!this.hass || !this.config) return html``;
    const E = this.config.entities;
    const t = (k) => this._t(k);
    const maxP = this.config.max_power || 5000;

    const solarP = this._getState(E.solar);
    const gridP = this._getState(E.grid);
    const batP = this._getState(E.battery_power);
    const batSoc = this._getState(E.battery_soc);

    // Battery sign correction
    const batteryInvert = this.config.battery_invert || false;

    // Load: use sensor value directly, fallback to 0 if unavailable
    const loadP = this._getState(E.load);

    const isGridImport = gridP > 0;
    const isBatCharge = batteryInvert ? (batP > 0) : (batP < 0);
    const absBatP = Math.abs(batP);
    const absGridP = Math.abs(gridP);

    // Self-sufficiency calculation (Daily kWh based - matches HA Energy Dashboard)
    // Self% = (Load_Daily - Grid_Buy_Daily) / Load_Daily × 100
    let selfSufficiency = 0;
    const loadDaily = this._getState(E.load_daily);
    const gridBuyDaily = this._getState(E.grid_buy_daily);
    if (loadDaily > 0) {
      selfSufficiency = Math.max(0, Math.min(100, ((loadDaily - gridBuyDaily) / loadDaily) * 100));
    }
    const showSelf = this.config.show_self_sufficiency !== false;

    // Pulse animation for high power nodes (>50% of max)
    const shouldPulse = (p) => Math.abs(p) > maxP * 0.3;

    const buyPrice = this.config.buy_price || 0;
    const sellPrice = this.config.sell_price || 0;
    const currency = this.config.currency || 'đ';
    const buyCost = this._getState(E.grid_buy_daily) * buyPrice;
    const sellEarn = this._getState(E.grid_sell_daily) * sellPrice;
    const formatCost = (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k${currency}` : `${val.toFixed(0)}${currency}`;

    // Colors
    const cSolar = this._getColor('solar');
    const cGrid = this._getColor('grid');
    const cBat = this._getColor('battery');
    const cLoad = this._getColor('load');
    const cInv = this._getColor('inverter');

    // Card size attribute
    const cardSize = this.config.card_size || 'normal';
    this.setAttribute('data-size', cardSize);

    // Battery Time Remaining calculation
    const batCapacity = this.config.battery_capacity || 10; // kWh
    let batTimeRemaining = '';
    if (absBatP > 10) {
      const remainingKwh = (batSoc / 100) * batCapacity;
      if (isBatCharge) {
        const hoursToFull = ((batCapacity - remainingKwh) / (absBatP / 1000));
        batTimeRemaining = hoursToFull > 0 ? `~${hoursToFull.toFixed(1)}h → 100%` : '';
      } else {
        const hoursLeft = remainingKwh / (absBatP / 1000);
        batTimeRemaining = hoursLeft > 0 ? `~${hoursLeft.toFixed(1)}h left` : '';
      }
    }

    return html`
      <ha-card>
        <div class="bg-grid"></div>
        <div class="scene" id="scene">
          <svg class="connections">
            <defs>
              <marker id="arrow-solar" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><polygon points="0,0 6,3 0,6" fill="${cSolar}" opacity="0.7"/></marker>
              <marker id="arrow-grid" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><polygon points="0,0 6,3 0,6" fill="${cGrid}" opacity="0.7"/></marker>
              <marker id="arrow-bat" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><polygon points="0,0 6,3 0,6" fill="${cBat}" opacity="0.7"/></marker>
              <marker id="arrow-load" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><polygon points="0,0 6,3 0,6" fill="${cLoad}" opacity="0.7"/></marker>
            </defs>
            <path id="w-solar" class="wire" d="" marker-mid="url(#arrow-solar)" />
            <path id="w-grid" class="wire" d="" marker-mid="url(#arrow-grid)" />
            <path id="w-bat" class="wire" d="" marker-mid="url(#arrow-bat)" />
            <path id="w-load" class="wire" d="" marker-mid="url(#arrow-load)" />
            <!-- Flow Dots (3 per line, fixed IDs) -->
            <circle id="dot-solar-0" class="flow-dot" r="5" fill="${cSolar}" style="display: none;" />
            <circle id="dot-solar-1" class="flow-dot" r="5" fill="${cSolar}" style="display: none;" />
            <circle id="dot-solar-2" class="flow-dot" r="5" fill="${cSolar}" style="display: none;" />
            <circle id="dot-grid-0" class="flow-dot" r="5" fill="${cGrid}" style="display: none;" />
            <circle id="dot-grid-1" class="flow-dot" r="5" fill="${cGrid}" style="display: none;" />
            <circle id="dot-grid-2" class="flow-dot" r="5" fill="${cGrid}" style="display: none;" />
            <circle id="dot-bat-0" class="flow-dot" r="5" fill="${cBat}" style="display: none;" />
            <circle id="dot-bat-1" class="flow-dot" r="5" fill="${cBat}" style="display: none;" />
            <circle id="dot-bat-2" class="flow-dot" r="5" fill="${cBat}" style="display: none;" />
            <circle id="dot-load-0" class="flow-dot" r="5" fill="${cLoad}" style="display: none;" />
            <circle id="dot-load-1" class="flow-dot" r="5" fill="${cLoad}" style="display: none;" />
            <circle id="dot-load-2" class="flow-dot" r="5" fill="${cLoad}" style="display: none;" />
          </svg>

          <div class="node solar ${shouldPulse(solarP) ? 'pulse' : ''}" id="n-solar" @click=${() => this._handlePopup(E.solar)} style="border-top-color: ${cSolar};">
            <ha-icon icon="mdi:solar-power-variant" style="color: ${cSolar};"></ha-icon>
            <span class="label">${t('solar')}</span>
            <span class="main-val" style="color: ${cSolar};">${solarP.toFixed(0)} W</span>
            <div class="sub-info">
              ${E.pv1 || E.pv2 ? html`<div class="sub-row">${E.pv1 ? html`<span>PV1: ${this._getState(E.pv1).toFixed(0)}W</span>` : ''}${E.pv2 ? html`<span>PV2: ${this._getState(E.pv2).toFixed(0)}W</span>` : ''}</div>` : ''}
              <div class="sub-row"><span>${t('today')}:</span><span>${this._getDisplay(E.solar_daily)}</span></div>
            </div>
          </div>

          <div class="node grid ${shouldPulse(gridP) ? 'pulse' : ''}" id="n-grid" @click=${() => this._handlePopup(E.grid)} style="border-top-color: ${cGrid};">
            <ha-icon icon="mdi:transmission-tower" style="color: ${cGrid};"></ha-icon>
            <span class="label">${t('grid')}</span>
            <span class="main-val" style="color: ${cGrid};">${absGridP.toFixed(0)} W</span>
            <div class="sub-info">
              ${isGridImport ?
        html`<div class="sub-row"><span>${t('buy')}:</span><span>${this._getDisplay(E.grid_buy_daily)}</span></div>${buyPrice > 0 ? html`<span class="cost-row negative">-${formatCost(buyCost)}</span>` : ''}<span class="status-badge status-import">${t('importing')}</span>` :
        html`<div class="sub-row"><span>${t('sell')}:</span><span>${this._getDisplay(E.grid_sell_daily)}</span></div>${sellPrice > 0 ? html`<span class="cost-row">+${formatCost(sellEarn)}</span>` : ''}<span class="status-badge status-export">${t('exporting')}</span>`
      }
            </div>
          </div>

          <div class="node battery ${shouldPulse(batP) ? 'pulse' : ''}" id="n-bat" @click=${() => this._handlePopup(E.battery_power)} style="border-bottom-color: ${cBat};">
            <ha-icon icon="${this._getBatteryIcon(batSoc)}" style="color: ${cBat};"></ha-icon>
            <span class="label">${t('battery')} ${batSoc.toFixed(0)}%</span>
            <span class="main-val" style="color: ${cBat};">${absBatP.toFixed(0)} W</span>
            <div class="sub-info">
              ${isBatCharge ?
        html`<div class="sub-row"><span>${t('charge')}:</span><span>${this._getDisplay(E.battery_daily_charge)}</span></div><span class="status-badge status-charging">${t('charging')}</span>` :
        html`<div class="sub-row"><span>${t('discharge')}:</span><span>${this._getDisplay(E.battery_daily_discharge)}</span></div><span class="status-badge status-discharging">${t('discharging')}</span>`
      }
              ${batTimeRemaining ? html`<div class="sub-row" style="margin-top:4px;"><span style="font-size:0.6rem;color:#888;">${batTimeRemaining}</span></div>` : ''}
            </div>
          </div>

          <div class="node load ${shouldPulse(loadP) ? 'pulse' : ''}" id="n-load" @click=${() => this._handlePopup(E.load)} style="border-bottom-color: ${cLoad};">
            <ha-icon icon="mdi:home-lightning-bolt" style="color: ${cLoad};"></ha-icon>
            <span class="label">${t('load')}</span>
            <span class="main-val" style="color: ${cLoad};">${loadP.toFixed(0)} W</span>
            <div class="sub-info">
              <div class="sub-row"><span>${t('today')}:</span><span>${this._getDisplay(E.load_daily)}</span></div>
            </div>
          </div>

          <div class="inverter" id="n-inv" @click=${() => this._handlePopup(E.inverter_temp)} style="--inv-color: ${cInv};">
            <ha-icon icon="mdi:solar-power"></ha-icon>
            <span class="inv-label">${t('inverter')}</span>
            <span class="inv-power">${E.inverter_temp ? this._getDisplay(E.inverter_temp) : ''}</span>
            ${showSelf ? html`<span class="self-sufficiency">${t('self')}: ${selfSufficiency.toFixed(0)}%</span>` : ''}
          </div>
        </div>
      </ha-card>
    `;
  }

  updated(changedProps) {
    super.updated(changedProps);
    setTimeout(() => {
      this._drawWires();
      this._setupDots();
    }, 100);
  }

  _drawWires() {
    const root = this.shadowRoot;
    const inv = root.getElementById('n-inv');
    const scene = root.getElementById('scene');
    if (!inv || !scene) return;

    const sRect = scene.getBoundingClientRect();
    const iRect = inv.getBoundingClientRect();
    const iX = (iRect.left + iRect.width / 2) - sRect.left;
    const iY = (iRect.top + iRect.height / 2) - sRect.top;

    const nodes = ['n-solar', 'n-grid', 'n-bat', 'n-load'];
    const wires = ['w-solar', 'w-grid', 'w-bat', 'w-load'];

    nodes.forEach((nodeId, i) => {
      const el = root.getElementById(nodeId);
      const wire = root.getElementById(wires[i]);
      if (!el || !wire) return;

      const eRect = el.getBoundingClientRect();
      const eX = (eRect.left + eRect.width / 2) - sRect.left;
      const eY = (eRect.top + eRect.height / 2) - sRect.top;
      const mx = (eX + iX) / 2;

      wire.setAttribute("d", `M ${eX} ${eY} Q ${mx} ${eY} ${iX} ${iY}`);
    });
  }

  _setupDots() {
    if (!this.hass || !this.config) return;
    const root = this.shadowRoot;
    const E = this.config.entities;
    const maxP = this.config.max_power || 5000;
    const dotsCount = 3; // Fixed 3 dots per line

    const solarP = this._getState(E.solar);
    const gridP = this._getState(E.grid);
    const batP = this._getState(E.battery_power);
    const loadP = this._getState(E.load) || Math.abs(solarP + gridP + batP);
    const batteryInvert = this.config.battery_invert || false;

    const getSpeed = (val) => {
      if (Math.abs(val) < 5) return 0;
      return 50 + (Math.abs(val) / maxP) * 200;
    };

    const setupDotsForLine = (key, value, reverse) => {
      const wireEl = root.getElementById(`w-${key}`);
      if (!wireEl) return;

      const pathLength = wireEl.getTotalLength ? wireEl.getTotalLength() : 200;
      const speed = getSpeed(value);
      const active = Math.abs(value) > 5;

      for (let i = 0; i < dotsCount; i++) {
        const dotEl = root.getElementById(`dot-${key}-${i}`);
        if (!dotEl) continue;

        const dotKey = `${key}-${i}`;
        if (!this._dots[dotKey]) {
          this._dots[dotKey] = {
            element: dotEl,
            path: wireEl,
            pathLength: pathLength,
            currentPos: (pathLength / dotsCount) * i, // Offset each dot evenly
            active: false,
            speed: 0,
            reverse: false,
          };
        }

        const dot = this._dots[dotKey];
        dot.pathLength = pathLength;
        dot.active = active;
        dot.reverse = reverse;
        dot.speed = speed;
        dotEl.style.display = active ? 'inline' : 'none';
      }
    };

    setupDotsForLine('solar', solarP, false);
    setupDotsForLine('grid', gridP, gridP < 0);
    const batReverse = batteryInvert ? (batP > 0) : (batP < 0);
    setupDotsForLine('bat', batP, batReverse);
    setupDotsForLine('load', loadP, true);

    if (!this._animationFrame) {
      this._animationFrame = requestAnimationFrame(this._animateDots.bind(this));
    }
  }

  _animateDots(timestamp) {
    if (!this._lastAnimateTime) this._lastAnimateTime = timestamp;
    const deltaTime = (timestamp - this._lastAnimateTime) / 1000;
    this._lastAnimateTime = timestamp;

    for (const key in this._dots) {
      const dot = this._dots[key];
      if (!dot.active || !dot.path || dot.pathLength === 0) continue;

      let newPos = dot.currentPos;
      if (dot.reverse) {
        newPos -= dot.speed * deltaTime;
        if (newPos < 0) newPos += dot.pathLength;
      } else {
        newPos += dot.speed * deltaTime;
        if (newPos > dot.pathLength) newPos -= dot.pathLength;
      }
      dot.currentPos = newPos;

      try {
        const point = dot.path.getPointAtLength(dot.currentPos);
        dot.element.setAttribute('cx', point.x);
        dot.element.setAttribute('cy', point.y);
      } catch (e) { }
    }

    this._animationFrame = requestAnimationFrame(this._animateDots.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    this._dots = {};
  }
}

customElements.define("nlk-3d-energy-card", NLK3DEnergyCard);

// ----------------------- EDITOR -----------------------
class NLK3DEnergyCardEditor extends LitElement {
  static get properties() { return { hass: {}, config: {} }; }
  setConfig(config) { this.config = config; }
  _val(ev) {
    if (!this.config) return;
    const t = ev.target;
    const sub = t.subValue;
    let n = { ...this.config };
    if (sub) n.entities = { ...n.entities, [sub]: t.value };
    else if (t.configValue) n[t.configValue] = t.type === 'number' ? parseFloat(t.value) : t.value;
    const e = new Event("config-changed", { bubbles: true, composed: true });
    e.detail = { config: n };
    this.dispatchEvent(e);
  }
  static get styles() { return css` .cfg { padding: 16px; } h3 { margin: 16px 0 8px; border-bottom: 1px solid #444; color: var(--primary-text-color); } .row { margin-bottom: 12px; } label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 4px; } input, select { width: 100%; padding: 8px; border: 1px solid #444; background: var(--card-background-color); color: var(--primary-text-color); border-radius: 4px; box-sizing: border-box; } .inline { display: flex; gap: 8px; } .inline > * { flex: 1; } `; }
  render() {
    if (!this.hass || !this.config) return html``;
    const E = this.config.entities || {};
    return html`<div class="cfg">
      <h3>⚙️ General</h3>
      ${this._i("Max Power (W)", "max_power", this.config.max_power, false, "number")}
      <div class="row"><label>Language</label><select @change=${(e) => { const ev = new Event("config-changed", { bubbles: true, composed: true }); ev.detail = { config: { ...this.config, language: e.target.value } }; this.dispatchEvent(ev) }}><option value="vi" ?selected=${this.config.language === 'vi'}>Tiếng Việt</option><option value="en" ?selected=${this.config.language === 'en'}>English</option></select></div>
      <div class="row"><label><input type="checkbox" .checked=${this.config.show_self_sufficiency !== false} @change=${(e) => { const ev = new Event("config-changed", { bubbles: true, composed: true }); ev.detail = { config: { ...this.config, show_self_sufficiency: e.target.checked } }; this.dispatchEvent(ev) }}> Show Self-Sufficiency %</label></div>
      
      <h3>💰 Cost</h3>
      <div class="inline">${this._i("Buy Price", "buy_price", this.config.buy_price, false, "number")}${this._i("Sell Price", "sell_price", this.config.sell_price, false, "number")}</div>
      ${this._i("Currency", "currency", this.config.currency)}
      
      <h3>☀️ Solar</h3>
      ${this._i("Power", "solar", E.solar, true)}
      ${this._i("Daily", "solar_daily", E.solar_daily, true)}
      <div class="inline">${this._i("PV1", "pv1", E.pv1, true)}${this._i("PV2", "pv2", E.pv2, true)}</div>
      
      <h3>🔌 Grid</h3>
      ${this._i("Power", "grid", E.grid, true)}
      <div class="inline">${this._i("Buy Daily", "grid_buy_daily", E.grid_buy_daily, true)}${this._i("Sell Daily", "grid_sell_daily", E.grid_sell_daily, true)}</div>
      
      <h3>🔋 Battery</h3>
      <div class="inline">${this._i("SoC", "battery_soc", E.battery_soc, true)}${this._i("Power", "battery_power", E.battery_power, true)}</div>
      <div class="inline">${this._i("Charge", "battery_daily_charge", E.battery_daily_charge, true)}${this._i("Discharge", "battery_daily_discharge", E.battery_daily_discharge, true)}</div>
      ${this._i("Capacity (kWh)", "battery_capacity", this.config.battery_capacity, false, "number")}
      <div class="row"><label><input type="checkbox" .checked=${this.config.battery_invert || false} @change=${(e) => { const ev = new Event("config-changed", { bubbles: true, composed: true }); ev.detail = { config: { ...this.config, battery_invert: e.target.checked } }; this.dispatchEvent(ev) }}> Invert Battery (+ = Charge)</label></div>
      
      <h3>🏠 Load</h3>
      <div class="inline">${this._i("Power", "load", E.load, true)}${this._i("Daily", "load_daily", E.load_daily, true)}</div>
      
      <h3>⚡ Inverter</h3>
      ${this._i("Temperature", "inverter_temp", E.inverter_temp, true)}
      
      <h3>🎨 Colors</h3>
      <div class="inline">
        <div class="row"><label>Solar</label><input type="color" .value="${this.config.colors?.solar || '#ffdd00'}" @change=${(e) => this._setColor('solar', e.target.value)}></div>
        <div class="row"><label>Grid</label><input type="color" .value="${this.config.colors?.grid || '#00f3ff'}" @change=${(e) => this._setColor('grid', e.target.value)}></div>
      </div>
      <div class="inline">
        <div class="row"><label>Battery</label><input type="color" .value="${this.config.colors?.battery || '#00ff9d'}" @change=${(e) => this._setColor('battery', e.target.value)}></div>
        <div class="row"><label>Load</label><input type="color" .value="${this.config.colors?.load || '#ff0055'}" @change=${(e) => this._setColor('load', e.target.value)}></div>
      </div>
      <div class="row"><label>Inverter</label><input type="color" .value="${this.config.colors?.inverter || '#a855f7'}" @change=${(e) => this._setColor('inverter', e.target.value)}></div>
      
      <h3>📐 Card Size</h3>
      <div class="row"><label>Size</label><select @change=${(e) => { const ev = new Event("config-changed", { bubbles: true, composed: true }); ev.detail = { config: { ...this.config, card_size: e.target.value } }; this.dispatchEvent(ev) }}>
        <option value="normal" ?selected=${(this.config.card_size || 'normal') === 'normal'}>Normal (420px)</option>
        <option value="compact" ?selected=${this.config.card_size === 'compact'}>Compact (320px)</option>
        <option value="large" ?selected=${this.config.card_size === 'large'}>Large (520px)</option>
      </select></div>
    </div>`;
  }
  _i(l, k, v, s = false, type = "text") { return html`<div class="row"><label>${l}</label><input type="${type}" .value="${v || ''}" .configValue=${s ? undefined : k} .subValue=${s ? k : undefined} @input=${this._val}></div>`; }
  _setColor(key, value) {
    const colors = { ...(this.config.colors || {}), [key]: value };
    const ev = new Event("config-changed", { bubbles: true, composed: true });
    ev.detail = { config: { ...this.config, colors } };
    this.dispatchEvent(ev);
  }
}
customElements.define("nlk-3d-energy-card-editor", NLK3DEnergyCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "nlk-3d-energy-card", name: "NLK 3D Energy Card", preview: true, description: "3D Energy Monitor with Animated Flows" });