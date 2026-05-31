import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  books,
  borrowRecords,
  borrowRiskEvents,
  riskRules,
  userRiskProfiles,
  users,
} from "@/database/schema";

config({ path: ".env.local" });

const adminUser = {
  fullName: "Risk Admin",
  email: "admin@library.local",
  universityId: 900001,
  password: "Admin123!",
  role: "ADMIN" as const,
  status: "APPROVED" as const,
};

const demoRiskUsers = [
  {
    fullName: "Low Risk Demo",
    email: "low@library.local",
    universityId: 900101,
    password: "Demo123!",
    role: "USER" as const,
    status: "APPROVED" as const,
    profile: {
      currentScore: 20,
      currentLevel: "LOW" as const,
      totalBorrowCount: 5,
      activeBorrowCount: 1,
      overdueCount: 0,
      maxOverdueDays: 0,
      recent7dBorrowCount: 1,
      recent24hBorrowCount: 1,
      abnormalEventCount: 0,
    },
    reasons: [] as Array<{ code: string; message: string; weight: number }>,
    explanation:
      "This user shows stable borrowing behavior and is currently considered low risk.",
  },
  {
    fullName: "Medium Risk Demo",
    email: "medium@library.local",
    universityId: 900102,
    password: "Demo123!",
    role: "USER" as const,
    status: "APPROVED" as const,
    profile: {
      currentScore: 55,
      currentLevel: "MEDIUM" as const,
      totalBorrowCount: 20,
      activeBorrowCount: 5,
      overdueCount: 2,
      maxOverdueDays: 18,
      recent7dBorrowCount: 6,
      recent24hBorrowCount: 3,
      abnormalEventCount: 2,
    },
    reasons: [
      {
        code: "MULTIPLE_OVERDUE_HISTORY",
        message: "The user has several overdue records in recent history.",
        weight: 25,
      },
      {
        code: "NEW_ACCOUNT_HIGH_ACTIVITY",
        message: "The account showed concentrated borrowing activity in a short time.",
        weight: 10,
      },
    ],
    explanation:
      "This user has some overdue history and short-term concentrated borrowing activity, so continued observation is recommended.",
  },
  {
    fullName: "High Risk Demo",
    email: "high@library.local",
    universityId: 900103,
    password: "Demo123!",
    role: "USER" as const,
    status: "APPROVED" as const,
    profile: {
      currentScore: 90,
      currentLevel: "HIGH" as const,
      totalBorrowCount: 50,
      activeBorrowCount: 10,
      overdueCount: 5,
      maxOverdueDays: 45,
      recent7dBorrowCount: 8,
      recent24hBorrowCount: 6,
      abnormalEventCount: 6,
    },
    reasons: [
      {
        code: "SHORT_TIME_FREQUENT_BORROW",
        message: "The user borrowed too many books within 24 hours.",
        weight: 30,
      },
      {
        code: "MULTIPLE_OVERDUE_HISTORY",
        message: "The user has multiple overdue records in history.",
        weight: 25,
      },
      {
        code: "TOO_MANY_ACTIVE_BORROWS",
        message: "The user currently has too many active borrow records.",
        weight: 20,
      },
      {
        code: "LONG_TERM_OVERDUE",
        message: "The user has long-term overdue borrow records.",
        weight: 25,
      },
    ],
    explanation:
      "This user borrowed frequently in the last 24 hours, still has many active borrows, and has several overdue records. Manual review is recommended.",
  },
];

async function ensureBooks() {
  const existingBooks = await db.select().from(books).limit(3);

  if (existingBooks.length >= 3) {
    return existingBooks;
  }

  return db
    .insert(books)
    .values([
      {
        title: "Artificial Intelligence: A Modern Approach",
        author: "Stuart Russell and Peter Norvig",
        genre: "Artificial Intelligence",
        rating: 5,
        coverUrl:
          "https://m.media-amazon.com/images/I/61nHC3YWZlL._AC_UF1000,1000_QL80_.jpg",
        coverColor: "#c7cdd9",
        description: "Local seed book for the risk intelligence demo.",
        totalCopies: 20,
        availableCopies: 20,
        videoUrl: "/sample-video.mp4",
        summary: "Local seed book for the TP + AP + AI risk demo.",
      },
      {
        title: "Database System Concepts",
        author: "Silberschatz, Korth, Sudarshan",
        genre: "Database",
        rating: 5,
        coverUrl:
          "https://m.media-amazon.com/images/I/81N7FmJhbhL._UF1000,1000_QL80_.jpg",
        coverColor: "#2e4c7f",
        description: "Database classic used for local demonstration.",
        totalCopies: 20,
        availableCopies: 20,
        videoUrl: "/sample-video.mp4",
        summary: "Database classic used for local demonstration.",
      },
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        genre: "Software Engineering",
        rating: 5,
        coverUrl:
          "https://m.media-amazon.com/images/I/71T7aD3EOTL._UF1000,1000_QL80_.jpg",
        coverColor: "#080c0d",
        description: "Software engineering title used for local demonstration.",
        totalCopies: 20,
        availableCopies: 20,
        videoUrl: "/sample-video.mp4",
        summary: "Software engineering title used for local demonstration.",
      },
    ])
    .returning();
}

