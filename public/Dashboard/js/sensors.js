function initWidgets() {
  mkPipe('pfl',6); mkPipe('pfr',6);
  mkPipe('pfl-gt',4); mkPipe('pfr-gt',4);
  const dr=$('drops-row');
  if(dr) for(let i=0;i<7;i++){
    const d=document.createElement('div'); d.className='drp'; d.id='drp-'+i;
    d.style.cssText='height:6px;background:#e4e8ed;opacity:.3';
    dr.appendChild(d);
  }
  const gp=$('gas-ptcl');
  const gc=['#6f52d9','#a78bfa','#5b3fc9','#c4b5fd','#4c2ec4'];
  if(gp) for(let i=0;i<10;i++){
    const p=document.createElement('div'); p.className='gp';
    p.style.cssText=`background:${gc[i%5]};height:${8+Math.random()*14}px;animation-duration:${.6+Math.random()*.9}s;animation-delay:${Math.random()*.8}s`;
    gp.appendChild(p);
  }
}

function mkPipe(id,n){
  const c=$(id); if(!c) return;
  for(let i=0;i<n;i++){
    const p=document.createElement('div'); p.className='fp';
    p.style.cssText=`top:${7+Math.random()*6}px;height:${2+Math.random()*2}px;animation-duration:${.8+Math.random()*.9}s;animation-delay:${Math.random()*1.5}s;opacity:${.45+Math.random()*.4}`;
    c.appendChild(p);
  }
}

// ══════════════════════════════════════════════════════════
// ESP STATUS CHECK & DISPLAY
// ══════════════════════════════════════════════════════════

// Check apakah semua ESP completely offline
function isEspOffline() {
  // Jika window vars ada, check dari sana
  if (typeof espConnected !== 'undefined') return !espConnected;
  if (typeof window.mqttConnected !== 'undefined') return !window.mqttConnected;
  return false;
}

// Update status indicator based on ESP connection
function updateConnectionStatus() {
  const statusEl = document.getElementById('wl-status');
  if (!statusEl) return;
  
  const offline = isEspOffline();
  
  if (offline) {
    statusEl.className = 's-pill st-offline';
    statusEl.textContent = '🔴 No Data';
    statusEl.title = 'MQTT disconnected - ESP offline or not transmitting';
    statusEl.style.animation = 'pulse-offline 2s ease-in-out infinite';
  } else {
    statusEl.className = 's-pill st-ok';
    statusEl.textContent = '🟢 Connected';
    statusEl.title = 'MQTT connected - receiving live data';
    statusEl.style.animation = 'none';
  }
}

async function fetchSummary() {
  try {
    const res = await fetch(API.summary);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (!j.success) throw new Error(j.message || 'error');

    espConnected = true;
    window.mqttConnected = true;  // Mark MQTT as connected
    showOverlays(false);

    const d = j.data;

    // DEBUG: Log data yang diterima
    console.log('📊 fetchSummary - Data dari API:', d);
    console.log('💧 Water Level:', d.water_level);

    // ── Update last-seen per ESP ──────────────────────
    if (d.water_level?.created_at)  _espLastSeen.wl  = d.water_level.created_at;
    if (d.water_flow?.created_at)   _espLastSeen.wf  = d.water_flow.created_at;
    if (d.lingkungan?.created_at)   _espLastSeen.env = d.lingkungan.created_at;

    updateEspBadge();
    updateConnectionStatus();  // Update status indicator

    applyWL(d.water_level);
    applyWF(d.water_flow);
    applyEnv(d.lingkungan);
    applyPatroli(d.total_patroli);
    if (typeof applyFuelGenset === 'function') applyFuelGenset(d.fuel_level);
    if (typeof applyWWTP   === 'function') applyWWTP(d.wwtp   ?? d.limbah ?? null);
    if (typeof applyDiesel === 'function') applyDiesel(d.diesel ?? d.diesel_oil ?? null);

    console.log('✅ Data sensor sudah di-update ke dashboard');
    
    // Update last refresh time indicator
    if (typeof window.updateLastRefreshTime === 'function') {
      window.updateLastRefreshTime();
    }

  } catch(e) {
    console.warn('❌ MQTT/ESP Connection Failed:', e.message);
    espConnected = false;
    window.mqttConnected = false;  // Mark MQTT as disconnected
    
    // Clear all tank data and show "-%" on all tanks
    clearAllTankData();
    
    // Update ESP badge to show offline
    if (typeof updateEspBadge === 'function') {
      updateEspBadge();
    }
    
    // Update status indicator to show offline
    updateConnectionStatus();
  }
}

// Clear all tank water level data when MQTT is offline
// Handle all sensor elements dengan berbagai suffix (-fw, -chiller, -tw2, -diesel, dll)
function clearAllTankData() {
  const sensors = getSensors();
  const SECTION_SUFFIXES = ['', '-fw', '-chiller', '-tw2', '-diesel'];
  
  sensors.forEach(s => {
    // Clear untuk setiap variant element (main + suffix variants)
    SECTION_SUFFIXES.forEach(suffix => {
      const fullId = s.id + suffix;
      
      // Clear percentage
      const pctEl = document.getElementById('tank-pct-' + fullId);
      if (pctEl) pctEl.textContent = '—%';
      
      // Show offline badge
      const offlineEl = document.getElementById('tank-offline-' + fullId);
      if (offlineEl) offlineEl.style.display = 'flex';
      
      // Set water level to 0
      const waterEl = document.getElementById('tank-water-' + fullId);
      if (waterEl) waterEl.style.height = '0%';
      
      // Clear volume
      const volEl = document.getElementById('tank-vol-' + fullId);
      if (volEl) volEl.textContent = '—lt / —lt';
      
      // Clear height in cm
      const cmEl = document.getElementById('tank-cm-' + fullId);
      if (cmEl) cmEl.textContent = '— cm air';
      
      // Clear progress bar
      const barEl = document.getElementById('tank-bar-' + fullId);
      if (barEl) barEl.style.width = '0%';
      
      // Clear tank body color
      const bodyEl = document.getElementById('tank-body-' + fullId);
      if (bodyEl) bodyEl.style.border = '1.5px solid #cbd5e1';
      
      // Mini variants (jika ada)
      const pctMiniEl = document.getElementById('tank-pct-mini-' + fullId);
      if (pctMiniEl) pctMiniEl.textContent = '—%';
      
      const volMiniEl = document.getElementById('tank-vol-mini-' + fullId);
      if (volMiniEl) volMiniEl.textContent = '— L';
    });
  });
  
  // Update status indicator
  const statusEl = document.getElementById('wl-status');
  if (statusEl) {
    statusEl.className = 's-pill st-offline';
    statusEl.textContent = '🔴 MQTT Offline';
  }
  
  console.log('📴 All tank data cleared — MQTT/ESP disconnected');
}

function showOverlays(show) {
  ['wl','wf','suhu','kel','gas','pat'].forEach(k=>{
    const ov=$('ov-'+k); if(ov) ov.classList.toggle('show', show);
  });
}

// ── Apply data ──────────────────────────────────────
// ── SENSOR COLOR PALETTE ─────────────────────────────────
const SENSOR_COLORS = [
  { border:'#2b7de9', water:'linear-gradient(180deg,#bfdffa,#3b9de8)', waterDark:'#2563eb', bg:'#eff6ff', text:'var(--blue)',   label:'#2b7de9' },
  { border:'#7c3aed', water:'linear-gradient(180deg,#d8b4fe,#7c3aed)', waterDark:'#6d28d9', bg:'#f5f3ff', text:'var(--purple)', label:'#7c3aed' },
  { border:'#18a96a', water:'linear-gradient(180deg,#6ee7b7,#059669)', waterDark:'#047857', bg:'#f0fdf4', text:'var(--green)',  label:'#18a96a' },
  { border:'#e07b2a', water:'linear-gradient(180deg,#fdba74,#c2410c)', waterDark:'#c2410c', bg:'#fff7ed', text:'var(--orange)', label:'#e07b2a' },
  { border:'#c99a0a', water:'linear-gradient(180deg,#fde68a,#b45309)', waterDark:'#a16207', bg:'#fefce8', text:'var(--yellow)', label:'#c99a0a' },
  { border:'#dc3545', water:'linear-gradient(180deg,#fca5a5,#b91c1c)', waterDark:'#991b1b', bg:'#fef2f2', text:'var(--red)',    label:'#dc3545' },
];


const FIXED_TANK_SLOTS = [

  { fixedId:'air_proses',   name:'Process Water',     key:'s1',  active:true,  shape:'persegi',  orientasi:'vertikal',   tinggi:1,    panjang:3,    lebar:2,   sensorZeroCm:0, warnPct:40, critPct:15 },
  { fixedId:'feed_slury',   name:'Feed Slurry Water', key:'s2',  active:true,  shape:'persegi',  orientasi:'vertikal',   tinggi:1.5,  panjang:6,    lebar:2,   sensorZeroCm:0, warnPct:40, critPct:15 },
  { fixedId:'chiller in',     name:'Chiller In',        key:'s4',  active:true,  shape:'persegi',  orientasi:'vertikal',   tinggi:1.22, panjang:1,    lebar:0.8, sensorZeroCm:0, warnPct:40, critPct:15 },
  { fixedId:'chiller out',     name:'Chiller Out',       key:'s5',  active:true,  shape:'persegi',  orientasi:'vertikal',   tinggi:1.22, panjang:1,    lebar:0.8, sensorZeroCm:0,  warnPct:40, critPct:15 },
  { fixedId:'solar',        name:'Tangki Solar',      key:'s3',  active:true,  shape:'silinder', orientasi:'horizontal', tinggi:1.48, panjang:4.23,            sensorZeroCm:0, warnPct:40, critPct:15 },
  { fixedId:'slury_1',      name:'Slurry 1',          key:'s7',  active:true,  shape:'silinder', orientasi:'vertikal',   tinggi:2.13, diameter:0.978,            sensorZeroCm:0, warnPct:40, critPct:15 },
  { fixedId:'slury_2',      name:'Slurry 2',          key:'s8',  active:true,  shape:'silinder', orientasi:'vertikal',   tinggi:2.13, diameter:0.978,            sensorZeroCm:0,  warnPct:40, critPct:15 },
  { fixedId:'boiler_fw',    name:'Tank Aroma',        key:'s6',  active:true,  shape:'silinder',  orientasi:'vertikal',   tinggi:0.445,panjang:3.65, lebar:0.745,sensorZeroCm:0, warnPct:40, critPct:15 },
  { fixedId:'ground_tank_a',name:'Ground Tank A',     key:'s9',  active:true,  shape:'persegi',  orientasi:'vertikal',   tinggi:2,    panjang:12,   lebar:3,   sensorZeroCm:0,  warnPct:40, critPct:15 },
  { fixedId:'ground_tank_b',name:'Ground Tank B',     key:'s10', active:true,  shape:'persegi',  orientasi:'vertikal',   tinggi:1.2,  panjang:1,    lebar:1,   sensorZeroCm:0,  warnPct:40, critPct:15 },
  { fixedId:'edi_cadangan', name:'EDI Cadangan',     key:'s11', active:true,  shape:'silinder', orientasi:'vertikal',   tinggi:1,    diameter:1,               sensorZeroCm:0, warnPct:40, critPct:15 },
];

