export function createInput() {
  let storedIntensity = 0;
  let intensity = 0;
  const relaxation = 0.065; // Stored intensity has a roughly 11-second half-life.
  const response = 12; // Respond promptly while smoothing individual wheel steps.

  window.addEventListener("wheel", (event) => {
    if (event.ctrlKey) return;

    // Normalize pixel, line, and page wheel units. Up builds; down reduces.
    const unit = event.deltaMode === 1 ? 16
      : event.deltaMode === 2 ? window.innerHeight : 1;
    storedIntensity = Math.max(0, Math.min(1,
      storedIntensity - event.deltaY * unit / 1000));
  }, { passive: true });

  return {
    update(deltaSeconds) {
      const time = Math.max(0, deltaSeconds);
      const decay = Math.exp(-relaxation * time);
      const smoothing = Math.exp(-response * time);
      // Exact smoothing of a slowly decaying target, independent of frame rate.
      intensity = intensity * smoothing + storedIntensity * response
        / (response - relaxation) * (decay - smoothing);
      storedIntensity *= decay;
      if (storedIntensity < 0.0001 && intensity < 0.0001) {
        storedIntensity = 0;
        intensity = 0;
      }
      return Math.max(0, Math.min(1, intensity));
    },
  };
}
