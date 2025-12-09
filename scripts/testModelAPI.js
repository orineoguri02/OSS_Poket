/**
 * 모델 API 테스트 스크립트
 * 사용법: node scripts/testModelAPI.js [포켓몬ID]
 */

import "../lib/env-loader.js";
import prisma from "../lib/prisma.js";

const pokemonId = process.argv[2] ? parseInt(process.argv[2]) : 19;

async function testModelAPI() {
  console.log(`\n🔍 포켓몬 ${pokemonId}번 모델 정보 확인\n`);

  try {
    const model = await prisma.pokemonModel.findUnique({
      where: { pokemon_id: pokemonId },
    });

    if (!model) {
      console.log("❌ DB에 모델 정보가 없습니다.");
      return;
    }

    console.log("📊 DB 정보:");
    console.log(`  포켓몬 ID: ${model.pokemon_id}`);
    console.log(`  모델 경로: ${model.model_path}`);
    console.log(`  CDN URL: ${model.cdn_url || "(없음)"}`);
    console.log(`  저장소 타입: ${model.storage_type}`);
    console.log(`  모델 타입: ${model.model_type}`);
    console.log(
      `  파일 크기: ${
        model.file_size
          ? (model.file_size / 1024).toFixed(2) + " KB"
          : "(알 수 없음)"
      }`
    );
    console.log(`  파일 존재: ${model.file_exists ? "✅" : "❌"}`);

    const modelUrl = model.cdn_url || model.model_path;
    console.log(`\n🌐 사용할 URL: ${modelUrl}`);

    if (model.cdn_url) {
      console.log(`\n✅ CDN URL이 설정되어 있습니다.`);
      console.log(
        `   브라우저에서 이 URL이 CORS 문제 없이 로드되는지 확인하세요.`
      );
    } else {
      console.log(`\n⚠️  CDN URL이 없습니다. 로컬 경로를 사용합니다.`);
    }
  } catch (error) {
    console.error("❌ 오류:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testModelAPI();
