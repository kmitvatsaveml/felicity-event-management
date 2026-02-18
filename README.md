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
│   │   ├── Registration.js    # Registration records with payment approval fields
│   │   ├── Ticket.js          # Generated tickets with QR codes
│   │   ├── ForumMessage.js    # Discussion forum messages with threading
│   │   ├── Feedback.js        # Anonymous event feedback with ratings
│   │   └── PasswordResetRequest.js # Organizer password reset workflow
│   ├── routes/
│   │   ├── authRoutes.js      # Login, register, session endpoints
│   │   ├── userRoutes.js      # Participant profile, preferences, follow/unfollow
│   │   ├── eventRoutes.js     # Browse, search, filter, register, payment upload
│   │   ├── organizerRoutes.js # Event CRUD, analytics, CSV, payments, QR scanning
│   │   ├── adminRoutes.js     # Organizer management, stats, password reset workflow
│   │   ├── ticketRoutes.js    # Ticket lookup endpoints
│   │   ├── forumRoutes.js     # Discussion forum CRUD, moderation, reactions
│   │   └── feedbackRoutes.js  # Anonymous feedback submission and aggregation
│   ├── uploads/               # Payment proof images
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
│   │   │   ├── participant/
│   │   │   │   ├── Dashboard.jsx      # My events and participation history
│   │   │   │   ├── BrowseEvents.jsx   # Search and filter events
│   │   │   │   ├── EventDetails.jsx   # Event info and registration
│   │   │   │   ├── EventForum.jsx     # Discussion forum for events
│   │   │   │   ├── EventFeedback.jsx  # Anonymous feedback submission
│   │   │   │   ├── TicketDetail.jsx   # Ticket view with QR code
│   │   │   │   ├── Profile.jsx        # Participant profile management
│   │   │   │   ├── ClubsListing.jsx   # Browse and follow organizers
│   │   │   │   └── OrganizerView.jsx  # Organizer detail page
│   │   │   ├── organizer/
│   │   │   │   ├── Dashboard.jsx      # Organizer overview and analytics
│   │   │   │   ├── CreateEvent.jsx    # 3-step event creation
│   │   │   │   ├── EditEvent.jsx      # Status-based event editing
│   │   │   │   ├── EventDetail.jsx    # Event detail with participants
│   │   │   │   ├── PaymentApprovals.jsx # Merchandise payment review
│   │   │   │   ├── QRScanner.jsx      # QR scanner and attendance
│   │   │   │   └── Profile.jsx        # Organizer profile management
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx      # System stats
│   │   │       ├── ManageClubs.jsx    # Organizer CRUD
│   │   │       └── PasswordResetRequests.jsx # Reset workflow
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

## Advanced Features Implemented (Part 2) [30 Marks]

### Tier A: Core Advanced Features [16 Marks]

#### 1. Merchandise Payment Approval Workflow [8 Marks]
**Justification:** Chosen because it builds directly on the existing merchandise event system and adds real-world payment verification logic that demonstrates complex state management.

**Implementation approach:**
- Extended the Registration model with `paymentStatus` (pending/approved/rejected), `paymentProof` (file path), `paymentReviewedBy`, and `paymentNote` fields
- When a participant purchases merchandise with a fee, the order enters `pending_payment` status instead of immediately generating a ticket
- Participant uploads a payment proof image via multer file upload to `/api/events/:id/upload-payment`
- Organizers see a dedicated Payment Approvals tab (`/organizer/events/:id/payments`) with filter tabs for all/pending/approved/rejected orders
- On approval: ticket with QR code is generated, stock is decremented, confirmation email is sent via nodemailer
- On rejection: participant is notified via email with the rejection reason and can re-upload a new proof
- No QR code or ticket is generated while the order is in pending or rejected state

**Technical decisions:**
- Used multer for server-side file upload handling with 5MB size limit
- Payment proof images are stored in the `/uploads` directory and served as static files
- Approval/rejection actions are idempotent and include audit fields (reviewedBy, reviewedAt)

#### 2. QR Scanner & Attendance Tracking [8 Marks]
**Justification:** Chosen because it completes the event lifecycle by enabling organizers to verify tickets and track attendance during events, leveraging the existing QR code infrastructure.

**Implementation approach:**
- Built a scanner interface at `/organizer/events/:id/scanner` where organizers enter or paste ticket IDs
- Backend validates the ticket against the specific event, checks for duplicate scans, and marks attendance with timestamp
- Live attendance dashboard shows scanned vs not-yet-scanned counts with a progress bar
- Duplicate scan detection returns the original scan time and participant name
- Cancelled or rejected registrations are blocked from scanning
- Manual override allows organizers to mark/unmark attendance for exceptional cases
- Attendance reports exportable as CSV with name, email, ticket ID, status, and scan timestamp
- Scan history displayed in real-time on the scanner page

