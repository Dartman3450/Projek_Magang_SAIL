let espConnected = false;
let _activeTab   = 'water-level';
let _activeReportTab = 'lab';
let _reportSortBy = 'newest';

// Project management state variables
let _editPJIdx = -1;
let _spPJIdx = -1;
let _cipPJIdx = -1;
let _fpPJIdx = -1;
let _updPJIdx = -1, _updType = '';

const API = {
  summary:    '/api/iot/dashboard/summary',
  waterLevel: '/api/iot/water-level',
  waterFlow:  '/api/iot/water-flow',
  lingkungan: '/api/iot/lingkungan',
  patroli:    '/api/iot/patroli',
};

// Lab CIP state
let _labCIPItems = {}; // menyimpan counter item per uid

// Set Point field definitions (pagination)
const SP_FIELDS_PAGE1 = [
  {id:'sp-slurry',     label:'Slurry Ratio',         type:'number', unit:'%'},
  {id:'sp-hopper',     label:'Hopper Calibration',   type:'text',   unit:''},
  {id:'sp-density',    label:'Density',              type:'number', unit:'Kg/m³'},
  {id:'sp-feed',       label:'Feed',                 type:'number', unit:'L/h'},
  {id:'sp-aroma',      label:'Aroma Flowrate',       type:'number', unit:'L/h',      calculated:true, formula:'External strip rate % * Feed'},
  {id:'sp-steam',      label:'Stripping Steam',      type:'number', unit:'kg/h',     calculated:true, formula:'Aroma + 0.0933 * Top of Column - 2.3333 + Math.abs(Offset) * Feed * 0.0018'},
  {id:'sp-prod-out',   label:'Product Out',          type:'number', unit:'°C'},
  {id:'sp-cond1',      label:'Condensate #1',        type:'number', unit:'L/h',      calculated:true, formula:'Condenser #1 % * Feed'},
  {id:'sp-cond2',      label:'Condensate #2',        type:'number', unit:'L/h',      calculated:true, formula:'(External strip rate % - Condenser #1 %) * Feed'},
  {id:'sp-ext',        label:'External Strip Rate ',  type:'number', unit:'%'},
  {id:'sp-int',        label:'Internal Strip Rate ',  type:'text',   unit:'%',         calculated:true, formula:'100 * Stripping Steam / Feed'},
  {id:'sp-cond-rate',  label:'Condenser #1',         type:'number', unit:'%'},
  {id:'sp-offset',     label:'Offset',               type:'number', unit:'°C'},
  {id:'sp-chilled',    label:'Chilled Water',                       type:'text',   unit:'°C'},
  {id:'sp-condenser-water', label:'Condenser Water',                type:'text',   unit:'°C'},
  {id:'sp-system-vacuum',   label:'System Vacuum',                  type:'text',   unit:'KPa'},
  {id:'sp-steam-flow',      label:'Steam Flow',                     type:'text',   unit:'Kg/h'},
];
// Set Point field definitions (pagination)
const SP_FIELDS_PAGE2 = [
  {id:'sp-temp-feed',  label:'Product Feed',         type:'number', unit:'°C'},
  {id:'sp-temp-heater',label:'Product Heater',       type:'number', unit:'°C',      calculated:true, formula:'Top of Column + Offset'},
  {id:'sp-temp-top',   label:'Top of Column',        type:'number', unit:'°C'},
  {id:'sp-Condensate1', label:'Condensate Temp #1',    type:'number', unit:'°C'},
  {id:'sp-Condensate2', label:'Condensate Temp #2',    type:'number', unit:'°C'},
  {id:'sp-temp-bot',   label:'Bottom of Column',     type:'number', unit:'°C'},
  {id:'sp-add1',       label:'Product Flowrate',                    type:'text',   unit:'L/H'},
  {id:'sp-add2',       label:'Product Flow Control Valve Position', type:'text',   unit:'%'},
  {id:'sp-add3',       label:'CT Steam Pressure',                   type:'text',   unit:'KPa'},
  {id:'sp-add4',       label:'Concentrate Recirculation Flow',      type:'text',   unit:'L/H'},
  {id:'sp-add5',       label:'Product Cooler Temperature',          type:'text',   unit:'°C'},
  {id:'sp-add6',       label:'CT Discharge Level',                  type:'text',   unit:'%'},
  {id:'sp-add7',       label:'Brix Input',                          type:'text',   unit:'%'},
  {id:'sp-add8',       label:'Brix Output',                         type:'text',   unit:'%'},
];
const SP_FIELDS = [...SP_FIELDS_PAGE1, ...SP_FIELDS_PAGE2];

