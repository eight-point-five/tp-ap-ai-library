import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Session } from "next-auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

const Header = async ({ session }: { session: Session }) => {
  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <header className="my-10 flex flex-wrap items-center justify-between gap-5">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
        <span className="text-2xl font-semibold text-white">BookWise</span>
      </Link>

      <ul className="flex flex-row items-center gap-5 text-light-100">
        <li>
          <Link href="/" className="font-medium hover:text-primary">
            Home
          </Link>
        </li>
        <li>
          <Link href="/my-profile" className="font-medium hover:text-primary">
            My Profile
          </Link>
        </li>
        {isAdmin ? (
          <li>
            <Link
              href="/admin/risk-dashboard"
              className="font-medium text-primary hover:text-light-200"
            >
              Risk Dashboard
            </Link>
          </li>
        ) : null}
        <li>
          <form
            action={async () => {
              "use server";

              await signOut();
            }}
          >
            <Button>Logout</Button>
          </form>
        </li>
      </ul>
    </header>
  );
};

export default Header;
