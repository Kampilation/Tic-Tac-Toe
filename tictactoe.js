let model;
let board = Array(9).fill('');
let gameActive = true;
let currentPlayer = 'X';

// Initialize the neural network
async function initializeModel() {
    model = tf.sequential({
        layers: [
            tf.layers.dense({ units: 128, activation: 'relu', inputShape: [9] }),
            tf.layers.dense({ units: 64, activation: 'relu' }),
            tf.layers.dense({ units: 9, activation: 'softmax' })
        ]
    });

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    await trainAI();
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

    if (checkWin()) {
        document.getElementById('status').textContent = `${currentPlayer} wins!`;
        gameActive = false;
        return;
    }

    if (board.every(cell => cell !== '')) {
        document.getElementById('status').textContent = "It's a draw!";
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('status').textContent = `${currentPlayer}'s turn`;
}

// AI move using the trained model
async function makeAIMove() {
    if (!gameActive) return;

    const boardTensor = tf.tensor2d([
        board.map(cell => {
            if (cell === 'X') return 1;
            if (cell === 'O') return -1;
            return 0;
        })
    ]);

    const prediction = await model.predict(boardTensor).data();
    let bestMove = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '' && prediction[i] > bestScore) {
            bestScore = prediction[i];
            bestMove = i;
        }
    }

    if (bestMove !== -1) {
        makeMove(bestMove);
    }
}

// Update the visual board
function updateBoard() {
    const cells = document.getElementsByClassName('cell');
    for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = board[i];
    }
}

// Check for win conditions
function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });
}

// Reset the game
function resetGame() {
    board = Array(9).fill('');
    gameActive = true;
    currentPlayer = 'X';
    document.getElementById('status').textContent = "Your turn (X)";
    updateBoard();
}

// Train the AI
async function trainAI() {
    const trainingStatus = document.getElementById('training-status');
    trainingStatus.textContent = 'Training AI...';

    // Generate training data
    const trainingData = [];
    const trainingLabels = [];

    // Generate random game scenarios
    for (let i = 0; i < 1000; i++) {
        const gameBoard = Array(9).fill('');
        const moves = [];

        // Simulate random game
        for (let j = 0; j < Math.floor(Math.random() * 9); j++) {
            const emptyCells = gameBoard.reduce((acc, cell, index) => {
                if (cell === '') acc.push(index);
                return acc;
            }, []);

            if (emptyCells.length > 0) {
                const moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                gameBoard[moveIndex] = j % 2 === 0 ? 'X' : 'O';
                moves.push(moveIndex);
            }
        }

        // Add to training data
        trainingData.push(
            gameBoard.map(cell => {
                if (cell === 'X') return 1;
                if (cell === 'O') return -1;
                return 0;
            })
        );

        // Create one-hot encoded label for the next best move
        const label = Array(9).fill(0);
        const emptyCells = gameBoard.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);

        if (emptyCells.length > 0) {
            const bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            label[bestMove] = 1;
        }
        trainingLabels.push(label);
    }

    // Convert to tensors
    const xs = tf.tensor2d(trainingData);
    const ys = tf.tensor2d(trainingLabels);

    // Train the model
    await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                trainingStatus.textContent = `Training... Epoch ${epoch + 1}/50`;
            }
        }
    });

    trainingStatus.textContent = 'Training complete!';
}

// Initialize the game
createBoard();
initializeModel();