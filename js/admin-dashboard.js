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
      case "users":
        loadUsers();
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

  // Initialize forms
  initializeForms();
});

/**
 * Load dashboard counts
 */
async function loadDashboardCounts() {
  try {
    const [usersResponse, sportsResponse, schedulesResponse] =
      await Promise.all([
        fetch("http://localhost:3001/api/admin/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch("http://localhost:3001/api/admin/sports", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch("http://localhost:3001/api/admin/schedules", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

    const users = await usersResponse.json();
    const sports = await sportsResponse.json();
    const schedules = await schedulesResponse.json();

    document.getElementById("members-count").textContent =
      `${users.length} medlemmar`;
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
 * Show specific section
 */
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
      case "users":
        loadUsers();
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

/**
 * Hide all sections
 */
function hideAllSections() {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => (section.style.display = "none"));
}

/**
 * Load users data
 */
async function loadUsers() {
  try {
    const response = await fetch("http://localhost:3001/api/admin/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch users");

    const users = await response.json();
    const tbody = document.getElementById("users-tbody");

    if (users.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7">Inga medlemmar registrerade</td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>${user.id}</td>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.phone || "-"}</td>
                <td>${user.membership_type || "Grund"}</td>
                <td>
                    <span class="status ${user.is_active ? "active" : "inactive"}">
                        ${user.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-small" onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                        ${user.is_active ? "Inaktivera" : "Aktivera"}
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading users:", error);
    document.getElementById("users-tbody").innerHTML =
      '<tr><td colspan="7">Kunde inte ladda medlemmar</td></tr>';
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
        '<tr><td colspan="5">Inga sporter tillgängliga</td></tr>';
      return;
    }

    tbody.innerHTML = sports
      .map(
        (sport) => `
            <tr>
                <td>${sport.id}</td>
                <td>${sport.name}</td>
                <td>${sport.description}</td>
                <td>${sport.age_groups.join(", ")}</td>
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
      '<tr><td colspan="5">Kunde inte ladda sporter</td></tr>';
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
 * Toggle user status
 */
async function toggleUserStatus(userId, newStatus) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/users/${userId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      },
    );

    if (!response.ok) throw new Error("Failed to update user status");

    // Reload users
    loadUsers();
    loadDashboardCounts();
  } catch (error) {
    console.error("Error updating user status:", error);
    alert("Kunde inte uppdatera användarstatus");
  }
}

/**
 * Delete sport
 */
async function deleteSport(sportId) {
  if (!confirm("Är du säker på att du vill ta bort denna sport?")) return;

  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/sports/${sportId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    if (!response.ok) throw new Error("Failed to delete sport");

    // Reload sports
    loadSports();
    loadDashboardCounts();
    loadSportsForSelect();
  } catch (error) {
    console.error("Error deleting sport:", error);
    alert("Kunde inte ta bort sport");
  }
}

/**
 * Delete schedule
 */
async function deleteSchedule(scheduleId) {
  if (!confirm("Är du säker på att du vill ta bort detta schema?")) return;

  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/schedules/${scheduleId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    if (!response.ok) throw new Error("Failed to delete schedule");

    // Reload schedules
    loadSchedules();
    loadDashboardCounts();
  } catch (error) {
    console.error("Error deleting schedule:", error);
    alert("Kunde inte ta bort schema");
  }
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

    // Set age group checkboxes
    document.getElementById("edit-age-6-13").checked =
      sport.age_groups.includes("6-13");
    document.getElementById("edit-age-14+").checked =
      sport.age_groups.includes("14+");
    document.getElementById("edit-age-7-13").checked =
      sport.age_groups.includes("7-13");
    document.getElementById("edit-age-13+").checked =
      sport.age_groups.includes("13+");

    // Show modal
    document.getElementById("edit-sport-modal").style.display = "block";
  } catch (error) {
    console.error("Error loading sport for edit:", error);
    alert("Kunde inte ladda sport för redigering");
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
    alert("Kunde inte ladda schema för redigering");
  }
}

/**
 * Close modal
 */
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
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

      const ageGroups = [];
      if (
        document.querySelector('#add-sport-modal input[value="6-13"]').checked
      )
        ageGroups.push("6-13");
      if (document.querySelector('#add-sport-modal input[value="14+"]').checked)
        ageGroups.push("14+");
      if (
        document.querySelector('#add-sport-modal input[value="7-13"]').checked
      )
        ageGroups.push("7-13");
      if (document.querySelector('#add-sport-modal input[value="13+"]').checked)
        ageGroups.push("13+");

      const formData = new FormData();
      formData.append("name", document.getElementById("sport-name").value);
      formData.append(
        "description",
        document.getElementById("sport-description").value,
      );
      formData.append("age_groups", JSON.stringify(ageGroups));

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
      } catch (error) {
        console.error("Error adding sport:", error);
        alert("Kunde inte lägga till sport");
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
      } catch (error) {
        console.error("Error adding schedule:", error);
        alert("Kunde inte lägga till schema");
      }
    });

  // Edit sport form
  document
    .getElementById("edit-sport-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const sportId = document.getElementById("edit-sport-id").value;
      const ageGroups = [];
      if (document.getElementById("edit-age-6-13").checked)
        ageGroups.push("6-13");
      if (document.getElementById("edit-age-14+").checked)
        ageGroups.push("14+");
      if (document.getElementById("edit-age-7-13").checked)
        ageGroups.push("7-13");
      if (document.getElementById("edit-age-13+").checked)
        ageGroups.push("13+");

      const formData = new FormData();
      formData.append("name", document.getElementById("edit-sport-name").value);
      formData.append(
        "description",
        document.getElementById("edit-sport-description").value,
      );
      formData.append("age_groups", JSON.stringify(ageGroups));
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
      } catch (error) {
        console.error("Error updating sport:", error);
        alert("Kunde inte uppdatera sport");
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
      } catch (error) {
        console.error("Error updating schedule:", error);
        alert("Kunde inte uppdatera schema");
      }
    });
}
