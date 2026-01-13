/*
 * HIASM 3D ENERGY CARD - V3.2 ULTIMATE
 * Features: Responsive, Theme Support, Energy Cost, Electric Flow
 */

import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

const CARD_VERSION = "3.3.5";

console.info(
  `%c HIASM ENERGY CARD %c ${CARD_VERSION} `,
  "color: white; background: #00f3ff; font-weight: 700;",
  "color: #00f3ff; background: #222;"
);

class HiasmEnergyCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  static getStubConfig() {
    return {
      max_power: 5000,
      buy_price: 3000,
      sell_price: 2000,
      currency: "đ",
      battery_invert: false,
      entities: {
        solar: "sensor.solar_power",
        solar_daily: "sensor.solar_energy_daily",
        pv1: "sensor.pv1_power",
        pv2: "sensor.pv2_power",
        grid: "sensor.grid_power",
        grid_buy_daily: "sensor.grid_import_daily",
        grid_sell_daily: "sensor.grid_export_daily",
        battery_soc: "sensor.battery_level",
        battery_power: "sensor.battery_power",
        battery_daily_charge: "sensor.battery_charge_daily",
        battery_daily_discharge: "sensor.battery_discharge_daily",
        load: "sensor.load_power",
        load_daily: "sensor.load_energy_daily"
      }
    };
  }

  static getConfigElement() {
    return document.createElement("hiasm-energy-card-editor");
  }

  setConfig(config) {
    if (!config.entities) throw new Error("Please check config via Editor.");
    this.config = config;

    // Only add resize listener once (prevent memory leak)
    if (!this._resizeListenerAdded) {
      this._resizeHandler = () => setTimeout(() => this.requestUpdate(), 200);
      window.addEventListener("resize", this._resizeHandler);
      this._resizeListenerAdded = true;
    }
  }

  // ----------------------- CSS -----------------------
  static get styles() {
    return css`
      :host {
        display: block;
        padding: 0;
        --neon-blue: #00f3ff;
        --neon-green: #00ff9d;
        --neon-red: #ff0055;
        --neon-yellow: #ffdd00;
        --neon-purple: #a855f7;
        /* HA Theme Support */
        --bg-card: var(--ha-card-background, var(--card-background-color, #141414));
        --text-primary: var(--primary-text-color, #fff);
        --text-secondary: var(--secondary-text-color, #888);
        --border-color: var(--divider-color, rgba(255,255,255,0.1));
      }

      ha-card {
        background: var(--bg-card);
        overflow: hidden;
        border-radius: 16px;
        position: relative;
        height: 420px;
        border: 1px solid var(--border-color);
      }

      /* Responsive */
      @media (max-width: 400px) {
        ha-card { height: 380px; }
      }

      /* BACKGROUND GRID */
      .bg-grid {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background-image: 
          linear-gradient(var(--border-color) 1px, transparent 1px),
          linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
        background-size: 40px 40px;
        mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
        opacity: 0.5;
      }

      /* SCENE CONTAINER */
      .scene {
        width: 100%;
        height: 100%;
        position: relative;
        perspective: 1000px;
      }

      /* NODES */
      .node {
        position: absolute;
        width: 120px;
        padding: 10px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--text-primary);
        z-index: 5;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
        backdrop-filter: blur(10px);
      }

      .node:hover {
        transform: scale(1.02);
        box-shadow: 0 6px 25px rgba(0,0,0,0.6);
      }

      .node:active { transform: scale(0.95); }

      /* Node Positioning */
      .solar { top: 15px; left: 15px; border-top: 3px solid var(--neon-yellow); }
      .grid { top: 15px; right: 15px; border-top: 3px solid var(--neon-blue); }
      .battery { bottom: 15px; left: 15px; border-bottom: 3px solid var(--neon-green); }
      .load { bottom: 15px; right: 15px; border-bottom: 3px solid var(--neon-red); }

      /* Responsive nodes */
      @media (max-width: 400px) {
        .node { width: 100px; padding: 8px; }
        .solar, .grid { top: 10px; }
        .battery, .load { bottom: 10px; }
        .solar, .battery { left: 10px; }
        .grid, .load { right: 10px; }
        .main-val { font-size: 1.1rem; }
        .label { font-size: 0.65rem; }
      }

      /* Inverter (Center Hub) */
      .inverter {
        position: absolute;
        top: 50%; left: 50%;
        width: 110px; height: 110px;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle at 30% 30%, rgba(40,40,50,0.9), rgba(10,10,15,0.95));
        border-radius: 50%;
        border: 2px solid rgba(168, 85, 247, 0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        box-shadow: 
          0 0 40px rgba(168, 85, 247, 0.2),
          0 0 80px rgba(168, 85, 247, 0.1),
          inset 0 0 30px rgba(0,0,0,0.5);
        cursor: pointer;
        transition: transform 0.3s ease;
      }

      .inverter:hover {
        transform: translate(-50%, -50%) scale(1.05);
      }

      .inverter ha-icon {
        --mdc-icon-size: 36px;
        color: var(--neon-purple);
        animation: pulse 3s infinite;
        filter: drop-shadow(0 0 8px var(--neon-purple));
      }

      .inverter .inv-label {
        font-size: 0.65rem;
        color: rgba(255,255,255,0.6);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 4px;
      }

      .inverter .inv-power {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--neon-purple);
        margin-top: 2px;
      }

      /* Glow ring animation */
      .inverter::before {
        content: '';
        position: absolute;
        width: 130%;
        height: 130%;
        border-radius: 50%;
        border: 1px solid rgba(168, 85, 247, 0.3);
        animation: ring-pulse 3s ease-in-out infinite;
      }

      @keyframes ring-pulse {
        0%, 100% { transform: scale(0.9); opacity: 0.5; }
        50% { transform: scale(1); opacity: 1; }
      }

      @keyframes pulse { 
        0% { opacity: 0.7; } 
        50% { opacity: 1; } 
        100% { opacity: 0.7; } 
      }

      /* TEXT STYLES */
      .main-val { font-size: 1.3rem; font-weight: 800; margin: 4px 0; }
      .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
      
      .sub-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.1);
        width: 100%;
      }
      .sub-row { 
        font-size: 0.7rem; 
        color: var(--text-secondary); 
        display: flex; 
        justify-content: space-between; 
        width: 100%; 
        padding: 1px 0;
      }
      .sub-row span:last-child { color: var(--text-primary); font-weight: 600; }

      /* Cost display */
      .cost-row {
        font-size: 0.65rem;
        color: var(--neon-green);
        margin-top: 2px;
      }
      .cost-row.negative { color: var(--neon-red); }

      /* Status indicator */
      .status-badge {
        font-size: 0.6rem;
        padding: 2px 6px;
        border-radius: 8px;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .status-charging { background: rgba(0, 255, 157, 0.2); color: var(--neon-green); }
      .status-discharging { background: rgba(255, 221, 0, 0.2); color: var(--neon-yellow); }
      .status-import { background: rgba(255, 0, 85, 0.2); color: var(--neon-red); }
      .status-export { background: rgba(0, 243, 255, 0.2); color: var(--neon-blue); }

      /* COLORS */
      .c-solar { color: var(--neon-yellow); }
      .c-grid { color: var(--neon-blue); }
      .c-bat { color: var(--neon-green); }
      .c-load { color: var(--neon-red); }

      /* SVG CONNECTIONS */
      svg.connections {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
        z-index: 3;
        overflow: visible;
      }

      path.wire {
        fill: none;
        stroke: rgba(255,255,255,0.15);
        stroke-width: 4;
        stroke-linecap: round;
      }

      /* Energy Packet Styling */
      .energy-packet {
        opacity: 0.95;
      }
    `;
  }

  // ----------------------- LOGIC -----------------------
  _getState(entity) {
    return (this.hass && this.hass.states[entity]) ? parseFloat(this.hass.states[entity].state) : 0;
  }

  _getDisplay(entity) {
    if (!this.hass || !this.hass.states[entity]) return "N/A";
    const st = this.hass.states[entity];
    const val = parseFloat(st.state);
    return isNaN(val) ? st.state : `${val.toFixed(1)} ${st.attributes.unit_of_measurement || ''}`;
  }

  _handlePopup(entity) {
    if (!entity) return;
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId: entity };
    this.dispatchEvent(event);
  }

  // Get dynamic battery icon based on SoC
  _getBatteryIcon(soc) {
    if (soc >= 90) return "mdi:battery";
    if (soc >= 70) return "mdi:battery-80";
    if (soc >= 50) return "mdi:battery-60";
    if (soc >= 30) return "mdi:battery-40";
    if (soc >= 10) return "mdi:battery-20";
    return "mdi:battery-outline";
  }

  // ----------------------- RENDER -----------------------
  render() {
    if (!this.hass || !this.config) return html``;
    const E = this.config.entities;
    const maxP = this.config.max_power || 5000;

    // Data Gathering
    const solarP = this._getState(E.solar);
    const gridP = this._getState(E.grid);
    const batP = this._getState(E.battery_power);
    const batSoc = this._getState(E.battery_soc);
    const loadP = this._getState(E.load) || Math.abs(solarP + gridP + batP);

    // Directions - with invert option for battery
    const isGridImport = gridP > 0;
    const batteryInvert = this.config.battery_invert || false;
    // If battery_invert is true: positive = charging, negative = discharging
    // Default (false): positive = discharging, negative = charging
    const isBatCharge = batteryInvert ? (batP > 0) : (batP < 0);

    // Animation Duration based on power
    const getDur = (w) => {
      if (Math.abs(w) < 10) return "0";
      const speed = Math.max(0.3, 2 - (Math.abs(w) / maxP) * 1.5);
      return speed;
    };

    // Inverter shows Load power (output power)

    // Energy cost calculation
    const buyPrice = this.config.buy_price || 0;
    const sellPrice = this.config.sell_price || 0;
    const currency = this.config.currency || 'đ';
    const gridBuyDaily = this._getState(E.grid_buy_daily);
    const gridSellDaily = this._getState(E.grid_sell_daily);
    const buyCost = gridBuyDaily * buyPrice;
    const sellEarn = gridSellDaily * sellPrice;
    const netCost = buyCost - sellEarn;
    const formatCost = (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k${currency}` : `${val.toFixed(0)}${currency}`;

    return html`
      <ha-card>
        <div class="bg-grid"></div>
        <div class="scene" id="scene">
          
          <!-- SVG Connection Lines -->
          <svg class="connections">
            <defs>
              <!-- Glow filters with stronger blur -->
              <filter id="glow-yellow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-blue" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-green" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-red" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <!-- Static wire paths -->
            <path id="w-solar" class="wire" d="" />
            <path id="w-grid" class="wire" d="" />
            <path id="w-bat" class="wire" d="" />
            <path id="w-load" class="wire" d="" />

            <!-- Energy Packets (animated by JS) -->
            ${solarP > 10 ? html`
              <circle class="packet packet-solar" r="7" fill="var(--neon-yellow)" filter="url(#glow-yellow)" data-speed="${getDur(solarP)}" data-dir="0"></circle>
              <circle class="packet packet-solar" r="7" fill="var(--neon-yellow)" filter="url(#glow-yellow)" data-speed="${getDur(solarP)}" data-dir="0" data-offset="0.5"></circle>
            ` : ''}

            ${Math.abs(gridP) > 10 ? html`
              <circle class="packet packet-grid" r="7" fill="var(--neon-blue)" filter="url(#glow-blue)" data-speed="${getDur(gridP)}" data-dir="${isGridImport ? '0' : '1'}"></circle>
              <circle class="packet packet-grid" r="7" fill="var(--neon-blue)" filter="url(#glow-blue)" data-speed="${getDur(gridP)}" data-dir="${isGridImport ? '0' : '1'}" data-offset="0.5"></circle>
            ` : ''}

            ${Math.abs(batP) > 10 ? html`
              <circle class="packet packet-bat" r="7" fill="var(--neon-green)" filter="url(#glow-green)" data-speed="${getDur(batP)}" data-dir="${isBatCharge ? '1' : '0'}"></circle>
              <circle class="packet packet-bat" r="7" fill="var(--neon-green)" filter="url(#glow-green)" data-speed="${getDur(batP)}" data-dir="${isBatCharge ? '1' : '0'}" data-offset="0.5"></circle>
            ` : ''}

            ${loadP > 10 ? html`
              <circle class="packet packet-load" r="7" fill="var(--neon-red)" filter="url(#glow-red)" data-speed="${getDur(loadP)}" data-dir="1"></circle>
              <circle class="packet packet-load" r="7" fill="var(--neon-red)" filter="url(#glow-red)" data-speed="${getDur(loadP)}" data-dir="1" data-offset="0.5"></circle>
            ` : ''}
          </svg>

          <!-- SOLAR NODE -->
          <div class="node solar" id="n-solar" @click=${() => this._handlePopup(E.solar)}>
            <ha-icon icon="mdi:solar-power-variant" class="c-solar"></ha-icon>
            <span class="label">Solar</span>
            <span class="main-val c-solar">${solarP.toFixed(0)} W</span>
            <div class="sub-info">
              ${E.pv1 || E.pv2 ? html`
                <div class="sub-row">
                  ${E.pv1 ? html`<span>PV1: ${this._getState(E.pv1).toFixed(0)}W</span>` : ''}
                  ${E.pv2 ? html`<span>PV2: ${this._getState(E.pv2).toFixed(0)}W</span>` : ''}
                </div>
              ` : ''}
              <div class="sub-row">
                <span>Hôm nay:</span>
                <span>${this._getDisplay(E.solar_daily)}</span>
              </div>
            </div>
          </div>

          <!-- GRID NODE -->
          <div class="node grid" id="n-grid" @click=${() => this._handlePopup(E.grid)}>
            <ha-icon icon="mdi:transmission-tower" class="c-grid"></ha-icon>
            <span class="label">Lưới điện</span>
            <span class="main-val c-grid">${Math.abs(gridP).toFixed(0)} W</span>
            <div class="sub-info">
              ${isGridImport
        ? html`
                    <div class="sub-row"><span>Mua:</span><span>${this._getDisplay(E.grid_buy_daily)}</span></div>
                    ${buyPrice > 0 ? html`<span class="cost-row negative">-${formatCost(buyCost)}</span>` : ''}
                    <span class="status-badge status-import">← Nhập</span>
                  `
        : html`
                    <div class="sub-row"><span>Bán:</span><span>${this._getDisplay(E.grid_sell_daily)}</span></div>
                    ${sellPrice > 0 ? html`<span class="cost-row">+${formatCost(sellEarn)}</span>` : ''}
                    <span class="status-badge status-export">→ Xuất</span>
                  `
      }
            </div>
          </div>

          <!-- BATTERY NODE -->
          <div class="node battery" id="n-bat" @click=${() => this._handlePopup(E.battery_power)}>
            <ha-icon icon="${this._getBatteryIcon(batSoc)}" class="c-bat"></ha-icon>
            <span class="label">Pin ${batSoc.toFixed(0)}%</span>
            <span class="main-val c-bat">${Math.abs(batP).toFixed(0)} W</span>
            <div class="sub-info">
              ${isBatCharge
        ? html`
                    <div class="sub-row"><span>Sạc:</span><span>${this._getDisplay(E.battery_daily_charge)}</span></div>
                    <span class="status-badge status-charging">⚡ Đang sạc</span>
                  `
        : html`
                    <div class="sub-row"><span>Xả:</span><span>${this._getDisplay(E.battery_daily_discharge)}</span></div>
                    <span class="status-badge status-discharging">↗ Đang xả</span>
                  `
      }
            </div>
          </div>

          <!-- LOAD NODE -->
          <div class="node load" id="n-load" @click=${() => this._handlePopup(E.load)}>
            <ha-icon icon="mdi:home-lightning-bolt" class="c-load"></ha-icon>
            <span class="label">Tiêu thụ</span>
            <span class="main-val c-load">${loadP.toFixed(0)} W</span>
            <div class="sub-info">
              <div class="sub-row">
                <span>Hôm nay:</span>
                <span>${this._getDisplay(E.load_daily)}</span>
              </div>
            </div>
          </div>

          <!-- INVERTER HUB (Center) -->
          <div class="inverter" id="n-inv" @click=${() => this._handlePopup(E.inverter)}>
            <ha-icon icon="mdi:solar-power"></ha-icon>
            <span class="inv-label">Inverter</span>
            <span class="inv-power">${loadP.toFixed(0)} W</span>
          </div>

        </div>
      </ha-card>
    `;
  }

  // ----------------------- PATH DRAWING -----------------------
  updated(changedProps) {
    super.updated(changedProps);
    setTimeout(() => this._drawLines(), 50);
  }

  _drawLines() {
    const root = this.shadowRoot;
    const inv = root.getElementById('n-inv');
    const scene = root.getElementById('scene');

    if (!inv || !scene) return;

    const sRect = scene.getBoundingClientRect();
    const iRect = inv.getBoundingClientRect();
    const iX = (iRect.left + iRect.width / 2) - sRect.left;
    const iY = (iRect.top + iRect.height / 2) - sRect.top;

    // Store paths for animation
    this._paths = {};

    // Wire configs
    const wires = [
      { id: 'n-solar', w: 'w-solar', packets: 'packet-solar' },
      { id: 'n-grid', w: 'w-grid', packets: 'packet-grid' },
      { id: 'n-bat', w: 'w-bat', packets: 'packet-bat' },
      { id: 'n-load', w: 'w-load', packets: 'packet-load' }
    ];

    wires.forEach(item => {
      const el = root.getElementById(item.id);
      const wire = root.getElementById(item.w);

      if (el && wire) {
        const eRect = el.getBoundingClientRect();
        const eX = (eRect.left + eRect.width / 2) - sRect.left;
        const eY = (eRect.top + eRect.height / 2) - sRect.top;

        // Store path endpoints
        this._paths[item.packets] = {
          x1: eX, y1: eY,  // Node position
          x2: iX, y2: iY   // Inverter position
        };

        // Draw wire
        const wirePath = `M ${eX} ${eY} Q ${(eX + iX) / 2} ${eY} ${iX} ${iY}`;
        wire.setAttribute("d", wirePath);
      }
    });

    // Start animation
    this._startPacketAnimation();
  }

  _startPacketAnimation() {
    if (this._animationId) cancelAnimationFrame(this._animationId);

    const root = this.shadowRoot;
    const packets = root.querySelectorAll('.packet');
    if (!packets.length || !this._paths) return;

    const startTime = performance.now();

    const animate = (currentTime) => {
      packets.forEach(packet => {
        const pathKey = packet.classList[1]; // packet-solar, packet-grid, etc.
        const path = this._paths[pathKey];
        if (!path) return;

        const speed = parseFloat(packet.dataset.speed) || 1;
        const dir = parseInt(packet.dataset.dir) || 0; // 0 = node->inverter, 1 = inverter->node
        const offset = parseFloat(packet.dataset.offset) || 0;

        // Calculate position along path (0 to 1)
        const duration = speed * 1000; // ms
        let progress = ((currentTime - startTime + offset * duration) % duration) / duration;

        // Reverse direction if needed
        if (dir === 1) progress = 1 - progress;

        // Calculate position using quadratic bezier
        const { x1, y1, x2, y2 } = path;
        const cx = (x1 + x2) / 2; // Control point x
        const cy = y1; // Control point y (same as start y for horizontal curve)

        const t = progress;
        const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
        const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

        packet.setAttribute('cx', x);
        packet.setAttribute('cy', y);
      });

      this._animationId = requestAnimationFrame(animate);
    };

    this._animationId = requestAnimationFrame(animate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
      this._resizeListenerAdded = false;
    }
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
    }
  }
}

customElements.define("hiasm-energy-card", HiasmEnergyCard);


// ----------------------- EDITOR -----------------------
class HiasmEnergyCardEditor extends LitElement {
  static get properties() { return { hass: {}, config: {} }; }

  setConfig(config) { this.config = config; }

  _valueChanged(ev) {
    if (!this.config || !this.hass) return;
    const target = ev.target;
    const sub = target.subValue;
    let newConfig = { ...this.config };
    if (sub) newConfig.entities = { ...newConfig.entities, [sub]: target.value };
    else newConfig[target.configValue] = target.value;

    const event = new Event("config-changed", { bubbles: true, composed: true });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

  static get styles() {
    return css`
      .card-config {
        padding: 16px;
      }
      h3 {
        margin: 16px 0 8px 0;
        color: var(--primary-text-color);
        border-bottom: 1px solid var(--divider-color);
        padding-bottom: 4px;
      }
      .config-row {
        margin-bottom: 12px;
      }
      label {
        display: block;
        font-weight: 500;
        font-size: 0.85rem;
        margin-bottom: 4px;
        color: var(--secondary-text-color);
      }
      input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-sizing: border-box;
      }
      input:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const E = this.config.entities || {};
    return html`
      <div class="card-config">
        <h3>⚙️ Cấu hình chính</h3>
        ${this._inp("Max Power (W)", "max_power", this.config.max_power)}
        
        <h3>💰 Chi phí điện</h3>
        ${this._inp("Giá mua (đ/kWh)", "buy_price", this.config.buy_price)}
        ${this._inp("Giá bán (đ/kWh)", "sell_price", this.config.sell_price)}
        ${this._inp("Đơn vị tiền", "currency", this.config.currency)}
        
        <h3>☀️ Solar</h3>
        ${this._inp("Solar Power (W)", "solar", E.solar, true)}
        ${this._inp("Solar Daily (kWh)", "solar_daily", E.solar_daily, true)}
        ${this._inp("PV1 Power (W)", "pv1", E.pv1, true)}
        ${this._inp("PV2 Power (W)", "pv2", E.pv2, true)}
        
        <h3>🔌 Lưới điện</h3>
        ${this._inp("Grid Power (W)", "grid", E.grid, true)}
        ${this._inp("Grid Buy Daily (kWh)", "grid_buy_daily", E.grid_buy_daily, true)}
        ${this._inp("Grid Sell Daily (kWh)", "grid_sell_daily", E.grid_sell_daily, true)}

        <h3>🔋 Pin lưu trữ</h3>
        ${this._inp("Battery SoC (%)", "battery_soc", E.battery_soc, true)}
        ${this._inp("Battery Power (W)", "battery_power", E.battery_power, true)}
        ${this._inp("Battery Charge Daily", "battery_daily_charge", E.battery_daily_charge, true)}
        ${this._inp("Battery Discharge Daily", "battery_daily_discharge", E.battery_daily_discharge, true)}
        <div class="config-row">
          <label>
            <input type="checkbox" 
                   .checked=${this.config.battery_invert || false}
                   @change=${(e) => {
        const event = new Event("config-changed", { bubbles: true, composed: true });
        event.detail = { config: { ...this.config, battery_invert: e.target.checked } };
        this.dispatchEvent(event);
      }}>
            Đảo ngược dấu pin (nếu + = sạc)
          </label>
        </div>
        
        <h3>🏠 Tải tiêu thụ</h3>
        ${this._inp("Load Power (W)", "load", E.load, true)}
        ${this._inp("Load Daily (kWh)", "load_daily", E.load_daily, true)}
        
        <h3>⚡ Inverter</h3>
        ${this._inp("Inverter Entity (optional)", "inverter", E.inverter, true)}
      </div>
    `;
  }

  _inp(label, key, val, isSub = false) {
    return html`
      <div class="config-row">
        <label>${label}</label>
        <input type="text" .value="${val || ''}" 
               .configValue=${isSub ? undefined : key} 
               .subValue=${isSub ? key : undefined}
               @input=${this._valueChanged}>
      </div>`;
  }
}

customElements.define("hiasm-energy-card-editor", HiasmEnergyCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "hiasm-energy-card",
  name: "HIASM 3D Energy Card",
  preview: true,
  description: "Beautiful 3D Energy Flow Monitor with animated connections"
});