// Get unique IDs dan KEYS untuk menghindari duplikasi
const FIXED_IDS = [...new Set(FIXED_TANK_SLOTS.map(f => f.fixedId))];
const FIXED_KEYS = [...new Set(FIXED_TANK_SLOTS.map(f => f.key))];

// ── SENSOR DATA CACHE: Store last valid readings ─────────────────────────────
// Jika sensor tidak kirim data baru atau data=0, gunakan cache terakhir
const SENSOR_DATA_CACHE = {};

function getCachedSensorValue(sensorKey) {
  return SENSOR_DATA_CACHE[sensorKey] ?? null;
}

function setCachedSensorValue(sensorKey, rawCm) {
  if (rawCm !== null && rawCm !== undefined && Number.isFinite(Number(rawCm))) {
    SENSOR_DATA_CACHE[sensorKey] = Number(rawCm);
    console.log(`💾 Cached ${sensorKey}=${rawCm}cm`);
  }
}

function getSensorValueWithFallback(wl, sensorKey, fixedId) {
  // Coba cari value dari API terlebih dahulu
  let val = wl[sensorKey + '_cm'] ?? wl[sensorKey] ?? wl[fixedId + '_cm'] ?? wl[fixedId] ?? null;
  
  // Jika nilai valid (bukan null, bukan 0, bukan undefined)
  if (val !== null && val !== undefined && val !== '' && Number(val) > 0) {
    return { value: val, source: 'fresh' };
  }
  
  // Fallback ke cache terakhir
  const cached = getCachedSensorValue(sensorKey);
  if (cached !== null) {
    console.log(`♻️ Using cached ${sensorKey}=${cached}cm (no fresh data)`);
    return { value: cached, source: 'cache' };
  }
  
  // Jika tidak ada cache juga, return null
  return { value: null, source: 'none' };
}

// ── Cache untuk sensor settings (diisi dari API, fallback ke localStorage) ──
let _sensorSettingsCache = null;

function getSensors() {
  // Gunakan cache jika sudah ada
  if (_sensorSettingsCache && _sensorSettingsCache.length > 0) {
    const saved = _sensorSettingsCache;
    saved.forEach(s => { if (!s.shape) s.shape = 'persegi'; });

    // ── Gabungkan fixed slots dengan data tersimpan ─────────────
    // Cegah duplikasi: gunakan first occurrence saja
    const seenKeys = new Set();
    const fixedTanks = FIXED_TANK_SLOTS.map(def => {
      // Skip jika key sudah dilihat (cegah duplikasi)
      if (seenKeys.has(def.key)) {
        return null;
      }
      seenKeys.add(def.key);
      
      // Cari data tersimpan: cocokkan fixedId dulu, lalu key
      const found = saved.find(s => s.fixedId === def.fixedId || s.id === def.fixedId)
                  || saved.find(s => s.key === def.key && !FIXED_IDS.includes(s.id));
      
      // 🔧 CRITICAL FIX: Never override 'key' from FIXED_TANK_SLOTS with corrupted localStorage data
      // This prevents swapped sensor mappings like s6↔s8
      if (found) {
        // Start with defaults from FIXED_TANK_SLOTS
        const result = { ...def };
        
        // User-provided fields always override defaults (except key/fixedId/id which we control)
        const dimFields = ['tinggi','panjang','lebar','diameter','sensorZeroCm','shape','orientasi','name'];
        dimFields.forEach(f => {
          // If user explicitly set this field (not null/undefined/empty), use their value
          if (found[f] !== null && found[f] !== undefined && found[f] !== '') {
            result[f] = found[f];
          }
        });
        
        // Preserve system fields
        result.fixedId = def.fixedId;
        result.id = def.fixedId;
        result.key = def.key;
        
        return result;
      }
      return { ...def, fixedId: def.fixedId, id: def.fixedId };
    }).filter(t => t !== null);

    // ── Extra tanks: yang bukan fixed ──────────────────────────
    const extraTanks = saved.filter(s =>
      !FIXED_IDS.includes(s.fixedId) &&
      !FIXED_IDS.includes(s.id) &&
      !FIXED_KEYS.includes(s.key)
    );

    return [...fixedTanks, ...extraTanks];
  }

  // Fallback ke localStorage jika cache kosong
  const raw = localStorage.getItem('tank_sensors');
  const saved = raw ? JSON.parse(raw) : [];
  saved.forEach(s => { if (!s.shape) s.shape = 'persegi'; });

  // ── Gabungkan fixed slots dengan data tersimpan ─────────────
  const seenKeys = new Set();
  const fixedTanks = FIXED_TANK_SLOTS.map(def => {
    if (seenKeys.has(def.key)) {
      return null;
    }
    seenKeys.add(def.key);
    
    const found = saved.find(s => s.fixedId === def.fixedId || s.id === def.fixedId)
                || saved.find(s => s.key === def.key && !FIXED_IDS.includes(s.id));
    
    // 🔧 CRITICAL FIX: Never override 'key' from FIXED_TANK_SLOTS with corrupted localStorage data
    // This prevents swapped sensor mappings like s6↔s8
    if (found) {
      // Start with defaults from FIXED_TANK_SLOTS
      const result = { ...def };
      
      // User-provided fields always override defaults (except key/fixedId/id which we control)
      const dimFields = ['tinggi','panjang','lebar','diameter','sensorZeroCm','shape','orientasi','name'];
      dimFields.forEach(f => {
        // If user explicitly set this field (not null/undefined/empty), use their value
        if (found[f] !== null && found[f] !== undefined && found[f] !== '') {
          result[f] = found[f];
        }
      });
      
      // Preserve system fields
      result.fixedId = def.fixedId;
      result.id = def.fixedId;
      result.key = def.key;
      
      return result;
    }
    return { ...def, fixedId: def.fixedId, id: def.fixedId };
  }).filter(t => t !== null);

  // ── Extra tanks: yang bukan fixed ──────────────────────────
  const extraTanks = saved.filter(s =>
    !FIXED_IDS.includes(s.fixedId) &&
    !FIXED_IDS.includes(s.id) &&
    !FIXED_KEYS.includes(s.key)
  );

  return [...fixedTanks, ...extraTanks];
}

// 🔧 Auto-fix corrupted sensor settings in localStorage
// This handles cases where sensor keys were accidentally swapped
function autoFixCorruptedSensorSettings() {
  try {
    const raw = localStorage.getItem('tank_sensors');
    if (!raw) return false;
    
    const saved = JSON.parse(raw);
    let hasCorruption = false;
    
    // Check each FIXED_TANK_SLOT for key mismatches
    const fixed = saved.map(s => {
      const def = FIXED_TANK_SLOTS.find(f => f.fixedId === s.fixedId);
      if (def && def.key !== s.key) {
        console.warn(`🔧 Auto-fixing sensor key mismatch: ${s.fixedId} was ${s.key}, should be ${def.key}`);
        hasCorruption = true;
        return { ...s, key: def.key };
      }
      // Also fix diameter if it's wrong for slurry tanks
      if ((s.fixedId === 'slury_1' || s.fixedId === 'slury_2') && s.diameter && s.diameter !== 0.97) {
        console.warn(`🔧 Auto-fixing diameter for ${s.fixedId}: was ${s.diameter}, should be 0.97`);
        hasCorruption = true;
        return { ...s, diameter: 0.97, panjang: 0.97 };
      }
      return s;
    });
    
    if (hasCorruption) {
      console.log('💾 Saving corrected sensor settings...');
      localStorage.setItem('tank_sensors', JSON.stringify(fixed));
      _sensorSettingsCache = fixed;
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Error in autoFixCorruptedSensorSettings:', err.message);
  }
  return false;
}

// Simpan sensors ke API (primary) DAN localStorage (fallback)
async function saveSensorsFromDashboard(sensors) {
  // Update cache
  _sensorSettingsCache = sensors;
  // Update localStorage
  localStorage.setItem('tank_sensors', JSON.stringify(sensors));
  // Save to API (fire-and-forget)
  await saveSensorSettingsToAPI(sensors);
}

// POST sensor settings ke API — dipanggil setiap kali ada perubahan sensor
async function saveSensorSettingsToAPI(sensors) {
  try {
    const resp = await fetch('/api/iot/sensor-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensors: sensors })
    });
    const json = await resp.json();
    if (json.success) {
      console.log('✅ Sensor settings tersimpan ke database — semua akun akan melihat perubahan');
    } else {
      console.warn('⚠️ Gagal simpan sensor settings ke API:', json.message);
    }
  } catch (err) {
    console.warn('⚠️ Gagal POST sensor settings:', err.message);
  }
}

// Load sensor settings dari API dan sync ke cache + localStorage
async function loadSensorSettingsFromAPI() {
  try {
    const res = await fetch('/api/iot/sensor-settings');
    const json = await res.json();
    
    if (!json.success || !json.data) {
      console.log('📭 Belum ada sensor settings di API, gunakan localStorage');
      return false;
    }

    if (json.data.length === 0) {
      console.log('📭 Database kosong, akan gunakan default sensors');
      return false;
    }

    // Convert API format ke format frontend
    const apiSensors = json.data;
    const converted = apiSensors.map(s => ({
      id: s.fixed_id || s.id,
      fixedId: s.fixed_id,
      name: s.name,
      key: s.key,
      shape: s.shape || 'persegi',
      orientasi: s.orientasi || 'vertikal',
      tinggi: (s.tinggi !== null && s.tinggi !== undefined && s.tinggi !== '') ? parseFloat(s.tinggi) : null,
      panjang: (s.panjang !== null && s.panjang !== undefined && s.panjang !== '') ? parseFloat(s.panjang) : null,
      lebar: (s.lebar !== null && s.lebar !== undefined && s.lebar !== '') ? parseFloat(s.lebar) : null,
      diameter: (s.diameter !== null && s.diameter !== undefined && s.diameter !== '') ? parseFloat(s.diameter) : null,
      sensorZeroCm: (s.sensor_zero_cm !== null && s.sensor_zero_cm !== undefined && s.sensor_zero_cm !== '') ? parseFloat(s.sensor_zero_cm) : 0,
      warnPct: parseInt(s.warn_pct || 40),
      critPct: parseInt(s.crit_pct || 15),
      note: s.notes || '',
      loc: s.loc || '',
      active: s.is_active !== false,
      ...(s.settings_data ? (typeof s.settings_data === 'string' ? JSON.parse(s.settings_data) : s.settings_data) : {})
    }));

    // Update cache
    _sensorSettingsCache = converted;
    // Update localStorage dengan data dari API
    localStorage.setItem('tank_sensors', JSON.stringify(converted));
    console.log(`✅ ${converted.length} sensor settings disinkronisasi dari database untuk semua akun`);
    return true;
  } catch (err) {
    console.warn('⚠️ Gagal load sensor settings dari API:', err.message);
    return false;
  }
}

