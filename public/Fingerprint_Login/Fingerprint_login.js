function base64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Fixed = (base64 + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(base64Fixed);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function loginFingerprint() {
  const user_id = localStorage.getItem("user_id");

  if (!user_id) {
    alert("User belum login");
    return;
  }

  // 1️⃣ ambil options
  const res = await fetch("/api/webauthn/login/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id }),
  });

  const options = await res.json();

  options.challenge = base64ToUint8Array(options.challenge);
  options.allowCredentials = options.allowCredentials.map(c => ({
    ...c,
    id: base64ToUint8Array(c.id),
  }));

  // 2️⃣ trigger fingerprint
  const credential = await navigator.credentials.get({
    publicKey: options,
  });

  // 3️⃣ verify ke backend
  const verify = await fetch("/api/webauthn/login/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });

  if (verify.ok) {
    window.location.href = "../Dashboard/dashboard.html";
  } else {
    alert("Fingerprint login failed");
  }
}

document
  .getElementById("loginBtn")
  .addEventListener("click", loginFingerprint);
