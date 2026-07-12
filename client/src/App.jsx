import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import GfgHome from "./pages/GfgHome.jsx";
import ProblemDetail from "./pages/ProblemDetail.jsx";

export default function App() {
  return (
    <div className="lc-app-shell relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1600px] flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gfg" element={<GfgHome />} />
          <Route path="/problem/:id" element={<ProblemDetail />} />
        </Routes>
      </div>
    </div>
  );
}