// Start periodic sync of sensor settings from API (setiap 30 detik)
// Ini memastikan perubahan dari device lain langsung terlihat
function startSensorSettingsSync() {
  // Guard: jangan jalankan sync kalau sudah ada yang jalan
  if (window._sensorSyncInterval) return;

  // Load awal saat pertama kali
  loadSensorSettingsFromAPI();
  
  // Periodic check setiap 30 detik — simpan ID agar bisa di-clear
  window._sensorSyncInterval = setInterval(() => {
    loadSensorSettingsFromAPI();
  }, 30000);
  
  // Juga sync saat page mendapat fokus kembali
  if (!window._sensorSyncVisibility) {
    window._sensorSyncVisibility = true;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('🔄 Dashboard kembali aktif, sinkronisasi sensor settings dari database...');
        loadSensorSettingsFromAPI();
      }
    });
  }
}


// ── Volume calculation based on shape ──────────────────────
// Returns volume in LITERS given sensor config and sensor distance reading (cm).
// rawCm = jarak sensor ke air (HC-SR04 di atas).
// Returns actual water volume in liters given rawCm reading from sensor
// Uses sensorZeroCm as the zero-offset (jarak sensor saat penuh = 100%)
function calcVolumeLiter(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const shape      = sensor.shape    || 'persegi';
  const orientasi  = sensor.orientasi || 'vertikal';
  const h = rawCmToWaterHeight(sensor, rawCm);

  if (shape === 'silinder') {
    if (orientasi === 'horizontal') {
      const r = tinggiTankiCm / 2;
      const L = +(sensor.panjang || 1) * 100;
      return Math.max(0, segmenVolume(h, r, L) / 1000);
    } else {
      // Silinder vertikal: gunakan panjang sebagai diameter (atau diameter jika ada)
      const diameterCm = (+(sensor.diameter || sensor.panjang || 1)) * 100;
      const r = diameterCm / 2;
      return (Math.PI * r * r * h) / 1000;
    }
  } else {
    const p = +(sensor.panjang || 1);
    const l = +(sensor.lebar   || 1);
    return p * l * (h / 100) * 1000;
  }
}

// Total volume (capacity at 100%) in liters — based on FULL physical tank height
function calcMaxVolumeLiter(sensor) {
  const shape     = sensor.shape     || 'persegi';
  const orientasi = sensor.orientasi || 'vertikal';
  const tinggiCm  = +(sensor.tinggi  || 1) * 100;

  if (shape === 'silinder') {
    if (orientasi === 'horizontal') {
      // Silinder rebah penuh = setengah lingkaran × 2 = lingkaran penuh × panjang
      const r = tinggiCm / 2;
      const L = +(sensor.panjang || 1) * 100;
      return (Math.PI * r * r * L) / 1000;
    } else {
      // Silinder vertikal: gunakan panjang sebagai diameter (atau diameter jika ada)
      const diameterCm = (+(sensor.diameter || sensor.panjang || 1)) * 100;
      const r = diameterCm / 2;
      return (Math.PI * r * r * tinggiCm) / 1000;
    }
  } else {
    // Persegi: kapasitas = p × l × tinggi (sama vertikal/horizontal)
    return +(sensor.panjang||1) * +(sensor.lebar||1) * (tinggiCm / 100) * 1000;
  }
}

// ═══════════════════════════════════════════════════════════════
// KONVERSI SENSOR → PERSENTASE
// ═══════════════════════════════════════════════════════════════
// HC-SR04 dipasang di ATAS tangki, mengukur jarak ke permukaan air.
//   rawCm        = jarak sensor ke permukaan air
//   sensorZeroCm = jarak sensor ke air saat tangki PENUH (offset fisik sensor)
//   tinggiTankiCm= total dimensi vertikal tangki (= diameter untuk silinder horizontal)
//
// h = tinggi air dari DASAR tangki (cm)
//   = sensorZeroCm + tinggiTankiCm - rawCm
//   → saat penuh: rawCm = sensorZeroCm  → h = tinggiTankiCm  ✓
//   → saat kosong: rawCm = sensorZeroCm + tinggiTankiCm → h = 0 ✓
//
// TANGKI VERTIKAL (persegi/silinder):
//   pct = h / tinggiTankiCm × 100  ← LINEAR, akurat
//
// TANGKI HORIZONTAL PERSEGI:
//   pct = h / tinggiTankiCm × 100  ← LINEAR, akurat
//   (tinggiTankiCm = dimensi vertikal = yang diukur sensor)
//
// TANGKI HORIZONTAL SILINDER ← NON-LINEAR!
//   h = tinggi air di cross-section lingkaran (0 → diameter)
//   Volume segmen lingkaran = L × r² × [arccos((r-h)/r) - ((r-h)/r)×√(2rh-h²)]
//   pct_volume = V(h) / V_max × 100
//   → 25% h ≈ 9.3% volume,  50% h = 50% volume,  75% h ≈ 90.7% volume

// Hitung tinggi air (h) dari dasar tangki berdasarkan rawCm sensor
function rawCmToWaterHeight(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const sensorZeroCm  = +(sensor.sensorZeroCm ?? 0);
  return Math.max(0, Math.min(sensorZeroCm + tinggiTankiCm - rawCm, tinggiTankiCm));
}

// Volume segmen lingkaran (cm³) — untuk silinder horizontal
// h = tinggi air dari dasar (0 ≤ h ≤ diameter=2r), r = jari-jari, L = panjang sumbu
function segmenVolume(h, r, L) {
  if (r <= 0 || L <= 0) return 0;
  if (h <= 0) return 0;
  if (h >= 2 * r) return Math.PI * r * r * L; // penuh = lingkaran penuh
  const hc  = Math.max(1e-9, Math.min(h, 2 * r - 1e-9));
  const cos = (r - hc) / r;                    // nilai ∈ (-1, 1)
  const sin = Math.sqrt(Math.max(0, 2 * r * hc - hc * hc));
  return L * r * r * (Math.acos(cos) - cos * sin / r);
}

// Konversi rawCm → { pct, hLinear, pctLinear }
//   pct       = persentase VOLUME yang benar (untuk ditampilkan & fill visual)
//   hLinear   = tinggi air linear dari dasar (cm) — untuk info tambahan
//   pctLinear = persentase tinggi linear (bukan volume) — untuk info tambahan
function cmToPct(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const shape         = sensor.shape     || 'persegi';
  const orientasi     = sensor.orientasi || 'vertikal';

  const h = rawCmToWaterHeight(sensor, rawCm);
  if (tinggiTankiCm <= 0) return 0;

  if (shape === 'silinder' && orientasi === 'horizontal') {
    // NON-LINEAR: hitung % berdasarkan volume aktual
    const r      = tinggiTankiCm / 2; // jari-jari = diameter/2
    const L      = +(sensor.panjang || 1) * 100;
    const vol    = segmenVolume(h, r, L);
    const maxVol = segmenVolume(2 * r, r, L); // volume penuh = lingkaran penuh × L
    if (maxVol <= 0) return 0;
    return Math.round(Math.max(0, Math.min(100, (vol / maxVol) * 100)));
  }

  // Vertikal & persegi horizontal: LINEAR
  return Math.round(Math.max(0, Math.min(100, (h / tinggiTankiCm) * 100)));
}

// Versi lengkap — kembalikan semua info (untuk applyWL)
function cmToInfo(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const shape         = sensor.shape     || 'persegi';
  const orientasi     = sensor.orientasi || 'vertikal';
  const h             = rawCmToWaterHeight(sensor, rawCm);

  const pctLinear = Math.round(Math.max(0, Math.min(100, (h / tinggiTankiCm) * 100)));

  if (shape === 'silinder' && orientasi === 'horizontal') {
    const r      = tinggiTankiCm / 2;
    const L      = +(sensor.panjang || 1) * 100;
    const vol    = segmenVolume(h, r, L);
    const maxVol = Math.PI * r * r * L; // volume silinder penuh = π r² L
    const pctVol = maxVol > 0
      ? Math.round(Math.max(0, Math.min(100, (vol / maxVol) * 100)))
      : 0;
    // debug: console.log(`[WL] ${sensor.name}: rawCm=${rawCm}, pctVol=${pctVol}%, pctLinear=${pctLinear}%`);
    return { pct: pctVol, pctLinear, h, isNonLinear: true };
  }

  return { pct: pctLinear, pctLinear, h, isNonLinear: false };
}

// Konversi % VOLUME → % TINGGI LINEAR (untuk posisi garis warn/crit di visual tangki silinder horizontal)
// pctVol 0-100, tinggiTankiCm = diameter tangki
// Gunakan binary search karena fungsi segmenVolume tidak invertible secara analitik
function pctVolToLinear(pctVol, tinggiTankiCm) {
  if (pctVol <= 0) return 0;
  if (pctVol >= 100) return 100;
  const r = tinggiTankiCm / 2;
  const maxVol = segmenVolume(2 * r, r, 1); // L=1 karena kita cari rasio
  const targetVol = (pctVol / 100) * maxVol;
  // Binary search h ∈ [0, 2r]
  let lo = 0, hi = 2 * r;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (segmenVolume(mid, r, 1) < targetVol) lo = mid; else hi = mid;
  }
  return Math.round(((lo + hi) / 2) / tinggiTankiCm * 100);
}

// ── Warna tangki berdasarkan % isi ───────────────────────────────────────────
// ── Warna tangki air biasa: merah ≤40%, kuning 41-60%, hijau >60% ─────────────
function getTankColorByPct(pct) {
 if (pct <= 40)  return { 
  border:'#7f1d1d', 
  water:'linear-gradient(180deg,#dc2626,#7f1d1d)', 
  bg:'#fff1f2', 
  label:'#7f1d1d'
};
  if (pct <= 60) return { 
    border:'#ca8a04', 
    water:'linear-gradient(180deg,#fde047,#eab308)', 
    bg:'#fefce8', 
    label:'#ca8a04' 
};
  return { 
    border:'#18a96a', 
    water:'linear-gradient(180deg,#6ee7b7,#059669)', 
    bg:'#f0fdf4', 
    label:'#18a96a' 
  };
}

// ── Warna tangki SOLAR: coklat 0 - 100% ────────────────
function getTankColorSolar(pct) {
  return { 
    border:'#78350f', 
    water:'linear-gradient(180deg,#b45309,#78350f)', 
    bg:'#694c1a86', 
    label:'#78350f' 
  };
}

