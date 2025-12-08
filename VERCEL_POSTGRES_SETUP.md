# Vercel Postgres 설정 가이드

사용자별 포켓몬 저장 기능을 위해 Vercel Postgres 데이터베이스를 설정해야 합니다.

## 1. Vercel Postgres 데이터베이스 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **Storage** 탭 클릭
4. **Create Database** 클릭
5. **Postgres** 선택
6. 데이터베이스 이름 입력 (예: `pokemon-db`)
7. **Create** 클릭

## 2. 데이터베이스 연결 정보 확인

1. 생성된 데이터베이스 클릭
2. **.env.local** 탭에서 연결 정보 확인:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

이 정보들은 자동으로 환경 변수로 설정됩니다.

## 3. 데이터베이스 테이블 생성

### 방법 1: Vercel Dashboard에서 직접 실행

1. Vercel Dashboard에서 데이터베이스 선택
2. **Query** 탭 클릭
3. `api/db/schema.sql` 파일의 내용을 복사하여 실행

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치 (아직 설치하지 않은 경우)
npm i -g vercel

# 프로젝트 연결
vercel link

# 환경 변수 가져오기
vercel env pull .env.local

# 로컬에서 스키마 실행 (선택사항)
# 또는 Vercel Dashboard의 Query 탭에서 실행
```

### 방법 3: API 엔드포인트로 초기화 (권장)

초기화 API 엔드포인트를 만들어서 한 번 실행:

```bash
# 배포 후
curl -X POST https://your-domain.vercel.app/api/db/init
```

또는 `api/db/init.js` 파일을 서버리스 함수로 배포하고 브라우저에서 접속하여 실행

## 4. 환경 변수 설정

Vercel Dashboard에서 자동으로 설정되지만, 로컬 개발을 위해 `.env.local` 파일 생성:

```env
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
```

**주의**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

## 5. 데이터베이스 스키마

### users 테이블

- `user_id` (VARCHAR, PRIMARY KEY): Google OAuth 사용자 ID
- `email` (VARCHAR): 사용자 이메일
- `name` (VARCHAR): 사용자 이름
- `picture` (TEXT): 프로필 사진 URL
- `created_at` (TIMESTAMP): 생성 시간
- `updated_at` (TIMESTAMP): 수정 시간

### user_pokemon 테이블

- `id` (SERIAL, PRIMARY KEY): 고유 ID
- `user_id` (VARCHAR, FOREIGN KEY): 사용자 ID
- `pokemon_id` (INTEGER): 포켓몬 ID
- `added_at` (TIMESTAMP): 추가 시간
- UNIQUE 제약: (user_id, pokemon_id) - 중복 저장 방지

## 6. 테스트

배포 후 API 엔드포인트 테스트:

```bash
# 포켓몬 목록 조회
curl "https://your-domain.vercel.app/api/pokemon?userId=test_user_id"

# 포켓몬 추가
curl -X POST "https://your-domain.vercel.app/api/pokemon?userId=test_user_id" \
  -H "Content-Type: application/json" \
  -d '{"pokemonId": 1, "email": "test@example.com", "name": "Test User"}'

# 포켓몬 삭제
curl -X DELETE "https://your-domain.vercel.app/api/pokemon/1?userId=test_user_id"
```

## 7. 트러블슈팅

### 연결 오류

- Vercel Dashboard에서 데이터베이스 연결 정보 확인
- 환경 변수가 올바르게 설정되었는지 확인

### 테이블이 없음

- `api/db/schema.sql`의 SQL을 Vercel Dashboard의 Query 탭에서 실행

### CORS 오류

- API 엔드포인트의 CORS 헤더 확인
- 프론트엔드 도메인이 올바른지 확인

## 참고

- Vercel Postgres는 무료 플랜에서도 사용 가능 (제한 있음)
- 프로덕션 환경에서는 적절한 데이터베이스 백업 전략 수립 권장
- 대량의 데이터를 다룰 경우 인덱스 최적화 고려
