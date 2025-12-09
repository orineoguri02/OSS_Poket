/**
 * 다운로드 폴더에서 포켓몬 3D 모델을 가져와서 public/pokemon으로 복사하고 CDN에 업로드
 * 사용법: node scripts/importFromDownloads.js [시작번호] [끝번호]
 * 예시: node scripts/importFromDownloads.js 19 30
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const downloadsDir = path.join(os.homedir(), "Downloads");
const MODEL_EXTENSIONS = [".dae", ".obj", ".fbx", ".glb", ".gltf"];

/**
 * 다운로드 폴더에서 포켓몬 폴더 찾기 (zip 파일도 처리)
 */
function findPokemonFolder(pokemonId) {
  const paddedId = String(pokemonId).padStart(4, "0");
  const patterns = [
    `Wii - Pokemon Battle Revolution - Pokemon (1st Generation) - #${paddedId}`,
    `Wii - Pokemon Battle Revolution - Pokemon (1st Generation) - #${pokemonId}`,
    `*#${paddedId}*`,
    `*#${pokemonId}*`,
  ];

  // 먼저 폴더 찾기
  for (const pattern of patterns) {
    try {
      const folders = fs
        .readdirSync(downloadsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((name) => {
          if (pattern.includes("*")) {
            const regex = new RegExp(
              pattern.replace(/\*/g, ".*").replace(/#/g, "#")
            );
            return regex.test(name) && name.includes(paddedId);
          }
          return name.includes(pattern);
        });

      if (folders.length > 0) {
        return path.join(downloadsDir, folders[0]);
      }
    } catch (error) {
      // 계속 시도
    }
  }

  // 폴더가 없으면 zip 파일 찾아서 압축 해제
  try {
    const zipFiles = fs
      .readdirSync(downloadsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".zip"))
      .map((dirent) => dirent.name)
      .filter(
        (name) =>
          name.includes(`#${paddedId}`) || name.includes(`#${pokemonId}`)
      );

    if (zipFiles.length > 0) {
      const zipPath = path.join(downloadsDir, zipFiles[0]);
      const extractDir = path.join(
        downloadsDir,
        path.basename(zipFiles[0], ".zip")
      );

      // 이미 압축 해제된 폴더가 있으면 그대로 사용
      if (fs.existsSync(extractDir)) {
        return extractDir;
      }

      // 압축 해제 시도
      try {
        execSync(`unzip -q -o "${zipPath}" -d "${downloadsDir}"`, {
          stdio: "ignore",
        });

        // 압축 해제 후 폴더 확인
        if (fs.existsSync(extractDir)) {
          return extractDir;
        }

        // 폴더 이름이 다를 수 있으므로 다시 찾기
        const folders = fs
          .readdirSync(downloadsDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
          .filter((name) => name.includes(paddedId));

        if (folders.length > 0) {
          return path.join(downloadsDir, folders[0]);
        }

        // 폴더가 없으면 파일들이 다운로드 폴더 루트에 있을 수 있음
        // 임시 폴더 생성하여 파일들 이동
        if (!fs.existsSync(extractDir)) {
          fs.mkdirSync(extractDir, { recursive: true });

          // 해당 포켓몬 관련 파일들 찾아서 이동
          const files = fs
            .readdirSync(downloadsDir, { withFileTypes: true })
            .filter((dirent) => dirent.isFile())
            .map((dirent) => dirent.name)
            .filter((name) => {
              const lowerName = name.toLowerCase();
              // 모델 파일이나 텍스처 파일인지 확인
              return (
                MODEL_EXTENSIONS.some((ext) => lowerName.endsWith(ext)) ||
                lowerName.endsWith(".png") ||
                lowerName.endsWith(".jpg") ||
                lowerName.endsWith(".jpeg") ||
                lowerName.endsWith(".mtl")
              );
            });

          // 파일명에서 포켓몬 이름 추출 (zip 파일명에서)
          const zipName = path.basename(zipFiles[0], ".zip");
          const pokemonNameMatch = zipName.match(/#\d+\s+(.+)$/);
          if (pokemonNameMatch) {
            const pokemonName = pokemonNameMatch[1]
              .toLowerCase()
              .replace(/\s+/g, "");
            // 포켓몬 이름이 포함된 파일들만 이동
            for (const file of files) {
              const lowerFile = file.toLowerCase();
              if (
                lowerFile.includes(pokemonName) ||
                lowerFile.match(/texture_\d+\.(png|jpg|jpeg)/i)
              ) {
                const sourcePath = path.join(downloadsDir, file);
                const targetPath = path.join(extractDir, file);
                if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
                  fs.copyFileSync(sourcePath, targetPath);
                }
              }
            }
          }

          return extractDir;
        }
      } catch (error) {
        console.warn(`  ⚠️  zip 압축 해제 실패: ${error.message}`);
      }
    }
  } catch (error) {
    // zip 파일 찾기 실패
  }

  return null;
}

/**
 * 폴더에서 모델 파일 찾기
 */
function findModelFiles(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }

  const modelFiles = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const fileName = path.basename(entry.name, ext).toLowerCase();

        if (MODEL_EXTENSIONS.includes(ext) && !fileName.includes("collision")) {
          modelFiles.push({
            path: fullPath,
            name: entry.name,
            ext: ext,
          });
        }
      }
    }
  }

  scanDir(folderPath);

  // 우선순위: .dae > .fbx > .obj > 기타
  const sorted = modelFiles.sort((a, b) => {
    const priority = { ".dae": 1, ".fbx": 2, ".obj": 3 };
    return (priority[a.ext] || 99) - (priority[b.ext] || 99);
  });

  return sorted;
}