// ── Helper: buat HTML 1 kartu tangki ─────────────────────────────────────────
function _makeTankCardHTML(s, i) {
  // Sensor nonaktif (active:false) — tampilkan kartu abu-abu dengan —%
  if (s.active === false) {
    const shape     = s.shape     || 'persegi';
    const orientasi = s.orientasi || 'vertikal';
    const isHoriz   = orientasi === 'horizontal';
    const tinggiM   = +(s.tinggi || 1);
    const panjangM  = +(s.panjang || 1);
    
    // Buat visual tangki abu-abu (kosong)
    let inactiveTankHTML;
    if (isHoriz) {
      // Horizontal: width mengikuti panjang, height dari tinggi
      const tankW = Math.min(Math.max(50, panjangM * 30), 140);
      const tankH = Math.min(Math.max(30, tinggiM * 40), 60);
      const capR  = shape === 'silinder' ? tankH / 2 : 5;
      inactiveTankHTML = `<div style="position:relative;width:${tankW}px;height:${tankH}px;border-radius:${capR}px;border:2px solid #cbd5e1;overflow:hidden;background:#f8fafc;flex-shrink:0"></div>`;
    } else {
      // Vertical: height dari tinggi
      const isTall = tinggiM >= 1.5;
      let tankW = 28, tankH = Math.min(Math.max(40, tinggiM * 50), 80), borderRadius = '4px 4px 6px 6px', topSvg = '';
      if (shape === 'silinder') {
        tankW = isTall ? 34 : 30; 
        tankH = Math.min(Math.max(50, tinggiM * 60), 90); 
        borderRadius = '0 0 50% 50% / 0 0 10px 10px';
        topSvg = `<svg width="${tankW}" height="9" viewBox="0 0 ${tankW} 9" style="display:block;margin-bottom:-2px"><ellipse cx="${tankW/2}" cy="4.5" rx="${tankW/2-1}" ry="3.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/></svg>`;
      }
      inactiveTankHTML = `<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">${topSvg}<div style="width:${tankW}px;height:${tankH}px;border:1.5px solid #cbd5e1;border-radius:${borderRadius};background:#f8fafc"></div></div>`;
    }
    return `
    <div class="tank-card-cell" style="border-top:3px solid #cbd5e1;opacity:0.5">
      ${s.fixedId?`<div style="position:absolute;top:4px;right:6px;font-size:7px;color:#94a3b8;opacity:.5" title="Belum aktif">📌</div>`:''}
      <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:.8px;text-align:center;width:100%;margin-bottom:4px">${s.name.toUpperCase()}</div>
      <div style="font-size:7px;color:#94a3b8;text-align:center;width:100%;margin-bottom:6px">${shape==='silinder'?'⬤ Silinder':'▬ Persegi'} ${isHoriz?'↔ Horiz':'↕ Vertikal'}</div>
      <div style="display:flex;align-items:center;gap:8px;width:100%;justify-content:center">
        ${inactiveTankHTML}
        <div style="display:flex;flex-direction:column;align-items:flex-start">
          <div style="font-family:'DM Mono',monospace;font-size:34px;font-weight:800;color:#94a3b8;line-height:1">—%</div>
          <div style="font-size:8px;color:#94a3b8;margin-top:4px">Sensor belum aktif</div>
        </div>
      </div>
    </div>`;
  }

  const col       = { border:'#999', water:'#ccc', label:'#777', bg:'#f0f0f0' };
  const shape     = s.shape     || 'persegi';
  const orientasi = s.orientasi || 'vertikal';
  const maxVol    = Math.round(calcMaxVolumeLiter(s));
  const tinggiM   = +(s.tinggi || 1);
  const panjangM  = +(s.panjang || 1);
  const warnPct   = +(s.warnPct ?? 40);
  const critPct   = +(s.critPct ?? 15);
  const sensorZeroCm = +(s.sensorZeroCm ?? 0);
  const isHoriz   = orientasi === 'horizontal';
  const tinggiTankiCm = tinggiM * 100;
  const warnLineH = (isHoriz && shape === 'silinder') ? pctVolToLinear(warnPct, tinggiTankiCm) : warnPct;
  const critLineH = (isHoriz && shape === 'silinder') ? pctVolToLinear(critPct, tinggiTankiCm) : critPct;

  let tankVisualHTML;
  if (isHoriz) {
    // Dynamic sizing: width dari panjang, height dari tinggi
    const tankW = Math.min(Math.max(60, panjangM * 35), 160);
    const tankH = Math.min(Math.max(35, tinggiM * 45), 70);
    const capR  = shape === 'silinder' ? tankH / 2 : 5;
    tankVisualHTML = `
      <div id="tank-body-${s.id}" style="position:relative;width:${tankW}px;height:${tankH}px;border-radius:${capR}px;border:2px solid ${col.border};overflow:hidden;background:${col.bg};flex-shrink:0;box-shadow:inset 0 1px 4px rgba(0,0,0,.06)">
        <div id="tank-water-${s.id}" style="position:absolute;bottom:0;left:0;right:0;background:${col.water};height:0%;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)">
          <div style="position:absolute;top:-4px;left:0;right:0;height:7px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);animation:wsurf 3s ease-in-out infinite;border-radius:50%"></div>
          <div class="bbl" style="width:3px;height:3px;left:30%;animation-duration:${2.5+i*.3}s"></div>
          <div class="bbl" style="width:2px;height:2px;left:65%;animation-duration:${3+i*.2}s;animation-delay:.5s"></div>
        </div>
        <div style="position:absolute;left:0;right:0;bottom:${warnLineH}%;height:1.5px;background:#eab308;opacity:.85;pointer-events:none"></div>
        <div style="position:absolute;left:0;right:0;bottom:${critLineH}%;height:1.5px;background:#ef4444;opacity:.85;pointer-events:none"></div>
        ${shape==='silinder'?`<div style="position:absolute;top:5px;left:12%;right:12%;height:4px;border-radius:50%;background:rgba(255,255,255,.3);pointer-events:none"></div>`:''}
      </div>`;
  } else {
    // Vertical: height dari tinggi, width tetap/fixed
    const isTall = tinggiM >= 1.5;
    let tankW = 28, tankH = Math.min(Math.max(40, tinggiM * 50), 90), borderRadius = '4px 4px 6px 6px', topSvg = '';
    if (shape === 'silinder') {
      tankW = isTall ? 34 : 30; 
      tankH = Math.min(Math.max(50, tinggiM * 60), 100); 
      borderRadius = '0 0 50% 50% / 0 0 10px 10px';
      topSvg = `<svg width="${tankW}" height="9" viewBox="0 0 ${tankW} 9" style="display:block;margin-bottom:-2px"><ellipse cx="${tankW/2}" cy="4.5" rx="${tankW/2-1}" ry="3.5" fill="${col.bg}" stroke="${col.border}" stroke-width="1.5"/></svg>`;
    }
    tankVisualHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
        ${topSvg}
        <div id="tank-body-${s.id}" style="width:${tankW}px;height:${tankH}px;border:1.5px solid ${col.border};border-radius:${borderRadius};position:relative;overflow:hidden;background:${col.bg}">
          <div id="tank-water-${s.id}" style="position:absolute;bottom:0;left:0;right:0;background:${col.water};height:0%;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)">
            <div style="position:absolute;top:-3px;left:0;right:0;height:6px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);animation:wsurf 3s ease-in-out infinite;border-radius:50%"></div>
            <div class="bbl" style="width:3px;height:3px;left:25%;animation-duration:${2.5+i*.3}s"></div>
            <div class="bbl" style="width:2px;height:2px;left:65%;animation-duration:${3+i*.2}s;animation-delay:.8s"></div>
          </div>
          ${shape==='silinder'?`<div style="position:absolute;bottom:0;left:0;right:0;height:6px;border-radius:0 0 50% 50%;background:${col.border};opacity:.15;pointer-events:none"></div>`:''}
          <div style="position:absolute;left:0;right:0;bottom:${warnPct}%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:${critPct}%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
          ${sensorZeroCm>0?`<div style="position:absolute;left:0;right:0;top:0;height:1.5px;background:#3b82f6;opacity:.4;pointer-events:none"></div>`:''}
        </div>
        <!-- PERSENTASE BESAR HITAM DIBAWAH TANGKI -->
        <div id="tank-pct-${s.id}" style="margin-top:8px;font-family:'DM Mono',monospace;font-size:42px;font-weight:900;color:#000;line-height:1;text-shadow:0 2px 4px rgba(0,0,0,.15);letter-spacing:-1px">—%</div>
        <div id="tank-vol-${s.id}" style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--txt3);margin-top:4px;white-space:nowrap">— / ${maxVol.toLocaleString('id-ID')} L</div>
        <div id="tank-cm-${s.id}" style="font-size:8px;color:var(--txt3);margin-top:2px">— cm</div>
      </div>`;
  }
  return `
    <div id="tank-card-${s.id}" class="tank-card-cell" style="border-top:3px solid ${col.border};align-items:flex-start;position:relative">
      ${s.fixedId?`<div style="position:absolute;top:4px;right:6px;font-size:7px;color:var(--txt3);opacity:.35" title="Posisi tetap">📌</div>`:''}
      <div style="font-size:9px;font-weight:700;color:${col.label};letter-spacing:.8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;margin-bottom:4px">${s.name.toUpperCase()}</div>
      <div style="font-size:7px;color:var(--txt3);text-align:center;width:100%;margin-bottom:6px">${shape==='silinder'?'⬀ Silinder':'▬ Persegi'} ${isHoriz?'↔ Horiz':'↕ Vertikal'}</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;justify-content:center">
        ${tankVisualHTML}
      </div>
    </div>`;
}

function _makeWFMiniCard() {
  return `
    <div class="tank-card-cell" style="border-top:3px solid #18a96a;align-items:center;justify-content:center;text-align:center">
      <div style="font-size:9px;font-weight:700;color:#18a96a;letter-spacing:.8px;margin-bottom:6px">WATER FLOW</div>
      <div style="display:flex;align-items:flex-end;justify-content:center;gap:4px;margin-bottom:3px">
        <div id="wf-mini-val" style="font-family:'DM Mono',monospace;font-size:34px;font-weight:800;color:#18a96a;line-height:1">—</div>
        <div style="font-size:10px;color:var(--txt3);padding-bottom:6px">L/min</div>
      </div>
      <div id="wf-mini-rpm" style="font-size:8px;color:var(--txt3);margin-bottom:8px">—</div>
      <svg id="fan-svg-mini" width="36" height="36" viewBox="0 0 40 40">
        <g transform="translate(20,20)">
          <ellipse rx="3" ry="7" transform="rotate(0)"   fill="#18a96a" opacity=".9"/>
          <ellipse rx="3" ry="7" transform="rotate(60)"  fill="#18a96a" opacity=".6"/>
          <ellipse rx="3" ry="7" transform="rotate(120)" fill="#18a96a" opacity=".4"/>
          <ellipse rx="3" ry="7" transform="rotate(180)" fill="#18a96a" opacity=".9"/>
          <ellipse rx="3" ry="7" transform="rotate(240)" fill="#18a96a" opacity=".6"/>
          <ellipse rx="3" ry="7" transform="rotate(300)" fill="#18a96a" opacity=".4"/>
          <circle r="4" fill="white" stroke="#18a96a" stroke-width="1.5"/>
          <circle r="1.5" fill="#18a96a"/>
        </g>
      </svg>
      <div id="wf-mini-status" class="s-pill st-wait" style="font-size:8px;padding:1px 8px;margin-top:6px">—</div>
    </div>`;
}
// Alias — pipe visualization di posisi Water Flow (Row 2 tengah)
function _makeWFPipeCard() {
  return `
    <div class="tank-card-cell" style="border-top:3px solid #18a96a;align-items:stretch;padding:10px 10px 8px;">
      <div style="font-size:9px;font-weight:700;color:#18a96a;letter-spacing:.8px;margin-bottom:6px;text-align:center">WATER FLOW</div>
      <div style="display:flex;align-items:flex-end;justify-content:center;gap:3px;margin-bottom:2px">
        <div id="wf-mini-val" style="font-family:'DM Mono',monospace;font-size:26px;font-weight:800;color:#18a96a;line-height:1">—</div>
        <div style="font-size:9px;color:var(--txt3);padding-bottom:3px">L/min</div>
      </div>
      <div id="wf-mini-rpm" style="font-size:8px;color:var(--txt3);text-align:center;margin-bottom:8px">—</div>
      <div style="position:relative;height:30px;margin:0 6px 8px;">
        <div style="position:absolute;top:50%;left:0;right:0;height:14px;transform:translateY(-50%);background:var(--bg);border:1.5px solid var(--border2);border-radius:7px;overflow:hidden;">
          <div style="position:absolute;top:0;bottom:0;width:40px;background:linear-gradient(90deg,transparent,#18a96a88,#18a96a,#18a96a88,transparent);border-radius:7px;animation:wfFlow 1.2s linear infinite;"></div>
        </div>
        <div style="position:absolute;left:-3px;top:50%;transform:translateY(-50%);width:8px;height:20px;background:var(--border2);border-radius:4px 0 0 4px;"></div>
        <div style="position:absolute;right:-3px;top:50%;transform:translateY(-50%);width:8px;height:20px;background:var(--border2);border-radius:0 4px 4px 0;"></div>
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;background:var(--surface);border:1.5px solid #18a96a;display:grid;place-items:center;z-index:2;">
          <svg id="fan-svg-mini" width="20" height="20" viewBox="0 0 40 40">
            <g transform="translate(20,20)">
              <ellipse rx="3" ry="7" transform="rotate(0)"   fill="#18a96a" opacity=".9"/>
              <ellipse rx="3" ry="7" transform="rotate(60)"  fill="#18a96a" opacity=".6"/>
              <ellipse rx="3" ry="7" transform="rotate(120)" fill="#18a96a" opacity=".4"/>
              <ellipse rx="3" ry="7" transform="rotate(180)" fill="#18a96a" opacity=".9"/>
              <ellipse rx="3" ry="7" transform="rotate(240)" fill="#18a96a" opacity=".6"/>
              <ellipse rx="3" ry="7" transform="rotate(300)" fill="#18a96a" opacity=".4"/>
              <circle r="4" fill="white" stroke="#18a96a" stroke-width="1.5"/>
              <circle r="1.5" fill="#18a96a"/>
            </g>
          </svg>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 2px">
        <div style="text-align:center">
          <div style="font-size:7px;color:var(--txt3);font-weight:600;letter-spacing:.5px">SPEED</div>
          <div id="wf-mini-rpm2" style="font-family:'DM Mono',monospace;font-size:10px;color:#18a96a;font-weight:600">— rpm</div>
        </div>
        <div id="wf-mini-status" class="s-pill st-wait" style="font-size:7px;padding:1px 7px;">—</div>
        <div style="text-align:center">
          <div style="font-size:7px;color:var(--txt3);font-weight:600;letter-spacing:.5px">VOL</div>
          <div id="wf-mini-vol" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--txt2);font-weight:600">— mL</div>
        </div>
      </div>
    </div>`;
}

// Ground Tank A — menampilkan info level tangki + visualisasi water flow (menggantikan WF mini card)
function _makeGroundTankAWithFlowHTML(s, i) {
  if (!s) {
    return `<div class="tank-card-cell" style="border-top:3px solid var(--border)"></div>`;
  }
  const col        = { border:'#999', water:'#ccc', label:'#777', bg:'#f0f0f0' };
  const shape      = s.shape     || 'persegi';
  const orientasi  = s.orientasi || 'vertikal';
  const maxVol     = Math.round(calcMaxVolumeLiter(s));
  const tinggiM    = +(s.tinggi || 1);
  const warnPct    = +(s.warnPct ?? 40);
  const critPct    = +(s.critPct ?? 15);
  const isHoriz    = orientasi === 'horizontal';
  const tinggiTankiCm = tinggiM * 100;
  const warnLineH  = (isHoriz && shape === 'silinder') ? pctVolToLinear(warnPct, tinggiTankiCm) : warnPct;
  const critLineH  = (isHoriz && shape === 'silinder') ? pctVolToLinear(critPct, tinggiTankiCm) : critPct;

  // Tank visual (vertikal persegi default untuk Ground Tank A)
  const isTall = tinggiM >= 1.5;
  const isWide = shape !== 'silinder' && ((+(s.panjang||1)) >= 2 || (+(s.lebar||1)) >= 2);
  let tankW = isWide ? 32 : 26, tankH = isTall ? 52 : 42;
  let borderRadius = '4px 4px 6px 6px', topSvg = '';
  if (shape === 'silinder') {
    tankW = isTall ? 30 : 26; tankH = isTall ? 62 : 48; borderRadius = '0 0 50% 50% / 0 0 10px 10px';
    topSvg = `<svg width="${tankW}" height="9" viewBox="0 0 ${tankW} 9" style="display:block;margin-bottom:-2px"><ellipse cx="${tankW/2}" cy="4.5" rx="${tankW/2-1}" ry="3.5" fill="${col.bg}" stroke="${col.border}" stroke-width="1.5"/></svg>`;
  }
  const tankVisualHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
      ${topSvg}
      <div id="tank-body-${s.id}" style="width:${tankW}px;height:${tankH}px;border:1.5px solid ${col.border};border-radius:${borderRadius};position:relative;overflow:hidden;background:${col.bg}">
        <div id="tank-water-${s.id}" style="position:absolute;bottom:0;left:0;right:0;background:${col.water};height:0%;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)">
          <div style="position:absolute;top:-3px;left:0;right:0;height:6px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);animation:wsurf 3s ease-in-out infinite;border-radius:50%"></div>
          <div class="bbl" style="width:3px;height:3px;left:25%;animation-duration:${2.5+i*.3}s"></div>
          <div class="bbl" style="width:2px;height:2px;left:65%;animation-duration:${3+i*.2}s;animation-delay:.8s"></div>
        </div>
        <div style="position:absolute;left:0;right:0;bottom:${warnPct}%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
        <div style="position:absolute;left:0;right:0;bottom:${critPct}%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
      </div>
    </div>`;

  return `
    <div id="tank-card-${s.id}" class="tank-card-cell" style="border-top:3px solid #18a96a;position:relative">
      <div style="position:absolute;top:4px;right:6px;font-size:7px;color:var(--txt3);opacity:.35" title="Posisi tetap">📌</div>

      <!-- Header: nama tangki -->
      <div style="font-size:9px;font-weight:700;color:${col.label};letter-spacing:.8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;margin-bottom:2px">${s.name.toUpperCase()}</div>
      <div style="font-size:7px;color:var(--txt3);text-align:center;width:100%;margin-bottom:6px">${shape==='silinder'?'⬤ Silinder':'▬ Persegi'} ${isHoriz?'↔ Horiz':'↕ Vertikal'}</div>

      <!-- Level tangki -->
      <div style="display:flex;align-items:center;gap:6px;width:100%;justify-content:center;margin-bottom:8px">
        ${tankVisualHTML}
        <div style="display:flex;flex-direction:column;align-items:flex-start;min-width:0">
          <div id="tank-pct-mini-${s.id}" style="font-family:'DM Mono',monospace;font-size:26px;font-weight:800;color:${col.label};line-height:1">—%</div>
          <div id="tank-vol-mini-${s.id}" style="font-family:'DM Mono',monospace;font-size:9px;font-weight:700;color:${col.label};margin-top:3px;white-space:nowrap">— of ${maxVol.toLocaleString('id-ID')} L</div>
          <div id="tank-cm-mini-${s.id}" style="font-size:8px;color:var(--txt3);margin-top:2px">— cm</div>
          <div id="tank-offline-mini-${s.id}" style="margin-top:5px;display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
            <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;margin-top:12px">
        <!-- PERSENTASE BESAR HITAM DIBAWAH TANGKI -->
        <div style="display:flex;flex-direction:column;align-items:center;width:100%">
          <div id="tank-pct-${s.id}" style="font-family:'DM Mono',monospace;font-size:42px;font-weight:900;color:#000;line-height:1;text-shadow:0 2px 4px rgba(0,0,0,.15);letter-spacing:-1px">—%</div>
          <div id="tank-vol-${s.id}" style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--txt3);margin-top:4px;white-space:nowrap">— / ${maxVol.toLocaleString('id-ID')} L</div>
          <div id="tank-cm-${s.id}" style="font-size:8px;color:var(--txt3);margin-top:2px">— cm</div>
        </div>
        <div id="tank-offline-${s.id}" style="display:none;align-items:center;gap:3px;padding:3px 8px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
      </div>
      <div style="width:100%;border-top:1px dashed rgba(24,169,106,.3);margin-bottom:6px"></div>

      <!-- Water Flow visualisasi (menggantikan WF mini card) -->
      <div style="font-size:8px;font-weight:700;color:#18a96a;letter-spacing:.8px;text-align:center;margin-bottom:4px">WATER FLOW</div>
      <!-- Pipe -->
      <div class="pipe-row" style="width:100%;justify-content:center;margin-bottom:4px">
        <div class="pipe-cap l"></div>
        <div class="pipe-seg" style="flex:1"><div id="pfl-gt"></div></div>
        <div class="fan-hub">
          <svg id="fan-svg-mini" class="fan-svg" width="32" height="32" viewBox="0 0 40 40">
            <g transform="translate(20,20)">
              <ellipse rx="3" ry="7" transform="rotate(0)"   fill="#18a96a" opacity=".9"/>
              <ellipse rx="3" ry="7" transform="rotate(60)"  fill="#18a96a" opacity=".6"/>
              <ellipse rx="3" ry="7" transform="rotate(120)" fill="#18a96a" opacity=".4"/>
              <ellipse rx="3" ry="7" transform="rotate(180)" fill="#18a96a" opacity=".9"/>
              <ellipse rx="3" ry="7" transform="rotate(240)" fill="#18a96a" opacity=".6"/>
              <ellipse rx="3" ry="7" transform="rotate(300)" fill="#18a96a" opacity=".4"/>
              <circle r="4" fill="white" stroke="#18a96a" stroke-width="1.5"/>
              <circle r="1.5" fill="#18a96a"/>
            </g>
          </svg>
        </div>
        <div class="pipe-seg" style="flex:1"><div id="pfr-gt"></div></div>
        <div class="pipe-cap r"></div>
      </div>
      <!-- Flow value -->
      <div style="display:flex;align-items:baseline;justify-content:center;gap:3px">
        <div id="wf-mini-val" style="font-family:'DM Mono',monospace;font-size:22px;font-weight:800;color:#18a96a;line-height:1">—</div>
        <div style="font-size:9px;color:var(--txt3)">L/min</div>
      </div>
      <div id="wf-mini-rpm" style="font-size:8px;color:var(--txt3);text-align:center;margin-top:1px">—</div>
      <div id="wf-mini-status" class="s-pill st-wait" style="font-size:8px;padding:1px 8px;margin-top:4px">—</div>
    </div>`;
}

