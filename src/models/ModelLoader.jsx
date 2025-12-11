import React, { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Box3, Vector3, Color, TextureLoader, Texture } from "three";

// 모든 모델을 화면에 비슷한 크기로 보이도록
// 바운딩 박스를 기준으로 스케일/위치를 정규화하는 헬퍼 함수
function normalizeModel(
  root,
  {
    targetSize = 4, // 장면에서 차지할 기준 크기(대략 높이/가로 중 큰 값)
    yOffset = 0, // 모델 중심을 원점(0,0,0) 근처에 두기 위한 오프셋
  } = {}
) {
  if (!root) return;

  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  const center = new Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;

  // 스케일 통일
  root.scale.setScalar(scale);

  // 중심을 원점 부근으로 옮기고, 살짝 아래로 내리기
  root.position.sub(center.multiplyScalar(scale));
  root.position.y += yOffset;
}

// 모든 머티리얼을 "무광"으로 맞춰주는 헬퍼 함수
function makeMaterialMatte(material) {
  if (!material) return;

  // 텍스처가 없거나 로드 실패한 경우 기본 색상 설정
  if (!material.map || !material.map.image) {
    // 텍스처가 없으면 기본 회색 색상 적용 (검은색 방지)
    if ("color" in material) {
      if (material.color instanceof Color) {
        material.color.set(0x888888); // 중간 회색
      } else {
        material.color = new Color(0x888888);
      }
    }
  }

  // PBR 계열(MaterialStandard 등)
  if ("metalness" in material) {
    material.metalness = 0;
  }
  if ("roughness" in material) {
    material.roughness = 1; // 최대 거칠기
  }

  // Phong 계열(MaterialPhong 등)
  if ("shininess" in material) {
    material.shininess = 0;
  }
  if ("specular" in material && material.specular) {
    // 반짝이는 하이라이트 색 제거
    if (material.specular instanceof Color) {
      material.specular.set(0x000000);
    } else {
      material.specular = new Color(0x000000);
    }
  }

  // 환경 반사 제거
  if ("envMap" in material) {
    material.envMap = null;
  }
  if ("reflectivity" in material) {
    material.reflectivity = 0;
  }
}

// FBX 모델을 로드하는 컴포넌트
function LoadedFBXModel({ modelPath }) {
  const [loadError, setLoadError] = useState(null);

  const fbx = useLoader(FBXLoader, modelPath, undefined, (error) => {
    // ProgressEvent는 실제 에러가 아님 (로딩 진행 이벤트)
    if (error && error.type !== "progress" && error.type !== "load") {
      console.error(`[FBX 모델 로딩 실패] ${modelPath}:`, error);
      setLoadError(error);
    }
  });

  const [scene, setScene] = useState(null);

  useEffect(() => {
    if (loadError) {
      console.error(`[FBX 모델 로딩 에러] ${modelPath}:`, loadError);
      return;
    }

    if (fbx) {
      console.log(`[FBX 모델 로딩 성공] ${modelPath}`);
      // SkinnedMesh가 깨지지 않도록 SkeletonUtils.clone 사용
      const cloned = clone(fbx);

      // 모든 메시에 무광 머티리얼 파라미터 적용
      cloned.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach(makeMaterialMatte);
        }
      });
      // 크기/위치 정규화
      normalizeModel(cloned);
      setScene(cloned);
    }
  }, [fbx]);

  if (loadError) {
    console.error(`[FBX] 모델 로딩 실패: ${modelPath}`, loadError);
    return null; // Error Boundary가 처리하도록
  }

  if (!scene) return null;

  return <primitive object={scene} />;
}