/**
 * 폴더 내 모든 텍스처 파일 찾기 (재귀적으로)
 */
function findTextureFiles(folderPath) {
  const textureFiles = [];
  const textureExtensions = [".png", ".jpg", ".jpeg", ".tga"];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Shiny 폴더 제외
      if (entry.isDirectory() && entry.name.toLowerCase().includes("shiny")) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (textureExtensions.includes(ext)) {
          textureFiles.push({
            path: fullPath,
            name: entry.name,
          });
        }
      }
    }
  }

  scanDir(folderPath);
  return textureFiles;
}

/**
 * .mtl 파일에서 참조하는 텍스처 파일명 추출
 */
function extractTextureNames(mtlPath) {
  if (!fs.existsSync(mtlPath)) return [];

  const mtlContent = fs.readFileSync(mtlPath, "utf-8");
  const textureNames = [];
  const lines = mtlContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("map_Kd") || trimmed.startsWith("map_Ka")) {
      const parts = trimmed.split(/\s+/);
      if (parts.length > 1) {
        const textureName = parts[parts.length - 1].trim();
        if (textureName) {
          textureNames.push(textureName);
        }
      }
    }
  }

  return textureNames;
}

/**
 * 파일을 public/pokemon으로 복사
 */
function copyToPublic(pokemonId, sourceFile, pokemonFolder) {
  const pokemonDir = path.join(
    __dirname,
    "../public/pokemon",
    String(pokemonId)
  );

  if (!fs.existsSync(pokemonDir)) {
    fs.mkdirSync(pokemonDir, { recursive: true });
  }

  const targetPath = path.join(pokemonDir, sourceFile.name);

  try {
    // 모델 파일 복사
    fs.copyFileSync(sourceFile.path, targetPath);
    console.log(`  ✓ 복사: ${sourceFile.name}`);

    // .mtl 파일 복사
    const baseName = path.basename(sourceFile.name, sourceFile.ext);
    const sourceDir = path.dirname(sourceFile.path);
    const mtlFile = path.join(sourceDir, baseName + ".mtl");

    if (fs.existsSync(mtlFile)) {
      const targetMtl = path.join(pokemonDir, baseName + ".mtl");
      fs.copyFileSync(mtlFile, targetMtl);
      console.log(`  ✓ 관련 파일 복사: ${baseName}.mtl`);

      // .mtl 파일에서 참조하는 텍스처 파일명 추출
      const textureNames = extractTextureNames(mtlFile);

      // 폴더 내 모든 텍스처 파일 찾기
      const allTextures = findTextureFiles(pokemonFolder);

      // .mtl에서 참조하는 텍스처 파일 복사
      const copiedTextures = new Set();

      for (const textureName of textureNames) {
        // 정확한 파일명으로 찾기
        const foundTexture = allTextures.find(
          (t) =>
            t.name === textureName ||
            t.name.toLowerCase() === textureName.toLowerCase()
        );

        if (foundTexture && !copiedTextures.has(foundTexture.name)) {
          const targetTexture = path.join(pokemonDir, foundTexture.name);
          fs.copyFileSync(foundTexture.path, targetTexture);
          console.log(`  ✓ 텍스처 복사: ${foundTexture.name}`);
          copiedTextures.add(foundTexture.name);
        }
      }

      // .mtl에서 참조하지 않더라도 같은 이름의 텍스처 파일이 있으면 복사
      const sameNameTexture = allTextures.find(
        (t) =>
          path.basename(t.name, path.extname(t.name)).toLowerCase() ===
          baseName.toLowerCase()
      );

      if (sameNameTexture && !copiedTextures.has(sameNameTexture.name)) {
        const targetTexture = path.join(pokemonDir, sameNameTexture.name);
        fs.copyFileSync(sameNameTexture.path, targetTexture);
        console.log(`  ✓ 텍스처 복사: ${sameNameTexture.name}`);
        copiedTextures.add(sameNameTexture.name);
      }
    }

    return true;
  } catch (error) {
    console.error(`  ❌ 복사 실패: ${error.message}`);
    return false;
  }
}