function renderTankCards() {
  const container = document.getElementById('wl-tanks-container');
  if (!container) return;

  if (!document.getElementById('_tank_css')) {
    const st = document.createElement('style'); st.id = '_tank_css';
    st.innerHTML = '.tank-card-cell{display:flex;flex-direction:column;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--border);position:relative;}';
    document.head.appendChild(st);
  }

  const sensors    = getSensors();
  const fixed10    = sensors.slice(0, 10);  // s1-s10
  const extraTanks = sensors.slice(10);

  const G = idx => fixed10[idx]
    ? _makeTankCardHTML(fixed10[idx], idx)
    : `<div class="tank-card-cell" style="border-top:3px solid var(--border)"></div>`;

  // Layout 10 sensor:
  //   Row 1: Air Proses  | Feed Slurry | Chiller In    (s1-s3)
  //   Row 2: Chiller Out | Water Flow  | Tangki Solar  (s4, WF, s5)
  //   Row 3: Slurry 1    | Slurry 2   | EDI            (s6-s8)
  //   Row 4: Ground A    | Ground B   | kosong          (s9-s10)
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
      ${G(0)}${G(1)}${G(2)}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
      ${G(3)}${_makeWFPipeCard()}${G(4)}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
      ${G(5)}${G(6)}${G(7)}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px${extraTanks.length?';margin-bottom:8px':''}">
      ${G(8)}${G(9)}<div></div>
    </div>
    ${extraTanks.length ? `
    <div style="border-top:1px dashed var(--border);padding-top:10px;margin-top:8px">
      <div style="font-size:8px;color:var(--txt3);letter-spacing:1.2px;font-weight:700;margin-bottom:6px">▼ TANGKI TAMBAHAN</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${extraTanks.map((s,i)=>_makeTankCardHTML(s,10+i)).join('')}
      </div>
    </div>` : ''}
  `;
}

function applyWL(wl) {
  if (!wl) return;
  window._lastWLData = wl;
  set('wl-time', fmtT(wl.created_at));
  // DEBUG: log semua keys yang masuk dari API
  console.log('[applyWL] water_level keys:', Object.keys(wl));
  const sensors = getSensors();
  console.log(`🔄 applyWL: Processing ${sensors.length} sensors:`, sensors.map(s => ({id: s.id, fixedId: s.fixedId, key: s.key, active: s.active})));
  let grandTotal = 0;
  let sumPct = 0;
  const volRows = document.getElementById('wl-vol-rows');
  const volRowsHTML = [];

  sensors.forEach((s, i) => {
    // Skip sensor nonaktif — kartu sudah tampil abu-abu dari _makeTankCardHTML
    if (s.active === false) return;

    // Gunakan fallback cache jika data tidak tersedia atau 0
    const dataResult = getSensorValueWithFallback(wl, s.key, s.fixedId);
    // Cache hanya dari fresh data
    if (dataResult.source === 'fresh') setCachedSensorValue(s.key, dataResult.value);
    // Cache/none = offline → tampilkan —%
    let rawCm = (dataResult.source === 'fresh') ? dataResult.value : null;

    console.log(`[applyWL] sensor ${s.name} (key=${s.key}, fixedId=${s.fixedId}): rawCm=${rawCm} [${dataResult.source}]`);
    if (rawCm === null) {
      // Sensor belum kirim data — tampilkan badge OFFLINE, set kartu ke style grey
      const offEl = document.getElementById('tank-offline-' + s.id);
      if (offEl) offEl.style.display = 'inline-flex';
      const offCard = document.getElementById('tank-card-' + s.id);
      if (offCard) {
        offCard.style.borderTopColor = '#cbd5e1';
        offCard.style.opacity = '0.65';
      }
      // Reset nilai ke — agar tidak tampil 0
      const pctEl = document.getElementById('tank-pct-' + s.id);
      if (pctEl) pctEl.textContent = '—%';
      const cmEl = document.getElementById('tank-cm-' + s.id);
      if (cmEl) cmEl.textContent = '— cm';
      return;
    }
    // Ada data — sembunyikan badge offline
    const offEl = document.getElementById('tank-offline-' + s.id);
    if (offEl) offEl.style.display = 'none';
    rawCm = Math.max(0, parseFloat(rawCm));
    console.log(`[applyWL-2] After offline hide, about to cmToInfo for ${s.id}, rawCm=${rawCm}`);

    // Gunakan cmToInfo untuk mendapat % volume (akurat) DAN % linear (untuk info tambahan)
    let info, pct, pctLinear, waterCm, isNonLinear;
    try {
      info = cmToInfo(s, rawCm);
      pct        = info.pct;        // % volume — yang dipakai untuk fill visual & alert
      pctLinear  = info.pctLinear;  // % tinggi linear — info tambahan
      waterCm    = +Math.max(0, info.h - +(s.sensorZeroCm ?? 0)).toFixed(1); // tinggi air dikurangi zero offset sensor
      isNonLinear = info.isNonLinear;  // true jika silinder horizontal
      console.log(`[applyWL] ${s.name} (id=${s.id}): rawCm=${rawCm}, pct=${pct}%, pctLinear=${pctLinear}%, waterCm=${waterCm}cm, shape=${s.shape}, zero=${s.sensorZeroCm}`);
      sumPct += pct;
    } catch(e) {
      console.error(`❌ ERROR cmToInfo for ${s.id}:`, e.message);
      return;  // Skip this sensor
    }

    // Warna tangki — solar pakai skema coklat/kuning/hijau, lainnya merah/kuning/hijau
    const col = (s.fixedId === 'solar') ? getTankColorSolar(pct) : getTankColorByPct(pct);
    
    // Determine text color: BLACK for warm colors (orange/red), WHITE for cool colors (green)
    const textColor = (pct <= 50) ? '#000000' : '#ffffff';

    // Pre-declare all elements untuk avoid "used before initialization"
    const tw = document.getElementById('tank-water-' + s.id);
    const tb = document.getElementById('tank-body-' + s.id);
    const tc = document.getElementById('tank-card-' + s.id);
    const tp = document.getElementById('tank-pct-' + s.id);
    const tcm = document.getElementById('tank-cm-' + s.id);
    const tv = document.getElementById('tank-vol-' + s.id);
    
    console.log(`🔍 Updating ${s.id}: pct=${pct}%, element check:`, {
      waterEl: !!tw,
      bodyEl: !!tb,
      cardEl: !!tc,
      pctEl: !!tp,
      cmEl: !!tcm,
      volEl: !!tv
    });

    // Update visual: fill air menggunakan % LINEAR agar tampilan tangki proporsional secara visual
    // tapi label persentase menampilkan % VOLUME yang akurat
    if (tw) {
      tw.style.height = pctLinear + '%';
      tw.style.background = col.water;
      console.log(`✅ Updated #tank-water-${s.id} height = ${pctLinear}%`);
    } else {
      console.warn(`❌ Element #tank-water-${s.id} tidak ditemukan!`);
    }

    // Update warna body & border tangki
    if (tb) {
      tb.style.borderColor = col.border;
      tb.style.background  = col.bg;
    } else {
      console.warn(`❌ Element #tank-body-${s.id} tidak ditemukan!`);
    }

    // Update warna border-top & label kartu — hijau/kuning/merah sesuai level
    if (tc) {
      tc.style.borderTopColor = col.border;
      tc.style.opacity = '1';
    }
    
    if (tp) {
      if (isNonLinear) {
        tp.innerHTML = `<span style="font-size:22px;font-weight:800;color:${textColor}">${pct}%</span><span style="font-size:7px;color:var(--txt3);display:block;line-height:1.4">vol · ${pctLinear}% tinggi</span>`;
      } else {
        tp.textContent = pct + '%';
      }
      tp.style.color = textColor;
      console.log(`✅ Updated #tank-pct-${s.id} = ${pct}%`);
    } else {
      console.warn(`❌ Element #tank-pct-${s.id} tidak ditemukan!`);
    }
    // Juga update elemen mini (di atas tangki visual)
    const tpMini = document.getElementById('tank-pct-mini-' + s.id);
    if (tpMini) { tpMini.textContent = pct + '%'; tpMini.style.color = textColor; }

    if (tcm) {
      const isHoriz = (s.orientasi || 'vertikal') === 'horizontal';
      tcm.textContent = isHoriz
        ? waterCm.toFixed(1) + ' cm (dari bawah)'
        : waterCm.toFixed(1) + ' cm air';
    }
    const tcmMini = document.getElementById('tank-cm-mini-' + s.id);
    if (tcmMini) tcmMini.textContent = waterCm.toFixed(1) + ' cm air';

    const vol    = Math.round(calcVolumeLiter(s, rawCm));
    const maxVol = Math.round(calcMaxVolumeLiter(s));
    grandTotal += vol;

    // Format volume: "vol of max L"
    if (tv) {
      tv.textContent = vol.toLocaleString('id-ID') + ' of ' + maxVol.toLocaleString('id-ID') + ' L';
      tv.style.color = col.label;
    }
    const tvMini = document.getElementById('tank-vol-mini-' + s.id);
    if (tvMini) { tvMini.textContent = vol.toLocaleString('id-ID') + ' of ' + maxVol.toLocaleString('id-ID') + ' L'; tvMini.style.color = col.label; }
    // Hide offline-mini badge
    const toffMini = document.getElementById('tank-offline-mini-' + s.id);
    if (toffMini) toffMini.style.display = 'none';

    // Update progress bar (new card style)
    const tbar = document.getElementById('tank-bar-' + s.id);
    if (tbar) {
      tbar.style.width = pctLinear + '%';
      tbar.style.background = col.border;
    }

    if (isNonLinear) {
      volRowsHTML.push(`
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9px;color:${col.label};font-weight:600">${s.name} <span style="font-weight:400;color:var(--txt3)">↔⬤</span></span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--txt)">
            ${vol.toLocaleString('id-ID')} of ${maxVol.toLocaleString('id-ID')} L
            <span style="color:var(--txt3);font-size:8px">(vol:${pct}% · h:${pctLinear}% · ${waterCm}cm)</span>
          </span>
        </div>`);
    } else {
      const isHoriz = (s.orientasi || 'vertikal') === 'horizontal';
      volRowsHTML.push(`
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9px;color:${col.label};font-weight:600">${s.name}</span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--txt)">${vol.toLocaleString('id-ID')} of ${maxVol.toLocaleString('id-ID')} L <span style="color:var(--txt3);font-size:8px">(${pct}% · ${waterCm}cm)</span></span>
        </div>`);
    }
  });

  if (volRows) volRows.innerHTML = volRowsHTML.join('');
  set('wl-vol-total', grandTotal.toLocaleString('id-ID') + ' L');

  const avg = sensors.length ? sumPct / sensors.length : 0;
  pill('wl-status', avg, 70, 90);

  // applyWLToNewUI dulu sebagai pass pertama
  applyWLToNewUI(wl, sensors);
  // updateNewSectionTanks TERAKHIR — ini final authority untuk semua section cards
  // Fungsi ini punya hardcoded sensor config fallback dan key lookup paling lengkap
  if (typeof updateNewSectionTanks === 'function') updateNewSectionTanks(wl);
}

