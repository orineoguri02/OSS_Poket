import React from "react";
import { Link } from "react-router-dom";
import Header from "./Header";

export default function Home() {
  // 1번(이상해씨)부터 151번(뮤)까지 1세대 포켓몬 ID 배열 생성
  const pokemonIds = Array.from({ length: 151 }, (_, i) => i + 1);

  return (
    <div
      style={{
        padding: "20px 10px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        width: "100vw", // 기기 가로 전체 사용
        boxSizing: "border-box", // 패딩 포함해서 100vw 계산
        paddingTop: "100px", // fixed header 공간 확보
      }}
      >
      <Header />

      <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
        궁금한 포켓몬을 클릭해서 3D로 자세히 살펴보세요!
      </p>

      {/* CSS Grid를 이용한 반응형 그리드 레이아웃 */}
      <div
        style={{
          display: "grid",
          // 화면 크기에 따라 컬럼 개수 자동 조절 (최소 120px 너비 보장)
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "20px",
          width: "100%", // 기기 너비에 맞게 가로를 꽉 채움
        }}
      >
        {pokemonIds.map((id) => (
          // Link 컴포넌트: 클릭 시 '/pokemon/{id}' 경로로 이동
          <Link
            to={`/pokemon/${id}`}
            key={id}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "15px",
                padding: "10px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                textAlign: "center",
                transition: "transform 0.2s",
                cursor: "pointer",
              }}
              // 마우스 호버 효과 (살짝 커짐) - 실제론 CSS 클래스로 하는 게 좋지만 간단히 인라인으로 처리
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              {/* 포켓몬 공식 일러스트 이미지 */}
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                alt={`Pokemon ${id}`}
                style={{ width: "100%", height: "auto" }}
                // 이미지 로딩 최적화
                loading="lazy"
              />
              <p
                style={{
                  margin: "10px 0 0",
                  color: "#555",
                  fontWeight: "bold",
                }}
              >
                No. {id}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

