/**
 * COMPONENTS.JS
 *
 * This script loads centralized HTML components (navbar and footer) into all pages.
 * It uses fetch API to load the component files and inject them into the page.
 *
 * Usage: Include this script in the <head> section of all HTML pages with defer attribute.
 */

// Handle login/logout button click
function handleLoginClick() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (token && user) {
    // User is logged in
    if (user.role === "admin") {
      // Redirect admin to dashboard
      window.location.href = "admin.html";
    } else {
      // Show logout confirmation for regular users
      if (confirm("Är du säker på att du vill logga ut?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        location.reload();
      }
    }
  } else {
    // User is not logged in, show login modal
    showLoginModal();
  }
}

// Show login modal
function showLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }
}

function closeLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// Handle login form submission
async function handleLoginSubmit(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Close modal and update UI
      closeLoginModal();
      updateProfileButton();

      // Redirect based on user role
      if (data.user.role === "admin") {
        window.location.href = "admin.html";
      } else {
        // Stay on current page or redirect to member dashboard if exists
        location.reload();
      }
    } else {
      alert("Inloggning misslyckades: " + data.error);
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Ett fel uppstod vid inloggning. Försök igen senare.");
  }
}

// Update profile button based on login status
function updateProfileButton() {
  const profileButton = document.getElementById("profile-button");
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (profileButton) {
    if (token && user) {
      profileButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#000000" stroke-width="2"/>
          <path d="M20 22C20 18.6863 16.4183 16 12 16C7.58172 16 4 18.6863 4 22" stroke="#000000" stroke-width="2"/>
        </svg>
        ${user.first_name}
      `;
      profileButton.title = "Logga ut";
    } else {
      profileButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#000000" stroke-width="2"/>
          <path d="M20 22C20 18.6863 16.4183 16 12 16C7.58172 16 4 18.6863 4 22" stroke="#000000" stroke-width="2"/>
        </svg>
        Logga in
      `;
      profileButton.title = "Logga in";
    }
  }
}

// Function to load HTML component
async function loadComponent(elementId, componentPath) {
  try {
    const response = await fetch(componentPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${componentPath}`);
    }
    const html = await response.text();
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
  } catch (error) {
    console.error("Error loading component:", error);
  }
}

// Function to set active navigation link
function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.classList.remove("current");
    const linkPage = link.getAttribute("href").split("#")[0] || "index.html";

    if (
      linkPage === currentPage ||
      (currentPage === "" && linkPage === "index.html")
    ) {
      link.classList.add("current");
    }
  });

  // Hide "Hem" link on index page
  if (currentPage === "index.html") {
    const hemLink = document.querySelector(".nav-home");
    if (hemLink) {
      hemLink.parentElement.style.display = "none";
    }
  }
}

// Load components when DOM is ready
document.addEventListener("DOMContentLoaded", async function () {
  // Load navbar and footer
  await loadComponent("navbar-placeholder", "navbar.html");
  await loadComponent("footer-placeholder", "footer.html");

  // Set active navigation link after navbar is loaded
  setTimeout(setActiveNavLink, 100);

  // Add profile button event listener after navbar is loaded
  setTimeout(() => {
    const profileButton = document.getElementById("profile-button");
    if (profileButton) {
      profileButton.addEventListener("click", handleLoginClick);
      updateProfileButton(); // Update button text based on login status
    }
  }, 100);

  // Add event listeners for nav links after navbar is loaded
  setTimeout(() => {
    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        document.querySelector(".nav-links").classList.remove("active");
        document.querySelector(".hamburger").classList.remove("active");
        document.querySelector(".menu-overlay").classList.remove("active");
        document
          .querySelector(".hamburger")
          .setAttribute("aria-expanded", "false");
      });
    });

    // Add modal event listener after navbar is loaded
    const modal = document.getElementById("login-modal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) {
          closeLoginModal();
        }
      });
    }

    // Add login form event listener
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginSubmit);
    }
  }, 100);
});
