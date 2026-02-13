# FoodDemand Frontend

## Setup

1. Install dependencies:
   - `npm install`
2. Configure `.env` (use `.env.example` as reference):
   - `VITE_FIREBASE_API_KEY=...`
   - `VITE_FIREBASE_AUTH_DOMAIN=...`
   - `VITE_FIREBASE_PROJECT_ID=...`
   - `VITE_FIREBASE_APP_ID=...`
   - `VITE_OTP_API_BASE_URL=http://localhost:8787`
   - `OTP_SERVER_PORT=8787`
   - `OTP_ALLOWED_ORIGIN=http://localhost:5173`
   - `SMTP_HOST=...`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=...`
   - `SMTP_PASS=...`
   - `SMTP_FROM=...`
3. In Firebase Console:
   - Enable `Authentication -> Sign-in method -> Phone`
   - Add your localhost/dev domain in authorized domains
   - Configure reCAPTCHA as required by Firebase Phone Auth
4. Run OTP server:
   - `npm run otp-server`
5. Run app:
   - `npm run dev`

## OTP Rules

- Sign-up requires phone OTP verification.
- Only Indian phone numbers are accepted (`+91` format and valid 10-digit mobile ranges).
- User account creation is blocked until OTP is verified.
- Sign-up can also use Email OTP (real SMTP delivery via backend endpoint).
