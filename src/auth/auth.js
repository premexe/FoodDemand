import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

const AUTH_TOKEN_KEY = 'fooddemand.auth.token';
const AUTH_USER_KEY = 'fooddemand.auth.user';
const AUTH_USERS_KEY = 'fooddemand.auth.users';
const OTP_VERIFIED_KEY = 'fooddemand.auth.otp.verified';

const OTP_TTL_MS = 10 * 60 * 1000;
const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@fooddemand.ai',
  password: 'password123',
  verificationMethod: 'email',
  emailVerifiedAt: Date.now(),
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IN_PHONE_PATTERN = /^(?:\+91|91|0)?[6-9]\d{9}$/;
const OTP_API_BASE = (import.meta.env.VITE_OTP_API_BASE_URL || 'http://localhost:8787').replace(/\/$/, '');

const pendingPhoneSessions = new Map();
let recaptchaVerifier;

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function storageList() {
  return [localStorage, sessionStorage];
}

function readUsers() {
  const stored = safeParse(localStorage.getItem(AUTH_USERS_KEY) ?? '[]', []);
  const users = Array.isArray(stored) ? stored : [];
  const withoutDemo = users.filter(
    (user) => user?.email?.toLowerCase() !== DEMO_USER.email.toLowerCase(),
  );
  return [DEMO_USER, ...withoutDemo];
}

function writeUsers(users) {
  const withoutDemo = users.filter(
    (user) => user?.email?.toLowerCase() !== DEMO_USER.email.toLowerCase(),
  );
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(withoutDemo));
}

function clearSession() {
  storageList().forEach((storage) => {
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(AUTH_USER_KEY);
  });
}

function normalizeEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }
  return normalizedEmail;
}

function normalizeIndianPhone(phoneNumber) {
  const raw = String(phoneNumber || '').trim();
  if (!IN_PHONE_PATTERN.test(raw)) {
    throw new Error('Enter a valid Indian mobile number.');
  }
  const digitsOnly = raw.replace(/\D/g, '');
  const lastTenDigits = digitsOnly.slice(-10);
  return `+91${lastTenDigits}`;
}

function readVerifiedOtps() { 
  const raw = safeParse(localStorage.getItem(OTP_VERIFIED_KEY) ?? '{}', {});
  return raw && typeof raw === 'object' ? raw : {};
}

function writeVerifiedOtps(entries) {
  localStorage.setItem(OTP_VERIFIED_KEY, JSON.stringify(entries));
}

function saveVerifiedIdentity(type, value) {
  const entries = readVerifiedOtps();
  const verificationId = `otp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  entries[verificationId] = {
    type,
    value,
    verifiedAt: Date.now(),
  };
  writeVerifiedOtps(entries);
  return verificationId;
}

function consumeVerifiedIdentity(verificationId, expectedType, expectedValue) {
  const entries = readVerifiedOtps();
  const record = entries[verificationId];
  if (!record) {
    throw new Error('OTP verification not found. Please verify again.');
  }

  delete entries[verificationId];
  writeVerifiedOtps(entries);

  if (record.type !== expectedType || record.value !== expectedValue) {
    throw new Error('Verification data mismatch. Please verify again.');
  }
  if (Date.now() - Number(record.verifiedAt || 0) > OTP_TTL_MS) {
    throw new Error('OTP verification expired. Please verify again.');
  }
}

function createSession(user, remember = true) {
  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  const safeUser = {
    name: user.name || user.email,
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    verificationMethod: user.verificationMethod || '',
  };
  const token = `fd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(safeUser));
}

