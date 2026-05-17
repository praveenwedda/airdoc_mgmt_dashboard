# AirDoc Operations Dashboard — Claude Code Build Prompt

## OVERVIEW

Build a full-stack **Operations & Investor Dashboard** for a SaaS company called **AirDoc**. This is a single-page React application with Firebase as the backend (authentication + database). The finished app must be deployable to **GitHub Pages** as a static site.

The app has two major surfaces:
1. **Investor/Viewer Frontend** — Beautiful, read-only dashboard showing KPIs, revenue, marketing results and growth metrics.
2. **Admin/Manager Backend Panel** — A secured section within the same app (route-guarded) where authorised users manage all data, users, configurations, sales records and marketing records.

---

## TECH STACK (Do not deviate)

| Layer | Technology |
|---|---|
| Frontend framework | React (Vite) |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Auth + Database | Firebase (Firestore + Firebase Auth) |
| Charts | Recharts |
| Deployment | GitHub Pages via `gh-pages` package |
| Social media data | Meta Graph API, LinkedIn Marketing API (OAuth-based, fetched client-side via Firebase Cloud Functions or direct REST) |

**Firebase setup instructions must be included in a `SETUP.md` file** that walks a non-technical user through:
1. Creating a Firebase project
2. Enabling Email/Password authentication
3. Creating a Firestore database
4. Pasting Firebase config into `.env`
5. Running the app locally
6. Deploying to GitHub Pages

---

## PROJECT STRUCTURE

```
airdoc-dashboard/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/         # Sidebar, Navbar, PageWrapper
│   │   ├── charts/         # Reusable chart components
│   │   ├── tables/         # Reusable data table components
│   │   └── ui/             # Buttons, Modals, Forms, Badges
│   ├── pages/
│   │   ├── auth/           # Login page
│   │   ├── dashboard/      # Investor-facing views (Viewer + all roles)
│   │   └── admin/          # Backend panel (Manager + Admin only)
│   ├── hooks/              # Custom React hooks (useAuth, useFirestore)
│   ├── contexts/           # AuthContext, AppContext
│   ├── services/           # Firebase service layer, Social media API helpers
│   ├── utils/              # Helper functions
│   └── App.jsx
├── .env.example
├── SETUP.md
├── firebase.json
└── vite.config.js
```

---

## DESIGN & AESTHETIC

- **Theme**: Light theme only. Background `#F5F5F7` (Apple's signature off-white), card surfaces `#FFFFFF`, sidebar `#FFFFFF` with a subtle `1px` right border `#D2D2D7`. Primary accent: `#0071E3` (Apple's blue). Destructive/alert accent: `#FF3B30`. Success: `#34C759`. Financial highlight: `#0071E3`.
- **Typography**: Use Apple's system font stack exactly as used on apple.com:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  ```
  Apply `SF Pro Display` weight `600–700` for headings and KPI numbers. Apply `SF Pro Text` weight `400–500` for body copy, labels, and table content. Letter-spacing on headings: `-0.02em`. All text rendering: `antialiased`.
- **Spacing & Layout**: Generous white space. 24px base padding on cards. Rounded corners `border-radius: 18px` on cards (matching Apple card style), `12px` on buttons and inputs.
- **Charts**: Recharts styled to match the light theme — white chart backgrounds, `#0071E3` as the primary series colour, `#34C759` for positive metrics, `#FF3B30` for churn/negative. Grid lines `#E5E5EA`. Tooltip with white background, soft shadow.
- **Cards**: Clean white cards with `box-shadow: 0 2px 12px rgba(0,0,0,0.08)`. No heavy borders. Subtle `0.5px` border `#E5E5EA`.
- **Sidebar**: White background, active item highlighted with a light `#EBF4FF` pill background and `#0071E3` text/icon. Inactive items `#6E6E73` (Apple secondary text). Smooth hover transitions.
- **Buttons**: Primary — `#0071E3` fill, white text, no border, `border-radius: 980px` (Apple pill shape) for CTAs; `12px` radius for form buttons. Subtle hover darkening.
- **Forms & Inputs**: Inputs with `background: #F5F5F7`, no visible border until focused, focus ring `#0071E3`. Labels in `#6E6E73` small-caps style above the field.
- **Login page**: Centred card on `#F5F5F7` background. AirDoc wordmark in `SF Pro Display` bold. Minimal, clean — inspired by appleid.apple.com login aesthetic.
- The dashboard must feel like an **Apple-designed enterprise product** — precise, airy, and trustworthy.

---

## AUTHENTICATION & USER MANAGEMENT

