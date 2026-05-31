interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  genre: string;
  rating: number;
  totalCopies: number;
  availableCopies: number;
  description: string;
  coverColor: string;
  coverUrl: string;
  videoUrl: string;
  summary: string;
  createdAt: Date | null;
  isLoanedBook?: boolean;
  dueDate?: string | Date | null;
  borrowDate?: string | Date | null;
  borrowStatus?: string;
  riskLevel?: RiskLevel | null;
  riskScore?: number | null;
  bookId?: string;
}

interface AuthCredentials {
  fullName: string;
  email: string;
  password: string;
  universityId: number;
  universityCard: string;
  role: "USER" | "ADMIN";
}

interface BookParams {
  title: string;
  author: string;
  isbn?: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  totalCopies: number;
  videoUrl: string;
  summary: string;
}

interface BorrowBookParams {
  bookId: string;
  userId: string;
}

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type RiskDecision = "ALLOW" | "REVIEW" | "BLOCK";
type RiskEventType = "BORROW" | "RENEW" | "RETURN";
type ControlStatus = "NORMAL" | "WATCH" | "REVIEW" | "BLOCKED";
type LlmProvider = "DOUBAO" | "QWEN";
type LlmScope = "USER" | "ADMIN";
