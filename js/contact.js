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
});
