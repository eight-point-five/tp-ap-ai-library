import * as fs from "fs";
import * as path from "path";

// ============================================================
// 类型定义
// ============================================================

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type RiskDecision = "ALLOW" | "REVIEW" | "BLOCK";
type BorrowStatus = "BORROWED" | "RETURNED";
type UserRole = "USER" | "ADMIN";
type UserStatus = "PENDING" | "APPROVED" | "REJECTED";
type RiskEventType = "BORROW" | "RENEW" | "RETURN";

interface RiskFeatures {
  totalBorrowCount: number;
  activeBorrowCount: number;
  overdueCount: number;
  maxOverdueDays: number;
  recent7dBorrowCount: number;
  recent24hBorrowCount: number;
  sameCategoryRecentBorrowCount: number;
  avgReturnDelayDays: number;
  hasUnreturnedOverdueBooks: boolean;
  accountAgeDays: number;
}

interface RiskReason {
  code: string;
  message: string;
  weight: number;
}

interface RiskResult {
  score: number;
  level: RiskLevel;
  decision: RiskDecision;
  reasons: RiskReason[];
  explanation: string;
}

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
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

interface TestBorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatus;
  createdAt: string;
}

interface TestRiskEvent {
  id: string;
  borrowRecordId: string;
  userId: string;
  bookId: string;
  eventType: RiskEventType;
  riskScore: number;
  riskLevel: RiskLevel;
  featureSnapshot: RiskFeatures;
  reasonCodes: RiskReason[];
  aiExplanation: string;
  decision: RiskDecision;
  createdAt: string;
}

