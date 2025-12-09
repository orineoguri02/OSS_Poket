# CDN 저장 전략 설명

## 📋 현재 상태 (하이브리드 방식)

### 현재 구조

```
public/pokemon/          ← 로컬 파일 (29MB) - 여전히 존재
    ├── 1/
    ├── 2/
    └── ...

Vercel Blob Storage      ← CDN 파일 (동일한 파일들)
    └── pokemon/
        ├── 1/
        ├── 2/
        └── ...
```

### 동작 방식

1. **우선순위**: CDN URL → 로컬 경로 → 폴백 경로
2. **CDN이 있으면**: CDN에서 로드 (빠름, 캐싱)
3. **CDN이 없으면**: 로컬 파일 사용 (안전장치)
4. **API 실패 시**: 로컬 파일 사용 (안전장치)

### 코드 예시

```javascript
// helpers.js
return data.url || data.cdn_url || data.model_path || getFallbackPath(pokeId);
//      ↑ CDN    ↑ CDN          ↑ 로컬 경로      ↑ 폴백
```

---

## 🎯 최종 목표

### 목표 구조

```
public/pokemon/          ← 제거 (배포 패키지에서 제외)
    (파일 없음)

Vercel Blob Storage      ← CDN 파일만 사용
    └── pokemon/
        ├── 1/
        ├── 2/
        └── ...
```

### 동작 방식

1. **CDN에서만 로드**: 모든 모델 파일이 CDN에서 제공
2. **배포 패키지 가벼움**: 29MB → <1MB
3. **CDN 캐싱**: 전 세계 빠른 로딩

---

## ❓ 질문에 대한 답변

> "public에 있는 pokemon 폴더의 3d 파일은 기존처럼 저장하되 CDN을 이용하여 용량을 줄이는 개념이 맞을까?"

### 답변: 부분적으로 맞지만, 최종 목표는 다릅니다

#### 현재 (하이브리드 방식) ✅

- **public 폴더**: 파일 유지 (안전장치)
- **CDN**: 우선 사용
- **효과**: CDN 캐싱으로 속도 향상
- **문제**: 배포 패키지에 여전히 29MB 포함 (용량 감소 없음)

#### 최종 목표 (CDN 전용) ⭐

- **public 폴더**: 파일 제거 또는 배포에서 제외
- **CDN**: 유일한 소스
- **효과**:
  - ✅ 배포 패키지 29MB → <1MB (97% 감소)
  - ✅ CDN 캐싱으로 빠른 로딩
  - ✅ 전 세계 최적화된 속도

---

## 🚀 단계별 마이그레이션 전략

### Phase 1: 현재 (하이브리드) ✅ 완료

- CDN 업로드 완료
- 로컬 파일 유지 (안전장치)
- CDN 우선 사용

**장점**:

- 안전 (CDN 실패 시 로컬 폴백)
- 점진적 마이그레이션 가능

**단점**:

- 배포 패키지 여전히 무거움 (29MB)

---

### Phase 2: CDN 전용 (권장) ⭐

#### 옵션 A: public 폴더 제거 (완전 제거)

```bash
# 1. 모든 파일이 CDN에 업로드되었는지 확인
node scripts/uploadModelsToCDN.js

# 2. public/pokemon 폴더 백업 (선택사항)
cp -r public/pokemon public/pokemon.backup

# 3. public/pokemon 폴더 제거
rm -rf public/pokemon

# 4. .gitignore에 추가 (로컬 개발용으로만 유지)
echo "public/pokemon/" >> .gitignore
```

**장점**:

- 배포 패키지 최소화 (29MB → <1MB)
- 단일 소스 (CDN만 사용)

**단점**:

- 로컬 개발 시 인터넷 필요
- CDN 장애 시 작동 불가

---

#### 옵션 B: 배포에서만 제외 (권장) ⭐⭐⭐

**방법 1: .gitignore 사용**

```gitignore
# .gitignore
# CDN으로 마이그레이션된 파일들 (배포 시 제외)
/public/pokemon/**/*.dae
/public/pokemon/**/*.fbx
/public/pokemon/**/*.obj
/public/pokemon/**/*.glb
/public/pokemon/**/*.gltf
```

**방법 2: Vercel 빌드 설정**

```json
// vercel.json
{
  "build": {
    "env": {
      "EXCLUDE_POKEMON_MODELS": "true"
    }
  },
  "ignore": ["public/pokemon/**"]
}
```

**방법 3: 빌드 스크립트 수정**

```json
// package.json
{
  "scripts": {
    "build": "rm -rf public/pokemon && vite build",
    "build:with-models": "vite build"
  }
}
```

**장점**:

- 로컬 개발: 파일 유지 (오프라인 가능)
- 배포: 파일 제외 (가벼운 패키지)
- 최적의 균형

---

## 📊 비교표

| 방식                  | 배포 크기 | 로컬 개발 | CDN 캐싱 | 안전성 | 추천도     |
| --------------------- | --------- | --------- | -------- | ------ | ---------- |
| **하이브리드 (현재)** | 29MB      | ✅        | ✅       | ⭐⭐⭐ | ⭐⭐       |
| **CDN 전용 (제거)**   | <1MB      | ❌        | ✅       | ⭐     | ⭐⭐⭐     |
| **배포 제외 (권장)**  | <1MB      | ✅        | ✅       | ⭐⭐   | ⭐⭐⭐⭐⭐ |

---

## 💡 권장 사항

### 즉시 적용 가능 (옵션 B - 배포 제외)

1. **.gitignore에 추가**

   ```bash
   echo "public/pokemon/**/*.dae" >> .gitignore
   echo "public/pokemon/**/*.fbx" >> .gitignore
   echo "public/pokemon/**/*.obj" >> .gitignore
   ```

2. **빌드 스크립트 수정**

   ```json
   {
     "scripts": {
       "build": "rm -rf public/pokemon && vite build"
     }
   }
   ```

3. **테스트**
   ```bash
   npm run build
   # dist 폴더 크기 확인 (29MB → <1MB)
   ```

### 장기적 (모든 포켓몬 업로드 후)

1. 모든 포켓몬 모델 CDN 업로드 완료
2. 프로덕션에서 충분히 테스트
3. public/pokemon 폴더 완전 제거 또는 .gitignore로 관리

---

## 🔍 확인 방법

### 배포 패키지 크기 확인

```bash
# 빌드 후 크기 확인
npm run build
du -sh dist/

# 예상 결과
# 마이그레이션 전: ~29MB
# 마이그레이션 후: <1MB
```

### CDN 동작 확인

```bash
# 브라우저 개발자 도구 → Network 탭
# 모델 파일이 CDN URL에서 로드되는지 확인
# 예: https://xxx.vercel-storage.com/pokemon/1/pm0001_00_00.dae
```

---

## ⚠️ 주의사항

1. **모든 파일 업로드 확인**: 모든 포켓몬 모델이 CDN에 업로드되었는지 확인
2. **테스트**: 프로덕션 배포 전 충분한 테스트
3. **백업**: public/pokemon 폴더 제거 전 백업 권장
4. **점진적 진행**: 한 번에 모든 파일 제거하지 말고 단계적으로 진행

---

## 🎯 결론

**현재**: 하이브리드 방식 (CDN 우선, 로컬 폴백)

- ✅ 안전하지만 배포 패키지 무거움

**목표**: CDN 전용 (배포에서 제외)

- ✅ 배포 패키지 가벼움 + CDN 캐싱
- ✅ 로컬 개발은 파일 유지 가능

**권장**: 옵션 B (배포에서만 제외)

- ✅ 최적의 균형점
