const puzzleContainer = document.getElementById('puzzle-container');
const startButton = document.getElementById('start-button');
const backButton = document.getElementById('back-button');
const downloadButton = document.getElementById('download-button');
const message = document.getElementById('message');
const modal = document.getElementById('modal');
const completedImage = document.getElementById('completed-image');
const closeButton = document.querySelector('.close-button');

const rows = 3;
const cols = 3;
const totalPieces = rows * cols;
const emptyPieceValue = totalPieces - 1; // The value representing the empty space

// This array holds the *values* of the pieces at each grid position.
// e.g., boardState[0] = 5 means piece #5 is in the top-left corner.
let boardState = [];
let imageUrl = '';

// --- Game State Logic ---

function isSolved() {
    for (let i = 0; i < totalPieces; i++) {
        if (boardState[i] !== i) return false;
    }
    return true;
}

function movePiece(clickedGridIndex) {
    const emptyGridIndex = boardState.indexOf(emptyPieceValue);

    if (isAdjacent(clickedGridIndex, emptyGridIndex)) {
        // Swap the piece values in our state array
        [boardState[clickedGridIndex], boardState[emptyGridIndex]] = [boardState[emptyGridIndex], boardState[clickedGridIndex]];
        renderBoard();

        if (isSolved()) {
            message.textContent = 'パズルが完成しました！おめでとう！';
            downloadButton.disabled = false;
            renderBoard(true); // Re-render to show the final piece
            setTimeout(showModal, 500);
        }
    }
}

function isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / cols);
    const col1 = index1 % cols;
    const row2 = Math.floor(index2 / cols);
    const col2 = index2 % cols;
    return (Math.abs(row1 - row2) === 1 && col1 === col2) || (Math.abs(col1 - col2) === 1 && row1 === row2);
}

function shuffle() {
    // Start with a solved puzzle
    boardState = Array.from({ length: totalPieces }, (_, i) => i);
    let emptyIndex = boardState.indexOf(emptyPieceValue);

    // Perform a series of random valid moves to shuffle
    for (let i = 0; i < 200; i++) {
        const neighbors = [];
        const row = Math.floor(emptyIndex / cols);
        const col = emptyIndex % cols;

        if (row > 0) neighbors.push(emptyIndex - cols);
        if (row < rows - 1) neighbors.push(emptyIndex + cols);
        if (col > 0) neighbors.push(emptyIndex - 1);
        if (col < cols - 1) neighbors.push(emptyIndex + 1);

        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const newEmptyIndex = neighbors[randomIndex];

        [boardState[emptyIndex], boardState[newEmptyIndex]] = [boardState[newEmptyIndex], boardState[emptyIndex]];
        emptyIndex = newEmptyIndex;
    }

    // If it's accidentally solved, shuffle again
    if (isSolved()) {
        shuffle();
    }
}

// --- Rendering Logic ---

function renderBoard(isComplete = false) {
    puzzleContainer.innerHTML = '';
    const containerSize = 450; // Fixed container size
    const pieceSize = containerSize / cols;

    puzzleContainer.style.width = `${containerSize}px`;
    puzzleContainer.style.height = `${containerSize}px`;
    puzzleContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let i = 0; i < totalPieces; i++) {
        const pieceValue = boardState[i];
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');

        if (pieceValue === emptyPieceValue && !isComplete) {
            piece.classList.add('empty-piece');
        } else {
            // Calculate the background position for the piece based on its correct value (0-8)
            const bgX = (pieceValue % cols) * pieceSize;
            const bgY = Math.floor(pieceValue / cols) * pieceSize;
            piece.style.backgroundImage = `url(${imageUrl})`;
            piece.style.backgroundSize = `${containerSize}px ${containerSize}px`;
            piece.style.backgroundPosition = `-${bgX}px -${bgY}px`;
        }

        piece.addEventListener('click', () => movePiece(i));
        puzzleContainer.appendChild(piece);
    }
}

// --- UI and API ---

async function startGame() {
    message.textContent = '画像を読み込み中...';
    downloadButton.disabled = true;
    const success = await fetchCatImage();
    if (success) {
        message.textContent = 'ピースをクリックして絵を完成させよう！';
        shuffle();
        renderBoard();
    }
}

async function fetchCatImage() {
    try {
        const response = await fetch('https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg,png');
        const data = await response.json();
        if (data && data[0]) {
            imageUrl = data[0].url;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error fetching cat image:', error);
        message.textContent = '画像の読み込みに失敗しました。';
        return false;
    }
}

function openImageInNewTab() {
    if (imageUrl) window.open(imageUrl, '_blank');
}

function showModal() {
    completedImage.src = imageUrl;
    modal.style.display = 'block';
}

function hideModal() {
    modal.style.display = 'none';
}

// --- Event Listeners ---

startButton.addEventListener('click', startGame);
backButton.addEventListener('click', () => { window.location.href = '../index.html'; });
downloadButton.addEventListener('click', openImageInNewTab);
closeButton.addEventListener('click', hideModal);
window.addEventListener('click', (event) => {
    if (event.target == modal) hideModal();
});

// --- Initial Load ---
startGame();