// Registration form logic
document.addEventListener("DOMContentLoaded", function () {
  const personnummerInput = document.getElementById("personnummer");
  const parentFields = document.querySelectorAll(".parent-field");
  const registerBtn = document.getElementById("register-btn");
  const registrationForm = document.querySelector(".registration-form");

  // Helper function to calculate age
  function calculateAgeFromPersonnummer(personnummer) {
    const digits = personnummer.replace(/[^0-9]/g, "");
    if (digits.length !== 12) return null;
    const birthDateStr = digits.substring(0, 8);
    const year = parseInt(birthDateStr.substring(0, 4));
    const month = parseInt(birthDateStr.substring(4, 6)) - 1;
    const day = parseInt(birthDateStr.substring(6, 8));
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  // Notification functions
  function showNotification(message, type = "info", title = "Meddelande") {
    const modal = document.getElementById("notification-modal");
    const titleEl = document.getElementById("notification-title");
    const messageEl = document.getElementById("notification-message");
    const iconEl = document.getElementById("notification-icon");

    titleEl.textContent = title;
    messageEl.textContent = message;

    iconEl.className = "notification-icon";
    let iconClass = "fas fa-info-circle";
    switch (type) {
      case "success":
        iconClass = "fas fa-check-circle";
        iconEl.classList.add("success");
        break;
      case "error":
        iconClass = "fas fa-exclamation-triangle";
        iconEl.classList.add("error");
        break;
      case "warning":
        iconClass = "fas fa-exclamation-circle";
        iconEl.classList.add("warning");
        break;
      default:
        iconEl.classList.add("info");
    }
    iconEl.innerHTML = `<i class="${iconClass}"></i>`;

    document.getElementById("notification-confirm-btn").onclick =
      closeNotificationModal;
    modal.style.display = "flex"; // Changed to flex for better centering
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.zIndex = "9999";
  }

  function closeNotificationModal() {
    document.getElementById("notification-modal").style.display = "none";
  }

  function showSuccess(message, title = "Lyckades") {
    showNotification(message, "success", title);
  }

  function showError(message, title = "Fel") {
    showNotification(message, "error", title);
  }

  function showWarning(message, title = "Varning") {
    showNotification(message, "warning", title);
  }

  if (personnummerInput) {
    personnummerInput.addEventListener("input", function (e) {
      // Allow only digits
      let value = e.target.value.replace(/[^0-9]/g, "");

      // Limit to 12 digits
      if (value.length > 12) {
        value = value.substring(0, 12);
      }

      // Format as YYYYMMDD-XXXX when complete
      if (value.length >= 8) {
        value = value.substring(0, 8) + "-" + value.substring(8);
      }

      e.target.value = value;

      // Calculate age from personnummer if 12 digits
      if (value.replace(/-/g, "").length === 12) {
        const digits = value.replace(/-/g, "");
        const birthDateStr = digits.substring(0, 8);
        const year = parseInt(birthDateStr.substring(0, 4));
        const month = parseInt(birthDateStr.substring(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(birthDateStr.substring(6, 8));
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        // Show/hide parent fields
        if (age < 18) {
          parentFields.forEach((field) => {
            field.style.display = "flex";
            const input = field.querySelector("input");
            if (input) input.required = true;
          });
        } else {
          parentFields.forEach((field) => {
            field.style.display = "none";
            const input = field.querySelector("input");
            if (input) input.required = false;
          });
        }
      } else {
        // Hide parent fields if personnummer is incomplete
        parentFields.forEach((field) => {
          field.style.display = "none";
          const input = field.querySelector("input");
          if (input) input.required = false;
        });
      }
    });
  }

  // Handle form submission
  if (registrationForm && registerBtn) {
    registrationForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(registrationForm);
      const personnummer = formData.get("personnummer").replace(/[^0-9-]/g, "");
      const age = calculateAgeFromPersonnummer(personnummer);
      const isMinor = age !== null && age < 18;

      const registrationData = {
        first_name: formData.get("firstname"),
        last_name: formData.get("lastname"),
        personnummer: personnummer,
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
      };

      // Add parent data if minor
      if (isMinor) {
        registrationData.parent_name = formData.get("parent-name");
        registrationData.parent_lastname = formData.get("parent-lastname");
        registrationData.parent_phone = formData.get("parent-phone");
      }

      // Disable button
      registerBtn.disabled = true;
      registerBtn.textContent = "Registrerar...";

      try {
        // Register user
        const registerResponse = await fetch(
          "http://localhost:3001/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(registrationData),
          },
        );

        const registerResult = await registerResponse.json();

        if (registerResponse.ok) {
          // Success - show success message
          showSuccess(
            "Registrering genomförd! Kontrollera din e-post för bekräftelse.",
            "Registrering lyckades",
          );
        } else {
          showError(
            "Registrering misslyckades: " + registerResult.error,
            "Registreringsfel",
          );
        }
      } catch (error) {
        console.error("Registration error:", error);
        showError("Ett fel uppstod. Försök igen senare.", "Fel");
      } finally {
        // Re-enable button
        registerBtn.disabled = false;
        registerBtn.textContent = "Skicka anmälan";
      }
    });
  }
});
