        // Mock data for schedule
        const scheduleData = [
            { day: 'Måndag', time: '18:00-19:00', activity: 'Brottning', level: 'Barn' },
            { day: 'Måndag', time: '19:00-20:30', activity: 'Brottning', level: 'Vuxna' },
            { day: 'Tisdag', time: '16:00-22:00', activity: 'Girls Only', level: 'Alla nivåer' },
            { day: 'Onsdag', time: '18:00-19:00', activity: 'Brottning', level: 'Barn' },
            { day: 'Onsdag', time: '19:00-20:30', activity: 'Brottning', level: 'Vuxna' },
            { day: 'Torsdag', time: '16:00-22:00', activity: 'Girls Only', level: 'Alla nivåer' },
            { day: 'Fredag', time: '18:00-20:00', activity: 'Wresfit', level: 'Alla nivåer' },
            { day: 'Söndag', time: '13:00-14:00', activity: 'Brottning', level: 'Barn' },
            { day: 'Söndag', time: '14:00-15:00', activity: 'Girls Only', level: 'Alla nivåer' }
        ];

        // Populate weekly schedule cards
        function populateWeeklyScheduleCards(sportFilter = null) {
            const scheduleContainer = document.getElementById('weekly-schedule-cards');
            scheduleContainer.innerHTML = '';

            // Filter data if sportFilter is provided
            let filteredData = scheduleData;
            if (sportFilter) {
                filteredData = scheduleData.filter(session => session.activity === sportFilter);
            }

            // Group sessions by day
            const sessionsByDay = {};
            filteredData.forEach(session => {
                if (!sessionsByDay[session.day]) {
                    sessionsByDay[session.day] = [];
                }
                sessionsByDay[session.day].push(session);
            });

            // Define days order
            const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Söndag'];

            // Get current day
            const today = new Date().toLocaleDateString('sv-SE', { weekday: 'long' });
            const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

            days.forEach(day => {
                const dayContainer = document.createElement('div');
                dayContainer.className = `day-container ${day === todayFormatted ? 'today' : ''}`;

                const dayHeader = document.createElement('h3');
                dayHeader.className = 'day-header';
                dayHeader.textContent = day;
                dayContainer.appendChild(dayHeader);

                const sessions = sessionsByDay[day] || [];
                if (sessions.length > 0) {
                    sessions.forEach(session => {
                        const card = document.createElement('div');
                        card.className = `session-card ${getActivityClass(session.activity)}`;
                        card.setAttribute('data-filter', getFilterKey(session.activity, session.level));

                        const icon = document.createElement('div');
                        icon.className = 'session-icon';
                        icon.innerHTML = getActivityIcon(session.activity);

                        const content = document.createElement('div');
                        content.className = 'session-content';

                        const time = document.createElement('div');
                        time.className = 'session-time';
                        time.textContent = session.time;

                        const activity = document.createElement('div');
                        activity.className = 'session-activity';
                        activity.textContent = session.activity;

                        const level = document.createElement('div');
                        level.className = 'session-level';
                        level.textContent = session.level;

                        const description = document.createElement('div');
                        description.className = 'session-description';
                        description.textContent = 'Ingen registrering krävs. Ta bara bekväma kläder.';

                        content.appendChild(time);
                        content.appendChild(activity);
                        content.appendChild(level);
                        content.appendChild(description);

                        card.appendChild(icon);
                        card.appendChild(content);

                        dayContainer.appendChild(card);
                    });
                } else {
                    const noSessions = document.createElement('div');
                    noSessions.className = 'no-sessions';
                    noSessions.textContent = 'Inga träningar idag';
                    dayContainer.appendChild(noSessions);
                }

                scheduleContainer.appendChild(dayContainer);
            });
        }

        // Get filter key for session
        function getFilterKey(activity, level) {
            if (activity === 'Brottning') {
                return level === 'Barn' ? 'brottning-barn' : 'brottning-vuxna';
            } else if (activity === 'Girls Only') {
                return 'girls-only';
            } else if (activity === 'Wresfit') {
                return 'wresfit';
            }
            return '';
        }

        // Filter sessions
        function filterSessions(filter) {
            const sessionCards = document.querySelectorAll('.session-card');
            sessionCards.forEach(card => {
                const cardFilter = card.getAttribute('data-filter');
                if (filter === 'all' || cardFilter === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Get CSS class for activity
        function getActivityClass(activity) {
            switch (activity) {
                case 'Brottning': return 'brottning';
                case 'Wresfit': return 'wresfit';
                case 'Girls Only': return 'girls-only';
                default: return '';
            }
        }

        // Get icon for activity
        function getActivityIcon(activity) {
            switch (activity) {
                case 'Brottning':
                    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2"/>
                    </svg>`;
                case 'Wresfit':
                    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 6h12M6 10h12M6 14h12M6 18h12" stroke="currentColor" stroke-width="2"/>
                        <circle cx="9" cy="6" r="1" fill="currentColor"/>
                        <circle cx="15" cy="10" r="1" fill="currentColor"/>
                        <circle cx="9" cy="14" r="1" fill="currentColor"/>
                        <circle cx="15" cy="18" r="1" fill="currentColor"/>
                    </svg>`;
                case 'Girls Only':
                    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M6 20c0-3.5 2.7-6.5 6-6.5s6 3 6 6.5" stroke="currentColor" stroke-width="2"/>
                    </svg>`;
                default:
                    return '';
            }
        }

        // Toggle mobile menu
        function toggleMenu() {
            const navLinks = document.querySelector('.nav-links');
            const hamburger = document.querySelector('.hamburger');
            const overlay = document.querySelector('.menu-overlay');
            const isActive = navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            overlay.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isActive);
        }

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const navLinks = document.querySelector('.nav-links');
                const hamburger = document.querySelector('.hamburger');
                const overlay = document.querySelector('.menu-overlay');
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                overlay.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        // Mock function for booking
        function bookSession(day, time, activity) {
            alert(`Bokning för ${activity} ${day} ${time} har lagts till. (Funktionalitet kommer att implementeras med backend)`);
        }

        // Mock function for login
        function handleLoginClick() {
            alert('Inloggningsfunktionalitet kommer att implementeras med backend');
        }

        // Mock function for form submission
        document.getElementById('contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Tack för ditt meddelande! Vi återkommer så snart som möjligt.');
            this.reset();
        });

        // Developer variable to test different object-fit values
        // Change this value to test: 'contain', 'cover', 'fill', 'none', 'scale-down'
        const imageFit = 'fill';

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Check if we are on a sport-specific page
            const urlParams = new URLSearchParams(window.location.search);
            const sportFilter = urlParams.get('sport');
            populateWeeklyScheduleCards(sportFilter);

            // Apply image fit to sport images for testing
            const images = document.querySelectorAll('.sport-image img');
            images.forEach(img => {
                img.style.objectFit = imageFit;
            });

            // Close mobile menu when clicking on a link
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    document.querySelector('.nav-links').classList.remove('active');
                    document.querySelector('.hamburger').classList.remove('active');
                    document.querySelector('.menu-overlay').classList.remove('active');
                    document.querySelector('.hamburger').setAttribute('aria-expanded', 'false');
                });
            });

            // Add filter button event listeners
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    // Remove active class from all buttons
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    this.classList.add('active');
                    // Filter sessions
                    const filter = this.getAttribute('data-filter');
                    filterSessions(filter);
                });
            });
        });

        // Placeholder function for backend API calls
        function fetchSchedule() {
            // This would be replaced with actual API call in backend implementation
            console.log('Fetching schedule data from backend...');
            return scheduleData;
        }