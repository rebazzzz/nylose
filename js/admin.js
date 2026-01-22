/**
 * ADMIN.JS
 *
 * JavaScript for admin login functionality
 */

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("admin-login-form");
  const errorMessage = document.getElementById("error-message");
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Clear previous error
    errorMessage.textContent = "";

    // Basic validation
    if (!email || !password) {
      errorMessage.textContent = "Vänligen fyll i alla fält.";
      return;
    }

    // Disable button during submission
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Loggar in...';

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Check if user is admin
        if (data.user.role === "admin") {
          // Redirect to admin dashboard or reload page
          window.location.href = "admin-dashboard.html"; // Assuming there's a dashboard
        } else {
          errorMessage.textContent = "Du har inte administratörsbehörighet.";
        }
      } else {
        errorMessage.textContent = data.error || "Inloggning misslyckades.";
      }
    } catch (error) {
      console.error("Login error:", error);
      errorMessage.textContent = "Ett fel uppstod. Försök igen senare.";
    } finally {
      // Re-enable button
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Logga in';
    }
  });

  // Check if already logged in
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (token && user && user.role === "admin") {
    // Already logged in as admin, redirect
    window.location.href = "admin-dashboard.html";
  }
});
