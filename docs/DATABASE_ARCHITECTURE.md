# Smart Municipal Management Platform - Database Architecture

This document outlines the MongoDB/Mongoose database architecture designed for scalability, clear data ownership, and strict separation of concerns.

## 1. Database Specifications
- **Database Engine:** MongoDB Atlas
- **Database Name:** `smart_municipal`
- **ORM:** Mongoose (Node.js)

## 2. Security & Design Rules
1. **Never store plaintext passwords:** Always hash using `bcryptjs` and omit via `select: false`.
2. **Never expose connection strings:** Keep `MONGODB_URI` securely in `server/.env`.
3. **Reference Strategy:** Use Mongoose `ObjectId` references for scalable entity relationships instead of unnecessarily massive embedded arrays (e.g., storing all a user's complaints inside the User document).
4. **Data Ownership:**
   - **User** handles authentication, roles, and identity.
   - **Profile** handles personal details and organizational attributes.
   - **Employee** acts as the definitive source of truth for municipal workers' hierarchical configuration, linked securely to the base user.
5. **Phase Compatibility:** Public registration forces the `CITIZEN` role. Privileged accounts (e.g., `WARD_OFFICER`, `MUNICIPAL_ADMIN`, `SUPER_ADMIN`) are created strictly via administration workflows or secure seeding scripts.

## 3. Implementation Phases Roadmap

- Phase 1 — Foundation
- Phase 2 — Authentication + RBAC
- Phase 3 — Municipality Structure
- Phase 4 — Civic Complaint Management
- Phase 5 — Assignment + Field Operations
- Phase 6 — SLA + Escalation + Notifications
- Phase 7 — Maps + AI + Smart Features
- Phase 8 — Municipal Citizen Services
- Phase 9 — Property + Tax + Revenue
- Phase 10 — Analytics + Security + Deployment

## 4. Collections List

### 🟢 IMPLEMENTED NOW (Phases 1-3)

- **`users`**
  - **Purpose:** Core identity, authentication credentials (hashed), RBAC, and account status.
  - **Key Indexes:** `email` (unique), `phone`, `role`, `isActive`.

- **`profiles`**
  - **Purpose:** Segregates user personal details and future municipal hierarchy data from authentication credentials.
  - **Key Indexes:** `userId` (unique), `municipalityId`, `wardId`, `departmentId`.

- **`municipalities`**
  - **Purpose:** Central entity representing a specific regional municipal body.
  - **Key Indexes:** `code` (unique).

- **`wards`**
  - **Purpose:** Geographical and electoral division of a municipality.
  - **Key Indexes:** `municipalityId_code` (unique), `municipalityId_wardNumber` (unique).

- **`areas`**
  - **Purpose:** Sub-division of a ward for precise location routing.
  - **Key Indexes:** `municipalityId_code` (unique), `wardId`.

- **`departments`**
  - **Purpose:** Organizational structure for municipal operations (e.g. Sanitation, Roads).
  - **Key Indexes:** `municipalityId_code` (unique).

- **`designations`**
  - **Purpose:** Titles/ranks mapped within the municipality (e.g. Ward Officer).
  - **Key Indexes:** `municipalityId_code` (unique).

- **`employees`**
  - **Purpose:** Link a `User` identity to specific `Department` and `Designation` assignments. Unifies "Worker", "Staff", and "Officer".
  - **Key Indexes:** `municipalityId_employeeCode` (unique), `userId` (unique).

- **`worker_teams`**
  - **Purpose:** Grouping employees/workers for task assignments.
  - **Key Indexes:** `municipalityId_code` (unique).

### 🟡 PLANNED FOR FUTURE PHASES (Civic & Internal Modules)

#### Core Operations (Phase 4+)
- **`complaints`**: Citizen grievances. References User, Ward, Category.
- **`complaint_categories`**: Types of complaints (Garbage, Road, etc).
- **`complaint_assignments`**: Worker/Officer allocation to complaints.
- **`complaint_updates`**: Status changes and logs.
- **`complaint_evidence`**: Images and attachments.
- **`complaint_comments`**: Internal team communication.
- **`sla_rules`** & **`escalations`**: Automated SLA enforcement for delayed resolutions.
- **`feedback`**: Citizen ratings for resolved complaints.

#### Auxiliary Operations
- **`assets`** & **`asset_maintenance`**: Municipal resources and upkeep logs.
- **`citizen_services`** & **`service_requests`**: Requests for certificates, NOCs, and permissions.
- **`properties`**, **`property_taxes`**, **`tax_payments`**: Tax administration.
- **`documents`**: Centralized storage references.
- **`notifications`**: System alerts.
- **`audit_logs`**: Security trails.
- **`system_settings`**: Global configuration.

## 5. Entity Relationship Overview
Future scalability is heavily reliant on this normalized structure.
- `users` → `profiles` (1-to-1)
- `users` → `employees` (1-to-1 or 1-to-0)
- `municipalities` → `departments` (1-to-many)
- `municipalities` → `wards` → `areas` (1-to-many geographical hierarchy)
- `users` → `complaints` (1-to-many via references in Complaint)
- `complaints` → `complaint_updates` (1-to-many via references in Updates)

*Architecture strictly prohibits massive unbounded arrays inside primary documents to prevent 16MB document size limit breaches.*
