# Felicity Event Management System

A centralized platform built for managing events, clubs, and participants for the Felicity fest at IIIT Hyderabad. The system replaces the traditional chaos of Google Forms, spreadsheets, and WhatsApp groups with a structured, role-based platform where clubs can run events and participants can register, pay, and attend — all in one place.

Built with the **MERN stack**: MongoDB, Express.js, React, and Node.js.

---

## Technology Stack

### Backend Libraries

| Library | Version | What it does |
|---------|---------|--------------|
| express | 4.18 | Web framework used to define all REST API routes and middleware |
| mongoose | 7.6 | MongoDB object modeling — provides schema definitions, validation, and query helpers |
| bcrypt | 5.1 | Hashes passwords before storing them so plaintext passwords are never saved to the database |
| jsonwebtoken | 9.0 | Creates and verifies JWT tokens used for stateless authentication across all protected routes |
| nodemailer | 6.9 | Sends emails to participants on registration confirmation, ticket delivery, and payment approval |
| qrcode | 1.5 | Generates QR code images (as base64 data URLs) embedded inside each ticket |
| uuid | 9.0 | Generates unique ticket IDs in the format `TKT-XXXXXXXX` to avoid collisions |
| multer | 1.4 | Handles file uploads (specifically payment proof images) from multipart form requests |
| cors | 2.8 | Allows the frontend (on a different origin) to make requests to the backend without being blocked |
| dotenv | 16.3 | Reads environment variables from a `.env` file so secrets like DB credentials are not hardcoded |
| crypto | built-in | Used to generate random passwords when admin approves an organizer's password reset request |

### Frontend Libraries

| Library | Version | What it does |
|---------|---------|--------------|
| react | 18.2 | Core UI library — all pages and components are built as React functional components |
| vite | 5.0 | Development server and build tool; much faster than CRA with instant hot module replacement |
| react-router-dom | 6.20 | Handles client-side routing and navigation between pages without full page reloads |
| tailwindcss | 3.3 | Utility-first CSS framework — used for all styling without writing separate CSS files |
| axios | 1.6 | HTTP client for API calls; configured with interceptors to auto-attach JWT tokens and handle 401 errors |
| react-hot-toast | 2.4 | Displays lightweight toast notifications for success and error feedback to the user |

---

## Project Structure

```
2025121016/
├── backend/
│   ├── config/
│   │   └── db.js                    # Connects to MongoDB using the URI from .env
│   ├── middleware/
│   │   └── auth.js                  # Verifies JWT on each request; enforces role-based access
│   ├── models/
│   │   ├── User.js                  # All users (participants, organizers, admin) with role field
│   │   ├── Organizer.js             # Club profile details linked to a User record
│   │   ├── Event.js                 # Event data including custom form fields and merchandise variants
│   │   ├── Registration.js          # Each participant's registration, including payment status fields
│   │   ├── Ticket.js                # Generated tickets with unique ID and QR code
│   │   ├── ForumMessage.js          # Discussion forum messages with threading and reactions
│   │   ├── Feedback.js              # Anonymous star ratings and comments per event
│   │   └── PasswordResetRequest.js  # Organizer password reset requests and their approval status
│   ├── routes/
│   │   ├── authRoutes.js            # Login, participant registration, session info
│   │   ├── userRoutes.js            # Participant profile updates, interests, follow/unfollow
│   │   ├── eventRoutes.js           # Event browsing, registration, payment proof upload
│   │   ├── organizerRoutes.js       # Event CRUD, analytics, CSV export, payment approvals, QR scanning
│   │   ├── adminRoutes.js           # Organizer account management, password reset workflow
│   │   ├── ticketRoutes.js          # Ticket lookup by ticket ID
│   │   ├── forumRoutes.js           # Forum message posting, reactions, pinning, deletion
│   │   └── feedbackRoutes.js        # Feedback submission and aggregated stats
│   ├── uploads/                     # Uploaded payment proof images stored here
│   ├── utils/
│   │   ├── seedAdmin.js             # Creates the default admin account on first server start
│   │   ├── generateTicket.js        # Creates a ticket with unique ID and QR code image
│   │   └── sendEmail.js             # Sends emails via nodemailer (confirmations, approvals, rejections)
│   ├── server.js                    # Express entry point — middleware, routes, server start
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Provides login/logout state and user info to all components
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Navigation bar with links based on the logged-in user's role
│   │   │   └── ProtectedRoute.jsx   # Redirects unauthenticated or wrong-role users away from a page
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login form for all roles
│   │   │   ├── Signup.jsx           # Registration form for participants
│   │   │   ├── Onboarding.jsx       # Post-signup page to select interests and follow clubs
│   │   │   ├── participant/
│   │   │   │   ├── Dashboard.jsx        # Upcoming events and past participation history
│   │   │   │   ├── BrowseEvents.jsx     # All published events with search and filter options
│   │   │   │   ├── EventDetails.jsx     # Full event info, registration, and merchandise purchase
│   │   │   │   ├── EventForum.jsx       # Discussion forum for a specific event
│   │   │   │   ├── EventFeedback.jsx    # Anonymous feedback submission and summary view
│   │   │   │   ├── TicketDetail.jsx     # Participant's ticket with QR code
│   │   │   │   ├── Profile.jsx          # Editable participant profile, interests, password change
│   │   │   │   ├── ClubsListing.jsx     # All active organizer clubs with follow/unfollow
│   │   │   │   └── OrganizerView.jsx    # A club's profile and their events
│   │   │   ├── organizer/
│   │   │   │   ├── Dashboard.jsx        # All events overview with analytics summary
│   │   │   │   ├── CreateEvent.jsx      # Three-step form to create a new event
│   │   │   │   ├── EditEvent.jsx        # Edit an existing event based on its current status
│   │   │   │   ├── EventDetail.jsx      # Detailed event view with participant list and actions
│   │   │   │   ├── PaymentApprovals.jsx # Review and approve or reject merchandise payment proofs
│   │   │   │   ├── QRScanner.jsx        # Scan ticket IDs to mark attendance and view live stats
│   │   │   │   └── Profile.jsx          # Edit organizer profile and submit password reset requests
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx            # System-wide stats overview
│   │   │       ├── ManageClubs.jsx          # Create, disable, enable, and delete organizer accounts
│   │   │       └── PasswordResetRequests.jsx # Approve or reject organizer password reset requests
│   │   ├── utils/
│   │   │   └── api.js               # Axios instance with base URL, auth token interceptor, 401 handler
│   │   ├── App.jsx                  # All frontend routes with role-based protection
│   │   └── main.jsx                 # React entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── deployment.txt
└── README.md
```

