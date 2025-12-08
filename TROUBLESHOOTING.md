# 포켓몬 저장 실패 문제 해결 가이드

포켓몬 저장이 실패하는 경우 다음을 확인하세요.

## 1. 브라우저 콘솔 확인

### 개발자 도구 열기

- Chrome/Edge: `F12` 또는 `Ctrl+Shift+I` (Mac: `Cmd+Option+I`)
- 콘솔 탭에서 에러 메시지 확인

### 확인할 에러들

#### 에러 1: "Failed to fetch" 또는 네트워크 에러

```
포켓몬 추가 실패: TypeError: Failed to fetch
```

**원인**: API 엔드포인트를 찾을 수 없음

**해결 방법**:

- 로컬 개발 환경에서는 Vercel 서버리스 함수가 작동하지 않습니다
- Vercel에 배포하거나, 로컬에서 테스트하려면 Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 로컬에서 Vercel 서버리스 함수 실행
vercel dev
```

#### 에러 2: "서버 오류가 발생했습니다"

```
포켓몬 추가 실패: 서버 오류가 발생했습니다. details: ...
```

**원인**: 데이터베이스 연결 문제 또는 테이블이 없음

**해결 방법**:

1. Vercel Postgres 데이터베이스가 생성되었는지 확인
2. 데이터베이스 테이블이 생성되었는지 확인

#### 에러 3: "userId가 필요합니다"

```
포켓몬 추가 실패: userId가 필요합니다.
```

**원인**: 로그인 정보가 제대로 전달되지 않음

**해결 방법**:

- 로그아웃 후 다시 로그인
- 브라우저 개발자 도구 > Application > Local Storage에서 `pokemon_user` 확인

## 2. 데이터베이스 확인

### Vercel Postgres 설정 확인

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Storage** 탭 클릭
4. Postgres 데이터베이스가 있는지 확인

### 데이터베이스 테이블 생성 확인

1. Vercel Dashboard > Storage > 데이터베이스 선택
2. **Query** 탭 클릭
3. 다음 쿼리 실행하여 테이블 확인:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

다음 테이블이 있어야 합니다:

- `users`
- `user_pokemon`

### 테이블이 없는 경우

1. Vercel Dashboard > Storage > 데이터베이스 > Query 탭
2. `api/db/schema.sql` 파일의 내용 복사
3. Query 탭에 붙여넣고 실행

또는 API 엔드포인트로 초기화:

```
GET https://your-domain.vercel.app/api/db/init
```

## 3. 로컬 개발 환경 문제

### 문제: 로컬에서 `/api` 경로가 작동하지 않음

Vite는 기본적으로 서버리스 함수를 실행하지 않습니다.

### 해결 방법 1: Vercel CLI 사용 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel link

# 로컬에서 서버리스 함수 실행
vercel dev
```

이제 `http://localhost:3000`에서 실행되며 API가 작동합니다.

### 해결 방법 2: Vite 프록시 설정

`vite.config.js`에 프록시 추가:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "https://your-vercel-domain.vercel.app",
        changeOrigin: true,
      },
    },
  },
});
```

## 4. 네트워크 탭 확인

### 개발자 도구 > Network 탭

1. 포켓몬 저장 시도
2. Network 탭에서 `/api/pokemon` 요청 확인
3. 요청 상태 확인:
   - **200 OK**: 성공 (다른 문제일 수 있음)
   - **400 Bad Request**: 요청 데이터 문제
   - **500 Internal Server Error**: 서버 오류 (데이터베이스 문제 가능)
   - **404 Not Found**: API 엔드포인트를 찾을 수 없음

### 응답 내용 확인

Network 탭에서 요청 클릭 > Response 탭에서 에러 메시지 확인

## 5. 일반적인 문제와 해결책

### 문제 1: "테이블이 존재하지 않습니다"

**에러 메시지**:

```
relation "users" does not exist
```

**해결**:

1. Vercel Dashboard > Storage > 데이터베이스 > Query 탭
2. `api/db/schema.sql` 실행

### 문제 2: "환경 변수가 설정되지 않았습니다"

**에러 메시지**:

```
POSTGRES_URL is not defined
```

**해결**:

1. Vercel Dashboard > Settings > Environment Variables
2. Vercel Postgres 생성 시 자동으로 설정됨
3. 없으면 Storage에서 데이터베이스 생성

### 문제 3: "CORS 오류"

**에러 메시지**:

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**해결**:

- API 엔드포인트의 CORS 헤더 확인
- 이미 설정되어 있으므로 다른 문제일 수 있음

### 문제 4: 로컬에서만 실패, 배포 후에는 작동

**원인**: 로컬 개발 환경에서 서버리스 함수가 실행되지 않음

**해결**: Vercel CLI 사용 (`vercel dev`)

## 6. 디버깅 체크리스트

저장 실패 시 다음을 확인하세요:

- [ ] 브라우저 콘솔에 에러 메시지가 있는가?
- [ ] Network 탭에서 API 요청이 전송되는가?
- [ ] API 응답 상태 코드는 무엇인가? (200, 400, 500 등)
- [ ] 로그인되어 있는가? (userId가 있는가?)
- [ ] Vercel Postgres 데이터베이스가 생성되었는가?
- [ ] 데이터베이스 테이블이 생성되었는가?
- [ ] 로컬 개발 환경인가? (Vercel CLI 사용 필요)
- [ ] Vercel에 배포되어 있는가?

## 7. 빠른 테스트 방법

### API 엔드포인트 직접 테스트

배포된 사이트에서 브라우저 콘솔 실행:

```javascript
// 로그인한 사용자 ID 확인
const user = JSON.parse(localStorage.getItem("pokemon_user"));
console.log("User ID:", user?.id);

// API 테스트
fetch(`/api/pokemon?userId=${user.id}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pokemonId: 1,
    email: user.email,
    name: user.name,
    picture: user.picture,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Response:", data))
  .catch((err) => console.error("Error:", err));
```

## 8. 추가 도움

문제가 계속되면 다음 정보를 확인하세요:

1. 브라우저 콘솔의 전체 에러 메시지
2. Network 탭의 요청/응답 내용
3. Vercel Dashboard의 Function Logs
4. 데이터베이스 Query 탭의 에러 메시지
