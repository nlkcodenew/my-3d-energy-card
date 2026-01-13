/*
 * HIASM 3D ENERGY CARD - V3.4.0 (STABLE FLOW)
 * Features: CSS-based Flow Animation (No JS Loop), High Performance
 */

import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

const CARD_VERSION = "3.3.12";

console.info(
  `%c HIASM ENERGY CARD %c ${CARD_VERSION} `,
  "color: white; background: #00f3ff; font-weight: 700;",
  "color: #00f3ff; background: #222;"
);

const TRANSLATIONS = {
  en: { solar: "Solar", grid: "Grid", battery: "Battery", load: "Consumption", inverter: "Inverter", today: "Today", buy: "Buy", sell: "Sell", importing: "← Import", exporting: "→ Export", charging: "⚡ Charging", discharging: "↗ Discharging", charge: "Charge", discharge: "Discharge" },
  vi: { solar: "Solar", grid: "Lưới điện", battery: "Pin", load: "Tiêu thụ", inverter: "Inverter", today: "Hôm nay", buy: "Mua", sell: "Bán", importing: "← Nhập", exporting: "→ Xuất", charging: "⚡ Đang sạc", discharging: "↗ Đang xả", charge: "Sạc", discharge: "Xả" }
};

class HiasmEnergyCard extends LitElement {
  static get properties() {
    return { hass: { type: Object }, config: { type: Object } };
  }

  static getStubConfig() {
    return {
      max_power: 5000, buy_price: 3000, sell_price: 2000, currency: "đ", language: "vi", battery_invert: false,
      entities: { solar: "sensor.solar_power", solar_daily: "sensor.solar_energy_daily", grid: "sensor.grid_power", grid_buy_daily: "sensor.grid_import_daily", grid_sell_daily: "sensor.grid_export_daily", battery_soc: "sensor.battery_level", battery_power: "sensor.battery_power", battery_daily_charge: "sensor.battery_charge_daily", battery_daily_discharge: "sensor.battery_discharge_daily", load: "sensor.load_power", load_daily: "sensor.load_energy_daily", inverter_temp: "sensor.inverter_temperature" }
    };
  }

  static getConfigElement() { return document.createElement("hiasm-energy-card-editor"); }

  setConfig(config) {
    if (!config.entities) throw new Error("Please check config via Editor.");
    this.config = config;
    if (!this._resizeListenerAdded) {
      this._resizeHandler = () => setTimeout(() => this.requestUpdate(), 200);
      window.addEventListener("resize", this._resizeHandler);
      this._resizeListenerAdded = true;
    }
  }