## How the System Works

### User Roles

There are three roles. Each user has exactly one role and cannot switch.

- **Participant** — registers for events, purchases merchandise, views tickets, follows clubs, posts in forums, and submits feedback.
- **Organizer** — represents a club; creates and manages events, reviews payment proofs, scans tickets for attendance, and moderates the discussion forum.
- **Admin** — manages organizer accounts and handles organizer password reset requests.

### Authentication

All users log in with email and password. Passwords are hashed with bcrypt before being stored. On login, a JWT token is returned and stored in the browser's localStorage. Every API request attaches this token in the Authorization header. The backend verifies the token and checks the user's role before allowing access. Sessions persist across browser restarts and expire after 7 days.

Organizer accounts are created only by the Admin — organizers cannot self-register. The Admin account is seeded automatically when the backend starts for the first time.

### Events

Events have two types:

- **Normal events** — participants fill out a custom registration form built by the organizer. On successful registration, a ticket with a unique ID and QR code is generated and emailed to the participant.
- **Merchandise events** — participants select a size/color variant and quantity. If the event has a fee, the order enters a payment approval workflow before a ticket is issued.

Events follow a status lifecycle: **Draft → Published → Ongoing → Completed / Closed**. Organizers can only edit certain fields depending on the current status.

### Participant Flow

1. Sign up → complete onboarding (select interests, follow clubs)
2. Browse events using search, filters, or the trending section
3. Register for an event or purchase merchandise
4. View ticket with QR code on the event page or dashboard
5. Participate in the event forum, submit feedback after the event

### Organizer Flow

1. Log in → create events using a three-step form
2. Publish events when ready
3. View registrations, analytics, and participant list
4. For merchandise events: review payment proofs and approve or reject
5. During the event: use the QR scanner to mark attendance
6. After the event: view anonymous feedback from participants

### Admin Flow

1. Log in → view system stats
2. Create organizer accounts (credentials are auto-generated)
3. Disable or delete organizer accounts as needed
4. Review and approve or reject organizer password reset requests

---

## Advanced Features

### Merchandise Payment Approval Workflow

**Why this was chosen:** It builds directly on the existing merchandise event system and adds a real-world payment verification step. It demonstrates a multi-state workflow with file uploads, organizer review, and conditional ticket generation.

When a participant purchases merchandise from a paid event, the order enters a **pending payment** state. The participant sees an upload prompt where they attach a screenshot or image of their payment.

The organizer opens the **Payment Approvals** page for that event. Orders are listed with participant name, item details, and the uploaded payment image. The organizer can:
- **Approve** — the order is marked successful, stock is decremented, a ticket with QR code is generated, and a confirmation email is sent.
- **Reject** — the organizer provides a reason; the participant sees the rejection message and can re-upload a new proof.

No ticket or QR code is generated while the order is in pending or rejected state.

Implementation details:
- The Registration model has `paymentStatus` (pending/approved/rejected), `paymentProof` (file path), `paymentNote`, `paymentReviewedBy`, and `paymentReviewedAt` fields.
- Payment proof images are uploaded via multer with a 5MB size limit and stored in the `uploads/` directory.
- The backend serves the uploads folder as static files so the organizer can view the image directly in the browser.

---

### QR Scanner and Attendance Tracking

**Why this was chosen:** It completes the event lifecycle. Tickets with QR codes are already generated — this feature closes the loop by letting organizers actually validate those tickets at the door and track who showed up.

