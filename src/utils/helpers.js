import { typeColors } from "./constants";

// 타입에 따른 카드 배경 그라데이션 생성 (Home 리스트용)
export const getCardBackground = (types) => {
  if (!types || types.length === 0) {
    return "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
  }

  const primaryType = types[0];
  const color1 = typeColors[primaryType]?.primary || "#f8fafc";
  const color2 = typeColors[primaryType]?.secondary || "#e2e8f0";

  if (types.length > 1) {
    const secondaryType = types[1];
    const color3 = typeColors[secondaryType]?.primary || color1;
    return `linear-gradient(135deg, ${color1}40 0%, ${color2}30 50%, ${color3}40 100%)`;
  }

  return `linear-gradient(135deg, ${color1}50 0%, ${color2}40 100%)`;
};

// 타입에 따른 3D 캔버스 배경 그라데이션 생성 (반짝이는 효과 포함)
export const getCanvasBackground = (types) => {
  if (!types || types.length === 0) {
    return `linear-gradient(135deg, rgba(99,102,241,0.45) 0%, rgba(15,23,42,0.9) 100%),
            radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(255,255,255,0.08) 0%, transparent 50%)`;
  }

  const primaryType = types[0];
  const color1 = typeColors[primaryType]?.primary || "#6366f1";
  const color2 = typeColors[primaryType]?.secondary || "#0f172a";

  // 반짝이는 효과를 위한 radial-gradient 추가
  const sparkleGradient = `
    radial-gradient(circle at 25% 35%, rgba(255,255,255,0.15) 0%, transparent 40%),
    radial-gradient(circle at 75% 65%, rgba(255,255,255,0.12) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)
  `;

  // 타입이 하나여도 primary와 secondary 색상으로 그라데이션 적용
  if (types.length > 1) {
    // 두 개 이상의 타입이면 두 타입의 색상으로 그라데이션
    const secondaryType = types[1];
    const color3 = typeColors[secondaryType]?.primary || color1;
    return `linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3} 100%),
            ${sparkleGradient}`;
  }

  // 단일 타입이어도 primary와 secondary로 그라데이션 적용
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%),
          ${sparkleGradient}`;
};

// 뷰 설정
export const VIEW_CONFIG = {
  cameraPos: [0, 3, 10],
  target: [0, 0, 0],
};

// API 기본 URL (개발 환경에서는 로컬, 프로덕션에서는 Vercel 도메인)
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * 포켓몬 ID에 따른 모델 경로 가져오기 (API 호출)
 * API가 실제 파일 시스템을 스캔하여 올바른 경로를 반환하므로,
 * 프론트엔드에서는 하드코딩 없이 API에만 의존합니다.
 *
 * @param {number} pokeId - 포켓몬 ID
 * @returns {Promise<string>} 모델 경로 또는 CDN URL
 */
export const getModelPath = async (pokeId) => {
  if (Number.isNaN(pokeId) || pokeId < 1) {
    // 유효하지 않은 ID면 기본 폴백 모델 반환
    return "/pokemon/131/a131.dae";
  }

  try {
    // API에서 모델 정보 조회 (API가 실제 파일을 찾아서 반환)
    // 기존 api/pokemon/index.js에 모델 조회 기능 추가됨
    const apiUrl = `${API_BASE_URL}/pokemon?id=${pokeId}`;
    console.log(`[API 호출] ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API 오류] ${response.status}:`,
        errorText.substring(0, 200)
      );
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    // Content-Type 확인
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`[API 오류] JSON이 아닌 응답:`, text.substring(0, 200));
      throw new Error(
        `API가 JSON을 반환하지 않았습니다. Content-Type: ${contentType}`
      );
    }

    const data = await response.json();
    console.log(`[API 성공] 포켓몬 ${pokeId}번:`, data);

    // 파일이 존재하지 않는 경우 처리
    if (!data.file_exists || !data.model_path || !data.url) {
      console.warn(`[경고] 포켓몬 ${pokeId}번 모델 파일이 없습니다.`);
      if (data.error) {
        console.warn(`[에러] ${data.error}`);
      }
      // 폴백 모델 반환 (131번 라프라스)
      return "/pokemon/131/a131.dae";
    }

    // 로컬 경로만 사용 (CDN 제거)
    if (data.model_path || data.url) {
      // CDN URL이 아닌 로컬 경로만 사용
      const finalUrl = data.model_path || data.url;

      // CDN URL인 경우 무시하고 로컬 경로 사용
      if (finalUrl && !finalUrl.startsWith("http")) {
        console.log(`[로컬 파일 사용] ${finalUrl}`);
        return finalUrl;
      }

      // CDN URL이면 로컬 경로로 변환 시도
      if (finalUrl && finalUrl.startsWith("http")) {
        console.warn(`[경고] CDN URL 감지, 로컬 경로로 대체: ${finalUrl}`);
        // CDN URL에서 로컬 경로 추출 시도
        const match = finalUrl.match(/pokemon\/(\d+)\/(.+)$/);
        if (match) {
          const localPath = `/pokemon/${match[1]}/${match[2]}`;
          console.log(`[로컬 경로로 변환] ${localPath}`);
          return localPath;
        }
      }
    }

    // API가 경로를 찾지 못한 경우에만 기본 패턴 사용
    const fallbackPadded = String(pokeId).padStart(4, "0");
    return `/pokemon/${pokeId}/pm${fallbackPadded}_00_00.dae`;
  } catch (error) {
    console.warn(`모델 경로 조회 실패 (${pokeId}):`, error.message);

    // 네트워크 오류 등으로 API 호출 자체가 실패한 경우에만 기본 패턴 사용
    // (API가 파일 시스템을 스캔하므로, API가 작동하면 항상 올바른 경로를 반환)
    const fallbackPadded = String(pokeId).padStart(4, "0");
    return `/pokemon/${pokeId}/pm${fallbackPadded}_00_00.dae`;
  }
};