const DE_SECTIONS = [
  {
    label: 'Slurry',
    icon: '🌿',
    color: '#166534',
    bg: '#f0fdf4',
    border: '#86efac',
    fields: ['sp-slurry', 'sp-hopper', 'sp-density']
  },
  {
    label: 'Flow',
    icon: '💧',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#93c5fd',
    fields: ['sp-feed', 'sp-aroma', 'sp-steam', 'sp-cond1', 'sp-cond2']
  },
  {
    label: 'Strip Rate',
    icon: '📊',
    color: '#6b21a8',
    bg: '#faf5ff',
    border: '#c4b5fd',
    fields: ['sp-ext', 'sp-int', 'sp-cond-rate', 'sp-offset']
  },
  {
    label: 'Temperature',
    icon: '🌡️',
    color: '#b32222',
    bg: '#fff7ed',
    border: '#fdba74',
    fields: ['sp-temp-feed', 'sp-temp-heater', 'sp-temp-top', 'sp-Condensate1', 'sp-Condensate2', 'sp-temp-bot', 'sp-prod-out']
  },
  {
    label: 'Coolants',
    icon: '🧊',
    color: '#0284c7', // Biru laut pekat (mudah dibaca)
    bg: '#f0f9ff',    // Biru es sangat lembut (cerah)
    border: '#bae6fd',
    fields: ['sp-chilled', 'sp-condenser-water']
  },
  {
    label: 'Pressure',
    icon: '⚡',
    color: '#d97706', // Oranye/Amber pekat tegas
    bg: '#fffbeb',    // Kuning gading sangat lembut
    border: '#fde68a',
    fields: ['sp-system-vacuum', 'sp-steam-flow']
  },
  {
    label: 'Parameter CT',
    icon: '🔬',
    color: '#15803d', // Hijau tua (segar & jelas)
    bg: '#f0fdf4',    // Hijau mint pucat (bersih)
    border: '#bbf7d0',
    fields: ['sp-add1', 'sp-add2', 'sp-add3', 'sp-add4', 'sp-add5', 'sp-add6', 'sp-add7', 'sp-add8']
  }
];

// ═══════════════════════════════════════════════════════════════
// CIP MODAL SYSTEM - Checklist definitions
// ═══════════════════════════════════════════════════════════════
const CIP_CHECKLISTS = {
  production: {
    title: 'CIP Production',
    sections: [
      {
        name: 'SSC + Decanter CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric', 'Revers', 'Shutdown']
      },
      {
        name: 'Centri + Raw Tank CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric', 'Shutdown']
      },
      {
        name: 'Filter CIP',
        items: ['Rinsing', 'Caustic + Rinsing', 'Citric + Rinsing']
      },
      {
        name: 'CT CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric']
      },
      {
        name: 'Clarified Tank CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric']
      },
      {
        name: 'Concentrate Tank CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric']
      },
      {
        name :'Aroma Tank CIP',
        items: ['Rinsing Hot Water']
      },
    ],
    fields: [
      { id: 'total_caustic', label: 'Total Caustic', type: 'text' },
      { id: 'total_citric',  label: 'Total Citric',  type: 'text' }
    ]
  },
  laboratorium: {
    title: 'Laboratory CIP',
    sections: [
      {
        name: 'General CIP',
        items: ['Pre-rinse', 'Caustic Wash', 'Intermediate Rinse', 'Acid Wash', 'Final Rinse', 'Sanitization']
      }
    ],
    fields: [
      { id: 'ph', label: 'PH', type: 'number', step: '0.1' }
    ]
  }
};

// ══ UTILS ══════════════════════════════════════════
const $ = id => document.getElementById(id);
const set = (id, v) => { const el=$(id); if(el) el.textContent=v; };
const fmtT  = ts => ts ? new Date(ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '—';
const fmtDT = ts => ts ? new Date(ts).toLocaleString('id-ID') : '—';
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

// ══ CLOCK ══════════════════════════════════════════
setInterval(() => set('clock', new Date().toLocaleTimeString('id-ID')), 1000);