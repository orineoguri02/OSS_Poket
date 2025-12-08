# 3D 모델 파일 추가 가이드

포켓몬 3D 모델 파일을 쉽게 추가하는 방법입니다.

## 방법 1: 대화형 모드 (가장 쉬움)

```bash
node scripts/addModel.js
```

실행하면 포켓몬 번호와 파일 경로를 순서대로 입력받습니다.
파일 경로는 드래그 앤 드롭으로 입력할 수 있습니다.

## 방법 2: 명령줄 모드

```bash
node scripts/addModel.js [포켓몬번호] [모델파일경로]
```

예시:

```bash
node scripts/addModel.js 15 /Users/username/Downloads/pikachu.dae
```

## 방법 3: 폴더 모드 (여러 파일 한번에)

```bash
node scripts/addModel.js [폴더경로]
```

폴더 내 모든 모델 파일을 자동으로 감지하고, 파일명에서 포켓몬 번호를 추정하여 추가합니다.

예시:

```bash
node scripts/addModel.js /Users/username/Downloads/pokemon_models
```

## 모델 경로 업데이트

모델 파일을 추가한 후, 다음 명령어로 `pokemonDetails.js`에 경로를 자동으로 추가합니다:

```bash
# 특정 포켓몬만 업데이트
node scripts/scanModelPaths.js 15 15

# 전체 업데이트
node scripts/scanModelPaths.js
```

## 지원하는 파일 형식

- `.dae` (Collada)
- `.obj` (Wavefront OBJ)
- `.fbx` (Autodesk FBX)
- `.glb` (glTF Binary)
- `.gltf` (glTF)

## 자동 복사되는 관련 파일

모델 파일과 같은 이름의 다음 파일들도 자동으로 복사됩니다:

- `.mtl` (Material 파일)
- `.obj` (OBJ 파일)
- `.png`, `.jpg`, `.jpeg` (텍스처 파일)

## 파일 구조

모델 파일은 다음 위치에 저장됩니다:

```
public/pokemon/{포켓몬번호}/{파일명}
```

예시:

```
public/pokemon/15/pikachu.dae
public/pokemon/15/pikachu.mtl
public/pokemon/15/pikachu.png
```

## 주의사항

1. 파일명에 포켓몬 번호가 포함되어 있으면 자동으로 추정됩니다 (예: `pm0015_00_00.dae`)
2. 모델 파일과 관련 파일(.mtl, 텍스처 등)은 같은 폴더에 있어야 합니다
3. 모델 파일을 추가한 후 반드시 `scanModelPaths.js`를 실행하여 경로를 업데이트하세요