### Firebase Auth Rules
- Use Firebase Email/Password authentication.
- Store extended user profile (role, name, createdAt) in Firestore under `/users/{uid}`.
- Firestore security rules must enforce that only admins can write to `/users`, and each role can only read/write the collections relevant to them.

### Roles

| Role | Access |
|---|---|
| `admin` | Full access to everything — dashboard + entire backend panel + user management |
| `manager` | Dashboard + backend panel data entry (no user management) |
| `viewer` | Read-only access to the investor dashboard only |

### Login Page
- Clean, branded login page with AirDoc logo placeholder.
- Email + password fields.
- On login, check Firestore `/users/{uid}` for role and redirect accordingly:
  - `viewer` → `/dashboard`
  - `manager` → `/dashboard` (with backend nav visible)
  - `admin` → `/dashboard` (with backend nav + user management visible)

### User Management (Admin Only — `/admin/users`)
- Table of all users showing name, email, role, created date.
- "Create User" button → modal form: name, email, password, role selector.
- "Edit User" — change role or reset password.
- "Deactivate User" — disable login without deleting.
- Use Firebase Admin SDK via a Firebase Cloud Function for user creation, OR use `createUserWithEmailAndPassword` from client and immediately write role to Firestore (implement whichever is simpler; document the choice in `SETUP.md`).

---

## CONFIGURATIONS MODULE (`/admin/config`)

Store all configuration in Firestore at `/config/app`.

### Fields to configure:
1. **App/Product Name** — Name of the SaaS being sold (e.g. "AirDoc").
2. **Packages** — A dynamic list of packages:
   - Package name (e.g. "Starter", "Pro", "Enterprise")
   - Monthly price per customer
   - Description (optional)
   - Active/Inactive toggle
3. **Fixed Costs** — Monthly fixed costs list:
   - Cost name (e.g. "Server hosting", "Salaries")
   - Monthly amount
4. **Variable Costs** — Variable cost types:
   - Cost name (e.g. "SMS cost", "Payment gateway fee")
   - Unit driver (e.g. "per SMS sent", "per transaction", "per active user")
   - Unit cost
5. **Baselines & Targets**:
   - Monthly expenditure baseline
   - Monthly Recurring Revenue (MRR) target
   - Monthly new customer target

All of these should be editable inline with save buttons. Changes must be versioned/timestamped in Firestore.

---

## SALES MODULE

### Customer Acquisition (`/admin/sales/acquisitions`)

Record new customers acquired:
- Date
- Package (dropdown from configured packages)
- Number of customers
- Source: `direct_meeting` | `email_campaign` | `sms_campaign` | `social_media` | `referral` | `other`
- Notes (optional)

Display a table of all acquisition records with filters by month, package, source. Allow edit and delete.

### Customer Churn (`/admin/sales/churn`)

Record customer churn:
- Date
- Package
- Number of churned customers
- Reason (optional): `pricing` | `product_issue` | `competitor` | `no_longer_needed` | `other`
- Notes

Display a table of churn records with filters.

### Computed Metrics (auto-calculated, not manually entered)

For each month, compute and display:
- **Active Customers per Package** = previous month's active customers + new acquisitions − churn
- **Monthly Revenue per Package** = active customers × package price
- **Total MRR** = sum of revenue across all packages
- **Churn Rate** = churned / (start of month customers) × 100

---

## MARKETING MODULE

### Meeting Records (`/admin/marketing/meetings`)

Two types of meetings:

**Existing Customer Meetings:**
- Date
- Customer name / company
- Attendees
- Meeting summary
- Feedback/sentiment: `very_positive` | `positive` | `neutral` | `negative` | `very_negative`
- Action items
- Follow-up date

**Potential Customer Meetings (Leads):**
- Date
- Company name
- Industry
- Contact person name + designation
- Contact email / phone
- Meeting summary
- Reaction/interest level: `very_interested` | `interested` | `neutral` | `not_interested` | `rejected`
- Next steps
- Follow-up date

Both meeting types should show in a unified calendar/list view with colour-coded sentiment badges.

### Email & SMS Campaigns (`/admin/marketing/campaigns`)

Record campaign batches:
- Campaign name
- Type: `email` | `sms`
- Date range
- **Upload contact list** (CSV upload — store count, not the actual emails/numbers, for privacy):
  - Parse the CSV on the client side and record only the count.
- Total reached (from upload count or manual entry)
- Delivered count
- Response/reply count
- Conversion count (optional)
- Cost of campaign
- Notes

Display campaign performance table with open rate, response rate computed automatically.

### Social Media Campaigns (`/admin/marketing/social`)

#### Manual Entry (always available):