/**
 * 메인 함수
 */
async function importPokemonModels(startId, endId) {
  console.log(`🚀 다운로드 폴더에서 포켓몬 모델 가져오기 시작\n`);
  console.log(`범위: ${startId}번부터 ${endId}번까지\n`);

  let successCount = 0;
  let skipCount = 0;

  for (let id = startId; id <= endId; id++) {
    console.log(`\n📦 ${id}번 포켓몬 처리 중...`);

    // 다운로드 폴더에서 포켓몬 폴더 찾기
    const pokemonFolder = findPokemonFolder(id);

    if (!pokemonFolder) {
      console.log(`  ⚠️  폴더를 찾을 수 없습니다.`);
      skipCount++;
      continue;
    }

    console.log(`  📁 폴더 발견: ${path.basename(pokemonFolder)}`);

    // 모델 파일 찾기
    const modelFiles = findModelFiles(pokemonFolder);

    if (modelFiles.length === 0) {
      console.log(`  ⚠️  모델 파일을 찾을 수 없습니다.`);
      skipCount++;
      continue;
    }

    console.log(`  📄 모델 파일 ${modelFiles.length}개 발견`);

    // 첫 번째 모델 파일 복사 (우선순위가 가장 높은 것)
    const primaryModel = modelFiles[0];
    if (copyToPublic(id, primaryModel, pokemonFolder)) {
      successCount++;
    } else {
      skipCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 가져오기 완료 요약");
  console.log("=".repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⚠️  건너뜀: ${skipCount}개`);
  console.log("=".repeat(50));

  if (successCount > 0) {
    console.log(
      `\n💡 다음 명령어로 CDN에 업로드하세요:\n   node scripts/uploadModelsToCDN.js ${startId} ${endId}`
    );
  }
}

// 메인 실행
const args = process.argv.slice(2);
const startId = args[0] ? parseInt(args[0]) : 19;
const endId = args[1] ? parseInt(args[1]) : 30;

importPokemonModels(startId, endId)
  .then(() => {
    console.log("\n✅ 모든 작업 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 오류 발생:", error);
    process.exit(1);
  });
