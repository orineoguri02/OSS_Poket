# 포켓몬 데이터 자동 수집 스크립트

PokeAPI를 사용하여 포켓몬 정보를 자동으로 수집하는 스크립트입니다.

## 사용 방법

### 1. 스크립트 실행

```bash
# 전체 포켓몬 (1-151번)
node scripts/fetchPokemonData.js

# 특정 범위의 포켓몬
node scripts/fetchPokemonData.js 1 50

# 단일 포켓몬
node scripts/fetchPokemonData.js 1 1
```

### 2. 수집되는 정보

- 한국어 이름 (nameKo)
- 영어 이름 (nameEn)
- 타입 (types)
- 키 (height)
- 몸무게 (weight)
- 특성 (ability)
- 분류 (category)
- 설명 (description)

### 3. 주의사항

- API rate limit을 방지하기 위해 요청 간 200ms 딜레이가 있습니다
- 한국어 이름과 설명은 PokeAPI의 species API에서 가져옵니다
- 기존 데이터가 있으면 병합됩니다 (기존 데이터 우선)

### 4. 수동 수정이 필요한 항목

다음 항목들은 자동으로 수집되지 않으므로 수동으로 수정해야 할 수 있습니다:

- `badges`: 배지 정보 (현재는 기본값으로 설정)
- `gender`: 성별 정보 (PokeAPI에서 직접 제공하지 않음)
- `cta`: CTA 텍스트 (자동 생성되지만 필요시 수정)

## PokeAPI 참고

- 공식 문서: https://pokeapi.co/docs/v2
- 한국어 지원: PokeAPI는 한국어 이름과 설명을 제공합니다

