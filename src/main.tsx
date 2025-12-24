console.log("main.tsx: Starting execution");
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("main.tsx: Attempting to render <App />");
try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
    console.log("main.tsx: Render call finished");
  } else {
    console.error("main.tsx: No root element found");
  }
} catch (e) {
  console.error("main.tsx: Global catch:", e);
}
