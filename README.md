    # DoctorsCares

    Egypt-focused healthcare portal built with **Node.js**, **Express**, **EJS**, and **MongoDB**. Patients can find verified doctors and book appointments; doctors manage schedules, patients, and earnings; administrators operate the platform, site content, and finances—all backed by the database, not hardcoded dashboard data.

    **Live URL (local):** http://localhost:5000

    ---

    ## Features

    ### Public website
    - **Home** — Hero, live stats, testimonials (editable by admin)
    - **Find Doctors** — Search and filter verified doctors; patients can book when logged in
    - **Services**, **About**, **Blog** — Content loaded from MongoDB
    - **Contact** — Contact details and message form (stored in DB)
    - **Custom 404** page for unknown routes

### Patient (`/patient/...`)
- **Medical History** — visual year-by-year timeline (visits, tests, checkups, follow-ups)
- **Family Accounts** — manage father, mother, children; book appointments for family members
- Overview with upcoming visits and notifications
    - Book, view, and cancel appointments
    - Health records (visit notes from completed consultations)
    - My Doctors and profile management
    - Public signup creates **patient** accounts only

### Doctor (`/doctor/...`)
- **Patient Priority Ranking** — high/medium priority patients (chronic disease, missed follow-up, abnormal tests)
- **Smart Schedule Optimizer** — empty slots, overbooking, idle gaps, move suggestions
- Overview, appointments (accept / reject / reschedule / cancel)
    - Working hours, lunch break, blocked dates
    - Patient list, visit notes, earnings (daily / weekly / monthly)
    - Profile and clinic settings

    ### Admin (`/admin/...`)
    - Dashboard with platform stats and revenue
    - Doctor verification, suspension, featured doctors
    - Patient and appointment management
    - Payments, refunds, categories (specialties & cities)
    - Announcements, reports, system settings
    - CMS: home, about, services, blogs, contact, footer, testimonials

    ---

    ## Tech stack

    | Layer | Technology |
    |--------|------------|
    | Runtime | Node.js |
    | Framework | Express 5 |
    | Views | EJS |
    | Database | MongoDB (Mongoose) |
    | Auth | Express sessions (stored in MongoDB via `connect-mongo`) |
    | Passwords | bcrypt |
    | Dev | nodemon |

    ---

    ## Prerequisites

    - **Node.js** 18+ (LTS recommended)
    - **MongoDB** Atlas cluster or local MongoDB instance
    - npm

    ---

    ## Installation

    ```bash
    # Clone or extract the project, then:
    cd DoctorsCares-main

    npm install

    cp .env.example .env
    # Edit .env with your MongoDB URI and secrets
    ```

    ---

    ## Environment variables

    Create a `.env` file in the project root (see `.env.example`):

    | Variable | Description |
    |----------|-------------|
    | `PORT` | Server port (default `5000`) |
    | `MONGODB_URI` | MongoDB connection string |
    | `SESSION_SECRET` | Secret for signing session cookies |
    | `ADMIN_EMAIL` | Default admin email (seeded on first run if missing) |
    | `ADMIN_PASSWORD` | Default admin password |
    | `ADMIN_NAME` | Default admin display name |

    **MongoDB tip:** If `mongodb+srv://` fails with `querySrv ECONNREFUSED`, use a standard `mongodb://` URI with explicit hostnames (see comment in `.env.example`).

    ---

    ## Running the app

    ```bash
    # Development (auto-restart)
    npm run dev

    # Production
    npm start

    # Re-run all seeds manually (optional)
    npm run seed
    ```

    On startup the app will:
    1. Connect to MongoDB
    2. Seed demo users, platform data, site content, and sample doctor/patient records (only if missing)

    Open http://localhost:5000

    ---

    ## Demo accounts

    | Role | Email | Password |
    |------|--------|----------|
    | Admin | `admin@doctorscares.eg` | `admin123` |
    | Doctor | `doctor@doctorscares.eg` | `doctor123` |
    | Patient | `patient@doctorscares.eg` | `patient123` |

    After login you are redirected to the correct dashboard. Sessions persist for **2 hours** (cookie + MongoDB store).

    ---

    ## Main routes

    ### Public
    | Path | Description |
    |------|-------------|
    | `/` | Home |
    | `/doctors` | Find doctors |
    | `/services` | Services |
    | `/about` | About |
    | `/blogs` | Blog |
    | `/contact` | Contact (POST saves message) |
    | `/auth/login` | Login / signup |
    | `/auth/logout` | Logout |

    ### Patient
    | Path | Description |
    |------|-------------|
    | `/patient/medical-history` | Visual medical history timeline |
