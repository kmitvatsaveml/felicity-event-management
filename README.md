# Felicity Event Management System

A centralized platform for managing events, clubs, and participants for the Felicity fest. Built using the MERN stack.

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime for server-side execution
- **Express.js (v4.18)** - Minimal and flexible web framework for building REST APIs; chosen for its simplicity and large ecosystem
- **MongoDB + Mongoose (v7.6)** - NoSQL document database ideal for flexible event/user schemas; Mongoose provides schema validation and query building
- **bcrypt (v5.1)** - Industry-standard library for hashing passwords before storage; protects against plaintext password leaks
- **jsonwebtoken (v9.0)** - Implements JWT-based authentication for stateless session management across protected routes
- **nodemailer (v6.9)** - Sends confirmation emails and tickets to participants upon registration
- **qrcode (v1.5)** - Generates QR codes embedded in tickets for event entry verification
- **uuid (v9.0)** - Generates unique ticket IDs to avoid collisions
- **multer (v1.4)** - Handles multipart form data (file uploads) for custom registration forms
- **cors (v2.8)** - Enables cross-origin requests between frontend and backend during development and production
- **dotenv (v16.3)** - Loads environment variables from .env file to keep secrets out of source code

### Frontend
- **React (v18.2)** - Component-based UI library; chosen for its virtual DOM efficiency and large community support
- **Vite (v5.0)** - Fast build tool with hot module replacement; significantly faster than Create React App for development
- **React Router DOM (v6.20)** - Client-side routing for single-page application navigation with role-based route protection
- **Tailwind CSS (v3.3)** - Utility-first CSS framework for rapid UI development without writing custom CSS files
- **Axios (v1.6)** - HTTP client for making API requests; provides interceptors for attaching auth tokens and handling errors globally
- **react-hot-toast (v2.4)** - Lightweight toast notification library for showing success/error messages to users

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection setup
│   ├── middleware/
│   │   └── auth.js            # JWT verification and role-based access control
│   ├── models/
│   │   ├── User.js            # Participant and auth user schema
│   │   ├── Organizer.js       # Club/organizer profile schema
│   │   ├── Event.js           # Event schema with form builder and merch support
│   │   ├── Registration.js    # Registration records linking users to events
│   │   └── Ticket.js          # Generated tickets with QR codes
│   ├── routes/
│   │   ├── authRoutes.js      # Login, register, session endpoints
│   │   ├── userRoutes.js      # Participant profile, preferences, follow/unfollow
│   │   ├── eventRoutes.js     # Browse, search, filter, register for events
│   │   ├── organizerRoutes.js # Event CRUD, analytics, CSV export, profile
│   │   ├── adminRoutes.js     # Organizer management, stats, password resets
│   │   └── ticketRoutes.js    # Ticket lookup endpoints
│   ├── utils/
│   │   ├── seedAdmin.js       # Seeds initial admin account on first run
│   │   ├── generateTicket.js  # Creates ticket with unique ID and QR code
│   │   └── sendEmail.js       # Email sending utility using nodemailer
│   ├── server.js              # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state management
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Role-based navigation bar
│   │   │   └── ProtectedRoute.jsx # Route guard with role checking
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Signup.jsx         # Participant registration
│   │   │   ├── Onboarding.jsx     # Interest and club selection
│   │   │   ├── participant/       # Participant-specific pages
│   │   │   ├── organizer/         # Organizer-specific pages
│   │   │   └── admin/             # Admin-specific pages
│   │   ├── utils/
│   │   │   └── api.js             # Axios instance with interceptors
│   │   ├── App.jsx                # Main routing configuration
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── deployment.txt
└── README.md
```

## Features Implemented (Part 1)

### Authentication & Security [8 Marks]
- Participant registration with IIIT email domain validation
- Non-IIIT participant registration with email/password
- Organizer accounts provisioned by Admin (no self-registration)
- Admin account seeded via backend on first run
- Passwords hashed using bcrypt (no plaintext storage)
- JWT-based authentication on all protected routes
- Role-based access control on frontend and backend
- Persistent sessions via localStorage; logout clears all tokens

### User Onboarding & Preferences [3 Marks]
- Post-signup interest selection (multiple categories)
- Option to follow clubs/organizers during onboarding
- Skip option available; preferences editable from Profile page
- Preferences stored in database and influence event ordering

### User Data Models [2 Marks]
- Participant: firstName, lastName, email, participantType, collegeName, contactNumber, hashed password, interests, followedOrganizers
- Organizer: name, category, description, contactEmail, contactNumber, discordWebhook, isActive flag

### Event Types [2 Marks]
- Normal Event (individual registration with custom form)
- Merchandise Event (individual purchase with variant selection)

### Event Attributes [2 Marks]
- Name, description, type, eligibility, registration deadline, start/end dates, registration limit, fee, organizer reference, tags, status, view count
- Normal events: dynamic custom form fields (form builder)
- Merchandise events: variant items with size, color, stock, purchase limit

### Participant Features [22 Marks]
- **Navbar**: Dashboard, Browse Events, Clubs/Organizers, Profile, Logout
- **My Events Dashboard**: Upcoming events display, participation history with tabs (Normal, Merchandise, Completed, Cancelled), ticket ID references
- **Browse Events**: Search with partial/fuzzy matching, trending top 5, filters (type, eligibility, date range, followed clubs)
- **Event Details**: Full event info, type indicator, registration/purchase button with validation, blocking for deadline/limit
- **Event Registration**: Normal event form submission with ticket + email; Merchandise purchase with stock decrement, QR ticket, confirmation email
- **Profile Page**: Editable fields (name, contact, college, interests, followed clubs); non-editable email and participant type; password change
- **Clubs/Organizers Listing**: All active organizers with follow/unfollow
- **Organizer Detail Page**: Info, upcoming and past events

### Organizer Features [18 Marks]
- **Navbar**: Dashboard, Create Event, Profile, Logout
- **Dashboard**: Events carousel with status cards, analytics (registrations, sales, revenue, completed events), full event table
- **Event Detail (Organizer View)**: Overview with status, analytics (registrations, attended, cancelled, revenue), participant list with search/filter, CSV export
- **Event Creation & Editing**: 3-step flow (Basic Info → Form Builder/Merch → Review), draft/publish workflow, editing rules enforced per status, form builder with field types and reordering
- **Profile**: Editable name, category, description, contact; Discord webhook for auto-posting new events

### Admin Features [6 Marks]
- **Navbar**: Dashboard, Manage Clubs/Organizers, Logout
- **Dashboard**: System stats (participants, organizers, events, active events)
- **Club/Organizer Management**: Create with auto-generated credentials, disable/enable accounts, permanent delete option, password reset

## Setup & Installation

### Prerequisites
- Node.js v18+ installed
- MongoDB Atlas account (or local MongoDB instance)
- Gmail account for sending emails (with App Password enabled)

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/felicity
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

The admin account is seeded automatically on first run:
- Email: `admin@felicity.com`
- Password: `admin123`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on port 5000.

### Production Build
```bash
cd frontend
npm run build
```

## Design Decisions

1. **Single User model with role field** - Instead of separate collections per role, a single User model with a `role` field keeps authentication simple. Organizer-specific data is stored in a separate Organizer collection linked via userId.

2. **Event status state machine** - Events follow a strict lifecycle: Draft → Published → Ongoing → Completed/Closed. Editing permissions are restricted based on current status to prevent data inconsistencies.

3. **Form builder stored as subdocuments** - Custom registration form fields are embedded within the Event document as an array of subdocuments, avoiding the need for a separate forms collection and simplifying queries.

4. **QR codes as base64 data URLs** - QR codes are generated server-side and stored as base64 strings in the Ticket document. This avoids file system dependencies and makes tickets portable.

5. **JWT with 7-day expiry** - Balances security with user convenience. Tokens are stored in localStorage for session persistence across browser restarts, as required by the spec.
