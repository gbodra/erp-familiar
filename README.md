# Família ERP (Family ERP)

A modern, local web application designed to manage personal and family finances with the help of Artificial Intelligence.

## What is it?
Família ERP acts as a centralized dashboard to track household expenses. Its flagship feature is the **Credit Card Module**, which uses Google's Gemini AI to read unstructured PDF bank statements and automatically categorize and consolidate transactions. Additionally, it integrates event scheduling via **Cal.com** and provides automated **AI Weekly Briefings** on your financial data.

## Features Built So Far

### 💳 Credit Card Management
- **Smart PDF Import:** Upload your credit card bills (Itaú, C6 Bank) directly in PDF format.
- **AI-Powered Parsing:** Uses Gemini (Pro/Flash) to process the invoice in the background. It intelligently extracts the exact final amount, deduces the month/year, automatically categorizes expenses, groups marketplace purchases (Shopee, Mercado Livre, iFood, etc.), and cleanly separates credits (refunds) from debits.
- **Interactive Dashboard:** 
  - Dynamic Pie Chart that breaks down expenses by category.
  - Click on any chart slice or category chip to instantly filter the transactions list and recalculate the top totals.
  - Top 5 Establishments breakdown.
- **Background Processing & Polling:** The system receives the file and frees up the user interface immediately. It polls the server in the background and magically updates the table when the AI finishes reading the document.
- **Modern UI:** Built with Tailwind CSS and Shadcn UI components for a polished, responsive, and accessible experience.
- **Clickable Invoice Rows:** Click on any invoice row to jump straight into its interactive dashboard and detailed analytics.

### 🗓️ Calendar Sync & Event Tracking
- **Cal.com Integration:** Connect directly to Cal.com to sync your internal and external busy schedules.
- **Unified Schedule View:** Sync busy slots and external bookings from connected third-party providers (e.g., Google Calendar) via the Cal.com v2 API.

### 📊 AI Financial Weekly Briefing
- **Intelligent Spending Summaries:** Get an AI-driven text breakdown that evaluates income and expense patterns.
- **Data-Backed Recommendations:** Receive automated optimization ideas to refine budget distribution over time.

### 🔒 Access Control & Protected Registration
- **Secure Authentication:** Standard credentials-based sign-in for secure multi-user/multi-family access.
- **Administrative-Only Registration:** User registration has been restricted to the authenticated administrative panel only, preventing unauthorized public sign-ups on the login screen.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Gemini API Key (Google AI Studio)
- Cal.com API Key (Optional, for calendar sync)

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory and add your credentials:
   ```env
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your_google_gemini_api_key"
   GEMINI_MODEL="gemini-1.5-pro" # or gemini-2.5-flash
   CALCOM_API_KEY="your_calcom_api_key"
   ```
3. Sync the database:
   ```bash
   npx prisma db push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
