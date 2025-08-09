const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

const PIECE_SQUARE_TABLES = {
    p: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [ 5,  5, 10, 25, 25, 10,  5,  5],
        [ 0,  0,  0, 20, 20,  0,  0,  0],
        [ 5, -5,-10,  0,  0,-10, -5,  5],
        [ 5, 10, 10,-20,-20, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [ 0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
    ],
    k_endgame: [
        [-50,-40,-30,-20,-20,-30,-40,-50],
        [-30,-20,-10,  0,  0,-10,-20,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-30,  0,  0,  0,  0,-30,-30],
        [-50,-30,-30,-30,-30,-30,-30,-50]
    ]
};

class Evaluator {
    constructor() {
        this.pieceValues = PIECE_VALUES;
        this.pieceSquareTables = PIECE_SQUARE_TABLES;
    }

    evaluate(board, color) {
        let score = 0;
        let whiteQueens = 0;
        let blackQueens = 0;
        let whitePieces = 0;
        let blackPieces = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece) continue;

                const value = this.pieceValues[piece.type];
                const isWhite = piece.color === 'white';
                
                if (piece.type === 'q') {
                    if (isWhite) whiteQueens++;
                    else blackQueens++;
                }
                
                if (piece.type !== 'k') {
                    if (isWhite) whitePieces++;
                    else blackPieces++;
                }

                const table = this.getPieceSquareTable(piece.type, whitePieces + blackPieces < 10);
                const tableRow = isWhite ? row : 7 - row;
                const psValue = table[tableRow][col];

                if (isWhite) {
                    score += value + psValue;
                } else {
                    score -= value + psValue;
                }
            }
        }

        const mobilityBonus = this.evaluateMobility(board);
        score += mobilityBonus;

        const pawnStructureBonus = this.evaluatePawnStructure(board);
        score += pawnStructureBonus;

        return color === 'white' ? score : -score;
    }

    getPieceSquareTable(pieceType, isEndgame) {
        if (pieceType === 'k' && isEndgame) {
            return this.pieceSquareTables.k_endgame;
        }
        return this.pieceSquareTables[pieceType] || [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
    }

    evaluateMobility(board) {
        let whiteMobility = 0;
        let blackMobility = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece || piece.type === 'p' || piece.type === 'k') continue;

                const moves = this.countPseudoLegalMoves(board, row, col, piece);
                if (piece.color === 'white') {
                    whiteMobility += moves * 10;
                } else {
                    blackMobility += moves * 10;
                }
            }
        }

        return whiteMobility - blackMobility;
    }

    countPseudoLegalMoves(board, row, col, piece) {
        let count = 0;
        
        switch(piece.type) {
            case 'n':
                const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
                for (const [dr, dc] of knightMoves) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = board[newRow][newCol];
                        if (!target || target.color !== piece.color) count++;
                    }
                }
                break;
            case 'b':
                count += this.countSlidingMoves(board, row, col, piece, [[-1,-1],[-1,1],[1,-1],[1,1]]);
                break;
            case 'r':
                count += this.countSlidingMoves(board, row, col, piece, [[-1,0],[1,0],[0,-1],[0,1]]);
                break;
            case 'q':
                count += this.countSlidingMoves(board, row, col, piece, [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);
                break;
        }
        
        return count;
    }

    countSlidingMoves(board, row, col, piece, directions) {
        let count = 0;
        
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];
                if (!target) {
                    count++;
                } else {
                    if (target.color !== piece.color) count++;
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
        
        return count;
    }

    evaluatePawnStructure(board) {
        let score = 0;
        const whitePawns = [];
        const blackPawns = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === 'p') {
                    if (piece.color === 'white') {
                        whitePawns.push({row, col});
                    } else {
                        blackPawns.push({row, col});
                    }
                }
            }
        }

        for (const pawn of whitePawns) {
            if (whitePawns.some(p => p.col === pawn.col && p.row < pawn.row)) {
                score -= 50;
            }
            
            if (!blackPawns.some(p => Math.abs(p.col - pawn.col) === 1 && p.row < pawn.row)) {
                score += 20;
            }
            
            if (!whitePawns.some(p => Math.abs(p.col - pawn.col) === 1 && Math.abs(p.row - pawn.row) === 1)) {
                score -= 20;
            }
        }

        for (const pawn of blackPawns) {
            if (blackPawns.some(p => p.col === pawn.col && p.row > pawn.row)) {
                score += 50;
            }
            
            if (!whitePawns.some(p => Math.abs(p.col - pawn.col) === 1 && p.row > pawn.row)) {
                score -= 20;
            }
            
            if (!blackPawns.some(p => Math.abs(p.col - pawn.col) === 1 && Math.abs(p.row - pawn.row) === 1)) {
                score += 20;
            }
        }

        return score;
    }

    evaluatePosition(board, depth, alpha, beta, maximizingPlayer, engine) {
        const gameStatus = engine.getGameStatus();
        
        if (gameStatus.status === 'checkmate') {
            return maximizingPlayer ? -100000 - depth : 100000 + depth;
        }
        
        if (gameStatus.status === 'stalemate' || gameStatus.status === 'draw') {
            return 0;
        }
        
        if (depth === 0) {
            return this.evaluate(board, maximizingPlayer ? 'white' : 'black');
        }
        
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Evaluator;
}