For each campaign post/ad:
- Platform: `meta` | `linkedin` | `google` | `tiktok`
- Campaign name
- Post/ad title
- Date
- Impressions
- Reach
- Reactions (likes/engagements)
- Comments
- Messages/leads received
- Link clicks
- Ad spend
- Notes

#### Automated Pull (via API — implement behind a feature flag `VITE_SOCIAL_API_ENABLED=true`):

**Meta (Facebook/Instagram) via Meta Graph API:**
- Use OAuth 2.0 to connect a Meta Business account.
- Pull from `/me/adaccounts` and `/act_{ad_account_id}/insights` endpoint.
- Fields: `impressions`, `reach`, `clicks`, `spend`, `actions` (for reactions/messages).
- Store pulled data in Firestore under `/social_campaigns/meta/{date}`.
- Show "Last synced: X" timestamp and a "Sync Now" button.

**LinkedIn via LinkedIn Marketing API:**
- Use OAuth 2.0 to connect LinkedIn.
- Pull from `/adAnalyticsV2` endpoint.
- Fields: `impressions`, `clicks`, `reactions`, `commentCount`, `shares`, `spend`.
- Store in `/social_campaigns/linkedin/{date}`.

**Google Ads via Google Ads API (or Google Analytics Data API):**
- Use OAuth 2.0.
- Pull campaign-level metrics: `impressions`, `clicks`, `cost`, `conversions`.
- Store in `/social_campaigns/google/{date}`.

**TikTok via TikTok for Business API:**
- OAuth 2.0 connection.
- Pull from `/open_api/v1.3/report/integrated/get/`.
- Fields: `impressions`, `reach`, `clicks`, `spend`, `engagements`.
- Store in `/social_campaigns/tiktok/{date}`.

> **Implementation note for Claude Code**: Each social platform integration should be in its own service file (`src/services/meta.js`, `src/services/linkedin.js`, etc.). Each should export a `connect()` function (triggers OAuth popup), a `sync()` function (fetches and writes to Firestore), and a `disconnect()` function. If the API cannot be reached or the token is missing, fall back gracefully to manual entry mode with a visible warning banner.

#### Social Media Dashboard Section:
- Aggregate view across all platforms.
- Filters: platform, date range, campaign.
- Metrics cards: Total impressions, total reach, total spend, total messages.
- Line chart: Impressions over time per platform.
- Bar chart: Spend vs reach per platform.

### Cost Recording (`/admin/costs`)

Record actual costs incurred each month:
- Month/Year
- Fixed costs: for each configured fixed cost item, enter actual amount spent.
- Variable costs: for each configured variable cost, enter units consumed + system computes total.
- Ad hoc costs: name + amount + category.
- Total auto-computed.

Compare actuals vs configured baseline. Show variance.

---

## INVESTOR DASHBOARD (Viewer Frontend)

Route: `/dashboard` — accessible to all logged-in roles.

This is the main showcase. Design it to look impressive for investors. Sections:

### 1. Overview KPI Bar (top of page)
Large metric cards showing:
- Total Active Customers
- Total MRR (current month)
- MRR Growth % (vs last month)
- Total Revenue (YTD)
- Churn Rate (current month)
- Customer Acquisition this month

### 2. Revenue Chart
- Line/area chart: MRR over the last 12 months.
- Stacked bar breakdown by package.
- Toggle between MRR view and total revenue view.
- Show MRR target line as a dashed reference.

### 3. Customer Growth Chart
- Line chart: Active customers over 12 months.
- Stacked by package.
- Show acquisition vs churn as grouped bars beneath.

### 4. Customer Acquisition by Source
- Donut chart: Breakdown of acquisition sources (direct, email, SMS, social, referral).
- Time filter: this month / last 3 months / last 6 months / all time.

### 5. Marketing Performance Summary
- Cards for: Total meetings held, total leads in pipeline, email campaign avg response rate, SMS campaign avg response rate.
- Social media totals: impressions, reach, messages.

### 6. Financial Summary
- MRR vs expenditure comparison bar chart.
- Gross margin % indicator.
- Cost breakdown donut: fixed vs variable vs marketing.
- Month selector.

### 7. Lead Pipeline Table
- Table of potential customers from meeting records.
- Columns: Company, Contact, Date, Interest Level (badge), Follow-up Date, Status.
- Read-only for viewers.

### 8. Recent Activity Feed (Admin/Manager only sidebar widget)
- Last 10 records added across any module with timestamp and type badge.

---

## FIRESTORE DATA SCHEMA

