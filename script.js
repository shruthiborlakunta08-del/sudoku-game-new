const GRID_SIZE = 9;
const BOX_SIZE = 3;
const DIFFICULTY_MAP = {
  easy: 36,
  medium: 45,
  hard: 54
};

const boardEl = document.getElementById('board');
const difficultyEl = document.getElementById('difficulty');
const timerEl = document.getElementById('timer');
const messageEl = document.getElementById('message');

let puzzle = [];
let solution = [];
let currentBoard = [];
let selectedCell = null;
let timerInterval = null;
let elapsedSeconds = 0;
let isSolved = false;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isValidPlacement(board, row, col, value) {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (i !== col && board[row][i] === value) return false;
    if (i !== row && board[i][col] === value) return false;
  }

  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = boxRow; r < boxRow + BOX_SIZE; r += 1) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === value) return false;
    }
  }

  return true;
}

function solveBoard(board) {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] === 0) {
        const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const value of values) {
          if (isValidPlacement(board, row, col, value)) {
            board[row][col] = value;
            if (solveBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function createSolvedBoard() {
  const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  solveBoard(board);
  return board;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function removeCells(board, blanks) {
  const puzzleBoard = cloneBoard(board);
  let removed = 0;

  while (removed < blanks) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);

    if (puzzleBoard[row][col] !== 0) {
      puzzleBoard[row][col] = 0;
      removed += 1;
    }
  }

  return puzzleBoard;
}

function startTimer() {
  clearInterval(timerInterval);
  elapsedSeconds = 0;
  timerEl.textContent = '00:00';

  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const seconds = String(elapsedSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function setMessage(text, status = 'info') {
  messageEl.textContent = text;
  messageEl.style.color = status === 'error' ? '#c33030' : status === 'success' ? '#1a8b59' : '#1b1f2a';
}

function renderBoard() {
  boardEl.innerHTML = '';

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = currentBoard[row][col];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.textContent = value === 0 ? '' : value;
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}`);

      const isFixed = puzzle[row][col] !== 0;
      if (isFixed) cell.classList.add('fixed');

      if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
        cell.classList.add('selected');
      }

      const sameNumber = selectedCell && value !== 0 && selectedCell.row !== row && selectedCell.col !== col && value === currentBoard[selectedCell.row][selectedCell.col];
      if (sameNumber) cell.classList.add('same-num');

      if ((row + 1) % BOX_SIZE === 0 && row !== GRID_SIZE - 1) {
        cell.classList.add('border-bottom');
      }

      if ((col + 1) % BOX_SIZE === 0 && col !== GRID_SIZE - 1) {
        cell.classList.add('border-right');
      }

      const isConflict = checkCellConflict(row, col);
      if (isConflict) cell.classList.add('conflict');

      cell.addEventListener('click', () => {
        if (!isFixed) {
          selectedCell = { row, col };
          renderBoard();
        }
      });

      boardEl.appendChild(cell);
    }
  }
}

function checkCellConflict(row, col) {
  const value = currentBoard[row][col];
  if (value === 0 || puzzle[row][col] !== 0) return false;

  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (i !== col && currentBoard[row][i] === value) return true;
    if (i !== row && currentBoard[i][col] === value) return true;
  }

  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = boxRow; r < boxRow + BOX_SIZE; r += 1) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c += 1) {
      if ((r !== row || c !== col) && currentBoard[r][c] === value) return true;
    }
  }

  return false;
}

function setCellValue(value) {
  if (!selectedCell || isSolved) return;

  const { row, col } = selectedCell;
  if (puzzle[row][col] !== 0) return;

  currentBoard[row][col] = value;
  renderBoard();

  if (currentBoard[row][col] !== solution[row][col]) {
    setMessage(`Placed ${value}. Keep going!`);
  }

  if (checkWin()) {
    isSolved = true;
    clearInterval(timerInterval);
    setMessage('Puzzle solved! Great work.', 'success');
  }
}

function clearSelectedCell() {
  if (!selectedCell || isSolved) return;

  const { row, col } = selectedCell;
  if (puzzle[row][col] !== 0) return;

  currentBoard[row][col] = 0;
  renderBoard();
}

function checkWin() {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (currentBoard[row][col] !== solution[row][col]) return false;
    }
  }
  return true;
}

function checkBoard() {
  if (checkWin()) {
    isSolved = true;
    clearInterval(timerInterval);
    setMessage('Everything is correct! You solved it.', 'success');
    return;
  }

  const conflicts = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (currentBoard[row][col] !== 0 && currentBoard[row][col] !== solution[row][col]) {
        conflicts.push({ row, col });
      }
    }
  }

  if (conflicts.length === 0) {
    setMessage('No mistakes so far. Keep going!', 'success');
  } else {
    setMessage(`You have ${conflicts.length} incorrect entries.`, 'error');
  }
}

function prepareGame() {
  const solved = createSolvedBoard();
  const blanks = DIFFICULTY_MAP[difficultyEl.value] || DIFFICULTY_MAP.medium;
  const randomPuzzle = removeCells(solved, blanks);

  puzzle = randomPuzzle;
  solution = solved;
  currentBoard = cloneBoard(randomPuzzle);
  selectedCell = null;
  isSolved = false;

  startTimer();
  renderBoard();
  setMessage('New puzzle ready. Fill the board with valid numbers.', 'info');
}

function handleKeyInput(event) {
  if (event.key >= '1' && event.key <= '9') {
    setCellValue(Number(event.key));
    return;
  }

  if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
    clearSelectedCell();
  }
}

function attachEvents() {
  difficultyEl.addEventListener('change', prepareGame);

  document.getElementById('new-game').addEventListener('click', prepareGame);
  document.getElementById('reset-board').addEventListener('click', () => {
    currentBoard = cloneBoard(puzzle);
    selectedCell = null;
    isSolved = false;
    renderBoard();
    setMessage('Board reset to the starting puzzle.', 'info');
    startTimer();
  });

  document.getElementById('check-board').addEventListener('click', checkBoard);
  document.getElementById('clear-cell').addEventListener('click', clearSelectedCell);
  document.getElementById('solve-board').addEventListener('click', () => {
    currentBoard = cloneBoard(solution);
    isSolved = true;
    clearInterval(timerInterval);
    renderBoard();
    setMessage('Solved for you. Good job!', 'success');
  });

  document.querySelectorAll('.key').forEach((button) => {
    button.addEventListener('click', () => setCellValue(Number(button.dataset.value)));
  });

  document.addEventListener('keydown', handleKeyInput);
}

attachEvents();
prepareGame();
