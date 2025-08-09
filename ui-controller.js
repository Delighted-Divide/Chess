class UIController {
    constructor(chessEngine, aiEngine) {
        this.chessEngine = chessEngine;
        this.aiEngine = aiEngine;
        this.boardElement = document.getElementById('chessboard');
        this.selectedSquare = null;
        this.draggedPiece = null;
        this.boardFlipped = false;
        this.gameMode = 'pvai';
        this.playerColor = 'white';
        this.currentTheme = 'classic';
        this.currentPieceStyle = 'classic';
        this.highlightedSquares = [];
        this.lastMoveSquares = [];
        this.isAIThinking = false;
        
        this.initializeBoard();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeBoard() {
        this.boardElement.innerHTML = '';
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.dataset.row = row;
                square.dataset.col = col;
                
                const isLight = (row + col) % 2 === 0;
                square.classList.add(isLight ? 'light' : 'dark');
                
                if (col === 0) {
                    const rankLabel = document.createElement('div');
                    rankLabel.className = 'rank-label';
                    rankLabel.textContent = this.boardFlipped ? (row + 1) : (8 - row);
                    square.appendChild(rankLabel);
                }
                
                if (row === 7) {
                    const fileLabel = document.createElement('div');
                    fileLabel.className = 'file-label';
                    fileLabel.textContent = this.boardFlipped ? files[7 - col] : files[col];
                    square.appendChild(fileLabel);
                }
                
                this.boardElement.appendChild(square);
            }
        }
        
        this.renderPieces();
    }

    renderPieces() {
        const squares = this.boardElement.querySelectorAll('.square');
        
        squares.forEach(square => {
            const pieceElement = square.querySelector('.piece');
            if (pieceElement) {
                pieceElement.remove();
            }
        });
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.chessEngine.getPiece(row, col);
                if (piece) {
                    const displayRow = this.boardFlipped ? 7 - row : row;
                    const displayCol = this.boardFlipped ? 7 - col : col;
                    const square = this.getSquareElement(displayRow, displayCol);
                    const pieceElement = this.createPieceElement(piece);
                    square.appendChild(pieceElement);
                }
            }
        }
    }

    createPieceElement(piece) {
        const element = document.createElement('div');
        element.className = `piece ${piece.color} ${this.currentPieceStyle}`;
        element.dataset.type = piece.type;
        element.dataset.color = piece.color;
        element.draggable = true;
        
        const pieceSymbols = {
            white: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
            black: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
        };
        
        element.textContent = pieceSymbols[piece.color][piece.type];
        
        return element;
    }

    getSquareElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    getBoardPosition(displayRow, displayCol) {
        if (this.boardFlipped) {
            return { row: 7 - displayRow, col: 7 - displayCol };
        }
        return { row: displayRow, col: displayCol };
    }

    attachEventListeners() {
        this.boardElement.addEventListener('click', (e) => this.handleSquareClick(e));
        this.boardElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
        this.boardElement.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.boardElement.addEventListener('drop', (e) => this.handleDrop(e));
        this.boardElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        document.getElementById('newGamePvAI').addEventListener('click', () => this.startNewGame('pvai'));
        document.getElementById('newGameAIvAI').addEventListener('click', () => this.startNewGame('aivai'));
        document.getElementById('playWhite').addEventListener('click', () => this.selectSide('white'));
        document.getElementById('playBlack').addEventListener('click', () => this.selectSide('black'));
        document.getElementById('undoMove').addEventListener('click', () => this.undoMove());
        document.getElementById('flipBoard').addEventListener('click', () => this.flipBoard());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        document.getElementById('depthSlider').addEventListener('input', (e) => this.updateDepth(e));
        document.getElementById('boardTheme').addEventListener('change', (e) => this.updateTheme(e));
        document.getElementById('pieceStyle').addEventListener('change', (e) => this.updatePieceStyle(e));
        
        const promotionButtons = document.querySelectorAll('.promotion-pieces button');
        promotionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePromotion(e));
        });
    }

    handleSquareClick(e) {
        if (this.isAIThinking) return;
        
        const square = e.target.closest('.square');
        if (!square) return;
        
        const displayRow = parseInt(square.dataset.row);
        const displayCol = parseInt(square.dataset.col);
        const { row, col } = this.getBoardPosition(displayRow, displayCol);
        
        if (this.selectedSquare) {
            const { row: fromRow, col: fromCol } = this.selectedSquare;
            
            if (fromRow === row && fromCol === col) {
                this.clearSelection();
                return;
            }
            
            const legalMoves = this.chessEngine.getLegalMoves(fromRow, fromCol);
            const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);
            
            if (isLegalMove) {
                this.makeMove(fromRow, fromCol, row, col);
            } else {
                this.clearSelection();
                const piece = this.chessEngine.getPiece(row, col);
                if (piece && piece.color === this.chessEngine.currentPlayer) {
                    if (this.gameMode === 'pvai' && piece.color !== this.playerColor) return;
                    this.selectSquare(row, col);
                }
            }
        } else {
            const piece = this.chessEngine.getPiece(row, col);
            if (piece && piece.color === this.chessEngine.currentPlayer) {
                if (this.gameMode === 'pvai' && piece.color !== this.playerColor) return;
                this.selectSquare(row, col);
            }
        }
    }

    handleDragStart(e) {
        if (this.isAIThinking) return;
        
        const piece = e.target.closest('.piece');
        if (!piece) return;
        
        const square = piece.parentElement;
        const displayRow = parseInt(square.dataset.row);
        const displayCol = parseInt(square.dataset.col);
        const { row, col } = this.getBoardPosition(displayRow, displayCol);
        
        const chessPiece = this.chessEngine.getPiece(row, col);
        if (chessPiece && chessPiece.color === this.chessEngine.currentPlayer) {
            if (this.gameMode === 'pvai' && chessPiece.color !== this.playerColor) {
                e.preventDefault();
                return;
            }
            
            this.draggedPiece = { row, col, element: piece };
            this.selectSquare(row, col);
            e.dataTransfer.effectAllowed = 'move';
            piece.classList.add('dragging');
        } else {
            e.preventDefault();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();
        
        if (!this.draggedPiece) return;
        
        const square = e.target.closest('.square');
        if (!square) return;
        
        const displayRow = parseInt(square.dataset.row);
        const displayCol = parseInt(square.dataset.col);
        const { row, col } = this.getBoardPosition(displayRow, displayCol);
        
        const { row: fromRow, col: fromCol } = this.draggedPiece;
        
        if (fromRow !== row || fromCol !== col) {
            const legalMoves = this.chessEngine.getLegalMoves(fromRow, fromCol);
            const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);
            
            if (isLegalMove) {
                this.makeMove(fromRow, fromCol, row, col);
            }
        }
        
        this.clearSelection();
    }

    handleDragEnd(e) {
        const piece = e.target.closest('.piece');
        if (piece) {
            piece.classList.remove('dragging');
        }
        this.draggedPiece = null;
    }

    selectSquare(row, col) {
        this.clearSelection();
        this.selectedSquare = { row, col };
        
        const displayPos = this.boardFlipped ? 
            { row: 7 - row, col: 7 - col } : 
            { row, col };
        
        const square = this.getSquareElement(displayPos.row, displayPos.col);
        if (square) {
            square.classList.add('selected');
        }
        
        const legalMoves = this.chessEngine.getLegalMoves(row, col);
        this.highlightMoves(legalMoves);
    }

    highlightMoves(moves) {
        this.clearHighlights();
        
        moves.forEach(move => {
            const displayPos = this.boardFlipped ? 
                { row: 7 - move.row, col: 7 - move.col } : 
                { row: move.row, col: move.col };
            
            const square = this.getSquareElement(displayPos.row, displayPos.col);
            if (square) {
                const targetPiece = this.chessEngine.getPiece(move.row, move.col);
                if (targetPiece) {
                    square.classList.add('capture-hint');
                } else {
                    square.classList.add('move-hint');
                }
                this.highlightedSquares.push(square);
            }
        });
    }

    clearSelection() {
        this.selectedSquare = null;
        const selected = this.boardElement.querySelector('.selected');
        if (selected) {
            selected.classList.remove('selected');
        }
        this.clearHighlights();
    }

    clearHighlights() {
        this.highlightedSquares.forEach(square => {
            square.classList.remove('move-hint', 'capture-hint');
        });
        this.highlightedSquares = [];
    }

    highlightLastMove(fromRow, fromCol, toRow, toCol) {
        this.clearLastMoveHighlight();
        
        const fromDisplay = this.boardFlipped ? 
            { row: 7 - fromRow, col: 7 - fromCol } : 
            { row: fromRow, col: fromCol };
        
        const toDisplay = this.boardFlipped ? 
            { row: 7 - toRow, col: 7 - toCol } : 
            { row: toRow, col: toCol };
        
        const fromSquare = this.getSquareElement(fromDisplay.row, fromDisplay.col);
        const toSquare = this.getSquareElement(toDisplay.row, toDisplay.col);
        
        if (fromSquare) {
            fromSquare.classList.add('last-move');
            this.lastMoveSquares.push(fromSquare);
        }
        
        if (toSquare) {
            toSquare.classList.add('last-move');
            this.lastMoveSquares.push(toSquare);
        }
    }

    clearLastMoveHighlight() {
        this.lastMoveSquares.forEach(square => {
            square.classList.remove('last-move');
        });
        this.lastMoveSquares = [];
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.chessEngine.getPiece(fromRow, fromCol);
        
        if (piece && piece.type === 'p' && (toRow === 0 || toRow === 7)) {
            this.pendingPromotion = { fromRow, fromCol, toRow, toCol };
            this.showPromotionModal(piece.color);
            return;
        }
        
        const moveSuccessful = this.chessEngine.makeMove(fromRow, fromCol, toRow, toCol);
        
        if (moveSuccessful) {
            this.clearSelection();
            this.highlightLastMove(fromRow, fromCol, toRow, toCol);
            this.renderPieces();
            this.updateDisplay();
            
            const gameStatus = this.chessEngine.getGameStatus();
            if (gameStatus.status === 'active' || gameStatus.status === 'check') {
                if (this.gameMode === 'pvai' && this.chessEngine.currentPlayer !== this.playerColor) {
                    setTimeout(() => this.makeAIMove(), 500);
                } else if (this.gameMode === 'aivai') {
                    setTimeout(() => this.makeAIMove(), 1000);
                }
            }
        }
    }

    makeAIMove() {
        if (this.isAIThinking) return;
        
        this.isAIThinking = true;
        this.updateStatus('AI is thinking...');
        
        setTimeout(() => {
            const bestMove = this.aiEngine.getBestMove();
            
            if (bestMove) {
                this.chessEngine.makeMove(
                    bestMove.from.row, 
                    bestMove.from.col, 
                    bestMove.to.row, 
                    bestMove.to.col
                );
                
                this.highlightLastMove(
                    bestMove.from.row, 
                    bestMove.from.col, 
                    bestMove.to.row, 
                    bestMove.to.col
                );
                
                this.renderPieces();
                this.updateDisplay();
                
                const gameStatus = this.chessEngine.getGameStatus();
                if (this.gameMode === 'aivai' && 
                    (gameStatus.status === 'active' || gameStatus.status === 'check')) {
                    setTimeout(() => this.makeAIMove(), 1000);
                }
            }
            
            this.isAIThinking = false;
        }, 100);
    }

    showPromotionModal(color) {
        const modal = document.getElementById('promotionModal');
        const buttons = modal.querySelectorAll('button');
        
        const pieces = color === 'white' ? 
            { q: '♕', r: '♖', b: '♗', n: '♘' } :
            { q: '♛', r: '♜', b: '♝', n: '♞' };
        
        buttons.forEach(btn => {
            const pieceType = btn.dataset.piece;
            btn.textContent = pieces[pieceType];
        });
        
        modal.style.display = 'flex';
    }

    handlePromotion(e) {
        const pieceType = e.target.dataset.piece;
        const modal = document.getElementById('promotionModal');
        modal.style.display = 'none';
        
        if (this.pendingPromotion) {
            const { fromRow, fromCol, toRow, toCol } = this.pendingPromotion;
            const piece = this.chessEngine.getPiece(fromRow, fromCol);
            
            this.chessEngine.makeMove(fromRow, fromCol, toRow, toCol);
            this.chessEngine.setPiece(toRow, toCol, { type: pieceType, color: piece.color });
            
            this.pendingPromotion = null;
            this.clearSelection();
            this.highlightLastMove(fromRow, fromCol, toRow, toCol);
            this.renderPieces();
            this.updateDisplay();
            
            if (this.gameMode === 'pvai' && this.chessEngine.currentPlayer !== this.playerColor) {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    undoMove() {
        if (this.isAIThinking) return;
        
        const undoSuccessful = this.chessEngine.undoMove();
        if (undoSuccessful) {
            if (this.gameMode === 'pvai' && this.chessEngine.currentPlayer !== this.playerColor) {
                this.chessEngine.undoMove();
            }
            
            this.clearSelection();
            this.clearLastMoveHighlight();
            this.renderPieces();
            this.updateDisplay();
        }
    }

    flipBoard() {
        this.boardFlipped = !this.boardFlipped;
        this.initializeBoard();
        this.clearSelection();
    }

    startNewGame(mode) {
        this.gameMode = mode;
        this.resetGame();
        
        if (mode === 'aivai') {
            document.getElementById('sideSelection').style.display = 'none';
            setTimeout(() => this.makeAIMove(), 500);
        } else {
            document.getElementById('sideSelection').style.display = 'block';
            if (this.playerColor === 'black') {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    selectSide(color) {
        this.playerColor = color;
        document.getElementById('playWhite').classList.toggle('active', color === 'white');
        document.getElementById('playBlack').classList.toggle('active', color === 'black');
        
        this.resetGame();
        
        if (color === 'black') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    resetGame() {
        this.chessEngine = new ChessEngine();
        this.aiEngine.chessEngine = this.chessEngine;
        this.clearSelection();
        this.clearLastMoveHighlight();
        this.renderPieces();
        this.updateDisplay();
    }

    updateDepth(e) {
        const depth = parseInt(e.target.value);
        this.aiEngine.setDepth(depth);
        document.getElementById('depthValue').textContent = depth;
    }

    updateTheme(e) {
        this.currentTheme = e.target.value;
        this.boardElement.className = `chessboard theme-${this.currentTheme}`;
    }

    updatePieceStyle(e) {
        this.currentPieceStyle = e.target.value;
        this.renderPieces();
    }

    updateDisplay() {
        this.updateMovesList();
        this.updateEvaluationBar();
        this.updateGameStatus();
    }

    updateMovesList() {
        const movesList = document.getElementById('movesList');
        const history = this.chessEngine.moveHistory;
        
        let html = '';
        for (let i = 0; i < history.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = history[i];
            const blackMove = history[i + 1] || '';
            html += `<div class="move-pair">${moveNumber}. ${whiteMove} ${blackMove}</div>`;
        }
        
        movesList.innerHTML = html;
        movesList.scrollTop = movesList.scrollHeight;
    }

    updateEvaluationBar() {
        const evaluation = this.aiEngine.evaluateCurrentPosition();
        const bar = document.getElementById('evaluationBar');
        const text = document.getElementById('evaluationText');
        
        // Smooth the percentage calculation with a gentler curve
        const smoothedEval = Math.tanh(evaluation / 10) * 10; // Smoother curve for extreme values
        const percentage = 50 + Math.max(-45, Math.min(45, smoothedEval * 4.5));
        
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
            bar.style.width = `${percentage}%`;
        });
        
        const displayEval = Math.abs(evaluation) > 99 ? 'M' : evaluation.toFixed(1);
        text.textContent = evaluation > 0 ? `+${displayEval}` : displayEval;
        
        // Add classes with smoother thresholds
        if (evaluation > 0.5) {
            bar.classList.add('white-advantage');
            bar.classList.remove('black-advantage');
        } else if (evaluation < -0.5) {
            bar.classList.add('black-advantage');
            bar.classList.remove('white-advantage');
        } else {
            bar.classList.remove('white-advantage', 'black-advantage');
        }
        
        // Add visual feedback for significant advantages
        if (Math.abs(evaluation) > 5) {
            bar.style.filter = 'brightness(1.1)';
        } else {
            bar.style.filter = '';
        }
    }

    updateGameStatus() {
        const status = this.chessEngine.getGameStatus();
        const statusElement = document.getElementById('gameStatus');
        
        switch (status.status) {
            case 'checkmate':
                this.updateStatus(`Checkmate! ${status.winner} wins!`);
                break;
            case 'stalemate':
                this.updateStatus('Stalemate! Game is a draw.');
                break;
            case 'draw':
                this.updateStatus(`Draw by ${status.reason}.`);
                break;
            case 'check':
                this.updateStatus(`${this.chessEngine.currentPlayer === 'white' ? 'White' : 'Black'} is in check!`);
                break;
            default:
                if (!this.isAIThinking) {
                    this.updateStatus(`${this.chessEngine.currentPlayer === 'white' ? 'White' : 'Black'} to move`);
                }
        }
    }

    updateStatus(message) {
        document.getElementById('gameStatus').textContent = message;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}