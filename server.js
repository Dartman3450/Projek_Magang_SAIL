const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 WAJIB — serve folder public
app.use(express.static(path.join(__dirname, "public")));

// routes API
app.use("/api/webauthn", require("./routes/webauthn.route"));
app.use("/api/auth", require("./routes/auth.route"));

app.listen(3000, () => {
  console.log("🔥 Server running at http://localhost:3000");
});