// MTL 파일에서 텍스처 파일명 추출
function extractTextureFromMTL(mtlContent, materialName) {
  const lines = mtlContent.split("\n");
  let currentMaterial = null;
  const textures = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("newmtl")) {
      // newmtl 다음의 모든 내용을 material name으로 사용 (공백 포함 가능)
      const parts = line.split(/\s+/);
      currentMaterial = parts.slice(1).join(" ");
    } else if (line.startsWith("map_Kd")) {
      // 정확한 이름 매칭 또는 부분 매칭
      const isMatch =
        currentMaterial === materialName ||
        (materialName &&
          currentMaterial &&
          currentMaterial.includes(materialName)) ||
        (materialName &&
          currentMaterial &&
          materialName.includes(currentMaterial));

      if (isMatch) {
        const textureFile = line.split(/\s+/).slice(1).join(" ").trim();
        if (textureFile && !textures.includes(textureFile)) {
          textures.push(textureFile);
        }
      }
    }
  }

  return textures;
}

// DAE 모델을 로드하는 컴포넌트
function LoadedDAEModel({ modelPath }) {
  const [loadError, setLoadError] = useState(null);
  const [mtlContent, setMtlContent] = useState(null);

  // MTL 파일 로드 (DAE 파일과 같은 폴더에 있는 경우)
  useEffect(() => {
    if (!modelPath) return;

    const baseDir = modelPath.substring(0, modelPath.lastIndexOf("/") + 1);
    const daeFileName = modelPath
      .split("/")
      .pop()
      .replace(/\.dae$/i, "");
    const mtlPath = `${baseDir}${daeFileName}.mtl`;

    // MTL 파일 로드 시도
    fetch(mtlPath)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (text) {
          console.log(`[MTL] 파일 로드 성공: ${mtlPath}`);
          setMtlContent(text);
        }
      })
      .catch((err) => {
        console.warn(`[MTL] 파일 로드 실패: ${mtlPath}`, err);
      });
  }, [modelPath]);

  const collada = useLoader(ColladaLoader, modelPath, undefined, (error) => {
    // ProgressEvent는 실제 에러가 아님 (로딩 진행 이벤트)
    if (error && error.type !== "progress" && error.type !== "load") {
      console.error(`[모델 로딩 실패] ${modelPath}:`, error);
      setLoadError(error);
    }
  });

  const [scene, setScene] = useState(null);

  useEffect(() => {
    if (loadError) {
      console.error(`[DAE 모델 로딩 에러] ${modelPath}:`, loadError);
      return;
    }

    if (collada && collada.scene) {
      console.log(`[DAE 모델 로딩 성공] ${modelPath}`);
      const cloned = clone(collada.scene);

      // 텍스처 경로 수정
      // DAE 파일이 위치한 폴더를 기준으로 텍스처를 찾도록 경로를 보정합니다.
      // 로컬 파일만 사용 (CDN 제거)
      const baseDir = (() => {
        if (!modelPath) return "/";

        // 로컬 경로만 처리
        const lastSlash = modelPath.lastIndexOf("/");
        if (lastSlash === -1) return "/";
        return modelPath.substring(0, lastSlash + 1);
      })();

      cloned.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach((material) => {
            // MTL 파일에서 텍스처 파일명 추출 시도
            let textureFileName = null;
            if (mtlContent && material.name) {
              const textures = extractTextureFromMTL(mtlContent, material.name);
              if (textures.length > 0) {
                textureFileName = textures[0]; // 첫 번째 텍스처 사용
                console.log(
                  `[텍스처] MTL에서 추출: ${material.name} -> ${textureFileName}`
                );
              } else {
                // 정확한 이름 매칭 실패 시, material name의 일부로 검색 시도
                const materialNameParts = material.name.split(/[:_]/);
                for (const part of materialNameParts) {
                  if (part.length > 3) {
                    // MTL 파일 전체에서 해당 부분이 포함된 material 찾기
                    const allTextures = extractTextureFromMTL(mtlContent, part);
                    if (allTextures.length > 0) {
                      textureFileName = allTextures[0];
                      console.log(
                        `[텍스처] MTL에서 부분 매칭으로 추출: ${part} -> ${textureFileName}`
                      );
                      break;
                    }
                  }
                }
              }
            }

            // 텍스처 맵들을 확인하고 경로 수정
            if (material.map) {
              // material.map이 Texture 객체인지 확인
              let texturePath = null;

              // Texture 객체의 경우
              if (material.map && typeof material.map === "object") {
                // image 속성 확인
                if (material.map.image) {
                  texturePath = material.map.image.src || material.map.image;
                }
                // source 속성 확인 (ColladaLoader가 설정)
                if (!texturePath && material.map.source) {
                  texturePath = material.map.source;
                }
                // name 속성 확인 (일부 로더가 사용)
                if (!texturePath && material.map.name) {
                  texturePath = material.map.name;
                }
              }

              // texturePath가 없으면 material.map 자체를 확인
              if (!texturePath && typeof material.map === "string") {
                texturePath = material.map;
              }

              console.log(`[텍스처] material.map 타입:`, typeof material.map);
              console.log(`[텍스처] material.map 확인:`, material.map);
              console.log(
                `[텍스처] 추출된 경로: ${texturePath}, baseDir: ${baseDir}`
              );

              // material.map이 Texture 객체인데 image가 없거나 로드 실패한 경우
              if (
                material.map &&
                typeof material.map === "object" &&
                !material.map.image
              ) {
                console.warn(
                  `[텍스처] Texture 객체에 image가 없음, 재로딩 필요`
                );

                // MTL에서 추출한 텍스처 파일명 사용 (texturePath가 없거나 유효하지 않은 경우)
                if (
                  (!texturePath ||
                    typeof texturePath !== "string" ||
                    texturePath === "[object Object]") &&
                  textureFileName
                ) {
                  texturePath = textureFileName;
                  console.log(
                    `[텍스처] MTL에서 추출한 파일명 사용: ${texturePath}`
                  );
                }
              }

              if (texturePath && typeof texturePath === "string") {
                console.log(
                  `[텍스처] 원본 경로: ${texturePath}, baseDir: ${baseDir}`
                );

                // 이미 http 또는 루트(/)로 시작하는 절대 경로는 건드리지 않음
                if (
                  !texturePath.startsWith("http") &&
                  !texturePath.startsWith("/")
                ) {
                  // 상대 경로만 보정
                  const fileName =
                    texturePath.split("/").pop() ||
                    texturePath.split("\\").pop();
                  const newPath = `${baseDir}${fileName}`;

                  console.log(`[텍스처] 수정된 경로: ${newPath}`);

                  // 텍스처가 이미 올바른 경로로 로드되었는지 확인
                  const currentSrc =
                    material.map.image?.src || material.map.source;
                  const needsNewTexture =
                    !currentSrc ||
                    currentSrc !== newPath ||
                    (material.map.image &&
                      material.map.image.complete === false);

                  console.log(
                    `[텍스처] 현재 경로: ${currentSrc}, 새 경로: ${newPath}, 재로딩 필요: ${needsNewTexture}`
                  );

                  if (needsNewTexture) {
                    // 기존 색상 저장 (텍스처 실패 시 사용)
                    const fallbackColor = material.color
                      ? material.color.clone()
                      : new Color(0xcccccc);

                    // TextureLoader 사용 (로컬 파일 로딩)
                    const loader = new TextureLoader();

                    loader.load(
                      newPath,
                      (texture) => {
                        // 텍스처 로드 성공
                        console.log(`[텍스처] 로드 성공: ${newPath}`);

                        // 기존 텍스처 dispose
                        if (material.map && material.map.dispose) {
                          material.map.dispose();
                        }

                        material.map = texture;
                        material.needsUpdate = true;
                      },
                      undefined, // onProgress
                      (error) => {
                        // 텍스처 로드 실패
                        console.warn(`[텍스처] 로드 실패: ${newPath}`, error);
                        console.warn(`[텍스처] 원본 경로: ${texturePath}`);

                        // 텍스처 로드 실패 시 저장된 색상 사용
                        if ("color" in material) {
                          if (material.color instanceof Color) {
                            material.color.copy(fallbackColor);
                          } else {
                            material.color = fallbackColor.clone();
                          }
                        } else {
                          material.color = fallbackColor.clone();
                        }
                        material.map = null; // 텍스처 제거
                        material.needsUpdate = true; // 머티리얼 업데이트
                      }
                    );
                  } else {
                    // 이미 올바른 경로로 로드된 경우
                    console.log(`[텍스처] 이미 로드됨: ${newPath}`);
                  }
                } else {
                  console.log(`[텍스처] 절대 경로 유지: ${texturePath}`);
                }
              } else {
                // texturePath가 null이거나 유효하지 않은 경우
                console.warn(
                  `[텍스처] 경로 추출 실패 - material.map:`,
                  material.map
                );

                // MTL에서 추출한 텍스처 파일명 사용 (texturePath가 없거나 유효하지 않은 경우)
                let mtlTextureFileName = textureFileName;
                if (!mtlTextureFileName && mtlContent && material.name) {
                  const textures = extractTextureFromMTL(
                    mtlContent,
                    material.name
                  );
                  if (textures.length > 0) {
                    mtlTextureFileName = textures[0];
                    console.log(
                      `[텍스처] MTL에서 추출: ${material.name} -> ${mtlTextureFileName}`
                    );
                  }
                }

                if (mtlTextureFileName) {
                  const newPath = `${baseDir}${mtlTextureFileName}`;
                  console.log(`[텍스처] MTL 기반 로드 시도: ${newPath}`);

                  const loader = new TextureLoader();
                  loader.load(
                    newPath,
                    (texture) => {
                      console.log(`[텍스처] MTL 기반 로드 성공: ${newPath}`);
                      // 기존 텍스처 dispose
                      if (material.map && material.map.dispose) {
                        material.map.dispose();
                      }
                      material.map = texture;
                      material.needsUpdate = true;
                    },
                    undefined,
                    (error) => {
                      console.warn(
                        `[텍스처] MTL 기반 로드 실패: ${newPath}`,
                        error
                      );
                      // 기존 텍스처 dispose
                      if (material.map && material.map.dispose) {
                        material.map.dispose();
                      }
                      material.map = null;
                      if (!material.color) {
                        material.color = new Color(0xcccccc);
                      } else {
                        material.color.set(0xcccccc);
                      }
                      material.needsUpdate = true;
                    }
                  );
                  return; // 비동기 로딩 중이므로 여기서 종료
                } else if (material.map && typeof material.map === "string") {
                  // material.map이 문자열인 경우 직접 경로로 사용
                  const directPath = `${baseDir}${material.map}`;
                  console.log(
                    `[텍스처] 문자열 경로로 직접 로드 시도: ${directPath}`
                  );

                  const loader = new TextureLoader();
                  loader.load(
                    directPath,
                    (texture) => {
                      console.log(`[텍스처] 직접 로드 성공: ${directPath}`);
                      // 기존 텍스처 dispose
                      if (
                        material.map &&
                        typeof material.map === "object" &&
                        material.map.dispose
                      ) {
                        material.map.dispose();
                      }
                      material.map = texture;
                      material.needsUpdate = true;
                    },
                    undefined,
                    (error) => {
                      console.warn(
                        `[텍스처] 직접 로드 실패: ${directPath}`,
                        error
                      );
                      // 기존 텍스처 dispose
                      if (
                        material.map &&
                        typeof material.map === "object" &&
                        material.map.dispose
                      ) {
                        material.map.dispose();
                      }
                      material.map = null;
                      if (!material.color) {
                        material.color = new Color(0xcccccc);
                      } else {
                        material.color.set(0xcccccc);
                      }
                      material.needsUpdate = true;
                    }
                  );
                  return; // 비동기 로딩 중이므로 여기서 종료
                } else {
                  // MTL 파일명도 없고 material.map도 문자열이 아니면 baseDir에서 일반 텍스처 파일 찾기 시도
                  console.log(
                    `[텍스처] MTL에서 텍스처를 찾지 못함, baseDir에서 일반 텍스처 파일 찾기: ${baseDir}`
                  );

                  // 일반적인 텍스처 파일명 패턴 시도
                  const commonTexturePatterns = [
                    "Texture_1_CMP.png",
                    "Texture_0_CMP.png",
                    "Texture_1_RGB565.png",
                    "Texture_0_RGB565.png",
                    "Texture_0.png",
                    "Texture_1.png",
                  ];

                  const loader = new TextureLoader();
                  let textureTried = 0;

                  for (const pattern of commonTexturePatterns) {
                    const texturePath = `${baseDir}${pattern}`;
                    console.log(
                      `[텍스처] 일반 텍스처 파일 시도: ${texturePath}`
                    );

                    loader.load(
                      texturePath,
                      (texture) => {
                        console.log(
                          `[텍스처] 일반 텍스처 파일 로드 성공: ${texturePath}`
                        );
                        if (material.map && material.map.dispose) {
                          material.map.dispose();
                        }
                        material.map = texture;
                        material.needsUpdate = true;
                      },
                      undefined,
                      () => {
                        textureTried++;
                        // 모든 패턴 시도 실패 시 기본 색상 사용
                        if (textureTried === commonTexturePatterns.length) {
                          console.warn(
                            `[텍스처] 모든 텍스처 파일 시도 실패, 기본 색상 사용`
                          );
                          if (
                            material.map &&
                            typeof material.map === "object" &&
                            material.map.dispose
                          ) {
                            material.map.dispose();
                          }
                          material.map = null;
                          if (!material.color) {
                            material.color = new Color(0xcccccc);
                          } else {
                            material.color.set(0xcccccc);
                          }
                          material.needsUpdate = true;
                        }
                      }
                    );
                  }

                  // 비동기 로딩이므로 여기서는 기본 색상 설정하지 않음
                  // (로딩 실패 시 콜백에서 처리)
                }

                // 기본 색상 설정 (텍스처가 없을 때)
                if (
                  !material.color ||
                  (material.color instanceof Color &&
                    material.color.getHex() === 0xffffff)
                ) {
                  if (!material.color) {
                    material.color = new Color(0xcccccc);
                  } else {
                    material.color.set(0xcccccc);
                  }
                }
                material.needsUpdate = true;
              }
            } else {
              // material.map이 없는 경우 - MTL에서 추출한 텍스처 파일명 사용
              if (textureFileName) {
                const texturePath = `${baseDir}${textureFileName}`;
                console.log(
                  `[텍스처] material.map이 없음, MTL에서 추출한 텍스처 사용: ${texturePath}`
                );

                const loader = new TextureLoader();
                loader.load(
                  texturePath,
                  (texture) => {
                    console.log(
                      `[텍스처] MTL 텍스처 로드 성공: ${texturePath}`
                    );
                    material.map = texture;
                    material.needsUpdate = true;
                  },
                  undefined,
                  (error) => {
                    console.warn(
                      `[텍스처] MTL 텍스처 로드 실패: ${texturePath}`,
                      error
                    );
                    // 폴백: 기본 색상 사용
                    if (!material.color) {
                      material.color = new Color(0xcccccc);
                    } else {
                      material.color.set(0xcccccc);
                    }
                    material.needsUpdate = true;
                  }
                );
                return; // 비동기 로딩 중이므로 여기서 종료
              }

              // 텍스처가 없으면 기본 색상 설정
              // 텍스처가 없는 경우에도 모델이 보이도록 색상 설정
              if (
                !material.color ||
                (material.color instanceof Color &&
                  material.color.getHex() === 0xffffff)
              ) {
                if (!material.color) {
                  material.color = new Color(0xcccccc);
                } else {
                  material.color.set(0xcccccc);
                }
              }
              // 텍스처가 없어도 모델이 보이도록 needsUpdate 설정
              material.needsUpdate = true;
            }

            // 전체적으로 무광 느낌을 주기 위해 공통 헬퍼 사용
            makeMaterialMatte(material);

            // 머티리얼 업데이트 플래그 설정
            material.needsUpdate = true;
          });
        }
      });

      // 크기/위치 정규화
      normalizeModel(cloned);
      setScene(cloned);
    }
  }, [collada, modelPath, loadError, mtlContent]);

  if (loadError) {
    console.error(`[DAE] 모델 로딩 실패: ${modelPath}`, loadError);
    return null; // Error Boundary가 처리하도록
  }

  if (!scene) return null;

  return <primitive object={scene} />;
}

