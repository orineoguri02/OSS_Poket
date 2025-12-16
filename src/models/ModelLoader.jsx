import React, { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  Box3,
  Vector3,
  Color,
  TextureLoader,
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshLambertMaterial,
  MeshBasicMaterial,
} from "three";

// ==================== 헬퍼 함수 ====================

/**
 * 모델을 화면에 비슷한 크기로 보이도록 정규화
 */
function normalizeModel(root, { targetSize = 4, yOffset = 0 } = {}) {
  if (!root) return;

  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  const center = new Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;

  root.scale.setScalar(scale);
  root.position.sub(center.multiplyScalar(scale));
  root.position.y += yOffset;
}

/**
 * Material을 무광으로 설정
 */
function makeMaterialMatte(material) {
  if (!material) return;

  // 텍스처가 없으면 기본 회색 색상
  if (!material.map || !material.map.image) {
    if ("color" in material) {
      if (material.color instanceof Color) {
        material.color.set(0x888888);
      } else {
        material.color = new Color(0x888888);
      }
    }
  }

  // PBR 계열
  if ("metalness" in material) material.metalness = 0;
  if ("roughness" in material) material.roughness = 1;

  // Phong 계열
  if ("shininess" in material) material.shininess = 0;
  if ("specular" in material && material.specular) {
    if (material.specular instanceof Color) {
      material.specular.set(0x000000);
    } else {
      material.specular = new Color(0x000000);
    }
  }

  // 환경 반사 제거
  if ("envMap" in material) material.envMap = null;
  if ("reflectivity" in material) material.reflectivity = 0;
}

/**
 * MTL 파일에서 특정 material의 텍스처 파일명 추출
 */
function extractTextureFromMTL(mtlContent, materialName) {
  const lines = mtlContent.split("\n");
  let currentMaterial = null;
  const textures = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("newmtl")) {
      const parts = trimmed.split(/\s+/);
      currentMaterial = parts.slice(1).join(" ");
    } else if (trimmed.startsWith("map_Kd")) {
      const isMatch =
        currentMaterial === materialName ||
        (materialName && currentMaterial?.includes(materialName)) ||
        (materialName && materialName.includes(currentMaterial));

      if (isMatch) {
        const textureFile = trimmed.split(/\s+/).slice(1).join(" ").trim();
        if (textureFile && !textures.includes(textureFile)) {
          textures.push(textureFile);
        }
      }
    }
  }

  return textures;
}

/**
 * modelPath에서 baseDir 추출
 * 예: /pokemon/27/sand.dae -> /pokemon/27/
 */
function getBaseDir(modelPath) {
  if (!modelPath) return "/";
  const lastSlash = modelPath.lastIndexOf("/");
  if (lastSlash === -1) return "/";
  let dir = modelPath.substring(0, lastSlash + 1);
  if (!dir.startsWith("/")) dir = "/" + dir;
  return dir;
}

/**
 * 텍스처를 로드하고 material에 적용
 */
