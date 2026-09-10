import { setupCanvas } from "./src/canvas/setupCanvas.js";
import { startLoop } from "./src/canvas/loop.js";
import { createInput } from "./src/input/input.js";

const canvas = document.querySelector("#canvas");
const ctx = setupCanvas(canvas);

const input = createInput();

startLoop(ctx, input);
