(() => {
  const canvas = document.getElementById('clockCanvas');
  const ctx = canvas.getContext('2d');
  const radius = canvas.height / 2;
  ctx.translate(radius, radius);

  let angle = 0;
  let hueShift = 0;
  let running = true;  // Control animation

  function rainbowColor(hue) {
    return `hsl(${hue % 360}, 100%, 70%)`;
  }

  function drawTriangle(ctx, x, y, size, depth, maxDepth) {
    if (depth === 0) return;

    const morph = (Math.sin(angle) + 1) / 2;

    ctx.save();
    ctx.translate(x, y);

    const maxRotation = Math.PI;
    const rotationAmount = morph * maxRotation * (depth % 2 === 0 ? 1 : -1);
    ctx.rotate(rotationAmount);

    const colorHue = (hueShift + depth * 60) % 360;
    ctx.strokeStyle = rainbowColor(colorHue);
    ctx.lineWidth = 1 + (maxDepth - depth) * 0.5;

    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.stroke();

    const newSize = size * (0.5 + 0.5 * morph);
    drawTriangle(ctx, 0, -size / 4, newSize, depth - 1, maxDepth);
    drawTriangle(ctx, size / 4, size / 4, newSize, depth - 1, maxDepth);
    drawTriangle(ctx, -size / 4, size / 4, newSize, depth - 1, maxDepth);

    ctx.restore();
  }

  function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(34, 34, 34, 0.35)';
    ctx.fill();

    ctx.globalAlpha = 0.5;
    drawTriangle(ctx, 0, 0, radius * 2, 4, 4);
    ctx.globalAlpha = 1;

    const grad = ctx.createRadialGradient(0, 0, radius * 0.95, 0, 0, radius * 1.05);
    grad.addColorStop(0, '#333');
    grad.addColorStop(0.5, '#fff');
    grad.addColorStop(1, '#333');
    ctx.strokeStyle = grad;
    ctx.lineWidth = radius * 0.1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  function drawNumbers(ctx, radius) {
    ctx.font = radius * 0.15 + "px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = '#ccc';
    for(let num = 1; num <= 12; num++) {
      let ang = num * Math.PI / 6;
      ctx.rotate(ang);
      ctx.translate(0, -radius * 0.85);
      ctx.rotate(-ang);
      ctx.fillText(num.toString(), 0, 0);
      ctx.rotate(ang);
      ctx.translate(0, radius * 0.85);
      ctx.rotate(-ang);
    }
  }

  function drawHand(ctx, pos, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
  }

  function drawTime(ctx, radius) {
    const now = new Date();
    let hour = now.getHours() % 12;
    let minute = now.getMinutes();
    let second = now.getSeconds();

    let hourPos = (hour * Math.PI / 6) + (minute * Math.PI / (6*60)) + (second * Math.PI / (360*60));
    drawHand(ctx, hourPos, radius * 0.5, radius * 0.07, 'white');

    let minutePos = (minute * Math.PI / 30) + (second * Math.PI / (30*60));
    drawHand(ctx, minutePos, radius * 0.75, radius * 0.07, 'white');

    let secondPos = second * Math.PI / 30;
    drawHand(ctx, secondPos, radius * 0.85, radius * 0.02, '#f00');
  }

  function update() {
    if (!running) return; // Stop animation if not running

    ctx.clearRect(-radius, -radius, canvas.width, canvas.height);
    drawFace(ctx, radius);
    drawNumbers(ctx, radius);
    drawTime(ctx, radius);

    angle += 0.03;
    if (angle > 2 * Math.PI) angle -= 2 * Math.PI;
    hueShift += 1;
    if (hueShift > 360) hueShift -= 360;

    requestAnimationFrame(update);
  }

  // Expose stop function globally
  window.stopClock = () => {
    running = false;
  };

  // Start the animation loop
  update();
})();