async function ensureRiskRules() {
  const existingRules = await db.select().from(riskRules).limit(1);
  if (existingRules.length > 0) return;

  await db.insert(riskRules).values([
    {
      code: "SHORT_TIME_FREQUENT_BORROW",
      name: "Frequent Borrowing in Short Time",
      description: "Borrow count is too high within 24 hours.",
      weight: 30,
      enabled: true,
      thresholdConfig: { recent24hBorrowCount: 5 },
    },
    {
      code: "MULTIPLE_OVERDUE_HISTORY",
      name: "Multiple Overdue History",
      description: "The user has multiple overdue records.",
      weight: 25,
      enabled: true,
      thresholdConfig: { overdueCount: 3 },
    },
    {
      code: "TOO_MANY_ACTIVE_BORROWS",
      name: "Too Many Active Borrows",
      description: "The user has too many active borrow records.",
      weight: 20,
      enabled: true,
      thresholdConfig: { activeBorrowCount: 8 },
    },
    {
      code: "LONG_TERM_OVERDUE",
      name: "Long Term Overdue",
      description: "The user has overdue records longer than 30 days.",
      weight: 25,
      enabled: true,
      thresholdConfig: { maxOverdueDays: 30 },
    },
  ]);
}

async function ensureUser(
  user: typeof adminUser | (typeof demoRiskUsers)[number],
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, user.email))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const hashedPassword = await hash(user.password, 10);
  const [createdUser] = await db
    .insert(users)
    .values({
      fullName: user.fullName,
      email: user.email,
      universityId: user.universityId,
      password: hashedPassword,
      universityCard: "local-demo-card",
      role: user.role,
      status: user.status,
    })
    .returning();

  return createdUser;
}

async function ensureBorrowRecord(userId: string, bookId: string, daysAgo: number) {
  const borrowDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const dueDate = new Date(borrowDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [record] = await db
    .insert(borrowRecords)
    .values({
      userId,
      bookId,
      borrowDate,
      dueDate,
      status: "BORROWED",
    })
    .returning();

  return record;
}

async function seed() {
  const seededBooks = await ensureBooks();
  await ensureRiskRules();

  const admin = await ensureUser(adminUser);
  console.log("Admin ready:", admin.email);

  for (const [index, demoUser] of demoRiskUsers.entries()) {
    const createdUser = await ensureUser(demoUser);

    await db
      .delete(userRiskProfiles)
      .where(eq(userRiskProfiles.userId, createdUser.id));
    await db
      .delete(borrowRiskEvents)
      .where(eq(borrowRiskEvents.userId, createdUser.id));
    await db
      .delete(borrowRecords)
      .where(eq(borrowRecords.userId, createdUser.id));

    const primaryBook = seededBooks[index % seededBooks.length];
    const record = await ensureBorrowRecord(createdUser.id, primaryBook.id, index);

    await db.insert(userRiskProfiles).values({
      userId: createdUser.id,
      ...demoUser.profile,
      lastEvaluatedAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(borrowRiskEvents).values({
      borrowRecordId: record.id,
      userId: createdUser.id,
      bookId: primaryBook.id,
      eventType: "BORROW",
      riskScore: demoUser.profile.currentScore,
      riskLevel: demoUser.profile.currentLevel,
      featureSnapshot: {
        totalBorrowCount: demoUser.profile.totalBorrowCount,
        activeBorrowCount: demoUser.profile.activeBorrowCount,
        overdueCount: demoUser.profile.overdueCount,
        maxOverdueDays: demoUser.profile.maxOverdueDays,
        recent7dBorrowCount: demoUser.profile.recent7dBorrowCount,
        recent24hBorrowCount: demoUser.profile.recent24hBorrowCount,
        sameCategoryRecentBorrowCount:
          demoUser.profile.currentLevel === "HIGH" ? 4 : 1,
        avgReturnDelayDays:
          demoUser.profile.currentLevel === "HIGH" ? 12 : 2,
        hasUnreturnedOverdueBooks: demoUser.profile.currentLevel === "HIGH",
        accountAgeDays: demoUser.profile.currentLevel === "LOW" ? 180 : 30,
      },
      reasonCodes: demoUser.reasons,
      aiExplanation: demoUser.explanation,
      decision: demoUser.profile.currentLevel === "HIGH" ? "REVIEW" : "ALLOW",
      createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    });

    console.log(`Seeded demo risk profile for ${createdUser.email}`);
  }

  console.log("");
  console.log("Demo accounts:");
  console.log("admin@library.local / Admin123!");
  console.log("low@library.local / Demo123!");
  console.log("medium@library.local / Demo123!");
  console.log("high@library.local / Demo123!");
}

seed().catch((error) => {
  console.error("Failed to seed risk demo data:", error);
  process.exit(1);
});