// GLTF/GLB 모델을 로드하는 컴포넌트
function LoadedGLTFModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const [normalized, setNormalized] = useState(null);

  useEffect(() => {
    if (scene) {
      const cloned = clone(scene);

      // GLTF/GLB도 무광 재질 적용
      cloned.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach(makeMaterialMatte);
        }
      });

      normalizeModel(cloned);
      setNormalized(cloned);
    }
  }, [scene]);

  if (!normalized) return null;

  return <primitive object={normalized} />;
}

// 실제 모델을 로드하는 컴포넌트 (파일 확장자에 따라 자동 선택)
function LoadedModel({ modelPath }) {
  // modelPath에서 직접 확장자 추출 (useEffect 없이)
  if (!modelPath) {
    console.warn(`[모델 로더] modelPath가 없습니다.`);
    return null;
  }

  console.log(`[모델 로더] 경로 확인: ${modelPath}`);

  // 확장자 추출 (쿼리 파라미터 제거)
  const pathWithoutQuery = modelPath.split("?")[0];
  const ext = pathWithoutQuery.toLowerCase().split(".").pop();
  console.log(`[모델 로더] 확장자: ${ext}`);

  // 확장자에 따라 직접 컴포넌트 반환
  if (ext === "fbx") {
    return <LoadedFBXModel modelPath={modelPath} />;
  } else if (ext === "dae") {
    return <LoadedDAEModel modelPath={modelPath} />;
  } else if (ext === "glb" || ext === "gltf") {
    return <LoadedGLTFModel modelPath={modelPath} />;
  } else {
    console.warn(`[모델 로더] 알 수 없는 확장자: ${ext}, DAE로 시도`);
    // 기본값으로 DAE 시도
    return <LoadedDAEModel modelPath={modelPath} />;
  }
}

