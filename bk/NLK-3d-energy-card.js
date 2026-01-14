/*
 * NLK 3D ENERGY CARD - V1.4.1 (FIXED DOTS ANIMATION)
 */

import {
  LitElement,
  html,
  svg,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

const CARD_VERSION = "1.4.1";

// Load Google Fonts
if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Orbitron"]')) {
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
}

console.info(
  `%c NLK 3D ENERGY CARD %c ${CARD_VERSION} `,
  "color: white; background: #00f3ff; font-weight: 700;",
  "color: #00f3ff; background: #222;"
);

const TRANSLATIONS = {
  en: { solar: "Solar", grid: "Grid", battery: "Battery", load: "Consumption", inverter: "Inverter", today: "Today", buy: "Buy", sell: "Sell", importing: "← Import", exporting: "→ Export", charging: "⚡ Charging", discharging: "↗ Discharging", charge: "Charge", discharge: "Discharge", self: "Self" },
  vi: { solar: "Mặt trời", grid: "Lưới điện", battery: "Lưu trữ", load: "Tiêu thụ", inverter: "Inverter", today: "Hôm nay", buy: "Mua", sell: "Bán", importing: "← Nhập", exporting: "→ Xuất", charging: "⚡ Đang sạc", discharging: "↗ Đang xả", charge: "Sạc", discharge: "Xả", self: "Tự cấp" }
};

const DEFAULT_COLORS = {
  solar: "#ffdd00",
  grid: "#00f3ff",
  battery: "#00ff9d",
  load: "#ff0055",
  inverter: "#a855f7"
};

class NLK3DEnergyCard extends LitElement {
  // Thêm _pathData vào properties để trigger render lại khi có toạ độ mới
  static get properties() { return { hass: { type: Object }, config: { type: Object }, _pathData: { type: Object } }; }

  static getStubConfig() {
    return {
      max_power: 5000, buy_price: 3000, sell_price: 2000, currency: "đ", language: "vi", battery_invert: false,
      show_self_sufficiency: true,
      battery_capacity: 10,
      card_size: "normal",
      flow_style: "dashed", // "dots" or "dashed"
      colors: {},
      entities: { solar: "sensor.solar_power", solar_daily: "sensor.solar_energy_daily", grid: "sensor.grid_power", grid_buy_daily: "sensor.grid_import_daily", grid_sell_daily: "sensor.grid_export_daily", battery_soc: "sensor.battery_level", battery_power: "sensor.battery_power", battery_daily_charge: "sensor.battery_charge_daily", battery_daily_discharge: "sensor.battery_discharge_daily", load: "sensor.load_power", load_daily: "sensor.load_energy_daily", inverter_temp: "sensor.inverter_temperature" }
    };
  }

  static getConfigElement() { return document.createElement("nlk-3d-energy-card-editor"); }

  setConfig(config) {
    if (!config.entities) throw new Error("Please check config via Editor.");
    this.config = config;
  }

  _getColor(key) {
    return this.config?.colors?.[key] || DEFAULT_COLORS[key] || "#ffffff";
  }

