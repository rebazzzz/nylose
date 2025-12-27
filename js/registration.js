// Registration form logic
document.addEventListener("DOMContentLoaded", function () {
  const personnummerInput = document.getElementById("personnummer");
  const parentFields = document.querySelectorAll(".parent-field");
  const registerBtn = document.getElementById("register-btn");
  const modal = document.getElementById("registration-modal");

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

  // Event listener for register button to show modal
  if (registerBtn) {
    registerBtn.addEventListener("click", function () {
      if (modal) {
        modal.style.display = "flex";
      }
    });
  }

  // Function to close the modal
  window.closeRegistrationModal = function () {
    if (modal) {
      modal.style.display = "none";
    }
  };

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeRegistrationModal();
      }
    });
  }
});
