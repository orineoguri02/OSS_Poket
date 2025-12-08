# 로컬에서 Vercel Postgres 연결하기

Vercel Postgres는 외부에서 접근 가능하므로 로컬에서도 연결할 수 있습니다.

## 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Vercel Postgres 연결 정보
POSTGRES_URL="postgres://efbbca436fdf0b19159ece2304c273d4e959d4f40612932933a0885f03d23ff2:sk_OLxabLH59As4lLGnRQ4yV@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_PRISMA_URL="postgres://efbbca436fdf0b19159ece2304c273d4e959d4f40612932933a0885f03d23ff2:sk_OLxabLH59As4lLGnRQ4yV@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19PTHhhYkxINTlBczRsTEduUlE0eVYiLCJhcGlfa2V5IjoiMDFLQlhQV01YSldLNVhXMkdDQktSOEVKOFgiLCJ0ZW5hbnRfaWQiOiJlZmJiY2E0MzZmZGYwYjE5MTU5ZWNlMjMwNGMyNzNkNGU5NTlkNGY0MDYxMjkzMjkzM2EwODg1ZjAzZDIzZmYyIiwiaW50ZXJuYWxfc2VjcmV0IjoiYzRhMTdlODAtMDE3ZS00N2NiLWI2NDAtYTFhYTVhZDBiZWE2In0.4x6RRolW2KDC5cocnYuqjrU_c9mugPyYhvczmDWP6mc"

# Google OAuth (이미 설정되어 있다면)
VITE_GOOGLE_CLIENT_ID=587814759738-95ppch8e6ahbdu22554d34bs5d501u9o.apps.googleusercontent.com
```

## 2. 로컬에서 테스트하는 방법

### 방법 1: Vercel CLI 사용 (권장)

Vercel CLI를 사용하면 환경 변수를 자동으로 로드하고 서버리스 함수도 실행할 수 있습니다.

```bash
# Vercel CLI 설치 (아직 설치하지 않은 경우)
npm i -g vercel

# 프로젝트 연결
vercel link

# 환경 변수 가져오기 (Vercel에서 자동으로 가져옴)
vercel env pull .env.local

# 로컬 개발 서버 실행
vercel dev
```

이제 `http://localhost:3000`에서 실행되며:

- ✅ 서버리스 함수 (`/api`) 작동
- ✅ Vercel Postgres 연결
- ✅ 모든 기능 테스트 가능

### 방법 2: Vite 개발 서버 + 수동 환경 변수 설정

Vite 개발 서버를 사용하되, 환경 변수만 설정하는 방법입니다.

**주의**: 이 방법은 서버리스 함수가 작동하지 않으므로 API 테스트는 불가능합니다.

```bash
# .env.local 파일에 환경 변수 설정 (위 참고)

# Vite 개발 서버 실행
npm run dev
```

**제한사항**:

- ❌ `/api` 경로가 작동하지 않음 (404 에러)
- ✅ UI는 정상 작동
- ✅ 데이터베이스 직접 연결은 가능하지만 API를 통하지 않으면 의미 없음

### 방법 3: 직접 PostgreSQL 클라이언트 사용

데이터베이스에 직접 연결하여 테이블을 확인하거나 수동으로 데이터를 조작할 수 있습니다.

```bash
# psql 설치 (Mac)
brew install postgresql

# 또는 Docker 사용
docker run -it --rm postgres psql "postgres://efbbca436fdf0b19159ece2304c273d4e959d4f40612932933a0885f03d23ff2:sk_OLxabLH59As4lLGnRQ4yV@db.prisma.io:5432/postgres?sslmode=require"
```

## 3. 데이터베이스 테이블 생성

로컬에서 테스트하기 전에 데이터베이스 테이블을 생성해야 합니다.

### 방법 1: API 엔드포인트 사용 (Vercel CLI 사용 시)

```bash
# vercel dev 실행 후
curl http://localhost:3000/api/db/init
```

### 방법 2: Vercel Dashboard 사용

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 > Storage > 데이터베이스 선택
3. **Query** 탭 클릭
4. `api/db/schema.sql` 파일의 내용 복사하여 실행

### 방법 3: 직접 SQL 실행

PostgreSQL 클라이언트로 직접 연결하여 실행:

```sql
-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자별 포켓몬 저장 테이블 생성
CREATE TABLE IF NOT EXISTS user_pokemon (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, pokemon_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_pokemon_user_id ON user_pokemon(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pokemon_pokemon_id ON user_pokemon(pokemon_id);
```

## 4. 테스트 확인

### Vercel CLI 사용 시

```bash
# 1. vercel dev 실행
vercel dev

# 2. 브라우저에서 http://localhost:3000 접속
# 3. 로그인
# 4. 포켓몬 드래그 앤 드롭으로 저장
# 5. "나의 포켓몬" 페이지에서 확인
```

### 데이터베이스 직접 확인

```sql
-- 저장된 포켓몬 확인
SELECT * FROM user_pokemon;

-- 사용자 확인
SELECT * FROM users;
```

## 5. 주의사항

### 보안

⚠️ **중요**:

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- 이미 `.gitignore`에 추가되어 있습니다
- 데이터베이스 연결 정보는 민감한 정보입니다

### 환경 변수 우선순위

Vercel CLI (`vercel dev`)를 사용하면:

1. Vercel Dashboard의 환경 변수가 우선
2. `.env.local` 파일의 환경 변수는 보조

### 연결 제한

- Vercel Postgres는 연결 수 제한이 있을 수 있습니다
- 동시에 여러 환경에서 연결하면 제한에 걸릴 수 있습니다

## 6. 문제 해결

### 연결 오류

```
Error: connect ECONNREFUSED
```

**해결**:

- 연결 문자열 확인
- 방화벽 설정 확인
- Vercel Dashboard에서 데이터베이스 상태 확인

### 테이블이 없다는 에러

```
relation "users" does not exist
```

**해결**:

- 위의 "데이터베이스 테이블 생성" 섹션 참고
- `api/db/schema.sql` 실행

### 환경 변수가 로드되지 않음

**해결**:

- `.env.local` 파일 위치 확인 (프로젝트 루트)
- 파일 이름 확인 (`.env.local` 정확히)
- Vercel CLI 사용 시 `vercel env pull .env.local` 실행

## 요약

| 방법          | 서버리스 함수 | 데이터베이스 | 추천            |
| ------------- | ------------- | ------------ | --------------- |
| `vercel dev`  | ✅            | ✅           | ⭐⭐⭐          |
| `npm run dev` | ❌            | ❌           | ⭐ (UI만)       |
| 직접 SQL      | N/A           | ✅           | ⭐⭐ (디버깅용) |

**결론**: 로컬에서 완전한 테스트를 하려면 **`vercel dev`**를 사용하세요!
