import { createContext, useContext, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import GfgHome from "./pages/GfgHome.jsx";
import ProblemDetail from "./pages/ProblemDetail.jsx";

import bgErik from "./assets/erik-mclean-8SeJUmfahu0-unsplash.jpg";
import bgJase from "./assets/jase-bloor-oCZHIa1D4EU-unsplash.jpg";
import bgLevon from "./assets/levon-vardanyan-_EpaiWp5yC8-unsplash.jpg";
import bgMoujib from "./assets/moujib-aghrout-s9ESRUFnKDg-unsplash.jpg";
import bgTianshu from "./assets/tianshu-liu-aqZ3UAjs_M4-unsplash.jpg";
import bgTim from "./assets/tim-mossholder-tq8Cuap8_wY-unsplash.jpg";

export const BG_OPTIONS = [
  { src: bgErik, label: "Erik" },
  { src: bgJase, label: "Jase" },
  { src: bgLevon, label: "Levon" },
  { src: bgMoujib, label: "Moujib" },
  { src: bgTianshu, label: "Tianshu" },
  { src: bgTim, label: "Tim" },
];

const BG_STORAGE_KEY = "lc-bg-index";
const BgContext = createContext();

export function useBg() {
  return useContext(BgContext);
}

function BgProvider({ children }) {
  const [bgIndex, setBgIndex] = useState(() => {
    const saved = parseInt(localStorage.getItem(BG_STORAGE_KEY), 10);
    return isNaN(saved) ? 0 : saved % BG_OPTIONS.length;
  });

  useEffect(() => {
    localStorage.setItem(BG_STORAGE_KEY, String(bgIndex));
    document.documentElement.style.setProperty(
      "--background-image",
      `url("${BG_OPTIONS[bgIndex].src}")`
    );
  }, [bgIndex]);

  useEffect(() => {
    BG_OPTIONS.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <BgContext.Provider value={{ bgIndex, setBgIndex }}>
      {children}
    </BgContext.Provider>
  );
}

export default function App() {
  return (
    <BgProvider>
      <div className="lc-app-shell relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1600px] flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gfg" element={<GfgHome />} />
            <Route path="/problem/:id" element={<ProblemDetail />} />
          </Routes>
        </div>
      </div>
    </BgProvider>
  );
}
