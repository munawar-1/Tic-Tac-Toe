/**
 * Tic Tac Toe — Minimalist Edition
 * Clean Functional Architecture & Modular Pattern
 */

(function () {
  'use strict';

  /* ==========================================================================
     Constants & Configuration
     ========================================================================== */
  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const STORAGE_KEYS = {
    SCORES: 'ttt_minimalist_scores',
    SOUND: 'ttt_minimalist_sound',
    MODE: 'ttt_minimalist_mode'
  };

  /* ==========================================================================
     Web Audio API Sound Synthesizer (No external dependencies)
     ========================================================================== */
  const SoundFX = {
    ctx: null,
    enabled: true,

    init() {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      this.enabled = saved !== null ? saved === 'true' : true;
    },

    getAudioContext() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    },

    playTone(frequency, type, duration, startTime = 0, gainLevel = 0.15) {
      if (!this.enabled) return;
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(gainLevel, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      } catch (err) {
        console.warn('Audio playback error', err);
      }
    },

    playMove(player) {
      if (player === 'X') {
        this.playTone(520, 'sine', 0.08, 0, 0.12);
      } else {
        this.playTone(380, 'sine', 0.09, 0, 0.12);
      }
    },

    playWin() {
      // Ascending major chord
      this.playTone(440, 'triangle', 0.16, 0, 0.14);    // A4
      this.playTone(554.37, 'triangle', 0.16, 0.1, 0.14); // C#5
      this.playTone(659.25, 'triangle', 0.35, 0.2, 0.16); // E5
    },

    playTie() {
      this.playTone(320, 'sine', 0.12, 0, 0.12);
      this.playTone(280, 'sine', 0.22, 0.12, 0.12);
    },

    playRestart() {
      this.playTone(600, 'sine', 0.06, 0, 0.08);
      this.playTone(750, 'sine', 0.08, 0.05, 0.08);
    },

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem(STORAGE_KEYS.SOUND, this.enabled);
      return this.enabled;
    }
  };

  /* ==========================================================================
     Game Model & Pure Logic (Rules & Minimax AI)
     ========================================================================== */
  const GameLogic = {
    checkWinner(board) {
      for (let i = 0; i < WINNING_COMBOS.length; i++) {
        const [a, b, c] = WINNING_COMBOS[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return { winner: board[a], combo: [a, b, c] };
        }
      }

      if (board.every(cell => cell !== null)) {
        return { tie: true };
      }

      return null;
    },

    getAvailableMoves(board) {
      const moves = [];
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) moves.push(i);
      }
      return moves;
    },

    minimax(board, depth, isMaximizing, aiPlayer, humanPlayer) {
      const result = this.checkWinner(board);

      if (result) {
        if (result.winner === aiPlayer) return 10 - depth;
        if (result.winner === humanPlayer) return depth - 10;
        if (result.tie) return 0;
      }

      const availableMoves = this.getAvailableMoves(board);

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (const move of availableMoves) {
          board[move] = aiPlayer;
          const score = this.minimax(board, depth + 1, false, aiPlayer, humanPlayer);
          board[move] = null;
          bestScore = Math.max(bestScore, score);
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (const move of availableMoves) {
          board[move] = humanPlayer;
          const score = this.minimax(board, depth + 1, true, aiPlayer, humanPlayer);
          board[move] = null;
          bestScore = Math.min(bestScore, score);
        }
        return bestScore;
      }
    },

    getBestMove(board, aiPlayer) {
      const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';
      const availableMoves = this.getAvailableMoves(board);

      // If opening move on empty board, prefer center or corner
      if (availableMoves.length === 9) {
        return 4; // center
      }

      let bestScore = -Infinity;
      let chosenMove = availableMoves[0];

      for (const move of availableMoves) {
        board[move] = aiPlayer;
        const score = this.minimax(board, 0, false, aiPlayer, humanPlayer);
        board[move] = null;

        if (score > bestScore) {
          bestScore = score;
          chosenMove = move;
        }
      }

      return chosenMove;
    }
  };

  /* ==========================================================================
     Game State Management
     ========================================================================== */
  const GameState = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    gameActive: true,
    gameMode: 'pvp', // 'pvp' | 'ai'
    isAiThinking: false,
    winningCombo: null,
    scores: { X: 0, O: 0, ties: 0 },

    init() {
      // Load stored scores
      try {
        const storedScores = localStorage.getItem(STORAGE_KEYS.SCORES);
        if (storedScores) {
          this.scores = JSON.parse(storedScores);
        }
        const storedMode = localStorage.getItem(STORAGE_KEYS.MODE);
        if (storedMode === 'pvp' || storedMode === 'ai') {
          this.gameMode = storedMode;
        }
      } catch (e) {
        console.warn('Failed to parse localStorage', e);
      }
    },

    resetBoard() {
      this.board = Array(9).fill(null);
      this.currentPlayer = 'X';
      this.gameActive = true;
      this.isAiThinking = false;
      this.winningCombo = null;
    },

    resetScores() {
      this.scores = { X: 0, O: 0, ties: 0 };
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(this.scores));
    },

    updateScore(winner) {
      if (winner === 'X') {
        this.scores.X++;
      } else if (winner === 'O') {
        this.scores.O++;
      } else {
        this.scores.ties++;
      }
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(this.scores));
    },

    switchPlayer() {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }
  };

  /* ==========================================================================
     Game View & UI Controller
     ========================================================================== */
  const GameView = {
    elements: {},

    cacheDOM() {
      this.elements = {
        board: document.getElementById('board'),
        cells: Array.from(document.querySelectorAll('.cell')),
        boardWrapper: document.querySelector('.board-wrapper'),
        turnIndicator: document.getElementById('turn-indicator'),
        xPill: document.querySelector('.x-pill'),
        oPill: document.querySelector('.o-pill'),
        playerOName: document.getElementById('player-o-name'),
        gameMessage: document.getElementById('game-message'),
        scoreX: document.getElementById('score-x'),
        scoreO: document.getElementById('score-o'),
        scoreTie: document.getElementById('score-tie'),
        restartBtn: document.getElementById('restart-btn'),
        resetScoreBtn: document.getElementById('reset-score-btn'),
        modePvP: document.getElementById('mode-pvp'),
        modeAI: document.getElementById('mode-ai'),
        soundBtn: document.getElementById('sound-btn'),
        soundOnIcon: document.querySelector('.sound-on-icon'),
        soundOffIcon: document.querySelector('.sound-off-icon'),
        winningStrike: document.getElementById('winning-strike'),
        strikeLine: document.getElementById('strike-line')
      };
    },

    createMarkSVG(player) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.classList.add('mark-svg');

      if (player === 'X') {
        svg.classList.add('mark-x');
        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', '22');
        line1.setAttribute('y1', '22');
        line1.setAttribute('x2', '78');
        line1.setAttribute('y2', '78');

        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', '78');
        line2.setAttribute('y1', '22');
        line2.setAttribute('x2', '22');
        line2.setAttribute('y2', '78');

        svg.appendChild(line1);
        svg.appendChild(line2);
      } else {
        svg.classList.add('mark-o');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '50');
        circle.setAttribute('cy', '50');
        circle.setAttribute('r', '30');

        svg.appendChild(circle);
      }

      return svg;
    },

    renderCell(index, player) {
      const cell = this.elements.cells[index];
      cell.innerHTML = '';
      cell.classList.add('taken');
      cell.setAttribute('aria-label', `Cell ${index + 1}: ${player}`);
      cell.appendChild(this.createMarkSVG(player));
    },

    renderBoard(board) {
      this.elements.cells.forEach((cell, i) => {
        cell.innerHTML = '';
        cell.className = 'cell';
        cell.removeAttribute('aria-disabled');
        cell.setAttribute('aria-label', `Cell ${i + 1}`);

        if (board[i]) {
          cell.classList.add('taken');
          cell.setAttribute('aria-label', `Cell ${i + 1}: ${board[i]}`);
          cell.appendChild(this.createMarkSVG(board[i]));
        }
      });
      this.clearWinningLine();
    },

    updateTurnUI(player, gameMode, isAiThinking) {
      const { turnIndicator, xPill, oPill, gameMessage, playerOName } = this.elements;

      turnIndicator.classList.remove('turn-x', 'turn-o');
      turnIndicator.classList.add(`turn-${player.toLowerCase()}`);

      xPill.classList.toggle('active', player === 'X');
      oPill.classList.toggle('active', player === 'O');

      const oLabel = gameMode === 'ai' ? 'Computer' : 'Player O';
      playerOName.textContent = oLabel;

      if (isAiThinking) {
        gameMessage.textContent = 'Computer is thinking...';
        gameMessage.className = 'game-message highlight-o';
      } else {
        const currentPlayerName = player === 'X' ? 'Player X' : oLabel;
        gameMessage.textContent = `${currentPlayerName}'s turn`;
        gameMessage.className = 'game-message';
      }
    },

    renderGameResult(result, gameMode) {
      const { gameMessage, cells } = this.elements;

      if (result.tie) {
        gameMessage.textContent = "It's a draw!";
        gameMessage.className = 'game-message';
        return;
      }

      const winner = result.winner;
      const winnerName = winner === 'X' ? 'Player X' : (gameMode === 'ai' ? 'Computer' : 'Player O');
      gameMessage.textContent = `${winnerName} wins!`;
      gameMessage.className = `game-message highlight-${winner.toLowerCase()}`;

      // Highlight winning cells
      result.combo.forEach(idx => {
        cells[idx].classList.add('winner-cell', `winner-${winner.toLowerCase()}`);
      });

      this.drawWinningLine(result.combo, winner);
    },

    drawWinningLine(combo, winner) {
      const { boardWrapper, cells, winningStrike, strikeLine } = this.elements;
      const startCell = cells[combo[0]];
      const endCell = cells[combo[2]];

      const boardRect = boardWrapper.getBoundingClientRect();
      const startRect = startCell.getBoundingClientRect();
      const endRect = endCell.getBoundingClientRect();

      const x1 = startRect.left + startRect.width / 2 - boardRect.left;
      const y1 = startRect.top + startRect.height / 2 - boardRect.top;
      const x2 = endRect.left + endRect.width / 2 - boardRect.left;
      const y2 = endRect.top + endRect.height / 2 - boardRect.top;

      strikeLine.setAttribute('x1', x1);
      strikeLine.setAttribute('y1', y1);
      strikeLine.setAttribute('x2', x2);
      strikeLine.setAttribute('y2', y2);

      const color = winner === 'X' ? 'var(--color-x)' : 'var(--color-o)';
      strikeLine.style.color = color;

      winningStrike.classList.add('active');
    },

    clearWinningLine() {
      const { winningStrike, strikeLine } = this.elements;
      winningStrike.classList.remove('active');
      strikeLine.setAttribute('x1', '0');
      strikeLine.setAttribute('y1', '0');
      strikeLine.setAttribute('x2', '0');
      strikeLine.setAttribute('y2', '0');
    },

    renderScores(scores, bumpKey = null) {
      const { scoreX, scoreO, scoreTie } = this.elements;
      scoreX.textContent = scores.X;
      scoreO.textContent = scores.O;
      scoreTie.textContent = scores.ties;

      if (bumpKey) {
        const target = bumpKey === 'X' ? scoreX : bumpKey === 'O' ? scoreO : scoreTie;
        target.classList.add('bump');
        setTimeout(() => target.classList.remove('bump'), 220);
      }
    },

    updateModeUI(mode) {
      const { modePvP, modeAI, playerOName } = this.elements;
      if (mode === 'pvp') {
        modePvP.classList.add('active');
        modePvP.setAttribute('aria-selected', 'true');
        modeAI.classList.remove('active');
        modeAI.setAttribute('aria-selected', 'false');
        playerOName.textContent = 'Player O';
      } else {
        modeAI.classList.add('active');
        modeAI.setAttribute('aria-selected', 'true');
        modePvP.classList.remove('active');
        modePvP.setAttribute('aria-selected', 'false');
        playerOName.textContent = 'Computer';
      }
    },

    updateSoundUI(enabled) {
      const { soundOnIcon, soundOffIcon, soundBtn } = this.elements;
      if (enabled) {
        soundOnIcon.classList.remove('hidden');
        soundOffIcon.classList.add('hidden');
        soundBtn.setAttribute('aria-label', 'Sound is enabled. Click to mute.');
      } else {
        soundOnIcon.classList.add('hidden');
        soundOffIcon.classList.remove('hidden');
        soundBtn.setAttribute('aria-label', 'Sound is muted. Click to enable.');
      }
    }
  };

  /* ==========================================================================
     Game Controller (Event Handling & Coordination)
     ========================================================================== */
  const GameController = {
    init() {
      SoundFX.init();
      GameState.init();
      GameView.cacheDOM();

      this.bindEvents();
      this.syncInitialUI();
    },

    syncInitialUI() {
      GameView.updateModeUI(GameState.gameMode);
      GameView.updateSoundUI(SoundFX.enabled);
      GameView.renderScores(GameState.scores);
      GameView.updateTurnUI(GameState.currentPlayer, GameState.gameMode, false);
      GameView.renderBoard(GameState.board);
    },

    bindEvents() {
      const { board, restartBtn, resetScoreBtn, modePvP, modeAI, soundBtn, cells } = GameView.elements;

      // Board cell click
      board.addEventListener('click', (e) => {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const index = parseInt(cell.dataset.index, 10);
        this.handleMove(index);
      });

      // Keyboard accessibility for grid
      board.addEventListener('keydown', (e) => {
        const cell = document.activeElement.closest('.cell');
        if (!cell) return;

        const index = parseInt(cell.dataset.index, 10);
        let nextIndex = null;

        switch (e.key) {
          case 'ArrowRight':
            nextIndex = (index % 3 < 2) ? index + 1 : index - 2;
            break;
          case 'ArrowLeft':
            nextIndex = (index % 3 > 0) ? index - 1 : index + 2;
            break;
          case 'ArrowDown':
            nextIndex = (index < 6) ? index + 3 : index - 6;
            break;
          case 'ArrowUp':
            nextIndex = (index > 2) ? index - 3 : index + 6;
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            this.handleMove(index);
            return;
          default:
            return;
        }

        if (nextIndex !== null && cells[nextIndex]) {
          e.preventDefault();
          cells[nextIndex].focus();
        }
      });

      // Actions
      restartBtn.addEventListener('click', () => {
        SoundFX.playRestart();
        this.restartGame();
      });

      resetScoreBtn.addEventListener('click', () => {
        SoundFX.playRestart();
        GameState.resetScores();
        GameView.renderScores(GameState.scores);
      });

      // Modes
      modePvP.addEventListener('click', () => this.switchMode('pvp'));
      modeAI.addEventListener('click', () => this.switchMode('ai'));

      // Sound toggle
      soundBtn.addEventListener('click', () => {
        const enabled = SoundFX.toggle();
        GameView.updateSoundUI(enabled);
        if (enabled) SoundFX.playRestart();
      });

      // Recalculate winning strike on window resize
      window.addEventListener('resize', () => {
        if (GameState.winningCombo && !GameState.gameActive) {
          const result = GameLogic.checkWinner(GameState.board);
          if (result && result.winner) {
            GameView.drawWinningLine(result.combo, result.winner);
          }
        }
      });
    },

    handleMove(index) {
      if (!GameState.gameActive || GameState.isAiThinking) return;
      if (GameState.board[index] !== null) return;

      this.executeMove(index, GameState.currentPlayer);

      if (!GameState.gameActive) return;

      // Handle AI Turn if AI mode active
      if (GameState.gameMode === 'ai' && GameState.currentPlayer === 'O') {
        this.triggerAIMove();
      }
    },

    executeMove(index, player) {
      GameState.board[index] = player;
      GameView.renderCell(index, player);
      SoundFX.playMove(player);

      const result = GameLogic.checkWinner(GameState.board);

      if (result) {
        GameState.gameActive = false;
        GameState.winningCombo = result.combo || null;

        if (result.tie) {
          GameState.updateScore('tie');
          GameView.renderScores(GameState.scores, 'tie');
          GameView.renderGameResult({ tie: true }, GameState.gameMode);
          SoundFX.playTie();
        } else {
          GameState.updateScore(result.winner);
          GameView.renderScores(GameState.scores, result.winner);
          GameView.renderGameResult(result, GameState.gameMode);
          SoundFX.playWin();
        }
      } else {
        GameState.switchPlayer();
        GameView.updateTurnUI(GameState.currentPlayer, GameState.gameMode, false);
      }
    },

    triggerAIMove() {
      GameState.isAiThinking = true;
      GameView.updateTurnUI('O', GameState.gameMode, true);

      // Organic AI response delay for natural human feel (350ms)
      setTimeout(() => {
        if (!GameState.gameActive) {
          GameState.isAiThinking = false;
          return;
        }

        const bestMove = GameLogic.getBestMove(GameState.board, 'O');
        GameState.isAiThinking = false;

        if (bestMove !== undefined && bestMove !== null) {
          this.executeMove(bestMove, 'O');
        }
      }, 360);
    },

    restartGame() {
      GameState.resetBoard();
      GameView.renderBoard(GameState.board);
      GameView.updateTurnUI(GameState.currentPlayer, GameState.gameMode, false);
    },

    switchMode(mode) {
      if (GameState.gameMode === mode) return;

      GameState.gameMode = mode;
      localStorage.setItem(STORAGE_KEYS.MODE, mode);
      GameView.updateModeUI(mode);
      SoundFX.playRestart();
      this.restartGame();
    }
  };

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GameController.init());
  } else {
    GameController.init();
  }
})();
