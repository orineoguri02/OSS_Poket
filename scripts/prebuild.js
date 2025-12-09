/**
 * 빌드 전 스크립트: 로컬 파일 사용 (CDN 제거)
 * public/pokemon 폴더를 항상 포함합니다.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pokemonDir = path.join(__dirname, "../public/pokemon");

// 로컬 파일 사용 (CDN 제거)
if (fs.existsSync(pokemonDir)) {
  console.log("ℹ️  로컬 파일 사용: public/pokemon 폴더를 빌드에 포함합니다.");
} else {
  console.warn("⚠️  public/pokemon 폴더가 없습니다.");
}
