# AuraRoom AI — Spatial Interior & Furniture Studio

> Production-ready spatial AI interior staging platform powered by **Black Forest Labs Flux-2 Klein 4B** (`black-forest-labs/flux-2-klein-4b`), **Google Gemini 2.5 Flash** (`gemini-2.5-flash`), and **Clerk Authentication**.

---

## 🌟 Key Capabilities & Role Architecture

### 1. 👑 Super Admin (You)
- **Global Overview**: Real-time stats across all registered users, active furniture store owners (billers), total catalog items, and overall staging generations.
- **AI Credits Management**:
  - View every user's AI credit balance, role, plan, and generation count.
  - Direct credit operations: `+50 Credits`, `+200 Credits`, or `Set Custom Credits`.
- **Showroom Directory**: Comprehensive listing of connected furniture retailers, catalog sizes, and credit allocations.
- **AI Prediction & Audit Logs**: Live stream of Gemini 2.5 Flash and Flux-2 Klein 4B API runs with latency, status, and credit burn rate.

### 2. 🏬 Store Owners / Billers (Showroom Retailers)
- **Showroom Admin Portal**:
  - Manage inventory: Add, edit, or delete furniture pieces with title, category, price, dimensions, materials, and custom AI prompt descriptors.
  - **Customer Staging Activity Tracker**: Real-time telemetry showing *which customer* staged *which furniture item* into their room, along with the room context and quote inquiries.
  - Track conversion from visual staging to white-glove quote requests.

### 3. 🛋️ Customers (Visualizer Studio & Catalog)
- **Luxury Landing Page**: Interactive hero with a draggable before/after split slider, 4-step workflow, featured furniture collections, and credit tiers.
- **Interactive Staging Studio**:
  - **Room Input**: Upload room photos, pick from curated luxury rooms, or use **Live Mobile/Webcam Camera** directly in browser (`navigator.mediaDevices.getUserMedia`).
  - **Gemini 2.5 Flash Room Vision**: Automatically identifies components (sofas, tables, chairs, floors, walls, lamps) with x/y coordinates and bounding boxes.
  - **Canvas Touch-Pins**: Move tags with fingers/pointer, adjust target width/height percentages, or click anywhere to add a custom pin spot.
  - **Option A (Store Catalog)**: Stage authentic physical furniture from showroom inventories with live pricing.
  - **Option B (Custom AI Prompt)**: Type custom descriptions with luxury quick-chips.
  - **Option C (Reference Image Upload)**: Upload or snap a photo of any real furniture piece or fabric swatch to blend into the room.
  - **AI Image Generation**: Powered by `black-forest-labs/flux-2-klein-4b` via Replicate API.
  - **AI Expand (Outpaint)**: Outpaint wider walls and floor scenery seamlessly.
  - **Before/After Split Comparison & Hold v1**: Interactive draggable divider and instantaneous v1 peek.
  - **Version Stack**: Snapshot rollback history (v1, v2, v3...).
  - **Room Estimate & Quote**: Itemized cart specification and consultation request dispatched to the store owner.

---

## 🚀 Running the Production App

```bash
# 1. Install dependencies (already completed)
npm install

# 2. Run both Backend Express Proxy (port 5001) and Vite Frontend (port 3000)
npm run dev

# Or run separately:
npm run dev:server   # Node Express backend on port 5001
npm run dev:client   # Vite React frontend on port 3000
```

Open **`http://localhost:3000`** in your browser.

---

## 🔐 Environment Configuration (`.env`)

```env
replicate_api_key=r8_********************************
VITE_REPLICATE_API_KEY=r8_********************************
VITE_CLERK_PUBLISHABLE_KEY=pk_test_********************************
GEMINI_API_KEY=
VITE_GEMINI_API_KEY=
PORT=5001
```

- **Replicate API**: Automatically uses your key to generate images with `black-forest-labs/flux-2-klein-4b`.
- **Clerk Auth**: `@clerk/clerk-react` handles sign-in, sign-up, and user profile management. A quick-role switcher is also built-in for instant previewing of Super Admin, Biller, and Customer personas.
- **Gemini API**: Uses Gemini 2.5 Flash for interior room spatial vision detection.
