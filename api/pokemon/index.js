// GET: 사용자의 포켓몬 목록 조회
// POST: 포켓몬 추가
// 환경 변수 로드 (vercel dev에서 필요)
import "../../lib/env-loader.js";
import prisma from "../../lib/prisma.js";

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
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
      const pokemon = await prisma.userPokemon.findMany({
        where: {
          user_id: userId,
        },
        select: {
          pokemon_id: true,
          added_at: true,
        },
        orderBy: {
          added_at: "desc",
        },
      });

      return res.status(200).json({ pokemon });
    }

    if (req.method === "POST") {
      const { pokemonId } = req.body;

      if (!pokemonId || typeof pokemonId !== "number") {
        return res
          .status(400)
          .json({ error: "유효한 pokemonId가 필요합니다." });
      }

      // 사용자 정보가 없으면 먼저 생성 또는 업데이트
      const { email, name, picture } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: "사용자 정보가 필요합니다." });
      }

      await prisma.user.upsert({
        where: {
          user_id: userId,
        },
        update: {
          email,
          name,
          picture: picture || null,
        },
        create: {
          user_id: userId,
          email,
          name,
          picture: picture || null,
        },
      });

      // 포켓몬 추가 (중복 시 무시)
      try {
        await prisma.userPokemon.create({
          data: {
            user_id: userId,
            pokemon_id: pokemonId,
          },
        });

        return res
          .status(200)
          .json({ success: true, message: "포켓몬이 추가되었습니다." });
      } catch (error) {
        // Prisma의 고유 제약 조건 위반 에러 (P2002)
        if (error.code === "P2002") {
          // 중복 키 에러 (이미 존재)
          return res
            .status(200)
            .json({ success: true, message: "이미 저장된 포켓몬입니다." });
        }
        throw error;
      }
    }

    if (req.method === "DELETE") {
      // DELETE 요청도 같은 엔드포인트에서 처리
      const { pokemonId } = req.body || {};

      // body에서 가져오지 못하면 쿼리 파라미터에서 시도
      const deletePokemonId =
        pokemonId ||
        (() => {
          try {
            const url = new URL(
              req.url,
              `http://${req.headers.host || "localhost"}`
            );
            const id = url.searchParams.get("pokemonId");
            return id ? Number(id) : null;
          } catch {
            return null;
          }
        })();

      if (!deletePokemonId || typeof deletePokemonId !== "number") {
        return res
          .status(400)
          .json({ error: "유효한 pokemonId가 필요합니다." });
      }

      try {
        const deleted = await prisma.userPokemon.deleteMany({
          where: {
            user_id: userId,
            pokemon_id: deletePokemonId,
          },
        });

        if (deleted.count === 0) {
          return res.status(404).json({ error: "포켓몬을 찾을 수 없습니다." });
        }

        return res
          .status(200)
          .json({ success: true, message: "포켓몬이 삭제되었습니다." });
      } catch (error) {
        console.error("포켓몬 삭제 API 오류:", error);
        return res
          .status(500)
          .json({ error: "서버 오류가 발생했습니다.", details: error.message });
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
