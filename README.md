# FurnitureAura AI — Spatial Interior & Furniture Architecture Platform

> **100% Pure Supabase Production Architecture.** A spatial interior staging platform powered by **Black Forest Labs Flux-2 Klein 4B**, **Google Gemini 2.5 Flash**, **Supabase Edge Functions**, and **Clerk Authentication**.

---

## 🏛️ Architectural Overview

FurnitureAura AI operates as a serverless Single-Page Application (SPA) powered entirely by **Supabase Backend-as-a-Service (BaaS)** and **Vite React**:

```
┌────────────────────────────────────────────────────────┐
│              Client (Vite React 18 SPA)               │
│      Alabaster & Burnished Brass Luxury Editorial      │
└───────────────────────────┬────────────────────────────┘
                            │
               Supabase JS Client & Auth
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Supabase Edge Functions   │   │  Supabase PostgreSQL Database │
│   (Serverless Deno Runtimes)  │   │  - Strict Row Level Security  │
├───────────────────────────────┤   │  - Atomic Credit Stored Procs │
│ • analyze-room (Gemini Vision)│   │  - Role Constraints           │
│ • analyze-reference (Geometry)│   │  - Realtime Telemetry Sync    │
│ • generate-staging (Flux-2)   │   └───────────────────────────────┘
└───────────────┬───────────────┘
                │
        Upstream AI APIs
        (Replicate / Google)
```

- **Zero Node Server Dependencies**: The application contains no Express or Node.js server processes, eliminating server uptime maintenance, localhost proxy friction, and port collision vulnerabilities.
- **Serverless Edge AI**: AI model keys (`REPLICATE_API_KEY`) and privileged credentials (`SUPABASE_SERVICE_ROLE_KEY`) are secured inside Supabase Edge Function environment secrets.
- **Database Row Level Security (RLS)**: Enforces table-level access control on `profiles`, `stores`, `catalog_items`, `staging_events`, `quotes`, `auraroom_projects`, and `prediction_logs`.
- **Atomic Credit RPCs**: Credit deductions and administrator allocations are executed via atomic PostgreSQL functions with row locking to eliminate race conditions.

---

## 🌟 Key Capabilities & Role Architecture

### 1. 👑 Platform Super Admin
- **Global Studio Telemetry**: Real-time stats across all registered users, verified showroom retailers, catalog pieces, and total room generations.
- **Atomic AI Credit Management**:
  - View every user's credit balance, role, plan, and generation count.
  - One-click credit actions (`+50`, `+200`, or `Set Custom Credits`) executed via secure Supabase RPCs.
- **Showroom Directory**: Comprehensive listing of connected furniture retailers, catalog sizes, and credit allocations.
- **AI Prediction & Audit Logs**: Live audit stream tracking AI model executions, latencies, status, and credit cost.

### 2. 🏬 Showroom Retailer (Store Biller)
- **Showroom Inventory Management**:
  - Create and manage physical furniture pieces with name, category, price, dimensions, materials, and prompt descriptors.
- **Customer Staging Activity Tracker**:
  - Real-time telemetry tracking when a customer stages a specific catalog piece into their private room.
- **Consultation & Quote Inquiries**:
  - Receive itemized room staging inquiries submitted directly by customers from the spatial studio.

### 3. 🛋️ Interior Studio Client
- **Interactive Staging Studio**:
  - **Room Input**: Upload room photos, select curated luxury demo spaces, or snap live photos with the built-in webcam/mobile camera.
  - **Spatial Room Vision**: Identifies room items (sofas, tables, chairs, floors, walls, lamps) with x/y coordinates and bounding boxes.
  - **Interactive Canvas**: Adjust furniture bounding box width/height scale or click to tag new custom spots.
  - **3 Flexible Staging Methods**:
    - **Option A (Store Catalog)**: Stage authentic physical furniture from connected showroom inventories.
    - **Option B (AI Prompt)**: Custom text prompting with curated luxury material chips.
    - **Option C (Photo Reference)**: Upload or snap any furniture photo to clone into the spot with cushion silhouette locking.
  - **Before/After Split Comparison & Hold v1**: Interactive draggable divider and instantaneous original room peek.
  - **Version Stack**: Snapshot rollback history with non-destructive versioning.
  - **Room Estimate & Quote**: Itemized cart specification and consultation request dispatched to the store owner.
  - **My Recent Creations**: Persistent multi-session project storage auto-saved to Supabase.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation & Running
```bash
# Clone the repository
git clone https://github.com/your-username/FurnitureAuraAI.git
cd FurnitureAuraAI

# Install frontend dependencies
npm install

# Start Vite development server (port 3000)
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase BaaS (Client-Side)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

### Server-Side Edge Secrets (Configure in Supabase Dashboard)
Configure the following secrets in your Supabase project under **Project Settings → Edge Functions → Secrets**:

| Secret Name | Purpose |
|-------------|---------|
| `REPLICATE_API_KEY` | Replicate token for Black Forest Labs Flux-2 Klein 4B staging |
| `GEMINI_API_KEY` | Google Gemini API key for interior room vision detection |
| `SUPABASE_URL` | Automatically populated by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Automatically populated by Supabase |

---

## 🚀 Supabase Edge Functions Deployment

Deploy the serverless Edge Functions to your Supabase project using the Supabase CLI:

```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your local repository to your remote Supabase project
npx supabase link --project-ref urbfdlljbzfsgtvyhuko

# 3. Deploy all 3 Edge Functions
npx supabase functions deploy analyze-room
npx supabase functions deploy analyze-reference
npx supabase functions deploy generate-staging

# 4. Set required secrets for Edge Functions
npx supabase secrets set REPLICATE_API_KEY="your_replicate_api_key"
npx supabase secrets set GEMINI_API_KEY="your_gemini_api_key"
```

---

## 🌐 Production Deployment (Vercel)

The application is pre-configured for instant zero-config deployment on Vercel:

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Add the following Environment Variables in the Vercel Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLERK_PUBLISHABLE_KEY`
4. Click **Deploy**. Vercel will build the frontend using `npm run build` and serve it through the SPA rewrite rules configured in `vercel.json`.

---

## 🛡️ Database Migrations & Security

All database tables, constraints, RPCs, and RLS policies are version-controlled in `supabase/migrations/`:

- [20261025_production_security.sql](file:///Users/razinshk/Projects/FurnotureAuraAI/supabase/migrations/20261025_production_security.sql):
  - Enforces `customer`, `biller`, and `admin` check constraints on `public.profiles`.
  - Creates the atomic `deduct_user_credits` and `admin_adjust_credits` stored procedures with row-level locks (`FOR UPDATE`).
  - Implements strict RLS policies ensuring users can only read/write their own profiles, projects, and events.
  - Grants showroom billers read access to customer staging events involving their own store items.
