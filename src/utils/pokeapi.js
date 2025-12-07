// PokeAPI 유틸리티 함수
import { typeNameMap } from './constants';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * 포켓몬 기본 정보 가져오기
 * @param {number} id - 포켓몬 ID
 * @returns {Promise<Object>}
 */
export async function getPokemon(id) {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);
    if (!response.ok) throw new Error('포켓몬 데이터를 가져올 수 없습니다.');
    return await response.json();
  } catch (error) {
    console.error(`포켓몬 ${id} 데이터 로드 실패:`, error);
    throw error;
  }
}

/**
 * 포켓몬 종족 정보 가져오기 (한국어 이름, 설명 등)
 * @param {number} id - 포켓몬 ID
 * @returns {Promise<Object>}
 */
export async function getPokemonSpecies(id) {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${id}`);
    if (!response.ok) throw new Error('포켓몬 종족 데이터를 가져올 수 없습니다.');
    return await response.json();
  } catch (error) {
    console.error(`포켓몬 종족 ${id} 데이터 로드 실패:`, error);
    throw error;
  }
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
      cta: `${nameKo} 정보 보기`,
    };
  } catch (error) {
    console.error(`포켓몬 ${id} 상세 정보 로드 실패:`, error);
    throw error;
  }
}