| `/patient/family` | Family accounts (book for relatives) |
| `/patient/dashboard` | Overview |
    | `/patient/appointments` | Book & manage appointments (`?focus=book`, `?doctorId=`, `?apptTab=`) |
    | `/patient/records` | Health records |
    | `/patient/doctors` | My doctors |
    | `/patient/notifications` | Notifications |
    | `/patient/profile` | Profile |

    ### Doctor
    | Path | Description |
    |------|-------------|
    | `/doctor/dashboard` | Overview |
    | `/doctor/appointments` | Appointments (`?apptTab=`) |
    | `/doctor/schedule` | Schedule & blocked dates |
    | `/doctor/patients` | Patients |
    | `/doctor/earnings` | Earnings |
    | `/doctor/notifications` | Notifications |
    | `/doctor/profile` | Profile |

    ### Admin
    | Path | Description |
    |------|-------------|
| `/admin/dashboard` | Dashboard |
    | `/admin/doctors` | Doctors |
    | `/admin/patients` | Patients |
    | `/admin/appointments` | Appointments |
    | `/admin/payments` | Payments & refunds |
    | `/admin/categories` | Specialties & cities |
    | `/admin/reports` | Reports |
    | `/admin/notifications` | Announcements |
    | `/admin/settings` | System settings |
    | `/admin/content/home` | Home page CMS |
    | `/admin/content/about` | About page |
    | `/admin/content/services` | Services |
    | `/admin/content/blogs` | Blog posts |
    | `/admin/content/contact` | Contact page & inbox |
    | `/admin/content/footer` | Footer |

    ### Legacy redirects
    Old single-page dashboard URLs still work and redirect to the new paths:
    - `/patient-dashboard?section=...` → `/patient/...`
    - `/doctor-dashboard?section=...` → `/doctor/...`
    - `/admin-dashboard` → `/admin/dashboard`

    ---

    ## Project structure

    ```
    DoctorsCares-main/
    ├── app.js                 # Entry point, middleware, route mounting
    ├── public/                # Static CSS, JS, images
    │   ├── css/
    │   └── js/
    ├── views/
    │   ├── partials/          # head, navbar, footer
    │   ├── admin/             # Admin layout + pages
    │   ├── doctor/            # Doctor layout + pages
    │   ├── patient/           # Patient layout + pages
    │   ├── 404.ejs
    │   ├── index.ejs          # Public pages
    │   └── login.ejs
    └── server/
        ├── auth/              # Session helpers, requireRole
        ├── config/            # Session (MongoDB store)
        ├── middleware/        # Site footer/globals
        ├── models/            # Mongoose schemas
        ├── routes/            # Express routers
        ├── services/          # Data & content logic
        ├── seed/              # Database seeders
        └── utils/             # Redirects, helpers
    ```

    ---

    ## Data models

    `User`, `Patient`, `Doctor`, `Admin`, `Appointment`, `Payment`, `VisitNote`, `Specialty`, `City`, `Announcement`, `SystemSetting`, `SitePage`, `ServiceItem`, `BlogPost`, `Testimonial`, `ContactMessage`

    Dashboards and public pages load data through **service** modules (`patientDataService`, `doctorDataService`, `adminDataService`, `contentService`, etc.).

    ---

    ## Authentication

    - **Sessions** — Cookie `doctorscares.sid`, stored in MongoDB (`sessions` collection)
    - **Roles** — `patient`, `doctor`, `admin` (stored on `User`)
    - **Protected routes** — `requireRole('role')` middleware; unauthenticated users go to `/auth/login?next=...`
    - **Signup** — Patients only; doctors are promoted by admin

    ---

    ## Appointments & payments

    1. Patient books → `Appointment` (`pending`) + `Payment` (`pending`)
    2. Doctor **accepts** → appointment `confirmed`, payment `success`
    3. Doctor **rejects** / either party **cancels** → appointment `cancelled`, payment `denied`

    There is **no payment gateway** (card/PayPal) in the UI yet—fees are recorded in the database for admin reporting and doctor earnings. Minimum booking fee is configurable in admin settings.

    ---

    ## Scripts

    | Command | Description |
    |---------|-------------|
    | `npm run dev` | Start with nodemon |
    | `npm start` | Start production server |
    | `npm run seed` | Run all seed scripts once |

    ---

    ## Troubleshooting

    | Issue | Suggestion |
    |-------|------------|
    | MongoDB connection fails | Check `MONGODB_URI`; try standard `mongodb://` URI instead of `mongodb+srv://` |
    | Logged out on every page | Restart server; ensure MongoDB is reachable (sessions use DB) |
    | Empty doctors list | Run `npm run seed`; ensure doctor is `verified` in admin |
    | 404 on old links | Use new `/patient/...` or `/doctor/...` URLs (legacy redirects exist) |

    ---

    ## License

    ISC
