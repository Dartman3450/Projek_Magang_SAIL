var _pjCache = { ongoing: [], completed: [] };
// ── INJEKSI CSS UNTUK KOTAK SATUAN (UNIT ADD-ON) ──
const unitAddonStyle = document.createElement('style');
unitAddonStyle.innerHTML = `
  .input-group { 
    display: flex; 
    align-items: stretch; 
    width: 100%; 
    margin-top: 4px; 
  }
  .input-group .de-input { 
    flex: 1; 
    border-top-right-radius: 0 !important; 
    border-bottom-right-radius: 0 !important; 
    margin-top: 0 !important; 
  }
  .input-group .group-unit { 
    display: flex; 
    align-items: center; 
    background: #f8fafc; 
    border: 1px solid var(--border); 
    border-left: none; 
    padding: 0 12px; 
    border-top-right-radius: 8px; 
    border-bottom-right-radius: 8px; 
    color: var(--txt2); 
    font-size: 11px; 
    font-weight: 700; 
    white-space: nowrap;
  }
`;
document.head.appendChild(unitAddonStyle);

// ── INJEKSI TAMPILAN KOTAK HITUNGAN OTOMATIS (READONLY) ──
const autoInputStyle = document.createElement('style');
autoInputStyle.innerHTML = `
  /* Mengubah warna dasar, teks, dan border untuk semua input otomatis */
  .de-input[readonly] {
    background-color: #ebf2fd !important; /* Background biru sangat pudar */
    color: #0284c7 !important; /* Teks warna biru laut pekat */
    font-weight: 700 !important; /* Teks tebal */
    border-color: #bae6fd !important; /* Garis pinggir biru muda */
    cursor: not-allowed;
  }
  
  /* Mengubah warna teks bayangan (placeholder) agar serasi */
  .de-input[readonly]::placeholder {
    color: #7dd3fc !important; /* Placeholder biru muda */
    font-weight: normal !important;
  }
`;
document.head.appendChild(autoInputStyle);

// ── INJEKSI STYLE SIDEBAR — nav bold + SAIL lebih besar ──
const sidebarStyle = document.createElement('style');
sidebarStyle.innerHTML = `
  /* SAIL title — lebih besar dan bold */
  .logo-tag {
    font-size: 24px !important;
    font-weight: 800 !important;
    letter-spacing: 4px;
  }
  
  /* Support Operational System — lebih besar dan bold */
  .logo-sub {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #555 !important;
    letter-spacing: 1.5px;
  }

  /* Nav items utama — hitam dan bold */
  .nav-item {
    color: #111 !important;
    font-weight: 700 !important;
  }
  .nav-item:hover {
    color: #111 !important;
  }
  .nav-item.active {
    color: var(--blue) !important;
  }

  /* Nav group header (Project, Data & Information, dll) — bold hitam */
  .nav-group-head {
    color: #111 !important;
    font-weight: 700 !important;
  }
  .nav-group-head:hover {
    color: #111 !important;
  }

  /* Sub-item (On Going Project, Completed Project, dll) — hitam bold */
  .nav-sub-item {
    color: #333 !important;
    font-weight: 600 !important;
  }
  .nav-sub-item:hover {
    color: var(--blue) !important;
  }

  /* Logout button — tetap merah */
  .logout-btn {
    color: var(--txt3) !important;
    font-weight: 600 !important;
  }
  .logout-btn:hover {
    color: var(--red) !important;
  }
  
  /* ESP badge partial (sebagian konek) */
  .esp-badge.partial {
    background: #fffbeb;
    border-color: #fde68a;
    color: #b45309;
  }
  .esp-badge.partial .esp-dot {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245,158,11,.5);
  }
`;
document.head.appendChild(sidebarStyle);