Organizers open the **QR Scanner** page for any of their events. They enter or paste a ticket ID (readable from any QR scanner app or typed manually). The backend:
- Confirms the ticket belongs to this event
- Checks the registration is not cancelled or rejected
- Detects duplicate scans and returns the original scan time
- If valid, marks the registration as `attended` with a timestamp

The page shows a live attendance dashboard with checked-in count, total registered, a progress bar, and lists of who has and has not been scanned. Organizers can manually mark or unmark any participant for exceptional cases. An **Export CSV** button downloads the full attendance report.

Implementation details:
- Attendance is tracked by updating the registration status to `attended` — no separate attendance collection needed.
- Text input for ticket ID works with any physical barcode/QR scanner that outputs text as keyboard input.
- CSV export is generated server-side for consistent formatting.

---

### Organizer Password Reset Workflow

**Why this was chosen:** Organizers cannot reset their own passwords — it must go through the Admin. This implements that complete request-approval lifecycle with status tracking and audit history.

Organizers submit a **password reset request** from their profile page with a reason. The admin sees all pending requests on the **Password Resets** page and can:
- **Approve** — a new random 12-character password is generated, hashed, and saved. The plaintext password is shown to the admin to share with the organizer.
- **Reject** — the admin provides a comment explaining why.

Duplicate pending requests are blocked — an organizer cannot submit a new request while one is already pending. All requests are stored with timestamps for a full history.

Implementation details:
- The PasswordResetRequest model stores organizerId, userId, reason, status, adminComment, newPassword, and reviewedAt.
- New passwords are generated using `crypto.randomBytes(6).toString('hex')` — a secure 12-character hex string.
- The new password is hashed with bcrypt before being saved to the User record.

---

### Real-Time Discussion Forum

**Why this was chosen:** It adds a communication layer to events so participants can ask questions and interact with the organizer, and organizers can post announcements — all within the platform.

Each event has a **Discussion Forum** accessible from the event detail page. Registered participants and the organizer can post messages.

Features:
- **Posting** — any registered participant or the organizer can post
- **Threading** — participants can reply to a specific message; replies appear indented under the original
- **Reactions** — users can react with 👍 or ❤️; clicking again removes the reaction
- **Organizer moderation** — organizers can pin messages (they appear at the top), post announcements (highlighted differently), and delete any message
- **Self-delete** — participants can delete their own messages
- **Near real-time updates** — the forum polls for new messages every 5 seconds

Implementation details:
- The ForumMessage model has eventId, userId, content, parentId (for threading), isPinned, isAnnouncement, reactions array, and isDeleted flag.
- Polling every 5 seconds was chosen over WebSockets to keep the backend simple and work on free hosting tiers.
- Deleted messages use a soft-delete flag rather than being removed from the database.
- A compound index on `eventId + createdAt` ensures efficient retrieval.

---

### Anonymous Feedback System

**Why this was chosen:** It gives participants a way to share their experience after an event, and gives organizers useful aggregated data — with minimal complexity to implement.

After an event, registered participants can submit **anonymous feedback** from the event page. Feedback is a star rating (1 to 5) and an optional text comment.

The feedback page shows:
- A star rating selector with hover preview
- A text area for comments
- After submission: average rating, total reviews, a rating distribution bar chart, and individual comments — all without any user names attached

Participants can update their feedback if they change their mind.

Implementation details:
- The Feedback model has eventId, userId, rating, and comment fields.
- A unique compound index on `eventId + userId` enforces one feedback per participant per event at the database level.
- Aggregation (average, distribution) is computed on the backend.
- Comments are returned without any user identification to maintain anonymity.

---

## Setup and Installation

### Prerequisites

- Node.js v18 or higher
- A MongoDB Atlas cluster (or local MongoDB)
- A Gmail account with an App Password enabled (for sending emails)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/felicity
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The admin account is created automatically on first run:
- Email: `admin@felicity.com`
- Password: `admin123`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`. API requests and uploaded file requests are proxied to the backend on port 5001 via Vite's proxy configuration.

### Production Build

```bash
cd frontend
npm run build
```

The built files go into `frontend/dist/` and can be served by any static hosting provider such as Netlify.

---

## Key Design Decisions

**Single User collection with a role field** — All users are stored in one User collection with a `role` field (participant, organizer, admin). Organizer-specific data lives in a separate Organizer collection linked by `userId`. This keeps authentication logic consistent across all roles.

**Event status as a state machine** — Events move through Draft → Published → Ongoing → Completed/Closed. What an organizer can edit depends on the current status. For example, the registration fee cannot be changed after an event is published.

**Custom form fields as embedded subdocuments** — Each event stores its registration form fields as an array inside the Event document. This avoids a separate forms collection and keeps all event data in one query.

**QR codes stored as base64 strings** — QR codes are generated server-side using the `qrcode` library and stored as base64 data URLs in the Ticket document. This avoids file system dependencies and makes tickets self-contained.

**JWT with 7-day expiry** — Tokens are stored in localStorage for session persistence across browser restarts. The 7-day window balances security with convenience for a fest platform.

**Polling for forum updates** — The discussion forum polls the backend every 5 seconds instead of using WebSockets. This keeps the server stateless and works reliably on free hosting tiers without any additional infrastructure.
