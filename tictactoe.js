let board = Array(9).fill('');
let gameActive = true;
let currentPlayer = 'X';

// Minimax algorithm with alpha-beta pruning
function minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
    const scores = {
        X: -10,
        O: 10,
        tie: 0
    };

    const result = checkWinningMove(board);
    if (result !== null) {
        return scores[result];
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false, alpha, beta);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true, alpha, beta);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
        }
        return bestScore;
    }
}

// Strategic move evaluation
function evaluateMove(board, index) {
    // Check if move can win
    const tempBoard = [...board];
    tempBoard[index] = 'O';
    if (checkWinningMove(tempBoard) === 'O') return 100;

    // Check if need to block opponent
    tempBoard[index] = 'X';
    if (checkWinningMove(tempBoard) === 'X') return 90;

    // Prioritize center
    if (index === 4) return 70;

    // Prioritize corners
    if ([0, 2, 6, 8].includes(index)) return 60;

    return 50;
}

// AI move logic
function makeAIMove() {
    if (!gameActive) return;

    const difficulty = document.getElementById('difficulty').value;
    let moveIndex;

    if (difficulty === 'hard') {
        // Use minimax for perfect play
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, 0, false);
                board[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        moveIndex = bestMove;
    } else if (difficulty === 'medium') {
        // Mix of strategic and random moves
        const emptyIndices = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);

        const moveScores = emptyIndices.map(index => ({
            index,
            score: evaluateMove(board, index)
        }));

        // Sometimes make suboptimal moves
        const randomFactor = Math.random();
        moveScores.sort((a, b) => b.score - a.score);

        if (randomFactor < 0.3) {
            // Make a random move 30% of the time
            moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        } else {
            // Make the best move 70% of the time
            moveIndex = moveScores[0].index;
        }
    } else {
        // Easy mode - mostly random moves
        const emptyIndices = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);

        // Only block obvious wins or take obvious winning moves
        let strategicMove = -1;
        for (const index of emptyIndices) {
            if (evaluateMove(board, index) >= 90) {
                strategicMove = index;
                break;
            }
        }

        if (strategicMove !== -1 && Math.random() < 0.3) {
            moveIndex = strategicMove;
        } else {
            moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }
    }

    if (moveIndex !== -1 && moveIndex !== undefined) {
        makeMove(moveIndex);
    }
}

// Create the game board
function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
    }
    updateBoard();
}

// Handle player moves
function handleCellClick(e) {
    const index = e.target.getAttribute('data-index');
    if (board[index] === '' && gameActive && currentPlayer === 'X') {
        makeMove(index);
        if (gameActive) {
            setTimeout(makeAIMove, 500);
        }
    }
}

// Make a move
function makeMove(index) {
    board[index] = currentPlayer;
    updateBoard();

    const winner = checkWinningMove(board);
    if (winner) {
        document.getElementById('status').textContent = winner === 'tie' ?
            "It's a tie!" : `${winner} wins!`;
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('status').textContent = `${currentPlayer}'s turn`;
}

// Check for winning move
function checkWinningMove(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    if (board.every(cell => cell !== '')) {
        return 'tie';
    }

    return null;
}

// Update the visual board
function updateBoard() {
    const cells = document.getElementsByClassName('cell');
    for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = board[i];
    }
}

// Reset the game
function resetGame() {
    board = Array(9).fill('');
    gameActive = true;
    currentPlayer = 'X';
    document.getElementById('status').textContent = "Your turn (X)";
    updateBoard();
}

// Initialize the game
createBoard();