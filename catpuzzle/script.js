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

let pieces = [];
let emptyIndex = totalPieces - 1;
let imageUrl = '';
let imageWidth = 0;
let imageHeight = 0;

async function fetchCatImage() {
    try {
        const response = await fetch('https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg,png');
        const data = await response.json();
        if (data && data[0]) {
            imageUrl = data[0].url;
            imageWidth = data[0].width;
            imageHeight = data[0].height;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error fetching cat image:', error);
        message.textContent = '画像の読み込みに失敗しました。';
        return false;
    }
}

function setPuzzleDimensions() {
    const containerWidth = 450; // Base width
    const aspect = imageHeight / imageWidth;
    const containerHeight = containerWidth * aspect;

    puzzleContainer.style.width = `${containerWidth}px`;
    puzzleContainer.style.height = `${containerHeight}px`;
    puzzleContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const pieceWidth = containerWidth / cols;
    const pieceHeight = containerHeight / rows;

    for (let i = 0; i < totalPieces; i++) {
        const piece = pieces[i];
        if (piece) {
            piece.style.width = `${pieceWidth}px`;
            piece.style.height = `${pieceHeight}px`;
            const x = (i % cols) * pieceWidth;
            const y = Math.floor(i / cols) * pieceHeight;
            piece.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
            piece.style.backgroundPosition = `-${x}px -${y}px`;
        }
    }
}

function createPuzzle() {
    pieces = [];
    puzzleContainer.innerHTML = '';
    for (let i = 0; i < totalPieces; i++) {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.dataset.index = i;
        if (i === emptyIndex) {
            piece.classList.add('empty-piece');
        } else {
            piece.style.backgroundImage = `url(${imageUrl})`;
        }
        piece.addEventListener('click', () => movePiece(i));
        pieces.push(piece);
        puzzleContainer.appendChild(piece);
    }
    setPuzzleDimensions();
}

function movePiece(index) {
    if (isAdjacent(index, emptyIndex)) {
        const clickedPiece = pieces[index];
        const emptyPiece = pieces[emptyIndex];

        // Swap background and classes
        [clickedPiece.style.backgroundImage, emptyPiece.style.backgroundImage] = 
            [emptyPiece.style.backgroundImage, clickedPiece.style.backgroundImage];
        clickedPiece.classList.toggle('empty-piece');
        emptyPiece.classList.toggle('empty-piece');

        emptyIndex = index;

        if (isSolved()) {
            message.textContent = 'パズルが完成しました！おめでとう！';
            downloadButton.disabled = false;
            showModal();
        }
    }
}

function isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / cols);
    const col1 = index1 % cols;
    const row2 = Math.floor(index2 / cols);
    const col2 = index2 % cols;

    return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
           (Math.abs(col1 - col2) === 1 && row1 === row2);
}

function shuffle() {
    let lastMove = -1;
    for (let i = 0; i < 200; i++) { // Increase shuffle count for more randomness
        const neighbors = [];
        const row = Math.floor(emptyIndex / cols);
        const col = emptyIndex % cols;

        if (row > 0 && (emptyIndex - cols) !== lastMove) neighbors.push(emptyIndex - cols);
        if (row < rows - 1 && (emptyIndex + cols) !== lastMove) neighbors.push(emptyIndex + cols);
        if (col > 0 && (emptyIndex - 1) !== lastMove) neighbors.push(emptyIndex - 1);
        if (col < cols - 1 && (emptyIndex + 1) !== lastMove) neighbors.push(emptyIndex + 1);

        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const newEmptyIndex = neighbors[randomIndex];
        
        // Just swap the data, not the visual representation
        const clickedPiece = pieces[newEmptyIndex];
        const emptyPiece = pieces[emptyIndex];
        [clickedPiece.style.backgroundImage, emptyPiece.style.backgroundImage] = 
            [emptyPiece.style.backgroundImage, clickedPiece.style.backgroundImage];
        clickedPiece.classList.toggle('empty-piece');
        emptyPiece.classList.toggle('empty-piece');
        
        lastMove = emptyIndex; // Store the previous empty index
        emptyIndex = newEmptyIndex;
    }
}

function isSolved() {
    for (let i = 0; i < totalPieces; i++) {
        const piece = pieces[i];
        if (i === emptyIndex && !piece.classList.contains('empty-piece')) return false;
        if (i !== emptyIndex && piece.classList.contains('empty-piece')) return false;
    }
    return true;
}

async function startGame() {
    message.textContent = '画像を読み込み中...';
    downloadButton.disabled = true;
    const success = await fetchCatImage();
    if (success) {
        message.textContent = '';
        createPuzzle();
        shuffle();
    }
}

function openImageInNewTab() {
    if (imageUrl) {
        window.open(imageUrl, '_blank');
    }
}

function showModal() {
    completedImage.src = imageUrl;
    modal.style.display = 'block';
}

function hideModal() {
    modal.style.display = 'none';
}

startButton.addEventListener('click', startGame);
backButton.addEventListener('click', () => { window.location.href = '../index.html'; });
downloadButton.addEventListener('click', openImageInNewTab);
closeButton.addEventListener('click', hideModal);
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        hideModal();
    }
});

startGame();