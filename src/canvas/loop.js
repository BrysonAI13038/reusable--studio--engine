export function startLoop(ctx) {
  function draw() {
    // setupCanvas scales the context, so draw in CSS pixels.
    const width = window.innerWidth;
    const height = window.innerHeight;
    const radius = Math.min(width, height) * 0.2;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
