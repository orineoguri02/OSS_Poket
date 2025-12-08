# Prisma 설정 가이드

프로젝트가 Prisma를 사용하도록 설정되었습니다.

## 1. 데이터베이스 스키마 적용

### 로컬 개발 환경

```bash
# 환경 변수가 설정된 상태에서 실행
npx prisma db push
```

이 명령어는:

- Prisma 스키마를 데이터베이스에 적용합니다
- 테이블이 없으면 생성하고, 있으면 업데이트합니다
- 마이그레이션 파일을 생성하지 않습니다 (개발용)

### 프로덕션 환경 (Vercel)

Vercel에 배포하면 자동으로 `postinstall` 스크립트가 실행되어 Prisma Client가 생성됩니다.

스키마 변경 시:

1. 로컬에서 `npx prisma db push` 실행
2. 변경사항 커밋 및 푸시
3. Vercel이 자동으로 재배포

## 2. 환경 변수 확인

`.env.local` 파일에 다음이 설정되어 있어야 합니다:

```env
POSTGRES_URL="postgres://..."
```

Vercel 배포 시:

- Vercel Dashboard > Settings > Environment Variables
- `POSTGRES_URL`이 자동으로 설정됩니다 (Vercel Postgres 생성 시)

## 3. Prisma Studio (선택사항)

데이터베이스를 시각적으로 확인하고 편집할 수 있습니다:

```bash
npx prisma studio
```

브라우저에서 `http://localhost:5555`가 열립니다.

## 4. 주요 명령어

```bash
# Prisma Client 생성 (자동으로 postinstall에서 실행됨)
npx prisma generate

# 스키마를 데이터베이스에 적용
npx prisma db push

# 데이터베이스 스키마 확인
npx prisma studio

# 마이그레이션 생성 (선택사항)
npx prisma migrate dev --name migration_name
```

## 5. 스키마 구조

### User 모델

- `user_id` (String, Primary Key): Google OAuth 사용자 ID
- `email` (String): 사용자 이메일
- `name` (String): 사용자 이름
- `picture` (String?): 프로필 사진 URL
- `created_at` (DateTime): 생성 시간
- `updated_at` (DateTime): 수정 시간

### UserPokemon 모델

- `id` (Int, Primary Key, Auto Increment)
- `user_id` (String, Foreign Key): 사용자 ID
- `pokemon_id` (Int): 포켓몬 ID
- `added_at` (DateTime): 추가 시간
- Unique 제약: (user_id, pokemon_id)

## 6. API 변경사항

모든 API 엔드포인트가 Prisma를 사용하도록 변경되었습니다:

- `GET /api/pokemon` - Prisma로 포켓몬 목록 조회
- `POST /api/pokemon` - Prisma로 포켓몬 추가
- `DELETE /api/pokemon/[pokemonId]` - Prisma로 포켓몬 삭제

## 7. 문제 해결

### "Prisma Client has not been generated yet"

```bash
npx prisma generate
```

### "Table does not exist"

```bash
npx prisma db push
```

### 환경 변수 오류

`.env.local` 파일에 `POSTGRES_URL`이 설정되어 있는지 확인하세요.

## 8. 다음 단계

1. 데이터베이스 스키마 적용:

   ```bash
   npx prisma db push
   ```

2. 로컬에서 테스트:

   ```bash
   vercel dev
   ```

3. 포켓몬 저장 기능 테스트

## 참고

- Prisma 문서: https://www.prisma.io/docs
- Vercel + Prisma: https://www.prisma.io/docs/guides/deployment/deploying-to-vercel
