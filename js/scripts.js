// Mock data for schedule
const scheduleData = [
  {
    day: "Måndag",
    time: "18:00-19:00",
    activity: "Brottning",
    level: "6-15 år",
  },
  { day: "Måndag", time: "19:00-20:30", activity: "Brottning", level: "15+" },
  {
    day: "Tisdag",
    time: "17:30-18:30",
    activity: "Girls Only",
    level: "7-13 år",
  },
  {
    day: "Tisdag",
    time: "18:30-19:45",
    activity: "Girls Only",
    level: "13+",
  },
  {
    day: "Onsdag",
    time: "18:00-19:00",
    activity: "Brottning",
    level: "6-15 år",
  },
  { day: "Onsdag", time: "19:00-20:30", activity: "Brottning", level: "15+" },
  {
    day: "Torsdag",
    time: "17:30-18:30",
    activity: "Girls Only",
    level: "7-13 år",
  },
  {
    day: "Torsdag",
    time: "18:30-19:45",
    activity: "Girls Only",
    level: "13+",
  },
  {
    day: "Fredag",
    time: "18:00-20:00",
    activity: "Wresfit",
    level: "Alla åldrar",
  },
  {
    day: "Söndag",
    time: "13:00-14:00",
    activity: "Brottning",
    level: "6-15 år",
  },
  {
    day: "Söndag",
    time: "14:00-15:00",
    activity: "Girls Only",
    level: "Alla nivåer",
  },
];

// Populate weekly schedule cards
function populateWeeklyScheduleCards(filterKey = null) {
  const scheduleContainer = document.getElementById("weekly-schedule-cards");
  scheduleContainer.innerHTML = "";

  // Filter data if filterKey is provided
  let filteredData = scheduleData;
  if (filterKey && filterKey !== "all") {
    if (filterKey === "brottning-barn") {
      filteredData = scheduleData.filter(
        (session) =>
          session.activity === "Brottning" && session.level === "6-15 år"
      );
    } else if (filterKey === "brottning-vuxna") {
      filteredData = scheduleData.filter(
        (session) => session.activity === "Brottning" && session.level === "15+"
      );
    } else if (filterKey === "girls-only") {
      filteredData = scheduleData.filter(
        (session) => session.activity === "Girls Only"
      );
    } else if (filterKey === "girls-only-7-13") {
      filteredData = scheduleData.filter(
        (session) =>
          session.activity === "Girls Only" && session.level === "7-13 år"
      );
    } else if (filterKey === "girls-only-13") {
      filteredData = scheduleData.filter(
        (session) =>
          session.activity === "Girls Only" && session.level === "13+"
      );
    } else if (filterKey === "wresfit") {
      filteredData = scheduleData.filter(
        (session) => session.activity === "Wresfit"
      );
    }
  }

  // Group sessions by day
  const sessionsByDay = {};
  filteredData.forEach((session) => {
    if (!sessionsByDay[session.day]) {
      sessionsByDay[session.day] = [];
    }
    sessionsByDay[session.day].push(session);
  });

  // Get current day
  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long" });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  // Only show days that have sessions
  for (const day in sessionsByDay) {
    const dayContainer = document.createElement("div");
    dayContainer.className = `day-container ${
      day === todayFormatted ? "today" : ""
    }`;

    const dayHeader = document.createElement("h3");
    dayHeader.className = "day-header";
    dayHeader.textContent = day;
    dayContainer.appendChild(dayHeader);

    const sessions = sessionsByDay[day];
    sessions.forEach((session) => {
      const card = document.createElement("div");
      card.className = `session-card ${getActivityClass(
        session.activity
      )} ${getLevelClass(session.level)}`;
      card.setAttribute(
        "data-filter",
        getFilterKey(session.activity, session.level)
      );

      const icon = document.createElement("div");
      icon.className = "session-icon";
      icon.innerHTML = getActivityIcon(session.activity, session.level);

      const content = document.createElement("div");
      content.className = "session-content";

      const time = document.createElement("div");
      time.className = "session-time";
      time.textContent = session.time;

      const activity = document.createElement("div");
      activity.className = "session-activity";
      activity.textContent = session.activity;

      const level = document.createElement("div");
      level.className = "session-level";
      level.textContent = session.level;

      content.appendChild(time);
      content.appendChild(activity);
      content.appendChild(level);

      card.appendChild(icon);
      card.appendChild(content);

      dayContainer.appendChild(card);
    });

    scheduleContainer.appendChild(dayContainer);
  }

  // If no sessions after filtering, show a message
  if (Object.keys(sessionsByDay).length === 0) {
    const noSessions = document.createElement("div");
    noSessions.className = "no-sessions";
    noSessions.textContent = "Inga träningar hittades för denna filtrering.";
    scheduleContainer.appendChild(noSessions);
  }
}

