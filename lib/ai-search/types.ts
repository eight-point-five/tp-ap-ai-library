export type BookSearchInput = {
  scope: LlmScope;
  provider?: LlmProvider;
  title?: string;
  author?: string;
  isbn?: string;
  description?: string;
  imageBase64?: string;
  imageMimeType?: string;
  limit?: number;
};

export type BookSearchResultItem = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  genre: string;
  description: string;
  summary: string;
  coverUrl: string;
  coverColor: string;
  availableCopies: number;
  rating: number;
  score: number;
  matchReason: string;
};

export type LlmConfigSummary = {
  id: string;
  scope: LlmScope;
  provider: LlmProvider;
  model: string;
  apiBaseUrl: string;
  enabled: boolean;
  supportsVision: boolean;
  systemPrompt: string | null;
  hasApiKey: boolean;
  updatedAt: Date | null;
};
