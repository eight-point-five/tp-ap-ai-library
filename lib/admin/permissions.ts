const DEFAULT_INITIAL_ADMIN_EMAILS = "admin@library.local,sysadmin@library.local";

export const initialAdminEmails = (
  process.env.INITIAL_ADMIN_EMAILS || DEFAULT_INITIAL_ADMIN_EMAILS
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isInitialAdminEmail = (email?: string | null) =>
  !!email && initialAdminEmails.includes(email.toLowerCase());
