/**
 * 포켓몬 3D 모델 파일을 Vercel Blob Storage로 업로드하는 스크립트
 * 사용법: node scripts/uploadModelsToCDN.js
 *
 * 환경 변수 필요:
 * - BLOB_READ_WRITE_TOKEN (Vercel Blob Storage 토큰)
 * - POSTGRES_URL (데이터베이스 연결 URL)
 */

import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import prisma from "../lib/prisma.js";
import "../lib/env-loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 지원하는 3D 모델 확장자
const MODEL_EXTENSIONS = [".dae", ".obj", ".fbx", ".glb", ".gltf"];

/**
 * 포켓몬 폴더에서 모델 파일 찾기
 */
function findModelFile(pokemonDir, pokemonId) {
  if (!fs.existsSync(pokemonDir)) {
    return null;
  }

  const files = fs.readdirSync(pokemonDir, { withFileTypes: true });
  const modelFiles = [];

  for (const file of files) {
    if (file.isFile()) {
      const ext = path.extname(file.name).toLowerCase();
      const fileName = path.basename(file.name, ext).toLowerCase();

      // collision 파일 제외
      if (MODEL_EXTENSIONS.includes(ext) && !fileName.includes("collision")) {
        const fullPath = path.join(pokemonDir, file.name);
        modelFiles.push({
          path: fullPath,
          name: file.name,
          ext: ext,
        });
      }
    }
  }

  if (modelFiles.length === 0) {
    return null;
  }

  // 우선순위: pm{id}_00_00.dae > .dae > 기타
  const paddedId = String(pokemonId).padStart(4, "0");
  const preferredPattern = `pm${paddedId}_00_00.dae`;

  const preferred = modelFiles.find((f) => f.name.includes(preferredPattern));
  if (preferred) return preferred;

  const daeFile = modelFiles.find((f) => f.ext === ".dae");
  if (daeFile) return daeFile;

  return modelFiles[0];
}

/**
 * 단일 파일 업로드 (모델 또는 텍스처)
 */
async function uploadFile(pokemonId, filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    // Vercel Blob Storage에 업로드
    const blob = await put(`pokemon/${pokemonId}/${fileName}`, fileBuffer, {
      access: "public",
      addRandomSuffix: false, // 파일명 그대로 사용
      allowOverwrite: true, // 기존 파일 덮어쓰기 허용
    });

    console.log(`  ✓ 업로드: ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`);

    return blob.url;
  } catch (error) {
    console.error(`  ❌ 업로드 실패: ${fileName}`, error.message);
    throw error;
  }
}

/**
 * 단일 모델 파일 및 관련 파일들 업로드
 */
async function uploadModel(pokemonId, filePath, fileName) {
  try {
    const ext = path.extname(fileName).toLowerCase().substring(1); // .dae -> dae
    const pokemonDir = path.dirname(filePath);

    // 모델 파일 업로드
    const modelCdnUrl = await uploadFile(pokemonId, filePath, fileName);
    const fileSize = fs.statSync(filePath).size;

    console.log(`✓ 모델 업로드 완료: ${pokemonId}번 - ${fileName}`);
    console.log(`  CDN URL: ${modelCdnUrl}`);

    // 관련 파일들 찾기 및 업로드 (.mtl, 텍스처 등)
    const relatedExtensions = [".mtl", ".png", ".jpg", ".jpeg", ".tga"];
    const uploadedFiles = [modelCdnUrl];

    // 같은 디렉토리의 모든 관련 파일 찾기
    const files = fs.readdirSync(pokemonDir);
    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase();
      if (relatedExtensions.includes(fileExt)) {
        const relatedFilePath = path.join(pokemonDir, file);
        try {
          const cdnUrl = await uploadFile(pokemonId, relatedFilePath, file);
          uploadedFiles.push(cdnUrl);
        } catch (error) {
          console.warn(`  ⚠️  관련 파일 업로드 실패: ${file}`, error.message);
        }
      }
    }

    return {
      cdn_url: modelCdnUrl,
      file_size: fileSize,
      model_type: ext,
      related_files: uploadedFiles,
    };
  } catch (error) {
    console.error(
      `❌ 업로드 실패: ${pokemonId}번 - ${fileName}`,
      error.message
    );
    throw error;
  }
}

/**
 * DB에 모델 정보 저장
 */
async function saveToDatabase(pokemonId, modelInfo, originalPath) {
  try {
    await prisma.pokemonModel.upsert({
      where: { pokemon_id: pokemonId },
      update: {
        model_path: originalPath,
        cdn_url: modelInfo.cdn_url,
        model_type: modelInfo.model_type,
        file_size: modelInfo.file_size,
        storage_type: "cdn",
        file_exists: true,
        updated_at: new Date(),
      },
      create: {
        pokemon_id: pokemonId,
        model_path: originalPath,
        cdn_url: modelInfo.cdn_url,
        model_type: modelInfo.model_type,
        file_size: modelInfo.file_size,
        storage_type: "cdn",
        is_primary: true,
        file_exists: true,
      },
    });

    console.log(`✓ DB 저장 완료: ${pokemonId}번\n`);
  } catch (error) {
    console.error(`❌ DB 저장 실패: ${pokemonId}번`, error.message);
    throw error;
  }
}

/**
 * 모든 포켓몬 모델 업로드
 */
async function uploadAllModels(startId = 1, endId = 151) {
  console.log("🚀 포켓몬 3D 모델 CDN 업로드 시작\n");
  console.log(`범위: ${startId}번부터 ${endId}번까지\n`);

  // 환경 변수 확인
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "❌ BLOB_READ_WRITE_TOKEN 환경 변수가 필요합니다.\n" +
        "Vercel 대시보드에서 Blob Storage를 생성하고 토큰을 설정하세요."
    );
    process.exit(1);
  }

  const pokemonDir = path.join(__dirname, "../public/pokemon");
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let id = startId; id <= endId; id++) {
    const pokemonFolder = path.join(pokemonDir, String(id));
    const modelFile = findModelFile(pokemonFolder, id);

    if (!modelFile) {
      console.log(`⚠️  ${id}번: 모델 파일 없음 (건너뜀)`);
      skipCount++;
      continue;
    }

    try {
      // 원본 경로 (public 폴더 기준)
      const relativePath = `/pokemon/${id}/${modelFile.name}`;

      // CDN에 업로드
      const modelInfo = await uploadModel(id, modelFile.path, modelFile.name);

      // DB에 저장
      await saveToDatabase(id, modelInfo, relativePath);

      successCount++;
    } catch (error) {
      console.error(`❌ ${id}번 처리 실패:`, error.message);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 업로드 완료 요약");
  console.log("=".repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⚠️  건너뜀: ${skipCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);
  console.log("=".repeat(50));
}

// 메인 실행
const args = process.argv.slice(2);
const startId = args[0] ? parseInt(args[0]) : 1;
const endId = args[1] ? parseInt(args[1]) : 151;

uploadAllModels(startId, endId)
  .then(() => {
    console.log("\n✅ 모든 작업 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 오류 발생:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
