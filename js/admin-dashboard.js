/**
 * ADMIN-DASHBOARD.JS
 *
 * JavaScript for admin dashboard functionality
 */

// Global functions for onclick handlers
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => (section.style.display = "none"));

  // Show selected section
  const targetSection = document.getElementById(`${sectionName}-section`);
  if (targetSection) {
    targetSection.style.display = "block";

    // Load data for the section
    switch (sectionName) {
      case "members":
        loadMembers();
        break;
      case "sports":
        loadSports();
        break;
      case "schedules":
        loadSchedules();
        break;
      case "statistics":
        loadStatistics();
        break;
    }
  }
}

function hideAllSections() {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => (section.style.display = "none"));
}

function showAddSportModal() {
  document.getElementById("add-sport-modal").style.display = "block";
}

function showAddScheduleModal() {
  document.getElementById("add-schedule-modal").style.display = "block";
}

function showAddAdminModal() {
  document.getElementById("add-admin-modal").style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user || user.role !== "admin") {
    // Not authenticated or not admin, redirect to login
    window.location.href = "admin.html";
    return;
  }

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "admin.html";
  });

  // Display user info
  const dashboardHeader = document.querySelector(".dashboard-header p");
  dashboardHeader.textContent = `Välkommen, ${user.first_name} ${user.last_name}`;

  // Load dashboard data
  loadDashboardCounts();
  loadSportsForSelect();

  // Add click listeners to dashboard cards
  const cards = document.querySelectorAll(".dashboard-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const section = card.getAttribute("data-section");
      showSection(section);
    });
  });

  // Initialize forms
  initializeForms();
});

/**
 * Load dashboard counts
 */
