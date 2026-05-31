import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import dummyBooks from "../dummybooks.json";

config({ path: ".env.local" });

async function seed() {
  console.log("Seeding local books...");

  for (const book of dummyBooks) {
    const existing = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.title, book.title))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    await db.insert(books).values({
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
    });
  }

  console.log(`Seeded ${dummyBooks.length} books.`);
}

seed().catch((error) => {
  console.error("Error seeding books:", error);
  process.exit(1);
});
