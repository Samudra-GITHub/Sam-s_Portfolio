<div align="center">

<img src="https://raw.githubusercontent.com/Samudra-GITHub/Sam-s_Portfolio/main/public/favicon.svg" alt="Sam's Studio Icon" width="120" height="120" />

<br />
<br />

<img src="https://img.shields.io/badge/Lighthouse_Desktop-100-brightgreen.svg?style=flat-square" alt="Lighthouse desktop performance 100" height="24" />
<img src="https://img.shields.io/badge/Lighthouse_Mobile-98-brightgreen.svg?style=flat-square" alt="Lighthouse mobile performance 98" height="24" />
<img src="https://img.shields.io/badge/Accessibility-100-brightgreen.svg?style=flat-square" alt="Accessibility 100" height="24" />
<img src="https://img.shields.io/badge/Best_Practices-100-brightgreen.svg?style=flat-square" alt="Best practices 100" height="24" />
<img src="https://img.shields.io/badge/SEO-100-brightgreen.svg?style=flat-square" alt="SEO 100" height="24" />

<br />
<br />

**[Live demo](#installation)** &nbsp;·&nbsp; **[Architecture](#architecture)** &nbsp;·&nbsp; **[Design System](#design-system)** &nbsp;·&nbsp; **[Tech Stack](#tech-stack)**

</div>

---

<br />

**Samudra Kar's Portfolio** is a scroll-driven, cursor-aware digital world — a brand, identity, and product designed and engineered by **Sams Studio**. It features seven project worlds, a lab of playable experiments, an interactive About desk, and one hidden door (Kage).

One rule held throughout: **Motion must feel physically grounded and hyper-responsive.** The desktop experience combines raw WebGL shaders, GSAP page choreographies, and Framer Motion micro-interactions, running on a unified global render loop.

## Installation

The site runs complete with no accounts or keys required for the frontend. The backend requires a Resend API key for the contact form.

```bash
git clone https://github.com/Samudra-GITHub/Sam-s_Portfolio.git
```

```bash
cd Sam-s_Portfolio && npm install && npm run dev
```

Then open <http://localhost:5173>.

## Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>Scroll-Driven Storytelling</h3>
      <p>The Hero is a sticky stage where an interactive lime dot drops ink, transitioning smoothly into the Work section. Project chapters slide up over pinned ones in a cinematic scene handoff, opening with bespoke masks.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Interactive Cursor & Physics</h3>
      <p>One unified lime arrow dynamically morphs. States map to intuitive triggers: <code>default</code>, <code>link</code>, <code>project</code>, <code>play</code>, <code>drag</code>, <code>image</code>, <code>scroll</code>, and <code>cta</code>. Elements feature true spring physics and magnetic hover forces.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>Shader Worlds & Kage</h3>
      <p>Interactive worlds like AkashaLens and Ink are powered by raw WebGL (<code>ShaderCanvas</code>) without the overhead of heavy 3D libraries. A hidden asset synchronization script seamlessly integrates the secret Kage Easter egg.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Accessibility First</h3>
      <p>Semantic landmarks, keyboard-operable controls, and focus-visible states throughout. Reduced motion disables Lenis smooth scrolling, pins, scrubs, and physics, falling back to a clean, stacked layout.</p>
    </td>
  </tr>
</table>

## Motion

Motion is intentionally split across specific libraries to maintain 60FPS fluid interactions without overlap. They never animate the same element.

| Job | Tool |
| :-- | :-- |
| **Smooth scroll & velocity** | Lenis *(driven by GSAP's ticker)* |
| **Pinned scenes, masks, reveals** | GSAP + ScrollTrigger |
| **Cursor springs, physics, parallax** | Framer Motion |
| **Shader worlds (Akasha, Ink)** | Raw WebGL (`ShaderCanvas`) |
| **Global Render Loop** | One shared `gsap.ticker` |

## Design system

The portfolio uses a bespoke, brutalist-inspired design system designed to feel like a tactile object rather than a generic webpage.

- **Warm Paper Canvas** (`#fdf9f1`) and **Deep Ink** (`#111215`) for the primary contrast.
- **Electric Lime** (`#d8f827`), **Cobalt** (`#1e3ae8`), and **Vermilion** (`#ff5226`) for energetic accents.
- **Typography:** Syne (display), Epilogue (sans), JetBrains Mono (code).
- **Physicality:** Hard 2px borders, rigid drop shadows, asymmetry, and a signature **Lime Dot**.

## Tech stack

<div align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue.svg?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.3-purple.svg?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue.svg?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green.svg?style=for-the-badge&logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/GSAP-3.15-green.svg?style=for-the-badge&logo=greensock" alt="GSAP" />
  <img src="https://img.shields.io/badge/Framer_Motion-13-f509e5.svg?style=for-the-badge&logo=framer" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Resend-API-black.svg?style=for-the-badge&logo=resend" alt="Resend" />
</div>

## Architecture

Static by default for the frontend, with a minimal Node.js Express backend solely responsible for processing contact emails securely.

| Service | Powers | Without it |
| :-- | :-- | :-- |
| **Vite / React** | Frontend rendering and routing | N/A |
| **Express Backend** | Rate-limiting, CORS, Zod validation | Contact form fails |
| **Resend API** | Reliable email delivery | Backend throws 500 error |
| **@designcodeio/threeui** | The secret Kage door | Fails build without synchronization script |

## Environment

Copy `backend/.env.example` to `backend/.env` and fill in what you need.

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
CONTACT_EMAIL=your-inbox@example.com
RESEND_API_KEY=re_12345
RESEND_FROM=contact@yourdomain.com
```

Set `VITE_BACKEND_URL` in the frontend `.env` to point to the active backend instance.

## Deploy

- **Frontend**: Designed for Vercel. Configured via `vercel.json` for SPA fallback routing.
- **Backend**: Designed for Render/Railway. Configured via `render.yaml`.

```bash
npm run build
```

The frontend build automatically triggers `scripts/sync-kage.mjs` to synchronize and verify all secret 3D assets before bundling.

---

<div align="center">
  <p><i>Human-Crafted • 0% Boring</i></p>
</div>
