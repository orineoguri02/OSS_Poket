import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "./components/Onboarding/Onboarding";
import Home from "./components/Home/Home";
import Detail from "./components/Detail/Detail";
import Cart from "./components/Cart/Cart";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* '/' 경로(온보딩)로 오면 Onboarding 컴포넌트를 보여줌 */}
        <Route path="/" element={<Onboarding />} />
        
        {/* '/home' 경로로 오면 Home 컴포넌트를 보여줌 */}
        <Route path="/home" element={<Home />} />

        {/* '/pokemon/숫자' 경로로 오면 Detail 컴포넌트를 보여줌
            :id는 변수처럼 동작해서, URL에 있는 숫자를 Detail 컴포넌트로 넘겨줍니다. */}
        <Route path="/pokemon/:id" element={<Detail />} />

        {/* '/cart' 경로로 오면 Cart 컴포넌트를 보여줌 */}
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  );
}
