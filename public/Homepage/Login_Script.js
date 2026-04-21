// ═══════════════════════════════════════════════
//   Login_Script.js — SAIL Login Handler
// ═══════════════════════════════════════════════

// Auto-redirect: kalau sudah login, langsung ke dashboard
(function autoRedirect() {
  if (localStorage.getItem('isLoggedin') === 'true' && localStorage.getItem('user_id')) {
    window.location.href = '/dashboard';
  }
})();

// Flag agar tidak submit dua kali (mencegah 401 berulang)
let _loginInProgress = false;

// Pasang listener setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', login);
  }
});

// Tampilkan status inline
function showLoginStatus(type, msg) {
  const el = document.getElementById('login-status');
  if (!el) return;
  el.className = 'login-status ' + type;
  el.textContent = msg;
  el.style.display = 'flex';
}

// Main login function
async function login(event) {
  if (event) event.preventDefault();

  // Jangan jalankan kalau sedang proses — ini yang cegah 401 berulang
  if (_loginInProgress) return;

  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const btn      = document.getElementById('btn-login');

  if (!email || !password) {
    showLoginStatus('error', '❌ Email dan password wajib diisi');
    return;
  }

  _loginInProgress = true;
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
  showLoginStatus('loading', '⏳ Memeriksa akun…');

  try {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showLoginStatus('error', '❌ ' + (data.message || 'Email atau password salah'));
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
      _loginInProgress = false;
      return;
    }

    // Simpan session
    localStorage.setItem('isLoggedin', 'true');
    localStorage.setItem('user_id',    String(data.user_id));
    localStorage.setItem('email',      data.email);
    localStorage.setItem('role',       data.role);

    showLoginStatus('success', '✅ Login berhasil! Mengalihkan ke dashboard…');

    // Redirect sekali — tidak perlu reset flag karena halaman berganti
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 800);

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    showLoginStatus('error', '❌ Tidak bisa terhubung ke server. Pastikan server berjalan.');
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
    _loginInProgress = false;
  }
}