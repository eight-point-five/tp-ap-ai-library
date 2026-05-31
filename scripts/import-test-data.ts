import { config } from "dotenv";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  users,
  books,
  borrowRecords,
  borrowRiskEvents,
  userRiskProfiles,
  riskRules,
  nlqLogs,
} from "@/database/schema";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

// ============================================================
// 类型定义
// ============================================================

interface TestRiskRule {
  id: string;
  code: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  thresholdConfig: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface TestBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  videoUrl: string;
  summary: string;
  createdAt: string;
}

interface TestUser {
  id: string;
  fullName: string;
  email: string;
  universityId: number;
  password: string;
  universityCard: string;
  role: "USER" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface TestBorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "BORROWED" | "RETURNED";
  createdAt: string;
}

interface TestRiskEvent {
  id: string;
  borrowRecordId: string;
  userId: string;
  bookId: string;
  eventType: "BORROW" | "RENEW" | "RETURN";
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  featureSnapshot: Record<string, unknown>;
  reasonCodes: Array<{ code: string; message: string; weight: number }>;
  aiExplanation: string;
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  createdAt: string;
}

interface TestRiskProfile {
  id: string;
  userId: string;
  currentScore: number;
  currentLevel: "LOW" | "MEDIUM" | "HIGH";
  totalBorrowCount: number;
  activeBorrowCount: number;
  overdueCount: number;
  maxOverdueDays: number;
  recent7dBorrowCount: number;
  recent24hBorrowCount: number;
  abnormalEventCount: number;
  lastEvaluatedAt: string;
  updatedAt: string;
}

interface TestNLQLog {
  id: string;
  userId: string;
  queryText: string;
  parsedIntent: string;
  parsedFilters: Record<string, unknown>;
  generatedQuerySummary: string;
  resultCount: number;
  createdAt: string;
}

// ============================================================
// 工具函数
// ============================================================

