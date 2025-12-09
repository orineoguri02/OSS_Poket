import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePokemon } from "../../contexts/PokemonContext";
import MyPokemonDropZone from "../MyPokemon/MyPokemonDropZone";
import Header from "./Header";
import { getPokemonListData } from "../../utils/pokeapi";
import { getCardBackground } from "../../utils/helpers";

export default function Home() {
  const { isPokemonSaved, removePokemon, loading } = usePokemon();
  const [hoveredPokemonId, setHoveredPokemonId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);
  const [allPokemon, setAllPokemon] = useState([]);
  const [isLoadingPokemon, setIsLoadingPokemon] = useState(true);

  // 앱 시작 시 한 번만 모든 포켓몬 데이터 로드 (캐시 적용)
  useEffect(() => {
    const loadAllPokemon = async () => {
      setIsLoadingPokemon(true);
      try {
        const pokemonList = await getPokemonListData(1, 151);
        setAllPokemon(pokemonList);
      } catch (error) {
        console.error("포켓몬 데이터 로드 실패:", error);
      } finally {
        setIsLoadingPokemon(false);
      }
    };

    loadAllPokemon();
  }, []);

  // 검색 및 필터링 - 이미 로드된 데이터에서만 필터링 (API 호출 없음)
  const displayedPokemon = useMemo(() => {
    if (isLoadingPokemon) return [];

    let filtered = [...allPokemon];

    // 저장된 포켓몬만 보기 필터
    if (filterSavedOnly) {
      filtered = filtered.filter((pokemon) => isPokemonSaved(pokemon.id));
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((pokemon) => {
        // 번호로 검색
        if (pokemon.id.toString().includes(query)) return true;
        // 이름으로 검색
        return pokemon.name.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [
    allPokemon,
    searchQuery,
    filterSavedOnly,
    isPokemonSaved,
    isLoadingPokemon,
  ]);

  const handleDragStart = (e, pokemonId) => {
    e.dataTransfer.setData("pokemonId", pokemonId.toString());
    e.dataTransfer.effectAllowed = "move";
    // 드래그 중인 요소에 시각적 피드백
    e.currentTarget.style.opacity = "0.5";
    // 드래그 시작 시 장바구니 표시
    setIsDragging(true);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    // 드래그 종료 시 장바구니 숨김 (로딩 중이 아닐 때만)
    // 로딩 중이면 포켓몬볼이 계속 보이도록 유지
    if (!loading) {
      setTimeout(() => {
        setIsDragging(false);
      }, 300);
    }
  };

  const handleRemovePokemon = async (e, pokemonId) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      window.confirm(`포켓몬 No. ${pokemonId}를 장바구니에서 삭제하시겠습니까?`)
    ) {
      try {
        await removePokemon(pokemonId);
      } catch (error) {
        alert(error.message || "삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div
      style={{
        padding: "20px 10px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        width: "100%", // 100vw 대신 100% 사용
        maxWidth: "100vw", // 최대 너비 제한
        boxSizing: "border-box", // 패딩 포함해서 너비 계산
        paddingTop: "100px", // fixed header 공간 확보
        overflowX: "hidden", // 가로 스크롤 방지
      }}
    >
      <Header
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterSavedOnly}
      />

      <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
        궁금한 포켓몬을 클릭해서 3D로 자세히 살펴보세요!
      </p>

      {/* CSS Grid를 이용한 반응형 그리드 레이아웃 */}
      <div
        style={{
          display: "grid",
          padding: "0 clamp(20px, 5vw, 40px)",
          // 화면 크기에 따라 컬럼 개수 자동 조절 (최소 120px 너비 보장)
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "20px",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box", // 패딩이 너비에 포함되도록
        }}
      >
        {isLoadingPokemon ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "40px 20px",
              color: "#666",
            }}
          >
            <p>포켓몬 데이터를 불러오는 중...</p>
          </div>
        ) : displayedPokemon.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "40px 20px",
              color: "#999",
            }}
          >
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          displayedPokemon.map((pokemon) => (
            // Link 컴포넌트: 클릭 시 '/pokemon/{id}' 경로로 이동
            <Link
              to={`/pokemon/${pokemon.id}`}
              key={pokemon.id}
              style={{ textDecoration: "none" }}
            >
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, pokemon.id)}
                onDragEnd={handleDragEnd}
                style={{
                  background: getCardBackground(pokemon.types),
                  borderRadius: "15px",
                  padding: "10px",
                  boxShadow: isPokemonSaved(pokemon.id)
                    ? "0 4px 12px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(0,0,0,0.1)"
                    : "0 4px 8px rgba(0,0,0,0.1)",
                  textAlign: "center",
                  transition: "transform 0.2s, opacity 0.2s, box-shadow 0.2s",
                  cursor: "grab",
                  position: "relative",
                  border: isPokemonSaved(pokemon.id)
                    ? "2px solid #3b82f6"
                    : "2px solid rgba(255,255,255,0.5)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.cursor = "grab";
                  if (isPokemonSaved(pokemon.id)) {
                    setHoveredPokemonId(pokemon.id);
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.cursor = "grab";
                  setHoveredPokemonId(null);
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.cursor = "grabbing";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.cursor = "grab";
                }}
              >
                {isPokemonSaved(pokemon.id) && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        zIndex: 2,
                      }}
                      title="저장됨"
                    >
                      ✓
                    </div>
                    {hoveredPokemonId === pokemon.id && (
                      <button
                        onClick={(e) => handleRemovePokemon(e, pokemon.id)}
                        disabled={loading}
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(220, 38, 38, 0.9)",
                          color: "white",
                          border: "none",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          transition: "all 0.2s",
                          zIndex: 3,
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor =
                              "rgba(185, 28, 28, 1)";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(220, 38, 38, 0.9)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="장바구니에서 삭제"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
                {/* 포켓몬 공식 일러스트 이미지 */}
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                  alt={`Pokemon ${pokemon.id}`}
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
                  No. {pokemon.id}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* 드래그 앤 드롭 존 */}
      <MyPokemonDropZone
        isVisible={isDragging || loading}
        onDropComplete={() => {
          // 로딩이 완료된 후에만 포켓몬볼 숨김
          if (!loading) {
            setIsDragging(false);
          }
        }}
      />
    </div>
  );
}
