// DELETE: 특정 포켓몬 삭제
// 환경 변수 로드 (vercel dev에서 필요)
import "../../lib/env-loader.js";
import prisma from "../../lib/prisma.js";

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
  // Vercel에서는 동적 라우트 파라미터가 req.query에 들어감
  // 파일명이 [pokemonId].js이면 req.query.pokemonId로 접근
  let pokemonId = req.query?.pokemonId;

  // pokemonId가 없으면 URL에서 추출
  if (!pokemonId) {
    try {
      // req.url이 상대 경로일 수 있으므로 절대 URL로 변환
      const baseUrl = req.headers.host
        ? `http://${req.headers.host}`
        : `http://localhost:${process.env.PORT || 3000}`;
      const url = new URL(req.url || "", baseUrl);

      // /api/pokemon/3 형식에서 마지막 숫자 추출
      const pathParts = url.pathname.split("/").filter(Boolean);
      // api, pokemon, 3 형식에서 마지막 부분이 pokemonId
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && !isNaN(Number(lastPart))) {
        pokemonId = lastPart;
      }
    } catch (e) {
      console.error("URL 파싱 실패:", e, {
        url: req.url,
        host: req.headers.host,
      });
    }
  }

  console.log("삭제 요청 디버그:", {
    pokemonId,
    query: req.query,
    url: req.url,
    method: req.method,
    headers: { host: req.headers.host },
  });

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
    const deleted = await prisma.userPokemon.deleteMany({
      where: {
        user_id: userId,
        pokemon_id: Number(pokemonId),
      },
    });

    if (deleted.count === 0) {
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