```
/config/app                    → app settings, packages, cost config, targets
/users/{uid}                   → { name, email, role, createdAt, active }
/acquisitions/{id}             → { date, package, count, source, notes, createdBy, createdAt }
/churn/{id}                    → { date, package, count, reason, notes, createdBy, createdAt }
/meetings/{id}                 → { type: 'existing'|'prospect', date, company, ... full fields }
/campaigns/{id}                → { type: 'email'|'sms', name, date, reached, delivered, responses, cost, ... }
/social_campaigns/{id}         → { platform, campaignName, date, impressions, reach, reactions, messages, spend, source: 'manual'|'api' }
/costs/{id}                    → { month, year, fixedCosts: [...], variableCosts: [...], adHoc: [...], total }
/social_tokens/{platform}      → { accessToken (encrypted), expiresAt, connectedAt } — admin-only read
```

---

## FIRESTORE SECURITY RULES

Provide a complete `firestore.rules` file:
- `viewer` role: read-only on all collections except `/users` and `/social_tokens`.
- `manager` role: read/write on acquisitions, churn, meetings, campaigns, social_campaigns, costs. Read on config. No access to users.
- `admin` role: full read/write everywhere.
- No unauthenticated access to any document.

---

## NAVIGATION STRUCTURE

### Sidebar for Admin/Manager:
```
📊 Dashboard
── Overview
── Revenue
── Customers
── Marketing Summary

⚙️ Backend Panel (Manager/Admin only)
── Configuration
── Sales
   ├── Acquisitions
   └── Churn
── Marketing
   ├── Meetings
   ├── Campaigns (Email/SMS)
   └── Social Media
── Costs

👥 User Management (Admin only)
── Users

🔌 Integrations (Admin only)
── Social Media Connections
```

### For Viewer:
Only Dashboard sections visible. No backend panel in sidebar.

---

## GITHUB PAGES DEPLOYMENT

1. In `vite.config.js`, set `base: '/airdoc-dashboard/'` (or the actual repo name).
2. Add `"deploy": "gh-pages -d dist"` and `"predeploy": "npm run build"` scripts to `package.json`.
3. In `SETUP.md`, document the exact steps:
   - `npm run build`
   - `npm run deploy`
   - Enable GitHub Pages from the `gh-pages` branch in repo settings.
4. Since Firebase auth uses a redirect, add the GitHub Pages URL to Firebase's **Authorised Domains** list — document this in `SETUP.md`.
5. React Router must use `HashRouter` (not `BrowserRouter`) for GitHub Pages compatibility.

---

## ENV FILE TEMPLATE

Create `.env.example` with:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_META_APP_ID=
VITE_META_APP_SECRET=
VITE_LINKEDIN_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
VITE_TIKTOK_APP_ID=

VITE_SOCIAL_API_ENABLED=false
```

---

## SETUP.MD REQUIREMENTS

The `SETUP.md` must include step-by-step instructions (written for someone with no technical knowledge) for:
1. Installing Node.js
2. Cloning the repo and running `npm install`
3. Creating a Firebase project (with screenshots described in text)
4. Setting up Firebase Auth and Firestore
5. Creating the first Admin user manually via Firebase Console
6. Copying Firebase config into `.env`
7. Running locally (`npm run dev`)
8. Deploying to GitHub Pages (`npm run deploy`)
9. Connecting each social media platform (Meta, LinkedIn, Google, TikTok) — what credentials to get and where to paste them.

---

## SEED DATA

Include a `src/utils/seedData.js` file and a button in the admin panel (dev mode only, gated by `import.meta.env.DEV`) that seeds the Firestore database with:
- 2 sample packages (Starter A$49/mo, Pro A$149/mo)
- 6 months of acquisition and churn data
- 3 meetings
- 1 email campaign
- Sample social media campaign entries

This allows demo/testing without manual data entry.

---

## ADDITIONAL REQUIREMENTS

- All monetary values must display in **AUD (Australian Dollars)** with the `A$` prefix. Currency is fixed to AUD — no currency selector needed.
- All dates stored as ISO strings in Firestore.
- All forms must have validation with clear error messages.
- The app must be fully responsive (mobile, tablet, desktop).
- Loading skeletons must show while Firestore data loads.
- Empty state illustrations (simple SVG) must show when no data exists in a section.
- All destructive actions (delete, deactivate user) must show a confirmation modal.
- Implement a `usePermissions()` hook used by every component to conditionally render edit/delete controls based on role.
- Console errors must be zero in production build.

---

## FIRST THING TO DO

Before writing any code:
1. Read this entire prompt.
2. Scaffold the full project structure with all empty files/folders in place.
3. Set up Firebase config, routing, AuthContext, and role-based redirect logic first.
4. Then build module by module in this order: Config → Sales → Costs → Marketing → Social → Dashboard → User Management.
5. At the end, verify the build compiles with `npm run build` and fix all errors before finishing.