async function loadDashboardCounts() {
  try {
    const [membersResponse, sportsResponse, schedulesResponse] =
      await Promise.all([
        fetch(`http://localhost:3001/api/admin/members?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`http://localhost:3001/api/admin/sports?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`http://localhost:3001/api/admin/schedules?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

    const members = await membersResponse.json();
    const sports = await sportsResponse.json();
    const schedules = await schedulesResponse.json();

    document.getElementById("members-count").textContent =
      `${members.length} medlemmar`;
    document.getElementById("sports-count").textContent =
      `${sports.length} sporter`;
    document.getElementById("schedules-count").textContent =
      `${schedules.length} scheman`;
  } catch (error) {
    console.error("Error loading dashboard counts:", error);
    document.getElementById("members-count").textContent = "Kunde inte ladda";
    document.getElementById("sports-count").textContent = "Kunde inte ladda";
    document.getElementById("schedules-count").textContent = "Kunde inte ladda";
  }
}



/**
 * Hide all sections
 */
function hideAllSections() {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => (section.style.display = "none"));
}

/**
 * Load members data
 */
async function loadMembers() {
  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/members?t=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    if (!response.ok) throw new Error("Failed to fetch members");

    const members = await response.json();
    const tbody = document.getElementById("members-tbody");

    if (members.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9">Inga medlemmar registrerade</td></tr>';
      return;
    }

    tbody.innerHTML = members
      .map((member) => {
        // Format parent info
        let parentInfo = "-";
        if (member.parent_name) {
          parentInfo = `${member.parent_name}`;
          if (member.parent_lastname) {
            parentInfo += ` ${member.parent_lastname}`;
          }
          if (member.parent_phone) {
            parentInfo += ` (${member.parent_phone})`;
          }
        }

        return `
            <tr>
                <td>${member.id}</td>
                <td>${member.first_name} ${member.last_name}</td>
                <td>${member.personnummer || "-"}</td>
                <td>${member.email}</td>
                <td>${member.phone || "-"}</td>
                <td>${member.address || "-"}</td>
                <td>${parentInfo}</td>
                <td>
                    <span class="status ${member.is_active ? "active" : "inactive"}">
                        ${member.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                </td>
                <td>${new Date(member.created_at).toLocaleDateString("sv-SE")}</td>
            </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading members:", error);
    document.getElementById("members-tbody").innerHTML =
      '<tr><td colspan="9">Kunde inte ladda medlemmar</td></tr>';
  }
}

/**
 * Load admins data
 */
async function loadAdmins() {
  try {
    const response = await fetch("http://localhost:3001/api/admin/admins", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch admins");

    const admins = await response.json();
    const tbody = document.getElementById("admins-tbody");

    if (admins.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7">Inga administratörer registrerade</td></tr>';
      return;
    }

    tbody.innerHTML = admins
      .map(
        (admin) => `
            <tr>
                <td>${admin.id}</td>
                <td>${admin.first_name} ${admin.last_name}</td>
                <td>${admin.email}</td>
                <td>${admin.phone || "-"}</td>
                <td>
                    <span class="status ${admin.is_active ? "active" : "inactive"}">
                        ${admin.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                </td>
                <td>${new Date(admin.created_at).toLocaleDateString("sv-SE")}</td>
                <td>
                    <button class="btn btn-small" onclick="toggleAdminStatus(${admin.id}, ${!admin.is_active})">
                        ${admin.is_active ? "Inaktivera" : "Aktivera"}
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading admins:", error);
    document.getElementById("admins-tbody").innerHTML =
      '<tr><td colspan="7">Kunde inte ladda administratörer</td></tr>';
  }
}

/**
 * Load sports data
 */
async function loadSports() {
  try {
    const response = await fetch("http://localhost:3001/api/admin/sports", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch sports");

    const sports = await response.json();
    const tbody = document.getElementById("sports-tbody");

    if (sports.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4">Inga sporter tillgängliga</td></tr>';
      return;
    }

    tbody.innerHTML = sports
      .map(
        (sport) => `
            <tr>
                <td>${sport.id}</td>
                <td>${sport.name}</td>
                <td>${sport.description}</td>
                <td>
                    <button class="btn btn-small" onclick="editSport(${sport.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteSport(${sport.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading sports:", error);
    document.getElementById("sports-tbody").innerHTML =
      '<tr><td colspan="4">Kunde inte ladda sporter</td></tr>';
  }
}

/**
 * Load schedules data
 */
async function loadSchedules() {
  try {
    const response = await fetch("http://localhost:3001/api/admin/schedules", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch schedules");

    const schedules = await response.json();
    const tbody = document.getElementById("schedules-tbody");

    if (schedules.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">Inga scheman tillgängliga</td></tr>';
      return;
    }

    tbody.innerHTML = schedules
      .map(
        (schedule) => `
            <tr>
                <td>${schedule.id}</td>
                <td>${schedule.sport_name}</td>
                <td>${schedule.day_of_week || schedule.day}</td>
                <td>${schedule.start_time} - ${schedule.end_time}</td>
                <td>${schedule.age_group}</td>
                <td>
                    <button class="btn btn-small" onclick="editSchedule(${schedule.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteSchedule(${schedule.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading schedules:", error);
    document.getElementById("schedules-tbody").innerHTML =
      '<tr><td colspan="7">Kunde inte ladda schema</td></tr>';
  }
}

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    const response = await fetch("http://localhost:3001/api/admin/statistics", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch statistics");

    const stats = await response.json();
    const content = document.getElementById("statistics-content");

    content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Totalt antal medlemmar</h3>
                    <p class="stat-number">${stats.totalUsers}</p>
                </div>
                <div class="stat-card">
                    <h3>Aktiva medlemmar</h3>
                    <p class="stat-number">${stats.activeUsers}</p>
                </div>
                <div class="stat-card">
                    <h3>Totalt antal sporter</h3>
                    <p class="stat-number">${stats.totalSports}</p>
                </div>
                <div class="stat-card">
                    <h3>Totalt antal scheman</h3>
                    <p class="stat-number">${stats.totalSchedules}</p>
                </div>
                <div class="stat-card">
                    <h3>Totala betalningar</h3>
                    <p class="stat-number">${stats.totalPayments} kr</p>
                </div>
                <div class="stat-card">
                    <h3>Genomsnittlig betalning</h3>
                    <p class="stat-number">${stats.averagePayment} kr</p>
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Error loading statistics:", error);
    document.getElementById("statistics-content").innerHTML =
      "Kunde inte ladda statistik";
  }
}

/**
 * Load sports for select dropdowns
 */
async function loadSportsForSelect() {
  try {
    const response = await fetch("http://localhost:3001/api/admin/sports", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch sports");

    const sports = await response.json();

    // Update both add and edit sport selects
    const selects = ["schedule-sport", "edit-schedule-sport"];
    selects.forEach((selectId) => {
      const select = document.getElementById(selectId);
      if (select) {
        select.innerHTML =
          '<option value="">Välj sport...</option>' +
          sports
            .map(
              (sport) => `<option value="${sport.id}">${sport.name}</option>`,
            )
            .join("");
      }
    });
  } catch (error) {
    console.error("Error loading sports for select:", error);
  }
}

/**
 * Toggle admin status
 */
async function toggleAdminStatus(adminId, newStatus) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/admins/${adminId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      },
    );

    if (!response.ok) throw new Error("Failed to update admin status");

    // Reload admins
    loadAdmins();
    loadDashboardCounts();
  } catch (error) {
    console.error("Error updating admin status:", error);
    showError("Kunde inte uppdatera adminstatus");
  }
}

/**
 * Delete sport
 */
async function deleteSport(sportId) {
  showConfirm(
    "Är du säker på att du vill ta bort denna sport?",
    "Bekräfta borttagning",
    async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/admin/sports/${sportId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to delete sport");

        // Reload sports
        loadSports();
        loadDashboardCounts();
        loadSportsForSelect();
        showSuccess("Sporten har tagits bort");
      } catch (error) {
        console.error("Error deleting sport:", error);
        showError("Kunde inte ta bort sport");
      }
    },
  );
}

/**
 * Delete schedule
 */
async function deleteSchedule(scheduleId) {
  showConfirm(
    "Är du säker på att du vill ta bort detta schema?",
    "Bekräfta borttagning",
    async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/admin/schedules/${scheduleId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to delete schedule");

        // Reload schedules
        loadSchedules();
        loadDashboardCounts();
        showSuccess("Schemat har tagits bort");
      } catch (error) {
        console.error("Error deleting schedule:", error);
        showError("Kunde inte ta bort schema");
      }
    },
  );
}

