/**
 * COMPONENTS.JS
 *
 * This script loads centralized HTML components (navbar and footer) into all pages.
 * It uses fetch API to load the component files and inject them into the page.
 *
 * Usage: Include this script in the <head> section of all HTML pages with defer attribute.
 */

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
  }, 100);
});