  static get styles() {
    return css`
      :host { display: block; padding: 0; --neon-blue: #00f3ff; --neon-green: #00ff9d; --neon-red: #ff0055; --neon-yellow: #ffdd00; --neon-purple: #a855f7; --bg-card: var(--ha-card-background, #141414); --text-primary: var(--primary-text-color, #fff); --text-secondary: var(--secondary-text-color, #888); --border-color: var(--divider-color, rgba(255,255,255,0.1)); }
      ha-card { background: var(--bg-card); overflow: hidden; border-radius: 16px; position: relative; height: 420px; border: 1px solid var(--border-color); }
      @media (max-width: 400px) { ha-card { height: 380px; } }
      .bg-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px); background-size: 40px 40px; mask-image: radial-gradient(circle at center, black 40%, transparent 100%); opacity: 0.5; }
      .scene { width: 100%; height: 100%; position: relative; perspective: 1000px; }
      .node { position: absolute; width: 120px; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; display: flex; flex-direction: column; align-items: center; color: var(--text-primary); z-index: 5; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: transform 0.3s ease; cursor: pointer; backdrop-filter: blur(10px); }
      .node:hover { transform: scale(1.02); box-shadow: 0 6px 25px rgba(0,0,0,0.6); }
      .solar { top: 15px; left: 15px; border-top: 3px solid var(--neon-yellow); }
      .grid { top: 15px; right: 15px; border-top: 3px solid var(--neon-blue); }
      .battery { bottom: 15px; left: 15px; border-bottom: 3px solid var(--neon-green); }
      .load { bottom: 15px; right: 15px; border-bottom: 3px solid var(--neon-red); }
      @media (max-width: 400px) { .node { width: 100px; padding: 8px; } .solar, .grid { top: 10px; } .battery, .load { bottom: 10px; } .solar, .battery { left: 10px; } .grid, .load { right: 10px; } }
      .inverter { position: absolute; top: 50%; left: 50%; width: 110px; height: 110px; transform: translate(-50%, -50%); background: radial-gradient(circle at 30% 30%, rgba(40,40,50,0.9), rgba(10,10,15,0.95)); border-radius: 50%; border: 2px solid rgba(168, 85, 247, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 30px rgba(0,0,0,0.5); cursor: pointer; }
      .inverter ha-icon { --mdc-icon-size: 36px; color: var(--neon-purple); animation: pulse 3s infinite; filter: drop-shadow(0 0 8px var(--neon-purple)); }
      .inverter .inv-label { font-size: 0.65rem; color: rgba(255,255,255,0.6); margin-top: 4px; }
      .inverter .inv-power { font-size: 0.8rem; font-weight: 700; color: var(--neon-purple); margin-top: 2px; }
      .inverter::before { content: ''; position: absolute; width: 130%; height: 130%; border-radius: 50%; border: 1px solid rgba(168, 85, 247, 0.3); animation: ring-pulse 3s ease-in-out infinite; }
      @keyframes ring-pulse { 0%, 100% { transform: scale(0.9); opacity: 0.5; } 50% { transform: scale(1); opacity: 1; } }
      @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
      .main-val { font-size: 1.3rem; font-weight: 800; margin: 4px 0; }
      .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
      .sub-info { display: flex; flex-direction: column; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); width: 100%; }
      .sub-row { font-size: 0.7rem; color: var(--text-secondary); display: flex; justify-content: space-between; width: 100%; padding: 1px 0; }
      .sub-row span:last-child { color: var(--text-primary); font-weight: 600; }
      .cost-row { font-size: 0.65rem; color: var(--neon-green); margin-top: 2px; } .cost-row.negative { color: var(--neon-red); }
      .status-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 8px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
      .status-charging { background: rgba(0, 255, 157, 0.2); color: var(--neon-green); }
      .status-discharging { background: rgba(255, 221, 0, 0.2); color: var(--neon-yellow); }
      .status-import { background: rgba(255, 0, 85, 0.2); color: var(--neon-red); }
      .status-export { background: rgba(0, 243, 255, 0.2); color: var(--neon-blue); }
      .c-solar { color: var(--neon-yellow); } .c-grid { color: var(--neon-blue); } .c-bat { color: var(--neon-green); } .c-load { color: var(--neon-red); }
      
      /* SVG CONNECTIONS & ANIMATION */
      svg.connections { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; overflow: visible; }
      path.wire { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 3; }
      
      /* THE FLOW ANIMATION - CSS BASED */
      path.flow {
        fill: none;
        stroke-width: 6;
        stroke-linecap: round;
        stroke-dasharray: 10 120; /* 10px dash (packet), 120px gap */
        animation: flow-anim var(--dur) linear infinite;
        filter: drop-shadow(0 0 4px currentColor);
      }
      
      @keyframes flow-anim {
        from { stroke-dashoffset: 130; } /* 10 + 120 */
        to { stroke-dashoffset: 0; }
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
    const maxP = this.config.max_power || 5000;
    const t = (k) => this._t(k);

    const solarP = this._getState(E.solar);
    const gridP = this._getState(E.grid);
    const batP = this._getState(E.battery_power);
    const batSoc = this._getState(E.battery_soc);
    const loadP = this._getState(E.load) || Math.abs(solarP + gridP + batP);

    const isGridImport = gridP > 0;
    const batteryInvert = this.config.battery_invert || false;
    const isBatCharge = batteryInvert ? (batP > 0) : (batP < 0);
    const absBatP = Math.abs(batP);
    const absGridP = Math.abs(gridP);

    // CSS Animation Duration (Seconds)
    const getDur = (w) => {
      if (Math.abs(w) < 10) return 0; // 0 = stop
      return Math.max(0.5, 3 - (Math.abs(w) / maxP) * 2.5);
    };

    const buyPrice = this.config.buy_price || 0;
    const sellPrice = this.config.sell_price || 0;
    const currency = this.config.currency || 'đ';
    const buyCost = this._getState(E.grid_buy_daily) * buyPrice;
    const sellEarn = this._getState(E.grid_sell_daily) * sellPrice;
    const formatCost = (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k${currency}` : `${val.toFixed(0)}${currency}`;

    return html`
      <ha-card>
        <div class="bg-grid"></div>
        <div class="scene" id="scene">
          <svg class="connections">
            <path id="w-solar" class="wire" d="" />
            <path id="w-grid" class="wire" d="" />
            <path id="w-bat" class="wire" d="" />
            <path id="w-load" class="wire" d="" />

            ${solarP > 10 ? html`<path id="f-solar" class="flow" stroke="#ffdd00" style="--dur: ${getDur(solarP)}s" d="" />` : ''}
            ${absGridP > 10 ? html`<path id="f-grid" class="flow" stroke="#00f3ff" style="--dur: ${getDur(gridP)}s" d="" />` : ''}
            ${absBatP > 10 ? html`<path id="f-bat" class="flow" stroke="#00ff9d" style="--dur: ${getDur(batP)}s" d="" />` : ''}
            ${loadP > 10 ? html`<path id="f-load" class="flow" stroke="#ff0055" style="--dur: ${getDur(loadP)}s" d="" />` : ''}
          </svg>

          <div class="node solar" id="n-solar" @click=${() => this._handlePopup(E.solar)}>
            <ha-icon icon="mdi:solar-power-variant" class="c-solar"></ha-icon>
            <span class="label">${t('solar')}</span>
            <span class="main-val c-solar">${solarP.toFixed(0)} W</span>
            <div class="sub-info">
              ${E.pv1 || E.pv2 ? html`<div class="sub-row">${E.pv1 ? html`<span>PV1: ${this._getState(E.pv1).toFixed(0)}W</span>` : ''}${E.pv2 ? html`<span>PV2: ${this._getState(E.pv2).toFixed(0)}W</span>` : ''}</div>` : ''}
              <div class="sub-row"><span>${t('today')}:</span><span>${this._getDisplay(E.solar_daily)}</span></div>
            </div>
          </div>

          <div class="node grid" id="n-grid" @click=${() => this._handlePopup(E.grid)}>
            <ha-icon icon="mdi:transmission-tower" class="c-grid"></ha-icon>
            <span class="label">${t('grid')}</span>
            <span class="main-val c-grid">${absGridP.toFixed(0)} W</span>
            <div class="sub-info">
              ${isGridImport ?
        html`<div class="sub-row"><span>${t('buy')}:</span><span>${this._getDisplay(E.grid_buy_daily)}</span></div>${buyPrice > 0 ? html`<span class="cost-row negative">-${formatCost(buyCost)}</span>` : ''}<span class="status-badge status-import">${t('importing')}</span>` :
        html`<div class="sub-row"><span>${t('sell')}:</span><span>${this._getDisplay(E.grid_sell_daily)}</span></div>${sellPrice > 0 ? html`<span class="cost-row">+${formatCost(sellEarn)}</span>` : ''}<span class="status-badge status-export">${t('exporting')}</span>`
      }
            </div>
          </div>

          <div class="node battery" id="n-bat" @click=${() => this._handlePopup(E.battery_power)}>
            <ha-icon icon="${this._getBatteryIcon(batSoc)}" class="c-bat"></ha-icon>
            <span class="label">${t('battery')} ${batSoc.toFixed(0)}%</span>
            <span class="main-val c-bat">${absBatP.toFixed(0)} W</span>
            <div class="sub-info">
              ${isBatCharge ?
        html`<div class="sub-row"><span>${t('charge')}:</span><span>${this._getDisplay(E.battery_daily_charge)}</span></div><span class="status-badge status-charging">${t('charging')}</span>` :
        html`<div class="sub-row"><span>${t('discharge')}:</span><span>${this._getDisplay(E.battery_daily_discharge)}</span></div><span class="status-badge status-discharging">${t('discharging')}</span>`
      }
            </div>
          </div>

          <div class="node load" id="n-load" @click=${() => this._handlePopup(E.load)}>
            <ha-icon icon="mdi:home-lightning-bolt" class="c-load"></ha-icon>
            <span class="label">${t('load')}</span>
            <span class="main-val c-load">${loadP.toFixed(0)} W</span>
            <div class="sub-info">
              <div class="sub-row"><span>${t('today')}:</span><span>${this._getDisplay(E.load_daily)}</span></div>
            </div>
          </div>

          <div class="inverter" id="n-inv" @click=${() => this._handlePopup(E.inverter_temp)}>
            <ha-icon icon="mdi:solar-power"></ha-icon>
            <span class="inv-label">${t('inverter')}</span>
            <span class="inv-power">${E.inverter_temp ? this._getDisplay(E.inverter_temp) : ''}</span>
          </div>
        </div>
      </ha-card>
    `;
  }

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

