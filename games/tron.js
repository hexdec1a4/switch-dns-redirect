(() => {
  const version = 'v1.7-fps-15fps-optimized';

  // Clear and style body
  const body = document.body;
  body.innerHTML = '';
  body.style.margin = '0';
  body.style.overflow = 'hidden';
  body.style.backgroundColor = 'black';
  body.style.userSelect = 'none';

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const cellSize = 10;
  const cols = Math.floor(canvas.width / cellSize);
  const rows = Math.floor(canvas.height / cellSize);

  // FPS display div
  const fpsDiv = document.createElement('div');
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
    zIndex: '9999',
    userSelect: 'none',
  });
  fpsDiv.textContent = 'FPS: 0';
  body.appendChild(fpsDiv);

  // Bike colors player can choose from
  const playerColors = ['blue', 'green', 'yellow', 'white'];
  let playerColor = 'blue'; // default

  // Keep score globally so it persists between games
  const score = { player: 0, cpu: 0 };

  // Splash screen element
  let splash;

  // Current game interval & event handler references for cleanup
  let gameIntervalId = null;
  let currentKeyDownHandler = null;

  // Flag if game started moving
  let gameStarted = false;

  // For FPS calculation
  let lastFpsUpdate = performance.now();
  let framesThisSecond = 0;
  let currentFps = 0;

  // Prevent dpad arrow keys from scrolling the screen
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  }, { passive: false });

  // Create splash screen UI
  function createSplash() {
    splash = document.createElement('div');
    Object.assign(splash.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'monospace',
      userSelect: 'none',
      zIndex: '9999',
    });

    const title = document.createElement('div');
    title.textContent = 'Choose Your Bike Color';
    title.style.fontSize = '28px';
    title.style.marginBottom = '20px';
    splash.appendChild(title);

    playerColors.forEach(color => {
      const btn = document.createElement('button');
      btn.textContent = color.toUpperCase();
      Object.assign(btn.style, {
        backgroundColor: color,
        border: 'none',
        color: 'black',
        fontWeight: 'bold',
        padding: '12px 24px',
        margin: '8px',
        fontSize: '18px',
        cursor: 'pointer',
        borderRadius: '6px',
        minWidth: '120px',
        userSelect: 'none',
      });
      btn.onclick = () => {
        playerColor = color;
        splash.remove();
        startGame();
      };
      splash.appendChild(btn);
    });

    body.appendChild(splash);
  }

  // Draw scores at top
  function drawScores(ctx, canvas, score) {
    ctx.fillStyle = 'white';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`You: ${score.player}`, 10, 22);
    ctx.textAlign = 'right';
    ctx.fillText(`CPU: ${score.cpu}`, canvas.width - 10, 22);
  }

  // Draw a cell in the grid
  function drawCell(ctx, x, y, color, cellSize) {
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }

  // Game variables
  let gameOver = false;

  // Start the game
  function startGame() {
    gameOver = false;
    gameStarted = false; // Reset: no movement until player moves

    // Reset canvas and grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grid = Array(cols).fill(null).map(() => Array(rows).fill(false));

    // Initialize player and CPU on opposite sides near top
    const player = {
      x: 5,
      y: 5,
      dx: 0, // Start stationary
      dy: 0,
      color: playerColor,
      trail: [{ x: 5, y: 5 }],
    };

    const cpu = {
      x: cols - 6,
      y: 5,
      dx: 0, // Start stationary
      dy: 0,
      color: 'red',
      trail: [{ x: cols - 6, y: 5 }],
    };

    // Collision checker
    function collision(x, y) {
      return x < 0 || x >= cols || y < 0 || y >= rows || grid[x][y];
    }

    // CPU AI to avoid collision or lose if trapped
    function cpuMove() {
      const options = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];

      const nx = cpu.x + cpu.dx;
      const ny = cpu.y + cpu.dy;
      if (!collision(nx, ny)) return;

      const validOptions = options.filter(opt => {
        const tx = cpu.x + opt.dx;
        const ty = cpu.y + opt.dy;
        return !collision(tx, ty);
      });

      if (validOptions.length > 0) {
        const choice = validOptions[Math.floor(Math.random() * validOptions.length)];
        cpu.dx = choice.dx;
        cpu.dy = choice.dy;
      } else {
        endGame('player');
      }
    }

    // Player movement via arrow keys, disallow reversal and start game on first move
    function onKeyDown(e) {
      if (gameOver) return;

      // On first valid move, start the game
      if (!gameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        gameStarted = true;
      }

      switch (e.key) {
        case 'ArrowUp':
          if (player.dy === 1) break;
          player.dx = 0;
          player.dy = -1;
          break;
        case 'ArrowDown':
          if (player.dy === -1) break;
          player.dx = 0;
          player.dy = 1;
          break;
        case 'ArrowLeft':
          if (player.dx === 1) break;
          player.dx = -1;
          player.dy = 0;
          break;
        case 'ArrowRight':
          if (player.dx === -1) break;
          player.dx = 1;
          player.dy = 0;
          break;
      }
    }

    // Move players
    function movePlayer() {
      player.x += player.dx;
      player.y += player.dy;
    }

    function moveCPU() {
      cpu.x += cpu.dx;
      cpu.y += cpu.dy;
    }

    // Mark trails on grid
    function updateTrail() {
      player.trail.forEach(pos => (grid[pos.x][pos.y] = true));
      cpu.trail.forEach(pos => (grid[pos.x][pos.y] = true));
    }

    // Draw everything each frame
    function drawFrame() {
      // Clear canvas each frame (keep black background)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw tails (trail)
      player.trail.forEach(pos => drawCell(ctx, pos.x, pos.y, player.color, cellSize));
      cpu.trail.forEach(pos => drawCell(ctx, pos.x, pos.y, cpu.color, cellSize));
      // Draw current heads
      drawCell(ctx, player.x, player.y, player.color, cellSize);
      drawCell(ctx, cpu.x, cpu.y, cpu.color, cellSize);

      drawScores(ctx, canvas, score);
    }

    // Game over handling with cleanup and prompt
    function endGame(winner) {
      if (gameOver) return; // Prevent multiple calls
      gameOver = true;

      if (winner === 'player') score.player++;
      else if (winner === 'cpu') score.cpu++;

      clearInterval(gameIntervalId);
      window.removeEventListener('keydown', currentKeyDownHandler);

      setTimeout(() => {
        const again = confirm(
          `${winner === 'player' ? 'You win!' : 'CPU wins!'}\n\n` +
          `Score:\nYou: ${score.player} | CPU: ${score.cpu}\n\n` +
          `Play again? (OK = Restart game, Cancel = Back to color select)`
        );

        if (again) {
          gameOver = false;
          gameStarted = false;
          startGame();
        } else {
          body.innerHTML = '';
          body.appendChild(canvas);
          body.appendChild(fpsDiv);
          createSplash();
        }
      }, 100);
    }

    // Setup input listener
    if (currentKeyDownHandler) window.removeEventListener('keydown', currentKeyDownHandler);
    currentKeyDownHandler = onKeyDown;
    window.addEventListener('keydown', currentKeyDownHandler);

    // Initial trail marking
    updateTrail();

    // Initial draw
    drawFrame();

    // Game loop setup with requestAnimationFrame targeting ~15 FPS (~66ms/frame)
    let lastUpdateTime = 0;
    const targetFrameDuration = 1000 / 15;

    function gameLoop(timestamp) {
      if (gameOver) return;

      if (!lastUpdateTime) lastUpdateTime = timestamp;

      const delta = timestamp - lastUpdateTime;

      if (delta >= targetFrameDuration) {
        if (gameStarted) {
          cpuMove();
          movePlayer();
          moveCPU();

          if (collision(player.x, player.y)) {
            endGame('cpu');
            return;
          }
          if (collision(cpu.x, cpu.y)) {
            endGame('player');
            return;
          }

          player.trail.push({ x: player.x, y: player.y });
          cpu.trail.push({ x: cpu.x, y: cpu.y });
          updateTrail();

          drawFrame();
        }

        // Update FPS
        framesThisSecond++;
        const now = performance.now();
        if (now - lastFpsUpdate >= 1000) {
          currentFps = framesThisSecond;
          framesThisSecond = 0;
          lastFpsUpdate = now;
          fpsDiv.textContent = `FPS: ${currentFps}`;
        }

        lastUpdateTime = timestamp;
      }

      requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
  }

  // Show splash at start
  createSplash();
})();
