/**
 * public/pokemon 폴더를 스캔하여 3D 모델 경로를 자동으로 찾는 스크립트
 * 사용법: node scripts/scanModelPaths.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 지원하는 3D 모델 확장자
const MODEL_EXTENSIONS = [".dae", ".obj", ".fbx", ".glb", ".gltf"];

/**
 * 디렉토리에서 모델 파일을 찾는 함수
 */
function findModelFiles(dir, pokemonId) {
  const modelPaths = [];

  if (!fs.existsSync(dir)) {
    return modelPaths;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // 하위 디렉토리도 검색
      const subModels = findModelFiles(fullPath, pokemonId);
      modelPaths.push(...subModels);
    } else if (file.isFile()) {
      const ext = path.extname(file.name).toLowerCase();
      const fileName = path.basename(file.name, ext).toLowerCase();

      // collision 파일 제외
      if (MODEL_EXTENSIONS.includes(ext) && !fileName.includes("collision")) {
        // public 폴더 기준 경로로 변환
        const relativePath = fullPath
          .replace(path.join(__dirname, "../public"), "")
          .replace(/\\/g, "/");
        modelPaths.push(relativePath);
      }
    }
  }

  return modelPaths;
}

/**
 * 포켓몬 ID에 대한 모델 경로 찾기
 */
function findPokemonModel(pokemonId) {
  const pokemonDir = path.join(
    __dirname,
    "../public/pokemon",
    String(pokemonId)
  );
  const models = findModelFiles(pokemonDir, pokemonId);

  if (models.length > 0) {
    // 여러 모델이 있으면 우선순위에 따라 선택
    // 1. pm{id}_00_00.dae 형식 우선
    // 2. 그 다음 일반 .dae 파일
    // 3. 그 외 파일
    const paddedId = String(pokemonId).padStart(4, "0");
    const preferredPattern = `pm${paddedId}_00_00.dae`;

    const preferred = models.find((m) => m.includes(preferredPattern));
    if (preferred) return preferred;

    const daeFile = models.find((m) => m.endsWith(".dae"));
    if (daeFile) return daeFile;

    return models[0];
  }

  // 기본 경로 시도
  const paddedId = String(pokemonId).padStart(4, "0");
  const defaultPath = `/pokemon/${pokemonId}/pm${paddedId}_00_00.dae`;
  const defaultFullPath = path.join(__dirname, "../public", defaultPath);

  if (fs.existsSync(defaultFullPath)) {
    return defaultPath;
  }

  return null;
}

/**
 * 모든 포켓몬 모델 경로 스캔
 */
function scanAllModelPaths(startId = 1, endId = 151) {
  console.log(`3D 모델 경로 스캔 시작: ${startId}번부터 ${endId}번까지\n`);

  const modelPaths = {};

  for (let id = startId; id <= endId; id++) {
    const modelPath = findPokemonModel(id);
    if (modelPath) {
      modelPaths[id] = modelPath;
      console.log(`✓ ${id}번: ${modelPath}`);
    } else {
      console.log(`✗ ${id}번: 모델 파일 없음`);
    }
  }

  return modelPaths;
}

/**
 * pokemonDetails.js 파일에 modelPath 추가
 */
function updatePokemonDetailsWithModelPaths(modelPaths) {
  const filePath = path.join(__dirname, "../src/data/pokemonDetails.js");

  try {
    const content = fs.readFileSync(filePath, "utf8");

    // 기존 데이터 추출
    const match = content.match(/const pokemonDetails = ({[\s\S]*?});/);
    if (!match) {
      console.error("pokemonDetails 객체를 찾을 수 없습니다.");
      return;
    }

    const func = new Function("return " + match[1]);
    const pokemonDetails = func();

    // modelPath 추가
    Object.keys(modelPaths).forEach((id) => {
      const numId = Number(id);
      if (pokemonDetails[numId]) {
        pokemonDetails[numId].modelPath = modelPaths[id];
      }
    });

    // 파일 저장
    const updatedContent = `const pokemonDetails = ${JSON.stringify(
      pokemonDetails,
      null,
      2
    ).replace(/"(\d+)":/g, "$1:")};

export default pokemonDetails;
`;

    fs.writeFileSync(filePath, updatedContent, "utf8");
    console.log(
      `\n✓ 완료! ${
        Object.keys(modelPaths).length
      }개 모델 경로가 추가되었습니다.`
    );
    console.log(`파일 위치: ${filePath}`);
  } catch (error) {
    console.error("파일 업데이트 실패:", error.message);
  }
}

// 메인 실행
const startId = parseInt(process.argv[2]) || 1;
// eslint-disable-next-line no-undef
const endId = parseInt(process.argv[3]) || 151;

const modelPaths = scanAllModelPaths(startId, endId);
updatePokemonDetailsWithModelPaths(modelPaths);
