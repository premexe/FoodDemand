const AUTH_TOKEN_KEY = 'fooddemand.auth.token';
const AUTH_USER_KEY = 'fooddemand.auth.user';
const AUTH_USERS_KEY = 'fooddemand.auth.users';

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@fooddemand.ai',
  password: 'password123',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function createSession(user, remember = true) {
  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  const safeUser = {
    name: user.name || user.email,
    email: user.email,
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

export async function login({ email, password, remember = true }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }
  if (normalizedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const users = readUsers();
  const matched = users.find((user) => user.email.toLowerCase() === normalizedEmail);
  if (!matched || matched.password !== normalizedPassword) {
    throw new Error('Invalid email or password.');
  }

  createSession(matched, remember);
  return { name: matched.name, email: matched.email };
}

export async function register({ name, email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const normalizedName = String(name || '').trim();

  if (!normalizedName) {
    throw new Error('Name is required.');
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }
  if (normalizedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const users = readUsers();
  const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
  if (exists) {
    throw new Error('Account already exists. Please sign in.');
  }

  const nextUsers = [...users, { name: normalizedName, email: normalizedEmail, password: normalizedPassword }];
  writeUsers(nextUsers);
  createSession({ name: normalizedName, email: normalizedEmail }, true);
  return { name: normalizedName, email: normalizedEmail };
}

export async function loginWithSocial(provider, remember = true) {
  const normalizedProvider = String(provider || 'Social').trim();
  const user = {
    name: `${normalizedProvider} User`,
    email: `${normalizedProvider.toLowerCase()}@social.fooddemand.ai`,
  };
  createSession(user, remember);
  return user;
}
