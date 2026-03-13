// ═══════════════════════════════════════════════
//   Fingerprint_login.js
// ═══════════════════════════════════════════════

// ── Helper: show inline status message ──────────
// Replaces all alert() popups with a styled in-page notification
// Looks for an element with id="fp-status" in your HTML
function showStatus(type, msg) {
  const el = document.getElementById('fp-status');
  if (!el) return; // safety check — if element doesn't exist, skip
  el.className = 'fp-status ' + type;
  el.textContent = msg;
  el.style.display = 'flex';
}

// ── Helper: Convert base64url → Uint8Array ───────
// WebAuthn requires binary data (ArrayBuffer), but the server sends base64url strings
// This function converts the string back into binary so the browser understands it
function base64urlToUint8Array(base64url) {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64  = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── Helper: Convert Uint8Array → base64url ───────
// After the fingerprint scan, the browser returns binary data
// This converts it back to a string so we can send it to the server as JSON
function uint8ArrayToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Main fingerprint login function ─────────────
async function loginFingerprint() {
  const user_id = localStorage.getItem('user_id');

  // Make sure user logged in with email/password first (Step 1)
  if (!user_id) {
    showStatus('error', '❌ Session not found! Please login with email & password first.');
    return;
  }

  try {
    showStatus('loading', '⏳ Preparing fingerprint challenge…');

    // STEP 1 — Ask server for a challenge (a random string to sign with fingerprint)
    const res = await fetch('/api/webauthn/login/options', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ user_id }),
    });

    if (!res.ok) {
      const err = await res.json();
      showStatus('error', '❌ ' + (err.message || 'Failed to get challenge from server'));
      return;
    }

    const options = await res.json();

    // STEP 2 — Convert challenge and credential IDs from base64url → binary
    // (browser needs binary format, not strings)
    options.challenge          = base64urlToUint8Array(options.challenge);
    options.allowCredentials   = options.allowCredentials.map(c => ({
      ...c,
      id: base64urlToUint8Array(c.id),
    }));

    showStatus('loading', '👆 Please scan your fingerprint…');

    // STEP 3 — Trigger the browser's fingerprint / Windows Hello prompt
    const assertion = await navigator.credentials.get({ publicKey: options });

    showStatus('loading', '⏳ Verifying fingerprint…');

    // STEP 4 — Send the signed fingerprint data back to server for verification
    const verifyRes = await fetch('/api/webauthn/login/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        user_id,
        id:     assertion.id,
        rawId:  uint8ArrayToBase64url(assertion.rawId),
        type:   assertion.type,
        response: {
          authenticatorData: uint8ArrayToBase64url(assertion.response.authenticatorData),
          clientDataJSON:    uint8ArrayToBase64url(assertion.response.clientDataJSON),
          signature:         uint8ArrayToBase64url(assertion.response.signature),
          userHandle:        assertion.response.userHandle
            ? uint8ArrayToBase64url(assertion.response.userHandle)
            : null,
        },
      }),
    });

    const result = await verifyRes.json();

    if (verifyRes.ok && result.success) {
      // ✅ Success — show message then redirect to dashboard
      showStatus('success', '✅ ' + (result.message || 'Login successful!'));
      setTimeout(() => {
        window.location.href = '../Dashboard/dashboard.html';
      }, 800);
    } else {
      showStatus('error', '❌ ' + (result.message || 'Fingerprint login failed!'));
    }

  } catch (err) {
    console.error('Login fingerprint error:', err);

    if (err.name === 'NotAllowedError') {
      // User cancelled the Windows Hello / fingerprint prompt
      showStatus('error', '❌ Fingerprint not recognized or cancelled. Please try again.');
    } else {
      showStatus('error', '❌ An error occurred: ' + err.message);
    }
  }
}

// ── Bind button click ────────────────────────────
document.getElementById('loginBtn').addEventListener('click', loginFingerprint);