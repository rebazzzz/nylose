  // Mock data for schedule
        const scheduleData = [
            { day: 'Måndag', time: '17:00-18:00', activity: 'Wresfit', level: 'Nyborjare' },
            { day: 'Måndag', time: '18:30-20:00', activity: 'Brottning', level: 'Avancerad' },
            { day: 'Tisdag', time: '17:30-18:30', activity: 'Girls Only', level: 'Alla nivåer' },
            { day: 'Tisdag', time: '19:00-20:30', activity: 'Brottning', level: 'Nyborjare' },
            { day: 'Onsdag', time: '17:00-18:00', activity: 'Wresfit', level: 'Avancerad' },
            { day: 'Onsdag', time: '18:30-20:00', activity: 'Brottning', level: 'Alla nivåer' },
            { day: 'Torsdag', time: '17:30-18:30', activity: 'Girls Only', level: 'Nyborjare' },
            { day: 'Torsdag', time: '19:00-20:30', activity: 'Brottning', level: 'Avancerad' },
            { day: 'Fredag', time: '16:00-17:00', activity: 'Wresfit', level: 'Alla nivåer' },
            { day: 'Lördag', time: '10:00-11:30', activity: 'Brottning', level: 'Barn' },
            { day: 'Lördag', time: '12:00-13:00', activity: 'Girls Only', level: 'Avancerad' }
        ];

        // Populate schedule table
        function populateSchedule() {
            const scheduleBody = document.getElementById('schedule-body');
            scheduleBody.innerHTML = '';
            
            scheduleData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.day}</td>
                    <td>${item.time}</td>
                    <td>${item.activity}</td>
                    <td>${item.level}</td>
                    <td><button class="book-btn" onclick="bookSession('${item.day}', '${item.time}', '${item.activity}')">Boka</button></td>
                `;
                scheduleBody.appendChild(row);
            });
        }

        // Toggle mobile menu
        function toggleMenu() {
            const navLinks = document.querySelector('.nav-links');
            navLinks.classList.toggle('active');
        }

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

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            populateSchedule();
            
            // Close mobile menu when clicking on a link
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    document.querySelector('.nav-links').classList.remove('active');
                });
            });
        });

        // Placeholder function for backend API calls
        function fetchSchedule() {
            // This would be replaced with actual API call in backend implementation
            console.log('Fetching schedule data from backend...');
            return scheduleData;
        }