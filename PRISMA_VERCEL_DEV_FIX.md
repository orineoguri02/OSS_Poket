# Vercel Dev 환경 변수 문제 해결

`vercel dev` 실행 시 `POSTGRES_URL` 환경 변수를 찾지 못하는 문제 해결 방법입니다.

## 문제

```
error: Environment variable not found: POSTGRES_URL.
```

## 해결 방법

### 방법 1: .env.local 파일 확인 및 수정

`.env.local` 파일에 `POSTGRES_URL`이 있는지 확인:

```bash
cat .env.local
```

다음과 같이 설정되어 있어야 합니다:

```env
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
PRISMA_DATABASE_URL="prisma+postgres://..."
```

### 방법 2: Vercel 환경 변수 가져오기

Vercel Dashboard에 환경 변수가 설정되어 있다면:

```bash
# Vercel 프로젝트 연결 확인
vercel link

# 환경 변수 가져오기 (덮어쓰기)
vercel env pull .env.local --yes
```

### 방법 3: 수동으로 .env.local 파일 생성/수정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용 추가:

```env
POSTGRES_URL="postgres://efbbca436fdf0b19159ece2304c273d4e959d4f40612932933a0885f03d23ff2:sk_OLxabLH59As4lLGnRQ4yV@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_PRISMA_URL="postgres://efbbca436fdf0b19159ece2304c273d4e959d4f40612932933a0885f03d23ff2:sk_OLxabLH59As4lLGnRQ4yV@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19PTHhhYkxINTlBczRsTEduUlE0eVYiLCJhcGlfa2V5IjoiMDFLQlhQV01YSldLNVhXMkdDQktSOEVKOFgiLCJ0ZW5hbnRfaWQiOiJlZmJiY2E0MzZmZGYwYjE5MTU5ZWNlMjMwNGMyNzNkNGU5NTlkNGY0MDYxMjkzMjkzM2EwODg1ZjAzZDIzZmYyIiwiaW50ZXJuYWxfc2VjcmV0IjoiYzRhMTdlODAtMDE3ZS00N2NiLWI2NDAtYTFhYTVhZDBiZWE2In0.4x6RRolW2KDC5cocnYuqjrU_c9mugPyYhvczmDWP6mc"
```

### 방법 4: vercel dev 재시작

환경 변수를 수정한 후:

1. `vercel dev` 프로세스 종료 (Ctrl+C)
2. 다시 실행:
   ```bash
   vercel dev
   ```

## 확인 방법

`vercel dev` 실행 후 브라우저 콘솔에서:

1. 포켓몬 저장 시도
2. 에러 메시지 확인
3. `POSTGRES_URL` 관련 에러가 사라졌는지 확인

## 추가 디버깅

Prisma가 환경 변수를 찾는지 확인:

```javascript
// lib/prisma.js에 추가된 로그 확인
// 콘솔에 경고 메시지가 나타나면 환경 변수가 없는 것입니다
```

## 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 추가됨)
- 환경 변수는 민감한 정보이므로 공유하지 마세요
- Vercel Dashboard에 환경 변수가 설정되어 있어야 배포 시 작동합니다
