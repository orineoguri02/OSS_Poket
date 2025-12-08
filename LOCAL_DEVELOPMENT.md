# 로컬 개발 환경 가이드

로컬에서 포켓몬 저장 기능을 테스트하는 방법입니다.

## 로컬 개발의 제한사항

### ❌ 로컬에서 작동하지 않는 것들

1. **Vercel 서버리스 함수 (`/api` 경로)**

   - Vite는 서버리스 함수를 직접 실행하지 않습니다
   - `npm run dev`로 실행하면 `/api` 경로가 404 에러를 반환합니다

2. **Vercel Postgres 데이터베이스**
   - Vercel Postgres는 Vercel 플랫폼에서만 작동합니다
   - 로컬에서 직접 연결할 수 없습니다

### ✅ 로컬에서 작동하는 것들

1. **프론트엔드 UI**

   - 모든 React 컴포넌트
   - 드래그 앤 드롭 UI
   - 로그인 UI (Google OAuth는 작동)

2. **상태 관리**
   - Context API
   - 로컬 스토리지 (로그인 정보)

## 로컬에서 테스트하는 방법

### 방법 1: Vercel CLI 사용 (권장)

Vercel CLI를 사용하면 로컬에서도 서버리스 함수와 데이터베이스를 사용할 수 있습니다.

#### 설치 및 설정

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 루트에서 실행
cd /Users/woo-hyun/Desktop/KimWooHyun/OSS/TP/OSS_Poket

# Vercel 프로젝트 연결
vercel link
```

처음 실행하면:

- 기존 프로젝트 연결 또는 새 프로젝트 생성 선택
- 프로젝트 이름 입력
- 설정 파일 확인

#### 로컬 개발 서버 실행

```bash
# 로컬에서 Vercel 환경 실행
vercel dev
```

이제:

- `http://localhost:3000`에서 실행됩니다
- 서버리스 함수 (`/api`)가 작동합니다
- Vercel Postgres 데이터베이스에 연결됩니다
- 환경 변수가 자동으로 로드됩니다

#### 장점

- ✅ 실제 프로덕션 환경과 동일하게 작동
- ✅ 데이터베이스 연결 가능
- ✅ API 엔드포인트 작동
- ✅ 환경 변수 자동 로드

#### 단점

- ⚠️ 인터넷 연결 필요
- ⚠️ Vercel 계정 필요

### 방법 2: Vercel에 배포 후 테스트

로컬에서는 UI만 확인하고, 실제 데이터 저장은 배포된 사이트에서 테스트합니다.

#### 배포

```bash
# Vercel CLI로 배포
vercel

# 또는 GitHub에 push하면 자동 배포
git push origin main
```

#### 테스트

1. 배포된 URL 접속 (예: `https://your-project.vercel.app`)
2. 로그인
3. 포켓몬 드래그 앤 드롭으로 저장
4. "나의 포켓몬" 페이지에서 확인

#### 장점

- ✅ 실제 사용자 환경과 동일
- ✅ 데이터베이스 정상 작동
- ✅ 모든 기능 테스트 가능

#### 단점

- ⚠️ 배포 시간 소요
- ⚠️ 변경사항마다 재배포 필요

### 방법 3: 로컬 Mock 데이터 사용 (개발용)

로컬 스토리지나 메모리 상태로 UI만 테스트합니다.

**주의**: 이 방법은 데이터베이스 없이 UI만 테스트하는 용도입니다.

## 추천 워크플로우

### 개발 단계

1. **로컬에서 UI 개발**

   ```bash
   npm run dev
   ```

   - 컴포넌트 스타일링
   - 드래그 앤 드롭 UI 테스트
   - 로그인 UI 테스트

2. **Vercel CLI로 기능 테스트**

   ```bash
   vercel dev
   ```

   - API 연동 테스트
   - 데이터베이스 저장 테스트
   - 전체 플로우 테스트

3. **배포 후 최종 확인**
   ```bash
   vercel --prod
   ```
   - 프로덕션 환경에서 최종 테스트

## Vercel Postgres 설정이 필요한 이유

### 로컬에서 데이터 저장을 테스트하려면:

1. **Vercel Postgres 데이터베이스 생성** (필수)

   - Vercel Dashboard > Storage > Create Database > Postgres
   - 자동으로 환경 변수 설정됨

2. **데이터베이스 테이블 생성** (필수)

   - Vercel Dashboard > Storage > 데이터베이스 > Query 탭
   - `api/db/schema.sql` 실행
   - 또는 `/api/db/init` 엔드포인트 호출

3. **Vercel CLI 사용** (로컬 테스트용)
   ```bash
   vercel dev
   ```
   - 로컬에서도 Vercel Postgres에 연결됨

### 배포된 환경에서만 테스트하려면:

1. **Vercel Postgres 설정** (위와 동일)
2. **배포**
   ```bash
   vercel --prod
   ```
3. **배포된 사이트에서 테스트**

## 요약

| 환경          | 서버리스 함수 | 데이터베이스 | 테스트 가능 |
| ------------- | ------------- | ------------ | ----------- |
| `npm run dev` | ❌            | ❌           | UI만        |
| `vercel dev`  | ✅            | ✅           | 전체 기능   |
| 배포된 사이트 | ✅            | ✅           | 전체 기능   |

**결론**: 로컬에서 데이터 저장을 테스트하려면 **Vercel CLI (`vercel dev`)**를 사용하거나 **Vercel에 배포**해야 합니다.

## 빠른 시작

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 연결
vercel link

# 3. 로컬 개발 서버 실행 (데이터베이스 포함)
vercel dev
```

이제 `http://localhost:3000`에서 모든 기능을 테스트할 수 있습니다!
