# Vercel 환경 변수 설정 가이드

Vercel에 프로젝트를 배포할 때 환경 변수를 설정하는 방법입니다.

## 1. Vercel Dashboard 접속

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. 로그인 (GitHub, GitLab, Bitbucket 계정으로 로그인 가능)

## 2. 프로젝트 선택 또는 생성

### 기존 프로젝트가 있는 경우

- Dashboard에서 프로젝트 선택

### 새 프로젝트를 생성하는 경우

1. **Add New...** > **Project** 클릭
2. Git 저장소 연결 (GitHub, GitLab, Bitbucket)
3. 프로젝트 설정 후 **Deploy** 클릭

## 3. 환경 변수 추가

1. 프로젝트 선택 후 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Environment Variables** 클릭
3. 환경 변수 추가:

### Google OAuth 설정

**변수 1: Google OAuth Client ID**

- **Name**: `VITE_GOOGLE_CLIENT_ID`
- **Value**: `YOUR_GOOGLE_CLIENT_ID_HERE` (실제 Client ID 입력)
- **Environment**:
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- **Save** 클릭

**변수 2: Google OAuth Client Secret** (현재는 필요 없음)

> ⚠️ **중요**: 현재 구현은 클라이언트 사이드 OAuth를 사용하므로 Client Secret이 **필요하지 않습니다**.
> Client Secret은 서버 사이드 OAuth 플로우에서만 필요하며, 프론트엔드에 노출하면 안 됩니다.

만약 나중에 서버 사이드에서 토큰 검증이나 추가 처리가 필요하다면:

- **Name**: `GOOGLE_CLIENT_SECRET` (VITE\_ 접두사 없이!)
- **Value**: `YOUR_GOOGLE_CLIENT_SECRET_HERE` (실제 Client Secret 입력)
- **Environment**: 서버 사이드 API에서만 사용
- ⚠️ **절대** `VITE_` 접두사를 붙이지 마세요 (프론트엔드에 노출됨)

### Vercel Postgres 설정 (데이터베이스 사용 시)

Vercel Postgres를 생성하면 자동으로 다음 환경 변수들이 설정됩니다:

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

수동으로 추가할 필요 없습니다.

## 4. 환경 변수 적용

### 자동 재배포

- 환경 변수를 추가/수정하면 자동으로 재배포가 시작됩니다
- 또는 **Deployments** 탭에서 수동으로 재배포 가능

### 재배포 확인

1. **Deployments** 탭 클릭
2. 최신 배포 상태 확인
3. 배포 완료 후 사이트 접속하여 테스트

## 5. 환경 변수 확인

### 배포된 사이트에서 확인

- 브라우저 개발자 도구 콘솔에서 확인
- 또는 배포 로그에서 확인

### 로컬에서 Vercel 환경 변수 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel link

# 환경 변수 가져오기
vercel env pull .env.local
```

## 6. 환경별 설정

### Production (프로덕션)

- 실제 사용자에게 제공되는 환경
- 메인 도메인에서 접근

### Preview (프리뷰)

- Pull Request나 브랜치 푸시 시 자동 생성
- 미리보기 URL로 접근

### Development (개발)

- 로컬 개발 환경
- `vercel dev` 명령어 사용 시

## 7. 보안 주의사항

⚠️ **중요**

- Client Secret은 **절대** 프론트엔드 코드에 노출하지 마세요
- Vercel 환경 변수는 암호화되어 저장됩니다
- `.env` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 추가됨)
- 환경 변수는 팀 멤버와만 공유하세요

## 8. 문제 해결

### 환경 변수가 적용되지 않는 경우

1. 서버 재시작 확인 (자동 재배포 확인)
2. 환경 변수 이름 확인 (대소문자 구분)
3. VITE\_ 접두사 확인 (Vite 프로젝트의 경우)
4. 브라우저 캐시 삭제

### 환경 변수 확인 방법

```javascript
// 개발 환경에서만 확인 (프로덕션에서는 제거)
console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

## 9. 빠른 설정 체크리스트

- [ ] Vercel Dashboard 접속
- [ ] 프로젝트 선택
- [ ] Settings > Environment Variables 이동
- [ ] `VITE_GOOGLE_CLIENT_ID` 추가
- [ ] Production, Preview, Development 모두 선택
- [ ] Save 클릭
- [ ] 자동 재배포 확인
- [ ] 배포 완료 후 테스트

## 참고

- Vercel 환경 변수 문서: https://vercel.com/docs/concepts/projects/environment-variables
- Google OAuth 설정: `GOOGLE_AUTH_SETUP.md` 참고
- Vercel Postgres 설정: `VERCEL_POSTGRES_SETUP.md` 참고