export function getCurrentUser() {
  for (const storage of storageList()) {
    const token = storage.getItem(AUTH_TOKEN_KEY);
    const rawUser = storage.getItem(AUTH_USER_KEY);
    if (!token || !rawUser) {
      continue;
    }
    const user = safeParse(rawUser, null);
    if (user?.email) {
      return user;
    }
  }
  return null;
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function logout() {
  clearSession();
}

export async function sendPhoneOtp({ phoneNumber, recaptchaContainerId }) {
  const normalizedPhone = normalizeIndianPhone(phoneNumber);
  const auth = getFirebaseAuth();

  if (!recaptchaContainerId) {
    throw new Error('Missing reCAPTCHA container.');
  }

  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = undefined;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: 'normal',
  });

  const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifier);
  const sessionId = `phone_otp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  pendingPhoneSessions.set(sessionId, {
    confirmationResult,
    phoneNumber: normalizedPhone,
    createdAt: Date.now(),
  });

  return {
    sessionId,
    phoneNumber: normalizedPhone,
  };
}

export async function verifyPhoneOtp({ sessionId, otpCode }) {
  const pending = pendingPhoneSessions.get(sessionId);
  const normalizedOtp = String(otpCode || '').trim();

  if (!pending) {
    throw new Error('OTP session expired. Please request OTP again.');
  }
  if (!/^\d{6}$/.test(normalizedOtp)) {
    throw new Error('Enter a valid 6-digit OTP.');
  }
  if (Date.now() - pending.createdAt > OTP_TTL_MS) {
    pendingPhoneSessions.delete(sessionId);
    throw new Error('OTP expired. Please request a new OTP.');
  }

  await pending.confirmationResult.confirm(normalizedOtp);
  pendingPhoneSessions.delete(sessionId);

  const verificationId = saveVerifiedIdentity('phone', pending.phoneNumber);

  try {
    await signOut(getFirebaseAuth());
  } catch {
    // Ignore signout failures for local auth flow.
  }

  return {
    verificationId,
    phoneNumber: pending.phoneNumber,
  };
}

export async function sendEmailOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const response = await fetch(`${OTP_API_BASE}/api/otp/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Unable to send email OTP.');
  }

  return {
    sessionId: data.sessionId,
    email: normalizedEmail,
  };
}

export async function verifyEmailOtp({ sessionId, otpCode }) {
  const normalizedOtp = String(otpCode || '').trim();
  if (!sessionId) {
    throw new Error('OTP session expired. Please request OTP again.');
  }
  if (!/^\d{6}$/.test(normalizedOtp)) {
    throw new Error('Enter a valid 6-digit OTP.');
  }

  const response = await fetch(`${OTP_API_BASE}/api/otp/email/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, otpCode: normalizedOtp }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Unable to verify email OTP.');
  }

  const verificationId = saveVerifiedIdentity('email', data.email);

  return {
    verificationId,
    email: data.email,
  };
}

export async function login({ email, password, remember = true }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');

  if (normalizedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const users = readUsers();
  const matched = users.find((user) => user.email.toLowerCase() === normalizedEmail);
  if (!matched || matched.password !== normalizedPassword) {
    throw new Error('Invalid email or password.');
  }

  if (!matched.phoneVerifiedAt && !matched.emailVerifiedAt) {
    throw new Error('Verification is required. Please complete signup OTP first.');
  }

  createSession(matched, remember);
  return { name: matched.name, email: matched.email, phoneNumber: matched.phoneNumber || '' };
}

export async function register({
  name,
  email,
  password,
  verificationMethod,
  phoneNumber,
  phoneVerificationId,
  emailVerificationId,
}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');
  const normalizedName = String(name || '').trim();
  const method = verificationMethod === 'email' ? 'email' : 'phone';

  if (!normalizedName) {
    throw new Error('Name is required.');
  }
  if (normalizedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const users = readUsers();
  const emailExists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
  if (emailExists) {
    throw new Error('Account already exists. Please sign in.');
  }

  const nextUser = {
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
    verificationMethod: method,
  };

  if (method === 'phone') {
    const normalizedPhone = normalizeIndianPhone(phoneNumber);
    if (!phoneVerificationId) {
      throw new Error('Verify phone number with OTP before creating account.');
    }
    consumeVerifiedIdentity(phoneVerificationId, 'phone', normalizedPhone);

    const phoneExists = users.some((user) => user.phoneNumber === normalizedPhone);
    if (phoneExists) {
      throw new Error('This phone number is already linked to another account.');
    }

    nextUser.phoneNumber = normalizedPhone;
    nextUser.phoneVerifiedAt = Date.now();
  } else {
    if (!emailVerificationId) {
      throw new Error('Verify email with OTP before creating account.');
    }
    consumeVerifiedIdentity(emailVerificationId, 'email', normalizedEmail);
    nextUser.emailVerifiedAt = Date.now();
  }

  const nextUsers = [...users, nextUser];
  writeUsers(nextUsers);
  createSession(nextUser, true);
  return { name: nextUser.name, email: nextUser.email, phoneNumber: nextUser.phoneNumber || '' };
}

export async function loginWithSocial(provider, remember = true) {
  const normalizedProvider = String(provider || 'Social').trim();
  const user = {
    name: `${normalizedProvider} User`,
    email: `${normalizedProvider.toLowerCase()}@social.fooddemand.ai`,
    verificationMethod: 'social',
    emailVerifiedAt: Date.now(),
  };
  createSession(user, remember);
  return user;
}
