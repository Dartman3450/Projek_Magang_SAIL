const express = require("express");
const cors = require("cors");
const path = require("path");
const mqtt     = require('mqtt');
require('dotenv').config();

const iotRoutes  = require('./routes/iotRoutes');
const authRoutes = require('./routes/auth.route');
const projectsRoute = require('./routes/projects.route');

const { poolIoT } = require('./db');

const app = express();
const dataentryRoute = require('./routes/dataentry.route');
 

app.use('/api/dataentry', dataentryRoute);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/iot',  iotRoutes);
app.use("/api/webauthn", require("./routes/webauthn.route"));
app.use("/api/auth", require("./routes/auth.route"));
app.use('/api/projects', projectsRoute);

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://192.168.0.211';

const mqttClient = mqtt.connect(MQTT_BROKER, {
  clientId: 'SAIL_Server_' + Math.random().toString(16).slice(2, 8),
  reconnectPeriod: 5000,
  connectTimeout: 10000,
});

mqttClient.on('connect', () => {
  console.log('✅ MQTT terhubung ke', MQTT_BROKER);
  const topics = [
    'sensor/water_level',
    'sensor/water_flow',
    'sensor/lingkungan',
    'patroli/laporan',
  ];
  mqttClient.subscribe(topics, { qos: 1 }, (err) => {
    if (err) console.error('❌ Subscribe gagal:', err.message);
    else     console.log('📥 Subscribe topics:', topics.join(', '));
  });
});

mqttClient.on('error',  err  => console.error('❌ MQTT error:',  err.message));
mqttClient.on('close',  ()   => console.warn ('⚠️  MQTT terputus, reconnecting...'));
mqttClient.on('offline',()   => console.warn ('⚠️  MQTT offline'));

mqttClient.on('message', async (topic, message) => {
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch {
    console.warn(`⚠️  Bukan JSON dari topic [${topic}]:`, message.toString());
    return;
  }

  try {
    // ── sensor/water_level ──────────────────────────────────────
    // ESP32 kirim: {"s1":int,"s2":int,"p1":int,"p2":int}
    // Kolom DB   : s1_cm, s2_cm, p1, p2
    if (topic === 'sensor/water_level') {
      // ✅ FIX: terima s1/s2 (ESP32 lama) ATAU s1_cm/s2_cm (ESP32 baru)
      const s1Val = data.s1_cm ?? data.s1;
      const s2Val = data.s2_cm ?? data.s2;
      const p1Val = data.p1;
      const p2Val = data.p2;

      if (s1Val == null || s2Val == null) {
        console.warn('WL: field s1/s2 tidak ada di payload:', JSON.stringify(data));
        return;
      }

      await poolIoT.query(
        'INSERT INTO laporan_water_level (s1_cm, s2_cm, p1, p2) VALUES ($1, $2, $3, $4)',
        [
          Math.max(0, Math.min(9999, parseInt(s1Val))),
          Math.max(0, Math.min(9999, parseInt(s2Val))),
          p1Val != null ? parseInt(p1Val) : 1,
          p2Val != null ? parseInt(p2Val) : 1,
        ]
      );
      console.log(`💧 WL saved: s1_cm=${s1Val} s2_cm=${s2Val} p1=${p1Val} p2=${p2Val}`);
    }

    // ── sensor/water_flow ───────────────────────────────────────
    else if (topic === 'sensor/water_flow') {
      const { rate, total } = data;
      if (rate == null) { console.warn('WF: field rate tidak ada'); return; }

      await poolIoT.query(
        'INSERT INTO laporan_water_flow (rate, total) VALUES ($1, $2)',
        [
          parseFloat(rate).toFixed(2),
          parseInt(total ?? 0),
        ]
      );
      console.log(`🌊 WF saved: rate=${rate} L/min total=${total} mL`);
    }

    // ── sensor/lingkungan ───────────────────────────────────────
    else if (topic === 'sensor/lingkungan') {
      const { h, t, raw, stat } = data;
      if (h == null || t == null) { console.warn('ENV: field h/t tidak ada'); return; }

      const tVal   = parseFloat(t);
      const hVal   = parseFloat(h);
      const rawVal = parseInt(raw ?? 0);
      if (tVal < -40 || tVal > 85)  { console.warn(`ENV: suhu tidak wajar (${tVal}°C)`); return; }
      if (hVal <   0 || hVal > 100) { console.warn(`ENV: kelembapan tidak wajar (${hVal}%)`); return; }

      await poolIoT.query(
        'INSERT INTO laporan_lingkungan (t, h, raw, stat) VALUES ($1, $2, $3, $4)',
        [tVal.toFixed(1), hVal.toFixed(1), rawVal, stat ?? 'NORMAL / AMAN']
      );
      console.log(`🌡️  ENV saved: t=${t}°C h=${h}% raw=${raw} stat="${stat}"`);
    }

    // ── patroli/laporan ─────────────────────────────────────────
    else if (topic === 'patroli/laporan') {
      const { pos, status } = data;
      if (pos == null || !status) { console.warn('PAT: field pos/status tidak ada'); return; }

      const validStatus = ['Aman', 'Rusak', 'Aneh', 'Bahaya'];
      const posVal = parseInt(pos);
      if (posVal < 1 || posVal > 4)       { console.warn(`PAT: pos tidak valid (${pos})`); return; }
      if (!validStatus.includes(status))   { console.warn(`PAT: status tidak valid (${status})`); return; }

      await poolIoT.query(
        'INSERT INTO laporan_patroli (pos, status) VALUES ($1, $2)',
        [posVal, status]
      );
      console.log(`🚶 PAT saved: pos=${pos} status="${status}"`);
    }

  } catch (err) {
    console.error(`❌ DB insert error [${topic}]:`, err.message);
  }
});

app.get('/api/mqtt/status', (req, res) => {
  res.json({ connected: mqttClient.connected });
});

app.post('/api/update-settings', (req, res) => {
  const { min, max } = req.body;
  if (min == null || max == null)
    return res.status(400).json({ error: 'Field min dan max diperlukan' });

  const minVal = parseInt(min);
  const maxVal = parseInt(max);
  if (isNaN(minVal) || isNaN(maxVal))
    return res.status(400).json({ error: 'min dan max harus berupa angka' });
  if (minVal >= maxVal)
    return res.status(400).json({ error: 'min harus lebih kecil dari max' });

  const payload = JSON.stringify({ min: minVal, max: maxVal });
  mqttClient.publish('sensor/settings', payload, { qos: 1, retain: true }, (err) => {
    if (err) {
      console.error('❌ Publish sensor/settings gagal:', err.message);
      return res.status(500).json({ error: 'Gagal mengirim ke ESP32' });
    }
    console.log('⚙️  Setting terkirim:', payload);
    res.json({ message: 'Pengaturan berhasil dikirim ke ESP32', payload });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server SAIL berjalan di http://localhost:${PORT}`);
});