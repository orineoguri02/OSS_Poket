import React from "react";
import { Link } from "react-router-dom";
import { usePokemon } from "../../contexts/PokemonContext";

export default function MyPokemonList() {
  const { myPokemon, removePokemon, loading } = usePokemon();

  const handleRemove = async (e, pokemonId) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("이 포켓몬을 삭제하시겠습니까?")) {
      try {
        await removePokemon(pokemonId);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  if (myPokemon.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "#666",
        }}
      >
        <p style={{ margin: 0, fontSize: "16px" }}>
          아직 저장된 포켓몬이 없습니다.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "14px" }}>
          포켓몬을 드래그하여 저장하세요!
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: "20px",
        padding: "20px",
      }}
    >
      {myPokemon.map((id) => (
        <div
          key={id}
          style={{
            position: "relative",
            backgroundColor: "white",
            borderRadius: "15px",
            padding: "10px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            textAlign: "center",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Link
            to={`/pokemon/${id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
              alt={`Pokemon ${id}`}
              style={{ width: "100%", height: "auto" }}
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
          </Link>
          <button
            onClick={(e) => handleRemove(e, id)}
            disabled={loading}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "rgba(220, 38, 38, 0.9)",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              transition: "all 0.2s",
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
            title="삭제"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