// ── Bridge: Update elemen di UI baru iot.js dari data applyWL ─────────────────
// Mapping fixedId → element ID prefix di HTML baru
const _NEW_UI_ID_MAP = {
  // fixedId → element ID prefix di HTML (tank-water-XXX, tank-pct-XXX, dst)
  'air_proses':    'air_proses',    // s1 = Process Water → FILTER WATER section
  'feed_slury':    'feed_slury_tw1',    // s2 = Feed Slurry Water → TREAT WATER 1 section
  'tanu_edi':      'tanu_edi',      // s3 = Chiller In → Chiller in & out section
  'feed_edi':      'feed_edi',      // s4 = Chiller Out → Chiller in & out section
  'solar':         'solar',         // s5 = Tangki Solar → Diesel/Solar section
  'slury_1':       'slury_1_tw1',       // s7 = Slurry 1 → TREAT WATER 1 section
  'slury_2':       'slury_2_tw1',       // s8 = Slurry 2 → TREAT WATER 1 section
  'boiler_fw':     'boiler_fw-tw2', // s6 = Tank Aroma → suffix -tw2 sesuai HTML
  'ground_tank_a': 'ground_tank_a', // s9 = Ground Tank A → FILTER WATER section
  'ground_tank_b': 'ground_tank_b', // s10 = Ground Tank B → WWTP section
};

