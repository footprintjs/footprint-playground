import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TutorialShell } from "./components/TutorialShell";
import { restaurantOrder } from "./tutorials/restaurant-order";
import { LiveRunner } from "./components/LiveRunner";

function App() {
  return (
    <BrowserRouter basename="/footprint-playground">
      <Routes>
        <Route
          path="/"
          element={<TutorialShell tutorial={restaurantOrder} />}
        />
        <Route path="/samples" element={<LiveRunner />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