  static get styles() {
    return css`
      :host { display: block; padding: 0; --bg-card: var(--ha-card-background, #141414); --text-primary: var(--primary-text-color, #fff); --text-secondary: var(--secondary-text-color, #888); --border-color: var(--divider-color, rgba(255,255,255,0.1)); }
      ha-card { background: var(--bg-card); overflow: hidden; border-radius: 16px; position: relative; height: var(--card-height, 420px); border: 1px solid var(--border-color); }
      :host([data-size="compact"]) { --card-height: 320px; } :host([data-size="large"]) { --card-height: 520px; }
      @media (max-width: 400px) { ha-card { height: calc(var(--card-height, 420px) - 40px); } }
      .bg-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px); background-size: 40px 40px; mask-image: radial-gradient(circle at center, black 40%, transparent 100%); opacity: 0.5; }
      .scene { width: 100%; height: 100%; position: relative; perspective: 1000px; }
      
      /* NODES with 3D perspective */
      .node { 
        position: absolute; width: 120px; padding: 10px; 
        background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; 
        display: flex; flex-direction: column; align-items: center; 
        color: var(--text-primary); z-index: 5; 
        box-shadow: 6px 6px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.4); 
        transition: transform 0.3s ease, box-shadow 0.3s ease; 
        cursor: pointer; 
        transform-style: preserve-3d;
      }
      .node:hover { 
        transform: translateZ(30px) scale(1.03) !important; 
        box-shadow: 8px 8px 0 rgba(0,0,0,0.4), 0 12px 30px rgba(0,0,0,0.5); 
      }
      .node.pulse { animation: node-pulse 1.5s ease-in-out infinite; }
      @keyframes node-pulse { 0%, 100% { box-shadow: 6px 6px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.4); } 50% { box-shadow: 6px 6px 0 rgba(0,0,0,0.3), 0 8px 30px var(--pulse-color, rgba(255,255,255,0.3)); } }
      
      .solar { top: 15px; left: 15px; --pulse-color: rgba(255,221,0,0.4); transform: rotateX(-4deg) rotateY(5deg) translateZ(15px); }
      .grid { top: 15px; right: 15px; --pulse-color: rgba(0,243,255,0.4); transform: rotateX(-4deg) rotateY(-5deg) translateZ(15px); }
      .battery { bottom: 15px; left: 15px; --pulse-color: rgba(0,255,157,0.4); transform: rotateX(4deg) rotateY(5deg) translateZ(15px); }
      .load { bottom: 15px; right: 15px; --pulse-color: rgba(255,0,85,0.4); transform: rotateX(4deg) rotateY(-5deg) translateZ(15px); }
      @media (max-width: 400px) { .node { width: 100px; padding: 8px; } .solar, .grid { top: 10px; } .battery, .load { bottom: 10px; } .solar, .battery { left: 10px; } .grid, .load { right: 10px; } }
      
      /* INVERTER */
      .inverter { 
        position: absolute; top: 50%; left: 50%; width: 110px; height: 110px; 
        transform: translate(-50%, -50%); 
        background: radial-gradient(circle at 30% 30%, rgba(40,40,50,0.9), rgba(10,10,15,0.95)); 
        border-radius: 50%; border: 2px solid rgba(168, 85, 247, 0.4); 
        display: flex; flex-direction: column; align-items: center; justify-content: center; 
        z-index: 10; 
        box-shadow: 0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 30px rgba(0,0,0,0.5); 
        cursor: pointer; 
        transition: all 0.3s ease;
      }
      .inverter:hover {
        transform: translate(-50%, -50%) scale(1.12);
        box-shadow: 0 0 60px rgba(168, 85, 247, 0.4), inset 0 0 30px rgba(0,0,0,0.5), 0 15px 40px rgba(0,0,0,0.5);
        border-color: rgba(168, 85, 247, 0.6);
      }
      .inverter ha-icon { --mdc-icon-size: 28px; color: var(--inv-color, #a855f7); filter: drop-shadow(0 0 8px var(--inv-color, #a855f7)); transition: transform 0.3s ease; }
      .inverter:hover ha-icon { transform: scale(1.15); }
      .inverter .inv-label { font-size: 0.55rem; color: rgba(255,255,255,0.5); margin-top: 2px; }
      .inverter .inv-power { font-size: 0.7rem; font-weight: 700; color: var(--inv-color, #a855f7); }
      .inverter .self-sufficiency { font-size: 0.6rem; color: #00ff9d; margin-top: 2px; font-weight: 600; }
      .inverter::before { content: ''; position: absolute; width: 130%; height: 130%; border-radius: 50%; border: 1px solid rgba(168, 85, 247, 0.3); animation: ring-pulse 3s ease-in-out infinite; }
      @keyframes ring-pulse { 0%, 100% { transform: scale(0.9); opacity: 0.5; } 50% { transform: scale(1); opacity: 1; } }
      
      /* Typography */
      .main-val { 
        font-family: 'Orbitron', 'Segoe UI', sans-serif;
        font-size: 1.3rem; font-weight: 800; margin: 4px 0; 
        text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
      }
      .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
      .sub-info { display: flex; flex-direction: column; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); width: 100%; }
      .sub-row { font-size: 0.7rem; color: var(--text-secondary); display: flex; justify-content: space-between; width: 100%; padding: 1px 0; }
      .sub-row span:last-child { color: var(--text-primary); font-weight: 600; }
      .cost-row { font-size: 0.65rem; color: #00ff9d; margin-top: 2px; } .cost-row.negative { color: #ff0055; }
      .status-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 8px; margin-top: 4px; text-transform: uppercase; }
      .status-charging { background: rgba(0, 255, 157, 0.2); color: #00ff9d; }
      .status-discharging { background: rgba(255, 221, 0, 0.2); color: #ffdd00; }
      .status-import { background: rgba(255, 0, 85, 0.2); color: #ff0055; }
      .status-export { background: rgba(0, 243, 255, 0.2); color: #00f3ff; }
      
      /* SVG & NEW CSS ANIMATIONS */
      svg.connections { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; overflow: visible; }
      
      /* Base static wire */
      path.wire-base { fill: none; stroke: rgba(255,255,255,0.08); stroke-width: 3; }
      
      /* Animated Flow Wire - Dashed Style */
      path.wire-flow.dashed {
        fill: none; stroke-width: 3; stroke-linecap: round;
        stroke-dasharray: 10 15;
        stroke-dashoffset: 0;
        opacity: 0; transition: opacity 0.3s;
        animation: flow-dashed var(--flow-duration, 2s) linear infinite;
        filter: drop-shadow(0 0 4px currentColor);
      }
      
      @keyframes flow-dashed {
        to { stroke-dashoffset: -25; }
      }
      
      /* Animated Flow Wire - Dots Style (round small dashes) */
      path.wire-flow.dots {
        fill: none; stroke-width: 6; stroke-linecap: round;
        stroke-dasharray: 2 14;
        stroke-dashoffset: 0;
        opacity: 0; transition: opacity 0.3s;
        animation: flow-dots var(--flow-duration, 2s) linear infinite;
        filter: drop-shadow(0 0 6px currentColor);
      }
      
      @keyframes flow-dots {
        to { stroke-dashoffset: -16; }
      }
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
    const batteryInvert = this.config.battery_invert || false;
    const loadP = this._getState(E.load) || Math.abs(solarP + gridP + batP);

    const isGridImport = gridP > 0;
    const isBatCharge = batteryInvert ? (batP > 0) : (batP < 0);
    const absBatP = Math.abs(batP);
    const absGridP = Math.abs(gridP);

    // Self-sufficiency Logic
    let selfSufficiency = 0;
    const loadDaily = this._getState(E.load_daily);
    const gridBuyDaily = this._getState(E.grid_buy_daily);
    if (loadDaily > 0) {
      selfSufficiency = Math.max(0, Math.min(100, ((loadDaily - gridBuyDaily) / loadDaily) * 100));
    }
    const showSelf = this.config.show_self_sufficiency !== false;

    const shouldPulse = (p) => Math.abs(p) > maxP * 0.3;

    // Cost Logic
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

    // Battery Time
    const batCapacity = this.config.battery_capacity || 10;
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

    // Animation Style
    const flowStyle = this.config.flow_style || 'dashed';
    const getFlowStyle = (p, color, reverse = false) => {
      const absP = Math.abs(p);
      if (absP < 5) return 'opacity: 0;';
      const duration = Math.max(0.5, 4 - (absP / maxP) * 3.5);
      return `stroke: ${color}; --flow-duration: ${duration}s; opacity: 1; ${reverse ? 'animation-direction: reverse;' : ''}`;
    };

    // Flow style class helper
    const getFlowClass = (power, reverse = false) => {
      const absP = Math.abs(power);
      if (absP < 5) return '';
      return flowStyle; // 'dashed' or 'dots'
    };

    return html`
      <ha-card data-size="${this.config.card_size || 'normal'}">
        <div class="bg-grid"></div>
        <div class="scene" id="scene">
          
          <svg class="connections">
            <path id="base-solar" class="wire-base" d="" />
            <path id="base-grid" class="wire-base" d="" />
            <path id="base-bat" class="wire-base" d="" />
            <path id="base-load" class="wire-base" d="" />
            
            <path id="flow-solar" class="wire-flow ${flowStyle}" d="" style="${getFlowStyle(solarP, cSolar)}" />
            <path id="flow-grid" class="wire-flow ${flowStyle}" d="" style="${getFlowStyle(gridP, cGrid, !isGridImport)}" />
            <path id="flow-bat" class="wire-flow ${flowStyle}" d="" style="${getFlowStyle(batP, cBat, isBatCharge)}" />
            <path id="flow-load" class="wire-flow ${flowStyle}" d="" style="${getFlowStyle(loadP, cLoad, true)}" />
          </svg>

          <div class="node solar ${shouldPulse(solarP) ? 'pulse' : ''}" id="n-solar" @click=${() => this._handlePopup(E.solar)} style="border-top-color: ${cSolar};">
            <ha-icon icon="mdi:solar-power-variant" style="color: ${cSolar};"></ha-icon>
            <span class="label">${t('solar')}</span>
            <span class="main-val" style="color: ${cSolar};">${solarP.toFixed(0)} W</span>
            <div class="sub-info">
              ${E.pv1 || E.pv2 ? html`
                <div class="sub-row">
                  ${E.pv1 ? html`<span>PV1: ${this._getState(E.pv1).toFixed(0)}W</span>` : ''}
                  ${E.pv2 ? html`<span>PV2: ${this._getState(E.pv2).toFixed(0)}W</span>` : ''}
                </div>` : ''}
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

  // Draw wires once and update path data
  updated(changedProps) {
    super.updated(changedProps);
    if (!this._wired) {
      this._wired = true;
      setTimeout(() => this._drawWires(), 100);
      window.addEventListener('resize', () => this._drawWires());
    }
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

    const newPathData = {};
    ['solar', 'grid', 'bat', 'load'].forEach(key => {
      // Map key to DOM ID (solar -> n-solar)
      const nodeKey = key === 'bat' ? 'bat' : key;
      const node = root.getElementById(`n-${nodeKey}`);
      if (!node) return;

      const nRect = node.getBoundingClientRect();
      const nX = (nRect.left + nRect.width / 2) - sRect.left;
      const nY = (nRect.top + nRect.height / 2) - sRect.top;

      const mx = (nX + iX) / 2;
      const d = `M ${nX} ${nY} Q ${mx} ${nY} ${iX} ${iY}`;

      // Update static wire (for dashed style)
      root.getElementById(`base-${key}`).setAttribute('d', d);
      root.getElementById(`flow-${key}`).setAttribute('d', d);

      // Save data for dots style
      newPathData[key] = d;
    });

    // Update pathData logic to avoid infinite loops but trigger render
    if (JSON.stringify(this._pathData) !== JSON.stringify(newPathData)) {
      this._pathData = newPathData;
    }
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
  static get styles() { return css` .cfg { padding: 16px; } h3 { margin: 16px 0 8px; border-bottom: 1px solid #444; color: var(--primary-text-color); } .row { margin-bottom: 12px; } label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 4px; } input, select { width: 100%; padding: 8px; border: 1px solid #444; background: var(--card-background-color); color: var(--primary-text-color); border-radius: 4px; box-sizing: border-box; } input[type="checkbox"] { width: auto; margin-right: 8px; vertical-align: middle; } label:has(input[type="checkbox"]) { display: flex; align-items: center; color: var(--primary-text-color); cursor: pointer; } .inline { display: flex; gap: 8px; } .inline > * { flex: 1; } `; }
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
      
      <h3>✨ Flow Animation</h3>
      <div class="row"><label>Style</label><select @change=${(e) => { const ev = new Event("config-changed", { bubbles: true, composed: true }); ev.detail = { config: { ...this.config, flow_style: e.target.value } }; this.dispatchEvent(ev) }}>
        <option value="dashed" ?selected=${(this.config.flow_style || 'dashed') === 'dashed'}>Nét đứt (Dashed)</option>
        <option value="dots" ?selected=${this.config.flow_style === 'dots'}>Chấm tròn (Dots)</option>
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