class ChessEngine {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.positionHistory = [];
        this.initializeBoard();
    }

    initializeBoard() {
        const pieceOrder = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        
        this.board = [
            pieceOrder.map(p => ({ type: p, color: 'black' })),
            Array(8).fill(null).map(() => ({ type: 'p', color: 'black' })),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null).map(() => ({ type: 'p', color: 'white' })),
            pieceOrder.map(p => ({ type: p, color: 'white' }))
        ];
    }

    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    setPiece(row, col, piece) {
        this.board[row][col] = piece;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isSquareAttacked(row, col, byColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === byColor) {
                    const moves = this.getPieceMoves(r, c, true);
                    if (moves.some(m => m.row === row && m.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === 'k' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        return this.isSquareAttacked(kingPos.row, kingPos.col, color === 'white' ? 'black' : 'white');
    }

    getPawnMoves(row, col, piece, attacksOnly = false) {
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        if (!attacksOnly) {
            const oneStep = this.getPiece(row + direction, col);
            if (!oneStep) {
                moves.push({ row: row + direction, col });

                if (row === startRow) {
                    const twoStep = this.getPiece(row + 2 * direction, col);
                    if (!twoStep) {
                        moves.push({ row: row + 2 * direction, col });
                    }
                }
            }
        }

        const captureLeft = this.getPiece(row + direction, col - 1);
        if ((attacksOnly || (captureLeft && captureLeft.color !== piece.color)) && this.isValidPosition(row + direction, col - 1)) {
            moves.push({ row: row + direction, col: col - 1 });
        }

        const captureRight = this.getPiece(row + direction, col + 1);
        if ((attacksOnly || (captureRight && captureRight.color !== piece.color)) && this.isValidPosition(row + direction, col + 1)) {
            moves.push({ row: row + direction, col: col + 1 });
        }

        if (this.enPassantTarget) {
            const epRow = piece.color === 'white' ? 3 : 4;
            if (row === epRow) {
                if (this.enPassantTarget.col === col - 1 || this.enPassantTarget.col === col + 1) {
                    moves.push({
                        row: row + direction,
                        col: this.enPassantTarget.col,
                        enPassant: true
                    });
                }
            }
        }

        return moves;
    }

    getKnightMoves(row, col, piece, attacksOnly = false) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dr, dc] of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getSlidingMoves(row, col, piece, directions) {
        const moves = [];

        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;

            while (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }

        return moves;
    }

    getBishopMoves(row, col, piece, attacksOnly = false) {
        return this.getSlidingMoves(row, col, piece, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }

    getRookMoves(row, col, piece, attacksOnly = false) {
        return this.getSlidingMoves(row, col, piece, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }

    getQueenMoves(row, col, piece, attacksOnly = false) {
        return [
            ...this.getBishopMoves(row, col, piece),
            ...this.getRookMoves(row, col, piece)
        ];
    }

    getKingMoves(row, col, piece, attacksOnly = false) {
        const moves = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dr, dc] of kingMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        // Skip castling check when we're only checking for attacks
        if (!attacksOnly && !this.isInCheck(piece.color)) {
            const rights = this.castlingRights[piece.color];
            const baseRow = piece.color === 'white' ? 7 : 0;

            if (rights.kingSide && row === baseRow && col === 4) {
                if (!this.getPiece(baseRow, 5) && !this.getPiece(baseRow, 6) &&
                    this.getPiece(baseRow, 7)?.type === 'r') {
                    if (!this.isSquareAttacked(baseRow, 5, piece.color === 'white' ? 'black' : 'white') &&
                        !this.isSquareAttacked(baseRow, 6, piece.color === 'white' ? 'black' : 'white')) {
                        moves.push({ row: baseRow, col: 6, castle: 'kingSide' });
                    }
                }
            }

            if (rights.queenSide && row === baseRow && col === 4) {
                if (!this.getPiece(baseRow, 3) && !this.getPiece(baseRow, 2) && !this.getPiece(baseRow, 1) &&
                    this.getPiece(baseRow, 0)?.type === 'r') {
                    if (!this.isSquareAttacked(baseRow, 3, piece.color === 'white' ? 'black' : 'white') &&
                        !this.isSquareAttacked(baseRow, 2, piece.color === 'white' ? 'black' : 'white')) {
                        moves.push({ row: baseRow, col: 2, castle: 'queenSide' });
                    }
                }
            }
        }

        return moves;
    }

    getPieceMoves(row, col, attacksOnly = false) {
        const piece = this.getPiece(row, col);
        if (!piece) return [];

        switch (piece.type) {
            case 'p': return this.getPawnMoves(row, col, piece, attacksOnly);
            case 'n': return this.getKnightMoves(row, col, piece, attacksOnly);
            case 'b': return this.getBishopMoves(row, col, piece, attacksOnly);
            case 'r': return this.getRookMoves(row, col, piece, attacksOnly);
            case 'q': return this.getQueenMoves(row, col, piece, attacksOnly);
            case 'k': return this.getKingMoves(row, col, piece, attacksOnly);
            default: return [];
        }
    }

    getLegalMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentPlayer) return [];

        const pseudoLegalMoves = this.getPieceMoves(row, col);
        const legalMoves = [];

        for (const move of pseudoLegalMoves) {
            const tempBoard = this.cloneBoard();
            const tempCastling = JSON.parse(JSON.stringify(this.castlingRights));
            const tempEnPassant = this.enPassantTarget;

            this.makeMove(row, col, move.row, move.col, true);

            if (!this.isInCheck(piece.color)) {
                legalMoves.push(move);
            }

            this.board = tempBoard;
            this.castlingRights = tempCastling;
            this.enPassantTarget = tempEnPassant;
        }

        return legalMoves;
    }

    getAllLegalMoves(color = this.currentPlayer) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const pieceMoves = this.getLegalMoves(row, col);
                    for (const move of pieceMoves) {
                        moves.push({
                            from: { row, col },
                            to: { row: move.row, col: move.col },
                            piece: piece,
                            capture: this.getPiece(move.row, move.col),
                            special: move.castle || move.enPassant || null
                        });
                    }
                }
            }
        }
        return moves;
    }

    makeMove(fromRow, fromCol, toRow, toCol, isSimulation = false) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        const targetPiece = this.getPiece(toRow, toCol);
        const moves = this.getPieceMoves(fromRow, fromCol);
        const move = moves.find(m => m.row === toRow && m.col === toCol);

        if (!isSimulation) {
            const legalMoves = this.getLegalMoves(fromRow, fromCol);
            if (!legalMoves.some(m => m.row === toRow && m.col === toCol)) {
                return false;
            }
        }

        this.halfMoveClock++;
        if (piece.type === 'p' || targetPiece) {
            this.halfMoveClock = 0;
        }

        if (targetPiece && !isSimulation) {
            this.capturedPieces[targetPiece.color].push(targetPiece);
        }

        if (move?.castle) {
            const baseRow = piece.color === 'white' ? 7 : 0;
            if (move.castle === 'kingSide') {
                this.setPiece(baseRow, 6, piece);
                this.setPiece(baseRow, 5, this.getPiece(baseRow, 7));
                this.setPiece(baseRow, 4, null);
                this.setPiece(baseRow, 7, null);
            } else {
                this.setPiece(baseRow, 2, piece);
                this.setPiece(baseRow, 3, this.getPiece(baseRow, 0));
                this.setPiece(baseRow, 4, null);
                this.setPiece(baseRow, 0, null);
            }
        } else if (move?.enPassant) {
            const captureRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            this.setPiece(captureRow, toCol, null);
            this.setPiece(toRow, toCol, piece);
            this.setPiece(fromRow, fromCol, null);
        } else {
            this.setPiece(toRow, toCol, piece);
            this.setPiece(fromRow, fromCol, null);
        }

        if (piece.type === 'k') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        }

        if (piece.type === 'r') {
            if (fromRow === (piece.color === 'white' ? 7 : 0)) {
                if (fromCol === 0) this.castlingRights[piece.color].queenSide = false;
                if (fromCol === 7) this.castlingRights[piece.color].kingSide = false;
            }
        }

        this.enPassantTarget = null;
        if (piece.type === 'p' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
        }

        if (piece.type === 'p' && (toRow === 0 || toRow === 7)) {
            this.setPiece(toRow, toCol, { type: 'q', color: piece.color });
        }

        if (!isSimulation) {
            const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, targetPiece, move);
            this.moveHistory.push(moveNotation);

            if (this.currentPlayer === 'black') {
                this.fullMoveNumber++;
            }

            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

            const positionKey = this.getPositionKey();
            this.positionHistory.push(positionKey);
        }

        return true;
    }

    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured, move) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        let notation = '';

        if (move?.castle) {
            return move.castle === 'kingSide' ? 'O-O' : 'O-O-O';
        }

        if (piece.type !== 'p') {
            notation += piece.type.toUpperCase();
        }

        const samePieceMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.getPiece(r, c);
                if (p && p.type === piece.type && p.color === piece.color && 
                    !(r === fromRow && c === fromCol)) {
                    const moves = this.getLegalMoves(r, c);
                    if (moves.some(m => m.row === toRow && m.col === toCol)) {
                        samePieceMoves.push({ row: r, col: c });
                    }
                }
            }
        }

        if (samePieceMoves.length > 0) {
            const sameFile = samePieceMoves.some(m => m.col === fromCol);
            const sameRank = samePieceMoves.some(m => m.row === fromRow);
            
            if (!sameFile || (sameFile && sameRank)) {
                notation += files[fromCol];
            }
            if (sameFile) {
                notation += ranks[fromRow];
            }
        } else if (piece.type === 'p' && captured) {
            notation += files[fromCol];
        }

        if (captured) {
            notation += 'x';
        }

        notation += files[toCol] + ranks[toRow];

        if (piece.type === 'p' && (toRow === 0 || toRow === 7)) {
            notation += '=Q';
        }

        const tempBoard = this.cloneBoard();
        const tempCastling = JSON.parse(JSON.stringify(this.castlingRights));
        const tempEnPassant = this.enPassantTarget;
        const tempPlayer = this.currentPlayer;

        this.currentPlayer = piece.color === 'white' ? 'black' : 'white';
        
        if (this.isInCheckmate()) {
            notation += '#';
        } else if (this.isInCheck(this.currentPlayer)) {
            notation += '+';
        }

        this.board = tempBoard;
        this.castlingRights = tempCastling;
        this.enPassantTarget = tempEnPassant;
        this.currentPlayer = tempPlayer;

        return notation;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return false;
        
        this.initializeBoard();
        this.currentPlayer = 'white';
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        
        const tempHistory = [...this.moveHistory];
        this.moveHistory = [];
        this.positionHistory = [];
        
        for (let i = 0; i < tempHistory.length - 1; i++) {
            const allMoves = this.getAllLegalMoves();
            let moveApplied = false;
            
            for (const move of allMoves) {
                const notation = this.getMoveNotation(
                    move.piece,
                    move.from.row,
                    move.from.col,
                    move.to.row,
                    move.to.col,
                    move.capture,
                    { castle: move.special }
                );
                
                if (notation === tempHistory[i]) {
                    this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
                    moveApplied = true;
                    break;
                }
            }
        }
        
        return true;
    }

    isInCheckmate() {
        if (!this.isInCheck(this.currentPlayer)) return false;
        return this.getAllLegalMoves().length === 0;
    }

    isInStalemate() {
        if (this.isInCheck(this.currentPlayer)) return false;
        return this.getAllLegalMoves().length === 0;
    }

    isDraw() {
        if (this.isInStalemate()) return true;
        
        if (this.halfMoveClock >= 100) return true;
        
        const positionCounts = {};
        for (const pos of this.positionHistory) {
            positionCounts[pos] = (positionCounts[pos] || 0) + 1;
            if (positionCounts[pos] >= 3) return true;
        }
        
        const pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece) pieces.push(piece);
            }
        }
        
        if (pieces.length === 2) return true;
        if (pieces.length === 3) {
            const hasKnight = pieces.some(p => p.type === 'n');
            const hasBishop = pieces.some(p => p.type === 'b');
            if (hasKnight || hasBishop) return true;
        }
        
        return false;
    }

    getGameStatus() {
        if (this.isInCheckmate()) {
            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
            return { status: 'checkmate', winner };
        }
        if (this.isDraw()) {
            if (this.isInStalemate()) return { status: 'stalemate' };
            if (this.halfMoveClock >= 100) return { status: 'draw', reason: '50-move rule' };
            return { status: 'draw', reason: 'threefold repetition' };
        }
        if (this.isInCheck(this.currentPlayer)) {
            return { status: 'check' };
        }
        return { status: 'active' };
    }

    cloneBoard() {
        return this.board.map(row => row.map(piece => piece ? { ...piece } : null));
    }

    getPositionKey() {
        let key = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                key += piece ? `${piece.color[0]}${piece.type}` : '--';
            }
        }
        key += this.currentPlayer[0];
        key += this.castlingRights.white.kingSide ? 'K' : '';
        key += this.castlingRights.white.queenSide ? 'Q' : '';
        key += this.castlingRights.black.kingSide ? 'k' : '';
        key += this.castlingRights.black.queenSide ? 'q' : '';
        key += this.enPassantTarget ? `${this.enPassantTarget.row}${this.enPassantTarget.col}` : '-';
        return key;
    }

    getFEN() {
        let fen = '';
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    const pieceChar = piece.color === 'white' ? 
                        piece.type.toUpperCase() : piece.type.toLowerCase();
                    fen += pieceChar;
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            if (row < 7) fen += '/';
        }
        
        fen += ' ' + this.currentPlayer[0];
        
        let castling = '';
        if (this.castlingRights.white.kingSide) castling += 'K';
        if (this.castlingRights.white.queenSide) castling += 'Q';
        if (this.castlingRights.black.kingSide) castling += 'k';
        if (this.castlingRights.black.queenSide) castling += 'q';
        fen += ' ' + (castling || '-');
        
        if (this.enPassantTarget) {
            const files = 'abcdefgh';
            const ranks = '87654321';
            fen += ' ' + files[this.enPassantTarget.col] + ranks[this.enPassantTarget.row];
        } else {
            fen += ' -';
        }
        
        fen += ' ' + this.halfMoveClock;
        fen += ' ' + this.fullMoveNumber;
        
        return fen;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
}