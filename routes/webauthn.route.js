const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const pool = require("../db");

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

let currentChallenge = null;

/* ================= REGISTER OPTIONS ================= */
router.post("/register/options", async (req, res) => {
  const { user_id, email } = req.body;

  const userID = crypto
    .createHash("sha256")
    .update(user_id.toString())
    .digest();

  const options = await generateRegistrationOptions({
    rpName: "SAIL System",
    rpID: "localhost",
    userID,
    userName: email,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
    attestationType: "none",
  });

  currentChallenge = options.challenge;
  res.json(options);
});

/* ================= REGISTER VERIFY ================= */
router.post("/register/verify", async (req, res) => {
  const { user_id, credential } = req.body;

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: currentChallenge,
    expectedOrigin: "http://localhost:3000",
    expectedRPID: "localhost",
  });

  if (!verification.verified) {
    return res.status(400).json({ message: "Fingerprint failed" });
  }

  const { credential: cred, counter } =
    verification.registrationInfo;

  await pool.query(
    `INSERT INTO webauthn_credentials
     (user_id, credential_id, public_key, counter)
     VALUES ($1,$2,$3,$4)`,
    [
      user_id,
      cred.id,
      Buffer.from(cred.publicKey).toString("base64"),
      counter ?? 0,
    ]
  );

  res.json({ success: true });
});

/* ================= LOGIN OPTIONS ================= */
router.post("/login/options", async (req, res) => {
  const { user_id } = req.body;

  const result = await pool.query(
    `SELECT credential_id FROM webauthn_credentials WHERE user_id=$1`,
    [user_id]
  );

  const options = {
    challenge: crypto.randomBytes(32),
    allowCredentials: result.rows.map(r => ({
      id: Buffer.from(r.credential_id, "base64"),
      type: "public-key",
    })),
    userVerification: "required",
    timeout: 60000,
  };

  currentChallenge = options.challenge;
  res.json(options);
});

/* ================= LOGIN VERIFY ================= */
router.post("/login/verify", async (req, res) => {
  const { credential } = req.body;

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: currentChallenge,
    expectedOrigin: "http://localhost:3000",
    expectedRPID: "localhost",
  });

  if (!verification.verified) {
    return res.status(401).json({ success: false });
  }

  res.json({ success: true });
});

/* ======================================================
   LOGIN OPTIONS
====================================================== */
router.post("/login/options", async (req, res) => {
  try {
    const { user_id } = req.body;

    const result = await pool.query(
      `SELECT credential_id FROM webauthn_credentials WHERE user_id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "No fingerprint registered" });
    }

    const options = {
      challenge: crypto.randomBytes(32).toString("base64url"),
      allowCredentials: result.rows.map(r => ({
        id: r.credential_id,
        type: "public-key",
      })),
      userVerification: "required",
      timeout: 60000,
    };

    currentChallenge = options.challenge;
    res.json(options);
  } catch (err) {
    console.error("LOGIN OPTIONS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   LOGIN VERIFY
====================================================== */
router.post("/login/verify", async (req, res) => {
  try {
    const { credential } = req.body;

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: currentChallenge,
      expectedOrigin: "http://localhost:3000",
      expectedRPID: "localhost",
    });

    if (!verification.verified) {
      return res.status(401).json({ message: "Fingerprint invalid" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("LOGIN VERIFY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
