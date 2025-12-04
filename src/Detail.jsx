import React, { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import LaprasModel from './Lapras3D';

const pokemonDetails = {
  1: {
    nameKo: '이상해씨',
    nameEn: 'Bulbasaur',
    badges: ['스칼렛', '바이올렛'],
    description: '햇빛을 많이 받을수록 등껍질의 씨앗이 무럭무럭 자란다.',
    types: ['풀', '독'],
    height: '0.7 m',
    weight: '6.9 kg',
    category: '씨앗포켓몬',
    ability: '심록',
    gender: '수 ♂ / 암 ♀',
    cta: '이상해씨 굿즈 보러가기',
  },
  2: {
    nameKo: '이상해풀',
    nameEn: 'Ivysaur',
    badges: ['스칼렛', '바이올렛'],
    description: '햇빛을 받을수록 몸에 힘이 솟아 등 꽃봉오리가 자란다.',
    types: ['풀', '독'],
    height: '1.0 m',
    weight: '13.0 kg',
    category: '씨앗포켓몬',
    ability: '심록',
    gender: '수 ♂ / 암 ♀',
    cta: '이상해풀 상품 보러가기',
  },
  3: {
    nameKo: '이상해꽃',
    nameEn: 'Venusaur',
    badges: ['스칼렛', '바이올렛'],
    description: '꽃잎에서 뿜어 나오는 향기가 주변을 평온하게 만든다.',
    types: ['풀', '독'],
    height: '2.0 m',
    weight: '100.0 kg',
    category: '씨앗포켓몬',
    ability: '심록',
    gender: '수 ♂ / 암 ♀',
    cta: '이상해꽃 정보 보기',
  },
  4: {
    nameKo: '파이리',
    nameEn: 'Charmander',
    badges: ['스칼렛', '바이올렛'],
    description: '꼬리의 불꽃은 정열의 상징. 기분에 따라 불꽃이 흔들린다.',
    types: ['불꽃'],
    height: '0.6 m',
    weight: '8.5 kg',
    category: '도롱뇽포켓몬',
    ability: '맹화',
    gender: '수 ♂ / 암 ♀',
    cta: '파이리 굿즈 보기',
  },
  5: {
    nameKo: '리자드',
    nameEn: 'Charmeleon',
    badges: ['스칼렛', '바이올렛'],
    description: '날카로운 발톱과 꼬리불로 적을 몰아붙인다.',
    types: ['불꽃'],
    height: '1.1 m',
    weight: '19.0 kg',
    category: '화염포켓몬',
    ability: '맹화',
    gender: '수 ♂ / 암 ♀',
    cta: '리자드 자세히 보기',
  },
  6: {
    nameKo: '리자몽',
    nameEn: 'Charizard',
    badges: ['스칼렛', '바이올렛'],
    description: '높은 하늘을 날며 강력한 불꽃을 뿜어낸다.',
    types: ['불꽃', '비행'],
    height: '1.7 m',
    weight: '90.5 kg',
    category: '화염포켓몬',
    ability: '맹화',
    gender: '수 ♂ / 암 ♀',
    cta: '리자몽 굿즈 보기',
  },
  7: {
    nameKo: '꼬부기',
    nameEn: 'Squirtle',
    badges: ['스칼렛', '바이올렛'],
    description: '등껍질로 몸을 보호하며 입에서 물을 뿜는다.',
    types: ['물'],
    height: '0.5 m',
    weight: '9.0 kg',
    category: '꼬마거북포켓몬',
    ability: '급류',
    gender: '수 ♂ / 암 ♀',
    cta: '꼬부기 상품 보기',
  },
  8: {
    nameKo: '어니부기',
    nameEn: 'Wartortle',
    badges: ['스칼렛', '바이올렛'],
    description: '귀와 꼬리의 털이 수영할 때 방향을 잡아준다.',
    types: ['물'],
    height: '1.0 m',
    weight: '22.5 kg',
    category: '거북포켓몬',
    ability: '급류',
    gender: '수 ♂ / 암 ♀',
    cta: '어니부기 굿즈 보기',
  },
  9: {
    nameKo: '거북왕',
    nameEn: 'Blastoise',
    badges: ['스칼렛', '바이올렛'],
    description: '등껍질의 대포에서 강력한 물줄기를 발사한다.',
    types: ['물'],
    height: '1.6 m',
    weight: '85.5 kg',
    category: '껍질포켓몬',
    ability: '급류',
    gender: '수 ♂ / 암 ♀',
    cta: '거북왕 정보 보기',
  },
  10: {
    nameKo: '캐터피',
    nameEn: 'Caterpie',
    badges: ['스칼렛', '바이올렛'],
    description: '먹이를 많이 먹고 자라 커다란 나비가 될 준비를 한다.',
    types: ['벌레'],
    height: '0.3 m',
    weight: '2.9 kg',
    category: '벌레포켓몬',
    ability: '인분',
    gender: '수 ♂ / 암 ♀',
    cta: '캐터피 알아보기',
  },
  11: {
    nameKo: '단데기',
    nameEn: 'Metapod',
    badges: ['스칼렛', '바이올렛'],
    description: '단단한 껍질 속에서 다음 변신을 준비한다.',
    types: ['벌레'],
    height: '0.7 m',
    weight: '9.9 kg',
    category: '번데기포켓몬',
    ability: '허물',
    gender: '수 ♂ / 암 ♀',
    cta: '단데기 알아보기',
  },
  12: {
    nameKo: '버터플',
    nameEn: 'Butterfree',
    badges: ['스칼렛', '바이올렛'],
    description: '날개에서 뿜어져 나오는 가루가 상대를 잠재운다.',
    types: ['벌레', '비행'],
    height: '1.1 m',
    weight: '32.0 kg',
    category: '나비포켓몬',
    ability: '복안',
    gender: '수 ♂ / 암 ♀',
    cta: '버터플 굿즈 보기',
  },
  13: {
    nameKo: '뿔충이',
    nameEn: 'Weedle',
    badges: ['스칼렛', '바이올렛'],
    description: '머리의 뿔로 적을 찌르며 독을 퍼뜨린다.',
    types: ['벌레', '독'],
    height: '0.3 m',
    weight: '3.2 kg',
    category: '모충포켓몬',
    ability: '벌레의저항',
    gender: '수 ♂ / 암 ♀',
    cta: '뿔충이 알아보기',
  },
  14: {
    nameKo: '딱충이',
    nameEn: 'Kakuna',
    badges: ['스칼렛', '바이올렛'],
    description: '딱딱한 몸으로 적의 공격을 버티며 진화를 준비한다.',
    types: ['벌레', '독'],
    height: '0.6 m',
    weight: '10.0 kg',
    category: '번데기포켓몬',
    ability: '허물',
    gender: '수 ♂ / 암 ♀',
    cta: '딱충이 굿즈 보기',
  },
};

export default function Detail() {
  const { id } = useParams();
  const numericId = Number(id);
  const paddedId = String(numericId).padStart(4, '0');

  const info = pokemonDetails[numericId] || {
    nameKo: `포켓몬 No.${paddedId}`,
    nameEn: 'Unknown',
    badges: ['스칼렛', '바이올렛'],
    description: '아직 데이터가 등록되지 않았어요. 곧 업데이트될 예정입니다.',
    types: ['???'],
    height: '-',
    weight: '-',
    category: '??? 포켓몬',
    ability: '-',
    gender: '-',
    cta: '도감 업데이트 알림 받기',
  };

  const getViewConfig = (pokeId) => ({
    cameraPos: [0, 3, 10],
    target: [0, 0, 0],
  });
  const viewConfig = getViewConfig(numericId);

  const getModelPath = (pokeId) => {
    if (pokeId === 1) return '/pokemon/1/pm0001_00_00.dae';
    if (pokeId === 4) return '/pokemon/4/hitokage.dae';
    if (pokeId === 5) return '/pokemon/5/lizardo.dae';
    if (pokeId === 6) return '/pokemon/6/lizardon.dae';
    if (pokeId === 7) return '/pokemon/7/zenigame.dae';
    if (pokeId === 8) return '/pokemon/8/kameil.dae';
    if (pokeId === 9) return '/pokemon/9/kamex.dae';
    if (pokeId === 10) return '/pokemon/10/caterpie.dae';
    if (pokeId === 11) return '/pokemon/11/transel.dae';
    if (pokeId === 12) return '/pokemon/12/Male/butterfree.dae';
    if (pokeId === 13) return '/pokemon/13/beedle.dae';
    if (pokeId === 14) return '/pokemon/14/cocoon.dae';
    if (pokeId === 131) return '/pokemon/131/a131.dae';
    if (pokeId === 143) return '/pokemon/143/snorlax.obj';

    const fallbackPadded = String(pokeId).padStart(4, '0');
    return `/pokemon/${pokeId}/pm${fallbackPadded}_00_00.dae`;
  };

  let modelPath = getModelPath(numericId);
  if (Number.isNaN(numericId)) {
    modelPath = '/pokemon/131/a131.dae';
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        overflowX: 'hidden', // 가로 스크롤로 인한 레이아웃 흔들림 방지
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          padding: '40px 20px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <Link
          to="/"
          style={{
            alignSelf: 'flex-start',
            padding: '10px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.08)',
            color: '#0f172a',
            textDecoration: 'none',
            borderRadius: '999px',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}
        >
          ← 도감으로 돌아가기
        </Link>

        <div
          style={{
            display: 'flex',
            gap: '32px',
            flexWrap: 'nowrap', // 컬럼이 한 줄에서만 배치되도록 고정
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              flex: '1 1 460px',
              minWidth: '320px',
            }}
          >
            <div
              style={{
                borderRadius: '32px',
                background:
                  'radial-gradient(circle at top, rgba(99,102,241,0.45), rgba(15,23,42,0.9))',
                padding: '24px',
                boxShadow: '0 30px 60px rgba(15,23,42,0.35)',
              }}
            >
              <Canvas
                style={{ height: '70vh' }}
                camera={{ position: viewConfig.cameraPos, fov: 45, near: 0.05, far: 50000 }}
              >
                <OrbitControls
                  makeDefault
                  minPolarAngle={Math.PI / 5}
                  maxPolarAngle={Math.PI - Math.PI / 5}
                  target={viewConfig.target}
                />
                <ambientLight intensity={0.9} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <Suspense fallback={<Html center><h2 style={{ color: 'white' }}>로딩중...</h2></Html>}>
                  <LaprasModel modelPath={modelPath} />
                  <ContactShadows
                    position={[0, -1.2, 0]}
                    opacity={0.35}
                    scale={20}
                    blur={2.5}
                    far={2}
                  />
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div
            style={{
              flex: '1 1 380px',
              minWidth: '320px',
              backgroundColor: '#ffffff',
              borderRadius: '32px',
              padding: '40px',
              boxShadow: '0 25px 40px rgba(15,23,42,0.12)',
            }}
          >
            <p style={{ color: '#94a3b8', fontWeight: 600, margin: 0 }}>No.{paddedId}</p>
            <h1 style={{ margin: '8px 0 0', fontSize: '42px', color: '#0f172a' }}>{info.nameKo}</h1>
            <p style={{ margin: '4px 0 18px', color: '#64748b', fontWeight: 600 }}>{info.nameEn}</p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {info.badges.map((badge) => (
                <span
                  key={badge}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    backgroundColor: badge === '스칼렛' ? '#dc2626' : '#4c1d95',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>

            <p style={{ lineHeight: 1.6, color: '#475569', marginBottom: '28px' }}>{info.description}</p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {info.types.map((type) => (
                <span
                  key={type}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '16px',
                    backgroundColor: '#eef2ff',
                    color: '#4338ca',
                    fontWeight: 600,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '18px',
                marginBottom: '32px',
              }}
            >
              {[
                { label: '분류', value: info.category },
                { label: '키', value: info.height },
                { label: '몸무게', value: info.weight },
                { label: '특성', value: info.ability },
                { label: '성별', value: info.gender },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{item.label}</p>
                  <p style={{ margin: '6px 0 0', fontWeight: 600, color: '#0f172a' }}>{item.value}</p>
                </div>
              ))}
            </div>

            <button
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 20px 35px rgba(220,38,38,0.25)',
              }}
              onClick={() => window.open('https://www.pokemonkorea.co.kr/', '_blank')}
            >
              {info.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

