async function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login gagal");
      return;
    }

    // ✅ SIMPAN DATA LOGIN
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("login_email", data.email);

    alert("Login sukses 🔓");

    localStorage.setItem("user_id", data.user.id);
    localStorage.setItem("email", data.user.email);

// lanjut fingerprint login / dashboard
window.location.href = "../Fingerprint_Register/fingerprint_register.html";

    // ✅ LANGSUNG KE FINGERPRINT LOGIN
    window.location.href = "../Fingerprint_Login/fingerprint_login.html";

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    alert("Server mati / ga nyambung");
  }
}
