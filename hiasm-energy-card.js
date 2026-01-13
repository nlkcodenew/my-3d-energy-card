/*
 * HIASM 3D ENERGY CARD - PRO VERSION
 * Features: 3D Hologram, Visual Editor, Separate Battery Logic, Interactive Nodes
 */

import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

const CARD_VERSION = "2.0.0";

console.info(
    `%c HIASM ENERGY CARD %c ${CARD_VERSION} `,
    "color: white; background: #00f3ff; font-weight: 700;",
    "color: #00f3ff; background: #222;"
);

// --------------------------------------------------------------------------
// MAIN CARD COMPONENT
// --------------------------------------------------------------------------
class HiasmEnergyCard extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
        };
    }

    // Define Stub Config for Visual Editor
    static getStubConfig() {
        return {
            max_power: 5000,
            entities: {
                solar: "sensor.solar_power",
                grid: "sensor.grid_power",
                battery_soc: "sensor.battery_level",
                battery_power: "sensor.battery_power",
                load: "sensor.load_power"
            }
        }
    }

    // Link to Visual Editor
    static getConfigElement() {
        return document.createElement("hiasm-energy-card-editor");
    }

    setConfig(config) {
        if (!config.entities) {
            throw new Error("Cấu hình chưa đúng. Vui lòng dùng Visual Editor.");
        }
        this.config = config;
        // Resize Observer for responsive canvas
        window.addEventListener("resize", () => {
            if (this._resizeTimer) clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => { this.requestUpdate(); }, 200);
        });
    }

    // CSS STYLES
    static get styles() {
        return css`
      :host {
        display: block;
        padding: 16px;
        --card-height: 420px;
        --neon-blue: #00f3ff;
        --neon-green: #00ff9d;
        --neon-red: #ff0055;
        --neon-yellow: #ffdd00;
        --glass-bg: rgba(15, 23, 30, 0.7);
        --glass-border: rgba(255, 255, 255, 0.08);
        font-family: 'Segoe UI', Roboto, sans-serif;
      }

      .scene {
        height: var(--card-height);
        perspective: 1000px;
        position: relative;
        overflow: hidden; /* Clean edges */
        border-radius: 12px;
        background: radial-gradient(circle at 50% 50%, #2b3245 0%, #000000 100%);
      }

      /* Holographic Floor */
      .floor {
        position: absolute;
        width: 200%;
        height: 200%;
        left: -50%;
        top: 20%;
        transform: rotateX(70deg);
        background: 
            linear-gradient(transparent 0%, rgba(0, 243, 255, 0.05) 1px, transparent 2px),
            linear-gradient(90deg, transparent 0%, rgba(0, 243, 255, 0.05) 1px, transparent 2px);
        background-size: 50px 50px;
        animation: gridScroll 15s linear infinite;
        pointer-events: none;
      }

      @keyframes gridScroll {
        0% { background-position: 0 0; }
        100% { background-position: 0 50px; }
      }

      /* Nodes */
      .node {
        position: absolute;
        width: 110px;
        padding: 12px 0;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        cursor: pointer;
        z-index: 5;
        transform-style: preserve-3d;
      }

      .node:hover {
        transform: translateY(-5px) scale(1.05);
        border-color: var(--neon-blue);
        box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
        background: rgba(30, 40, 50, 0.85);
      }

      .node ha-icon {
        --mdc-icon-size: 32px;
        margin-bottom: 6px;
        filter: drop-shadow(0 0 8px currentColor);
      }

      .value {
        font-size: 1.1rem;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      
      .label {
        font-size: 0.75rem;
        opacity: 0.6;
        text-transform: uppercase;
        margin-top: 2px;
      }

      /* Special colors for specific nodes */
      .node.solar { border-bottom: 3px solid var(--neon-yellow); color: var(--neon-yellow); top: 8%; left: 8%; }
      .node.grid { border-bottom: 3px solid var(--neon-blue); color: var(--neon-blue); top: 8%; right: 8%; }
      .node.battery { border-bottom: 3px solid var(--neon-green); color: var(--neon-green); bottom: 12%; left: 8%; }
      .node.load { border-bottom: 3px solid var(--neon-red); color: var(--neon-red); bottom: 12%; right: 8%; }

      /* Central Inverter */
      .inverter {
        top: 50%; left: 50%;
        width: 140px; height: 140px;
        transform: translate(-50%, -50%);
        background: rgba(10, 15, 20, 0.9);
        border: 1px solid rgba(0, 243, 255, 0.3);
        border-radius: 50%; /* Circle core */
        z-index: 10;
        box-shadow: 0 0 50px rgba(0, 243, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .inverter::after {
        content: '';
        position: absolute;
        width: 100%; height: 100%;
        border-radius: 50%;
        border: 2px dashed var(--neon-blue);
        animation: spin 20s linear infinite;
        opacity: 0.3;
      }
      
      @keyframes spin { 100% { transform: rotate(360deg); } }

      /* Connection Lines */
      svg.connections {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 2;
        overflow: visible;
      }

      path.line {
        fill: none;
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 2;
        stroke-linecap: round;
      }

      /* Flow Particles */
      .dot {
        fill: white;
        filter: drop-shadow(0 0 6px currentColor);
      }
    `;
    }

    // HELPER FUNCTIONS
    _getState(entity) {
        if (!entity || !this.hass.states[entity]) return 0;
        return parseFloat(this.hass.states[entity].state);
    }

    _getDisplay(entity) {
        if (!entity || !this.hass.states[entity]) return "N/A";
        const state = this.hass.states[entity].state;
        const unit = this.hass.states[entity].attributes.unit_of_measurement || "";
        return `${state} ${unit}`;
    }

    _handleMoreInfo(entityId) {
        if (!entityId) return;
        const event = new Event("hass-more-info", {
            bubbles: true,
            composed: true,
        });
        event.detail = { entityId };
        this.dispatchEvent(event);
    }

    // RENDER
    render() {
        if (!this.hass || !this.config) return html``;

        const E = this.config.entities;
        const maxP = this.config.max_power || 5000;

        // Get Values
        const solarP = this._getState(E.solar);
        const gridP = this._getState(E.grid);
        // Separate Battery Logic: SoC for Display, Power for Flow
        const batSoC = E.battery_soc ? this._getDisplay(E.battery_soc) : "N/A";
        const batP = E.battery_power ? this._getState(E.battery_power) : 0;
        const loadP = E.load ? this._getState(E.load) : (solarP + gridP - batP); // Simple fallback calc

        // Calc Animation Durations (0s = stopped, lower = faster)
        const getDur = (w) => {
            if (Math.abs(w) < 10) return "0s";
            return `${Math.max(0.5, 6 - (Math.abs(w) / maxP) * 5)}s`;
        };

        const isGridImport = gridP > 0;
        const isBatCharging = batP < 0; // Negative usually means charging

        return html`
      <ha-card>
        <div class="scene" id="scene">
          <div class="floor"></div>

          <svg class="connections">
             <defs>
               <linearGradient id="gradSolar" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" style="stop-color:var(--neon-yellow);stop-opacity:1" />
                 <stop offset="100%" style="stop-color:white;stop-opacity:0" />
               </linearGradient>
             </defs>
             
             <path id="path-solar" class="line" d="" />
             <path id="path-grid" class="line" d="" />
             <path id="path-bat" class="line" d="" />
             <path id="path-load" class="line" d="" />

             ${solarP > 10 ? html`
               <circle class="dot" r="4" style="color:var(--neon-yellow)">
                 <animateMotion dur="${getDur(solarP)}" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1">
                   <mpath href="#path-solar"/>
                 </animateMotion>
               </circle>` : ''}
             
             ${Math.abs(gridP) > 10 ? html`
               <circle class="dot" r="4" style="color:var(--neon-blue)">
                 <animateMotion dur="${getDur(gridP)}" repeatCount="indefinite" keyPoints="${isGridImport ? '1;0' : '0;1'}" keyTimes="0;1">
                   <mpath href="#path-grid"/>
                 </animateMotion>
               </circle>` : ''}

             ${Math.abs(batP) > 10 ? html`
               <circle class="dot" r="4" style="color:var(--neon-green)">
                 <animateMotion dur="${getDur(batP)}" repeatCount="indefinite" keyPoints="${isBatCharging ? '1;0' : '0;1'}" keyTimes="0;1">
                   <mpath href="#path-bat"/>
                 </animateMotion>
               </circle>` : ''}
               
             ${loadP > 10 ? html`
               <circle class="dot" r="4" style="color:var(--neon-red)">
                 <animateMotion dur="${getDur(loadP)}" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1">
                   <mpath href="#path-load"/>
                 </animateMotion>
               </circle>` : ''}

          </svg>

          <div class="node solar" id="n-solar" @click=${() => this._handleMoreInfo(E.solar)}>
            <ha-icon icon="mdi:solar-power"></ha-icon>
            <span class="value">${this._getDisplay(E.solar)}</span>
            <span class="label">Solar</span>
          </div>

          <div class="node grid" id="n-grid" @click=${() => this._handleMoreInfo(E.grid)}>
            <ha-icon icon="mdi:transmission-tower"></ha-icon>
            <span class="value">${this._getDisplay(E.grid)}</span>
            <span class="label">Grid</span>
          </div>

          <div class="node battery" id="n-bat" @click=${() => this._handleMoreInfo(E.battery_soc || E.battery_power)}>
            <ha-icon icon="mdi:battery-high"></ha-icon>
            <span class="value">${batSoC}</span> <span class="label" style="font-size: 0.7em">${Math.abs(batP).toFixed(0)} W</span> </div>

          <div class="node load" id="n-load" @click=${() => this._handleMoreInfo(E.load)}>
            <ha-icon icon="mdi:home-lightning-bolt"></ha-icon>
            <span class="value">${Math.round(loadP)} W</span>
            <span class="label">Load</span>
          </div>

          <div class="inverter" id="n-inv">
            <ha-icon icon="mdi:cpu-64-bit" style="--mdc-icon-size: 64px; color: white; filter: drop-shadow(0 0 10px var(--neon-blue))"></ha-icon>
          </div>

        </div>
      </ha-card>
    `;
    }

    updated(changedProps) {
        super.updated(changedProps);
        this._drawLines();
    }

    _drawLines() {
        const root = this.shadowRoot;
        const nodes = { solar: 'n-solar', grid: 'n-grid', bat: 'n-bat', load: 'n-load' };
        const inv = root.getElementById('n-inv');
        const scene = root.getElementById('scene');

        if (!inv || !scene) return;

        const sRect = scene.getBoundingClientRect();
        const iRect = inv.getBoundingClientRect();
        const iX = (iRect.left + iRect.width / 2) - sRect.left;
        const iY = (iRect.top + iRect.height / 2) - sRect.top;

        Object.entries(nodes).forEach(([key, id]) => {
            const el = root.getElementById(id);
            const path = root.getElementById(`path-${key}`);
            if (el && path) {
                const eRect = el.getBoundingClientRect();
                const eX = (eRect.left + eRect.width / 2) - sRect.left;
                const eY = (eRect.top + eRect.height / 2) - sRect.top;

                // Draw smooth curve (Quadratic Bezier)
                path.setAttribute("d", `M ${eX} ${eY} Q ${eX} ${iY} ${iX} ${iY}`);
            }
        });
    }
}

