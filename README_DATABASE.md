# 데이터베이스 기능 사용 가이드

## 개요

이 프로젝트는 Vercel Postgres를 사용하여 사용자별 포켓몬 저장 기능을 제공합니다.

## 주요 기능

- ✅ 사용자별 포켓몬 저장 (PostgreSQL)
- ✅ 포켓몬 목록 조회
- ✅ 포켓몬 추가/삭제
- ✅ 중복 저장 방지

## API 엔드포인트

### 1. 포켓몬 목록 조회

```javascript
GET /api/pokemon?userId={userId}

// 응답
{
  "pokemon": [
    { "pokemon_id": 1, "added_at": "2024-01-01T00:00:00Z" },
    { "pokemon_id": 25, "added_at": "2024-01-02T00:00:00Z" }
  ]
}
```

### 2. 포켓몬 추가

```javascript
POST /api/pokemon?userId={userId}
Content-Type: application/json

{
  "pokemonId": 1,
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://..."
}

// 응답
{
  "success": true,
  "message": "포켓몬이 추가되었습니다."
}
```

### 3. 포켓몬 삭제

```javascript
DELETE /api/pokemon/{pokemonId}?userId={userId}

// 응답
{
  "success": true,
  "message": "포켓몬이 삭제되었습니다."
}
```

### 4. 데이터베이스 초기화

```javascript
GET /api/db/init
또는
POST /api/db/init

// 응답
{
  "success": true,
  "message": "데이터베이스 초기화가 완료되었습니다."
}
```

## 프론트엔드 사용법

### PokemonContext 사용

```javascript
import { usePokemon } from "./contexts/PokemonContext";

function MyComponent() {
  const {
    myPokemon, // 저장된 포켓몬 ID 배열
    loading, // 로딩 상태
    error, // 에러 메시지
    addPokemon, // 포켓몬 추가 함수
    removePokemon, // 포켓몬 삭제 함수
    isPokemonSaved, // 포켓몬 저장 여부 확인
    refreshPokemon, // 목록 새로고침
  } = usePokemon();

  // 포켓몬 추가
  const handleAdd = async () => {
    try {
      await addPokemon(1); // 포켓몬 ID
      alert("포켓몬이 추가되었습니다!");
    } catch (error) {
      alert(error.message);
    }
  };

  // 포켓몬 삭제
  const handleRemove = async () => {
    try {
      await removePokemon(1); // 포켓몬 ID
      alert("포켓몬이 삭제되었습니다!");
    } catch (error) {
      alert(error.message);
    }
  };

  // 저장 여부 확인
  const isSaved = isPokemonSaved(1);

  return (
    <div>
      <p>저장된 포켓몬: {myPokemon.length}마리</p>
      {isSaved ? (
        <button onClick={handleRemove}>삭제</button>
      ) : (
        <button onClick={handleAdd}>추가</button>
      )}
    </div>
  );
}
```

## 환경 변수

로컬 개발 시 `.env.local` 파일에 다음 변수 추가:

```env
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
```

Vercel 배포 시 자동으로 설정됩니다.

## 데이터베이스 스키마

### users 테이블

- `user_id` (VARCHAR, PRIMARY KEY)
- `email` (VARCHAR)
- `name` (VARCHAR)
- `picture` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### user_pokemon 테이블

- `id` (SERIAL, PRIMARY KEY)
- `user_id` (VARCHAR, FOREIGN KEY)
- `pokemon_id` (INTEGER)
- `added_at` (TIMESTAMP)
- UNIQUE(user_id, pokemon_id)

## 다음 단계

드래그 앤 드롭 기능과 연동하여 포켓몬을 저장할 수 있습니다.
