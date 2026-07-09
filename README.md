# PayGuard: Real-Time Payment Fraud Auditing Layer

**PayGuard** is a real-time fraud detection and auditing middleware designed to safeguard online payments processed via **Razorpay Test Mode**. Built for a hackathon demo, it intercepts transaction callbacks, evaluates payment attempts against velocity and tampering rules in a custom rule engine, and displays active control logs on a premium React Admin Dashboard.

---

## 🛠 Tech Stack

- **Backend**: Spring Boot (Java 17+), Maven, H2 database (self-contained file storage)
- **Frontend**: React, Vite, Tailwind CSS, Recharts (visual insights), Lucide Icons
- **Payment Layer**: Razorpay Test Mode SDK (Orders API & Webhook Signatures)

---

## 🔑 Environment Variables & Configurations

### Backend (`/backend`)
Configure these in environment variables or within `backend/src/main/resources/application.properties`:

| Variable Name | Purpose | Example / Default |
| :--- | :--- | :--- |
| `PORT` | The port the Spring Boot server runs on (assigned dynamically by Render) | `8080` |
| `FRONTEND_URL` | Allowed CORS origin (comma-separated if multiple) | `http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Razorpay API Access Key | `rzp_test_TAtefDpyaXD54t` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret Key | `lIMOGB2r5UymUW9Ri8ghH2zx` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook verification key | `your_webhook_secret` |

*Note: If no Razorpay credentials are provided, PayGuard automatically enters **MOCK mode** where it simulates payments and allows you to test the entire loop locally.*

### Frontend (`/frontend`)
Configure this in your Vercel project configuration or local `.env` file:

| Variable Name | Purpose | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base API URL pointing to the backend | `http://localhost:8080` (local) |
| `VITE_RAZORPAY_KEY_ID` | Public Key ID for Razorpay Overlay checkout | `rzp_test_xxxxxx` |

---

## 🚀 Local Development Setup

### 1. Backend Setup
Since global `mvn` is not required, PayGuard utilizes a pre-downloaded Maven runtime:

```bash
# Navigate to backend directory
cd backend

# Run the Spring Boot Application (Windows cmd/powershell)
.\.maven\apache-maven-3.9.16\bin\mvn spring-boot:run

# Run the Spring Boot Application (Unix / Global Maven)
mvn spring-boot:run
```
The server will start on `http://localhost:8080`.
Access the **H2 Console** at: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/payguard`, User: `sa`, Password: `password`).

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install package dependencies
npm install

# Run the development server
npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## 🛡 Fraud Rules Engine & Risk Audit Logic

PayGuard runs transactions through the `RiskEngineService` before confirming order clearance. If the score exceeds **70**, the order is blocked and marked as `FLAGGED` in the H2 ledger:

1. **Velocity Check (+40 Risk)**: Triggers if a customer has made >3 purchase attempts within the last 60 seconds.
2. **IP Address Drift Check (+30 Risk)**: Triggers if a customer's IP address changes between checkout attempts in a 60-second window.
3. **Amount Tampering Check (+50 Risk)**: Triggers if the payment webhook amount does not match the product's server-locked catalog price (Amount Tampering Detected).

---

## 📊 Live Demo Simulations (Hackathon Validation)

We have provided built-in testing commands and GUI triggers so judges can watch fraud rules trigger in real-time.

### 1. Velocity Attack & IP Drift Simulation
Click **"Simulate Velocity Attack"** in the Checkout Portal, or run:
```bash
curl -X POST "http://localhost:8080/api/orders/simulate-attack?customerIdentifier=attacker_john"
```
*Effect*: This creates 3 rapid transactions (with shifting IPs) and submits a 4th transaction. The risk score aggregates to **120** (Velocity + IP Drift + Tampering), placing the transaction into `FLAGGED` status. Check the Admin Dashboard to observe it highlighted in red.

### 2. Price Tampering Simulation
Click **"Simulate Amount Mismatch"** in the Checkout Portal, or execute:
```bash
# A. Create an order normally (e.g. Premium Monthly Subscription)
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod_sub","customerIdentifier":"buyer_bob","ipAddress":"192.168.1.1"}'

# Note the returned "razorpayOrderId" (e.g. order_mock_xxx or order_xxxx)

# B. Fire a webhook with a tampered amount (e.g. 5000 Paise / ₹50 instead of ₹999)
curl -X POST http://localhost:8080/api/webhook/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: mock_signature" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_tamp_99","amount":5000,"currency":"INR","status":"captured","order_id":"YOUR_RAZORPAY_ORDER_ID"}}}}'
```
*Effect*: The engine flags the transaction as amount tampering (+50 score) and details it under risk reasons in the dashboard log.

---

## ☁ Deployment Instructions

### 1. Backend (Render.com)
1. Log in to **Render** and click **New > Web Service**.
2. Connect your Git repository.
3. Set the following parameters:
   - **Name**: `payguard-backend`
   - **Environment**: `Java`
   - **Build Command**: `cd backend && mvn clean package -DskipTests`
   - **Start Command**: `java -jar backend/target/payguard-backend-0.0.1-SNAPSHOT.jar`
4. Expand **Advanced** and add the following Environment Variables:
   - `PORT`: `8080` (Render handles this dynamically, but setting 8080 is a safe fallback)
   - `FRONTEND_URL`: `https://payguard.vercel.app` (replace with your Vercel URL)
   - `RAZORPAY_KEY_ID`: `your_key_id`
   - `RAZORPAY_KEY_SECRET`: `your_key_secret`
   - `RAZORPAY_WEBHOOK_SECRET`: `your_webhook_secret`

### 2. Frontend (Vercel.com)
1. Log in to **Vercel** and click **Add New > Project**.
2. Select your repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Add environment variables:
   - `VITE_API_BASE_URL`: `https://payguard-backend.onrender.com` (Your deployed Render backend URL)
   - `VITE_RAZORPAY_KEY_ID`: `your_razorpay_key_id` (Public Test Mode Key)
5. Click **Deploy**.

### 3. Activating Webhooks in Razorpay
Once your backend is live on Render:
1. Log in to your **Razorpay Dashboard**.
2. Go to **Account & Settings > Webhooks**.
3. Click **Add New Webhook** and configure:
   - **Webhook URL**: `https://payguard-backend.onrender.com/api/webhook/razorpay`
   - **Secret**: `your_webhook_secret` (matches the env var)
   - **Active Events**: Check `payment.captured` and `payment.failed`.
4. Click **Create Webhook**. Now all payment cycles link back to your live fraud engine!
