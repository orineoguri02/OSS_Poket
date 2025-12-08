import React, { useState, useEffect } from "react";
import { usePokemon } from "../../contexts/PokemonContext";

export default function MyPokemonDropZone({
  isVisible = false,
  onDropComplete,
  onLoadingStart,
}) {
  const { myPokemon, addPokemon, loading } = usePokemon();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropFeedback, setDropFeedback] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAddingPokemon, setIsAddingPokemon] = useState(false);

  // 포켓몬볼이 보일 때 열린 상태로 시작 (포켓몬 추가 중이 아닐 때만)
  useEffect(() => {
    if (isVisible && !isClosing && !isAddingPokemon) {
      setIsOpen(true);
    }
  }, [isVisible, isClosing, isAddingPokemon]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
    if (!isOpen) {
      setIsOpen(true);
    }
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
    if (!pokemonId) {
      // 포켓몬볼 닫기
      setIsClosing(true);
      setIsOpen(false);
      setTimeout(() => {
        if (onDropComplete) {
          onDropComplete();
        }
        setIsClosing(false);
      }, 500);
      return;
    }

    const id = Number(pokemonId);

    // 이미 저장된 포켓몬인지 확인
    if (myPokemon.includes(id)) {
      setDropFeedback("이미 저장된 포켓몬입니다!");
      setTimeout(() => {
        setDropFeedback(null);
        // 포켓몬볼 닫기
        setIsClosing(true);
        setIsOpen(false);
        if (onDropComplete) {
          setTimeout(() => {
            onDropComplete();
            setIsClosing(false);
          }, 500);
        }
      }, 1500);
      return;
    }

    try {
      setIsAddingPokemon(true);
      // 드롭 후 포켓몬볼 닫기
      setIsOpen(false);
      if (onLoadingStart) {
        onLoadingStart();
      }
      await addPokemon(id);
      // 로딩이 완료될 때까지 포켓몬볼 유지 (useEffect에서 처리)
    } catch (error) {
      setIsAddingPokemon(false);
      setIsOpen(false);
      setDropFeedback("저장에 실패했습니다. 다시 시도해주세요.");
      setTimeout(() => {
        setDropFeedback(null);
        // 포켓몬볼 닫기
        setIsClosing(true);
        setIsOpen(false);
        if (onDropComplete) {
          setTimeout(() => {
            onDropComplete();
            setIsClosing(false);
          }, 500);
        }
      }, 1500);
    }
  };

  // 로딩이 완료되면 포켓몬볼 닫기
  useEffect(() => {
    if (isAddingPokemon && !loading) {
      // 로딩이 완료되었고 포켓몬 추가 중이었으면
      setIsAddingPokemon(false);
      setDropFeedback("포켓몬이 추가되었습니다! ✨");
      // 포켓몬볼 닫기 애니메이션 (피드백 표시 후)
      setTimeout(() => {
        setDropFeedback(null);
        // 포켓몬볼 닫기
        setIsClosing(true);
        setIsOpen(false);
        setTimeout(() => {
          if (onDropComplete) {
            onDropComplete();
          }
          setIsClosing(false);
        }, 500);
      }, 1500);
    }
  }, [loading, isAddingPokemon, onDropComplete]);

  // 드래그가 끝났을 때 장바구니 숨김 처리
  useEffect(() => {
    if (!isVisible) {
      setIsOpen(false);
      setIsClosing(false);
      setIsAddingPokemon(false);
      return;
    }

    const handleDragEnd = (e) => {
      // 드롭 존 밖에서 드래그가 끝난 경우에만 숨김
      if (!e.target.closest("[data-drop-zone]")) {
        setIsClosing(true);
        setIsOpen(false);
        setTimeout(() => {
          if (onDropComplete) {
            onDropComplete();
          }
          setIsClosing(false);
        }, 500);
      }
    };

    document.addEventListener("dragend", handleDragEnd);
    return () => {
      document.removeEventListener("dragend", handleDragEnd);
    };
  }, [isVisible, onDropComplete]);

  return (
    <div
      data-drop-zone
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: "fixed",
        bottom: isVisible ? "20px" : "-300px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "200px",
        height: "200px",
        transition: "bottom 0.5s ease, opacity 0.3s ease",
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 포켓몬볼 컨테이너 */}
      <div
        style={{
          position: "relative",
          width: "200px",
          height: isOpen && !isClosing ? "300px" : "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          overflow: "visible",
          transition: "height 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          animation:
            loading && isAddingPokemon
              ? "shake 2s ease-in-out infinite"
              : "none",
        }}
      >
        {/* 포켓몬볼 상단 (빨간색) - 열림/닫힘 애니메이션 */}
        <div
          style={{
            width: "200px",
            height: "100px",
            backgroundColor: "#ef4444",
            border: "8px solid #1a1a1a",
            borderBottom: "4px solid #1a1a1a",
            borderRadius: "100px 100px 0 0",
            boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
            position: "relative",
            zIndex: 3,
            transform:
              isOpen && !isClosing ? "translateY(-100px)" : "translateY(0)",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* 포켓몬볼 하단 (흰색) */}
        <div
          style={{
            width: "200px",
            height: "100px",
            backgroundColor: "#ffffff",
            border: "8px solid #1a1a1a",
            borderTop: "4px solid #1a1a1a",
            borderRadius: "0 0 100px 100px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            position: "relative",
            zIndex: 2,
          }}
        />

        {/* 중앙 버튼 - 빨간색과 흰색의 경계 중앙에 위치, 열릴 때 빨간색과 함께 이동 */}
        <div
          style={{
            position: "absolute",
            top: isOpen && !isClosing ? "30px" : "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            border: "6px solid #1a1a1a",
            boxShadow:
              "inset 0 0 10px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
            transition: "top 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: "#f0f0f0",
              border: "2px solid #1a1a1a",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          />
        </div>

        {/* 드래그 오버 시 빛나는 효과 */}
        {isDraggingOver && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              backgroundColor: "rgba(59, 130, 246, 0.3)",
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)",
              zIndex: 1,
              animation: "pulse 1s ease-in-out infinite",
            }}
          />
        )}

        {/* 피드백 메시지 */}
        {dropFeedback && (
          <div
            style={{
              position: "absolute",
              top: "-60px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
              whiteSpace: "nowrap",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            {dropFeedback}
          </div>
        )}
      </div>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.6;
            }
          }
          @keyframes shake {
            0% {
              transform: translateX(0) rotate(0deg);
            }
            2.5% {
              transform: translateX(-10px) rotate(-5deg);
            }
            5% {
              transform: translateX(10px) rotate(5deg);
            }
            7.5% {
              transform: translateX(-10px) rotate(-5deg);
            }
            10% {
              transform: translateX(10px) rotate(5deg);
            }
            12.5% {
              transform: translateX(-8px) rotate(-3deg);
            }
            15% {
              transform: translateX(8px) rotate(3deg);
            }
            17.5% {
              transform: translateX(-6px) rotate(-2deg);
            }
            20% {
              transform: translateX(6px) rotate(2deg);
            }
            22.5% {
              transform: translateX(-4px) rotate(-1deg);
            }
            25% {
              transform: translateX(0) rotate(0deg);
            }
            /* 25% ~ 75%: 정지 상태 (1초) */
            75% {
              transform: translateX(0) rotate(0deg);
            }
            77.5% {
              transform: translateX(-10px) rotate(-5deg);
            }
            80% {
              transform: translateX(10px) rotate(5deg);
            }
            82.5% {
              transform: translateX(-10px) rotate(-5deg);
            }
            85% {
              transform: translateX(10px) rotate(5deg);
            }
            87.5% {
              transform: translateX(-8px) rotate(-3deg);
            }
            90% {
              transform: translateX(8px) rotate(3deg);
            }
            92.5% {
              transform: translateX(-6px) rotate(-2deg);
            }
            95% {
              transform: translateX(6px) rotate(2deg);
            }
            97.5% {
              transform: translateX(-4px) rotate(-1deg);
            }
            100% {
              transform: translateX(0) rotate(0deg);
            }
          }
        `}
      </style>
    </div>
  );
}
