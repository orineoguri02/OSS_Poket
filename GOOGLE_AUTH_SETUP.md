# Google OAuth 설정 가이드

구글 로그인 기능을 사용하기 위해 Google OAuth 2.0 클라이언트 ID를 설정해야 합니다.

## 1. Google Cloud Console에서 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

## 2. OAuth 동의 화면 설정

1. 왼쪽 메뉴에서 **API 및 서비스** > **OAuth 동의 화면** 선택
2. **외부** 사용자 유형 선택 (또는 내부 - 조직용)
3. 앱 정보 입력:
   - 앱 이름: 포켓몬 도감 (또는 원하는 이름)
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. **저장 후 계속** 클릭
5. 범위는 기본값으로 두고 **저장 후 계속**
6. 테스트 사용자 추가 (개발 단계):
   - **사용자 추가** 클릭
   - 테스트할 이메일 주소 추가
7. **저장 후 계속** 클릭

## 3. OAuth 2.0 클라이언트 ID 생성

1. 왼쪽 메뉴에서 **API 및 서비스** > **사용자 인증 정보** 선택
2. 상단의 **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름 입력 (예: "포켓몬 도감 웹 클라이언트")
5. 승인된 자바스크립트 원본 추가:
   - 개발 환경: `http://localhost:5173` (Vite 기본 포트)
   - 프로덕션 환경: `https://your-domain.vercel.app`
6. 승인된 리디렉션 URI 추가:
   - 개발 환경: `http://localhost:5173` (Vite 기본 포트)
   - 프로덕션 환경: `https://your-domain.vercel.app`
7. **만들기** 클릭
8. 생성된 **클라이언트 ID**를 복사

## 4. 환경 변수 설정

### 로컬 개발 환경

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
VITE_GOOGLE_CLIENT_ID=여기에_복사한_클라이언트_ID_붙여넣기
```

### Vercel 배포 환경

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 이동
4. 다음 변수 추가:
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: Google Cloud Console에서 복사한 클라이언트 ID
   - Environment: Production, Preview, Development 모두 선택
5. **Save** 클릭
6. 재배포 필요 (자동으로 재배포되거나 수동으로 재배포)

## 5. 테스트

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:5173` 접속
3. 포켓볼 클릭 후 로그인 페이지에서 "Google로 로그인" 버튼 클릭
4. 구글 계정으로 로그인
5. 로그인 성공 시 홈 화면으로 이동하는지 확인

## 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 추가됨)
- 프로덕션 배포 시 Vercel 환경 변수에 클라이언트 ID를 설정해야 합니다
- OAuth 동의 화면이 "테스트 중" 상태면 테스트 사용자만 로그인할 수 있습니다
- 프로덕션 배포 전 OAuth 동의 화면을 "프로덕션"으로 전환해야 합니다
