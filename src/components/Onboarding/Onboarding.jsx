import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Onboarding.css";

export default function Onboarding() {
  const [isRotating, setIsRotating] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    setIsRotating(true);
    // 회전 애니메이션 후 로그인 화면으로 이동
    setTimeout(() => {
      navigate("/login");
    }, 800); // 0.8초 후 이동
  };

  return (
    <div className="onboarding-container" onClick={handleClick}>
      <div className="stars-background">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className={`pokeball-container ${isRotating ? "rotating" : ""}`}>
        <img
          src="/image/pokeball.svg"
          alt="Pokeball"
          className="pokeball-svg"
        />
      </div>

      <div className="onboarding-text">
        <h1 className="pokemon-title">POKÉMON</h1>
        <p>포켓볼 클릭하기</p>
      </div>
    </div>
  );
}
