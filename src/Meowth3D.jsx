import React, { Suspense, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import * as THREE from "three";

// === Meowth 3D 모델 컴포넌트 ===
function MeowthModel({ modelPath = "/Meowth/Nyarth.dae" }) {
  console.log("Loading model from:", modelPath);

  const collada = useLoader(ColladaLoader, modelPath);

  console.log("Model loaded:", collada);

  // 모델 로드 후 재질 조정하여 원래 색상이 나오도록 설정
  useEffect(() => {
    if (!collada || !collada.scene) {
      console.error("Collada 모델이 로드되지 않았습니다!");
      return;
    }

    console.log("=== Meowth 모델 로드 완료 ===");
    console.log("Collada object:", collada);
    console.log("Scene:", collada.scene);
    console.log("Scene children count:", collada.scene.children.length);

    let meshCount = 0;
    collada.scene.traverse((child) => {
      console.log("Traversing:", child.type, child.name);

      if (child.isMesh && child.material) {
        meshCount++;
        console.log(`Found mesh #${meshCount}:`, child.name);
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((material, index) => {
          if (!material) return;

          console.log(`\n--- Material ${index} ---`);
          console.log("Material type:", material.type);
          console.log("Has map:", !!material.map);

          // 텍스처 정보 확인
          const texture = material.map;
          if (texture) {
            console.log("Texture found!");
            console.log("Texture image:", texture.image);
            if (texture.image) {
              console.log(
                "Image src:",
                texture.image.src || texture.image.currentSrc || "N/A"
              );
              console.log("Image complete:", texture.image.complete);
              console.log("Image width:", texture.image.width);
              console.log("Image height:", texture.image.height);
            } else {
              console.warn("Texture has no image!");
            }
          } else {
            console.warn("No texture found in material!");
            // 다른 텍스처 속성 확인
            console.log("Available properties:", Object.keys(material));
            if (material.diffuseMap)
              console.log("Has diffuseMap:", material.diffuseMap);
            if (material.emissiveMap)
              console.log("Has emissiveMap:", material.emissiveMap);
          }

          // 기존 재질을 MeshBasicMaterial로 완전히 교체
          // 텍스처를 그대로 유지하면서 조명 영향 제거
          if (texture && texture.image) {
            // 텍스처가 있는 경우
            const newMaterial = new THREE.MeshBasicMaterial({
              map: texture,
              transparent:
                material.transparent !== undefined
                  ? material.transparent
                  : true,
              opacity: material.opacity !== undefined ? material.opacity : 1,
              alphaTest: material.alphaTest,
              side: material.side || THREE.FrontSide,
              toneMapped: false,
              color: new THREE.Color(1, 1, 1), // 흰색으로 설정하여 텍스처 색상 그대로 표시
            });

            console.log("Created MeshBasicMaterial with texture");

            // 재질 교체
            if (Array.isArray(child.material)) {
              const idx = materials.indexOf(material);
              const mats = [...child.material];
              mats[idx] = newMaterial;
              child.material = mats;
            } else {
              child.material = newMaterial;
            }
          } else {
            // 텍스처가 없는 경우
            console.warn("Creating material without texture!");
            const newMaterial = new THREE.MeshBasicMaterial({
              color: material.color
                ? material.color.clone()
                : new THREE.Color(1, 1, 1),
              transparent:
                material.transparent !== undefined
                  ? material.transparent
                  : false,
              opacity: material.opacity !== undefined ? material.opacity : 1,
              toneMapped: false,
            });

            if (Array.isArray(child.material)) {
              const idx = materials.indexOf(material);
              const mats = [...child.material];
              mats[idx] = newMaterial;
              child.material = mats;
            } else {
              child.material = newMaterial;
            }
          }
        });
      }
    });

    console.log(`=== 재질 처리 완료 (총 ${meshCount}개 메시 처리) ===`);
  }, [collada]);

  if (!collada || !collada.scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  return (
    <primitive
      object={collada.scene}
      scale={[0.5, 0.5, 0.5]}
      position={[0, -1, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export default MeowthModel;

