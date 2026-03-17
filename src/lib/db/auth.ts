/**
 * Auth user storage in MongoDB (used by NextAuth and signup API).
 */
import { getDb } from "@/lib/mongodb";

const USERS_COLLECTION = "users";

export interface DbUser {
  _id?: unknown;
  id?: string;
  email: string;
  emailVerified?: Date | null;
  name?: string | null;
  image?: string | null;
  passwordHash?: string | null;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  referralCode?: string;
  usdBalance?: number;
  profit?: number;
  // OAuth
  accounts?: { provider: string; providerAccountId: string }[];
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const db = await getDb();
  const doc = await db.collection(USERS_COLLECTION).findOne({
    email: email.toLowerCase().trim()
  });
  if (!doc) return null;
  return docToUser(doc);
}

export async function findUserByOAuth(provider: string, providerAccountId: string): Promise<DbUser | null> {
  const db = await getDb();
  const doc = await db.collection(USERS_COLLECTION).findOne({
    "accounts.provider": provider,
    "accounts.providerAccountId": providerAccountId
  });
  if (!doc) return null;
  return docToUser(doc);
}

export async function createUser(data: {
  email: string;
  name?: string | null;
  image?: string | null;
  passwordHash?: string | null;
  referer?: string | null;
  emailVerified?: Date | null;
  role?: string;
}): Promise<DbUser> {
  const db = await getDb();
  const now = new Date();
  const doc = {
    email: data.email.toLowerCase().trim(),
    name: data.name ?? null,
    image: data.image ?? null,
    passwordHash: data.passwordHash ?? null,
    referer: data.referer ? String(data.referer) : "",
    emailVerified: data.emailVerified ?? null,
    role: data.role ?? "user",
    usdBalance: 0,
    profit: 0,
    createdAt: now,
    updatedAt: now,
    accounts: []
  };
  const user = await db.collection(USERS_COLLECTION).insertOne(doc);
  const referralCode = user.insertedId?.toString().slice(-5);
  if (referralCode) {
    await db.collection(USERS_COLLECTION).updateOne({ _id: user.insertedId }, { $set: { referralCode } });
  }
  return docToUser({ _id: user.insertedId, ...user });
}

export async function updateUserOAuthAccount(
  email: string,
  provider: string,
  providerAccountId: string
): Promise<void> {
  const db = await getDb();
  await db.collection(USERS_COLLECTION).updateOne(
    { email: email.toLowerCase().trim() },
    {
      $set: { updatedAt: new Date() },
      $addToSet: {
        accounts: { provider, providerAccountId }
      }
    }
  );
}

export async function upsertUserByOAuth(data: {
  email: string;
  name?: string | null;
  image?: string | null;
  provider: string;
  providerAccountId: string;
}): Promise<DbUser> {
  const db = await getDb();
  const now = new Date();
  const email = data.email.toLowerCase().trim();
  const existing = await db.collection(USERS_COLLECTION).findOne({ email });
  if (existing) {
    await db.collection(USERS_COLLECTION).updateOne(
      { email },
      {
        $set: {
          name: data.name ?? existing.name,
          image: data.image ?? existing.image,
          updatedAt: now
        },
        $addToSet: {
          accounts: {
            provider: data.provider,
            providerAccountId: data.providerAccountId
          }
        }
      }
    );
    const updated = await db.collection(USERS_COLLECTION).findOne({ email });
    return docToUser(updated!);
  }
  const doc = {
    email,
    name: data.name ?? null,
    image: data.image ?? null,
    passwordHash: null,
    emailVerified: now,
    role: "user",
    usdBalance: 0,
    profit: 0,
    createdAt: now,
    updatedAt: now,
    accounts: [{ provider: data.provider, providerAccountId: data.providerAccountId }]
  };
  const result = await db.collection(USERS_COLLECTION).insertOne(doc);
  return docToUser({ _id: result.insertedId, ...doc });
}

export async function incrementUserUsdBalance(userId: string, usdDelta: number): Promise<void> {
  if (!userId || !usdDelta || Number.isNaN(usdDelta)) return;
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  await db.collection(USERS_COLLECTION).updateOne(
    { _id: new ObjectId(userId) },
    {
      $inc: { usdBalance: usdDelta },
      $set: { updatedAt: new Date() }
    }
  );
}

function docToUser(doc: any): DbUser {
  return {
    _id: doc._id,
    id: doc._id?.toString(),
    email: doc.email,
    emailVerified: doc.emailVerified,
    name: doc.name,
    image: doc.image,
    passwordHash: doc.passwordHash,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    accounts: doc.accounts,
    usdBalance: doc.usdBalance,
    profit: doc.profit
  };
}
