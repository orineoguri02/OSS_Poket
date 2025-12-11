// GET: 사용자의 포켓몬 목록 조회
// POST: 포켓몬 추가
// GET ?id=23: 포켓몬 모델 정보 조회
// 환경 변수 로드 (vercel dev에서 필요)
import "../../lib/env-loader.js";
import prisma from "../../lib/prisma.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 포켓몬 모델 정보 조회 핸들러
 */
async function handleModelQuery(req, res, pokemonId) {
  try {
    console.log(`[API] 포켓몬 ${pokemonId}번 모델 정보 조회`);

    // Prisma Client 초기화 확인
    let model = null;
    if (prisma && prisma.pokemonModel) {
      try {
        // DB에서 모델 정보 조회
        model = await prisma.pokemonModel.findUnique({
          where: { pokemon_id: pokemonId },
        });
      } catch (dbError) {
        console.warn("[API] DB 조회 실패, 파일 시스템에서 찾기:", dbError.message);
        // DB 조회 실패 시 파일 시스템에서 찾기로 진행
      }
    } else {
      console.warn("[API] Prisma Client 또는 pokemonModel이 없습니다. 파일 시스템에서 직접 찾기");
      if (prisma) {
        console.log("[API] Prisma Client 모델:", Object.keys(prisma).filter(key => !key.startsWith('$')));
      }
    }

    if (!model) {
      // DB에 없으면 실제 파일 찾기
      const pokemonDir = path.join(
        __dirname,
        "../../public/pokemon",
        String(pokemonId)
      );

      let modelPath = null;
      let modelType = "dae";

      if (fs.existsSync(pokemonDir)) {
        // 재귀적으로 모델 파일 찾기 (하위 폴더 포함)
        const modelFiles = [];

        function findModelFiles(dir, relativePath = "") {
          if (!fs.existsSync(dir)) return;

          const entries = fs.readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativeFilePath = relativePath
              ? `${relativePath}/${entry.name}`
              : entry.name;

            if (entry.isDirectory()) {
              // Shiny 폴더 제외
              if (!entry.name.toLowerCase().includes("shiny")) {
                findModelFiles(fullPath, relativeFilePath);
              }
            } else if (entry.isFile()) {
              const isModel =
                entry.name.endsWith(".dae") ||
                entry.name.endsWith(".fbx") ||
                entry.name.endsWith(".obj") ||
                entry.name.endsWith(".glb") ||
                entry.name.endsWith(".gltf");
              // collision 파일 제외
              const isNotCollision = !entry.name
                .toLowerCase()
                .includes("collision");

              if (isModel && isNotCollision) {
                modelFiles.push({
                  name: entry.name,
                  path: relativeFilePath,
                  fullPath: fullPath,
                });
              }
            }
          }
        }

        findModelFiles(pokemonDir);

        if (modelFiles.length > 0) {
          // 우선순위: pm{id}_00_00.dae > 루트의 .dae > 하위 폴더의 .dae > 기타
          const paddedId = String(pokemonId).padStart(4, "0");
          const preferredPattern = `pm${paddedId}_00_00.dae`;

          // 1순위: pm{id}_00_00.dae 패턴
          let preferred = modelFiles.find((f) =>
            f.name.includes(preferredPattern)
          );

          // 2순위: 루트 폴더의 .dae 파일 (collision 제외)
          if (!preferred) {
            preferred = modelFiles.find(
              (f) => f.path === f.name && f.name.endsWith(".dae")
            );
          }

          // 3순위: 하위 폴더의 .dae 파일 (collision 제외)
          if (!preferred) {
            preferred = modelFiles.find((f) => f.name.endsWith(".dae"));
          }

          // 4순위: 첫 번째 모델 파일
          if (!preferred) {
            preferred = modelFiles[0];
          }

          if (preferred) {
            modelPath = `/pokemon/${pokemonId}/${preferred.path}`;
            modelType = path.extname(preferred.name).substring(1);
          }
        }
      }

      // 파일을 찾지 못하면 기본 폴백 패턴 사용
      if (!modelPath) {
        const paddedId = String(pokemonId).padStart(4, "0");
        modelPath = `/pokemon/${pokemonId}/pm${paddedId}_00_00.dae`;
      }

      // 실제 파일 존재 여부 확인
      const fullPath = path.join(__dirname, "../../public", modelPath);
      const fileExists = fs.existsSync(fullPath);

      console.log(`[API] DB에 없음, 파일 시스템에서 찾음: ${modelPath}`);
      console.log(`[API] 파일 존재 여부: ${fileExists}`);

      // 파일이 없으면 null 반환 (프론트엔드에서 처리)
      if (!fileExists) {
        console.warn(`[API] 경고: 모델 파일이 존재하지 않습니다: ${modelPath}`);
        return res.status(200).json({
          pokemon_id: pokemonId,
          model_path: null,
          cdn_url: null,
          model_type: null,
          storage_type: "local",
          file_exists: false,
          url: null,
          error: "모델 파일을 찾을 수 없습니다.",
        });
      }

      return res.status(200).json({
        pokemon_id: pokemonId,
        model_path: modelPath,
        cdn_url: null,
        model_type: modelType,
        storage_type: "local",
        file_exists: true,
        url: modelPath,
      });
    }

    // DB에서 모델을 찾은 경우 처리
    if (!model) {
      // 이 경우는 위에서 이미 처리되었어야 함
      console.error("[API] 예상치 못한 상황: model이 null입니다.");
      return res.status(500).json({
        error: "서버 오류가 발생했습니다.",
        details: "모델 정보를 찾을 수 없습니다.",
      });
    }

    // 로컬 경로만 사용 (CDN 제거)
    let modelUrl = model.model_path;

    // DB에 저장된 경로가 collision 파일이거나 파일이 존재하지 않는 경우 다시 찾기
    const dbModelPath = path.join(__dirname, "../../public", modelUrl);
    const dbFileExists = fs.existsSync(dbModelPath);

    if (
      (modelUrl && modelUrl.toLowerCase().includes("collision")) ||
      !dbFileExists
    ) {
      console.warn(
        `[API] DB에 저장된 파일이 collision이거나 존재하지 않음, 다시 찾기: ${modelUrl}, 존재: ${dbFileExists}`
      );
      const pokemonDir = path.join(
        __dirname,
        "../../public/pokemon",
        String(pokemonId)
      );

      if (fs.existsSync(pokemonDir)) {
        // 재귀적으로 모델 파일 찾기
        const modelFiles = [];

        function findModelFiles(dir, relativePath = "") {
          if (!fs.existsSync(dir)) return;

          const entries = fs.readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativeFilePath = relativePath
              ? `${relativePath}/${entry.name}`
              : entry.name;

            if (entry.isDirectory()) {
              if (!entry.name.toLowerCase().includes("shiny")) {
                findModelFiles(fullPath, relativeFilePath);
              }
            } else if (entry.isFile()) {
              const isModel =
                entry.name.endsWith(".dae") ||
                entry.name.endsWith(".fbx") ||
                entry.name.endsWith(".obj") ||
                entry.name.endsWith(".glb") ||
                entry.name.endsWith(".gltf");
              const isNotCollision = !entry.name
                .toLowerCase()
                .includes("collision");

              if (isModel && isNotCollision) {
                modelFiles.push({
                  name: entry.name,
                  path: relativeFilePath,
                });
              }
            }
          }
        }

        findModelFiles(pokemonDir);

        if (modelFiles.length > 0) {
          const paddedId = String(pokemonId).padStart(4, "0");
          const preferredPattern = `pm${paddedId}_00_00.dae`;

          let preferred = modelFiles.find((f) =>
            f.name.includes(preferredPattern)
          );

          if (!preferred) {
            preferred = modelFiles.find(
              (f) => f.path === f.name && f.name.endsWith(".dae")
            );
          }

          if (!preferred) {
            preferred = modelFiles.find((f) => f.name.endsWith(".dae"));
          }

          if (!preferred) {
            preferred = modelFiles[0];
          }

          if (preferred) {
            modelUrl = `/pokemon/${pokemonId}/${preferred.path}`;
            console.log(`[API] DB 파일 대체: ${modelUrl}`);
          }
        }
      }
    }

    console.log(`[API] DB에서 찾음: ${modelUrl}`);

    return res.status(200).json({
      pokemon_id: model.pokemon_id,
      model_path: modelUrl, // 수정된 경로 사용
      cdn_url: null, // CDN 사용 안 함
      model_type: model.model_type,
      storage_type: "local", // 항상 로컬
      file_exists: fs.existsSync(
        path.join(__dirname, "../../public", modelUrl)
      ),
      file_size: model.file_size,
      url: modelUrl, // 로컬 경로만 반환
    });
  } catch (error) {
    console.error("모델 정보 조회 실패:", error);
    return res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      details: error.message,
    });
  }
}

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

  // 모델 조회 요청인지 먼저 확인 (userId 없이 id만 있는 경우)
  const modelId = req.query?.id || req.query?.pokemonId;
  const userId = req.query?.userId;

  // userId가 없고 id만 있으면 모델 조회로 처리
  if (!userId && modelId && req.method === "GET") {
    console.log(`[API] 모델 조회 요청: 포켓몬 ${modelId}번`);
    return handleModelQuery(req, res, Number(modelId));
  }

  // 쿼리 파라미터 가져오기 (Vercel 서버리스 함수는 req.query를 지원)
  const finalUserId =
    userId ||
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

  if (!finalUserId) {
    return res.status(400).json({ error: "userId가 필요합니다." });
  }

  try {
    if (req.method === "GET") {
      // 사용자의 포켓몬 목록 조회
      const pokemon = await prisma.userPokemon.findMany({
        where: {
          user_id: finalUserId,
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
          user_id: finalUserId,
        },
        update: {
          email,
          name,
          picture: picture || null,
        },
        create: {
          user_id: finalUserId,
          email,
          name,
          picture: picture || null,
        },
      });

      // 포켓몬 추가 (중복 시 무시)
      try {
        await prisma.userPokemon.create({
          data: {
            user_id: finalUserId,
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
            user_id: finalUserId,
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
