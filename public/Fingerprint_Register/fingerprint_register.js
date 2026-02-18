function base64urlToUint8Array(base64url) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function uint8ArrayToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function registerFingerprint() {
  console.log("CLICKED");

  // contoh user (harus sama kayak login lu)
  const user_id = 1;
  const email = "test@mail.com";

  // 1️⃣ ambil options
  const optRes = await fetch("/api/webauthn/register/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, email }),
  });

  const options = await optRes.json();

  options.challenge = base64urlToUint8Array(options.challenge);
  options.user.id = base64urlToUint8Array(options.user.id);

  // 2️⃣ munculin PIN / fingerprint
  const credential = await navigator.credentials.create({
    publicKey: options,
  });

  // 3️⃣ kirim balik ke backend
  const credentialData = {
    id: credential.id,
    rawId: uint8ArrayToBase64url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: uint8ArrayToBase64url(
        credential.response.attestationObject
      ),
      clientDataJSON: uint8ArrayToBase64url(
        credential.response.clientDataJSON
      ),
    },
  };

  const verifyRes = await fetch("/api/webauthn/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id,
      credential: credentialData,
    }),
  });

  const result = await verifyRes.json();
  alert(result.message);

  if (verifyRes.ok) {
    window.location.href = "../Homepage/Homepage.html";
  }
}
