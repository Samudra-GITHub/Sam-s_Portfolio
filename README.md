<div align="center">
  <img src="https://raw.githubusercontent.com/Samudra-GITHub/Sam-s_Portfolio/main/public/favicon.svg" width="100" height="100" alt="Sam's Studio Icon" />
  
  # Samudra Kar — Portfolio
  
  **A scroll-driven, cursor-aware digital world.**

  [![React](https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react)](https://react.dev)
  [![Vite](https://img.shields.io/badge/Vite-8-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![GSAP](https://img.shields.io/badge/GSAP-3-green.svg?style=for-the-badge&logo=greensock)](https://gsap.com)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-13-f509e5.svg?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)

  *Seven project worlds, a lab of playable experiments, an About you discover, a final scene, and one hidden door.*
</div>

<br />

## 🌀 Motion Architecture

Motion is intentionally split across specific libraries to maintain 60FPS fluid interactions without overlap.

| Job | Tool |
| --- | --- |
| **Smooth scroll & velocity** | Lenis *(driven by GSAP's ticker)* |
| **Pinned scenes, masks, reveals** | GSAP + ScrollTrigger |
| **Cursor springs, physics, parallax** | Framer Motion |
| **Shader worlds (Akasha, Ink)** | Raw WebGL (`ShaderCanvas`), no Three.js |
| **Global Render Loop** | One shared `gsap.ticker` |

> [!NOTE]
> GSAP owns page-level choreography and Framer Motion owns component-level values. They never animate the same element.

## 🎨 Visual Identity & Design System

The portfolio uses a bespoke, brutalist-inspired design system designed to feel like a tactile object rather than a generic webpage.

- **Warm Paper Canvas** (`#fdf9f1`) and **Deep Ink** (`#111215`) for the primary contrast.
- **Electric Lime** (`#d8f827`), **Cobalt** (`#1e3ae8`), and **Vermilion** (`#ff5226`) for energetic accents.
- **Typography:** Syne (display), Epilogue (sans), JetBrains Mono (code).
- **Physicality:** Hard 2px borders, rigid drop shadows, asymmetry, and a signature **Lime Dot** (which functions as the cursor, the hero's interactive "seed", and the center of the custom favicon).

---

## ⚡ Quick Start

```bash
# Start the frontend
npm run dev      

# Build for production
npm run build    

# Start the backend (in /backend)
cd backend
npm run dev
```

---

## 🏗️ Backend & API

The portfolio includes an Express/Node.js backend in `/backend` to handle the contact form via the **Resend API**.

### Environment Setup

**Frontend (`/.env`)**:
- `VITE_BACKEND_URL`: URL of the backend *(e.g., `http://localhost:3000`)*

**Backend (`/backend/.env`)**:
- `PORT`: Port to run the server *(default: 3000)*
- `FRONTEND_ORIGIN`: Allowed CORS origin *(e.g., `http://localhost:5173`)*
- `RESEND_API_KEY`: Your verified Resend API key
- `RESEND_FROM`: Your verified sending domain
- `CONTACT_EMAIL`: The destination inbox

### Endpoints
- `GET /api/health`: High-performance health check.
- `POST /api/contact`: Form submission. Protected by `express-rate-limit`, validated via `zod`, and dispatched via Resend.

---

## 🚀 Deployment

- **Frontend**: Designed for Vercel. Configured via `vercel.json` for SPA fallback routing.
- **Backend**: Designed for Render/Railway. Configured via `render.yaml`.
- **Email**: Dispatched securely via Resend API. 

**Deployment Steps:**
1. Deploy the backend to Render, supplying the required environment variables.
2. Deploy the frontend to Vercel, setting `VITE_BACKEND_URL` to the production backend URL.
3. Update `FRONTEND_ORIGIN` in the backend to the deployed Vercel URL.

---

## 📂 Project Structure

```text
src/
  lib/            runtime hooks, pointers, scroll, ticker, gsap setup
  components/
    core/         SmoothScroll, Cursor, Magnetic, PageTransition, ShaderCanvas
    hero/         stillness, throwable dot, ink takeover
    work/         chapters (pinned + covering), worlds/ (one per project)
    lab/          five playable experiments
    about/        the interactive desk
    contact/      final tactile scene
    kage/         hidden door, KageSeed trigger
  pages/          Home, ProjectDetail, NotFound
  data/           config, projects, playground
scripts/          kage synchronization
```

---

## ✨ Features

### The Scroll System
- The **Hero** is a sticky stage. The lime dot drops ink from wherever you left it, transitioning smoothly into the Work section.
- **Project Chapters** slide up over pinned ones (scene handoff) while opening with bespoke masks.
- Every scene receives `progress`, a pointer, hover, and visibility through context, running seamlessly anywhere.

### Interactive Cursor
One unified lime arrow. States map to `data-cursor` attributes: `default`, `link`, `project`, `play`, `drag`, `image`, `scroll`, `cta`. It gracefully falls back on touch devices.

### Performance & Accessibility
- **Intersection Observers**: Animations and shaders only run when visible in the viewport.
- **WebGL Optimization**: DPR capped, context loss handled, context released on unmount.
- **Reduced Motion**: Disables Lenis, pins, scrubs, and physics when `prefers-reduced-motion` is active.
- **A11y**: Semantic landmarks, keyboard-operable controls, and focus visible states throughout.

---

<div align="center">
  <p><i>Human-Crafted • 0% Boring</i></p>
</div>
