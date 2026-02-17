/* global process */
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const port = Number(process.env.OTP_SERVER_PORT || 8787);
const otpTtlMs = 10 * 60 * 1000;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pendingEmailOtps = new Map();

function parseAllowedOrigins() {
  const raw = process.env.OTP_ALLOWED_ORIGIN || 'http://localhost:5173';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing server env: ${name}`);
  }
  return value;
}

function createTransport() {
  return nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS'),
    },
  });
}

const mailer = createTransport();
const fromAddress = requireEnv('SMTP_FROM');

const allowedOrigins = parseAllowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by OTP server CORS.'));
  },
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/otp/email/send', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const sessionId = `email_otp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    pendingEmailOtps.set(sessionId, {
      email,
      otpCode,
      createdAt: Date.now(),
    });

    await mailer.sendMail({
      from: fromAddress,
      to: email,
      subject: 'FoodDemand OTP Verification',
      text: `Your FoodDemand OTP is ${otpCode}. It expires in 10 minutes.`,
      html: `<p>Your FoodDemand OTP is <strong>${otpCode}</strong>. It expires in 10 minutes.</p>`,
    });

    return res.json({ sessionId });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to send email OTP.' });
  }
});

app.post('/api/otp/email/verify', (req, res) => {
  const sessionId = String(req.body?.sessionId || '').trim();
  const otpCode = String(req.body?.otpCode || '').trim();

  const pending = pendingEmailOtps.get(sessionId);
  if (!pending) {
    return res.status(400).json({ message: 'OTP session expired. Please request OTP again.' });
  }
  if (!/^\d{6}$/.test(otpCode)) {
    return res.status(400).json({ message: 'Enter a valid 6-digit OTP.' });
  }
  if (Date.now() - pending.createdAt > otpTtlMs) {
    pendingEmailOtps.delete(sessionId);
    return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
  }
  if (pending.otpCode !== otpCode) {
    return res.status(400).json({ message: 'Incorrect OTP.' });
  }

  pendingEmailOtps.delete(sessionId);
  return res.json({ email: pending.email });
});

app.listen(port, () => {
  console.log(`OTP server running at http://localhost:${port}`);
});
