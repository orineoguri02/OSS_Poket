// 환경 변수 로더 (Prisma가 스키마를 읽기 전에 실행되어야 함)
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 경로 (우선순위: .env.local > .env)
const envLocalPath = resolve(__dirname, "../.env.local");
const envPath = resolve(__dirname, "../.env");

// .env.local 파일이 있으면 우선 로드
let loaded = false;
if (fs.existsSync(envLocalPath)) {
  console.log("📁 .env.local 파일 발견, 로드 중...");
  const result = config({ path: envLocalPath, override: true });
  if (result.error) {
    console.warn("⚠️ .env.local 파일 로드 실패:", result.error.message);
  } else if (result.parsed) {
    console.log(
      "✅ .env.local에서 환경 변수 로드 성공:",
      Object.keys(result.parsed).length,
      "개"
    );
    loaded = true;
  }
}

// .env.local이 없고 .env 파일이 있으면 로드
if (!loaded && fs.existsSync(envPath)) {
  console.log("📁 .env 파일 발견, 로드 중...");
  const result = config({ path: envPath, override: true });
  if (result.error) {
    console.warn("⚠️ .env 파일 로드 실패:", result.error.message);
  } else if (result.parsed) {
    console.log(
      "✅ .env에서 환경 변수 로드 성공:",
      Object.keys(result.parsed).length,
      "개"
    );
    loaded = true;
  }
}

if (!loaded) {
  console.warn("⚠️ .env.local 또는 .env 파일을 찾을 수 없습니다.");
  console.warn("   찾은 경로:", { envLocalPath, envPath });
}

// 환경 변수 확인
if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.error("❌ POSTGRES_URL 또는 DATABASE_URL 환경 변수가 필요합니다.");
  console.error("   .env.local 파일 경로:", envLocalPath);
  console.error("   .env.local 파일 존재 여부:", fs.existsSync(envLocalPath));
  console.error("   .env 파일 경로:", envPath);
  console.error("   .env 파일 존재 여부:", fs.existsSync(envPath));

  if (fs.existsSync(envLocalPath)) {
    try {
      const content = fs.readFileSync(envLocalPath, "utf-8");
      const hasPostgresUrl = content.includes("POSTGRES_URL");
      console.error("   .env.local에 POSTGRES_URL 포함 여부:", hasPostgresUrl);
      if (hasPostgresUrl) {
        // 파일에는 있지만 로드되지 않음
        console.error("   ⚠️ 파일에는 있지만 환경 변수로 로드되지 않았습니다.");
        console.error(
          "   파일 내용 일부:",
          content.split("\n").slice(0, 3).join("\n")
        );
      }
    } catch (e) {
      console.error("   파일 읽기 실패:", e.message);
    }
  }
} else {
  console.log("✅ 데이터베이스 URL 확인됨");
  console.log("   POSTGRES_URL:", process.env.POSTGRES_URL ? "설정됨" : "없음");
  console.log("   DATABASE_URL:", process.env.DATABASE_URL ? "설정됨" : "없음");

  // 실제 값의 일부만 표시 (보안)
  if (process.env.POSTGRES_URL) {
    const url = process.env.POSTGRES_URL;
    const masked =
      url.substring(0, 20) + "..." + url.substring(url.length - 10);
    console.log("   POSTGRES_URL 값:", masked);
  }
}