**Technical decisions:**
- Used text input for ticket ID entry (works with physical QR scanners that output text, mobile camera apps, or manual entry)
- Attendance is tracked by changing registration status to `attended`, avoiding a separate attendance collection
- Export endpoint generates CSV server-side for reliable formatting

### Tier B: Real-time & Communication Features [12 Marks]

#### 1. Real-Time Discussion Forum [6 Marks]
**Justification:** Chosen because it adds collaborative functionality to events, allowing participants and organizers to interact, which improves engagement and communication.

**Implementation approach:**
- Created a ForumMessage model with fields for eventId, userId, content, parentId (for threading), isPinned, isAnnouncement, reactions, and isDeleted (soft delete)
- Forum page at `/events/:id/forum` accessible to registered participants and the event organizer
- Messages are polled every 5 seconds for near real-time updates without requiring WebSocket infrastructure
- Organizers can post announcements (highlighted with a distinct style), pin important messages, and moderate by deleting inappropriate content
- Participants can reply to messages (threaded view), react with emoji (👍 or ❤️), and delete their own messages
- Reactions toggle on/off per user per emoji to prevent spam
- Messages sorted with pinned first, then by creation date

**Technical decisions:**
- Used polling (setInterval 5s) instead of WebSockets to keep the infrastructure simple and deployment-friendly on free hosting tiers
- Soft delete (isDeleted flag) preserves data integrity while hiding deleted messages from the UI
- Compound index on `eventId + createdAt` for efficient message retrieval

#### 2. Organizer Password Reset Workflow [6 Marks]
**Justification:** Chosen because it implements a complete request-approval lifecycle that demonstrates workflow management, and it directly addresses the spec requirement that organizer password resets must go through Admin.

**Implementation approach:**
- Created a PasswordResetRequest model with fields for organizerId, userId, reason, status (pending/approved/rejected), adminComment, newPassword, and reviewedAt
- Organizers can submit a password reset request from their profile with a reason (via `/api/admin/password-reset-request`)
- Duplicate pending requests are prevented (one active request per organizer)
- Admin sees all requests at `/admin/password-resets` with filter tabs for pending/approved/rejected
- Admin can approve (auto-generates new password, updates the user record, displays credentials) or reject (with a comment explaining why)
- Request history is maintained with timestamps for full audit trail
- Generated passwords are displayed to admin for sharing with the organizer

**Technical decisions:**
- Password generation uses `crypto.randomBytes(6).toString('hex')` for 12-character random passwords
- New password is hashed with bcrypt before storing in the User model
- The plaintext password is stored in the request record so admin can reference it later if needed

### Tier C: Integration & Enhancement Features [2 Marks]

#### 1. Anonymous Feedback System [2 Marks]
**Justification:** Chosen because it provides valuable post-event insights for organizers with minimal implementation complexity, and it enhances the participant experience by giving them a voice.

**Implementation approach:**
- Created a Feedback model with eventId, userId, rating (1-5 stars), and comment fields
- One feedback per user per event enforced via compound unique index
- Participants who attended an event can submit feedback at `/events/:id/feedback`
- Star rating with hover preview and optional text comment
- Organizers see aggregated stats: average rating, total reviews, rating distribution bar chart, and individual comments
- Feedback is displayed anonymously (no user names shown in the feedback list)
- Users can update their feedback if they change their mind

**Technical decisions:**
- Used a unique compound index (`eventId + userId`) to enforce one feedback per participant per event at the database level
- Aggregation is computed server-side to keep the frontend lightweight
- Comments are displayed without user identification to maintain true anonymity

## Libraries and Frameworks Summary

| Library | Version | Purpose |
|---------|---------|---------|
| express | 4.18 | REST API framework |
| mongoose | 7.6 | MongoDB ODM with schema validation |
| bcrypt | 5.1 | Password hashing |
| jsonwebtoken | 9.0 | JWT authentication |
| nodemailer | 6.9 | Email notifications |
| qrcode | 1.5 | QR code generation for tickets |
| multer | 1.4 | File upload handling (payment proofs) |
| uuid | 9.0 | Unique ticket ID generation |
| cors | 2.8 | Cross-origin request support |
| dotenv | 16.3 | Environment variable management |
| react | 18.2 | UI component library |
| vite | 5.0 | Fast dev server and build tool |
| react-router-dom | 6.20 | Client-side routing |
| tailwindcss | 3.3 | Utility-first CSS framework |
| axios | 1.6 | HTTP client with interceptors |
| react-hot-toast | 2.4 | Toast notifications |