function applyWLToNewUI(wl, sensors) {
  if (!wl) return;
  sensors.forEach(s => {
    const elId = _NEW_UI_ID_MAP[s.fixedId];
    if (!elId) return;

    // Sensor tidak aktif → tampilkan --% dan kosongkan tangki
    if (s.active === false) {
      const pctEl  = document.getElementById('tank-pct-'     + elId);
      const waterEl= document.getElementById('tank-water-'   + elId);
      const offEl  = document.getElementById('tank-offline-' + elId);
      const barEl  = document.getElementById('tank-bar-'     + elId);
      if (pctEl)   pctEl.textContent = '--%';
      if (waterEl) waterEl.style.height = '0%';
      if (offEl)   { offEl.style.display = 'inline-flex'; offEl.textContent = 'TIDAK AKTIF'; }
      if (barEl)   { barEl.style.display = 'none'; if (barEl.parentElement) barEl.parentElement.style.display = 'none'; }
      return;
    }

    // Gunakan getSensorValueWithFallback agar konsisten dengan applyWL
    const dataResult = getSensorValueWithFallback(wl, s.key, s.fixedId);
    if (dataResult.source === 'fresh') setCachedSensorValue(s.key, dataResult.value);
    // Cache/none = offline → tampilkan —%
    let rawCm = (dataResult.source === 'fresh') ? dataResult.value : null;
    // Nilai -1 dari ESP = tidak ada data
    if (rawCm !== null && (parseFloat(rawCm) < 0 || !isFinite(parseFloat(rawCm)))) rawCm = null;

    if (rawCm === null) {
      // Offline — tampilkan —% dan sembunyikan badge
      const pctEl  = document.getElementById('tank-pct-'     + elId);
      const cmEl   = document.getElementById('tank-cm-'      + elId);
      const volEl  = document.getElementById('tank-vol-'     + elId);
      const waterEl= document.getElementById('tank-water-'   + elId);
      const barEl  = document.getElementById('tank-bar-'     + elId);
      const offEl  = document.getElementById('tank-offline-' + elId);
      if (pctEl)   pctEl.textContent = '—%';
      if (cmEl)    cmEl.textContent  = '— cm';
      if (volEl)   volEl.textContent = '— / — L';
      if (waterEl) waterEl.style.height = '0%';
      if (barEl)   { barEl.style.display = 'none'; if (barEl.parentElement) barEl.parentElement.style.display = 'none'; }
      if (offEl)   offEl.style.display  = 'inline-flex';
      // Sync _tw2
      const pctElTW2  = document.getElementById('tank-pct-'     + elId + '_tw2');
      const cmElTW2   = document.getElementById('tank-cm-'      + elId + '_tw2');
      const volElTW2  = document.getElementById('tank-vol-'     + elId + '_tw2');
      const waterElTW2= document.getElementById('tank-water-'   + elId + '_tw2');
      const offElTW2  = document.getElementById('tank-offline-' + elId + '_tw2');
      const barElTW2  = document.getElementById('tank-bar-'     + elId + '_tw2');
      if (pctElTW2)   pctElTW2.textContent = '—%';
      if (cmElTW2)    cmElTW2.textContent  = '— cm';
      if (volElTW2)   volElTW2.textContent = '— / — L';
      if (waterElTW2) waterElTW2.style.height = '0%';
      if (offElTW2)   offElTW2.style.display  = 'inline-flex';
      if (barElTW2)   { barElTW2.style.display = 'none'; if (barElTW2.parentElement) barElTW2.parentElement.style.display = 'none'; }
      return;
    }

    const offEl = document.getElementById('tank-offline-' + elId);
    if (offEl) offEl.style.display = 'none';

    rawCm = Math.max(0, parseFloat(rawCm));
    const info      = cmToInfo(s, rawCm);
    const pct       = info.pct;
    const pctLinear = info.pctLinear;
    const waterCm   = +Math.max(0, info.h - +(s.sensorZeroCm ?? 0)).toFixed(1);
    const col       = (s.fixedId === 'solar') ? getTankColorSolar(pct) : getTankColorByPct(pct);
    const vol       = Math.round(calcVolumeLiter(s, rawCm));
    const maxVol    = Math.round(calcMaxVolumeLiter(s));
    
    // Determine text color: BLACK for warm colors (orange/red), WHITE for cool colors (green)
    const textColor = (pct <= 50) ? '#000000' : '#ffffff';

    // Fill air
    const waterEl = document.getElementById('tank-water-' + elId);
    if (waterEl) {
      waterEl.style.height     = pctLinear + '%';
      waterEl.style.background = col.water;
    }
    // Body border & bg
    // Untuk slury_2_tw1: jangan override background (dark card theme)
    const bodyEl = document.getElementById('tank-body-' + elId);
    if (bodyEl) {
      if (elId !== 'slury_2_tw1') {
        bodyEl.style.borderColor = col.border;
        bodyEl.style.background  = col.bg;
      }
    }
    // Persentase
    const pctEl = document.getElementById('tank-pct-' + elId);
    if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = textColor; }
    // cm
    const cmEl = document.getElementById('tank-cm-' + elId);
    if (cmEl) cmEl.textContent = waterCm + ' cm air';
    // Volume
    const volEl = document.getElementById('tank-vol-' + elId);
    if (volEl) {
      volEl.textContent = vol.toLocaleString('id-ID') + 'lt / ' + maxVol.toLocaleString('id-ID') + 'lt';
      volEl.style.color = col.label;
    }
    // Progress bar — disembunyikan, tidak perlu diupdate
    const barEl = document.getElementById('tank-bar-' + elId);
    if (barEl) {
      barEl.style.display = 'none';
      if (barEl.parentElement) barEl.parentElement.style.display = 'none';
    }

    // Sync ke elemen _tw2 (section TREAT WATER 2 lama yang masih tampil)
    const waterElTW2 = document.getElementById('tank-water-' + elId + '_tw2');
    if (waterElTW2) { waterElTW2.style.height = pctLinear + '%'; waterElTW2.style.background = col.water; }
    const bodyElTW2 = document.getElementById('tank-body-' + elId + '_tw2');
    if (bodyElTW2) { bodyElTW2.style.borderColor = col.border; bodyElTW2.style.background = col.bg; }
    const pctElTW2 = document.getElementById('tank-pct-' + elId + '_tw2');
    if (pctElTW2) { pctElTW2.textContent = pct + '%'; pctElTW2.style.color = textColor; }
    const cmElTW2 = document.getElementById('tank-cm-' + elId + '_tw2');
    if (cmElTW2) cmElTW2.textContent = waterCm + ' cm air';
    const volElTW2 = document.getElementById('tank-vol-' + elId + '_tw2');
    if (volElTW2) { volElTW2.textContent = vol.toLocaleString('id-ID') + 'lt / ' + maxVol.toLocaleString('id-ID') + 'lt'; volElTW2.style.color = col.label; }
    const offElTW2 = document.getElementById('tank-offline-' + elId + '_tw2');
    if (offElTW2) offElTW2.style.display = 'none';
    const barElTW2 = document.getElementById('tank-bar-' + elId + '_tw2');
    if (barElTW2) { barElTW2.style.display = 'none'; if (barElTW2.parentElement) barElTW2.parentElement.style.display = 'none'; }
  });
}

function applyWF(wf) {
  if(!wf) return;
  const v = +(wf.rate ?? wf.flow_rate ?? wf.flow ?? 0);
  set('wf-val', v);
  set('wf-rpm', Math.round(v*8)+' rpm');
  set('wf-vol', (wf.total ?? '—')+' mL');
  set('wf-time', fmtT(wf.created_at));
  // Mini water flow card di tengah grid tangki
  set('wf-mini-val', v);
  set('wf-mini-rpm', Math.round(v*8)+' rpm');
  const fanMini = document.getElementById('fan-svg-mini');
  if (fanMini) fanMini.style.animationDuration = v > 0 ? Math.max(.2, 5/v)+'s' : '20s';
  pill('wf-mini-status', v, 80, 120);
  const fan=$('fan-svg');
  if(fan) fan.style.animationDuration = v>0 ? Math.max(.2,5/v)+'s' : '20s';
  document.querySelectorAll('.fp').forEach(p=>{
    p.style.animationPlayState = v>0?'running':'paused';
    p.style.animationDuration  = v>0?(1.2/Math.max(v,.5))+'s':'2s';
  });
  pill('wf-status', v, 80, 120);
}

