// Registration form logic
document.addEventListener("DOMContentLoaded", function () {
  const personnummerInput = document.getElementById("personnummer");
  const parentFields = document.querySelectorAll(".parent-field");
  const registerBtn = document.getElementById("register-btn");
  const registrationForm = document.querySelector(".registration-form");

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
        password: "temp_password_" + Date.now(), // Temporary password
      };

      // Disable button
      registerBtn.disabled = true;
      registerBtn.textContent = "Registrerar...";

      try {
        // Register user
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationData),
        });

        const registerResult = await registerResponse.json();

        if (registerResponse.ok) {
          // Get membership ID for payment
          const membershipResponse = await fetch("/api/member/profile", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${registerResult.token}`,
            },
          });

          if (membershipResponse.ok) {
            const membershipData = await membershipResponse.json();
            const membership = membershipData.membership;

            // Process payment
            const paymentResponse = await fetch("/api/auth/payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${registerResult.token}`,
              },
              body: JSON.stringify({
                membership_id: membership.id,
                payment_method: formData.get("payment-method"),
              }),
            });

            if (paymentResponse.ok) {
              // Success - redirect to success page or show success message
              alert(
                "Registrering och betalning genomförd! Kontrollera din e-post för bekräftelse.",
              );
              window.location.href = "index.html";
            } else {
              alert(
                "Registrering lyckades men betalning misslyckades. Kontakta oss för hjälp.",
              );
            }
          } else {
            alert(
              "Registrering lyckades men kunde inte hitta medlemskap. Kontakta oss för hjälp.",
            );
          }
        } else {
          alert("Registrering misslyckades: " + registerResult.error);
        }
      } catch (error) {
        console.error("Registration error:", error);
        alert("Ett fel uppstod. Försök igen senare.");
      } finally {
        // Re-enable button
        registerBtn.disabled = false;
        registerBtn.textContent = "Skicka anmälan";
      }
    });
  }
});