interface TestRiskProfile {
  id: string;
  userId: string;
  currentScore: number;
  currentLevel: RiskLevel;
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

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(daysAgo: number, baseDate: Date = new Date()): Date {
  const msAgo = randomInt(0, daysAgo * 24 * 60 * 60 * 1000);
  return new Date(baseDate.getTime() - msAgo);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString();
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

function diffInDays(endDate: Date, startDate: Date): number {
  return Math.max(Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
}

function buildRiskExplanation(score: number, level: RiskLevel, reasons: RiskReason[]): string {
  if (reasons.length === 0) {
    return `Current risk score is ${score}. No major abnormal borrowing behavior was detected, so the user is classified as ${level}.`;
  }
  const reasonText = reasons.map((r) => r.message).join("; ");
  return `Current risk score is ${score} and the risk level is ${level}. Key reasons: ${reasonText} Manual admin review is recommended.`;
}

// ============================================================
// 风险评分计算
// ============================================================

function calculateRiskScore(features: RiskFeatures): RiskResult {
  let score = 0;
  const reasons: RiskReason[] = [];

  if (features.recent24hBorrowCount >= 5) {
    score += 30;
    reasons.push({
      code: "SHORT_TIME_FREQUENT_BORROW",
      message: "The user borrowed too many books within 24 hours.",
      weight: 30,
    });
  }

  if (features.overdueCount >= 3) {
    score += 25;
    reasons.push({
      code: "MULTIPLE_OVERDUE_HISTORY",
      message: "The user has multiple overdue records in history.",
      weight: 25,
    });
  }

  if (features.activeBorrowCount >= 8) {
    score += 20;
    reasons.push({
      code: "TOO_MANY_ACTIVE_BORROWS",
      message: "The user currently has too many active borrow records.",
      weight: 20,
    });
  }

  if (features.maxOverdueDays >= 30) {
    score += 25;
    reasons.push({
      code: "LONG_TERM_OVERDUE",
      message: "The user has long-term overdue borrow records.",
      weight: 25,
    });
  }

  if (features.hasUnreturnedOverdueBooks) {
    score += 10;
    reasons.push({
      code: "UNRETURNED_OVERDUE_BOOK",
      message: "The user still has overdue books that were not returned.",
      weight: 10,
    });
  }

  if (features.accountAgeDays <= 14 && features.recent7dBorrowCount >= 4) {
    score += 10;
    reasons.push({
      code: "NEW_ACCOUNT_HIGH_ACTIVITY",
      message: "A newly registered account borrowed frequently in a short time.",
      weight: 10,
    });
  }

  score = Math.min(score, 100);

  const level: RiskLevel = score >= 80 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW";
  const decision: RiskDecision = score >= 80 ? "REVIEW" : "ALLOW";

  return {
    score,
    level,
    decision,
    reasons,
    explanation: buildRiskExplanation(score, level, reasons),
  };
}

// ============================================================
// 数据生成器 - 风险规则
// ============================================================

function generateRiskRules(): TestRiskRule[] {
  const now = toISODate(new Date());
  return [
    {
      id: generateUUID(),
      code: "SHORT_TIME_FREQUENT_BORROW",
      name: "Frequent Borrowing in Short Time",
      description: "Borrow count is too high within 24 hours.",
      weight: 30,
      enabled: true,
      thresholdConfig: { recent24hBorrowCount: 5 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateUUID(),
      code: "MULTIPLE_OVERDUE_HISTORY",
      name: "Multiple Overdue History",
      description: "The user has multiple overdue records.",
      weight: 25,
      enabled: true,
      thresholdConfig: { overdueCount: 3 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateUUID(),
      code: "TOO_MANY_ACTIVE_BORROWS",
      name: "Too Many Active Borrows",
      description: "The user has too many active borrow records.",
      weight: 20,
      enabled: true,
      thresholdConfig: { activeBorrowCount: 8 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateUUID(),
      code: "LONG_TERM_OVERDUE",
      name: "Long Term Overdue",
      description: "The user has overdue records longer than 30 days.",
      weight: 25,
      enabled: true,
      thresholdConfig: { maxOverdueDays: 30 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateUUID(),
      code: "UNRETURNED_OVERDUE_BOOK",
      name: "Unreturned Overdue Book",
      description: "The user still has overdue books that were not returned.",
      weight: 10,
      enabled: true,
      thresholdConfig: {},
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateUUID(),
      code: "NEW_ACCOUNT_HIGH_ACTIVITY",
      name: "New Account High Activity",
      description: "A newly registered account borrowed frequently in a short time.",
      weight: 10,
      enabled: true,
      thresholdConfig: { accountAgeDays: 14, recent7dBorrowCount: 4 },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ============================================================
// 数据生成器 - 书籍
// ============================================================

function toCoverFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function generateBooks(): TestBook[] {
  // 从 dummybooks.json 读取17本真实书籍
  const dummyBooksPath = path.resolve(__dirname, "../dummybooks.json");
  const booksData = JSON.parse(fs.readFileSync(dummyBooksPath, "utf-8"));

  // 验证书籍 title 唯一性
  const titles = booksData.map((b: any) => b.title);
  const uniqueTitles = new Set(titles);
  if (titles.length !== uniqueTitles.size) {
    console.error("❌ Duplicate book titles found!");
    process.exit(1);
  }

  const now = toISODate(new Date());
  return booksData.map((book: any) => ({
    id: generateUUID(),
    title: book.title,
    author: book.author,
    genre: book.genre,
    rating: book.rating,
    coverUrl: `/covers/${toCoverFilename(book.title)}.jpg`,
    coverColor: book.coverColor,
    description: book.description,
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    videoUrl: book.videoUrl || "/sample-video.mp4",
    summary: book.summary,
    createdAt: now,
  }));
}

// ============================================================
// 数据生成器 - 用户
// ============================================================

function generateUsers(): TestUser[] {
  const users: TestUser[] = [];
  const now = new Date();

  // 管理员用户 (2名)
  users.push({
    id: generateUUID(),
    fullName: "Risk Admin",
    email: "admin@library.local",
    universityId: 900001,
    password: "Admin123!",
    universityCard: "ADMIN-CARD-001",
    role: "ADMIN",
    status: "APPROVED",
    createdAt: toISODate(addDays(now, -180)),
  });
  users.push({
    id: generateUUID(),
    fullName: "System Admin",
    email: "sysadmin@library.local",
    universityId: 900002,
    password: "Admin123!",
    universityCard: "ADMIN-CARD-002",
    role: "ADMIN",
    status: "APPROVED",
    createdAt: toISODate(addDays(now, -200)),
  });

  // 低风险用户 (12名)
  for (let i = 1; i <= 12; i++) {
    const daysAgo = randomInt(60, 180);
    users.push({
      id: generateUUID(),
      fullName: `Low Risk User ${i}`,
      email: `low${i}@library.local`,
      universityId: 900100 + i,
      password: "Demo123!",
      universityCard: `LOW-CARD-${String(i).padStart(3, "0")}`,
      role: "USER",
      status: "APPROVED",
      createdAt: toISODate(addDays(now, -daysAgo)),
    });
  }

  // 中风险用户 (12名)
  for (let i = 1; i <= 12; i++) {
    const daysAgo = randomInt(30, 90);
    users.push({
      id: generateUUID(),
      fullName: `Medium Risk User ${i}`,
      email: `medium${i}@library.local`,
      universityId: 900200 + i,
      password: "Demo123!",
      universityCard: `MED-CARD-${String(i).padStart(3, "0")}`,
      role: "USER",
      status: "APPROVED",
      createdAt: toISODate(addDays(now, -daysAgo)),
    });
  }

  // 高风险用户 (8名)
  for (let i = 1; i <= 8; i++) {
    const daysAgo = randomInt(15, 60);
    users.push({
      id: generateUUID(),
      fullName: `High Risk User ${i}`,
      email: `high${i}@library.local`,
      universityId: 900300 + i,
      password: "Demo123!",
      universityCard: `HIGH-CARD-${String(i).padStart(3, "0")}`,
      role: "USER",
      status: "APPROVED",
      createdAt: toISODate(addDays(now, -daysAgo)),
    });
  }

  // 边界测试用户 (6名)
  const boundaryUsers = [
    { name: "Boundary 24h5Borrow", email: "boundary1@library.local", id: 900401 },
    { name: "Boundary 3Overdue", email: "boundary2@library.local", id: 900402 },
    { name: "Boundary 8Active", email: "boundary3@library.local", id: 900403 },
    { name: "Boundary 30DayOverdue", email: "boundary4@library.local", id: 900404 },
    { name: "Boundary NewAccount", email: "boundary5@library.local", id: 900405 },
    { name: "Boundary AllRules", email: "boundary6@library.local", id: 900406 },
  ];

  for (const bu of boundaryUsers) {
    users.push({
      id: generateUUID(),
      fullName: bu.name,
      email: bu.email,
      universityId: bu.id,
      password: "Demo123!",
      universityCard: `BOUNDARY-CARD-${bu.id}`,
      role: "USER",
      status: "APPROVED",
      createdAt: toISODate(addDays(now, -10)), // 新账号
    });
  }

  return users;
}

// ============================================================
// 数据生成器 - 借阅记录
// ============================================================

interface BorrowRecordConfig {
  totalBorrowCount: number;
  activeBorrowCount: number;
  overdueCount: number;
  maxOverdueDays: number;
  recent7dBorrowCount: number;
  recent24hBorrowCount: number;
  hasUnreturnedOverdueBooks: boolean;
}

function generateBorrowRecordsForUser(
  userId: string,
  bookIds: string[],
  config: BorrowRecordConfig,
  baseDate: Date
): TestBorrowRecord[] {
  const records: TestBorrowRecord[] = [];
  const now = new Date();

  let createdCount = 0;

  // 生成24小时内的借阅记录
  for (let i = 0; i < config.recent24hBorrowCount && createdCount < config.totalBorrowCount; i++) {
    const borrowDate = addDays(now, -randomInt(0, 1));
    const dueDate = addDays(borrowDate, 7);
    const isOverdue = i < config.overdueCount && config.hasUnreturnedOverdueBooks;
    const isReturned = !isOverdue && randomBool(0.3);

    records.push({
      id: generateUUID(),
      userId,
      bookId: randomPick(bookIds),
      borrowDate: toISODate(borrowDate),
      dueDate: toDateOnly(dueDate),
      returnDate: isReturned ? toDateOnly(addDays(dueDate, randomInt(1, 5))) : null,
      status: isReturned ? "RETURNED" : "BORROWED",
      createdAt: toISODate(borrowDate),
    });
    createdCount++;
  }

  // 生成7天内的借阅记录
  const remaining7d = config.recent7dBorrowCount - config.recent24hBorrowCount;
  for (let i = 0; i < remaining7d && createdCount < config.totalBorrowCount; i++) {
    const borrowDate = addDays(now, -randomInt(2, 7));
    const dueDate = addDays(borrowDate, 7);
    const isReturned = randomBool(0.5);

    records.push({
      id: generateUUID(),
      userId,
      bookId: randomPick(bookIds),
      borrowDate: toISODate(borrowDate),
      dueDate: toDateOnly(dueDate),
      returnDate: isReturned ? toDateOnly(addDays(dueDate, randomInt(0, 3))) : null,
      status: isReturned ? "RETURNED" : "BORROWED",
      createdAt: toISODate(borrowDate),
    });
    createdCount++;
  }

  // 生成剩余的借阅记录
  while (createdCount < config.totalBorrowCount) {
    const borrowDate = randomDate(90, now);
    const dueDate = addDays(borrowDate, 7);
    const daysOverdue = randomInt(0, config.maxOverdueDays);
    const isOverdueRecord = randomBool(0.3);
    const isReturned = randomBool(0.7);

    records.push({
      id: generateUUID(),
      userId,
      bookId: randomPick(bookIds),
      borrowDate: toISODate(borrowDate),
      dueDate: toDateOnly(dueDate),
      returnDate: isReturned ? toDateOnly(addDays(dueDate, isOverdueRecord ? daysOverdue : 0)) : null,
      status: isReturned ? "RETURNED" : "BORROWED",
      createdAt: toISODate(borrowDate),
    });
    createdCount++;
  }

  return records;
}

function generateAllBorrowRecords(users: TestUser[], books: TestBook[]): TestBorrowRecord[] {
  const bookIds = books.map((b) => b.id);
  const allRecords: TestBorrowRecord[] = [];
  const now = new Date();

  for (const user of users) {
    if (user.role === "ADMIN") continue;

    let config: BorrowRecordConfig;

    if (user.email.startsWith("low")) {
      config = {
        totalBorrowCount: randomInt(5, 15),
        activeBorrowCount: randomInt(1, 3),
        overdueCount: randomInt(0, 1),
        maxOverdueDays: randomInt(0, 5),
        recent7dBorrowCount: randomInt(0, 2),
        recent24hBorrowCount: randomInt(0, 1),
        hasUnreturnedOverdueBooks: false,
      };
    } else if (user.email.startsWith("medium")) {
      config = {
        totalBorrowCount: randomInt(15, 30),
        activeBorrowCount: randomInt(3, 6),
        overdueCount: randomInt(2, 4),
        maxOverdueDays: randomInt(10, 25),
        recent7dBorrowCount: randomInt(2, 5),
        recent24hBorrowCount: randomInt(1, 3),
        hasUnreturnedOverdueBooks: randomBool(0.5),
      };
    } else if (user.email.startsWith("high")) {
      config = {
        totalBorrowCount: randomInt(30, 50),
        activeBorrowCount: randomInt(7, 12),
        overdueCount: randomInt(4, 8),
        maxOverdueDays: randomInt(30, 60),
        recent7dBorrowCount: randomInt(5, 10),
        recent24hBorrowCount: randomInt(4, 8),
        hasUnreturnedOverdueBooks: true,
      };
    } else if (user.email.startsWith("boundary1")) {
      // 24小时内恰好5本
      config = {
        totalBorrowCount: 10,
        activeBorrowCount: 5,
        overdueCount: 0,
        maxOverdueDays: 0,
        recent7dBorrowCount: 5,
        recent24hBorrowCount: 5,
        hasUnreturnedOverdueBooks: false,
      };
    } else if (user.email.startsWith("boundary2")) {
      // 恰好逾期3次
      config = {
        totalBorrowCount: 15,
        activeBorrowCount: 3,
        overdueCount: 3,
        maxOverdueDays: 10,
        recent7dBorrowCount: 2,
        recent24hBorrowCount: 1,
        hasUnreturnedOverdueBooks: false,
      };
    } else if (user.email.startsWith("boundary3")) {
      // 恰好在借8本
      config = {
        totalBorrowCount: 20,
        activeBorrowCount: 8,
        overdueCount: 1,
        maxOverdueDays: 5,
        recent7dBorrowCount: 3,
        recent24hBorrowCount: 1,
        hasUnreturnedOverdueBooks: false,
      };
    } else if (user.email.startsWith("boundary4")) {
      // 最长逾期恰好30天
      config = {
        totalBorrowCount: 12,
        activeBorrowCount: 2,
        overdueCount: 2,
        maxOverdueDays: 30,
        recent7dBorrowCount: 1,
        recent24hBorrowCount: 0,
        hasUnreturnedOverdueBooks: true,
      };
    } else if (user.email.startsWith("boundary5")) {
      // 新账号14天内借4本
      config = {
        totalBorrowCount: 4,
        activeBorrowCount: 4,
        overdueCount: 0,
        maxOverdueDays: 0,
        recent7dBorrowCount: 4,
        recent24hBorrowCount: 2,
        hasUnreturnedOverdueBooks: false,
      };
    } else if (user.email.startsWith("boundary6")) {
      // 所有规则都触发
      config = {
        totalBorrowCount: 50,
        activeBorrowCount: 10,
        overdueCount: 5,
        maxOverdueDays: 45,
        recent7dBorrowCount: 8,
        recent24hBorrowCount: 6,
        hasUnreturnedOverdueBooks: true,
      };
    } else {
      continue;
    }

    const userRecords = generateBorrowRecordsForUser(user.id, bookIds, config, now);
    allRecords.push(...userRecords);
  }

  return allRecords;
}

// ============================================================
// 数据生成器 - 风险特征计算
// ============================================================

function calculateRiskFeaturesForUser(
  userId: string,
  records: TestBorrowRecord[],
  userCreatedAt: string,
  bookGenreMap: Map<string, string>
): RiskFeatures {
  const now = new Date();
  const userRecords = records.filter((r) => r.userId === userId);

  const recent7dBorrowCount = userRecords.filter((r) =>
    new Date(r.borrowDate) > addDays(now, -7)
  ).length;

  const recent24hBorrowCount = userRecords.filter((r) =>
    new Date(r.borrowDate) > addDays(now, -1)
  ).length;

  const activeBorrowCount = userRecords.filter((r) => r.status === "BORROWED").length;

  const genres = userRecords.map((r) => bookGenreMap.get(r.bookId) || "");
  const mostCommonGenre = genres.sort((a, b) =>
    genres.filter((g) => g === b).length - genres.filter((g) => g === a).length
  )[0] || "";

  const sameCategoryRecentBorrowCount = userRecords.filter((r) => {
    const genre = bookGenreMap.get(r.bookId);
    return genre === mostCommonGenre && new Date(r.borrowDate) > addDays(now, -30);
  }).length;

  let overdueCount = 0;
  let maxOverdueDays = 0;
  let totalReturnDelayDays = 0;
  let returnedCount = 0;
  let hasUnreturnedOverdueBooks = false;

  for (const record of userRecords) {
    const dueDate = new Date(record.dueDate);
    const effectiveReturn = record.returnDate ? new Date(record.returnDate) : now;
    const overdueDays = diffInDays(effectiveReturn, dueDate);

    if (overdueDays > 0) {
      overdueCount += 1;
      maxOverdueDays = Math.max(maxOverdueDays, overdueDays);
    }

    if (!record.returnDate && overdueDays > 0) {
      hasUnreturnedOverdueBooks = true;
    }

    if (record.returnDate) {
      totalReturnDelayDays += diffInDays(new Date(record.returnDate), dueDate);
      returnedCount += 1;
    }
  }

  const accountAgeDays = diffInDays(now, new Date(userCreatedAt));

  return {
    totalBorrowCount: userRecords.length,
    activeBorrowCount,
    overdueCount,
    maxOverdueDays,
    recent7dBorrowCount,
    recent24hBorrowCount,
    sameCategoryRecentBorrowCount,
    avgReturnDelayDays: returnedCount > 0 ? parseFloat((totalReturnDelayDays / returnedCount).toFixed(2)) : 0,
    hasUnreturnedOverdueBooks,
    accountAgeDays,
  };
}

// ============================================================
// 数据生成器 - 风险事件
// ============================================================

function generateRiskEvents(
  users: TestUser[],
  records: TestBorrowRecord[],
  books: TestBook[]
): TestRiskEvent[] {
  const events: TestRiskEvent[] = [];
  const bookGenreMap = new Map(books.map((b) => [b.id, b.genre]));
  const bookMap = new Map(books.map((b) => [b.id, b]));

  for (const user of users) {
    if (user.role === "ADMIN") continue;

    const userRecords = records.filter((r) => r.userId === user.id);
    if (userRecords.length === 0) continue;

    const features = calculateRiskFeaturesForUser(user.id, records, user.createdAt, bookGenreMap);
    const risk = calculateRiskScore(features);

    // 为每个用户生成1-3个风险事件
    const eventCount = Math.min(userRecords.length, randomInt(1, 3));
    const selectedRecords = userRecords.slice(0, eventCount);

    for (const record of selectedRecords) {
      const book = bookMap.get(record.bookId);
      events.push({
        id: generateUUID(),
        borrowRecordId: record.id,
        userId: user.id,
        bookId: record.bookId,
        eventType: "BORROW",
        riskScore: risk.score,
        riskLevel: risk.level,
        featureSnapshot: features,
        reasonCodes: risk.reasons,
        aiExplanation: risk.explanation,
        decision: risk.decision,
        createdAt: record.borrowDate,
      });
    }
  }

  return events;
}

// ============================================================
// 数据生成器 - 风险画像
// ============================================================

function generateRiskProfiles(
  users: TestUser[],
  records: TestBorrowRecord[],
  books: TestBook[]
): TestRiskProfile[] {
  const profiles: TestRiskProfile[] = [];
  const bookGenreMap = new Map(books.map((b) => [b.id, b.genre]));
  const now = new Date();

  for (const user of users) {
    if (user.role === "ADMIN") continue;

    const features = calculateRiskFeaturesForUser(user.id, records, user.createdAt, bookGenreMap);
    const risk = calculateRiskScore(features);

    const abnormalEventCount = risk.level === "LOW" ? 0 : randomInt(1, 5);

    profiles.push({
      id: generateUUID(),
      userId: user.id,
      currentScore: risk.score,
      currentLevel: risk.level,
      totalBorrowCount: features.totalBorrowCount,
      activeBorrowCount: features.activeBorrowCount,
      overdueCount: features.overdueCount,
      maxOverdueDays: features.maxOverdueDays,
      recent7dBorrowCount: features.recent7dBorrowCount,
      recent24hBorrowCount: features.recent24hBorrowCount,
      abnormalEventCount,
      lastEvaluatedAt: toISODate(now),
      updatedAt: toISODate(now),
    });
  }

  return profiles;
}

// ============================================================
// 数据生成器 - NLQ日志
// ============================================================

function generateNLQLogs(users: TestUser[]): TestNLQLog[] {
  const logs: TestNLQLog[] = [];
  const adminUsers = users.filter((u) => u.role === "ADMIN");
  const now = new Date();

  const nlqTemplates = [
    {
      query: "查询高风险用户",
      intent: "HIGH_RISK_USERS",
      filters: { riskLevel: "HIGH" },
      summary: "SELECT * FROM user_risk_profiles WHERE current_level = 'HIGH'",
      resultCount: randomInt(3, 8),
    },
    {
      query: "查询最近7天异常借书事件",
      intent: "RECENT_ABNORMAL_EVENTS",
      filters: { days: 7, eventType: "BORROW" },
      summary: "SELECT * FROM borrow_risk_events WHERE created_at > NOW() - INTERVAL '7 days'",
      resultCount: randomInt(5, 20),
    },
    {
      query: "查询24小时内借书超过5次的用户",
      intent: "FREQUENT_BORROW_24H",
      filters: { threshold: 5, timeWindow: "24h" },
      summary: "SELECT * FROM user_risk_profiles WHERE recent_24h_borrow_count > 5",
      resultCount: randomInt(2, 6),
    },
    {
      query: "查询逾期超过30天的用户",
      intent: "LONG_OVERDUE_USERS",
      filters: { days: 30 },
      summary: "SELECT * FROM user_risk_profiles WHERE max_overdue_days > 30",
      resultCount: randomInt(1, 5),
    },
    {
      query: "查询当前未归还图书超过8本的用户",
      intent: "MANY_ACTIVE_BORROWS",
      filters: { threshold: 8 },
      summary: "SELECT * FROM user_risk_profiles WHERE active_borrow_count > 8",
      resultCount: randomInt(2, 7),
    },
    {
      query: "查询中风险用户列表",
      intent: "MEDIUM_RISK_USERS",
      filters: { riskLevel: "MEDIUM" },
      summary: "SELECT * FROM user_risk_profiles WHERE current_level = 'MEDIUM'",
      resultCount: randomInt(5, 15),
    },
    {
      query: "查询最近30天借阅频率最高的用户",
      intent: "TOP_BORROWERS_30D",
      filters: { days: 30, orderBy: "borrow_count", limit: 10 },
      summary: "SELECT * FROM user_risk_profiles ORDER BY recent_7d_borrow_count DESC LIMIT 10",
      resultCount: 10,
    },
    {
      query: "查询有未归还逾期书籍的用户",
      intent: "UNRETURNED_OVERDUE",
      filters: { hasUnreturnedOverdue: true },
      summary: "SELECT * FROM user_risk_profiles WHERE abnormal_event_count > 0",
      resultCount: randomInt(3, 10),
    },
    {
      query: "查询本周新增的风险事件",
      intent: "WEEKLY_RISK_EVENTS",
      filters: { timeWindow: "week" },
      summary: "SELECT * FROM borrow_risk_events WHERE created_at > NOW() - INTERVAL '7 days'",
      resultCount: randomInt(10, 30),
    },
    {
      query: "查询借阅次数最多的书籍",
      intent: "MOST_BORROWED_BOOKS",
      filters: { orderBy: "borrow_count", limit: 5 },
      summary: "SELECT book_id, COUNT(*) as borrow_count FROM borrow_records GROUP BY book_id ORDER BY borrow_count DESC LIMIT 5",
      resultCount: 5,
    },
  ];

  for (let i = 0; i < 100; i++) {
    const template = nlqTemplates[i % nlqTemplates.length];
    const adminUser = randomPick(adminUsers);

    logs.push({
      id: generateUUID(),
      userId: adminUser.id,
      queryText: template.query,
      parsedIntent: template.intent,
      parsedFilters: template.filters,
      generatedQuerySummary: template.summary,
      resultCount: template.resultCount + randomInt(-2, 2),
      createdAt: toISODate(randomDate(30, now)),
    });
  }

  return logs;
}

// ============================================================
// 数据验证
// ============================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateData(
  users: TestUser[],
  books: TestBook[],
  records: TestBorrowRecord[],
  events: TestRiskEvent[],
  profiles: TestRiskProfile[],
  rules: TestRiskRule[],
  logs: TestNLQLog[]
): ValidationResult {
  const errors: string[] = [];

  // 检查用户唯一性
  const emails = users.map((u) => u.email);
  const duplicateEmails = emails.filter((e, i) => emails.indexOf(e) !== i);
  if (duplicateEmails.length > 0) {
    errors.push(`Duplicate emails found: ${duplicateEmails.join(", ")}`);
  }

  const uniIds = users.map((u) => u.universityId);
  const duplicateUniIds = uniIds.filter((id, i) => uniIds.indexOf(id) !== i);
  if (duplicateUniIds.length > 0) {
    errors.push(`Duplicate university IDs found: ${duplicateUniIds.join(", ")}`);
  }

  // 检查外键完整性
  const userIds = new Set(users.map((u) => u.id));
  const bookIds = new Set(books.map((b) => b.id));
  const recordIds = new Set(records.map((r) => r.id));

  for (const record of records) {
    if (!userIds.has(record.userId)) {
      errors.push(`Borrow record ${record.id} references non-existent user ${record.userId}`);
    }
    if (!bookIds.has(record.bookId)) {
      errors.push(`Borrow record ${record.id} references non-existent book ${record.bookId}`);
    }
  }

  for (const event of events) {
    if (!userIds.has(event.userId)) {
      errors.push(`Risk event ${event.id} references non-existent user ${event.userId}`);
    }
    if (!bookIds.has(event.bookId)) {
      errors.push(`Risk event ${event.id} references non-existent book ${event.bookId}`);
    }
    if (!recordIds.has(event.borrowRecordId)) {
      errors.push(`Risk event ${event.id} references non-existent borrow record ${event.borrowRecordId}`);
    }
  }

  for (const profile of profiles) {
    if (!userIds.has(profile.userId)) {
      errors.push(`Risk profile ${profile.id} references non-existent user ${profile.userId}`);
    }
  }

  for (const log of logs) {
    if (!userIds.has(log.userId)) {
      errors.push(`NLQ log ${log.id} references non-existent user ${log.userId}`);
    }
  }

  // 检查风险评分一致性
  for (const profile of profiles) {
    const expectedLevel: RiskLevel = profile.currentScore >= 80 ? "HIGH" : profile.currentScore >= 50 ? "MEDIUM" : "LOW";
    if (profile.currentLevel !== expectedLevel) {
      errors.push(`Profile ${profile.id} has inconsistent risk level: score=${profile.currentScore}, level=${profile.currentLevel}, expected=${expectedLevel}`);
    }
  }

  // 检查时间序列合理性
  for (const record of records) {
    const borrowDate = new Date(record.borrowDate);
    const dueDate = new Date(record.dueDate);
    if (borrowDate >= dueDate) {
      errors.push(`Borrow record ${record.id} has borrowDate >= dueDate`);
    }
    if (record.returnDate) {
      const returnDate = new Date(record.returnDate);
      if (returnDate < borrowDate) {
        errors.push(`Borrow record ${record.id} has returnDate < borrowDate`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// 文件输出
// ============================================================

function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJSON(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ✓ Written: ${filePath} (${Array.isArray(data) ? data.length : 1} records)`);
}

function generateREADME(outputDir: string, stats: Record<string, number>): void {
  const content = `# Test Data for TP + AP + AI Library System

## Overview

This directory contains generated test data for the library risk intelligence system.

## Files

| File | Description | Records |
|------|-------------|---------|
| \`users.json\` | User accounts (admins + demo users) | ${stats.users} |
| \`books.json\` | Book catalog | ${stats.books} |
| \`borrow-records.json\` | Borrow/return records | ${stats.borrowRecords} |
| \`risk-events.json\` | Risk evaluation events | ${stats.riskEvents} |
| \`risk-profiles.json\` | User risk profiles | ${stats.riskProfiles} |
| \`risk-rules.json\` | Risk evaluation rules | ${stats.riskRules} |
| \`nlq-logs.json\` | Natural language query logs | ${stats.nlqLogs} |

## User Accounts

### Admin Users
| Email | Password | Role |
|-------|----------|------|
| admin@library.local | Admin123! | ADMIN |
| sysadmin@library.local | Admin123! | ADMIN |

### Low Risk Users (12)
| Email | Password | Risk Level |
|-------|----------|------------|
| low1@library.local ~ low12@library.local | Demo123! | LOW |

### Medium Risk Users (12)
| Email | Password | Risk Level |
|-------|----------|------------|
| medium1@library.local ~ medium12@library.local | Demo123! | MEDIUM |

### High Risk Users (8)
| Email | Password | Risk Level |
|-------|----------|------------|
| high1@library.local ~ high8@library.local | Demo123! | HIGH |

### Boundary Test Users (6)
| Email | Password | Test Scenario |
|-------|----------|---------------|
| boundary1@library.local | Demo123! | 24h内恰好借5本 (SHORT_TIME_FREQUENT_BORROW) |
| boundary2@library.local | Demo123! | 恰好逾期3次 (MULTIPLE_OVERDUE_HISTORY) |
| boundary3@library.local | Demo123! | 恰好在借8本 (TOO_MANY_ACTIVE_BORROWS) |
| boundary4@library.local | Demo123! | 最长逾期恰好30天 (LONG_TERM_OVERDUE) |
| boundary5@library.local | Demo123! | 新账号14天内借4本 (NEW_ACCOUNT_HIGH_ACTIVITY) |
| boundary6@library.local | Demo123! | 所有规则都触发 (ALL_RULES) |

## Risk Rules

| Code | Name | Weight | Threshold |
|------|------|--------|-----------|
| SHORT_TIME_FREQUENT_BORROW | Frequent Borrowing in Short Time | 30 | recent24hBorrowCount >= 5 |
| MULTIPLE_OVERDUE_HISTORY | Multiple Overdue History | 25 | overdueCount >= 3 |
| TOO_MANY_ACTIVE_BORROWS | Too Many Active Borrows | 20 | activeBorrowCount >= 8 |
| LONG_TERM_OVERDUE | Long Term Overdue | 25 | maxOverdueDays >= 30 |
| UNRETURNED_OVERDUE_BOOK | Unreturned Overdue Book | 10 | hasUnreturnedOverdueBooks |
| NEW_ACCOUNT_HIGH_ACTIVITY | New Account High Activity | 10 | accountAgeDays <= 14 && recent7dBorrowCount >= 4 |

## Risk Score Calculation

- **LOW**: score < 50
- **MEDIUM**: 50 <= score < 80
- **HIGH**: score >= 80

## Data Generation

This data was generated by \`scripts/generate-test-data.ts\`.

\`\`\`bash
npx tsx scripts/generate-test-data.ts
\`\`\`

## Notes

- All passwords are stored in plaintext for testing purposes
- UUIDs are generated sequentially for consistency
- Dates are within the last 90 days
- Risk scores are calculated using the same rules as the production system
`;

  fs.writeFileSync(path.join(outputDir, "README.md"), content, "utf-8");
  console.log(`  ✓ Written: README.md`);
}

// ============================================================
// 主入口
// ============================================================

function main(): void {
  console.log("=".repeat(60));
  console.log("Test Data Generator for TP + AP + AI Library System");
  console.log("=".repeat(60));
  console.log("");

  const outputDir = path.resolve(__dirname, "../test-data");
  ensureDirectory(outputDir);

  console.log("[1/8] Generating risk rules...");
  const rules = generateRiskRules();

  console.log("[2/8] Generating books...");
  const books = generateBooks();

  console.log("[3/8] Generating users...");
  const users = generateUsers();

  console.log("[4/8] Generating borrow records...");
  const records = generateAllBorrowRecords(users, books);

  console.log("[5/8] Generating risk events...");
  const events = generateRiskEvents(users, records, books);

  console.log("[6/8] Generating risk profiles...");
  const profiles = generateRiskProfiles(users, records, books);

  console.log("[7/8] Generating NLQ logs...");
  const logs = generateNLQLogs(users);

  console.log("[8/8] Validating data...");
  const validation = validateData(users, books, records, events, profiles, rules, logs);

  if (!validation.valid) {
    console.error("\n❌ Validation failed:");
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log("\n✅ Validation passed!");
  console.log("\nWriting output files...");

  writeJSON(path.join(outputDir, "risk-rules.json"), rules);
  writeJSON(path.join(outputDir, "books.json"), books);
  writeJSON(path.join(outputDir, "users.json"), users);
  writeJSON(path.join(outputDir, "borrow-records.json"), records);
  writeJSON(path.join(outputDir, "risk-events.json"), events);
  writeJSON(path.join(outputDir, "risk-profiles.json"), profiles);
  writeJSON(path.join(outputDir, "nlq-logs.json"), logs);

  const stats = {
    users: users.length,
    books: books.length,
    borrowRecords: records.length,
    riskEvents: events.length,
    riskProfiles: profiles.length,
    riskRules: rules.length,
    nlqLogs: logs.length,
  };

  generateREADME(outputDir, stats);

  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log("=".repeat(60));
  console.log(`  Users:          ${stats.users}`);
  console.log(`  Books:          ${stats.books}`);
  console.log(`  Borrow Records: ${stats.borrowRecords}`);
  console.log(`  Risk Events:    ${stats.riskEvents}`);
  console.log(`  Risk Profiles:  ${stats.riskProfiles}`);
  console.log(`  Risk Rules:     ${stats.riskRules}`);
  console.log(`  NLQ Logs:       ${stats.nlqLogs}`);
  console.log("=".repeat(60));
  console.log(`\nOutput directory: ${outputDir}`);
  console.log("\n✅ Done!");
}

main();
