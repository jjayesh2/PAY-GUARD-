# PayGuard 🛡️

**Real-time payment fraud detection layer for online payments — built for SaaS and e-commerce platforms.**

PayGuard sits between your checkout flow and your payment gateway (Razorpay), adding an extra layer of fraud detection and transaction monitoring that most businesses don't build in-house.

## What it does

- **Risk-based order verification** — Every transaction is scored in real-time using rule-based fraud detection (velocity checks, amount tampering, IP anomalies)
- **Webhook-driven payment confirmation** — Never trusts frontend-reported payment status; relies on signature-verified Razorpay webhooks
- **Reconciliation engine** — Automatically detects mismatches between local order state and Razorpay's actual transaction records
- **Admin Risk Control Room** — A live dashboard for reviewing flagged transactions, approving/rejecting suspicious payments, and monitoring fraud trends

## Tech Stack

- Backend: Java 17+, Spring Boot 3.x (Web, JPA), Spring Task Scheduling (Scheduled, 30s reconciliation).
- Database: H2 (in-memory/file-based), Hibernate / Spring Data JPA
- Payments & Security: Razorpay Java SDK, Razorpay Checkout.js, HMAC-SHA256 (webhook signature verification)
- Frontend: React 18+, Vite, Tailwind CSS v3, Lucide React, Recharts
- Build & Deployment: Apache Maven , npm/Node.js, render.yaml (Render.com), Vercel (Vite build target)




## Why this exists

Most small-to-mid size businesses integrate a payment gateway and stop there — trusting frontend confirmations, skipping webhook validation, and having no visibility into suspicious transaction patterns. PayGuard demonstrates a lightweight, pluggable middleware pattern that any Razorpay-integrated business could adopt to catch fraud before it costs them money.

## Live Demo

- Frontend: https://payguard-tan.vercel.app
- Backend API: https://pay-guard-backend.onrender.com

- SCREENSHOTS
- <img width="1915" height="911" alt="Screenshot 2026-07-09 120351" src="https://github.com/user-attachments/assets/61335040-650f-4805-a1c2-48336cb2613c" />
<img width="1919" height="914" alt="Screenshot 2026-07-09 120335" src="https://github.com/user-attachments/assets/818103e6-5b99-4b73-a1d5-5dc092b02766" />
<img width="1918" height="905" alt="Screenshot 2026-07-09 120300" src="https://github.com/user-attachments/assets/80fc6aad-9379-4170-beee-e3896e05086b" />
  <img width="1919" height="919" alt="Screenshot 2026-07-09 120127" src="https://github.com/user-attachments/assets/a63c9576-0c79-487d-af98-6d0bcc1a91bf" />


