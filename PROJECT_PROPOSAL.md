# 포켓몬 3D 도감 프로젝트 제안서

## 1. 서비스 개요

### 서비스 제목
**포켓몬 3D 도감 (Pokemon 3D Pokedex)**

### 주요 내용 및 메뉴 구성

#### 서비스 대상
- 포켓몬 팬 및 수집가
- 3D 모델을 통해 포켓몬을 감상하고 싶은 사용자
- MBTI 테스트를 통해 자신과 어울리는 포켓몬을 찾고 싶은 사용자
- 포켓몬 컬렉션을 관리하고 싶은 사용자

#### 메뉴 구성
1. **온보딩 페이지** (`/`)
   - 서비스 소개 및 첫 방문 안내
   - Google OAuth 로그인 유도

2. **홈/도감 페이지** (`/home`)
   - 포켓몬 목록 그리드 뷰 (1세대 151마리)
   - 검색 기능 (이름, 번호로 검색)
   - 저장된 포켓몬만 보기 필터
   - 포켓몬 카드 드래그 앤 드롭으로 장바구니 추가

3. **포켓몬 상세 페이지** (`/pokemon/:id`)
   - 3D 모델 뷰어 (Three.js/React Three Fiber)
   - 포켓몬 상세 정보 (이름, 타입, 키, 몸무게, 특성, 성별, 희귀도 등)
   - 이전/다음 포켓몬 네비게이션
   - 드래그 앤 드롭으로 장바구니 추가

4. **장바구니 페이지** (`/cart`)
   - 저장한 포켓몬 목록
   - 포켓몬 삭제 기능
   - 포켓몬 상세 페이지로 이동

5. **내 포켓몬 페이지** (`/my-pokemon`)
   - 사용자가 저장한 포켓몬 컬렉션 관리
   - 드롭 존을 통한 포켓몬 추가

6. **포켓몬 MBTI 테스트** (`/mbti`)
   - 12문항 MBTI 성격 테스트
   - MBTI 결과에 따른 어울리는 포켓몬 추천
   - 성향 분석 차트

---

## 2. CRUD 데이터 셋

### 데이터베이스 스키마 (Prisma)

#### User 테이블 (7개 필드)
```prisma
model User {
  user_id   String   @id @db.VarChar(255)      // Google OAuth ID
  email     String   @db.VarChar(255)          // 이메일
  name      String   @db.VarChar(255)          // 사용자 이름
  picture   String?  @db.Text                  // 프로필 사진 URL
  created_at DateTime @default(now())          // 생성일시
  updated_at DateTime @default(now()) @updatedAt // 수정일시
  
  pokemon UserPokemon[]                        // 관계: 사용자의 포켓몬 목록
}
```

#### UserPokemon 테이블 (4개 필드)
```prisma
model UserPokemon {
  id         Int      @id @default(autoincrement()) // 기본키
  user_id    String   @db.VarChar(255)              // 사용자 ID (외래키)
  pokemon_id Int                                     // 포켓몬 ID
  added_at   DateTime @default(now())               // 추가일시
  
  user User @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  
  @@unique([user_id, pokemon_id])  // 중복 방지
  @@index([user_id])
  @@index([pokemon_id])
}
```

#### PokemonModel 테이블 (10개 필드)
```prisma
model PokemonModel {
  id            Int      @id @default(autoincrement()) // 기본키
  pokemon_id    Int      @unique                       // 포켓몬 ID
  model_path    String   @db.Text                      // 모델 파일 경로
  cdn_url       String?  @db.Text                      // CDN URL (선택)
  model_type    String   @default("dae")               // 모델 타입 (dae, fbx, obj 등)
  file_size     Int?                                   // 파일 크기 (bytes)
  storage_type  String   @default("cdn")               // 저장소 타입 (local/cdn)
  is_primary    Boolean  @default(true)                 // 기본 모델 여부
  file_exists   Boolean  @default(true)                // 파일 존재 여부
  created_at    DateTime @default(now())               // 생성일시
  updated_at    DateTime @updatedAt                    // 수정일시
  
  @@index([pokemon_id])
}
```

