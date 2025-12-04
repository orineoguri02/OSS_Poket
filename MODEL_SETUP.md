# Lapras 3D 모델 설정 가이드

## 모델 파일 다운로드

1. [The Models Resource - Lapras 페이지](https://models.spriters-resource.com/wii_u/pokkentournament/asset/298328/)에서 모델을 다운로드하세요.

2. 다운로드한 ZIP 파일을 압축 해제하면 다음 형식의 파일들이 포함되어 있습니다:
   - `.dae` (Collada) - **권장**
   - `.fbx` (Autodesk FBX) - **권장**
   - `.smd` (Source Engine)
   - 텍스처 파일들: `Body.png`, `Eyes.png` 등

## 모델 파일 사용 방법

### 방법 1: FBX 파일 직접 사용 (가장 간단)

1. 다운로드한 ZIP 파일을 압축 해제합니다.
2. `Lapras/a131.fbx` 파일을 찾습니다.
3. 이 파일을 `public` 폴더에 `lapras.fbx`로 복사합니다.

```
my-3d-app/
├── public/
│   ├── lapras.fbx          ← 여기에 FBX 파일 저장
│   └── ...
```

4. 브라우저에서 `/pokemon/131` 경로로 이동하면 Lapras 3D 모델이 표시됩니다!

### 방법 2: DAE 파일 직접 사용

1. 다운로드한 ZIP 파일을 압축 해제합니다.
2. `Lapras/a131.dae` 파일을 찾습니다.
3. 이 파일을 `public` 폴더에 `lapras.dae`로 복사합니다.
4. `Detail.jsx`에서 모델 경로를 `/lapras.dae`로 변경합니다.

### 방법 3: GLTF/GLB로 변환 (선택사항)

더 나은 성능을 원한다면 GLTF/GLB로 변환할 수 있습니다:

1. [Blender](https://www.blender.org/)를 다운로드하고 설치하세요.
2. Blender를 열고 File > Import > FBX (또는 Collada)를 선택하여 다운로드한 모델을 가져오세요.
3. 모델이 로드되면 File > Export > glTF 2.0을 선택하세요.
4. Export 설정:
   - Format: glTF Binary (.glb) 선택
   - Include: 필요한 옵션 선택 (보통 기본값으로 충분)
5. `lapras.glb` 파일을 `public` 폴더에 저장하세요.
6. `Detail.jsx`에서 모델 경로를 `/lapras.glb`로 변경합니다.

## 텍스처 파일 (선택사항)

모델에 텍스처를 적용하려면:

1. ZIP 파일에서 텍스처 파일들을 찾습니다:
   - `Body.png`, `Body_norm.png`, `Body_pow.png`, `Body_spc.png`
   - `Eyes.png`, `Eyes_norm.png`, `Eyes_pow.png`, `Eyes_spc.png`

2. 이 파일들을 `public` 폴더에 저장합니다.

3. 모델 파일(DAE/FBX)이 텍스처 경로를 상대 경로로 참조하는 경우, 모델 파일과 같은 폴더 구조를 유지해야 할 수 있습니다.

## 현재 지원하는 형식

- ✅ FBX (`.fbx`) - 직접 지원
- ✅ DAE (`.dae`) - 직접 지원  
- ✅ GLB/GLTF (`.glb`, `.gltf`) - 직접 지원

## 문제 해결

- 모델이 보이지 않으면:
  1. 파일 경로가 정확한지 확인 (`/lapras.fbx` 또는 `/lapras.dae`)
  2. 브라우저 콘솔에서 에러 메시지 확인 (F12)
  3. 파일이 `public` 폴더에 올바르게 저장되었는지 확인

- 모델 크기가 이상하면:
  - `Lapras3D.jsx`의 `scale` 속성을 조정하세요
  - FBX 파일의 경우 기본적으로 `scale={[0.01, 0.01, 0.01]}`로 설정되어 있습니다

- 텍스처가 보이지 않으면:
  - 모델 파일과 텍스처 파일이 같은 폴더에 있는지 확인
  - 또는 텍스처 경로를 수동으로 수정해야 할 수 있습니다
