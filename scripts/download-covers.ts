import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ============================================================
// 配置
// ============================================================

const COVERS_DIR = path.resolve(__dirname, "../public/covers");

// 从 dummybooks.json 读取18本书的封面URL
function getDummyBooksCovers(): Array<{ title: string; url: string; filename: string }> {
  const dummyBooksPath = path.resolve(__dirname, "../dummybooks.json");
  const books = JSON.parse(fs.readFileSync(dummyBooksPath, "utf-8"));

  return books.map((book: any) => {
    // 清理文件名：转换为 kebab-case，去掉特殊字符
    const filename = book.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);

    return {
      title: book.title,
      url: book.coverUrl,
      filename: `${filename}.jpg`,
    };
  });
}

// 12本补充书籍（Open Library）
function getExtraBooksCovers(): Array<{ title: string; url: string; filename: string }> {
  return [
    { title: "Clean Code", url: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg", filename: "clean-code.jpg" },
    { title: "The Pragmatic Programmer", url: "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg", filename: "pragmatic-programmer.jpg" },
    { title: "Design Patterns", url: "https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg", filename: "design-patterns.jpg" },
    { title: "Refactoring", url: "https://covers.openlibrary.org/b/isbn/9780134757599-L.jpg", filename: "refactoring.jpg" },
    { title: "Introduction to Algorithms", url: "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg", filename: "intro-algorithms.jpg" },
    { title: "Computer Networking", url: "https://covers.openlibrary.org/b/isbn/9780133594140-L.jpg", filename: "computer-networking.jpg" },
    { title: "Artificial Intelligence", url: "https://covers.openlibrary.org/b/isbn/9780134610993-L.jpg", filename: "ai-modern-approach.jpg" },
    { title: "Machine Learning", url: "https://covers.openlibrary.org/b/isbn/9780070428072-L.jpg", filename: "machine-learning.jpg" },
    { title: "Deep Learning", url: "https://covers.openlibrary.org/b/isbn/9780262035613-L.jpg", filename: "deep-learning.jpg" },
    { title: "Database Internals", url: "https://covers.openlibrary.org/b/isbn/9781492040347-L.jpg", filename: "database-internals.jpg" },
    { title: "Redis in Action", url: "https://covers.openlibrary.org/b/isbn/9781617290855-L.jpg", filename: "redis-in-action.jpg" },
    { title: "High Performance MySQL", url: "https://covers.openlibrary.org/b/isbn/9781449314286-L.jpg", filename: "high-performance-mysql.jpg" },
  ];
}

// ============================================================
// 下载函数
// ============================================================

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl, destPath).then(resolve);
            return;
          }
        }

        if (response.statusCode !== 200) {
          console.log(`    ❌ HTTP ${response.statusCode}`);
          resolve(false);
          return;
        }

        const contentType = response.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
          console.log(`    ❌ Not an image: ${contentType}`);
          resolve(false);
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const buffer = Buffer.concat(chunks);
          fs.writeFileSync(destPath, buffer);
          console.log(`    ✅ Downloaded (${(buffer.length / 1024).toFixed(1)} KB)`);
          resolve(true);
        });
        response.on("error", (err) => {
          console.log(`    ❌ Error: ${err.message}`);
          resolve(false);
        });
      })
      .on("error", (err) => {
        console.log(`    ❌ Error: ${err.message}`);
        resolve(false);
      });
  });
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  console.log("=".repeat(60));
  console.log("Downloading Book Covers");
  console.log("=".repeat(60));
  console.log("");
  console.log(`Target directory: ${COVERS_DIR}`);
  console.log("");

  // 创建目录
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
    console.log("Created directory: public/covers");
  }

  const dummyCovers = getDummyBooksCovers();
  const extraCovers = getExtraBooksCovers();
  const allCovers = [...dummyCovers, ...extraCovers];

  let successCount = 0;
  let failCount = 0;

  console.log(`Downloading ${allCovers.length} covers...`);
  console.log("");

  for (let i = 0; i < allCovers.length; i++) {
    const cover = allCovers[i];
    const destPath = path.join(COVERS_DIR, cover.filename);

    console.log(`[${i + 1}/${allCovers.length}] ${cover.filename}`);
    console.log(`    Source: ${cover.url}`);

    // 如果文件已存在，跳过
    if (fs.existsSync(destPath)) {
      console.log(`    ⏭️ Already exists, skipping`);
      successCount++;
      continue;
    }

    const success = await downloadFile(cover.url, destPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Download Complete");
  console.log("=".repeat(60));
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed:  ${failCount}`);
  console.log(`  Total:   ${allCovers.length}`);
  console.log("=".repeat(60));

  if (failCount > 0) {
    console.log("");
    console.log("⚠️ Some covers failed to download.");
    console.log("The system will still work, those books will have no cover image.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
