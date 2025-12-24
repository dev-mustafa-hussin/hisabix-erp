console.log("main.tsx: Starting isolation test");
import { createRoot } from "react-dom/client";

const TestApp = () => {
  console.log("TestApp: Rendering");
  return (
    <div style={{ padding: "50px", fontSize: "24px", color: "red" }}>
      Hello World - Isolation Test
    </div>
  );
};

try {
  const rootElement = document.getElementById("root");
  console.log("main.tsx: Root element:", rootElement);
  if (rootElement) {
    const root = createRoot(rootElement);
    console.log("main.tsx: Created root, attempting render");
    root.render(<TestApp />);
    console.log("main.tsx: Render called");
  } else {
    console.error("main.tsx: No root element found");
  }
} catch (e) {
  console.error("main.tsx: Global catch:", e);
}
