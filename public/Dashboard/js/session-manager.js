// ═══════════════════════════════════════════════════════════════════════
// SESSION MANAGER — Session Timeout & Idle Detection
// ═══════════════════════════════════════════════════════════════════════
// Features:
// 1. Session Timeout: Jika sudah login > 1 jam, auto logout & redirect ke login
// 2. Idle Detection: Jika tidak ada activity (mouse/keyboard) > 30 menit, auto logout
// 3. Graceful cleanup: Clear localStorage dan redirect ke login page

(function initSessionManager() {
  // ═══ CONFIG ═══
  const SESSION_TIMEOUT = 12 * 60 * 60 * 1000;      // 1 jam (milliseconds)
  const IDLE_TIMEOUT = 12 * 60 * 60 * 1000;     // 2 jam (milliseconds) — diperpanjang untuk data entry
  const CHECK_INTERVAL = 60 * 1000;            // Check setiap 1 menit
  
  let lastActivityTime = Date.now();
  let sessionCheckInterval = null;
  let isLoggingOut = false;

  // ═══ AUTO-REDIRECT CHECK ═══
  function checkSessionValidity() {
    // Jika sedang logout, skip check
    if (isLoggingOut) return;

    const isLoggedIn = localStorage.getItem('isLoggedin') === 'true';
    if (!isLoggedIn) return; // Tidak login, tidak perlu check

    const loginTime = parseInt(localStorage.getItem('login_time') || '0', 10);
    if (!loginTime) return; // Tidak ada login_time, skip

    const now = Date.now();
    const sessionAge = now - loginTime;
    const idleTime = now - lastActivityTime;

    // ─ Cek Session Timeout (1 jam) ─
    if (sessionAge > SESSION_TIMEOUT) {
      logoutDueToExpiry('Session Anda telah expired. Silakan login kembali.');
      return;
    }

    // ─ Cek Idle Timeout (2 jam) ─
    if (idleTime > IDLE_TIMEOUT) {
      logoutDueToExpiry('Session Anda ditutup karena tidak ada aktivitas selama 2 jam. Silakan login kembali.');
      return;
    }
  }

  // ═══ ACTIVITY LISTENERS ═══
  function setupActivityListeners() {
    // User interaction events (mouse, keyboard, scroll, touch)
    const interactionEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Form input events (typing, pasting, selecting, changing values)
    const inputEvents = ['input', 'change', 'focus', 'paste', 'cut'];
    
    const allEvents = [...interactionEvents, ...inputEvents];
    
    allEvents.forEach(event => {
      document.addEventListener(event, () => {
        lastActivityTime = Date.now();
      }, true); // Use capture phase untuk catch semua event
    });

    // Extra: Manual refresh untuk form inputs yang mungkin tidak trigger events
    const formElements = document.querySelectorAll('input, textarea, select');
    formElements.forEach(elem => {
      elem.addEventListener('blur', () => {
        lastActivityTime = Date.now();
      });
    });
  }

  // ═══ LOGOUT & REDIRECT ═══
  function logoutDueToExpiry(message) {
    isLoggingOut = true;

    // Clear session
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('login_time');

    // Clear other dashboard states
    localStorage.removeItem('currentPage');
    localStorage.removeItem('custom_stock_locations');

    // Stop polling if any
    window.stopSCAutoRefresh?.();
    window.cleanupCurrentPage?.();

    // Show alert & redirect
    alert(message);
    window.location.href = '/';
  }

  // ═══ INIT ═══
  function init() {
    // Cek apakah user sudah login
    const isLoggedIn = localStorage.getItem('isLoggedin') === 'true';
    if (!isLoggedIn) return; // Tidak perlu setup kalau tidak login

    // Role 'display' tidak kena session timeout — layar monitoring 24/7
    const role = localStorage.getItem('role') || '';
    if (role === 'display') {
      console.log('📺 Session Manager: role display — no timeout applied');
      return;
    }

    console.log('✅ Session Manager initialized');

    // Setup activity listeners
    setupActivityListeners();

    // Check session setiap CHECK_INTERVAL
    sessionCheckInterval = setInterval(checkSessionValidity, CHECK_INTERVAL);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (sessionCheckInterval) clearInterval(sessionCheckInterval);
    });

    // Initial check (jika halaman dibuka, langsung cek)
    checkSessionValidity();
  }

  // ═══ PUBLIC API ═══
  window.sessionManager = {
    logout: logoutDueToExpiry,
    updateActivity: () => { lastActivityTime = Date.now(); },
  };

  // Auto-init saat DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();