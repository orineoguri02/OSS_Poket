// 데이터베이스 초기화 API 엔드포인트
// GET 또는 POST 요청으로 실행
import { sql } from "@vercel/postgres";

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
    // 사용자 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 사용자별 포켓몬 저장 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS user_pokemon (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        pokemon_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, pokemon_id)
      );
    `;

    // 인덱스 생성
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_pokemon_user_id ON user_pokemon(user_id);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_pokemon_pokemon_id ON user_pokemon(pokemon_id);
    `;

    return res.status(200).json({
      success: true,
      message: "데이터베이스 초기화가 완료되었습니다.",
    });
  } catch (error) {
    console.error("데이터베이스 초기화 실패:", error);
    return res.status(500).json({
      error: "데이터베이스 초기화에 실패했습니다.",
      details: error.message,
    });
  }
}
