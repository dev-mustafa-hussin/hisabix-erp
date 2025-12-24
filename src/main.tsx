console.log("main.tsx: Starting execution");
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("main.tsx: Attempting to render <App />");
try {
  const root = document.getElementById("root");
  if (!root) {
    console.error("main.tsx: Root element not found!");
  } else {
    createRoot(root).render(<App />);
    console.log("main.tsx: Render call finished");
  }
} catch (e) {
  console.error("main.tsx: Error during render", e);
}
