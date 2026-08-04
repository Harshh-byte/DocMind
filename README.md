# DocMind 🧠

> **Turn Static Files Into Active Partners.**  
> A premium, secure document intelligence platform — upload a PDF, chat with it using AI, and get page-level cited answers in real time.

---

## ✨ Features

- **Intelligent PDF Parser** — Client-side text extraction via PDF.js (no server upload required). Handles multi-column documents, reports, and research papers.
- **AI-Powered Chat** — Chat directly with your documents. Powered by state-of-the-art AI Models with a custom DocMind Assistant persona.
- **Page-Level Citations** — Every AI response includes inline citations (`[Page X, Line Y]`) referencing the exact source section in your document.
- **Hover-to-Peek Tooltips** — Hover over any citation badge to see a semantic preview of the exact page snippet, with keywords highlighted.
- **AI Document Insights Drawer** — Auto-generates an executive summary and category tags for every uploaded document using secure AI models.
- **Semantic Search** — Keyword-aware relevance filtering surfaces only the most relevant sentences for each query.
- **Persistent Chat History** — All conversations are saved to a secure cloud database and restored per document, per user.
- **Secure Authentication** — Full auth flow (sign-up, sign-in, sign-out) powered by Clerk.
- **Responsive Design** — Fully mobile-responsive across all pages, including a slide-out sidebar for mobile navigation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 + Vanilla CSS |
| **Animation** | Framer Motion / Motion |
| **Authentication** | Clerk v7 |
| **Database** | Secure Cloud Database (PostgreSQL) |
| **AI / LLM** | State-of-the-art LLM API |
| **PDF Parsing** | PDF.js (CDN, client-side) |
| **UI Components** | Radix UI (Accordion), Lucide React (icons) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Clerk-managed auth pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/               # Protected app pages
│   │   ├── chat/                  # AI chat interface with citation system
│   │   ├── dashboard/             # Upload, manage & preview documents
│   │   └── documents/             # Document vault / file list
│   ├── api/
│   │   ├── chat/                  # POST → Gemini AI chat endpoint
│   │   └── summarize/             # POST → Gemini document summarizer
│   ├── privacy/                   # Privacy policy page
│   ├── terms/                     # Terms of service page
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx                   # Public marketing landing page
│
├── components/
│   ├── layout/                    # App shell components
│   │   ├── Navbar.tsx             # Top navigation bar (landing page)
│   │   └── Sidebar.tsx            # Dashboard sidebar (desktop + mobile)
│   └── ui/                        # Reusable UI primitives
│       ├── ClickSpark.tsx         # Click spark animation effect
│       ├── CountUp.tsx            # Animated number counter
│       ├── Logo.tsx               # DocMind SVG logo
│       ├── Squares.tsx            # Animated background grid
│       ├── accordion.tsx          # Radix UI accordion wrapper
│       └── button.tsx             # CVA-powered button component
│
└── lib/
    ├── ai/
    │   └── aiPersonality.ts       # Gemini system prompt builder
    ├── db/
    │   └── supabase.ts            # Supabase client singleton
    ├── document/
    │   └── pdfParser.ts           # Client-side PDF text extractor
    ├── constants.ts               # App-wide constants (features, FAQs, etc.)
    └── utils.ts                   # Tailwind class merge utility
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Harshh-byte/DocMind.git
cd DocMind
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Set up Supabase

In your Supabase project, create a `chats` table with the following schema:

```sql
create table chats (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  document_id text not null,
  messages jsonb not null default '[]',
  updated_at timestamptz default now(),
  unique (user_id, document_id)
);
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📖 How It Works

```
1. Upload PDF  →  PDF.js extracts text in the browser (no server upload)
2. AI Summarize  →  Secure AI model generates an executive summary + tags
3. Chat  →  Your message + full document text is sent to the secure AI API
4. Response  →  AI replies with inline page citations [Page X, Line Y]
5. Citations  →  Hover tooltips show a semantic preview; click to see full context
```

---

## 🔐 Authentication

DocMind uses **Clerk** for authentication. All dashboard routes (`/dashboard`, `/chat`, `/documents`) are protected via Clerk middleware in `middleware.ts`.

To move to production:
1. Go to the [Clerk Dashboard](https://dashboard.clerk.com) → Deploy to Production.
2. Replace your `.env` keys with the `pk_live_` / `sk_live_` production keys.
3. Add your production domain to Clerk's allowed origins.

---

## 🌐 Deployment

The recommended deployment target is **Vercel**:

```bash
npm run build
```

Or connect your GitHub repository to [Vercel](https://vercel.com) and add all environment variables in the project settings.

---

## 👤 Author

Built by [Harsh Bhardwaj](https://harshh-byte.onrender.com/)

- 𝕏 / Twitter: [@Harshh_hb](https://x.com/Harshh_hb)
- GitHub: [@Harshh-byte](https://github.com/Harshh-byte)
- LinkedIn: [harsh-bhardwaj](https://www.linkedin.com/in/harsh-bhardwaj-b3791b261/)

---

## 📄 License

This project is private and not licensed for public redistribution.
