import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Detail from './Detail';

export default function App() {
  return (
    // BrowserRouter: 라우팅을 시작하겠다는 선언
    <BrowserRouter>
      <Routes>
        {/* '/' 경로(메인)로 오면 Home 컴포넌트를 보여줌 */}
        <Route path="/" element={<Home />} />
        
        {/* '/pokemon/숫자' 경로로 오면 Detail 컴포넌트를 보여줌
            :id는 변수처럼 동작해서, URL에 있는 숫자를 Detail 컴포넌트로 넘겨줍니다. */}
        <Route path="/pokemon/:id" element={<Detail />} />
      </Routes>
    </BrowserRouter>
  );
}
