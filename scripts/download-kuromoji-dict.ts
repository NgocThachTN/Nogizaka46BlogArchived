/**
 * Script để tải kuromoji dictionary files về public/dict/
 * Chạy: node scripts/download-kuromoji-dict.js
 *
 * Note: Tải file .dat.gz (GIỮ NGUYÊN compressed) vì kuromoji
 * tự động giải nén trong browser
 */

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICT_CDN = "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/";
const DICT_FILES = [
  "base.dat.gz",
  "cc.dat.gz",
  "check.dat.gz",
  "tid_map.dat.gz",
  "tid_pos.dat.gz",
  "tid.dat.gz",
  "unk_char.dat.gz",
  "unk_compat.dat.gz",
  "unk_invoke.dat.gz",
  "unk_map.dat.gz",
  "unk_pos.dat.gz",
  "unk.dat.gz",
];

const OUTPUT_DIR = path.join(__dirname, "..", "public", "dict");

// Tạo thư mục nếu chưa có
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✓ Created directory: ${OUTPUT_DIR}`);
}

/**
 * Download file từ URL (GIỮ NGUYÊN .gz format)
 */
function downloadFile(url, outputPath) {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        } else {
          reject(
            new Error(`Failed to download ${url}: ${response.statusCode}`)
          );
        }
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
  });
}

/**
 * Download tất cả dictionary files (GIỮ NGUYÊN .gz format)
 */
async function downloadAllDictFiles() {
  console.log("📥 Downloading kuromoji dictionary files (.gz format)...\n");

  let successCount = 0;
  let failCount = 0;

  for (const fileName of DICT_FILES) {
    const url = DICT_CDN + fileName;
    // GIỮ NGUYÊN .gz extension
    const outputPath = path.join(OUTPUT_DIR, fileName);

    try {
      // Skip nếu file đã tồn tại
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`⏭️  Skipped (exists): ${fileName} (${sizeKB} KB)`);
        successCount++;
        continue;
      }

      await downloadFile(url, outputPath);
      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✓ Downloaded: ${fileName} (${sizeKB} KB)`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed: ${fileName} - ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✓ Success: ${successCount}/${DICT_FILES.length}`);
  console.log(`   ✗ Failed:  ${failCount}/${DICT_FILES.length}`);

  if (failCount === 0) {
    console.log("\n✅ All dictionary files downloaded successfully!");
    console.log(`📁 Location: ${OUTPUT_DIR}`);
    console.log(
      `\n💡 Files are kept in .gz format - kuromoji will decompress them in the browser.`
    );
  } else {
    console.log("\n⚠️  Some files failed to download. Please retry.");
    process.exit(1);
  }
}

// Run
downloadAllDictFiles().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

