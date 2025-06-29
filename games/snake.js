(() => {
  // Cleanup old elements if exist
  ['snakeCanvas', 'splashDiv', 'fpsDiv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  // --- Create Splash Screen ---
  const splashDiv = document.createElement('div');
  splashDiv.id = 'splashDiv';
  Object.assign(splashDiv.style, {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#111',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    zIndex: '10002',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    userSelect: 'none'
  });

  const title = document.createElement('h1');
  title.textContent = 'Snake Game';
  splashDiv.appendChild(title);

  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start';
  Object.assign(startBtn.style, {
    fontSize: '2rem',
    padding: '15px 40px',
    cursor: 'pointer',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    marginTop: '20px',
  });
  startBtn.onmouseenter = () => startBtn.style.backgroundColor = '#45a049';
  startBtn.onmouseleave = () => startBtn.style.backgroundColor = '#4CAF50';

  splashDiv.appendChild(startBtn);
  document.body.appendChild(splashDiv);

  // Setup canvas
  const snakeCanvas = document.createElement('canvas');
  snakeCanvas.id = 'snakeCanvas';
  snakeCanvas.width = window.innerWidth;
  snakeCanvas.height = window.innerHeight;
  Object.assign(snakeCanvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '10000',
    background: '#000',
    display: 'none'
  });
  document.body.appendChild(snakeCanvas);

  const sCtx = snakeCanvas.getContext('2d');
  sCtx.imageSmoothingEnabled = false;

  // Offscreen canvas for snake + food rendering
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = snakeCanvas.width;
  offscreenCanvas.height = snakeCanvas.height;
  const offCtx = offscreenCanvas.getContext('2d');
  offCtx.imageSmoothingEnabled = false;

  // FPS display
  const fpsDiv = document.createElement('div');
  fpsDiv.id = 'fpsDiv';
  Object.assign(fpsDiv.style, {
    position: 'fixed',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: '5px 15px',
    borderRadius: '8px',
    zIndex: '10003',
    userSelect: 'none',
    display: 'none',
  });
  document.body.appendChild(fpsDiv);

  // Game variables
  const scale = 20;
  const cols = Math.floor(snakeCanvas.width / scale);
  const rows = Math.floor(snakeCanvas.height / scale);

  let snake = [{ x: 10, y: 10 }];
  let snakeSet = new Set(['10,10']); // For quick collision detection
  let direction = { x: 0, y: 0 };
  let food = {};
  let snakeLength = 1;
  let score = 0;
  let gameStarted = false;

  // FPS calculation
  let framesThisSecond = 0;
  let lastFpsUpdate = performance.now();
  let fps = 0;

  function posToKey(pos) {
    return `${pos.x},${pos.y}`;
  }

  function placeFood() {
    do {
      food.x = Math.floor(Math.random() * cols);
      food.y = Math.floor(Math.random() * rows);
    } while (snakeSet.has(posToKey(food)));
  }

  function updateSnake() {
    if (direction.x === 0 && direction.y === 0) return;

    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check boundaries
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      resetGame();
      return;
    }

    // Check collision with self using Set lookup
    if (snakeSet.has(posToKey(head))) {
      resetGame();
      return;
    }

    snake.unshift(head);
    snakeSet.add(posToKey(head));

    if (snake.length > snakeLength) {
      let tail = snake.pop();
      snakeSet.delete(posToKey(tail));
    }

    if (head.x === food.x && head.y === food.y) {
      snakeLength++;
      score++;
      placeFood();
    }
  }

  function resetGame() {
    snakeLength = 1;
    snake = [{ x: 10, y: 10 }];
    snakeSet.clear();
    snakeSet.add(posToKey(snake[0]));
    direction = { x: 0, y: 0 };
    score = 0;
    placeFood();
  }

  function drawSnake() {
    // Clear offscreen first
    offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    offCtx.fillStyle = 'lime';
    for (const part of snake) {
      offCtx.fillRect(part.x * scale, part.y * scale, scale, scale);
    }

    offCtx.fillStyle = 'red';
    offCtx.fillRect(food.x * scale, food.y * scale, scale, scale);

    // Draw score
    offCtx.fillStyle = 'white';
    offCtx.font = '24px Arial';
    offCtx.textAlign = 'left';
    offCtx.fillText(`Score: ${score}`, 10, 30);
  }

  function updateFPS() {
    const now = performance.now();
    if (now - lastFpsUpdate >= 1000) {
      fps = framesThisSecond;
      framesThisSecond = 0;
      lastFpsUpdate = now;
      fpsDiv.textContent = `FPS: ${fps}`;
    }
  }

  function draw() {
    if (!gameStarted) return;

    // Draw snake/food on offscreen canvas
    drawSnake();

    // Then draw offscreen canvas to visible canvas (single drawImage call)
    sCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    sCtx.drawImage(offscreenCanvas, 0, 0);

    // Draw FPS on main canvas
    sCtx.fillStyle = '#0f0';
    sCtx.font = '20px monospace';
    sCtx.textAlign = 'center';
    sCtx.fillText(`FPS: ${fps}`, snakeCanvas.width / 2, 30);

    framesThisSecond++;
  }

  let lastUpdateTime = 0;
  const targetFps = 15;
  const frameDuration = 1000 / targetFps;

  function gameLoop(timestamp) {
    if (!gameStarted) return;

    if (!lastUpdateTime) lastUpdateTime = timestamp;
    const delta = timestamp - lastUpdateTime;

    if (delta > frameDuration) {
      updateSnake();
      draw();
      updateFPS();
      lastUpdateTime = timestamp;
    }
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    gameStarted = true;
    splashDiv.style.display = 'none';
    snakeCanvas.style.display = 'block';
    fpsDiv.style.display = 'block';

    resetGame();
    lastUpdateTime = 0;
    framesThisSecond = 0;
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('keydown', e => {
    if (!gameStarted) return;
    switch (e.key) {
      case 'ArrowUp':
        if (direction.y === 1) break;
        direction = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        if (direction.y === -1) break;
        direction = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        if (direction.x === 1) break;
        direction = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        if (direction.x === -1) break;
        direction = { x: 1, y: 0 };
        break;
    }
  }, { passive: true });

  startBtn.onclick = startGame;
})();
