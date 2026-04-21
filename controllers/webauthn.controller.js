const {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const db = require("../db");

// ── Ambil dari .env supaya tidak perlu ganti kode saat pindah lokasi ──
const RP_ID     = process.env.RP_ID     || "localhost";
const RP_ORIGIN = process.env.RP_ORIGIN || "http://localhost:3000";

console.log(`[WebAuthn] RP_ID="${RP_ID}" | RP_ORIGIN="${RP_ORIGIN}"`);

// Simpan challenge per-user pakai Map supaya multi-user tidak saling tindih
// (lebih aman dari variabel global tunggal)
const challengeStore = new Map(); // key: email, value: challenge string

// ── POST /api/webauthn/login-options ────────────────────────────
exports.loginOptions = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email diperlukan" });
  }

  try {
    const user = await db.pool.query(
      `SELECT u.id, a.credential_id
       FROM users u
       JOIN authenticators a ON u.id = a.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan atau belum register fingerprint" });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user.rows.map((r) => ({
        id: Buffer.from(r.credential_id, "base64"),
        type: "public-key",
      })),
      userVerification: "required",
      timeout: 60000,
    });

    // Simpan challenge per email
    challengeStore.set(email, options.challenge);

    // Kirim email ke client supaya bisa dikirim balik saat verify
    res.json({ ...options, email });
  } catch (err) {
    console.error("[WebAuthn] loginOptions error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/webauthn/login-verify ─────────────────────────────
exports.loginVerify = async (req, res) => {
  // Frontend harus kirim email bersama response WebAuthn
  const { email, ...webauthnResponse } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email diperlukan untuk verifikasi" });
  }

  const expectedChallenge = challengeStore.get(email);
  if (!expectedChallenge) {
    return res.status(400).json({ message: "Challenge tidak ditemukan, ulangi login" });
  }

  try {
    // Ambil credential dari DB untuk verifikasi
    const credResult = await db.pool.query(
      `SELECT a.credential_id, a.public_key, a.counter
       FROM authenticators a
       JOIN users u ON u.id = a.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (credResult.rows.length === 0) {
      return res.status(404).json({ message: "Credential tidak ditemukan" });
    }

    const authenticator = credResult.rows[0];

    const verification = await verifyAuthenticationResponse({
      response: webauthnResponse,
      expectedChallenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credential_id, "base64"),
        credentialPublicKey: Buffer.from(authenticator.public_key, "base64"),
        counter: authenticator.counter,
      },
    });

    if (!verification.verified) {
      return res.status(401).json({ message: "Fingerprint gagal diverifikasi" });
    }

    // Update counter untuk mencegah replay attack
    await db.pool.query(
      `UPDATE authenticators SET counter = $1 WHERE credential_id = $2`,
      [verification.authenticationInfo.newCounter, authenticator.credential_id]
    );

    // Hapus challenge setelah dipakai (one-time use)
    challengeStore.delete(email);

    // Ambil data user untuk response
    const userResult = await db.pool.query(
      `SELECT id, email, name FROM users WHERE email = $1`, [email]
    );

    res.json({
      success: true,
      message: "LOGIN BERHASIL 🔓",
      user: userResult.rows[0] || null,
    });
  } catch (err) {
    console.error("[WebAuthn] loginVerify error:", err.message);
    res.status(500).json({ message: err.message });
  }
};