async function loadTextureForMaterial(material, textureFileName, baseDir) {
  if (!textureFileName) return null;

  // material이 함수 파라미터로 전달되므로 참조를 직접 수정할 수 있음
  // 하지만 Material 타입 변환이 필요할 수 있으므로 material 객체 자체를 반환하도록 수정

  const texturePath = `${baseDir}${textureFileName}`;
  const absolutePath = texturePath.startsWith("/")
    ? texturePath
    : `/${texturePath}`;

  return new Promise((resolve, reject) => {
    const loader = new TextureLoader();
    loader.load(
      absolutePath,
      (texture) => {
        console.log(
          `[텍스처 로드] ${absolutePath} - 이미지 완료: ${texture.image?.complete}, 크기: ${texture.image?.naturalWidth}x${texture.image?.naturalHeight}`
        );

        // 기존 텍스처 dispose
        if (material.map?.dispose) {
          material.map.dispose();
        }

        // 텍스처 설정
        texture.flipY = false;
        texture.colorSpace = "srgb";
        texture.needsUpdate = true;

        // Material에 텍스처 적용
        material.map = texture;

        // Material 업데이트 강제 적용 (모든 Material 타입 지원)
        // needsUpdate가 없어도 version을 증가시켜 Three.js가 변경을 인식하도록 함
        if (material.needsUpdate !== undefined) {
          material.needsUpdate = true;
        }
        // version은 항상 증가시킴 (없으면 생성)
        material.version = (material.version || 0) + 1;

        console.log(
          `[텍스처 적용] Material "${
            material.name || "unnamed"
          }"에 텍스처 적용 완료: ${textureFileName}, material.map: ${!!material.map}, material.needsUpdate: ${
            material.needsUpdate
          }, material.version: ${material.version}`
        );

        // 이미지 로드 완료 대기
        if (texture.image) {
          if (texture.image.complete && texture.image.naturalWidth > 0) {
            // 이미 로드됨 - material 강제 업데이트
            if (material.needsUpdate !== undefined) {
              material.needsUpdate = true;
            }
            material.version = (material.version || 0) + 1;
            resolve(texture);
          } else {
            // 로드 대기
            const onLoad = () => {
              texture.image.removeEventListener("load", onLoad);
              texture.image.removeEventListener("error", onError);
              // 이미지 로드 완료 후 material 강제 업데이트
              if (material.needsUpdate !== undefined) {
                material.needsUpdate = true;
              }
              material.version = (material.version || 0) + 1;
              resolve(texture);
            };
            const onError = (error) => {
              texture.image.removeEventListener("load", onLoad);
              texture.image.removeEventListener("error", onError);
              reject(error);
            };
            texture.image.addEventListener("load", onLoad);
            texture.image.addEventListener("error", onError);
          }
        } else {
          // 이미지 객체가 없어도 material 업데이트
          if (material.needsUpdate !== undefined) {
            material.needsUpdate = true;
          }
          material.version = (material.version || 0) + 1;
          resolve(texture);
        }
      },
      undefined,
      (error) => {
        // 텍스처 로드 실패 시 기본 색상 사용
        if ("color" in material) {
          if (material.color instanceof Color) {
            material.color.set(0xcccccc);
          } else {
            material.color = new Color(0xcccccc);
          }
        }
        material.map = null;
        material.needsUpdate = true;
        reject(error);
      }
    );
  });
}

// ==================== FBX 모델 로더 ====================

function LoadedFBXModel({ modelPath }) {
  const [loadError, setLoadError] = useState(null);
  const fbx = useLoader(FBXLoader, modelPath, undefined, (error) => {
    if (error && error.type !== "progress" && error.type !== "load") {
      setLoadError(error);
    }
  });

  const [scene, setScene] = useState(null);

  useEffect(() => {
    if (loadError || !fbx) return;

    const cloned = clone(fbx);

    // Material 무광 처리
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach(makeMaterialMatte);
      }
    });

    normalizeModel(cloned);
    setScene(cloned);
  }, [fbx, loadError]);

  if (loadError || !scene) return null;
  return <primitive object={scene} />;
}

// ==================== DAE 모델 로더 ====================

