// Registration form logic
document.addEventListener("DOMContentLoaded", function () {
  const personnummerInput = document.getElementById("personnummer");
  const parentFields = document.querySelectorAll(".parent-field");
  const registerBtn = document.getElementById("register-btn");
  const registrationForm = document.querySelector(".registration-form");

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
    modal.style.display = "block";
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

  if (personnummerInput) {
    const mask = "YYYYMMDD-XXXX";
    personnummerInput.value = mask;
    let pos = 0;

    personnummerInput.addEventListener("keydown", function (e) {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        if (pos < mask.length && mask[pos] !== "-") {
          let newValue =
            personnummerInput.value.substring(0, pos) +
            e.key +
            personnummerInput.value.substring(pos + 1);
          personnummerInput.value = newValue;
          pos++;
          if (pos < mask.length && mask[pos] === "-") {
            pos++;
          }
          personnummerInput.setSelectionRange(pos, pos);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (pos > 0) {
          if (pos < mask.length && mask[pos - 1] === "-") {
            pos--;
          }
          pos--;
          let char = mask[pos];
          let newValue =
            personnummerInput.value.substring(0, pos) +
            char +
            personnummerInput.value.substring(pos + 1);
          personnummerInput.value = newValue;
          personnummerInput.setSelectionRange(pos, pos);
        }
      } else {
        e.preventDefault();
      }

      // Calculate age from personnummer if at least 8 digits
      let digits = personnummerInput.value.replace(/[^0-9]/g, "");
      if (digits.length >= 8) {
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
      const registrationData = {
        first_name: formData.get("firstname"),
        last_name: formData.get("lastname"),
        personnummer: formData.get("personnummer").replace(/[^0-9-]/g, ""),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        password: formData.get("password"),
      };

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
          // Get membership ID for payment
          const membershipResponse = await fetch(
            "http://localhost:3001/api/member/profile",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${registerResult.token}`,
              },
            },
          );

          if (membershipResponse.ok) {
            const membershipData = await membershipResponse.json();
            const membership = membershipData.membership;

            // Process payment
            const paymentResponse = await fetch(
              "http://localhost:3001/api/auth/payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${registerResult.token}`,
                },
                body: JSON.stringify({
                  membership_id: membership.id,
                  payment_method: formData.get("payment-method"),
                }),
              },
            );

            if (paymentResponse.ok) {
              // Success - redirect to success page or show success message
              showSuccess(
                "Registrering och betalning genomförd! Kontrollera din e-post för bekräftelse.",
                "Registrering lyckades",
              );
              window.location.href = "index.html";
            } else {
              showError(
                "Registrering lyckades men betalning misslyckades. Kontakta oss för hjälp.",
                "Betalningsfel",
              );
            }
          } else {
            showError(
              "Registrering lyckades men kunde inte hitta medlemskap. Kontakta oss för hjälp.",
              "Medlemskapsfel",
            );
          }
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
