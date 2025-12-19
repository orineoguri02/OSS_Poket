import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ModelLoader from "../../models/ModelLoader";

export default function ModelTest() {
  const [modelPath, setModelPath] = useState("/pokemon/1/fushigidane.dae");
  const [testResults, setTestResults] = useState([]);

  const testModels = [
    { id: 1, name: "이상해씨", path: "/pokemon/1/fushigidane.dae" },
    { id: 3, name: "이상해꽃", path: "/pokemon/3/pm0003_00_00.dae" },
    { id: 8, name: "어니부기", path: "/pokemon/8/kameil.dae" },
    { id: 9, name: "거북왕", path: "/pokemon/9/kamex.dae" },
  ];

  const handleTest = (path, name) => {
    console.log(`[테스트 시작] ${name} - ${path}`);
    setModelPath(path);
    setTestResults((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), model: name, path },
    ]);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ color: "white", marginBottom: "20px" }}>
          모델 로딩 테스트 페이지
        </h1>

        {/* 테스트 버튼들 */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {testModels.map((model) => (
            <button
              key={model.id}
              onClick={() => handleTest(model.path, model.name)}
              style={{
                padding: "10px 20px",
                backgroundColor: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {model.name} 테스트
            </button>
          ))}
        </div>

        {/* 현재 테스트 중인 모델 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>현재 모델: {modelPath}</h2>
          <div
            style={{
              width: "100%",
              height: "500px",
              backgroundColor: "#1a1a1a",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <Canvas
              camera={{ position: [0, 2, 8], fov: 60 }}
              style={{ width: "100%", height: "100%" }}
            >
              <ambientLight intensity={1.2} />
              <directionalLight position={[5, 5, 5]} intensity={1.5} />
              <directionalLight position={[-5, 3, -5]} intensity={0.8} />
              <OrbitControls enableZoom={true} enablePan={true} />
              <ModelLoader modelPath={modelPath} />
              <gridHelper args={[10, 10]} />
              <axesHelper args={[5]} />
            </Canvas>
          </div>
        </div>

        {/* 테스트 결과 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>테스트 기록</h2>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {testResults.length === 0 ? (
              <p style={{ color: "#666" }}>테스트 버튼을 클릭하여 시작하세요.</p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px",
                    marginBottom: "4px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                  }}
                >
                  <strong>{result.time}</strong> - {result.model} ({result.path})
                </div>
              ))
            )}
          </div>
        </div>

        {/* 디버깅 정보 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>디버깅 정보</h2>
          <p style={{ color: "#666", fontSize: "14px" }}>
            브라우저 개발자 도구(F12)의 콘솔 탭을 열어서 다음 로그를 확인하세요:
          </p>
          <ul style={{ color: "#666", fontSize: "14px" }}>
            <li>
              <code>[텍스처] Material ...</code> - Material의 텍스처 경로
            </li>
            <li>
              <code>[텍스처 로드 성공/실패]</code> - 텍스처 로딩 결과
            </li>
            <li>
              <code>[Material 적용]</code> - Material이 Mesh에 적용되는지 확인
            </li>
            <li>
              <code>[Scene 설정]</code> - 전체 처리 완료
            </li>
          </ul>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "10px" }}>
            Network 탭에서 텍스처 파일이 200 상태로 로드되는지 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

