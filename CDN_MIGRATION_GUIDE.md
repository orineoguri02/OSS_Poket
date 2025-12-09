# CDN 마이그레이션 가이드

## 📋 개요

포켓몬 3D 모델 파일(약 29MB)을 Vercel Blob Storage로 이동하여 배포 패키지를 가볍게 만듭니다.

**효과**:

- 현재: 배포 패키지에 29MB 포함
- 마이그레이션 후: 배포 패키지 <1MB (약 97% 감소)
- 151개 포켓몬 확장 시: 약 238MB → <1MB (99% 감소)

---

## 🚀 단계별 실행 가이드

### 1단계: Vercel Blob Storage 설정

1. **Vercel 대시보드 접속**

   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Blob Storage 생성**

   - Settings → Storage → Create Database
   - "Blob" 선택
   - 이름 입력 (예: `pokemon-models`)

3. **토큰 생성**

   - Storage → Blob → Settings → Tokens
   - "Create Token" 클릭
   - 이름: `pokemon-models-token`
   - 권한: Read and Write
   - 토큰 복사

4. **환경 변수 설정**

   ```bash
   # .env.local 파일에 추가
   BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx...
   ```

   또는 Vercel 대시보드에서:

   - Settings → Environment Variables
   - `BLOB_READ_WRITE_TOKEN` 추가

---

### 2단계: 데이터베이스 마이그레이션

```bash
# Prisma 스키마 변경사항 적용
npm run db:push

# 또는
npx prisma db push
```

이 명령어는 `PokemonModel` 테이블을 생성합니다.

---

### 3단계: 파일 업로드 (CDN으로 이동)

```bash
# 모든 포켓몬 모델 업로드 (1-151번)
node scripts/uploadModelsToCDN.js

# 특정 범위만 업로드
node scripts/uploadModelsToCDN.js 1 19  # 1번부터 19번까지
```

**예상 시간**: 약 5-10분 (네트워크 속도에 따라 다름)

**진행 상황**:

```
🚀 포켓몬 3D 모델 CDN 업로드 시작

범위: 1번부터 151번까지

✓ 업로드 완료: 1번 - pm0001_00_00.dae
  CDN URL: https://xxx.vercel-storage.com/pokemon/1/pm0001_00_00.dae
  파일 크기: 1234.56 KB
✓ DB 저장 완료: 1번

...
```

---

### 4단계: 테스트

1. **로컬 서버 실행**

   ```bash
   vercel dev
   ```

2. **브라우저에서 확인**

   - http://localhost:3000/pokemon/1 접속
   - 개발자 도구 → Network 탭 확인
   - 모델 파일이 CDN URL에서 로드되는지 확인

3. **DB 확인 (선택사항)**
   ```bash
   npx prisma studio
   ```
   - `PokemonModel` 테이블에서 데이터 확인

---

### 5단계: 배포 패키지에서 제외 (선택사항)

CDN 마이그레이션이 완료되면 `public/pokemon` 폴더를 배포에서 제외할 수 있습니다.

**주의**: 완전히 제거하기 전에 모든 포켓몬이 CDN에 업로드되었는지 확인하세요!

#### 방법 1: .gitignore에 추가 (로컬 개발용으로만 유지)

```gitignore
# CDN으로 마이그레이션된 파일들 (배포 시 제외)
/public/pokemon/**/*.dae
/public/pokemon/**/*.fbx
/public/pokemon/**/*.obj
/public/pokemon/**/*.glb
/public/pokemon/**/*.gltf
```

#### 방법 2: Vercel 빌드 설정

`vercel.json`에 추가:

```json
{
  "build": {
    "env": {
      "EXCLUDE_POKEMON_MODELS": "true"
    }
  }
}
```

---

## 🔍 확인 사항

### 업로드 확인

```bash
# DB에서 확인
npx prisma studio

# 또는 API로 확인
curl http://localhost:3000/api/pokemon/1/model
```

### CDN URL 확인

응답 예시:

```json
{
  "pokemon_id": 1,
  "model_path": "/pokemon/1/pm0001_00_00.dae",
  "cdn_url": "https://xxx.vercel-storage.com/pokemon/1/pm0001_00_00.dae",
  "model_type": "dae",
  "storage_type": "cdn",
  "url": "https://xxx.vercel-storage.com/pokemon/1/pm0001_00_00.dae"
}
```

---

## ⚠️ 문제 해결

### 1. "BLOB_READ_WRITE_TOKEN 환경 변수가 필요합니다"

- `.env.local` 파일에 토큰 추가 확인
- `vercel dev` 실행 시 환경 변수 로드 확인

### 2. "업로드 실패: 403 Forbidden"

- 토큰 권한 확인 (Read and Write 필요)
- 토큰이 만료되지 않았는지 확인

### 3. "모델 파일 없음"

- `public/pokemon/{id}/` 폴더에 파일이 있는지 확인
- 파일명이 올바른지 확인

### 4. API에서 모델을 찾을 수 없음

- DB 마이그레이션 실행 확인 (`npm run db:push`)
- 업로드 스크립트가 성공적으로 완료되었는지 확인

---

## 📊 마이그레이션 전/후 비교

| 항목             | 마이그레이션 전 | 마이그레이션 후 |
| ---------------- | --------------- | --------------- |
| 배포 패키지 크기 | ~29MB           | <1MB            |
| 초기 로딩 속도   | 느림            | 빠름            |
| CDN 캐싱         | ❌              | ✅              |
| 파일 관리        | 하드코딩        | DB 관리         |
| 확장성 (151개)   | ~238MB          | <1MB            |

---

## 🎯 다음 단계

1. ✅ CDN 마이그레이션 완료
2. 🔄 배포 및 테스트
3. 📦 `public/pokemon` 폴더 제외 (선택사항)
4. 🚀 프로덕션 배포

---

## 💡 추가 최적화 아이디어

1. **Lazy Loading**: 사용자가 포켓몬 상세 페이지 접근 시에만 모델 로드
2. **프리로딩**: 자주 사용되는 포켓몬 모델 프리로드
3. **파일 압축**: GLB 형식으로 변환 (더 작은 파일 크기)
4. **레벨 오브 디테일 (LOD)**: 거리에 따라 다른 해상도 모델 사용
