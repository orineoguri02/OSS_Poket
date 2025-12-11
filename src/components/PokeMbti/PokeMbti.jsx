import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import quizData from "../../qa.json";
import { getPokemon, getPokemonSpecies } from "../../utils/pokeapi";
import { getCardBackground } from "../../utils/helpers";
import { mbtiPokemonMapping, mbtiDescriptions } from "../../data/mbtiData";
import "./PokeMbti.css";

export default function PokeMbti() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  });
  const [showResult, setShowResult] = useState(false);
  const [mbtiResult, setMbtiResult] = useState("");
  const [recommendedPokemon, setRecommendedPokemon] = useState([]);
  const [loadingPokemon, setLoadingPokemon] = useState(false);

  const questions = quizData;

  const handleAnswer = (answer) => {
    // 답변에 따라 점수 누적
    const newAnswers = { ...answers };
    newAnswers[answer.value] += 1;
    setAnswers(newAnswers);

    // 다음 질문으로 이동
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 마지막 질문이면 결과 계산
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (finalAnswers) => {
    // 각 차원에서 더 높은 점수를 가진 유형 선택
    const mbti =
      (finalAnswers.E >= finalAnswers.I ? "E" : "I") +
      (finalAnswers.S >= finalAnswers.N ? "S" : "N") +
      (finalAnswers.T >= finalAnswers.F ? "T" : "F") +
      (finalAnswers.J >= finalAnswers.P ? "J" : "P");

    setMbtiResult(mbti);
    setShowResult(true);
    
    // 어울리는 포켓몬 데이터 가져오기
    await loadRecommendedPokemon(mbti);
  };

  // 추천 포켓몬 데이터 로드
  const loadRecommendedPokemon = async (mbti) => {
    setLoadingPokemon(true);
    try {
      const pokemonIds = mbtiPokemonMapping[mbti] || [];
      const pokemonDataPromises = pokemonIds.map(async (id) => {
        try {
          const [pokemon, species] = await Promise.all([
            getPokemon(id),
            getPokemonSpecies(id),
          ]);
          
          const nameKo = species.names?.find((n) => n.language.name === 'ko')?.name || `포켓몬 ${id}`;
          const types = pokemon.types.map((t) => t.type.name);
          
          return {
            id,
            name: nameKo,
            types,
            sprite: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
          };
        } catch (error) {
          console.error(`포켓몬 ${id} 로드 실패:`, error);
          return null;
        }
      });
      
      const pokemonData = await Promise.all(pokemonDataPromises);
      setRecommendedPokemon(pokemonData.filter(p => p !== null));
    } catch (error) {
      console.error('포켓몬 데이터 로드 실패:', error);
    } finally {
      setLoadingPokemon(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
    setShowResult(false);
    setMbtiResult("");
  };

  if (showResult) {
    const result = mbtiDescriptions[mbtiResult];
    
    return (
      <div className="mbti-container">
        <div className="mbti-result-card">
          <h1 className="result-title">당신의 포켓몬 트레이너 MBTI는</h1>
          <div className="mbti-type">{mbtiResult}</div>
          <div className="mbti-emoji">{result.emoji}</div>
          <h2 className="result-subtitle">{result.title}</h2>
          <p className="result-summary">{result.summary}</p>
          
          <div className="recommended-pokemon-section">
            <h3>🎯 당신과 어울리는 포켓몬들</h3>
            {loadingPokemon ? (
              <div className="loading-pokemon">
                <div className="spinner"></div>
                <p>포켓몬들을 찾는 중...</p>
              </div>
            ) : (
              <div className="pokemon-grid">
                {recommendedPokemon.map((pokemon) => (
                  <Link 
                    key={pokemon.id} 
                    to={`/pokemon/${pokemon.id}`}
                    className="pokemon-card-link"
                  >
                    <div 
                      className="pokemon-card"
                      style={{
                        background: getCardBackground(pokemon.types),
                      }}
                    >
                      <div className="pokemon-number">#{pokemon.id}</div>
                      <img 
                        src={pokemon.sprite} 
                        alt={pokemon.name}
                        className="pokemon-image"
                      />
                      <div className="pokemon-name">{pokemon.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="score-breakdown">
            <h3>당신의 성향 분석</h3>
            <div className="score-bars">
              <div className="score-item">
                <span className="score-label">외향(E) vs 내향(I)</span>
                <div className="score-bar">
                  <div 
                    className="score-fill left" 
                    style={{ width: `${(answers.E / 3) * 100}%` }}
                  >
                    {answers.E > 0 && <span className="score-text">{answers.E}</span>}
                  </div>
                  <div 
                    className="score-fill right" 
                    style={{ width: `${(answers.I / 3) * 100}%` }}
                  >
                    {answers.I > 0 && <span className="score-text">{answers.I}</span>}
                  </div>
                </div>
              </div>
              
              <div className="score-item">
                <span className="score-label">감각(S) vs 직관(N)</span>
                <div className="score-bar">
                  <div 
                    className="score-fill left" 
                    style={{ width: `${(answers.S / 3) * 100}%` }}
                  >
                    {answers.S > 0 && <span className="score-text">{answers.S}</span>}
                  </div>
                  <div 
                    className="score-fill right" 
                    style={{ width: `${(answers.N / 3) * 100}%` }}
                  >
                    {answers.N > 0 && <span className="score-text">{answers.N}</span>}
                  </div>
                </div>
              </div>
              
              <div className="score-item">
                <span className="score-label">사고(T) vs 감정(F)</span>
                <div className="score-bar">
                  <div 
                    className="score-fill left" 
                    style={{ width: `${(answers.T / 3) * 100}%` }}
                  >
                    {answers.T > 0 && <span className="score-text">{answers.T}</span>}
                  </div>
                  <div 
                    className="score-fill right" 
                    style={{ width: `${(answers.F / 3) * 100}%` }}
                  >
                    {answers.F > 0 && <span className="score-text">{answers.F}</span>}
                  </div>
                </div>
              </div>
              
              <div className="score-item">
                <span className="score-label">판단(J) vs 인식(P)</span>
                <div className="score-bar">
                  <div 
                    className="score-fill left" 
                    style={{ width: `${(answers.J / 3) * 100}%` }}
                  >
                    {answers.J > 0 && <span className="score-text">{answers.J}</span>}
                  </div>
                  <div 
                    className="score-fill right" 
                    style={{ width: `${(answers.P / 3) * 100}%` }}
                  >
                    {answers.P > 0 && <span className="score-text">{answers.P}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button className="btn-primary" onClick={resetQuiz}>
              다시 테스트하기
            </button>
            <button className="btn-secondary" onClick={() => navigate("/home")}>
              홈으로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="mbti-container">
      <div className="mbti-quiz-card">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        
        <div className="question-counter">
          질문 {currentQuestion + 1} / {questions.length}
        </div>

        <h2 className="question-text">{question.question}</h2>

        <div className="answers-container">
          {question.answers.map((answer, index) => (
            <button
              key={index}
              className="answer-button"
              onClick={() => handleAnswer(answer)}
            >
              {answer.text}
            </button>
          ))}
        </div>

        <button className="btn-back" onClick={() => navigate("/home")}>
          뒤로 가기
        </button>
      </div>
    </div>
  );
}

