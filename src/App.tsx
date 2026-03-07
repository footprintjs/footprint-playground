import { TutorialShell } from "./components/TutorialShell";
import { restaurantOrder } from "./tutorials/restaurant-order";

function App() {
  return <TutorialShell tutorial={restaurantOrder} />;
}

export default App;