### CRUD 기능

#### Create (생성)
- **사용자 생성**: Google OAuth 로그인 시 자동 생성/업데이트
- **포켓몬 추가**: `POST /api/pokemon?userId={userId}` - 사용자 포켓몬 컬렉션에 추가
- **모델 정보 등록**: 포켓몬 모델 파일 스캔 및 DB 등록

#### Read (조회)
- **사용자 포켓몬 목록**: `GET /api/pokemon?userId={userId}` - 저장한 포켓몬 목록 조회
- **포켓몬 모델 정보**: `GET /api/pokemon?id={pokemonId}` - 모델 경로 및 메타데이터 조회
- **포켓몬 상세 정보**: PokeAPI를 통한 포켓몬 데이터 조회

#### Update (수정)
- **사용자 정보 업데이트**: Google OAuth 로그인 시 자동 업데이트
- **모델 정보 업데이트**: 모델 파일 변경 시 업데이트

#### Delete (삭제)
- **포켓몬 삭제**: `DELETE /api/pokemon?userId={userId}&pokemonId={pokemonId}` - 컬렉션에서 제거

---

## 3. 서비스 주요 기능 및 특징

### 주요 기능

1. **3D 포켓몬 모델 뷰어**
   - Three.js 및 React Three Fiber를 활용한 실시간 3D 렌더링
   - OrbitControls를 통한 인터랙티브 카메라 조작
   - 자동 회전 애니메이션
   - 타입별 배경 그라데이션
   - 모델 등장 애니메이션 (150% → 100% 스케일)

2. **포켓몬 도감**
   - 1세대 포켓몬 151마리 전체 수록
   - 실시간 검색 (이름, 번호)
   - 저장된 포켓몬만 보기 필터
   - 반응형 그리드 레이아웃
   - 타입별 카드 배경색 자동 적용

3. **드래그 앤 드롭 컬렉션 관리**
   - 포켓몬 카드를 드래그하여 포켓몬볼에 드롭
   - 시각적 피드백 (드래그 중 포켓몬볼 표시)
   - 중복 저장 방지

4. **포켓몬 MBTI 테스트**
   - 12문항 성격 테스트
   - 16가지 MBTI 유형별 포켓몬 추천
   - 성향 분석 차트 (E/I, S/N, T/F, J/P)
   - 결과 공유 기능

5. **사용자 인증**
   - Google OAuth 2.0 로그인
   - 세션 관리 및 보호된 라우트

6. **성능 최적화**
   - PokeAPI 데이터 localStorage 캐싱
   - 메모리 캐시 활용
   - 이미지 lazy loading
   - 코드 스플리팅 (Three.js 번들 분리)

### 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **실시간 상호작용**: 드래그 앤 드롭, 3D 모델 조작
- **아름다운 UI/UX**: 글래스모피즘 디자인, 부드러운 애니메이션
- **오프라인 지원**: 캐시된 데이터로 오프라인에서도 기본 기능 사용 가능

---

## 4. 참고하려는 타 서비스

### 참고 서비스

1. **Pokemon GO (Niantic)**
   - 포켓몬 컬렉션 관리 UI
   - 포켓몬 카드 디자인
   - 상세 정보 표시 방식

2. **Pokemon.com 공식 도감**
   - 포켓몬 정보 구조화
   - 타입별 색상 시스템
   - 검색 및 필터링 UX

3. **16Personalities (MBTI 테스트)**
   - 질문 진행 방식
   - 결과 표시 및 분석 차트
   - 성향 분석 시각화

4. **Three.js 공식 예제**
   - 3D 모델 로딩 및 렌더링
   - 카메라 컨트롤
   - 애니메이션 처리

---

## 5. 사이트 URL

### 참고 사이트

- **Pokemon GO**: https://www.pokemongo.com/
- **Pokemon.com 도감**: https://www.pokemon.com/us/pokedex/
- **16Personalities**: https://www.16personalities.com/
- **Three.js 예제**: https://threejs.org/examples/
- **PokeAPI**: https://pokeapi.co/

---

