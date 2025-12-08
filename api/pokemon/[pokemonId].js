// DELETE: 특정 포켓몬 삭제
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "지원하지 않는 메서드입니다." });
  }

  // 동적 라우트 파라미터와 쿼리 파라미터 가져오기
  const pokemonId =
    req.query?.pokemonId ||
    (() => {
      try {
        const url = new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );
        return url.pathname.split("/").pop();
      } catch {
        return null;
      }
    })();

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

  if (!pokemonId || isNaN(Number(pokemonId))) {
    return res.status(400).json({ error: "유효한 pokemonId가 필요합니다." });
  }

  try {
    const result = await sql`
      DELETE FROM user_pokemon
      WHERE user_id = ${userId} AND pokemon_id = ${Number(pokemonId)}
      RETURNING pokemon_id
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "포켓몬을 찾을 수 없습니다." });
    }

    return res
      .status(200)
      .json({ success: true, message: "포켓몬이 삭제되었습니다." });
  } catch (error) {
    console.error("API 오류:", error);
    return res
      .status(500)
      .json({ error: "서버 오류가 발생했습니다.", details: error.message });
  }
}
