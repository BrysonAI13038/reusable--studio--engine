import { setupCanvas } from "./src/canvas/setupCanvas.js";
import { startLoop } from "./src/canvas/loop.js";

const canvas = document.querySelector("#canvas");
const ctx = setupCanvas(canvas);

startLoop(ctx);
