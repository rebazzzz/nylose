// FAQ toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", function () {
      const faqItem = this.parentElement;
      const isActive = faqItem.classList.contains("active");

      // Close all other FAQ items
      document.querySelectorAll(".faq-item").forEach((item) => {
        item.classList.remove("active");
      });

      // Toggle the clicked item
      if (!isActive) {
        faqItem.classList.add("active");
      }
    });
  });

  // Load contact information
  loadContactInfo();
});

// Load contact information dynamically
async function loadContactInfo() {
  try {
    const response = await fetch(
      "http://localhost:3001/api/public/contact-info",
    );
    if (!response.ok) {
      console.warn("Failed to load contact information");
      return;
    }
    const contacts = await response.json();

    // Separate phones and emails
    const phones = contacts.filter((contact) => contact.type === "phone");
    const emails = contacts.filter((contact) => contact.type === "email");

    // Load phones
    const phonesContainer = document.getElementById("contact-phones");
    if (phones.length > 0) {
      phonesContainer.innerHTML = phones
        .sort((a, b) => a.display_order - b.display_order)
        .map((phone) => `<p><a href="${phone.href}">${phone.value}</a></p>`)
        .join("");
    } else {
      phonesContainer.innerHTML = "<p>Inga telefonnummer tillgängliga</p>";
    }

    // Load emails
    const emailsContainer = document.getElementById("contact-emails");
    if (emails.length > 0) {
      emailsContainer.innerHTML = emails
        .sort((a, b) => a.display_order - b.display_order)
        .map((email) => `<p><a href="${email.href}">${email.value}</a></p>`)
        .join("");
    } else {
      emailsContainer.innerHTML = "<p>Inga e-postadresser tillgängliga</p>";
    }
  } catch (error) {
    console.error("Error loading contact information:", error);
    // Fallback to default contact info if API fails
    document.getElementById("contact-phones").innerHTML = `
      <p><a href="tel:072-910 25 75">072-910 25 75</a></p>
      <p><a href="tel:070-042 42 21">070-042 42 21</a></p>
    `;
    document.getElementById("contact-emails").innerHTML = `
      <p><a href="mailto:nylosesportcenter@gmail.com">nylosesportcenter@gmail.com</a></p>
    `;
  }
}
