import React, { useState } from "react";
import { usePokemon } from "../../contexts/PokemonContext";

export default function MyPokemonDropZone() {
  const { myPokemon, addPokemon, loading } = usePokemon();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropFeedback, setDropFeedback] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const pokemonId = e.dataTransfer.getData("pokemonId");
    if (!pokemonId) return;

    const id = Number(pokemonId);

    // 이미 저장된 포켓몬인지 확인
    if (myPokemon.includes(id)) {
      setDropFeedback("이미 저장된 포켓몬입니다!");
      setTimeout(() => setDropFeedback(null), 2000);
      return;
    }

    try {
      await addPokemon(id);
      setDropFeedback("포켓몬이 추가되었습니다! ✨");
      setTimeout(() => setDropFeedback(null), 2000);
    } catch (error) {
      setDropFeedback("저장에 실패했습니다. 다시 시도해주세요.");
      setTimeout(() => setDropFeedback(null), 2000);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "600px",
        minHeight: "120px",
        backgroundColor: isDraggingOver
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(255, 255, 255, 0.95)",
        border: isDraggingOver
          ? "3px dashed #3b82f6"
          : "3px dashed rgba(0, 0, 0, 0.2)",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: isDraggingOver
          ? "0 8px 32px rgba(59, 130, 246, 0.3)"
          : "0 4px 16px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
        zIndex: 1000,
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      {dropFeedback ? (
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: dropFeedback.includes("실패")
              ? "#dc2626"
              : dropFeedback.includes("이미")
              ? "#f59e0b"
              : "#10b981",
            textAlign: "center",
          }}
        >
          {dropFeedback}
        </p>
      ) : (
        <>
          <div
            style={{
              fontSize: "32px",
              marginBottom: "8px",
            }}
          >
            {isDraggingOver ? "🎯" : "📦"}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              textAlign: "center",
            }}
          >
            {isDraggingOver
              ? "여기에 놓으세요!"
              : "포켓몬을 여기로 드래그하여 저장하세요"}
          </p>
          {myPokemon.length > 0 && (
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#666",
                textAlign: "center",
              }}
            >
              저장된 포켓몬: {myPokemon.length}마리
            </p>
          )}
        </>
      )}
      {loading && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "14px",
            color: "#3b82f6",
          }}
        >
          저장 중...
        </div>
      )}
    </div>
  );
}