    // Determine Directions
    const gridP = this._getState(this.config.entities.grid);
    const batP = this._getState(this.config.entities.battery_power);
    const batInv = this.config.battery_invert || false;

    // Logic: to-hub (Node->Inv), from-hub (Inv->Node)
    const dirGrid = gridP >= 0 ? 'to-hub' : 'from-hub';
    let dirBat;
    if (batInv) dirBat = batP > 0 ? 'from-hub' : 'to-hub';
    else dirBat = batP >= 0 ? 'to-hub' : 'from-hub';

    const wires = [
      { id: 'n-solar', w: 'w-solar', f: 'f-solar', dir: 'to-hub' },
      { id: 'n-grid', w: 'w-grid', f: 'f-grid', dir: dirGrid },
      { id: 'n-bat', w: 'w-bat', f: 'f-bat', dir: dirBat },
      { id: 'n-load', w: 'w-load', f: 'f-load', dir: 'from-hub' }
    ];

    wires.forEach(item => {
      const el = root.getElementById(item.id);
      const wire = root.getElementById(item.w);
      const flow = root.getElementById(item.f);

      if (el && wire) {
        const eRect = el.getBoundingClientRect();
        const eX = (eRect.left + eRect.width / 2) - sRect.left;
        const eY = (eRect.top + eRect.height / 2) - sRect.top;

        // Path calculation (Quadratic Bezier)
        // Midpoint control point for smooth curve
        const cx = (eX + iX) / 2;
        const cy = eY; // Horizontal-ish start
        // Actually, simple midpoint works best for star topology
        const mx = (eX + iX) / 2;
        const my = (eY + iY) / 2;
        // Curve: M Start Q Control End.
        // Let's use the Inverter Y as control point Y for nodes on top, and Inverter Y for nodes on bottom?
        // Simple Q: M eX eY Q mx eY iX iY (Curve starts horiz)
        const d = `M ${eX} ${eY} Q ${mx} ${eY} ${iX} ${iY}`;

        wire.setAttribute("d", d);

        if (flow) {
          // If direction is to-hub: Same path
          // If direction is from-hub: Reverse path
          if (item.dir === 'to-hub') {
            flow.setAttribute("d", `M ${eX} ${eY} Q ${mx} ${eY} ${iX} ${iY}`);
          } else {
            flow.setAttribute("d", `M ${iX} ${iY} Q ${mx} ${eY} ${eX} ${eY}`);
          }
        }
      }
    });
  }
}

