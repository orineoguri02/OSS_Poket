// 데이터베이스 초기화 API 엔드포인트
// GET 또는 POST 요청으로 실행
// Prisma를 사용하므로 prisma db push를 사용하는 것이 권장됩니다
// 환경 변수 로드 (vercel dev에서 필요)
import "../../lib/env-loader.js";
import prisma from "../../lib/prisma.js";

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "지원하지 않는 메서드입니다." });
  }

  try {
    // Prisma를 사용하는 경우, 스키마를 데이터베이스에 푸시
    // 이 API는 호환성을 위해 유지하지만, prisma db push를 사용하는 것이 권장됩니다

    // 간단한 연결 테스트
    await prisma.$connect();

    // 테이블이 존재하는지 확인 (간단한 쿼리로)
    await prisma.user.findFirst();
    await prisma.userPokemon.findFirst();

    return res.status(200).json({
      success: true,
      message:
        "데이터베이스 연결이 확인되었습니다. Prisma 스키마를 적용하려면 'npx prisma db push'를 실행하세요.",
      note: "Prisma를 사용하는 경우, 스키마 변경은 'prisma db push' 또는 'prisma migrate dev'를 사용하세요.",
    });
  } catch (error) {
    console.error("데이터베이스 초기화 실패:", error);
    return res.status(500).json({
      error: "데이터베이스 초기화에 실패했습니다.",
      details: error.message,
    });
  }
}
