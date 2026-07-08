# PayGuard 🛡️

**Real-time payment fraud detection layer for online payments — built for SaaS and e-commerce platforms.**

PayGuard sits between your checkout flow and your payment gateway (Razorpay), adding an extra layer of fraud detection and transaction monitoring that most businesses don't build in-house.

## What it does

- **Risk-based order verification** — Every transaction is scored in real-time using rule-based fraud detection (velocity checks, amount tampering, IP anomalies)
- **Webhook-driven payment confirmation** — Never trusts frontend-reported payment status; relies on signature-verified Razorpay webhooks
- **Reconciliation engine** — Automatically detects mismatches between local order state and Razorpay's actual transaction records
- **Admin Risk Control Room** — A live dashboard for reviewing flagged transactions, approving/rejecting suspicious payments, and monitoring fraud trends

## Tech Stack

1. Backend Core & Services
Java 17+: The modern, typed programming language used for the backend engine.
Spring Boot 3.x (Spring Web, JPA): The foundational MVC framework used to build REST endpoints, handle routing, and structure dependencies.
Spring Task Scheduling: Orchestrates the background reconciliation task running every 30 seconds (@Scheduled).
SLF4J & Logback: The unified logging framework used for real-time risk alerts and debug logging.

3. Database & Data Layer
H2 Database (In-Memory / File-Based): An embedded relational SQL database used to store transaction history (CREATED, ATTEMPTED, PAID, FAILED, FLAGGED) locally without requiring external setup.
Hibernate / Spring Data JPA: The Object-Relational Mapping (ORM) layer managing queries, rate-limit evaluations, and entity transformations.

5. Payment & Cryptography Gateway
Razorpay Java SDK (v1.4.9): Integrates the backend with Razorpay's server-side APIs (Orders API and Payments API).
Razorpay Checkout.js: Dynamically loaded on the frontend to generate the standard secure payment overlay.
HMAC-SHA256 Cryptographic Hashing: Used for secure signature verification of incoming Razorpay webhooks (X-Razorpay-Signature) against the configured webhook secret.

6. Frontend Application & Styling
React (v18+): Component-based UI framework powering the interactive single-page application.
Vite: The build tool and development server used for fast compilation.
Tailwind CSS (v3): A utility-first CSS framework used for premium custom styling (including dark mode cards, progress bars, and glassmorphic designs).
Lucide React: Vector icons used throughout the dashboard and checkout portal.
Recharts: SVG chart library used to display real-time transactional trends (PAID vs FLAGGED orders).

7. Build Tools & Deployment Specs
Apache Maven (v3.9.16): Manages backend dependencies, packaging, and builds.
npm / Node.js: Manages packages and dependencies on the frontend.
Render Web Service Schema (render.yaml): Standard configuration specification enabling 1-click deployment to Render.com.
Vercel Build Target: Deployment configuration for hosting the static production assets built by Vite.





## Why this exists

Most small-to-mid size businesses integrate a payment gateway and stop there — trusting frontend confirmations, skipping webhook validation, and having no visibility into suspicious transaction patterns. PayGuard demonstrates a lightweight, pluggable middleware pattern that any Razorpay-integrated business could adopt to catch fraud before it costs them money.

## Live Demo

- Frontend: [Vercel link]
- Backend API: [Render link]

## Screenshots

*(Admin dashboard, checkout simulator, etc.)*
