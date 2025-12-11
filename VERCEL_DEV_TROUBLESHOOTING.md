# Vercel Dev 문제 해결 가이드

## 문제 상황

`vercel dev`를 실행했을 때:

1. 포트 5173으로 리다이렉트됨
2. 포트 3000으로 접속하면 흰 화면이 나타남
3. `index.html` 파싱 오류 발생

## 원인

### 1. `devCommand` 설정 문제

```json
{
  "devCommand": "npm run dev"
}
```

- 이 설정이 있으면 `vercel dev`가 Vite를 직접 실행하여 포트 5173에서 실행됩니다.
- `vercel dev`는 자체적으로 Vite를 감지하고 포트 3000에서 프록시해야 합니다.

### 2. `rewrites`의 `/(.*)` 리다이렉트 문제

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- 이 리다이렉트는 프로덕션 빌드에서 SPA 라우팅을 위해 필요합니다.
- 하지만 `vercel dev`에서는 Vite 개발 서버가 이미 SPA 라우팅을 처리하므로 충돌이 발생합니다.
- `vercel dev`가 `index.html`을 JavaScript로 파싱하려고 시도하여 오류가 발생합니다.

## 해결 방법

### 올바른 `vercel.json` 설정

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
    // 주의: 개발 환경에서는 /(.*) 리다이렉트를 제거해야 함
    // 프로덕션에서는 Vercel이 자동으로 처리합니다.
  ]
}
```

### 핵심 포인트

1. **`devCommand` 제거**: `vercel dev`가 자동으로 Vite를 감지하도록 합니다.
2. **`/(.*)` 리다이렉트 제거**: 개발 환경에서만 제거합니다. 프로덕션에서는 Vercel이 자동으로 처리합니다.

## 왜 머지할 때마다 문제가 생기는가?

다른 브랜치에서 `vercel.json`이 변경되면서:

- `devCommand`가 추가되거나
- `rewrites`에 `/(.*)` 리다이렉트가 추가될 수 있습니다.

## 예방 방법

1. `vercel.json`을 항상 확인하세요.
2. `devCommand`는 사용하지 마세요.
3. 개발 환경에서는 `/(.*)` 리다이렉트를 제거하세요.
4. 프로덕션 빌드는 Vercel이 자동으로 처리하므로 걱정하지 마세요.

## 참고

- `vercel dev`: 개발 환경, 포트 3000에서 실행, Vite 개발 서버 프록시
- 프로덕션 빌드: Vercel이 자동으로 `/(.*)` 리다이렉트를 처리합니다.
