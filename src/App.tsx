import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TutorialShell } from "./components/TutorialShell";
import { restaurantOrder } from "./tutorials/restaurant-order";
import { LiveRunner } from "./components/LiveRunner";
import { samples } from "./samples/catalog";

const defaultSampleId = samples[0].id;

function App() {
  return (
    <BrowserRouter basename="/footprint-playground">
      <Routes>
        <Route
          path="/"
          element={<TutorialShell tutorial={restaurantOrder} />}
        />
        <Route path="/samples" element={<Navigate to={`/samples/${defaultSampleId}`} replace />} />
        <Route path="/samples/:sampleId" element={<LiveRunner />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