## 6. 참고 또는 클론하려는 페이지 및 기능

### 레이아웃 참고

1. **홈/도감 페이지**
   - **참고**: Pokemon GO 컬렉션 화면
   - **레이아웃**: 상단 검색바 + 필터, 그리드 카드 레이아웃
   - **스타일**: 카드 호버 효과, 타입별 배경색, 저장된 포켓몬 강조 표시

2. **포켓몬 상세 페이지**
   - **참고**: Pokemon.com 도감 상세 페이지
   - **레이아웃**: 상단 3D 뷰어, 하단 정보 카드
   - **스타일**: 글래스모피즘 카드, 그라데이션 배경, 정보 그리드

3. **MBTI 테스트 페이지**
   - **참고**: 16Personalities 테스트 페이지
   - **레이아웃**: 진행 바, 질문 카드, 답변 버튼
   - **스타일**: 깔끔한 카드 디자인, 진행률 표시, 결과 차트

4. **장바구니 페이지**
   - **참고**: 쇼핑몰 장바구니 페이지
   - **레이아웃**: 헤더 + 그리드 목록
   - **스타일**: 삭제 버튼, 빈 상태 메시지

---

## 7. 사용하게 될 Open API

### API 제목 및 데이터 내용

#### 1. PokeAPI
- **제공 사이트**: https://pokeapi.co/
- **API 엔드포인트**:
  - `GET https://pokeapi.co/api/v2/pokemon/{id}` - 포켓몬 기본 정보
  - `GET https://pokeapi.co/api/v2/pokemon-species/{id}` - 포켓몬 종족 정보

- **데이터 내용**:
  - 포켓몬 ID, 이름 (다국어), 타입, 능력치, 키, 몸무게
  - 포켓몬 종족 정보: 설명, 분류, 성별 비율, 포획률, 전설 여부
  - 스프라이트 이미지 URL

- **사용 계획**:
  - 포켓몬 목록 로드 시 기본 정보 가져오기
  - 상세 페이지에서 종족 정보 포함 전체 데이터 표시
  - localStorage 캐싱으로 API 호출 최소화
  - 한국어 이름 및 설명 추출

#### 2. Google OAuth 2.0 API
- **제공 사이트**: https://developers.google.com/identity/protocols/oauth2
- **API 엔드포인트**: Google OAuth 인증 서버
- **데이터 내용**: 사용자 ID, 이메일, 이름, 프로필 사진
- **사용 계획**: 사용자 인증 및 프로필 정보 가져오기

---

## 8. 페이지 구상 및 역할 분담

### Router에 포함될 LINK 별 화면 레이아웃

#### `/` - 온보딩 페이지
```


#### `/home` - 홈/도감 페이지
```

```

#### `/pokemon/:id` - 포켓몬 상세 페이지
```
```

#### `/cart` - 장바구니 페이지
```

```

#### `/mbti` - MBTI 테스트 페이지
```

```

#### `/mbti` - MBTI 결과 페이지
```


## 9. 조원별 역할 (예시 4인 팀)

### 역할 분담

#### 조원 A: 프론트엔드 리드 & UI/UX
- **담당**:
  - React Router 설정 및 라우팅 구조 설계
  - 전역 상태 관리 (Context API)
  - 컴포넌트 구조 설계 및 공통 컴포넌트 개발
  - 반응형 레이아웃 구현
  - UI/UX 디자인 및 스타일링

- **주요 작업**:
  - Home, Cart, Onboarding 컴포넌트 개발
  - Header, 공통 버튼 등 재사용 컴포넌트
  - 반응형 CSS 및 미디어 쿼리
  - 드래그 앤 드롭 기능 구현

#### 조원 B: 3D 모델 & Three.js 담당
- **담당**:
  - Three.js 및 React Three Fiber 통합
  - 3D 모델 로더 개발
  - 카메라 컨트롤 및 애니메이션
  - 성능 최적화

- **주요 작업**:
  - ModelLoader 컴포넌트 개발
  - Detail 페이지 3D 뷰어 구현
  - OrbitControls 설정 및 커스터마이징
  - 모델 파일 경로 관리 및 API 연동

