# 로컬 개발 환경 설정

## 개발 방법

### 방법 1: Vercel Dev 사용 (권장)

모든 것을 한 번에 실행합니다:

```bash
vercel dev
```

이 명령어는:

- Vite 개발 서버를 실행합니다 (포트 5173)
- API 서버를 실행합니다 (포트 3000)
- 자동으로 프록시를 설정합니다

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 방법 2: 분리된 서버 사용

두 개의 터미널이 필요합니다:

**터미널 1 - API 서버:**

```bash
vercel dev --listen 3000
```

**터미널 2 - Vite 개발 서버:**

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

## 문제 해결

### `npm run dev`만 실행하면 API 오류가 발생하는 경우

`npm run dev`는 Vite 개발 서버만 실행합니다. API를 사용하려면:

- 방법 1을 사용하거나
- 방법 2에서 `vercel dev --listen 3000`을 먼저 실행하세요

### `vercel dev`를 실행하면 페이지가 로드되지 않는 경우

1. `vercel.json`이 올바르게 설정되어 있는지 확인하세요
2. 포트가 이미 사용 중인지 확인하세요:
   ```bash
   lsof -i :3000
   lsof -i :5173
   ```
3. 캐시를 지우고 다시 시도하세요:
   ```bash
   rm -rf .vercel
   vercel dev
   ```

## 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
POSTGRES_URL=your_postgres_url
DATABASE_URL=your_database_url
```
