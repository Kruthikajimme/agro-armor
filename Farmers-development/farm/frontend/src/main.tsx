import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMixpanel } from "./lib/mixpanel.ts";
import { initAmplitude } from "./lib/amplitude.ts";
import { initGA4 } from "./lib/analytics.ts";

// Initialize Analytics
initGA4();
initMixpanel();
initAmplitude();

createRoot(document.getElementById("root")!).render(<App />);
