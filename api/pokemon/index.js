// GET: 사용자의 포켓몬 목록 조회
// POST: 포켓몬 추가
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

  // 쿼리 파라미터 가져오기 (Vercel 서버리스 함수는 req.query를 지원)
  const userId =
    req.query?.userId ||
    (() => {
      try {
        const url = new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );
        return url.searchParams.get("userId");
      } catch {
        return null;
      }
    })();

  if (!userId) {
    return res.status(400).json({ error: "userId가 필요합니다." });
  }

  try {
    if (req.method === "GET") {
      // 사용자의 포켓몬 목록 조회
      const result = await sql`
        SELECT 
          up.pokemon_id,
          up.added_at
        FROM user_pokemon up
        WHERE up.user_id = ${userId}
        ORDER BY up.added_at DESC
      `;

      return res.status(200).json({ pokemon: result.rows });
    }

    if (req.method === "POST") {
      const { pokemonId } = req.body;

      if (!pokemonId || typeof pokemonId !== "number") {
        return res
          .status(400)
          .json({ error: "유효한 pokemonId가 필요합니다." });
      }

      // 사용자 정보가 없으면 먼저 생성
      const userCheck = await sql`
        SELECT user_id FROM users WHERE user_id = ${userId}
      `;

      if (userCheck.rows.length === 0) {
        // 사용자 정보는 클라이언트에서 전달받아야 함
        const { email, name, picture } = req.body;
        if (!email || !name) {
          return res.status(400).json({ error: "사용자 정보가 필요합니다." });
        }

        await sql`
          INSERT INTO users (user_id, email, name, picture)
          VALUES (${userId}, ${email}, ${name}, ${picture || null})
          ON CONFLICT (user_id) DO UPDATE
          SET email = EXCLUDED.email,
              name = EXCLUDED.name,
              picture = EXCLUDED.picture,
              updated_at = CURRENT_TIMESTAMP
        `;
      }

      // 포켓몬 추가 (중복 시 무시)
      try {
        await sql`
          INSERT INTO user_pokemon (user_id, pokemon_id)
          VALUES (${userId}, ${pokemonId})
          ON CONFLICT (user_id, pokemon_id) DO NOTHING
        `;

        return res
          .status(200)
          .json({ success: true, message: "포켓몬이 추가되었습니다." });
      } catch (error) {
        if (error.code === "23505") {
          // 중복 키 에러 (이미 존재)
          return res
            .status(200)
            .json({ success: true, message: "이미 저장된 포켓몬입니다." });
        }
        throw error;
      }
    }

    return res.status(405).json({ error: "지원하지 않는 메서드입니다." });
  } catch (error) {
    console.error("API 오류:", error);
    console.error("에러 상세:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      details: error.message,
      code: error.code,
      hint:
        error.code === "42P01"
          ? "테이블이 존재하지 않습니다. /api/db/init을 실행하세요."
          : error.code === "3D000"
          ? "데이터베이스가 존재하지 않습니다. Vercel Postgres를 생성하세요."
          : undefined,
    });
  }
}
