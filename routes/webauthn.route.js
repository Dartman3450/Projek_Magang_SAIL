const express = require("express");
const router  = express.Router();
const crypto  = require("crypto");
const { pool } = require("../db");

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

// ── Ambil dari .env supaya tidak hardcode ──────────────────────
const RP_ID     = process.env.RP_ID     || "localhost";
const RP_ORIGIN = process.env.RP_ORIGIN || "http://localhost:3000";
const RP_NAME   = process.env.RP_NAME   || "SAIL System";

console.log(`[WebAuthn Route] RP_ID="${RP_ID}" | RP_ORIGIN="${RP_ORIGIN}"`);

// Challenge store per user_id (Map lebih aman dari plain object)
const challengeStore = new Map();

/* ═══════════════════════════════════════════════════════════════
   REGISTER OPTIONS
   POST /api/webauthn/register/options
═══════════════════════════════════════════════════════════════ */
router.post("/register/options", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ message: "user_id and email required" });
    }

    const userID = crypto
      .createHash("sha256")
      .update(user_id.toString())
      .digest();

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID:   RP_ID,       // ✅ dari .env
      userID,
      userName: email,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      attestationType: "none",
    });

    challengeStore.set(user_id.toString(), options.challenge);
    res.json(options);
  } catch (err) {
    console.error("REGISTER OPTIONS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   REGISTER VERIFY
   POST /api/webauthn/register/verify
═══════════════════════════════════════════════════════════════ */
router.post("/register/verify", async (req, res) => {
  try {
    const { user_id, credential } = req.body;

    if (!user_id || !credential) {
      return res.status(400).json({ message: "user_id and credential required" });
    }

    const expectedChallenge = challengeStore.get(user_id.toString());
    if (!expectedChallenge) {
      return res.status(400).json({ message: "No challenge found, restart registration" });
    }

    const verification = await verifyRegistrationResponse({
      response:          credential,
      expectedChallenge,
      expectedOrigin:    RP_ORIGIN,  // ✅ dari .env
      expectedRPID:      RP_ID,      // ✅ dari .env
    });

    if (!verification.verified) {
      return res.status(400).json({ message: "Fingerprint verification failed" });
    }

    const { credential: cred } = verification.registrationInfo;

    const credentialId      = cred.id;
    const publicKeyBase64   = Buffer.from(cred.publicKey).toString("base64url");
    const counter           = cred.counter ?? 0;

    console.log("Saving credential_id:", credentialId);

    // Cek duplikat
    const existing = await pool.query(
      `SELECT id FROM webauthn_credentials WHERE credential_id = $1`,
      [credentialId]
    );

    if (existing.rows.length > 0) {
      challengeStore.delete(user_id.toString());
      return res.json({ success: true, message: "Fingerprint already registered" });
    }

    await pool.query(
      `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter)
       VALUES ($1, $2, $3, $4)`,
      [user_id, credentialId, publicKeyBase64, counter]
    );

    challengeStore.delete(user_id.toString());
    res.json({ success: true, message: "Fingerprint registered successfully!" });
  } catch (err) {
    console.error("REGISTER VERIFY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   LOGIN OPTIONS
   POST /api/webauthn/login/options
═══════════════════════════════════════════════════════════════ */
router.post("/login/options", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id required" });
    }

    const result = await pool.query(
      `SELECT credential_id FROM webauthn_credentials WHERE user_id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "No fingerprint registered for this user" });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,  // ✅ dari .env
      allowCredentials: result.rows.map((r) => ({
        id:   r.credential_id,
        type: "public-key",
      })),
      userVerification: "required",
      timeout: 60000,
    });

    challengeStore.set(user_id.toString(), options.challenge);
    res.json(options);
  } catch (err) {
    console.error("LOGIN OPTIONS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   LOGIN VERIFY
   POST /api/webauthn/login/verify
═══════════════════════════════════════════════════════════════ */
router.post("/login/verify", async (req, res) => {
  try {
    const { user_id, id, rawId, type, response } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id required" });
    }

    const expectedChallenge = challengeStore.get(user_id.toString());
    if (!expectedChallenge) {
      return res.status(400).json({ message: "No challenge found, restart login" });
    }

    const result = await pool.query(
      `SELECT credential_id, public_key, counter
       FROM webauthn_credentials
       WHERE user_id = $1 AND credential_id = $2`,
      [user_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Credential not found" });
    }

    const storedCred = result.rows[0];

    const verification = await verifyAuthenticationResponse({
      response: { id, rawId, type, response },
      expectedChallenge,
      expectedOrigin: RP_ORIGIN,  // ✅ dari .env
      expectedRPID:   RP_ID,      // ✅ dari .env
      credential: {
        id:        storedCred.credential_id,
        publicKey: Buffer.from(storedCred.public_key, "base64url"),
        counter:   storedCred.counter,
      },
    });

    if (!verification.verified) {
      return res.status(401).json({ success: false, message: "Fingerprint not registered!" });
    }

    // Update counter (cegah replay attack)
    await pool.query(
      `UPDATE webauthn_credentials SET counter = $1 WHERE credential_id = $2`,
      [verification.authenticationInfo.newCounter, id]
    );

    challengeStore.delete(user_id.toString());

    const userResult = await pool.query(
      `SELECT id, email FROM users WHERE id = $1`,
      [user_id]
    );

    res.json({
      success: true,
      message: "Login Success!",
      user:    userResult.rows[0],
    });
  } catch (err) {
    console.error("LOGIN VERIFY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;