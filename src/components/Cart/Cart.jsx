import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePokemon } from "../../contexts/PokemonContext";
import { getPokemon, getPokemonSpecies } from "../../utils/pokeapi";
import { getCardBackground } from "../../utils/helpers";
import { typeNameMap } from "../../utils/constants";

export default function Cart() {
  const navigate = useNavigate();
  const { myPokemon, removePokemon, loading } = usePokemon();
  const [pokemonDetails, setPokemonDetails] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // 저장된 포켓몬들의 상세 정보 불러오기
  useEffect(() => {
    const loadPokemonDetails = async () => {
      if (myPokemon.length === 0) {
        setPokemonDetails([]);
        setIsLoadingDetails(false);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const details = await Promise.all(
          myPokemon.map(async (id) => {
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
        setPokemonDetails(details.filter(Boolean));
      } catch (error) {
        console.error("포켓몬 상세 정보 로드 실패:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadPokemonDetails();
  }, [myPokemon]);

  const handleRemovePokemon = async (pokemonId) => {
    if (window.confirm(`포켓몬 No. ${pokemonId}를 장바구니에서 삭제하시겠습니까?`)) {
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
        width: "100vw",
        boxSizing: "border-box",
        paddingTop: "100px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <h1 style={{ color: "#333", margin: 0 }}>
            🛒 장바구니 ({myPokemon.length})
          </h1>
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#4b5563";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#6b7280";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ← 홈으로
          </button>
        </div>

        {/* 로딩 중 */}
        {isLoadingDetails ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "15px",
              padding: "40px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#666" }}>장바구니를 불러오는 중...</p>
          </div>
        ) : pokemonDetails.length === 0 ? (
          /* 비어있을 때 */
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "15px",
              padding: "40px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#666", fontSize: "16px", marginBottom: "20px" }}>
              장바구니가 비어있습니다.
            </p>
            <p style={{ color: "#999", fontSize: "14px", marginBottom: "20px" }}>
              홈에서 포켓몬 카드를 드래그해서 포켓몬볼에 드롭하면 장바구니에 추가됩니다!
            </p>
            <button
              onClick={() => navigate("/home")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              포켓몬 담으러 가기
            </button>
          </div>
        ) : (
          /* 포켓몬 목록 */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "20px",
            }}
          >
            {pokemonDetails.map((pokemon) => (
              <div
                key={pokemon.id}
                style={{
                  position: "relative",
                }}
              >
                <Link
                  to={`/pokemon/${pokemon.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: getCardBackground(pokemon.types),
                      borderRadius: "15px",
                      padding: "15px",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(0,0,0,0.1)",
                      textAlign: "center",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                      border: "2px solid #3b82f6",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4), 0 6px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(0,0,0,0.1)";
                    }}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                      alt={pokemon.name}
                      style={{ width: "100%", height: "auto" }}
                      loading="lazy"
                    />
                    <p
                      style={{
                        margin: "10px 0 5px",
                        color: "#555",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      No. {pokemon.id}
                    </p>
                    <p
                      style={{
                        margin: "0",
                        color: "#666",
                        fontSize: "12px",
                      }}
                    >
                      {pokemon.name}
                    </p>
                  </div>
                </Link>
                
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemovePokemon(pokemon.id);
                  }}
                  disabled={loading}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(220, 38, 38, 0.9)",
                    color: "white",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    transition: "all 0.2s",
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = "rgba(185, 28, 28, 1)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.9)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="장바구니에서 삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

