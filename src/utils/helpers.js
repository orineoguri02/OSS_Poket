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

// 포켓몬 ID에 따른 모델 경로 가져오기
export const getModelPath = (pokeId) => {
  if (pokeId === 1) return "/pokemon/1/pm0001_00_00.dae";
  if (pokeId === 4) return "/pokemon/4/hitokage.dae";
  if (pokeId === 5) return "/pokemon/5/lizardo.dae";
  if (pokeId === 6) return "/pokemon/6/lizardon.dae";
  if (pokeId === 7) return "/pokemon/7/zenigame.dae";
  if (pokeId === 8) return "/pokemon/8/kameil.dae";
  if (pokeId === 9) return "/pokemon/9/kamex.dae";
  if (pokeId === 10) return "/pokemon/10/caterpie.dae";
  if (pokeId === 11) return "/pokemon/11/transel.dae";
  if (pokeId === 12) return "/pokemon/12/Male/butterfree.dae";
  if (pokeId === 13) return "/pokemon/13/beedle.dae";
  if (pokeId === 14) return "/pokemon/14/cocoon.dae";
  if (pokeId === 131) return "/pokemon/131/a131.dae";

  const fallbackPadded = String(pokeId).padStart(4, "0");
  return `/pokemon/${pokeId}/pm${fallbackPadded}_00_00.dae`;
};