// 폴백 모델 (모델 파일이 없을 때 표시)
function FallbackModel() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#4A90E2" metalness={0} roughness={1} />
      </mesh>
    </group>
  );
}

// Error Boundary 컴포넌트
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "❌ 모델 파일을 로드할 수 없습니다. 폴백 모델을 표시합니다.",
      error
    );
    console.error("에러 상세:", errorInfo);
    console.error("모델 경로:", this.props.modelPath || "알 수 없음");
    console.error("에러 메시지:", error?.message);
    console.error("에러 스택:", error?.stack);
  }

  render() {
    if (this.state.hasError) {
      console.warn(
        `[ErrorBoundary] 모델 로딩 실패, FallbackModel 표시: ${this.props.modelPath}`
      );
      return <FallbackModel />;
    }

    return this.props.children;
  }
}

// 범용 3D 모델 로더 컴포넌트 (에러 처리 포함)
function ModelLoader({ modelPath }) {
  if (!modelPath) {
    console.warn("[ModelLoader] modelPath가 없습니다.");
    return <FallbackModel />;
  }

  console.log(`[ModelLoader] 모델 로딩 시작: ${modelPath}`);

  return (
    <ModelErrorBoundary modelPath={modelPath}>
      <LoadedModel modelPath={modelPath} />
    </ModelErrorBoundary>
  );
}

export default ModelLoader;
