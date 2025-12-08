// Prisma Client 인스턴스 생성
// 환경 변수 로드 (Prisma Client 생성 전에 반드시 필요)
import "./env-loader.js";

// 환경 변수를 process.env에 설정 (Prisma 스키마가 읽을 수 있도록)
let databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ POSTGRES_URL 또는 DATABASE_URL 환경 변수가 필요합니다.");
  console.error("   현재 환경 변수:", {
    POSTGRES_URL: process.env.POSTGRES_URL ? "설정됨" : "없음",
    DATABASE_URL: process.env.DATABASE_URL ? "설정됨" : "없음",
  });
  throw new Error(
    "POSTGRES_URL 또는 DATABASE_URL 환경 변수가 필요합니다. .env.local 파일을 확인하세요."
  );
}

// Prisma 스키마가 환경 변수를 읽을 수 있도록 설정
// Prisma는 스키마 파일을 파싱할 때 env("POSTGRES_URL")을 평가하므로
// 반드시 process.env.POSTGRES_URL이 설정되어 있어야 합니다.
if (!process.env.POSTGRES_URL && databaseUrl) {
  process.env.POSTGRES_URL = databaseUrl;
  console.log("✅ process.env.POSTGRES_URL 설정 완료");
}

// 이제 Prisma Client import (환경 변수가 설정된 후)
import { PrismaClient } from "@prisma/client";

// 서버리스 환경에서 Prisma Client 재사용을 위한 싱글톤 패턴
const globalForPrisma = globalThis;

// Prisma Client 생성 시 datasources를 명시적으로 설정
// 이렇게 하면 스키마 파일의 env() 참조와 무관하게 동작합니다.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
