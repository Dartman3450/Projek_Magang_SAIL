// ═══════════════════════════════════════════════
//   Register.js
// ═══════════════════════════════════════════════

// Role descriptions shown below the dropdown
const ROLE_HINTS = {
  utility:   'Access: Dashboard, Data Entry Utility, Reporting, Settings',
  scientist: 'Access: Dashboard, Data Entry Laboratory, Reporting, Settings',
  admin:     'Access: All pages and features',
  limbah: 'Access: Dashboard, Data entry Limbah, Reporting, Settings',
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
  btn.textContent = 'Creating account…';
  showStatus('loading', 'Registering account…');

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

    // Save user info to localStorage for fingerprint registration next
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('email',   email);
    localStorage.setItem('role',    role);

    showStatus('success', 'Account created! Redirecting to fingerprint setup…');

    // Redirect to fingerprint registration after short delay
    setTimeout(() => {
      window.location.href = '../Fingerprint_Register/fingerprint_register.html';
    }, 1000);

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    showStatus('error', 'Cannot connect to server. Is it running?');
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
}
