(() => {
  const version = 'pong-v2-monolithic';

  const body = document.body;
  body.innerHTML = '';
  body.style.margin = '0';
  body.style.overflow = 'hidden';
  body.style.backgroundColor = 'black';
  body.style.userSelect = 'none';

  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const splash = document.createElement('div');
  splash.style.position = 'fixed';
  splash.style.top = '0';
  splash.style.left = '0';
  splash.style.width = '100%';
  splash.style.height = '100%';
  splash.style.backgroundColor = 'black';
  splash.style.color = 'white';
  splash.style.display = 'flex';
  splash.style.flexDirection = 'column';
  splash.style.justifyContent = 'center';
  splash.style.alignItems = 'center';
  splash.style.fontFamily = 'monospace';
  splash.style.zIndex = '9999';

  splash.innerHTML = `
    <h1>Choose CPU Difficulty</h1>
    <button data-diff="easy">Easy</button>
    <button data-diff="medium">Medium</button>
    <button data-diff="hard">Hard</button>
    <p>Player controls: D-Pad Up / Down (Arrow keys)</p>
    <p>Hold <b>Shift</b> to toggle Disco Mode</p>
  `;
  body.appendChild(splash);

  const paddleW = 15, paddleH = 120, ballR = 10;
  const paddleSpeed = 8;
  let leftY = canvas.height / 2 - paddleH / 2;
  let rightY = canvas.height / 2 - paddleH / 2;
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballDX = 6, ballDY = 3;
  let scoreL = 0, scoreR = 0;
  let disco = false, hue = 0;
  let up = false, down = false, shift = false;

  const cpuDiffs = {
    easy: { react: 0.05, max: 3 },
    medium: { react: 0.1, max: 6 },
    hard: { react: 0.2, max: 10 }
  };
  let difficulty = 'medium';

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = disco ? `hsl(${hue}, 80%, 20%)` : 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = disco ? `hsl(${(hue + 180) % 360}, 100%, 60%)` : 'white';
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.fillRect(canvas.width / 2 - 3, y, 6, 25);
    }

    drawRect(10, leftY, paddleW, paddleH, disco ? `hsl(${(hue + 90) % 360}, 100%, 70%)` : 'white');
    drawRect(canvas.width - 10 - paddleW, rightY, paddleW, paddleH, disco ? `hsl(${(hue + 270) % 360}, 100%, 70%)` : 'white');
    drawCircle(ballX, ballY, ballR, disco ? `hsl(${(hue + 45) % 360}, 100%, 70%)` : 'white');

    ctx.font = '36px monospace';
    ctx.fillStyle = disco ? `hsl(${(hue + 135) % 360}, 100%, 85%)` : 'white';
    ctx.textAlign = 'center';
    ctx.fillText(scoreL, canvas.width / 4, 50);
    ctx.fillText(scoreR, (canvas.width / 4) * 3, 50);
  }

  function update() {
    if (up) leftY -= paddleSpeed;
    if (down) leftY += paddleSpeed;
    leftY = Math.max(0, Math.min(canvas.height - paddleH, leftY));

    const cpu = cpuDiffs[difficulty];
    const center = rightY + paddleH / 2;
    if (ballY < center - 10) rightY -= cpu.react * cpu.max * 10;
    else if (ballY > center + 10) rightY += cpu.react * cpu.max * 10;
    rightY = Math.max(0, Math.min(canvas.height - paddleH, rightY));

    ballX += ballDX;
    ballY += ballDY;

    if (ballY - ballR < 0 || ballY + ballR > canvas.height) ballDY = -ballDY;

    if (ballX - ballR < 10 + paddleW) {
      if (ballY > leftY && ballY < leftY + paddleH) {
        ballDX = -ballDX;
        ballDY = (ballY - (leftY + paddleH / 2)) * 0.35;
      } else if (ballX < 0) {
        scoreR++;
        reset();
      }
    }

    if (ballX + ballR > canvas.width - 10 - paddleW) {
      if (ballY > rightY && ballY < rightY + paddleH) {
        ballDX = -ballDX;
        ballDY = (ballY - (rightY + paddleH / 2)) * 0.35;
      } else if (ballX > canvas.width) {
        scoreL++;
        reset();
      }
    }

    if (disco) hue = (hue + 5) % 360;
  }

  function reset() {
    leftY = canvas.height / 2 - paddleH / 2;
    rightY = canvas.height / 2 - paddleH / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballDX = (Math.random() > 0.5 ? 1 : -1) * 6;
    ballDY = (Math.random() * 4) - 2;
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') up = true;
    if (e.key === 'ArrowDown') down = true;
    if (e.key === 'Shift' && !shift) {
      disco = !disco;
      shift = true;
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') up = false;
    if (e.key === 'ArrowDown') down = false;
    if (e.key === 'Shift') shift = false;
  });

  splash.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      difficulty = btn.getAttribute('data-diff');
      splash.remove();
      reset();
      loop();
    });
  });
})();
