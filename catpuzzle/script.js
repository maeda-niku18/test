const puzzleContainer = document.getElementById('puzzle-container');
const startButton = document.getElementById('start-button');
const backButton = document.getElementById('back-button');
const message = document.getElementById('message');

const rows = 3;
const cols = 3;
const totalPieces = rows * cols;

let pieces = [];
let emptyIndex = totalPieces - 1;
let imageUrl = '';

async function fetchCatImage() {
    try {
        const response = await fetch('https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg,png');
        const data = await response.json();
        return data[0].url;
    } catch (error) {
        console.error('Error fetching cat image:', error);
        message.textContent = '画像の読み込みに失敗しました。';
        return null;
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
            const x = (i % cols) * 150;
            const y = Math.floor(i / cols) * 150;
            piece.style.backgroundImage = `url(${imageUrl})`;
            piece.style.backgroundPosition = `-${x}px -${y}px`;
        }
        piece.addEventListener('click', () => movePiece(i));
        pieces.push(piece);
        puzzleContainer.appendChild(piece);
    }
}

function movePiece(index) {
    if (isAdjacent(index, emptyIndex)) {
        [pieces[index].style.backgroundImage, pieces[emptyIndex].style.backgroundImage] = 
            [pieces[emptyIndex].style.backgroundImage, pieces[index].style.backgroundImage];
        [pieces[index].style.backgroundPosition, pieces[emptyIndex].style.backgroundPosition] = 
            [pieces[emptyIndex].style.backgroundPosition, pieces[index].style.backgroundPosition];
        [pieces[index].classList, pieces[emptyIndex].classList] = 
            [pieces[emptyIndex].classList, pieces[index].classList];
        
        emptyIndex = index;

        if (isSolved()) {
            message.textContent = 'パズルが完成しました！おめでとう！';
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
    let count = 100;
    while (count > 0) {
        const neighbors = [];
        const row = Math.floor(emptyIndex / cols);
        const col = emptyIndex % cols;

        if (row > 0) neighbors.push(emptyIndex - cols);
        if (row < rows - 1) neighbors.push(emptyIndex + cols);
        if (col > 0) neighbors.push(emptyIndex - 1);
        if (col < cols - 1) neighbors.push(emptyIndex + 1);

        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const newEmptyIndex = neighbors[randomIndex];
        
        movePiece(newEmptyIndex);
        count--;
    }
}

function isSolved() {
    for (let i = 0; i < totalPieces; i++) {
        if (i !== emptyIndex) {
            const piece = pieces[i];
            const x = (i % cols) * 150;
            const y = Math.floor(i / cols) * 150;
            if (piece.style.backgroundPosition !== `-${x}px -${y}px`) {
                return false;
            }
        }
    }
    return true;
}

async function startGame() {
    message.textContent = '';
    imageUrl = await fetchCatImage();
    if (imageUrl) {
        createPuzzle();
        shuffle();
    }
}

startButton.addEventListener('click', startGame);
backButton.addEventListener('click', () => { window.location.href = '../index.html'; });

startGame();
