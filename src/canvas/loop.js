const TAU = Math.PI * 2;
const SECTION_COUNT = 16;
const SECTION_ANGLE = TAU / SECTION_COUNT;

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

// Exact arc extrema after rotation, including half the stroke width.
function fragmentBounds(radius, middle, span, rotation, strokeWidth) {
  const angle = middle + rotation;
  const start = angle - span / 2;
  const end = angle + span / 2;
  const angles = [start, end];
  for (let quadrant = Math.ceil(start / (Math.PI / 2));
    quadrant * Math.PI / 2 <= end; quadrant += 1) {
    angles.push(quadrant * Math.PI / 2);
  }
  const xs = angles.map(value => radius * (Math.cos(value) - Math.cos(angle)));
  const ys = angles.map(value => radius * (Math.sin(value) - Math.sin(angle)));
  const padding = strokeWidth / 2;
  return {
    left: Math.min(...xs) - padding,
    right: Math.max(...xs) + padding,
    top: Math.min(...ys) - padding,
    bottom: Math.max(...ys) + padding,
  };
}

export function startLoop(ctx, input) {
  let previousTime;
  let phase = 0;
  let visitor = null;
  let cooldown = 20;

  function draw(time) {
    const elapsed = previousTime === undefined ? 0 : Math.max(0, (time - previousTime) / 1000);
    previousTime = time;
    const intensity = input.update(elapsed);
    // Avoid teleporting fragments after a background tab resumes.
    const dt = Math.min(elapsed, 0.05);
    const power = intensity ** 2;
    phase += dt * (0.35 + 5 * power);
    cooldown = Math.max(0, cooldown - dt);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const radius = Math.min(width, height) * 0.2;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    function arc(x, y, start, end) {
      if (end <= start) return;
      ctx.beginPath();
      ctx.arc(x, y, radius, start, end);
      ctx.stroke();
    }

    if (intensity === 0 && !visitor) {
      arc(centerX, centerY, 0, TAU);
    } else {
      // Roughly one chance per 55 seconds spent above the high-intensity gate,
      // plus a cooldown. The event borrows an existing arc, never duplicates it.
      if (!visitor && cooldown === 0 && intensity > 0.85
        && Math.random() < 1 - Math.exp(-0.018 * dt)) {
        visitor = {
          section: Math.floor(Math.random() * SECTION_COUNT),
          age: 0,
          x: centerX,
          y: centerY,
          vx: 0,
          vy: 0,
          initialized: false,
          aimForCorner: Math.random() < 0.000001,
        };
      }
      if (visitor) visitor.age += dt;

      for (let section = 0; section < SECTION_COUNT; section += 1) {
        const start = section * SECTION_ANGLE;
        const end = start + SECTION_ANGLE;
        const middle = (start + end) / 2;
        // Spread activation around the circle instead of opening one side first.
        const rank = (section * 7) % SECTION_COUNT;
        const activation = smoothstep((intensity - rank / SECTION_COUNT * 0.78) / 0.08);
        const span = SECTION_ANGLE * (0.16 + 0.56 * power) * activation;
        const fragmentStart = middle - span / 2;
        const fragmentEnd = middle + span / 2;

        // These remaining arcs and the moving arc partition the original ring.
        arc(centerX, centerY, start, fragmentStart);
        arc(centerX, centerY, fragmentEnd, end);
        if (span === 0) continue;

        const radialX = Math.cos(middle);
        const radialY = Math.sin(middle);
        const pivotX = radialX * radius;
        const pivotY = radialY * radius;
        const pulse = (1 - Math.cos(phase * (1 + section * 0.027) + section * 2.4)) / 2;
        // Keep some separation throughout the cycle so input is visible right away.
        const travel = (radius * 0.5 * intensity + Math.hypot(width, height) * 0.62 * power)
          * activation * (0.35 + 0.65 * pulse ** 2);
        const shear = Math.sin(phase + section * 1.7) * travel * 0.25;
        let x = centerX + pivotX + radialX * travel - radialY * shear;
        let y = centerY + pivotY + radialY * travel + radialX * shear;
        let rotation = Math.sin(phase * 1.3 + section) * intensity * activation * 1.2;

        const event = visitor && visitor.section === section ? visitor : null;
        const blend = event ? smoothstep(event.age / 0.3)
          * (1 - smoothstep((event.age - 5) / 1.5)) : 0;
        if (event) rotation += Math.sin(event.age * 2) * intensity * blend;

        const bounds = fragmentBounds(radius, middle, span, rotation, ctx.lineWidth);
        const minX = -bounds.left;
        const minY = -bounds.top;
        const maxX = width - bounds.right;
        const maxY = height - bounds.bottom;
        // Ordinary flights stop at an edge until their cycle pulls them inward.
        x = clamp(x, minX, maxX);
        y = clamp(y, minY, maxY);

        if (event) {
          if (!event.initialized) {
            event.x = x;
            event.y = y;
            event.cornerRight = x < centerX;
            event.cornerBottom = y < centerY;
            const angle = middle + 0.4;
            event.vx = Math.cos(angle);
            event.vy = Math.sin(angle);
            event.initialized = true;
          }
          const speed = Math.min(width, height) * (0.12 + 1.1 * power);
          // A minority of already-rare flights aim once at the opposite corner.
          // Recompute the target as the arc rotates or the viewport resizes.
          if (event.aimForCorner && event.age >= 0.3 && event.age < 5) {
            const targetX = event.cornerRight ? maxX : minX;
            const targetY = event.cornerBottom ? maxY : minY;
            const dx = targetX - event.x;
            const dy = targetY - event.y;
            const distance = Math.hypot(dx, dy);
            if (distance <= speed * dt) {
              event.x = targetX;
              event.y = targetY;
              event.vx = (event.cornerRight ? -1 : 1) * Math.SQRT1_2;
              event.vy = (event.cornerBottom ? -1 : 1) * Math.SQRT1_2;
              event.aimForCorner = false;
              // Render the exact corner contact before the next bounce step.
              event.cornerContact = true;
            } else {
              event.vx = dx / distance;
              event.vy = dy / distance;
            }
          }
          if (!event.cornerContact) {
            event.x += event.vx * speed * dt;
            event.y += event.vy * speed * dt;
          }
          event.cornerContact = false;
          if (event.x < minX || event.x > maxX) {
            event.vx = event.x < minX ? Math.abs(event.vx) : -Math.abs(event.vx);
          }
          if (event.y < minY || event.y > maxY) {
            event.vy = event.y < minY ? Math.abs(event.vy) : -Math.abs(event.vy);
          }
          event.x = clamp(event.x, minX, maxX);
          event.y = clamp(event.y, minY, maxY);
          x += (event.x - x) * blend;
          y += (event.y - y) * blend;
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        arc(-pivotX, -pivotY, fragmentStart, fragmentEnd);
        ctx.restore();
      }
      if (visitor && visitor.age >= 6.5) {
        visitor = null;
        cooldown = 30;
      }
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
