/**
 * 포켓몬 3D 모델 파일을 쉽게 추가하는 스크립트
 * 사용법: node scripts/addModel.js [포켓몬번호] [모델파일경로]
 * 예시: node scripts/addModel.js 15 /path/to/model.dae
 *
 * 또는 대화형 모드:
 * node scripts/addModel.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 모델 파일을 포켓몬 폴더로 복사
 */
function addModelFile(pokemonId, sourcePath) {
  // 소스 파일 확인
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ 오류: 파일을 찾을 수 없습니다: ${sourcePath}`);
    return false;
  }

  // 포켓몬 폴더 경로
  const pokemonDir = path.join(
    __dirname,
    "../public/pokemon",
    String(pokemonId)
  );

  // 폴더가 없으면 생성
  if (!fs.existsSync(pokemonDir)) {
    fs.mkdirSync(pokemonDir, { recursive: true });
    console.log(`✓ 폴더 생성: ${pokemonDir}`);
  }

  // 파일명 추출
  const fileName = path.basename(sourcePath);
  const targetPath = path.join(pokemonDir, fileName);

  // 파일 복사
  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✓ 파일 복사 완료: ${fileName}`);
    console.log(`  소스: ${sourcePath}`);
    console.log(`  대상: ${targetPath}`);

    // 관련 파일도 자동으로 복사 시도 (같은 이름의 .mtl, .obj 등)
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const sourceDir = path.dirname(sourcePath);
    const relatedExtensions = [".mtl", ".obj", ".png", ".jpg", ".jpeg"];

    relatedExtensions.forEach((ext) => {
      const relatedFile = path.join(sourceDir, baseName + ext);
      if (fs.existsSync(relatedFile)) {
        const targetRelated = path.join(pokemonDir, baseName + ext);
        fs.copyFileSync(relatedFile, targetRelated);
        console.log(`✓ 관련 파일 복사: ${baseName + ext}`);
      }
    });

    return true;
  } catch (error) {
    console.error(`❌ 파일 복사 실패:`, error.message);
    return false;
  }
}

/**
 * 폴더 내 모든 모델 파일을 스캔하여 포켓몬 번호 추정
 */
function suggestPokemonId(fileName) {
  // 파일명에서 숫자 추출 시도
  const numberMatch = fileName.match(/\d{3,4}/);
  if (numberMatch) {
    const num = parseInt(numberMatch[0]);
    if (num >= 1 && num <= 151) {
      return num;
    }
  }
  return null;
}

/**
 * 대화형 모드
 */
async function interactiveMode() {
  // readline은 Node.js 내장이지만, 간단하게 process.stdin 사용
  console.log("\n=== 포켓몬 3D 모델 추가 도구 ===\n");

  // 포켓몬 번호 입력 받기
  process.stdout.write("포켓몬 번호를 입력하세요 (1-151): ");

  return new Promise((resolve) => {
    process.stdin.once("data", (data) => {
      const pokemonId = parseInt(data.toString().trim());

      if (isNaN(pokemonId) || pokemonId < 1 || pokemonId > 151) {
        console.error("❌ 유효한 포켓몬 번호를 입력하세요 (1-151)");
        process.exit(1);
      }

      process.stdout.write(
        `모델 파일 경로를 입력하세요 (또는 드래그 앤 드롭): `
      );

      process.stdin.once("data", (fileData) => {
        const filePath = fileData
          .toString()
          .trim()
          .replace(/^["']|["']$/g, "");
        resolve({ pokemonId, filePath });
      });
    });
  });
}

/**
 * 배치 모드: 폴더에서 여러 파일을 한번에 추가
 */
function batchAddFromFolder(folderPath, pokemonIdMap = {}) {
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ 폴더를 찾을 수 없습니다: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath, { withFileTypes: true });
  const modelExtensions = [".dae", ".obj", ".fbx", ".glb", ".gltf"];

  let addedCount = 0;

  for (const file of files) {
    if (!file.isFile()) continue;

    const ext = path.extname(file.name).toLowerCase();
    if (!modelExtensions.includes(ext)) continue;

    // 포켓몬 번호 결정
    let pokemonId = pokemonIdMap[file.name];

    if (!pokemonId) {
      pokemonId = suggestPokemonId(file.name);
    }

    if (!pokemonId) {
      console.log(
        `⚠️  ${file.name}: 포켓몬 번호를 추정할 수 없습니다. 건너뜁니다.`
      );
      continue;
    }

    const sourcePath = path.join(folderPath, file.name);
    if (addModelFile(pokemonId, sourcePath)) {
      addedCount++;
    }
  }

  console.log(`\n✓ 총 ${addedCount}개 파일이 추가되었습니다.`);
}

// 메인 실행
// eslint-disable-next-line no-undef
const args = process.argv.slice(2);

if (args.length === 0) {
  // 대화형 모드
  interactiveMode().then(({ pokemonId, filePath }) => {
    if (addModelFile(pokemonId, filePath)) {
      console.log("\n✓ 모델 파일 추가 완료!");
      console.log("\n다음 명령어로 모델 경로를 업데이트하세요:");
      console.log(`  node scripts/scanModelPaths.js ${pokemonId} ${pokemonId}`);
    }
  });
} else if (args.length === 2) {
  // 명령줄 모드: node scripts/addModel.js [번호] [파일경로]
  const pokemonId = parseInt(args[0]);
  const filePath = args[1];

  if (isNaN(pokemonId) || pokemonId < 1 || pokemonId > 151) {
    console.error("❌ 유효한 포켓몬 번호를 입력하세요 (1-151)");
    process.exit(1);
  }

  if (addModelFile(pokemonId, filePath)) {
    console.log("\n✓ 모델 파일 추가 완료!");
    console.log("\n다음 명령어로 모델 경로를 업데이트하세요:");
    console.log(`  node scripts/scanModelPaths.js ${pokemonId} ${pokemonId}`);
  }
} else if (args.length === 1 && fs.statSync(args[0]).isDirectory()) {
  // 폴더 모드: node scripts/addModel.js [폴더경로]
  console.log("📁 폴더 모드: 폴더 내 모든 모델 파일을 추가합니다.");
  console.log("⚠️  파일명에서 포켓몬 번호를 자동으로 추정합니다.\n");
  batchAddFromFolder(args[0]);
  console.log("\n다음 명령어로 모델 경로를 업데이트하세요:");
  console.log("  node scripts/scanModelPaths.js");
} else {
  console.log("사용법:");
  console.log("  node scripts/addModel.js                    # 대화형 모드");
  console.log(
    "  node scripts/addModel.js [번호] [파일경로]   # 단일 파일 추가"
  );
  console.log(
    "  node scripts/addModel.js [폴더경로]          # 폴더 내 모든 파일 추가"
  );
  process.exit(1);
}