/**
 * Show add sport modal
 */
function showAddSportModal() {
  document.getElementById("add-sport-modal").style.display = "block";
}

/**
 * Show add schedule modal
 */
function showAddScheduleModal() {
  document.getElementById("add-schedule-modal").style.display = "block";
}

/**
 * Edit sport
 */
async function editSport(sportId) {
  try {
    const response = await fetch(`http://localhost:3001/api/admin/sports`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch sports");

    const sports = await response.json();
    const sport = sports.find((s) => s.id === sportId);

    if (!sport) throw new Error("Sport not found");

    // Populate edit form
    document.getElementById("edit-sport-id").value = sport.id;
    document.getElementById("edit-sport-name").value = sport.name;
    document.getElementById("edit-sport-description").value = sport.description;
    document.getElementById("edit-existing-image-path").value =
      sport.image_path || "";

    // Show modal
    document.getElementById("edit-sport-modal").style.display = "block";
  } catch (error) {
    console.error("Error loading sport for edit:", error);
    showError("Kunde inte ladda sport för redigering");
  }
}

/**
 * Edit schedule
 */
async function editSchedule(scheduleId) {
  try {
    const response = await fetch(`http://localhost:3001/api/admin/schedules`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch schedules");

    const schedules = await response.json();
    const schedule = schedules.find((s) => s.id === scheduleId);

    if (!schedule) throw new Error("Schedule not found");

    // Populate edit form
    document.getElementById("edit-schedule-id").value = schedule.id;
    document.getElementById("edit-schedule-sport").value = schedule.sport_id;
    document.getElementById("edit-schedule-day").value =
      schedule.day_of_week || schedule.day;
    document.getElementById("edit-schedule-start-time").value =
      schedule.start_time;
    document.getElementById("edit-schedule-end-time").value = schedule.end_time;
    document.getElementById("edit-schedule-age-group").value =
      schedule.age_group;

    // Show modal
    document.getElementById("edit-schedule-modal").style.display = "block";
  } catch (error) {
    console.error("Error loading schedule for edit:", error);
    showError("Kunde inte ladda schema för redigering");
  }
}

/**
 * Close modal
 */
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

/**
 * Show notification modal
 */
function showNotification(
  message,
  type = "info",
  title = "Meddelande",
  confirmCallback = null,
  cancelCallback = null,
) {
  const modal = document.getElementById("notification-modal");
  const titleEl = document.getElementById("notification-title");
  const messageEl = document.getElementById("notification-message");
  const iconEl = document.getElementById("notification-icon");
  const confirmBtn = document.getElementById("notification-confirm-btn");
  const cancelBtn = document.getElementById("notification-cancel-btn");

  // Set title
  titleEl.textContent = title;

  // Set message
  messageEl.textContent = message;

  // Set icon and type
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

  // Handle confirm/cancel buttons
  if (confirmCallback || cancelCallback) {
    cancelBtn.style.display = "inline-block";
    confirmBtn.textContent = "Ja";
    cancelBtn.textContent = "Avbryt";

    // Remove previous event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Add new event listeners
    newConfirmBtn.addEventListener("click", () => {
      closeNotificationModal();
      if (confirmCallback) confirmCallback();
    });
    newCancelBtn.addEventListener("click", () => {
      closeNotificationModal();
      if (cancelCallback) cancelCallback();
    });
  } else {
    cancelBtn.style.display = "none";
    confirmBtn.textContent = "OK";
    confirmBtn.onclick = closeNotificationModal;
  }

  // Show modal
  modal.style.display = "block";
}

/**
 * Close notification modal
 */
function closeNotificationModal() {
  document.getElementById("notification-modal").style.display = "none";
}

/**
 * Show success notification
 */
function showSuccess(message, title = "Lyckades") {
  showNotification(message, "success", title);
}

/**
 * Show error notification
 */
function showError(message, title = "Fel") {
  showNotification(message, "error", title);
}

/**
 * Show warning notification
 */
function showWarning(message, title = "Varning") {
  showNotification(message, "warning", title);
}

/**
 * Show confirmation dialog
 */
function showConfirm(
  message,
  title = "Bekräfta",
  confirmCallback,
  cancelCallback = null,
) {
  showNotification(message, "warning", title, confirmCallback, cancelCallback);
}

/**
 * Initialize forms
 */
function initializeForms() {
  // Add sport form
  document
    .getElementById("add-sport-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData();
      formData.append("name", document.getElementById("sport-name").value);
      formData.append(
        "description",
        document.getElementById("sport-description").value,
      );

      const imageFile = document.getElementById("sport-image").files[0];
      if (imageFile) {
        formData.append("image", imageFile);
      }

      try {
        const response = await fetch("http://localhost:3001/api/admin/sports", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to add sport");

        closeModal("add-sport-modal");
        this.reset();
        loadSports();
        loadDashboardCounts();
        loadSportsForSelect();
        showSuccess("Sporten har lagts till");
      } catch (error) {
        console.error("Error adding sport:", error);
        showError("Kunde inte lägga till sport");
      }
    });

  // Add schedule form
  document
    .getElementById("add-schedule-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const scheduleData = {
        sport_id: parseInt(document.getElementById("schedule-sport").value),
        day_of_week: document.getElementById("schedule-day").value,
        start_time: document.getElementById("schedule-start-time").value,
        end_time: document.getElementById("schedule-end-time").value,
        age_group: document.getElementById("schedule-age-group").value,
      };

      try {
        const response = await fetch(
          "http://localhost:3001/api/admin/schedules",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(scheduleData),
          },
        );

        if (!response.ok) throw new Error("Failed to add schedule");

        closeModal("add-schedule-modal");
        this.reset();
        loadSchedules();
        loadDashboardCounts();
        showSuccess("Schemat har lagts till");
      } catch (error) {
        console.error("Error adding schedule:", error);
        showError("Kunde inte lägga till schema");
      }
    });

  // Edit sport form
  document
    .getElementById("edit-sport-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const sportId = document.getElementById("edit-sport-id").value;

      const formData = new FormData();
      formData.append("name", document.getElementById("edit-sport-name").value);
      formData.append(
        "description",
        document.getElementById("edit-sport-description").value,
      );
      formData.append(
        "existing_image_path",
        document.getElementById("edit-existing-image-path").value,
      );

      const imageFile = document.getElementById("edit-sport-image").files[0];
      if (imageFile) {
        formData.append("image", imageFile);
      }

      try {
        const response = await fetch(
          `http://localhost:3001/api/admin/sports/${sportId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          },
        );

        if (!response.ok) throw new Error("Failed to update sport");

        closeModal("edit-sport-modal");
        this.reset();
        loadSports();
        loadDashboardCounts();
        loadSportsForSelect();
        showSuccess("Sporten har uppdaterats");
      } catch (error) {
        console.error("Error updating sport:", error);
        showError("Kunde inte uppdatera sport");
      }
    });

  // Edit schedule form
  document
    .getElementById("edit-schedule-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const scheduleId = document.getElementById("edit-schedule-id").value;
      const scheduleData = {
        sport_id: parseInt(
          document.getElementById("edit-schedule-sport").value,
        ),
        day_of_week: document.getElementById("edit-schedule-day").value,
        start_time: document.getElementById("edit-schedule-start-time").value,
        end_time: document.getElementById("edit-schedule-end-time").value,
        age_group: document.getElementById("edit-schedule-age-group").value,
      };

      try {
        const response = await fetch(
          `http://localhost:3001/api/admin/schedules/${scheduleId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(scheduleData),
          },
        );

        if (!response.ok) throw new Error("Failed to update schedule");

        closeModal("edit-schedule-modal");
        this.reset();
        loadSchedules();
        loadDashboardCounts();
        showSuccess("Schemat har uppdaterats");
      } catch (error) {
        console.error("Error updating schedule:", error);
        alert("Kunde inte uppdatera schema");
      }
    });
  // Add admin form
  document
    .getElementById("add-admin-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const adminData = {
        first_name: document.getElementById("admin-firstname").value,
        last_name: document.getElementById("admin-lastname").value,
        email: document.getElementById("admin-email").value,
        phone: document.getElementById("admin-phone").value,
        password: document.getElementById("admin-password").value,
      };

      try {
        const response = await fetch(
          "http://localhost:3001/api/auth/register-admin",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(adminData),
          },
        );

        if (!response.ok) throw new Error("Failed to add admin");

        closeModal("add-admin-modal");
        this.reset();
        loadAdmins();
        loadDashboardCounts();
        showSuccess("Administratören har lagts till");
      } catch (error) {
        console.error("Error adding admin:", error);
        showError("Kunde inte lägga till administratör");
      }
    });
}
