function loadPage(page) {
  const content = document.getElementById("content");

  if (!content) {
    console.error("Element #content not found");
    return;
  }

  const pages = {
    dashboard: `
  <h1>Informasi Air</h1>
  <p>Water Steam Generator information :</p>
  <p>PH air = ".."</p>
  <p>TDS air = ".."</p>
  <p>Alkalinity = ".."</p>
  <p>Volume air = ".."</p>

  <h2>Treated/Slurry water :</h2>
  <p>PH air = ".."</p>
  <p>TDS air = ".."</p>
  <p>Alkalinity = ".."</p>
  <p>Volume air = ".."</p>

  <h3>Processed Water:</h3>
  <p>Soft water<br>
     pH = ".."<br>
     Hardness = ".."</p>
  <p>Water filter<br>
     pH = ".."<br>
     Hardness = ".."</p>
  <p>Volume air = ".."</p>
    `,

    "recent-project": `
      <h1>Recent Project</h1>
      <p>List of recent projects</p>
    `,

    "completed-project": `
      <h1>Completed Project</h1>
      <p>Finished projects</p>
    `,

    "ongoing-project": `
      <h1>On Going Project</h1>
      <p>Current active projects</p>
    `,

     Dashboard1: `
      <h1>Informasi Air</h1>
      <p>Water Steam Generator information :</p>
    `,

    production: `
      <h1>Data Entry Production</h1>
    `,

    utility: `
      <h1>Data Entry Utility</h1>
    `,

    laboratorium: `
      <h1>Data Entry Laboratorium</h1>
    `,

    limbah: `
      <h1>Data Entry Limbah</h1>
    `,

    reporting: `
      <h1>Customer Service</h1>
      <p>Form Complaint</p>
    `,

    "change-email":`
      <h1>change your email here!</h1>
    `,
    "change-password":`
      <h1>change your password here!</h1>
    `
  };

  content.innerHTML = pages[page] || `<h1>404</h1><p>Page not found</p>`;
}

function toggleSubmenu(element) {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector(".arrow");

  if (!submenu) return;

  submenu.classList.toggle("show");
  arrow.classList.toggle("rotate");
}

function changePassword() {
  const username = localStorage.getItem("loggedInUser");
  
  if (!username) {
    alert("Sesi berakhir, silakan login kembali.");
    window.location.href = "../Homepage/Homepage.html";
    return;
  }

  const newPassword = prompt("Enter new password");

  if (newPassword) {
    if (newPassword.length < 6) {
      alert("Password need to be at least 6 character!");
      return;
    }

    database.ref('users/' + username).update({
      password: newPassword
    })
    .then(() => {
      alert("Password successfully updated to firebase!");
      
      const localData = JSON.parse(localStorage.getItem(username));
      if (localData) {
        localData.password = newPassword;
        localStorage.setItem(username, JSON.stringify(localData));
      }
    })
    .catch((error) => {
      console.error("Failed to update password!", error);
      alert("Error. Failed to connect to database!");
    });
  }
}

function confirmLogout() {
  const yakin = confirm("Are you sure to logout?");
  if(yakin) {
    localStorage.removeItem('isLoggedin');
    window.location.href = "Logout_Success.html";
  }
}