document.addEventListener("DOMContentLoaded", () => {
  const snakeGame = document.getElementById("snake-game");
  const scoreElement = document.getElementById("snake-score");
  const startButton = document.getElementById("start-snake");
  const funButton = document.getElementById("start-fun");
  const resetButton = document.getElementById("reset-snake");

  const ctx = createGameCanvas(snakeGame);

  // Configurações do jogo
  const gridSize = 20;
  const normalSpeed = 100; // Velocidade normal
  const funSpeed = 100; // Mesma velocidade no modo FUN
  let gameSpeed = normalSpeed;
  let gameRunning = false;
  let gameInterval;
  let score = 0;
  let aiScore = 0; // Pontuação da IA

  // Placar de vitórias (modo FUN)
  let playerWins = 0;
  let aiWins = 0;

  let isCountingDown = false;
  let isFunMode = false;

  // Cobra do jogador
  let snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];

  // Cobra da IA (para o modo FUN)
  let aiSnake = [
    { x: 20, y: 20 },
    { x: 20, y: 21 },
    { x: 20, y: 22 },
  ];
  let aiDirection = "up";

  // Direções
  let direction = "right";
  let nextDirection = "right";
  let canChangeDirection = true;

  // Comida inicial
  let food = generateFood();

  // Efeito de brilho
  let foodGlow = 1;
  let glowIncreasing = true;

  function createGameCanvas(container) {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    container.appendChild(canvas);
    return canvas.getContext("2d");
  }

  function drawInitialScreen() {
    // Fundo
    const gradient = ctx.createLinearGradient(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    gradient.addColorStop(0, "#0a0a0a");
    gradient.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Grid futurista
    ctx.strokeStyle = "rgba(0, 247, 255, 0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= ctx.canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, ctx.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(ctx.canvas.width, i);
      ctx.stroke();
    }

    // Texto de início
    ctx.font = "30px Rajdhani";
    ctx.fillStyle = "#00f7ff";
    ctx.textAlign = "center";
    ctx.shadowColor = "#00f7ff";
    ctx.shadowBlur = 10;
    ctx.fillText(
      "SNAKE NEON",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2 - 50
    );
    ctx.font = "20px Rajdhani";
    ctx.fillText(
      "Pressione 'Iniciar Jogo' para começar",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2 + 30
    );

    // Descrição do modo FUN
    if (isFunMode) {
      ctx.fillStyle = "#ff00ff";
      ctx.shadowColor = "#ff00ff";
      ctx.fillText(
        "MODO COMPETIÇÃO ATIVADO!",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2 + 70
      );
      ctx.font = "16px Rajdhani";
      ctx.fillText(
        "Você vs IA - Vença a cobra roxa!",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2 + 100
      );

      // Placar de vitórias para o modo FUN
      ctx.font = "20px Rajdhani";
      ctx.fillStyle = "#00f7ff";
      ctx.fillText(
        `Você: ${playerWins}`,
        ctx.canvas.width / 2 - 60,
        ctx.canvas.height / 2 + 140
      );

      ctx.fillStyle = "#ff00ff";
      ctx.fillText(
        `IA: ${aiWins}`,
        ctx.canvas.width / 2 + 60,
        ctx.canvas.height / 2 + 140
      );
    }

    ctx.shadowBlur = 0;
  }

  async function startGame() {
    if (!gameRunning && !isCountingDown) {
      isCountingDown = true;

      try {
        // Iniciar o countdown minimalista
        const countdownElement = document.querySelector(".countdown");
        if (!countdownElement) {
          console.error("Elemento countdown não encontrado");
          isCountingDown = false;
          return;
        }

        countdownElement.classList.add("active");

        // Countdown minimalista
        for (let i = 3; i > 0; i--) {
          countdownElement.textContent = i;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        countdownElement.classList.remove("active");
        countdownElement.textContent = "";
      } catch (error) {
        console.error("Erro durante countdown:", error);
      } finally {
        isCountingDown = false;
      }

      resetGame(false); // Não redesenhar a tela inicial

      // Reiniciar cobra do jogador
      snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ];
      direction = "right";
      nextDirection = "right";

      // Reiniciar cobra da IA em posição diferente
      if (isFunMode) {
        aiSnake = [
          {
            x: ctx.canvas.width / gridSize - 10,
            y: ctx.canvas.height / gridSize - 10,
          },
          {
            x: ctx.canvas.width / gridSize - 10,
            y: ctx.canvas.height / gridSize - 9,
          },
          {
            x: ctx.canvas.width / gridSize - 10,
            y: ctx.canvas.height / gridSize - 8,
          },
        ];
        aiDirection = "up";
        aiScore = 0; // Resetar pontuação da IA

        // Não resetamos o placar de vitórias entre partidas no modo FUN
      } else {
        // Em modo normal, reseta a pontuação
        score = 0;
        scoreElement.textContent = score;
      }

      // Definir velocidade
      gameSpeed = isFunMode ? funSpeed : normalSpeed;
      food = generateFood();

      gameRunning = true;
      if (gameInterval) clearInterval(gameInterval); // Limpar intervalo existente
      gameInterval = setInterval(gameLoop, gameSpeed);
      startButton.disabled = false;
      funButton.disabled = false;
    }
  }

  // Função que agora apenas alterna o modo FUN, não inicia o jogo
  function toggleFunMode() {
    if (!gameRunning) {
      isFunMode = !isFunMode;

      // Atualizar visual do botão
      if (isFunMode) {
        funButton.textContent = "Modo FUN: ON";
        funButton.style.boxShadow = "0 0 15px rgba(255, 0, 255, 0.8)";
      } else {
        funButton.textContent = "Modo FUN: OFF";
        funButton.style.boxShadow = "none";
      }

      drawInitialScreen();
    }
  }

  function resetGame(redraw = true) {
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }

    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    direction = "right";
    nextDirection = "right";

    // Resetar pontuações de comida
    score = 0;
    aiScore = 0;
    scoreElement.textContent = score;

    // Não resetamos o placar de vitórias entre rodadas

    food = generateFood();
    gameRunning = false;
    startButton.disabled = false;
    funButton.disabled = false;

    if (redraw) {
      drawInitialScreen();
    }
  }

  function gameLoop() {
    if (!gameRunning) return;

    try {
      // Movimentação da cobra do jogador
      direction = nextDirection;
      canChangeDirection = true;

      const head = { x: snake[0].x, y: snake[0].y };

      switch (direction) {
        case "up":
          head.y--;
          break;
        case "down":
          head.y++;
          break;
        case "left":
          head.x--;
          break;
        case "right":
          head.x++;
          break;
      }

      // Verificar colisão com as bordas
      const maxX = Math.floor(ctx.canvas.width / gridSize);
      const maxY = Math.floor(ctx.canvas.height / gridSize);

      if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
        gameOver("player");
        return;
      }

      // Verificar colisão com a própria cobra
      for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          gameOver("player");
          return;
        }
      }

      // No modo FUN, verificar colisão com a cobra da IA
      if (isFunMode) {
        for (let i = 0; i < aiSnake.length; i++) {
          if (head.x === aiSnake[i].x && head.y === aiSnake[i].y) {
            gameOver("player");
            return;
          }
        }
      }

      // Verificar colisão com comida (jogador)
      let playerAteFood = false;
      if (head.x === food.x && head.y === food.y) {
        food = generateFood();
        playerAteFood = true;
        score++;
        scoreElement.textContent = score;
      }

      // Se não comeu, remover o último segmento da cobra
      if (!playerAteFood) {
        snake.pop();
      }

      snake.unshift(head);

      // No modo FUN, mover a cobra da IA
      if (isFunMode) {
        moveAI();
      }

      drawGame();
    } catch (error) {
      console.error("Erro no gameLoop:", error);
      gameOver("error");
    }
  }

  function moveAI() {
    // IA mais inteligente para mover a cobra e evitar colisões
    try {
      const aiHead = { x: aiSnake[0].x, y: aiSnake[0].y };
      const maxX = Math.floor(ctx.canvas.width / gridSize);
      const maxY = Math.floor(ctx.canvas.height / gridSize);

      // Encontrar direções seguras (que não causam colisão)
      const safeDirections = [];

      // Verificar cada direção possível
      const possibleMoves = [
        { dir: "up", newHead: { x: aiHead.x, y: aiHead.y - 1 } },
        { dir: "down", newHead: { x: aiHead.x, y: aiHead.y + 1 } },
        { dir: "left", newHead: { x: aiHead.x - 1, y: aiHead.y } },
        { dir: "right", newHead: { x: aiHead.x + 1, y: aiHead.y } },
      ];

      // Filtrar movimentos que causariam colisão imediata
      possibleMoves.forEach((move) => {
        // Não pode ir na direção oposta
        if (
          (move.dir === "up" && aiDirection === "down") ||
          (move.dir === "down" && aiDirection === "up") ||
          (move.dir === "left" && aiDirection === "right") ||
          (move.dir === "right" && aiDirection === "left")
        ) {
          return;
        }

        // Verificar colisão com bordas
        if (
          move.newHead.x < 0 ||
          move.newHead.x >= maxX ||
          move.newHead.y < 0 ||
          move.newHead.y >= maxY
        ) {
          return;
        }

        // Verificar colisão com a própria cobra
        let selfCollision = false;
        for (let i = 0; i < aiSnake.length; i++) {
          if (
            move.newHead.x === aiSnake[i].x &&
            move.newHead.y === aiSnake[i].y
          ) {
            selfCollision = true;
            break;
          }
        }
        if (selfCollision) return;

        // Verificar colisão com a cobra do jogador
        let playerCollision = false;
        for (let i = 0; i < snake.length; i++) {
          if (move.newHead.x === snake[i].x && move.newHead.y === snake[i].y) {
            playerCollision = true;
            break;
          }
        }
        if (playerCollision) return;

        // Calcular a distância até a comida para esta direção
        const distanceToFood =
          Math.abs(move.newHead.x - food.x) + Math.abs(move.newHead.y - food.y);

        // Adicionar à lista de movimentos seguros
        safeDirections.push({
          dir: move.dir,
          distance: distanceToFood,
        });
      });

      // Escolher a melhor direção
      let newDirection;

      if (safeDirections.length > 0) {
        // Em 85% das vezes, escolher a direção que aproxima da comida
        if (Math.random() < 0.85) {
          // Ordenar por distância (menor primeiro)
          safeDirections.sort((a, b) => a.distance - b.distance);
          newDirection = safeDirections[0].dir;
        } else {
          // Às vezes, fazer um movimento aleatório para escapar de situações complicadas
          newDirection =
            safeDirections[Math.floor(Math.random() * safeDirections.length)]
              .dir;
        }
      } else {
        // Se não houver direções seguras, tentar qualquer direção diferente da oposta
        const emergencyDirections = [];
        if (aiDirection !== "down") emergencyDirections.push("up");
        if (aiDirection !== "up") emergencyDirections.push("down");
        if (aiDirection !== "right") emergencyDirections.push("left");
        if (aiDirection !== "left") emergencyDirections.push("right");

        newDirection =
          emergencyDirections[
            Math.floor(Math.random() * emergencyDirections.length)
          ];
        console.log("IA em emergência, todas direções levam a colisão!");
      }

      aiDirection = newDirection;

      // Mover a cabeça da IA
      const newAiHead = { ...aiHead };

      switch (aiDirection) {
        case "up":
          newAiHead.y--;
          break;
        case "down":
          newAiHead.y++;
          break;
        case "left":
          newAiHead.x--;
          break;
        case "right":
          newAiHead.x++;
          break;
      }

      // Verificar colisão com bordas (a IA perde)
      if (
        newAiHead.x < 0 ||
        newAiHead.x >= maxX ||
        newAiHead.y < 0 ||
        newAiHead.y >= maxY
      ) {
        gameOver("ai");
        return;
      }

      // Verificar colisão consigo mesma (a IA perde)
      for (let i = 0; i < aiSnake.length; i++) {
        if (newAiHead.x === aiSnake[i].x && newAiHead.y === aiSnake[i].y) {
          gameOver("ai");
          return;
        }
      }

      // Verificar colisão com a cobra do jogador (a IA perde)
      for (let i = 0; i < snake.length; i++) {
        if (newAiHead.x === snake[i].x && newAiHead.y === snake[i].y) {
          gameOver("ai");
          return;
        }
      }

      // Verificar se a IA comeu a comida
      let aiAteFood = false;
      if (newAiHead.x === food.x && newAiHead.y === food.y) {
        food = generateFood();
        aiAteFood = true;
        // Aumentar pontuação da IA
        aiScore++;
      }

      // Se não comeu, remover o último segmento da cobra da IA
      if (!aiAteFood) {
        aiSnake.pop();
      }

      aiSnake.unshift(newAiHead);
    } catch (error) {
      console.error("Erro no moveAI:", error);
      gameOver("error");
    }
  }

  function drawGame() {
    // Fundo com gradiente
    const gradient = ctx.createLinearGradient(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    gradient.addColorStop(0, "#0a0a0a");
    gradient.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Grid futurista
    ctx.strokeStyle = "rgba(0, 247, 255, 0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= ctx.canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, ctx.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(ctx.canvas.width, i);
      ctx.stroke();
    }

    // Efeito de brilho da comida
    if (glowIncreasing) {
      foodGlow += 0.05;
      if (foodGlow >= 1.5) glowIncreasing = false;
    } else {
      foodGlow -= 0.05;
      if (foodGlow <= 1) glowIncreasing = true;
    }

    // Desenhar cobra do jogador com efeito neon azul
    snake.forEach((segment, index) => {
      ctx.shadowColor = "#00f7ff";
      ctx.shadowBlur = index === 0 ? 15 : 10;

      if (index === 0) {
        ctx.fillStyle = "#00f7ff";
      } else {
        const alpha = 1 - (index / snake.length) * 0.6;
        ctx.fillStyle = `rgba(0, 247, 255, ${alpha})`;
      }

      ctx.fillRect(
        segment.x * gridSize,
        segment.y * gridSize,
        gridSize - 1,
        gridSize - 1
      );
    });

    // No modo FUN, desenhar a cobra da IA com efeito neon roxo
    if (isFunMode) {
      aiSnake.forEach((segment, index) => {
        ctx.shadowColor = "#ff00ff"; // Roxo neon
        ctx.shadowBlur = index === 0 ? 15 : 10;

        if (index === 0) {
          ctx.fillStyle = "#ff00ff"; // Roxo neon
        } else {
          const alpha = 1 - (index / aiSnake.length) * 0.6;
          ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
        }

        ctx.fillRect(
          segment.x * gridSize,
          segment.y * gridSize,
          gridSize - 1,
          gridSize - 1
        );
      });
    }

    // Desenhar comida
    ctx.shadowColor = "#ff0066";
    ctx.shadowBlur = 15 * foodGlow;
    ctx.fillStyle = "#ff0066";
    ctx.beginPath();
    const radius = (gridSize / 2) * foodGlow;
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // No modo FUN, exibir placar de vitórias em vez de pontuação de comida
    if (isFunMode) {
      ctx.font = "18px Rajdhani";

      // Placar de vitórias do jogador
      ctx.textAlign = "left";
      ctx.shadowColor = "#00f7ff";
      ctx.shadowBlur = 5;
      ctx.fillStyle = "#00f7ff";
      ctx.fillText(`Vitórias: ${playerWins}`, 20, 30);

      // Placar de vitórias da IA
      ctx.shadowColor = "#ff00ff";
      ctx.fillStyle = "#ff00ff";
      ctx.fillText(`IA: ${aiWins}`, 20, 60);

      // Legenda de cores
      ctx.shadowColor = "#00f7ff";
      ctx.fillStyle = "#00f7ff";
      ctx.fillText("■ Você", ctx.canvas.width - 100, 30);

      ctx.shadowColor = "#ff00ff";
      ctx.fillStyle = "#ff00ff";
      ctx.fillText("■ IA", ctx.canvas.width - 100, 60);

      ctx.shadowBlur = 0;
    } else {
      // No modo normal, atualizar o elemento de pontuação
      scoreElement.textContent = score;
    }

    ctx.shadowBlur = 0;
  }

  function generateFood() {
    const maxX = Math.floor(ctx.canvas.width / gridSize) - 1;
    const maxY = Math.floor(ctx.canvas.height / gridSize) - 1;

    let x, y;
    let validPosition = false;
    let attempts = 0;
    const maxAttempts = 100; // Evitar loop infinito

    while (!validPosition && attempts < maxAttempts) {
      x = Math.floor(Math.random() * maxX);
      y = Math.floor(Math.random() * maxY);

      validPosition = true;
      attempts++;

      // Verificar se a posição não está ocupada pela cobra do jogador
      for (let segment of snake) {
        if (segment.x === x && segment.y === y) {
          validPosition = false;
          break;
        }
      }

      // No modo FUN, verificar se não está ocupada pela cobra da IA
      if (validPosition && isFunMode) {
        for (let segment of aiSnake) {
          if (segment.x === x && segment.y === y) {
            validPosition = false;
            break;
          }
        }
      }
    }

    // Se não encontrou uma posição válida após muitas tentativas
    if (!validPosition) {
      // Encontrar qualquer posição livre no grid
      for (let x = 0; x < maxX; x++) {
        for (let y = 0; y < maxY; y++) {
          let occupied = false;

          // Verificar se está ocupado pela cobra do jogador
          for (let segment of snake) {
            if (segment.x === x && segment.y === y) {
              occupied = true;
              break;
            }
          }

          // Verificar se está ocupado pela cobra da IA
          if (!occupied && isFunMode) {
            for (let segment of aiSnake) {
              if (segment.x === x && segment.y === y) {
                occupied = true;
                break;
              }
            }
          }

          if (!occupied) {
            return { x, y };
          }
        }
      }

      // Se todo o grid estiver ocupado (caso extremo)
      return { x: maxX / 2, y: maxY / 2 };
    }

    return { x, y };
  }

  function changeDirection(event) {
    if (!canChangeDirection || !gameRunning) return;

    const key = event.keyCode;

    // Impedir mudança para a direção oposta
    if (key === 37 && direction !== "right") {
      // Esquerda
      nextDirection = "left";
      canChangeDirection = false;
    } else if (key === 38 && direction !== "down") {
      // Cima
      nextDirection = "up";
      canChangeDirection = false;
    } else if (key === 39 && direction !== "left") {
      // Direita
      nextDirection = "right";
      canChangeDirection = false;
    } else if (key === 40 && direction !== "up") {
      // Baixo
      nextDirection = "down";
      canChangeDirection = false;
    }
  }

  function gameOver(loser) {
    // Garantir que o jogo não seja encerrado múltiplas vezes (fix para o bug de travamento)
    if (!gameRunning) return;

    gameRunning = false;
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }

    // No modo FUN, atualizar o placar de vitórias
    if (isFunMode) {
      if (loser === "player") {
        aiWins++; // IA ganhou esta rodada
      } else if (loser === "ai") {
        playerWins++; // Jogador ganhou esta rodada
      }
    }

    drawGameOverScreen(loser);
  }

  function drawGameOverScreen(loser) {
    // Semi-transparente overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Texto de game over
    ctx.font = "40px Rajdhani";
    ctx.textAlign = "center";

    if (isFunMode) {
      if (loser === "player") {
        ctx.fillStyle = "#ff0066";
        ctx.shadowColor = "#ff0066";
        ctx.shadowBlur = 20;
        ctx.fillText(
          "VOCÊ PERDEU!",
          ctx.canvas.width / 2,
          ctx.canvas.height / 2 - 80
        );
      } else if (loser === "ai") {
        ctx.fillStyle = "#00ff00";
        ctx.shadowColor = "#00ff00";
        ctx.shadowBlur = 20;
        ctx.fillText(
          "VOCÊ VENCEU!",
          ctx.canvas.width / 2,
          ctx.canvas.height / 2 - 80
        );
      } else {
        ctx.fillStyle = "#ffff00";
        ctx.shadowColor = "#ffff00";
        ctx.shadowBlur = 20;
        ctx.fillText(
          "JOGO INTERROMPIDO",
          ctx.canvas.width / 2,
          ctx.canvas.height / 2 - 80
        );
      }

      // Placar de vitórias
      ctx.font = "30px Rajdhani";
      ctx.fillStyle = "#00f7ff";
      ctx.shadowColor = "#00f7ff";
      ctx.fillText(
        `Vitórias: ${playerWins}`,
        ctx.canvas.width / 2 - 80,
        ctx.canvas.height / 2 - 20
      );

      ctx.fillStyle = "#ff00ff";
      ctx.shadowColor = "#ff00ff";
      ctx.fillText(
        `IA: ${aiWins}`,
        ctx.canvas.width / 2 + 80,
        ctx.canvas.height / 2 - 20
      );
    } else {
      ctx.fillStyle = "#ff0066";
      ctx.shadowColor = "#ff0066";
      ctx.shadowBlur = 20;
      ctx.fillText(
        "GAME OVER",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2 - 80
      );

      // Pontuação final
      ctx.font = "30px Rajdhani";
      ctx.fillStyle = "#00f7ff";
      ctx.shadowColor = "#00f7ff";
      ctx.fillText(
        `Sua pontuação: ${score}`,
        ctx.canvas.width / 2,
        ctx.canvas.height / 2 - 20
      );
    }

    // Texto para o modo FUN
    if (isFunMode) {
      ctx.font = "24px Rajdhani";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ffffff";

      if (loser === "player") {
        ctx.fillText(
          "A cobra da IA venceu esta partida!",
          ctx.canvas.width / 2,
          ctx.canvas.height / 2 + 60
        );
      } else if (loser === "ai") {
        ctx.fillText(
          "Você derrotou a cobra da IA!",
          ctx.canvas.width / 2,
          ctx.canvas.height / 2 + 60
        );
      }
    }

    // Instruções para reiniciar
    ctx.font = "20px Rajdhani";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.fillText(
      "Clique em 'Reiniciar' para jogar novamente",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2 + 100
    );
    ctx.shadowBlur = 0;
  }

  // Event Listeners
  startButton.addEventListener("click", () => {
    if (!gameRunning && !isCountingDown) {
      startButton.disabled = true;
      funButton.disabled = true;
      startGame();
    }
  });

  // Mudar para um toggle on/off
  funButton.addEventListener("click", () => {
    if (!gameRunning) {
      toggleFunMode();
    }
  });

  resetButton.addEventListener("click", () => {
    // Sempre permitir reset
    resetGame();
  });

  document.addEventListener("keydown", changeDirection);

  // Prevenir scroll com setas
  window.addEventListener("keydown", (e) => {
    if ([37, 38, 39, 40].includes(e.keyCode)) {
      e.preventDefault();
    }
  });

  // Inicializar
  drawInitialScreen();

  // Configurar o visual inicial do botão FUN
  funButton.textContent = "Modo FUN: OFF";
});