#### 조원 C: 백엔드 & 데이터베이스
- **담당**:
  - Prisma 스키마 설계 및 마이그레이션
  - API 엔드포인트 개발 (Vercel Serverless Functions)
  - 데이터베이스 CRUD 로직 구현
  - PokeAPI 통합 및 캐싱 전략

- **주요 작업**:
  - `/api/pokemon` 엔드포인트 개발
  - 사용자 인증 및 세션 관리
  - 모델 파일 스캔 및 DB 등록 스크립트
  - 에러 핸들링 및 로깅

#### 조원 D: MBTI 테스트 & 추가 기능
- **담당**:
  - MBTI 테스트 로직 개발
  - 결과 계산 및 포켓몬 매칭 알고리즘
  - 데이터 시각화 (차트)
  - 테스트 및 QA

- **주요 작업**:
  - PokeMbti 컴포넌트 개발
  - MBTI 데이터 구조 설계
  - 성향 분석 차트 구현
  - 통합 테스트 및 버그 수정

---

## 10. 제작 일정 계획

### 1주차: 기반 구축 및 핵심 기능

#### Day 1-2: 프로젝트 셋업
- [ ] 프로젝트 초기 설정 (Vite, React, Three.js)
- [ ] Prisma 스키마 작성 및 DB 마이그레이션
- [ ] 기본 라우팅 구조 설정
- [ ] Google OAuth 인증 구현
- **담당**: 조원 A, C

#### Day 3-4: 포켓몬 도감 기본 기능
- [ ] PokeAPI 통합 및 데이터 가져오기
- [ ] Home 페이지 그리드 레이아웃 구현
- [ ] 검색 및 필터 기능 구현
- [ ] 포켓몬 카드 컴포넌트 개발
- **담당**: 조원 A, C

#### Day 5: 3D 모델 뷰어 기본
- [ ] Three.js 및 React Three Fiber 설정
- [ ] ModelLoader 컴포넌트 기본 구현
- [ ] Detail 페이지 레이아웃 구성
- **담당**: 조원 B

### 2주차: 고급 기능 및 완성

#### Day 6-7: 3D 뷰어 완성 및 상세 페이지
- [ ] OrbitControls 및 카메라 설정
- [ ] 모델 애니메이션 구현
- [ ] 포켓몬 상세 정보 표시
- [ ] 이전/다음 네비게이션
- **담당**: 조원 B, A

#### Day 8: 장바구니 및 컬렉션 관리
- [ ] 드래그 앤 드롭 기능 구현
- [ ] Cart 페이지 개발
- [ ] API 연동 (포켓몬 추가/삭제)
- [ ] MyPokemon 페이지 개발
- **담당**: 조원 A, C

#### Day 9: MBTI 테스트 기능
- [ ] MBTI 테스트 UI 개발
- [ ] 질문 진행 로직 구현
- [ ] 결과 계산 및 포켓몬 매칭
- [ ] 성향 분석 차트 구현
- **담당**: 조원 D

#### Day 10: 통합 테스트 및 배포
- [ ] 전체 기능 통합 테스트
- [ ] 버그 수정 및 성능 최적화
- [ ] 반응형 디자인 최종 점검
- [ ] Vercel 배포 및 환경 변수 설정
- **담당**: 전체 조원

---

## 기술 스택

- **Frontend**: React 19, Vite, React Router DOM
- **3D**: Three.js, React Three Fiber, React Three Drei
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL (Vercel Postgres), Prisma ORM
- **Authentication**: Google OAuth 2.0
- **API**: PokeAPI
- **Deployment**: Vercel

---

## 기대 효과

1. **사용자 경험**: 인터랙티브한 3D 모델 뷰어로 포켓몬을 생생하게 감상
2. **편의성**: 드래그 앤 드롭으로 간편한 컬렉션 관리
3. **재미**: MBTI 테스트를 통한 개인화된 포켓몬 추천
4. **성능**: 캐싱 전략으로 빠른 데이터 로딩
5. **확장성**: 모듈화된 구조로 향후 기능 추가 용이