function LoadedDAEModel({ modelPath }) {
  const [loadError, setLoadError] = useState(null);
  const [mtlContent, setMtlContent] = useState(null);

  // MTL 파일 로드
  useEffect(() => {
    if (!modelPath) return;

    const baseDir = getBaseDir(modelPath);
    const daeFileName = modelPath
      .split("/")
      .pop()
      .replace(/\.dae$/i, "");
    const mtlPath = `${baseDir}${daeFileName}.mtl`;

    fetch(mtlPath)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (text) setMtlContent(text);
      })
      .catch(() => {
        // MTL 파일이 없어도 계속 진행
      });
  }, [modelPath]);

  const collada = useLoader(ColladaLoader, modelPath, undefined, (error) => {
    if (error && error.type !== "progress" && error.type !== "load") {
      setLoadError(error);
    }
  });

  const [scene, setScene] = useState(null);

  useEffect(() => {
    if (loadError || !collada?.scene) return;

    // MTL 파일이 있는 경우 로드 완료를 기다림
    // MTL이 없어도 계속 진행하되, 있으면 사용
    const processScene = () => {
      const cloned = clone(collada.scene);
      const baseDir = getBaseDir(modelPath);
      const texturePromises = [];

      console.log(
        `[DAE 로드] MTL 콘텐츠 로드 상태: ${mtlContent ? "로드됨" : "없음"}`
      );

      // 모든 material에 텍스처 적용
      cloned.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          for (const material of materials) {
            // MTL에서 텍스처 파일명 추출
            let textureFileName = null;
            if (mtlContent && material.name) {
              const textures = extractTextureFromMTL(mtlContent, material.name);
              if (textures.length > 0) {
                textureFileName = textures[0];
              } else {
                // 부분 매칭 시도
                const materialNameParts = material.name.split(/[:_]/);
                for (const part of materialNameParts) {
                  if (part.length > 3) {
                    const allTextures = extractTextureFromMTL(mtlContent, part);
                    if (allTextures.length > 0) {
                      textureFileName = allTextures[0];
                      break;
                    }
                  }
                }
              }
            }

            // 기존 텍스처 확인
            const existingTextureSrc =
              material.map?.image?.src || material.map?.source || "";
            const existingTextureFileName = existingTextureSrc
              ? existingTextureSrc.split("/").pop()
              : null;
            const isHttpUrl = existingTextureSrc.startsWith("http");
            const hasValidTexture =
              material.map?.image?.complete &&
              material.map.image.naturalWidth > 0;

            console.log(
              `[Material 확인] "${material.name || "unnamed"}": 기존 텍스처: ${
                existingTextureFileName || "없음"
              }, MTL 텍스처: ${
                textureFileName || "없음"
              }, HTTP URL: ${isHttpUrl}, 유효: ${hasValidTexture}`
            );

            // 텍스처 로드가 필요한 경우:
            // 1. MTL에서 텍스처 파일명을 찾았고, 기존 텍스처와 다른 경우
            // 2. 기존 텍스처가 HTTP URL인 경우
            // 3. 텍스처가 없거나 유효하지 않은 경우
            const needsTextureLoad =
              (textureFileName &&
                existingTextureFileName !== textureFileName) ||
              isHttpUrl ||
              !material.map ||
              !hasValidTexture;

            if (needsTextureLoad) {
              // MTL에서 찾은 텍스처 파일명 우선 사용, 없으면 기존 텍스처에서 파일명 추출
              let textureToLoad = textureFileName || existingTextureFileName;

              if (textureToLoad) {
                console.log(
                  `[텍스처 로드 시작] Material "${
                    material.name || "unnamed"
                  }": ${textureToLoad}`
                );
                const promise = loadTextureForMaterial(
                  material,
                  textureToLoad,
                  baseDir
                )
                  .then((texture) => {
                    console.log(
                      `[텍스처 로드 완료] Material "${
                        material.name || "unnamed"
                      }": ${textureToLoad}, material.map=${!!material.map}, material.type=${
                        material.type || material.constructor.name
                      }`
                    );
                    return texture;
                  })
                  .catch((error) => {
                    console.warn(
                      `[텍스처 로드 실패] Material "${
                        material.name || "unnamed"
                      }": ${textureToLoad}`,
                      error
                    );
                  });
                texturePromises.push(promise);
              }
            } else {
              // 이미 올바른 텍스처가 있으면 Promise에 포함 (로딩 완료 대기)
              console.log(
                `[텍스처 유지] Material "${
                  material.name || "unnamed"
                }": 이미 올바른 텍스처 있음 (${existingTextureFileName})`
              );
              texturePromises.push(Promise.resolve(material.map));
            }

            // Material 무광 처리
            makeMaterialMatte(material);
          }
        }
      });

      // 모든 텍스처 로드 완료 후 scene 설정
      Promise.allSettled(texturePromises).then(() => {
        console.log(
          `[텍스처 로드 완료] 총 ${texturePromises.length}개 텍스처 처리 완료`
        );

        // Material과 텍스처 매핑 정보 수집
        const materialTextureMap = new Map(); // material -> { texturePromise, materialType, materialInfo }

        // 1단계: 모든 Material의 텍스처 재로드 필요 여부 확인 및 Promise 생성
        cloned.traverse((child) => {
          if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((material) => {
              if (
                material.map &&
                material.map.image &&
                material.map.image.complete
              ) {
                const existingTexture = material.map;
                const textureSrc = existingTexture.image?.src || "";
                const isHttpUrl = textureSrc.startsWith("http");

                let texturePromise = Promise.resolve(existingTexture);

                if (isHttpUrl) {
                  const textureFileName = textureSrc.split("/").pop() || "";
                  if (textureFileName) {
                    const localTexturePath = baseDir + textureFileName;
                    console.log(
                      `[Material 재생성] HTTP URL 텍스처 감지: ${textureSrc.substring(
                        0,
                        60
                      )} -> ${localTexturePath}로 재로드`
                    );

                    texturePromise = new Promise((resolve) => {
                      const textureLoader = new TextureLoader();
                      // Vite 개발 서버에서는 상대 경로를 사용하되,
                      // 현재 페이지의 origin을 사용하여 절대 URL 생성
                      const textureUrl = localTexturePath.startsWith("/")
                        ? localTexturePath
                        : `/${localTexturePath}`;

                      textureLoader.load(
                        textureUrl,
                        (loadedTexture) => {
                          loadedTexture.flipY = false;
                          loadedTexture.colorSpace = "srgb";
                          loadedTexture.needsUpdate = true;

                          // 텍스처 이미지가 로드된 후 실제 src 확인
                          const actualSrc = loadedTexture.image?.src || "";
                          const isLocalPath =
                            actualSrc.includes(localTexturePath) ||
                            actualSrc.endsWith(textureFileName) ||
                            !actualSrc.startsWith("http");

                          console.log(
                            `[Material 재생성] 텍스처 재로드 완료: ${localTexturePath}, 요청URL=${textureUrl}, 실제이미지src=${actualSrc.substring(
                              0,
                              100
                            )}, 로컬경로=${isLocalPath}, 이미지완료=${
                              loadedTexture.image?.complete || false
                            }, 이미지크기=${
                              loadedTexture.image?.naturalWidth || 0
                            }x${loadedTexture.image?.naturalHeight || 0}`
                          );
                          resolve(loadedTexture);
                        },
                        undefined,
                        (error) => {
                          console.warn(
                            `[Material 재생성] 텍스처 재로드 실패: ${localTexturePath}`,
                            error
                          );
                          resolve(existingTexture);
                        }
                      );
                    });
                  }
                }

                materialTextureMap.set(material, {
                  texturePromise,
                  materialType: material.type || material.constructor.name,
                  materialInfo: material,
                  mesh: child,
                  isArray: Array.isArray(child.material),
                  materialIndex: Array.isArray(child.material)
                    ? child.material.indexOf(material)
                    : 0,
                });
              }
            });
          }
        });

        // 2단계: 모든 텍스처 로드 완료 후 Material 재생성
        const materialTexturePromises = Array.from(
          materialTextureMap.values()
        ).map((info) => info.texturePromise);

        Promise.allSettled(materialTexturePromises).then((results) => {
          // Material 재생성 함수
          const createNewMaterial = (
            materialType,
            texture,
            originalMaterial
          ) => {
            let newMaterial;

            if (materialType.includes("Phong")) {
              newMaterial = new MeshPhongMaterial({
                map: texture,
                color: 0xffffff,
                specular: 0x000000,
                shininess: 0,
                transparent: originalMaterial.transparent || false,
                opacity:
                  originalMaterial.opacity !== undefined
                    ? originalMaterial.opacity
                    : 1,
              });
            } else if (materialType.includes("Standard")) {
              newMaterial = new MeshStandardMaterial({
                map: texture,
                color: 0xffffff,
                metalness: 0,
                roughness: 1,
                transparent: originalMaterial.transparent || false,
                opacity:
                  originalMaterial.opacity !== undefined
                    ? originalMaterial.opacity
                    : 1,
              });
            } else if (materialType.includes("Basic")) {
              newMaterial = new MeshBasicMaterial({
                map: texture,
                color: 0xffffff,
                transparent: originalMaterial.transparent || false,
                opacity:
                  originalMaterial.opacity !== undefined
                    ? originalMaterial.opacity
                    : 1,
              });
            } else {
              newMaterial = originalMaterial.clone();
              newMaterial.map = texture;
              if (newMaterial.color) {
                newMaterial.color.set(0xffffff);
              }
            }

            if (originalMaterial.name) newMaterial.name = originalMaterial.name;

            if (newMaterial.needsUpdate !== undefined) {
              newMaterial.needsUpdate = true;
            }
            newMaterial.version = (newMaterial.version || 0) + 1;

            if (newMaterial.map) {
              if (newMaterial.map.needsUpdate !== undefined) {
                newMaterial.map.needsUpdate = true;
              }
            }

            return newMaterial;
          };

          // 각 Material에 대해 재생성된 Material 할당
          materialTextureMap.forEach((info, originalMaterial) => {
            const result =
              results[
                Array.from(materialTextureMap.keys()).indexOf(originalMaterial)
              ];
            const loadedTexture =
              result.status === "fulfilled"
                ? result.value
                : info.materialInfo.map;

            const newMaterial = createNewMaterial(
              info.materialType,
              loadedTexture,
              info.materialInfo
            );

            console.log(
              `[Material 재생성] "${
                info.materialInfo.name || "unnamed"
              }": 타입=${info.materialType} -> ${
                newMaterial.type
              }, map=${!!newMaterial.map}, color=${
                newMaterial.color?.getHexString() || "N/A"
              }, 이미지크기=${loadedTexture.image?.naturalWidth || 0}x${
                loadedTexture.image?.naturalHeight || 0
              }, 이미지완료=${loadedTexture.image?.complete || false}`
            );

            // Mesh에 Material 할당 (배열인 경우와 단일인 경우 모두 처리)
            if (info.isArray) {
              // 배열인 경우: 기존 배열을 복사하고 해당 인덱스만 교체
              const newMaterialArray = [...info.mesh.material];
              newMaterialArray[info.materialIndex] = newMaterial;
              info.mesh.material = newMaterialArray;
            } else {
              info.mesh.material = newMaterial;
            }

            // Material 업데이트
            if (newMaterial.needsUpdate !== undefined) {
              newMaterial.needsUpdate = true;
            }
            newMaterial.version = (newMaterial.version || 0) + 1;

            if (newMaterial.map && newMaterial.map.needsUpdate !== undefined) {
              newMaterial.map.needsUpdate = true;
            }

            // Mesh geometry 업데이트
            if (info.mesh.geometry) {
              info.mesh.geometry.attributesNeedUpdate = true;
              if (info.mesh.geometry.attributes.uv) {
                info.mesh.geometry.attributes.uv.needsUpdate = true;
              }
            }

            // Material 할당 확인
            const assignedMaterial = Array.isArray(info.mesh.material)
              ? info.mesh.material[info.materialIndex]
              : info.mesh.material;
            const texture = assignedMaterial?.map;

            // Vite 관련: HTTP URL이어도 정상일 수 있음 (vercel dev 프록시)
            const textureSrc = texture?.image?.src || "";
            const isViteDevServer =
              textureSrc.includes("localhost:3000") ||
              textureSrc.includes("localhost:5173") ||
              textureSrc.startsWith("/");

            console.log(
              `[Mesh Material 할당] mesh="${
                info.mesh.name || "unnamed"
              }", material 타입=${
                assignedMaterial?.type || "N/A"
              }, material.map=${!!texture}, material.color=${
                assignedMaterial?.color?.getHexString() || "N/A"
              }, material.version=${
                assignedMaterial?.version || "N/A"
              }, texture.image=${
                texture?.image ? "있음" : "없음"
              }, texture.complete=${
                texture?.image?.complete || false
              }, texture.src=${textureSrc}, Vite정상=${isViteDevServer}`
            );
          });

          // Material 재생성 후 Scene 강제 업데이트
          // Three.js가 Material 변경을 인식하도록 모든 Mesh를 다시 순회
          cloned.traverse((child) => {
            if (child.isMesh && child.material) {
              // Material 업데이트 강제
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
                  mat.version = (mat.version || 0) + 1;
                });
              } else {
                if (child.material.needsUpdate !== undefined) {
                  child.material.needsUpdate = true;
                }
                child.material.version = (child.material.version || 0) + 1;
              }

              // Geometry 업데이트 강제
              if (child.geometry) {
                child.geometry.attributesNeedUpdate = true;
                if (child.geometry.attributes.uv) {
                  child.geometry.attributes.uv.needsUpdate = true;
                }
              }
            }
          });

          normalizeModel(cloned);

          // Scene을 새로 복사하여 React Three Fiber가 변경을 감지하도록 함
          const updatedScene = cloned.clone();
          updatedScene.traverse((child) => {
            if (child.isMesh && child.material) {
              // Material 참조를 유지하되 업데이트 플래그 설정
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
                  mat.version = (mat.version || 0) + 1;
                });
              } else {
                if (child.material.needsUpdate !== undefined) {
                  child.material.needsUpdate = true;
                }
                child.material.version = (child.material.version || 0) + 1;
              }
            }
          });

          setScene(updatedScene);
          console.log(`[Scene 설정 완료] - Material 재생성 후 Scene 업데이트`);
        });
      });
    };

    // MTL 파일이 있는 경우 약간의 지연을 두고 처리 (MTL 로드 대기)
    // MTL 파일명이 modelPath에서 추론 가능하므로, 짧은 지연 후 처리
    if (modelPath.endsWith(".dae")) {
      // MTL 파일이 로드될 때까지 최대 500ms 대기
      const timeoutId = setTimeout(
        () => {
          processScene();
        },
        mtlContent ? 0 : 500
      ); // MTL이 이미 있으면 즉시, 없으면 500ms 대기

      return () => clearTimeout(timeoutId);
    } else {
      processScene();
    }
  }, [collada, modelPath, loadError, mtlContent]);

  if (loadError || !scene) return null;
  return <primitive object={scene} />;
}