customElements.define("hiasm-energy-card", HiasmEnergyCard);

class HiasmEnergyCardEditor extends LitElement {
  static get properties() { return { hass: {}, config: {} }; }
  setConfig(config) { this.config = config; }
  _val(ev) {
    if (!this.config) return;
    const t = ev.target;
    const sub = t.subValue;
    let n = { ...this.config };
    if (sub) n.entities = { ...n.entities, [sub]: t.value };
    else n[t.configValue] = t.value;
    const e = new Event("config-changed", { bubbles: true, composed: true });
    e.detail = { config: n };
    this.dispatchEvent(e);
  }
  static get styles() { return css` .cfg { padding: 16px; } h3 { margin: 16px 0 8px; border-bottom: 1px solid #444; color: var(--primary-text-color); } .row { margin-bottom: 12px; } label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 4px; } input, select { width: 100%; padding: 8px; border: 1px solid #444; background: var(--card-background-color); color: var(--primary-text-color); border-radius: 4px; } `; }
  render() {
    if (!this.hass || !this.config) return html``;
    const E = this.config.entities || {};
    return html`<div class="cfg"><h3>⚙️ Config</h3>${this._i("Max Power", "max_power", this.config.max_power)}<div class="row"><label>Language</label><select @change=${(e) => { const ev = new Event("config-changed", { bubbles: true, composed: true }); ev.detail = { config: { ...this.config, language: e.target.value } }; this.dispatchEvent(ev) }}><option value="vi" ?selected=${this.config.language === 'vi'}>Tiếng Việt</option><option value="en" ?selected=${this.config.language === 'en'}>English</option></select></div><h3>💰 Cost</h3>${this._i("Buy Price", "buy_price", this.config.buy_price)}${this._i("Sell Price", "sell_price", this.config.sell_price)}<h3>☀️ Solar</h3>${this._i("Solar Power", "solar", E.solar, true)}${this._i("Solar Daily", "solar_daily", E.solar_daily, true)}${this._i("PV1", "pv1", E.pv1, true)}${this._i("PV2", "pv2", E.pv2, true)}<h3>🔌 Grid</h3>${this._i("Grid Power", "grid", E.grid, true)}${this._i("Grid Buy", "grid_buy_daily", E.grid_buy_daily, true)}${this._i("Grid Sell", "grid_sell_daily", E.grid_sell_daily, true)}<h3>🔋 Battery</h3>${this._i("SoC", "battery_soc", E.battery_soc, true)}${this._i("Power", "battery_power", E.battery_power, true)}${this._i("Charge Daily", "battery_daily_charge", E.battery_daily_charge, true)}${this._i("Discharge Daily", "battery_daily_discharge", E.battery_daily_discharge, true)}<div class="row"><label><input type="checkbox" .checked=${this.config.battery_invert || false} @change=${(e) => { const ev = new Event("config-changed", { bubbles: true, composed: true }); ev.detail = { config: { ...this.config, battery_invert: e.target.checked } }; this.dispatchEvent(ev) }}> Invert Battery Sign (+ = Charge)</label></div><h3>🏠 Load</h3>${this._i("Load Power", "load", E.load, true)}${this._i("Load Daily", "load_daily", E.load_daily, true)}<h3>⚡ Inverter</h3>${this._i("Temp", "inverter_temp", E.inverter_temp, true)}</div>`;
  }
  _i(l, k, v, s = false) { return html`<div class="row"><label>${l}</label><input type="text" .value="${v || ''}" .configValue=${s ? undefined : k} .subValue=${s ? k : undefined} @input=${this._val}></div>`; }
}
customElements.define("hiasm-energy-card-editor", HiasmEnergyCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "hiasm-energy-card", name: "HIASM Energy Card", preview: true, description: "3D Energy Monitor" });