// Get filter key for session
function getFilterKey(activity, level) {
  if (activity === "Brottning") {
    return level === "6-15 år" ? "brottning-barn" : "brottning-vuxna";
  } else if (activity === "Girls Only") {
    if (level === "7-13 år") {
      return "girls-only-7-13";
    } else if (level === "13+") {
      return "girls-only-13";
    } else {
      return "girls-only";
    }
  } else if (activity === "Wresfit") {
    return "wresfit";
  }
  return "";
}

// Filter sessions
function filterSessions(filter) {
  const sessionCards = document.querySelectorAll(".session-card");
  sessionCards.forEach((card) => {
    const cardFilter = card.getAttribute("data-filter");
    if (filter === "all" || cardFilter === filter) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

// Get CSS class for activity
function getActivityClass(activity) {
  switch (activity) {
    case "Brottning":
      return "brottning";
    case "Wresfit":
      return "wresfit";
    case "Girls Only":
      return "girls-only";
    default:
      return "";
  }
}

// Get CSS class for level
function getLevelClass(level) {
  if (level === "6-15 år") {
    return "barn";
  } else if (level === "15+") {
    return "vuxna";
  }
  return "";
}

// Get icon for activity
function getActivityIcon(activity, level) {
  switch (activity) {
    case "Brottning":
      if (level === "6-15 år") {
        // Star icon for kids
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                        </svg>`;
      } else {
        // Star icon for adults
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                        </svg>`;
      }
    case "Wresfit":
      // Dumbbell icon
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 8h2v8H6V8zM16 8h2v8h-2V8zM8 6h8v2H8V6zM8 16h8v2H8v-2z" fill="currentColor"/>
                        <circle cx="5" cy="10" r="1" fill="currentColor"/>
                        <circle cx="19" cy="10" r="1" fill="currentColor"/>
                        <circle cx="5" cy="14" r="1" fill="currentColor"/>
                        <circle cx="19" cy="14" r="1" fill="currentColor"/>
                    </svg>`;
    case "Girls Only":
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M6 20c0-3.5 2.7-6.5 6-6.5s6 3 6 6.5" stroke="currentColor" stroke-width="2"/>
                    </svg>`;
    default:
      return "";
  }
}

// Toggle mobile menu
function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  const hamburger = document.querySelector(".hamburger");
  const overlay = document.querySelector(".menu-overlay");
  const isActive = navLinks.classList.toggle("active");
  hamburger.classList.toggle("active");
  overlay.classList.toggle("active");
  hamburger.setAttribute("aria-expanded", isActive);
}

// Close menu on escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const navLinks = document.querySelector(".nav-links");
    const hamburger = document.querySelector(".hamburger");
    const overlay = document.querySelector(".menu-overlay");
    if (navLinks) navLinks.classList.remove("active");
    if (hamburger) {
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
    }
    if (overlay) overlay.classList.remove("active");
  }
});

// Mock function for booking
function bookSession(day, time, activity) {
  alert(
    `Bokning för ${activity} ${day} ${time} har lagts till. (Funktionalitet kommer att implementeras med backend)`
  );
}

// Mock function for login
function handleLoginClick() {
  const modal = document.getElementById("login-modal");
  modal.style.display = "flex";
}

// Close login modal
function closeLoginModal() {
  const modal = document.getElementById("login-modal");
  modal.style.display = "none";
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Mock function for form submission
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Tack för ditt meddelande! Vi återkommer så snart som möjligt.");
      this.reset();
    });
  }

  // Check if we are on a sport-specific page
  const urlParams = new URLSearchParams(window.location.search);
  const sportFilter = urlParams.get("sport");
  if (document.getElementById("weekly-schedule-cards")) {
    populateWeeklyScheduleCards(sportFilter);
  }

  // Close mobile menu when clicking on a link
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

  // Add filter button event listeners
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("Filter button clicked:", this.getAttribute("data-filter"));
      // Remove active class from all buttons
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");
      // Filter sessions
      const filter = this.getAttribute("data-filter");
      populateWeeklyScheduleCards(filter);
    });
  });
});