// ==================== GLTF 모델 로더 ====================

function LoadedGLTFModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const [normalized, setNormalized] = useState(null);

  useEffect(() => {
    if (!scene) return;

    const cloned = clone(scene);

    // Material 무광 처리
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
  }, [scene]);

  if (!normalized) return null;
  return <primitive object={normalized} />;
}

// ==================== 메인 ModelLoader ====================

function LoadedModel({ modelPath }) {
  if (!modelPath) return null;

  const pathWithoutQuery = modelPath.split("?")[0];
  const ext = pathWithoutQuery.toLowerCase().split(".").pop();

  if (ext === "fbx") {
    return <LoadedFBXModel modelPath={modelPath} />;
  } else if (ext === "dae") {
    return <LoadedDAEModel modelPath={modelPath} />;
  } else if (ext === "glb" || ext === "gltf") {
    return <LoadedGLTFModel modelPath={modelPath} />;
  } else {
    // 기본값으로 DAE 시도
    return <LoadedDAEModel modelPath={modelPath} />;
  }
}

// Error Boundary
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("모델 로딩 실패:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial color="#4A90E2" metalness={0} roughness={1} />
          </mesh>
        </group>
      );
    }

    return this.props.children;
  }
}

// 최종 ModelLoader 컴포넌트
function ModelLoader({ modelPath }) {
  if (!modelPath) return null;

  return (
    <ModelErrorBoundary>
      <LoadedModel modelPath={modelPath} />
    </ModelErrorBoundary>
  );
}

export default ModelLoader;
