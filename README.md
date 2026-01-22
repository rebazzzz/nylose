# Nylöse SportCenter - Full Stack Application

A complete sports center management system with user registration, payment processing, admin dashboard, and email notifications.

## Features

### For Members

- User registration with Swedish personnummer validation
- Secure login system
- Membership management (3-month terms)
- Payment processing (Swish integration ready)
- Email confirmations for registration and payments
- Profile management

### For Admins

- Secure admin login
- User management (view all members)
- Schedule management (CRUD operations)
- Sports management (add/edit sports and age groups)
- Statistics and reporting

## Tech Stack

### Backend

- Node.js with Express
- SQLite database with migrations
- JWT authentication
- Nodemailer for email services
- bcryptjs for password hashing
- CORS and security middleware

### Frontend

- Vanilla JavaScript (ES6+)
- HTML5 with semantic markup
- CSS3 with responsive design
- Font Awesome icons
- Google Fonts (Poppins)

## Setup Instructions

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Root dependencies (for minification)
cd ..
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Secret (change this in production)
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@nylose.se

# Database
DB_PATH=./database/nylose.db
```

### 3. Database Setup

The database initializes automatically when the server starts. It includes:

- Default admin user: `admin@nylose.se` / `admin123`
- Sample sports and schedule data

### 4. Email Setup

For email functionality, you need to:

1. Use a Gmail account or configure another SMTP provider
2. Generate an App Password for Gmail:
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password
   - Use this password in EMAIL_PASS

### 5. Start the Application

```bash
# Start backend server
cd backend
npm run dev

# In another terminal, serve frontend (if needed)
# You can use any static server, e.g.:
# npx serve . -p 3000
```

### 6. Access the Application

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Admin login: Click profile icon → admin@nylose.se / admin123

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User/Admin login
- `POST /api/auth/payment` - Process payment

### Admin Routes (require admin auth)

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/sports` - Get all sports
- `POST /api/admin/sports` - Create sport
- `PUT /api/admin/sports/:id` - Update sport
- `DELETE /api/admin/sports/:id` - Delete sport
- `GET /api/admin/schedules` - Get all schedules
- `POST /api/admin/schedules` - Create schedule
- `PUT /api/admin/schedules/:id` - Update schedule
- `DELETE /api/admin/schedules/:id` - Delete schedule

### Member Routes (require member auth)

- `GET /api/member/profile` - Get member profile and membership info

### Public Routes

- `GET /api/public/sports` - Get active sports
- `GET /api/public/schedules` - Get active schedules

## Database Schema

### Tables

- `users` - User accounts (admin/member)
- `sports` - Available sports with age groups
- `schedules` - Training schedules
- `memberships` - User memberships
- `payments` - Payment records
- `statistics` - Usage statistics

## Development

### Minification

```bash
node minify.js
```

This minifies all CSS and JS files for production.

### Project Structure

```
nylose/
├── backend/
│   ├── database/
│   │   └── init.js          # Database setup and seeding
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── routes/
│   │   ├── admin.js         # Admin API routes
│   │   ├── auth.js          # Auth routes
│   │   ├── member.js        # Member API routes
│   │   └── public.js        # Public API routes
│   ├── services/
│   │   └── emailService.js  # Email functionality
│   ├── .env                 # Environment variables
│   └── server.js            # Main server file
├── styles/
│   ├── *.css                # Page-specific styles
│   └── min/                 # Minified styles
├── js/
│   ├── *.js                 # Page-specific scripts
│   └── min/                 # Minified scripts
├── images/                  # Static assets
├── *.html                   # HTML pages
├── minify.js               # Build script
└── package.json
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection protection

## Payment Integration

The system is ready for Swish payment integration. Currently uses mock payments. To implement real payments:

1. Get Swish merchant credentials
2. Implement Swish API calls in the payment endpoint
3. Update payment status based on Swish callbacks

## Email Templates

The system includes professional HTML email templates for:

- Registration confirmation
- Payment confirmation

Templates are responsive and match the site's branding.

## Future Enhancements

- Real-time schedule booking
- Member attendance tracking
- Advanced reporting dashboard
- Mobile app integration
- Multi-language support
- Advanced payment methods

## Support

For issues or questions, contact the development team or check the backend logs for detailed error information.