function loadJSON<T>(filename: string): T[] {
  const filePath = path.resolve(__dirname, "../test-data", filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// ============================================================
// 导入函数
// ============================================================

async function clearAllData() {
  console.log("Clearing existing data...");

  // 按照外键依赖的反序删除
  await db.delete(nlqLogs);
  await db.delete(userRiskProfiles);
  await db.delete(borrowRiskEvents);
  await db.delete(borrowRecords);
  await db.delete(users);
  await db.delete(books);
  await db.delete(riskRules);

  console.log("  ✓ All data cleared");
}

async function importRiskRules(rules: TestRiskRule[]) {
  console.log(`[1/7] Importing risk rules... (${rules.length} records)`);

  for (const rule of rules) {
    await db.insert(riskRules).values({
      id: rule.id,
      code: rule.code,
      name: rule.name,
      description: rule.description,
      weight: rule.weight,
      enabled: rule.enabled,
      thresholdConfig: rule.thresholdConfig,
      createdAt: new Date(rule.createdAt),
      updatedAt: new Date(rule.updatedAt),
    });
  }

  console.log("  ✓ Risk rules imported");
}

async function importBooks(booksData: TestBook[]) {
  console.log(`[2/7] Importing books... (${booksData.length} records)`);

  for (const book of booksData) {
    await db.insert(books).values({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      rating: book.rating,
      coverUrl: book.coverUrl,
      coverColor: book.coverColor,
      description: book.description,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      videoUrl: book.videoUrl,
      summary: book.summary,
      createdAt: new Date(book.createdAt),
    });
  }

  console.log("  ✓ Books imported");
}

async function importUsers(usersData: TestUser[]) {
  console.log(`[3/7] Importing users... (${usersData.length} records)`);

  for (const user of usersData) {
    const hashedPassword = await hash(user.password, 10);

    // 验证密码哈希是否正确
    const isValid = await compare(user.password, hashedPassword);
    if (!isValid) {
      console.error(`  ❌ Password hash verification failed for ${user.email}`);
      process.exit(1);
    }

    await db.insert(users).values({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      universityId: user.universityId,
      password: hashedPassword,
      universityCard: user.universityCard,
      role: user.role,
      status: user.status,
      createdAt: new Date(user.createdAt),
    });
  }

  console.log("  ✓ Users imported (password hash verified)");
}

async function verifyUsersFromDatabase() {
  console.log("Verifying users from database...");

  // 查询一个用户验证密码
  const testUser = await db
    .select()
    .from(users)
    .where(eq(users.email, "low1@library.local"))
    .limit(1);

  if (testUser.length === 0) {
    console.error("  ❌ Test user not found in database");
    return;
  }

  const isValid = await compare("Demo123!", testUser[0].password);
  console.log(`  Password verification for low1@library.local: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

  if (!isValid) {
    console.error("  ❌ Password hash stored in database is incorrect");
    console.log("  Stored hash:", testUser[0].password);
  }
}

async function importBorrowRecords(records: TestBorrowRecord[]) {
  console.log(`[4/7] Importing borrow records... (${records.length} records)`);

  for (const record of records) {
    await db.insert(borrowRecords).values({
      id: record.id,
      userId: record.userId,
      bookId: record.bookId,
      borrowDate: new Date(record.borrowDate),
      dueDate: record.dueDate,
      returnDate: record.returnDate,
      status: record.status,
      createdAt: new Date(record.createdAt),
    });
  }

  console.log("  ✓ Borrow records imported");
}

async function importRiskEvents(events: TestRiskEvent[]) {
  console.log(`[5/7] Importing risk events... (${events.length} records)`);

  for (const event of events) {
    await db.insert(borrowRiskEvents).values({
      id: event.id,
      borrowRecordId: event.borrowRecordId,
      userId: event.userId,
      bookId: event.bookId,
      eventType: event.eventType,
      riskScore: event.riskScore,
      riskLevel: event.riskLevel,
      featureSnapshot: event.featureSnapshot,
      reasonCodes: event.reasonCodes,
      aiExplanation: event.aiExplanation,
      decision: event.decision,
      createdAt: new Date(event.createdAt),
    });
  }

  console.log("  ✓ Risk events imported");
}

async function importRiskProfiles(profiles: TestRiskProfile[]) {
  console.log(`[6/7] Importing risk profiles... (${profiles.length} records)`);

  for (const profile of profiles) {
    await db.insert(userRiskProfiles).values({
      id: profile.id,
      userId: profile.userId,
      currentScore: profile.currentScore,
      currentLevel: profile.currentLevel,
      totalBorrowCount: profile.totalBorrowCount,
      activeBorrowCount: profile.activeBorrowCount,
      overdueCount: profile.overdueCount,
      maxOverdueDays: profile.maxOverdueDays,
      recent7dBorrowCount: profile.recent7dBorrowCount,
      recent24hBorrowCount: profile.recent24hBorrowCount,
      abnormalEventCount: profile.abnormalEventCount,
      lastEvaluatedAt: new Date(profile.lastEvaluatedAt),
      updatedAt: new Date(profile.updatedAt),
    });
  }

  console.log("  ✓ Risk profiles imported");
}

async function importNLQLogs(logs: TestNLQLog[]) {
  console.log(`[7/7] Importing NLQ logs... (${logs.length} records)`);

  for (const log of logs) {
    await db.insert(nlqLogs).values({
      id: log.id,
      userId: log.userId,
      queryText: log.queryText,
      parsedIntent: log.parsedIntent,
      parsedFilters: log.parsedFilters,
      generatedQuerySummary: log.generatedQuerySummary,
      resultCount: log.resultCount,
      createdAt: new Date(log.createdAt),
    });
  }

  console.log("  ✓ NLQ logs imported");
}

// ============================================================
// 主入口
// ============================================================

async function main() {
  console.log("========================================");
  console.log("Importing Test Data");
  console.log("========================================");
  console.log("");

  // 加载JSON数据
  const riskRulesData = loadJSON<TestRiskRule>("risk-rules.json");
  const booksData = loadJSON<TestBook>("books.json");
  const usersData = loadJSON<TestUser>("users.json");
  const borrowRecordsData = loadJSON<TestBorrowRecord>("borrow-records.json");
  const riskEventsData = loadJSON<TestRiskEvent>("risk-events.json");
  const riskProfilesData = loadJSON<TestRiskProfile>("risk-profiles.json");
  const nlqLogsData = loadJSON<TestNLQLog>("nlq-logs.json");

  // 清空现有数据
  await clearAllData();
  console.log("");

  // 按顺序导入数据
  await importRiskRules(riskRulesData);
  await importBooks(booksData);
  await importUsers(usersData);
  await importBorrowRecords(borrowRecordsData);
  await importRiskEvents(riskEventsData);
  await importRiskProfiles(riskProfilesData);
  await importNLQLogs(nlqLogsData);

  // 验证数据库中的用户密码
  await verifyUsersFromDatabase();

  console.log("");
  console.log("========================================");
  console.log("✅ Import complete!");
  console.log("========================================");
  console.log("");
  console.log("Demo accounts:");
  console.log("  Admin: admin@library.local / Admin123!");
  console.log("  Low:   low1@library.local / Demo123!");
  console.log("  Med:   medium1@library.local / Demo123!");
  console.log("  High:  high1@library.local / Demo123!");
  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
