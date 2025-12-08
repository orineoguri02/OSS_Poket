/**
 * PokeAPI를 사용하여 포켓몬 데이터를 자동으로 수집하는 스크립트
 * 사용법: node scripts/fetchPokemonData.js [시작번호] [끝번호]
 * 예시: node scripts/fetchPokemonData.js 1 151
 *
 * Node.js 18+ 버전 필요 (fetch API 내장)
 * 또는: npm install node-fetch
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 주석: 한국어 이름과 설명은 PokeAPI의 species API에서 자동으로 가져옵니다

async function fetchPokemonData(pokemonId) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon ${pokemonId}`);
    }

    const data = await response.json();

    // 한국어 이름 가져오기 (species API 사용)
    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();

    const koreanName =
      speciesData.names.find((name) => name.language.name === "ko")?.name ||
      data.name;

    // 한국어 설명 가져오기
    const koreanFlavorText =
      speciesData.flavor_text_entries.find(
        (entry) => entry.language.name === "ko" && entry.version.name === "red"
      )?.flavor_text ||
      speciesData.flavor_text_entries.find(
        (entry) => entry.language.name === "ko"
      )?.flavor_text ||
      "";

    // 타입 추출
    const types = data.types.map((type) => {
      const typeName = type.type.name;
      // 영어 타입을 한국어로 변환
      const typeMap = {
        normal: "노말",
        fire: "불꽃",
        water: "물",
        electric: "전기",
        grass: "풀",
        ice: "얼음",
        fighting: "격투",
        poison: "독",
        ground: "땅",
        flying: "비행",
        psychic: "에스퍼",
        bug: "벌레",
        rock: "바위",
        ghost: "고스트",
        dragon: "드래곤",
        dark: "악",
        steel: "강철",
        fairy: "페어리",
      };
      return typeMap[typeName] || typeName;
    });

    // 특성 추출
    const abilities = data.abilities
      .filter((ability) => !ability.is_hidden)
      .map((ability) => ability.ability.name);

    // 한국어 특성 이름 (선택사항 - 영어로도 가능)
    const abilityMap = {
      overgrow: "심록",
      blaze: "맹화",
      torrent: "급류",
      // ... 더 많은 매핑 필요
    };

    const ability = abilityMap[abilities[0]] || abilities[0];

    // 분류 추출
    const category =
      speciesData.genera.find((genus) => genus.language.name === "ko")?.genus ||
      "";

    return {
      nameKo: koreanName,
      nameEn: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      badges: ["스칼렛", "바이올렛"], // 고정값
      description:
        koreanFlavorText.replace(/\f/g, " ").trim() ||
        `${koreanName}에 대한 정보입니다.`,
      types: types,
      height: `${(data.height / 10).toFixed(1)} m`,
      weight: `${(data.weight / 10).toFixed(1)} kg`,
      category: category || `${types[0]} 포켓몬`,
      ability: ability,
      gender: "수 ♂ / 암 ♀", // PokeAPI에서 성별 정보는 별도로 처리 필요
      cta: `${koreanName} 굿즈 보러가기`,
    };
  } catch (error) {
    console.error(`Error fetching Pokemon ${pokemonId}:`, error.message);
    return null;
  }
}

async function generatePokemonDetails(startId = 1, endId = 151) {
  console.log(`포켓몬 데이터 수집 시작: ${startId}번부터 ${endId}번까지`);

  const pokemonDetails = {};
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let id = startId; id <= endId; id++) {
    console.log(`수집 중: ${id}번 포켓몬...`);
    const data = await fetchPokemonData(id);

    if (data) {
      pokemonDetails[id] = data;
      console.log(`✓ ${id}번 완료: ${data.nameKo}`);
    } else {
      console.log(`✗ ${id}번 실패`);
    }

    // API rate limit 방지를 위한 딜레이
    await delay(200);
  }

  // 기존 파일 읽기
  const filePath = path.join(__dirname, "../src/data/pokemonDetails.js");
  let existingData = {};

  try {
    const existingContent = fs.readFileSync(filePath, "utf8");
    // 기존 데이터 추출
    const match = existingContent.match(/const pokemonDetails = ({[\s\S]*?});/);
    if (match) {
      // Function 생성자를 사용하여 안전하게 파싱
      const func = new Function("return " + match[1]);
      existingData = func();
    }
  } catch {
    console.log("기존 파일이 없습니다. 새로 생성합니다.");
  }

  // 기존 데이터와 새 데이터 병합 (기존 데이터 우선)
  Object.keys(existingData).forEach((key) => {
    if (existingData[key] && pokemonDetails[key]) {
      pokemonDetails[key] = { ...pokemonDetails[key], ...existingData[key] };
    } else if (existingData[key]) {
      pokemonDetails[key] = existingData[key];
    }
  });

  // 파일 저장 (JavaScript 객체 형식으로)
  const finalContent = `const pokemonDetails = ${JSON.stringify(
    pokemonDetails,
    null,
    2
  ).replace(/"(\d+)":/g, "$1:")};

export default pokemonDetails;
`;

  fs.writeFileSync(filePath, finalContent, "utf8");
  console.log(
    `\n✓ 완료! ${
      Object.keys(pokemonDetails).length
    }개 포켓몬 데이터가 저장되었습니다.`
  );
  console.log(`파일 위치: ${filePath}`);
}

// 명령줄 인자 처리
// eslint-disable-next-line no-undef
const startId = parseInt(process.argv[2]) || 1;
// eslint-disable-next-line no-undef
const endId = parseInt(process.argv[3]) || 151;

generatePokemonDetails(startId, endId).catch(console.error);