function applyEnv(env) {
  if(!env) return;
  const suhu = +(env.t ?? env.suhu ?? env.temperature ?? 0);
  const lemb = +(env.h ?? env.kelembapan ?? env.humidity ?? 0);
  const gas  = +(env.raw ?? env.gas ?? env.gas_value ?? 0);

  set('suhu-val', suhu); set('suhu-v2', suhu+'°C'); set('suhu-time', fmtT(env.created_at));
  const merc=$('thermo-merc'); if(merc) merc.style.height=clamp(suhu/50*100,0,100)+'%';
  let cond='NORMAL', bb='radial-gradient(circle at 35% 35%,#93c5fd,#1d4ed8)';
  if(suhu>=38){cond='SANGAT PANAS';bb='radial-gradient(circle at 35% 35%,#fca5a5,#b91c1c)';}
  else if(suhu>=35){cond='PANAS';bb='radial-gradient(circle at 35% 35%,#fdba74,#c2410c)';}
  else if(suhu>=30){cond='HANGAT';bb='radial-gradient(circle at 35% 35%,#fed7aa,#ea580c)';}
  set('suhu-cond', cond);
  const bulb=$('thermo-bulb'); if(bulb) bulb.style.background=bb;
  pill('suhu-status', suhu, 35, 40);

  set('kel-val', lemb); set('g-num', lemb);
  const arc=$('g-arc'); if(arc) arc.style.strokeDashoffset=204-(lemb/100)*204;
  const ndl=$('g-needle'); if(ndl) ndl.setAttribute('transform',`rotate(${-90+(lemb/100)*180},78,83)`);
  for(let i=0;i<7;i++){
    const drp=$('drp-'+i); if(!drp) continue;
    const active=(lemb/100*7)>i;
    drp.style.height=(active?11+i*2:6)+'px';
    drp.style.opacity=active?'.8':'.2';
    drp.style.background=lemb>90?'var(--red)':lemb>75?'var(--yellow)':'var(--blue)';
  }
  pill('kel-status', lemb, 80, 95);

  const maxG=600, gPct=clamp(Math.round(gas/maxG*100),0,100);
  set('gas-val', gas); set('gas-pct-lbl', gPct+'%');
  const gbar=$('gbar-main');
  if(gbar){
    gbar.style.width=gPct+'%';
    gbar.style.background=gas>=500?'linear-gradient(90deg,#e07b2a,#dc3545)':gas>=300?'linear-gradient(90deg,#c99a0a,#e07b2a)':'linear-gradient(90deg,#18a96a,#6f52d9)';
  }
  document.querySelectorAll('.gp').forEach((p,i)=>{
    p.style.animationDuration=(Math.max(.3,1.4-gas/600)+(i%3)*.12)+'s';
  });
  pill('gas-status', gas, 300, 500);
}

// ── pill: update status indicator element ────────────────────
function pill(id, val, warn, danger) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = parseFloat(val);
  if (isNaN(v)) { el.className = 's-pill st-wait'; return; }
  if (v >= danger)    el.className = 's-pill st-danger';
  else if (v >= warn) el.className = 's-pill st-warn';
  else                el.className = 's-pill st-ok';
}

// ── applyPatroli: update patrol status display ───────────────
function applyPatroli(data) {
  if (!data) return;
  const positions = Array.isArray(data) ? data : (data.positions || []);
  positions.forEach(p => {
    const el = document.getElementById('pat-pos-' + p.pos);
    if (!el) return;
    el.className = 'pat-status pat-' + (p.status || 'Aman').toLowerCase();
    el.textContent = p.status || 'Aman';
  });
  const totalEl = document.getElementById('pat-total');
  if (totalEl && data.total != null) totalEl.textContent = data.total;
}

// ── applyWWTP: update WWTP / Limbah section ─────────────────────────────────
// Data dari API: { ground_tank_b_cm, cod, bod, ph, tds, created_at }
function applyWWTP(data) {
  // ground_tank_b sekarang dihandle applyWL via s10 — tidak perlu duplikasi di sini.
  // Fungsi ini hanya update metric COD/BOD/PH/TDS jika ada data WWTP dari API.
  if (!data) return;

  // Metric cards (COD, BOD, PH, TDS) — nilai langsung dari API
  const maxCOD = 1000, maxBOD = 600, maxTDS = 1000;
  if (data.cod != null) {
    const v = parseFloat(data.cod);
    const el = document.getElementById('wwtp-cod-val'); if (el) el.textContent = v;
    const br = document.getElementById('wwtp-cod-bar');
    if (br) br.style.width = Math.min(100, Math.round(v/maxCOD*100)) + '%';
  }
  if (data.bod != null) {
    const v = parseFloat(data.bod);
    const el = document.getElementById('wwtp-bod-val'); if (el) el.textContent = v;
    const br = document.getElementById('wwtp-bod-bar');
    if (br) br.style.width = Math.min(100, Math.round(v/maxBOD*100)) + '%';
  }
  if (data.ph != null) {
    const v = parseFloat(data.ph);
    const el = document.getElementById('wwtp-ph-val'); if (el) el.textContent = v.toFixed(1);
    const br = document.getElementById('wwtp-ph-bar');
    if (br) br.style.width = Math.min(100, Math.round(v/14*100)) + '%';
  }
  if (data.tds != null) {
    const v = parseFloat(data.tds);
    const el = document.getElementById('wwtp-tds-val'); if (el) el.textContent = v;
    const br = document.getElementById('wwtp-tds-bar');
    if (br) br.style.width = Math.min(100, Math.round(v/maxTDS*100)) + '%';
  }
  const lt = document.getElementById('wwtp-live-time');
  if (lt && data.created_at) lt.textContent = fmtT(data.created_at);
}

// ── applyDiesel: update Diesel Oil section ───────────────────────────────────
// Data dari API: { diesel_tank_cm, diesel_genset_cm, genset_status, created_at }
function applyDiesel(data) {
  if (!data) return;

  const sensors = getSensors();

  // Helper: update satu tangki diesel dari rawCm
  function _updateDieselTank(tankId, rawCm) {
    const s = sensors.find(s => s.fixedId === tankId || s.id === tankId);
    if (!s || s.active === false) return;
    const rc   = Math.max(0, parseFloat(rawCm));
    const info = cmToInfo(s, rc);
    const col  = (s.fixedId === 'solar') ? getTankColorSolar(info.pct) : getTankColorByPct(info.pct);
    const vol  = Math.round(calcVolumeLiter(s, rc));
    const maxV = Math.round(calcMaxVolumeLiter(s));

    const tw = document.getElementById('tank-water-' + tankId);
    if (tw) { tw.style.height = info.pctLinear + '%'; tw.style.background = col.water; }
    const tb = document.getElementById('tank-body-' + tankId);
    if (tb) { tb.style.borderColor = col.border; tb.style.background = col.bg; }
    const tp = document.getElementById('tank-pct-' + tankId);
    if (tp) { tp.textContent = info.pct + '%'; tp.style.color = 'white'; }
    const tv = document.getElementById('tank-vol-' + tankId);
    if (tv) { tv.textContent = vol.toLocaleString('id-ID') + ' of ' + maxV.toLocaleString('id-ID') + ' L'; tv.style.color = col.label; }
    const tcm = document.getElementById('tank-cm-' + tankId);
    if (tcm) { const _zeroCm = +(s.sensorZeroCm ?? 0); tcm.textContent = Math.max(0, +info.h.toFixed(1) - _zeroCm) + ' cm air'; }
    const tbar = document.getElementById('tank-bar-' + tankId);
    if (tbar) { tbar.style.width = info.pctLinear + '%'; tbar.style.background = col.border; }
    const off = document.getElementById('tank-offline-' + tankId);
    if (off) off.style.display = 'none';
  }

  const dtCm  = data.diesel_tank_cm  ?? data.diesel_tank   ?? null;
  const dgCm  = data.diesel_genset_cm ?? data.diesel_genset ?? null;

  if (dtCm  !== null) _updateDieselTank('diesel_tank',   dtCm);
  if (dgCm  !== null) _updateDieselTank('diesel_genset', dgCm);

  // Genset status
  if (data.genset_status != null) {
    const gs = document.getElementById('genset-status-val');
    if (gs) {
      gs.textContent = String(data.genset_status).toUpperCase();
      const isOn = String(data.genset_status).toLowerCase().includes('on') ||
                   String(data.genset_status).toLowerCase().includes('run');
      gs.style.color = isOn ? '#16a34a' : '#ca8a04';
    }
  }
  const lt = document.getElementById('diesel-live-time');
  if (lt && data.created_at) lt.textContent = fmtT(data.created_at);
}

// ── applyFuelGenset: update TANK GENSET (diesel_genset) dari tabel laporan_fuel_level ──
// Data dari API: { percent, liters, created_at } — datang langsung dalam %, BUKAN cm,
// jadi tidak lewat cmToInfo/dimensi tangki seperti sensor s1-s11.
const FUEL_TANK_CAPACITY_LITERS = 721; // harus sama dengan FUEL_TANK_CAPACITY_LITERS di bridge.py

function applyFuelGenset(data) {
  const pctEl  = document.getElementById('tank-pct-diesel_genset');
  const waterEl= document.getElementById('tank-water-diesel_genset');
  const bodyEl = document.getElementById('tank-body-diesel_genset');
  const volEl  = document.getElementById('tank-vol-diesel_genset');
  const cmEl   = document.getElementById('tank-cm-diesel_genset');
  const offEl  = document.getElementById('tank-offline-diesel_genset');

  if (!data || data.percent === null || data.percent === undefined) {
    if (pctEl)   pctEl.textContent = '—%';
    if (waterEl) waterEl.style.width = '0%';
    if (volEl)   volEl.textContent = '— / ' + FUEL_TANK_CAPACITY_LITERS.toLocaleString('id-ID') + ' lt';
    if (cmEl)    cmEl.style.display = 'none';
    if (offEl)   offEl.style.display = 'flex';
    return;
  }

  const pct    = Math.round(Number(data.percent));
  const liters = data.liters != null ? Math.round(Number(data.liters)) : Math.round(pct / 100 * FUEL_TANK_CAPACITY_LITERS);
  const col    = getTankColorByPct(pct);

  if (offEl)   offEl.style.display = 'none';
  if (pctEl)   { pctEl.textContent = pct + '%'; pctEl.style.color = '#000000'; }
  if (waterEl) { waterEl.style.width = pct + '%'; waterEl.style.height = '100%'; waterEl.style.background = col.water; }
  if (bodyEl)  { bodyEl.style.borderColor = col.border; bodyEl.style.background = col.bg; }
  if (volEl)   { volEl.textContent = liters.toLocaleString('id-ID') + ' / ' + FUEL_TANK_CAPACITY_LITERS.toLocaleString('id-ID') + ' lt'; volEl.style.color = col.label; }
  if (cmEl)    cmEl.style.display = 'none'; // fuel tidak punya data cm, sembunyikan baris ini
}

// ── Window Exports for global access ──────────────────────────
if (typeof window !== 'undefined') {
  window.getSensors = getSensors;
  window.saveSensorsFromDashboard = saveSensorsFromDashboard;
  window.startSensorSettingsSync = startSensorSettingsSync;
  window.cmToInfo = cmToInfo;
  window.calcVolumeLiter = calcVolumeLiter;
  window.calcMaxVolumeLiter = calcMaxVolumeLiter;
  window.fetchSummary = fetchSummary;
  window.applyWL = applyWL;
  window.applyWF = applyWF;
  window.applyEnv = applyEnv;
  window.applyFuelGenset = applyFuelGenset;
}

// ══ TABLE ══════════════════════════════════════════
const tabApi = {
  'water-level': API.waterLevel,
  'water-flow':  API.waterFlow,
  'lingkungan':  API.lingkungan,
};