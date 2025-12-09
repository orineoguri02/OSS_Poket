// PokeAPI 유틸리티 함수
import { typeNameMap } from './constants';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// 메모리 캐시 (앱 실행 중 유지)
const cache = {
  pokemon: new Map(),
  species: new Map(),
};

// localStorage 캐시 키
const CACHE_KEY = 'pokemon_list_cache';
const CACHE_VERSION = 'v1';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24시간

/**
 * localStorage에서 캐시 데이터 가져오기
 */
function getLocalCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { version, timestamp, data } = JSON.parse(cached);
    if (version !== CACHE_VERSION) return null;
    if (Date.now() - timestamp > CACHE_EXPIRY) return null;
    
    return data;
  } catch {
    return null;
  }
}

/**
 * localStorage에 캐시 데이터 저장
 */
function setLocalCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    }));
  } catch (e) {
    console.warn('캐시 저장 실패:', e);
  }
}

/**
 * 포켓몬 기본 정보 가져오기 (캐시 적용)
 * @param {number} id - 포켓몬 ID
 * @returns {Promise<Object>}
 */
export async function getPokemon(id) {
  // 메모리 캐시 확인
  if (cache.pokemon.has(id)) {
    return cache.pokemon.get(id);
  }
  
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);
    if (!response.ok) throw new Error('포켓몬 데이터를 가져올 수 없습니다.');
    const data = await response.json();
    cache.pokemon.set(id, data);
    return data;
  } catch (error) {
    console.error(`포켓몬 ${id} 데이터 로드 실패:`, error);
    throw error;
  }
}

/**
 * 포켓몬 종족 정보 가져오기 (캐시 적용)
 * @param {number} id - 포켓몬 ID
 * @returns {Promise<Object>}
 */
export async function getPokemonSpecies(id) {
  // 메모리 캐시 확인
  if (cache.species.has(id)) {
    return cache.species.get(id);
  }
  
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${id}`);
    if (!response.ok) throw new Error('포켓몬 종족 데이터를 가져올 수 없습니다.');
    const data = await response.json();
    cache.species.set(id, data);
    return data;
  } catch (error) {
    console.error(`포켓몬 종족 ${id} 데이터 로드 실패:`, error);
    throw error;
  }
}

/**
 * 리스트용 포켓몬 데이터 일괄 로드 (최적화 버전)
 * - localStorage 캐시 사용
 * - 병렬 요청으로 빠른 로딩
 * @param {number} startId - 시작 ID
 * @param {number} endId - 끝 ID
 * @returns {Promise<Array>}
 */
export async function getPokemonListData(startId = 1, endId = 151) {
  // localStorage 캐시 확인
  const cached = getLocalCache();
  if (cached && cached.length >= (endId - startId + 1)) {
    console.log('📦 캐시에서 포켓몬 데이터 로드');
    return cached;
  }
  
  console.log('🌐 API에서 포켓몬 데이터 로드 중...');
  const results = [];
  const batchSize = 50; // 더 큰 배치로 빠르게
  
  for (let i = startId; i <= endId; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, endId + 1); j++) {
      batch.push(j);
    }
    
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const [pokemon, species] = await Promise.all([
            getPokemon(id),
            getPokemonSpecies(id),
          ]);
          
          const nameKo = species.names?.find((n) => n.language.name === 'ko')?.name || `포켓몬 ${id}`;
          const types = pokemon.types.map((t) => typeNameMap[t.type.name] || t.type.name);
          
          return { id, name: nameKo, types };
        } catch (error) {
          console.error(`포켓몬 ${id} 로드 실패:`, error);
          return { id, name: `포켓몬 ${id}`, types: [] };
        }
      })
    );
    
    results.push(...batchResults);
  }
  
  // localStorage에 캐시 저장
  setLocalCache(results);
  console.log('✅ 포켓몬 데이터 로드 완료 및 캐시 저장');
  
  return results;
}

/**
 * 포켓몬 상세 정보 가져오기 (기본 정보 + 종족 정보 통합)
 * @param {number} id - 포켓몬 ID
 * @returns {Promise<Object>}
 */
export async function getPokemonDetails(id) {
  try {
    const [pokemon, species] = await Promise.all([
      getPokemon(id),
      getPokemonSpecies(id),
    ]);

    // 한국어 이름 찾기
    const nameKo = species.names?.find((n) => n.language.name === 'ko')?.name || species.name;

    // 한국어 설명 찾기 (게임 버전별로 여러 개 있을 수 있음)
    const flavorTextEntries = species.flavor_text_entries?.filter(
      (entry) => entry.language.name === 'ko'
    );
    const description = flavorTextEntries?.[0]?.flavor_text?.replace(/\f/g, ' ') || 
                       flavorTextEntries?.[flavorTextEntries.length - 1]?.flavor_text?.replace(/\f/g, ' ') || 
                       '설명이 없습니다.';

    // 타입 정보
    const types = pokemon.types.map((t) => {
      const typeName = t.type.name;
      return typeNameMap[typeName] || typeName;
    });

    // 분류 (genus)
    const category = species.genera?.find((g) => g.language.name === 'ko')?.genus || 
                    species.genera?.[0]?.genus || 
                    '포켓몬';

    // 특성 (ability)
    const ability = pokemon.abilities
      ?.find((a) => !a.is_hidden)?.ability?.name || 
      pokemon.abilities?.[0]?.ability?.name || 
      '-';

    // 성별 비율
    const genderRate = species.gender_rate;
    let gender = '-';
    if (genderRate === -1) {
      gender = '성별 없음';
    } else if (genderRate === 0) {
      gender = '수 ♂';
    } else if (genderRate === 8) {
      gender = '암 ♀';
    } else {
      const femaleRate = (genderRate / 8) * 100;
      const maleRate = 100 - femaleRate;
      gender = `수 ♂ / 암 ♀ (${Math.round(maleRate)}% / ${Math.round(femaleRate)}%)`;
    }

    // 포획 난이도 (capture_rate: 0~255, 낮을수록 잡기 어려움)
    const captureRate = species.capture_rate;
    let rarity = "보통";
    if (captureRate <= 25) {
      rarity = "매우 낮음 (희귀)";
    } else if (captureRate <= 45) {
      rarity = "낮음";
    } else if (captureRate >= 150) {
      rarity = "높음 (잘 잡힘)";
    }

    // 전설/환상 여부
    const isLegendary = Boolean(species.is_legendary || species.is_mythical);

    return {
      nameKo,
      nameEn: species.names?.find((n) => n.language.name === 'en')?.name || pokemon.name,
      description,
      types,
      height: `${(pokemon.height / 10).toFixed(1)} m`,
      weight: `${(pokemon.weight / 10).toFixed(1)} kg`,
      category: category.replace('포켓몬', '').trim() + ' 포켓몬',
      ability,
      gender,
      captureRate,
      rarity,
      isLegendary,
      cta: `${nameKo} 정보 보기`,
    };
  } catch (error) {
    console.error(`포켓몬 ${id} 상세 정보 로드 실패:`, error);
    throw error;
  }
}

