// ═══════════════════════════════════════════════
//   Register.js
// ═══════════════════════════════════════════════

// Role descriptions shown below the dropdown
const ROLE_HINTS = {
  utility:    'Akses: Dashboard IoT, ProData Entry Utility, Reporting, Settings',
  scientist:  'Akses: Dashboard IoT, Data Entry Laboratorium, Reporting, Settings',
  Produksi:   'Akses: Dashboard IoT, Data Entry Production, Reporting, Settings',
  PPIC:       'Akses: Dashboard IoT,On going project , Completed Projects, Data Entry Production, Data Entry Utility , Data Entry Laboratorium, Data Entry LimbahReporting, Settings',
  limbah:     'Akses: Dashboard IoT, Data Entry Limbah, Reporting, Settings',
  superadmin: 'Akses: Semua halaman dan fitur (level tertinggi)',
};

// Updates the hint text when user changes the role dropdown
function updateRoleHint() {
  const role = document.getElementById('role').value;
  document.getElementById('role-hint').textContent = ROLE_HINTS[role] || '';
}

// Show inline status message (replaces alert popups)
function showStatus(type, msg) {
  const el = document.getElementById('reg-status');
  el.className = 'reg-status ' + type;
  el.textContent = msg;
}

// Main register function — runs when form is submitted
async function register(event) {
  event.preventDefault(); // stop page from reloading on form submit

  const email           = document.getElementById('email').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const role            = document.getElementById('role').value;
  const btn             = document.getElementById('btn-register');

  if (!email || !password || !confirmPassword) {
    showStatus('error', '❌ All fields are required');
    return;
  }

  if (password.length < 6) {
    showStatus('error', '❌ Password must be at least 6 characters');
    return;
  }

  if (password !== confirmPassword) {
    showStatus('error', '❌ Passwords do not match');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Membuat akun…';
  showStatus('loading', '⏳ Mendaftarkan akun…');

  try {
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      showStatus('error', '❌ ' + (data.message || 'Registration failed'));
      btn.disabled = false;
      btn.textContent = 'Create Account →';
      return;
    }

    // Jangan set localStorage — user harus login manual dulu di homepage
    // Bersihkan kalau ada sisa session lama
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('role');

    showStatus('success', '✅ Akun berhasil dibuat! Silakan login dengan email dan password Anda.');

    // Redirect ke homepage (login form) setelah 1.5 detik
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    showStatus('error', '❌ Tidak bisa terhubung ke server. Pastikan server berjalan.');
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
}