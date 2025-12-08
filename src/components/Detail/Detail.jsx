import React, { Suspense, useRef, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows } from "@react-three/drei";
import ModelLoader from "../../models/ModelLoader";
import {
  getCanvasBackground,
  VIEW_CONFIG,
  getModelPath,
} from "../../utils/helpers";
import { getPokemonDetails } from "../../utils/pokeapi";
import { usePokemon } from "../../contexts/PokemonContext";
import MyPokemonDropZone from "../MyPokemon/MyPokemonDropZone";

// 모델 등장 애니메이션 (150% -> 100%)
function AnimatedModel({ modelPath }) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      const currentScale = groupRef.current.scale.x;
      if (currentScale > 1) {
        const newScale = Math.max(1, currentScale - 0.02);
        groupRef.current.scale.set(newScale, newScale, newScale);
      }
    }
  });

  return (
    <group ref={groupRef} scale={1.5}>
      <ModelLoader modelPath={modelPath} />
    </group>
  );
}

// OrbitControls 래퍼 (3.0 속도로 한 바퀴 -> 1.0 속도)
function OrbitControlsWrapper({ viewConfig }) {
  const controlsRef = useRef();
  const startTimeRef = useRef(null);
  const hasCompletedOneRotationRef = useRef(false);

  useFrame((state) => {
    if (controlsRef.current) {
      if (startTimeRef.current === null) {
        startTimeRef.current = state.clock.elapsedTime;
      }

      const elapsed = state.clock.elapsedTime - startTimeRef.current;

      // 3.0 속도로 한 바퀴를 도는 시간 계산 (약 2.1초, 360도 / (3.0 * 약 57도/초))
      // autoRotateSpeed 3.0으로 한 바퀴를 도는 데 약 2.1초 소요
      const oneRotationTime = 2.1;

      if (!hasCompletedOneRotationRef.current) {
        // 한 바퀴를 돌 때까지 3.0 속도 유지
        controlsRef.current.autoRotateSpeed = 20.0;

        if (elapsed >= oneRotationTime) {
          hasCompletedOneRotationRef.current = true;
          controlsRef.current.autoRotateSpeed = 1.0;
        }
      } else {
        // 한 바퀴를 돈 후 1.0 속도로 유지
        controlsRef.current.autoRotateSpeed = 1.0;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI - Math.PI / 5}
      target={viewConfig.target}
      autoRotate={true}
      autoRotateSpeed={3.0}
      enableZoom={false}
      enablePan={false}
    />
  );
}

export default function Detail() {
  const { id } = useParams();
  const numericId = Number(id);
  const paddedId = String(numericId).padStart(4, "0");
  const { isPokemonSaved } = usePokemon();

  const [info, setInfo] = useState({
    nameKo: `포켓몬 No.${paddedId}`,
    nameEn: "Unknown",
    description: "아직 데이터가 등록되지 않았어요. 곧 업데이트될 예정입니다.",
    types: ["???"],
    height: "-",
    weight: "-",
    category: "포켓몬",
    ability: "-",
    gender: "-",
    captureRate: "-",
    rarity: "보통",
    isLegendary: false,
    cta: "정보 보기",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPokemonData = async () => {
      if (Number.isNaN(numericId) || numericId < 1) {
        setError("유효하지 않은 포켓몬 ID입니다.");
        return;
      }

      setError(null);

      try {
        const pokemonData = await getPokemonDetails(numericId);
        setInfo(pokemonData);
      } catch (err) {
        console.error("포켓몬 데이터 로드 실패:", err);
        setError("포켓몬 데이터를 불러올 수 없습니다.");
        setInfo({
          nameKo: `포켓몬 No.${paddedId}`,
          nameEn: "Unknown",
          description: "데이터를 불러올 수 없습니다.",
          types: ["???"],
          height: "-",
          weight: "-",
          category: "??? 포켓몬",
          ability: "-",
          gender: "-",
          captureRate: "-",
          rarity: "보통",
          isLegendary: false,
          cta: "도감 업데이트 알림 받기",
        });
      }
    };

    fetchPokemonData();
  }, [numericId, paddedId]);

  let modelPath = getModelPath(numericId);
  if (Number.isNaN(numericId)) {
    modelPath = "/pokemon/131/a131.dae";
  }

  const canvasBackground = getCanvasBackground(info.types);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        overflowX: "hidden",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding:
            "clamp(16px, 3vw, 40px) clamp(12px, 2vw, 20px) clamp(40px, 6vw, 60px)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
      >
        <Link
          to="/home"
          style={{
            alignSelf: "flex-start",
            padding: "10px 20px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "#0f172a",
            textDecoration: "none",
            borderRadius: "999px",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          ← 도감으로 돌아가기
        </Link>

        {error && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              borderRadius: "12px",
              border: "1px solid #fecaca",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div
          style={{
            width: "100%",
            minWidth: "280px",
          }}
        >
          <div
            className="canvas-background-container"
            style={{
              borderRadius: "clamp(16px, 2vw, 24px)",
              background: canvasBackground,
              backgroundSize: "200% 200%, 100% 100%, 100% 100%, 100% 100%",
              backgroundPosition: "0% 50%, 0% 0%, 0% 0%, 0% 0%",
              animation: "gradientShift 8s ease infinite",
              padding: "clamp(16px, 2.5vw, 24px)",
              boxShadow:
                "0 20px 40px rgba(0,0,0,0.2), inset 0 0 60px rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "clamp(20px, 3vw, 32px)",
            }}
          >
            {/* 3D 포켓몬 모델 */}
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("pokemonId", numericId.toString());
                e.dataTransfer.effectAllowed = "move";
                e.currentTarget.style.opacity = "0.7";
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              style={{
                width: "100%",
                flex: "1 1 auto",
                cursor: "grab",
                position: "relative",
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.cursor = "grabbing";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.cursor = "grab";
              }}
            >
              {isPokemonSaved(numericId) && (
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    backgroundColor: "rgba(59, 130, 246, 0.9)",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <span>✓</span>
                  <span>저장됨</span>
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  zIndex: 10,
                  backdropFilter: "blur(10px)",
                }}
              >
                드래그하여 저장
              </div>
              <Canvas
                style={{
                  height: "clamp(300px, 50vh, 600px)",
                  width: "100%",
                  minHeight: "300px",
                }}
                camera={{
                  position: VIEW_CONFIG.cameraPos,
                  fov: 45,
                  near: 0.05,
                  far: 50000,
                }}
              >
                <OrbitControlsWrapper viewConfig={VIEW_CONFIG} />
                <ambientLight intensity={0.9} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <Suspense
                  fallback={
                    <Html center>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "20px",
                        }}
                      >
                        <img
                          src="/LoadingImage.jpg"
                          alt="Loading"
                          style={{
                            width: "200px",
                            height: "200px",
                            objectFit: "contain",
                          }}
                        />
                        <h2 style={{ color: "white", margin: 0 }}>loading</h2>
                      </div>
                    </Html>
                  }
                >
                  <AnimatedModel modelPath={modelPath} />
                  <ContactShadows
                    position={[0, -1.2, 0]}
                    opacity={0.35}
                    scale={20}
                    blur={2.5}
                    far={2}
                  />
                </Suspense>
              </Canvas>
            </div>

            {/* 정보 카드 */}
            <div
              className="info-card-glass"
              style={{
                width: "100%",
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)",
                borderRadius: "clamp(16px, 2vw, 24px)",
                padding: "clamp(24px, 4vw, 40px)",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.7) inset, 0 2px 8px rgba(255, 255, 255, 0.5) inset",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.7)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 반짝이는 오버레이 효과 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)",
                  animation: "shimmer 3s infinite",
                }}
              />
              <p
                style={{
                  color: "#64748b",
                  fontWeight: 600,
                  margin: 0,
                  fontSize: "clamp(12px, 2vw, 14px)",
                }}
              >
                No.{paddedId}
              </p>
              <h1
                style={{
                  margin: "8px 0 0",
                  fontSize: "clamp(28px, 5vw, 42px)",
                  color: "#0f172a",
                }}
              >
                {info.nameKo}
              </h1>
              <p
                style={{
                  margin: "4px 0 18px",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "clamp(14px, 2.5vw, 18px)",
                }}
              >
                {info.nameEn}
              </p>

              <p
                style={{
                  lineHeight: 1.6,
                  color: "#475569",
                  marginBottom: "28px",
                }}
              >
                {info.description}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "clamp(8px, 1.5vw, 12px)",
                  flexWrap: "wrap",
                  marginBottom: "clamp(20px, 3vw, 24px)",
                  width: "100%",
                }}
              >
                {info.types.map((type) => (
                  <span
                    key={type}
                    style={{
                      padding:
                        "clamp(8px, 1.5vw, 10px) clamp(14px, 2.5vw, 18px)",
                      borderRadius: "clamp(12px, 1.5vw, 16px)",
                      backgroundColor: "#eef2ff",
                      color: "#4338ca",
                      fontWeight: 600,
                      fontSize: "clamp(12px, 1.8vw, 14px)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "clamp(12px, 2vw, 18px)",
                  marginBottom: "clamp(24px, 4vw, 32px)",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {[
                  { label: "분류", value: info.category },
                  { label: "키", value: info.height },
                  { label: "몸무게", value: info.weight },
                  { label: "특성", value: info.ability },
                  { label: "성별", value: info.gender },
                  {
                    label: "희귀도",
                    value: info.isLegendary ? "전설 · 환상" : info.rarity,
                  },
                  { label: "포획률", value: info.captureRate },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="info-grid-item"
                    style={{
                      padding: "clamp(12px, 2vw, 14px)",
                      borderRadius: "clamp(12px, 1.5vw, 16px)",
                      background:
                        "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)",
                      boxSizing: "border-box",
                      minWidth: 0,
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      boxShadow:
                        "0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2) inset",
                      backdropFilter: "blur(10px)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 20px 35px rgba(220,38,38,0.25)",
                }}
                onClick={() =>
                  window.open("https://www.pokemonkorea.co.kr/", "_blank")
                }
              >
                {info.cta}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 드래그 앤 드롭 존 */}
      <MyPokemonDropZone />
    </div>
  );
}
