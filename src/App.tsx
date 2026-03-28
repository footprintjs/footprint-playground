import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TutorialShell } from "./components/TutorialShell";
import { HomePage } from "./components/HomePage";
import { TryWithAI } from "./components/TryWithAI";
import { loanApplication } from "./tutorials/loan-application";
import { LiveRunner } from "./components/LiveRunner";
import { samples } from "./samples/catalog";

const defaultSampleId = samples[0].id;

function App() {
  return (
    <BrowserRouter basename="/footprint-playground">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tour" element={<TutorialShell tutorial={loanApplication} />} />
        <Route path="/try-with-ai" element={<TryWithAI />} />
        <Route path="/samples" element={<Navigate to={`/samples/${defaultSampleId}`} replace />} />
        <Route path="/samples/:sampleId" element={<LiveRunner />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
