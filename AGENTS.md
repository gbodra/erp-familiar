<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Família ERP - Technical Guidelines

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** SQLite via Prisma ORM (`prisma/schema.prisma`)
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** `@phosphor-icons/react`
- **Charts:** `recharts`
- **AI Integration:** `@google/genai` (Gemini Pro/Flash for data extraction)

## Architecture & Workflows

### 1. Invoice Upload & Parsing (Background Processing)
- **Database Model:** `Invoice` contains a `status` field (`PENDING`, `PROCESSED`, `FAILED`).
- **Server Action:** `uploadAndParseInvoice` (in `lib/invoice-actions.ts`) creates the `Invoice` as `PENDING`, initiates the AI background job (`processInvoiceBackground`) WITHOUT awaiting it, and returns immediately to unblock the UI.
- **AI Parsing:** `parseCreditCardPdf` uses Gemini to read PDF Buffer bytes directly, instructed via strict prompt to extract totals, classify stores (Shopee, Mercado Livre, Ifood, Temu, Uber) by their platform name, ignore previous payments, and return structured JSON.
- **Polling UI:** In `InvoicesTable`, a `useEffect` checks if any invoice is `PENDING`. If so, it triggers `router.refresh()` every 3 seconds to fetch the updated state.
- **Clickable Invoice Rows:** In `InvoicesTable`, every row is clickable and immediately routes to its analytics and details page.

### 2. Interactive Dashboard (`InvoiceDashboard`)
- The invoice details page relies on `InvoiceDashboard` (a client wrapper) to manage the global `selectedCategory` state.
- `InvoiceSummary` (Recharts PieChart) and `TransactionsTable` both consume and update this state.
- Recharts `ResponsiveContainer` uses a custom `isMounted` state inside `InvoiceSummary` to prevent Next.js SSR hydration warnings.

### 3. Calendar Event Synchronization (`syncCalComEvents`)
- Event syncing relies on `fetchCalComBookings` and `getCalendarEvents` in `lib/calendar-actions.ts`.
- It fetches direct bookings via `https://api.cal.com/v2/bookings` and extracts external busy times from the `busy-times` endpoint.
- Upsert procedures ensure that any events that were removed or changed in Cal.com within the date range get added, modified, or dropped locally in Prisma.

### 4. Role-Based Access & Registration Management
- To protect user integrity, registration is accessible only within the dashboard route `/admin` (or user management context) for authenticated and authorized administrators. The public-facing registration link is completely removed from the login screen.

## Development Rules
- Use `npx prisma db push` (not `migrate dev` unless specified) for database schema changes in this local development environment.
- Any new complex AI parsing should utilize structured schemas with Gemini (`responseSchema`).
- Shadcn components should be preferred for UI elements (e.g. `AlertDialog` instead of browser `confirm()`).
- Always maintain cursor pointer on buttons (configured via `components/ui/button.tsx`).
