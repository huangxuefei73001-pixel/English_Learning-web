import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";

import type { UsageLabel, VocabularyWord } from "@/data/mock";

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
};

export type StoredFavorite = {
  word: VocabularyWord;
  savedAt: string;
  note: string;
  tag: UsageLabel;
  streak: number;
  reviewedAt: string;
  dueAt: string;
};

type StoredUser = {
  id: string;
  email: string;
  createdAt: string;
  salt: string;
  passwordHash: string;
};

type StoredSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type FavoriteRecord = StoredFavorite & {
  userId: string;
  wordSlug: string;
};

type Database = {
  users: StoredUser[];
  sessions: StoredSession[];
  favorites: FavoriteRecord[];
};

const DB_FILE = process.env.WORD_ISLANDS_DB_PATH ?? path.join(process.cwd(), ".data", "word-islands.json");
const SESSION_DAYS = 30;
const HASH_ITERATIONS = 120000;
const PASSWORD_MIN_LENGTH = 8;

export const SESSION_COOKIE = "word_islands_session";

function adminEmails() {
  const raw = process.env.WORD_ISLANDS_ADMIN_EMAILS ?? process.env.WORD_ISLANDS_ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function emptyDb(): Database {
  return {
    users: [],
    sessions: [],
    favorites: [],
  };
}

function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  mkdirSync(dir, { recursive: true });

  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, JSON.stringify(emptyDb(), null, 2), "utf8");
  }
}

function readDb(): Database {
  ensureDbFile();

  try {
    const parsed = JSON.parse(readFileSync(DB_FILE, "utf8")) as Partial<Database>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: Database) {
  ensureDbFile();
  const tempFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf8");
  renameSync(tempFile, DB_FILE);
}

function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    isAdmin: adminEmails().includes(user.email),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createPasswordHash(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, HASH_ITERATIONS, 32, "sha256").toString("hex");
  return { salt, hash };
}

function verifyPassword(password: string, user: StoredUser) {
  const { hash } = createPasswordHash(password, user.salt);
  const left = Buffer.from(hash, "hex");
  const right = Buffer.from(user.passwordHash, "hex");

  return left.length === right.length && timingSafeEqual(left, right);
}

function sessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

export function validateAuthInput(email: unknown, password: unknown) {
  const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false as const, error: "请输入有效邮箱地址。" };
  }

  if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    return { ok: false as const, error: `密码至少需要 ${PASSWORD_MIN_LENGTH} 位。` };
  }

  return { ok: true as const, email: normalizedEmail, password: normalizedPassword };
}

export function registerUser(email: string, password: string) {
  const db = readDb();
  const normalizedEmail = normalizeEmail(email);

  if (db.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("这个邮箱已经注册过了。");
  }

  const { salt, hash } = createPasswordHash(password);
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: randomBytes(16).toString("hex"),
    email: normalizedEmail,
    salt,
    passwordHash: hash,
    createdAt: now,
  };

  db.users.push(user);
  writeDb(db);

  return toPublicUser(user);
}

export function loginUser(email: string, password: string) {
  const db = readDb();
  const user = db.users.find((item) => item.email === normalizeEmail(email));

  if (!user || !verifyPassword(password, user)) {
    throw new Error("邮箱或密码不正确。");
  }

  return toPublicUser(user);
}

export function createSession(userId: string) {
  const db = readDb();
  const now = new Date().toISOString();
  const expiresAt = sessionExpiry();
  const session: StoredSession = {
    id: randomBytes(24).toString("hex"),
    userId,
    createdAt: now,
    expiresAt: expiresAt.toISOString(),
  };

  db.sessions = db.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
  db.sessions.push(session);
  writeDb(db);

  return { id: session.id, expiresAt };
}

export function getUserBySession(sessionId: string | undefined) {
  if (!sessionId) {
    return null;
  }

  const db = readDb();
  const session = db.sessions.find((item) => item.id === sessionId);

  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const user = db.users.find((item) => item.id === session.userId);
  return user ? toPublicUser(user) : null;
}

export function deleteSession(sessionId: string | undefined) {
  if (!sessionId) {
    return;
  }

  const db = readDb();
  db.sessions = db.sessions.filter((item) => item.id !== sessionId);
  writeDb(db);
}

export function listFavorites(userId: string): StoredFavorite[] {
  const db = readDb();
  return db.favorites
    .filter((item) => item.userId === userId)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
    .map(({ userId: _userId, wordSlug: _wordSlug, ...favorite }) => favorite);
}

export function upsertFavorite(userId: string, favorite: StoredFavorite) {
  const db = readDb();
  const wordSlug = favorite.word.slug;
  const existingIndex = db.favorites.findIndex(
    (item) => item.userId === userId && item.wordSlug === wordSlug,
  );
  const record: FavoriteRecord = {
    ...favorite,
    userId,
    wordSlug,
  };

  if (existingIndex >= 0) {
    db.favorites[existingIndex] = record;
  } else {
    db.favorites.push(record);
  }

  writeDb(db);
  return favorite;
}

export function importFavorites(userId: string, favorites: StoredFavorite[]) {
  favorites.forEach((favorite) => upsertFavorite(userId, favorite));
  return listFavorites(userId);
}

export function deleteFavorite(userId: string, slug: string) {
  const db = readDb();
  const before = db.favorites.length;
  db.favorites = db.favorites.filter((item) => !(item.userId === userId && item.wordSlug === slug));
  writeDb(db);
  return db.favorites.length !== before;
}