customElements.define("hiasm-energy-card", HiasmEnergyCard);


// --------------------------------------------------------------------------
// VISUAL EDITOR COMPONENT
// --------------------------------------------------------------------------
class HiasmEnergyCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
        };
    }

    setConfig(config) {
        this.config = config;
    }

    configChanged(newConfig) {
        const event = new Event("config-changed", {
            bubbles: true,
            composed: true,
        });
        event.detail = { config: newConfig };
        this.dispatchEvent(event);
    }

    _valueChanged(ev) {
        if (!this.config || !this.hass) return;
        const target = ev.target;
        const configValue = target.configValue; // e.g., 'max_power'
        const subValue = target.subValue;       // e.g., 'entities.solar'

        let newConfig = { ...this.config };

        if (subValue) {
            // Handle nested entities object
            newConfig.entities = { ...newConfig.entities, [subValue]: target.value };
        } else {
            // Handle top level
            newConfig[configValue] = target.value;
        }

        this.configChanged(newConfig);
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const entities = this.config.entities || {};

        return html`
      <div class="card-config">
        <h3>Cấu hình chung</h3>
        <div class="option">
            <label>Max Power (W) - Dùng để chỉnh tốc độ dòng chảy:</label>
            <input type="number" .value="${this.config.max_power || 5000}" .configValue=${"max_power"} @input=${this._valueChanged}>
        </div>

        <h3>Entities (Thực thể)</h3>
        ${this._renderEntityPicker("Solar Power (W)", "solar", entities.solar)}
        ${this._renderEntityPicker("Grid Power (W)", "grid", entities.grid)}
        ${this._renderEntityPicker("Battery SoC (%) - Để hiển thị", "battery_soc", entities.battery_soc)}
        ${this._renderEntityPicker("Battery Power (W) - Để tính dòng", "battery_power", entities.battery_power)}
        ${this._renderEntityPicker("Load Power (W) - Tùy chọn", "load", entities.load)}
      </div>
    `;
    }

    _renderEntityPicker(label, key, value) {
        return html`
        <div class="option" style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:bold;">${label}</label>
            <input type="text" 
                   list="entities-${key}"
                   .value="${value || ''}" 
                   .subValue=${key}
                   @input=${this._valueChanged}
                   style="width: 100%; padding: 8px; box-sizing: border-box;"
                   placeholder="Nhập tên entity (VD: sensor.solar...)">
            </div>
      `;
    }

    static get styles() {
        return css`
      .card-config { padding: 0px; }
      .option { margin-bottom: 10px; }
      input { border: 1px solid #ccc; border-radius: 4px; }
    `;
    }
}

customElements.define("hiasm-energy-card-editor", HiasmEnergyCardEditor);

// Register the card to show up in the "Add Card" list
window.customCards = window.customCards || [];
window.customCards.push({
    type: "hiasm-energy-card",
    name: "3D Energy Card Pro",
    preview: true,
    description: "A futuristic 3D energy flow monitor"
});