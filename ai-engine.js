class AIEngine {
    constructor(chessEngine, evaluator) {
        this.chessEngine = chessEngine;
        this.evaluator = evaluator;
        this.searchDepth = 3;
        this.nodesEvaluated = 0;
        this.transpositionTable = new Map();
        this.moveOrdering = true;
        this.isThinking = false;
    }

    setDepth(depth) {
        this.searchDepth = Math.max(1, Math.min(8, depth));
    }

    getBestMove(color = this.chessEngine.currentPlayer) {
        if (this.isThinking) return null;
        
        this.isThinking = true;
        this.nodesEvaluated = 0;
        this.transpositionTable.clear();
        
        const startTime = Date.now();
        const isMaximizing = color === 'white';
        
        let bestMove = null;
        let bestScore = isMaximizing ? -Infinity : Infinity;
        
        const moves = this.chessEngine.getAllLegalMoves(color);
        
        if (moves.length === 0) {
            this.isThinking = false;
            return null;
        }
        
        const orderedMoves = this.orderMoves(moves);
        
        for (const move of orderedMoves) {
            const tempBoard = this.chessEngine.cloneBoard();
            const tempCastling = JSON.parse(JSON.stringify(this.chessEngine.castlingRights));
            const tempEnPassant = this.chessEngine.enPassantTarget;
            const tempPlayer = this.chessEngine.currentPlayer;
            const tempHalfMove = this.chessEngine.halfMoveClock;
            const tempFullMove = this.chessEngine.fullMoveNumber;
            
            this.chessEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, true);
            this.chessEngine.currentPlayer = color === 'white' ? 'black' : 'white';
            
            const score = this.alphaBeta(
                this.searchDepth - 1,
                -Infinity,
                Infinity,
                !isMaximizing
            );
            
            this.chessEngine.board = tempBoard;
            this.chessEngine.castlingRights = tempCastling;
            this.chessEngine.enPassantTarget = tempEnPassant;
            this.chessEngine.currentPlayer = tempPlayer;
            this.chessEngine.halfMoveClock = tempHalfMove;
            this.chessEngine.fullMoveNumber = tempFullMove;
            
            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            
            if (Date.now() - startTime > 5000) {
                break;
            }
        }
        
        this.isThinking = false;
        
        console.log(`AI evaluated ${this.nodesEvaluated} positions in ${Date.now() - startTime}ms`);
        console.log(`Best move score: ${bestScore / 100}`);
        
        return bestMove;
    }

    alphaBeta(depth, alpha, beta, maximizingPlayer) {
        this.nodesEvaluated++;
        
        const positionKey = this.getPositionKey(depth, maximizingPlayer);
        if (this.transpositionTable.has(positionKey)) {
            const cached = this.transpositionTable.get(positionKey);
            if (cached.depth >= depth) {
                return cached.score;
            }
        }
        
        const gameStatus = this.chessEngine.getGameStatus();
        
        if (gameStatus.status === 'checkmate') {
            const score = maximizingPlayer ? -100000 - depth : 100000 + depth;
            this.transpositionTable.set(positionKey, { score, depth });
            return score;
        }
        
        if (gameStatus.status === 'stalemate' || gameStatus.status === 'draw') {
            this.transpositionTable.set(positionKey, { score: 0, depth });
            return 0;
        }
        
        if (depth === 0) {
            const score = this.quiescence(alpha, beta, maximizingPlayer, 3);
            this.transpositionTable.set(positionKey, { score, depth });
            return score;
        }
        
        const color = maximizingPlayer ? 'white' : 'black';
        const moves = this.chessEngine.getAllLegalMoves(color);
        
        if (moves.length === 0) {
            const score = this.evaluator.evaluate(this.chessEngine.board, color);
            this.transpositionTable.set(positionKey, { score, depth });
            return score;
        }
        
        const orderedMoves = this.orderMoves(moves);
        
        if (maximizingPlayer) {
            let maxEval = -Infinity;
            
            for (const move of orderedMoves) {
                const tempBoard = this.chessEngine.cloneBoard();
                const tempCastling = JSON.parse(JSON.stringify(this.chessEngine.castlingRights));
                const tempEnPassant = this.chessEngine.enPassantTarget;
                const tempPlayer = this.chessEngine.currentPlayer;
                const tempHalfMove = this.chessEngine.halfMoveClock;
                const tempFullMove = this.chessEngine.fullMoveNumber;
                
                this.chessEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, true);
                this.chessEngine.currentPlayer = 'black';
                
                const evaluation = this.alphaBeta(depth - 1, alpha, beta, false);
                
                this.chessEngine.board = tempBoard;
                this.chessEngine.castlingRights = tempCastling;
                this.chessEngine.enPassantTarget = tempEnPassant;
                this.chessEngine.currentPlayer = tempPlayer;
                this.chessEngine.halfMoveClock = tempHalfMove;
                this.chessEngine.fullMoveNumber = tempFullMove;
                
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                
                if (beta <= alpha) {
                    break;
                }
            }
            
            this.transpositionTable.set(positionKey, { score: maxEval, depth });
            return maxEval;
        } else {
            let minEval = Infinity;
            
            for (const move of orderedMoves) {
                const tempBoard = this.chessEngine.cloneBoard();
                const tempCastling = JSON.parse(JSON.stringify(this.chessEngine.castlingRights));
                const tempEnPassant = this.chessEngine.enPassantTarget;
                const tempPlayer = this.chessEngine.currentPlayer;
                const tempHalfMove = this.chessEngine.halfMoveClock;
                const tempFullMove = this.chessEngine.fullMoveNumber;
                
                this.chessEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, true);
                this.chessEngine.currentPlayer = 'white';
                
                const evaluation = this.alphaBeta(depth - 1, alpha, beta, true);
                
                this.chessEngine.board = tempBoard;
                this.chessEngine.castlingRights = tempCastling;
                this.chessEngine.enPassantTarget = tempEnPassant;
                this.chessEngine.currentPlayer = tempPlayer;
                this.chessEngine.halfMoveClock = tempHalfMove;
                this.chessEngine.fullMoveNumber = tempFullMove;
                
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                
                if (beta <= alpha) {
                    break;
                }
            }
            
            this.transpositionTable.set(positionKey, { score: minEval, depth });
            return minEval;
        }
    }

    quiescence(alpha, beta, maximizingPlayer, depth) {
        this.nodesEvaluated++;
        
        const standPat = this.evaluator.evaluate(
            this.chessEngine.board, 
            maximizingPlayer ? 'white' : 'black'
        );
        
        if (depth === 0) {
            return standPat;
        }
        
        if (maximizingPlayer) {
            if (standPat >= beta) {
                return beta;
            }
            if (alpha < standPat) {
                alpha = standPat;
            }
        } else {
            if (standPat <= alpha) {
                return alpha;
            }
            if (beta > standPat) {
                beta = standPat;
            }
        }
        
        const color = maximizingPlayer ? 'white' : 'black';
        const moves = this.chessEngine.getAllLegalMoves(color);
        const captures = moves.filter(m => m.capture !== null);
        
        if (captures.length === 0) {
            return standPat;
        }
        
        const orderedCaptures = this.orderMoves(captures);
        
        for (const move of orderedCaptures) {
            const tempBoard = this.chessEngine.cloneBoard();
            const tempCastling = JSON.parse(JSON.stringify(this.chessEngine.castlingRights));
            const tempEnPassant = this.chessEngine.enPassantTarget;
            const tempPlayer = this.chessEngine.currentPlayer;
            const tempHalfMove = this.chessEngine.halfMoveClock;
            const tempFullMove = this.chessEngine.fullMoveNumber;
            
            this.chessEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, true);
            this.chessEngine.currentPlayer = color === 'white' ? 'black' : 'white';
            
            const score = this.quiescence(alpha, beta, !maximizingPlayer, depth - 1);
            
            this.chessEngine.board = tempBoard;
            this.chessEngine.castlingRights = tempCastling;
            this.chessEngine.enPassantTarget = tempEnPassant;
            this.chessEngine.currentPlayer = tempPlayer;
            this.chessEngine.halfMoveClock = tempHalfMove;
            this.chessEngine.fullMoveNumber = tempFullMove;
            
            if (maximizingPlayer) {
                if (score >= beta) {
                    return beta;
                }
                if (score > alpha) {
                    alpha = score;
                }
            } else {
                if (score <= alpha) {
                    return alpha;
                }
                if (score < beta) {
                    beta = score;
                }
            }
        }
        
        return maximizingPlayer ? alpha : beta;
    }

    orderMoves(moves) {
        if (!this.moveOrdering) return moves;
        
        return moves.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            
            if (a.capture) {
                const captureValueA = this.getPieceValue(a.capture.type);
                const attackerValueA = this.getPieceValue(a.piece.type);
                scoreA += 10 * captureValueA - attackerValueA;
            }
            
            if (b.capture) {
                const captureValueB = this.getPieceValue(b.capture.type);
                const attackerValueB = this.getPieceValue(b.piece.type);
                scoreB += 10 * captureValueB - attackerValueB;
            }
            
            if (a.piece.type === 'p') {
                const promotionRow = a.piece.color === 'white' ? 0 : 7;
                if (a.to.row === promotionRow) scoreA += 900;
            }
            
            if (b.piece.type === 'p') {
                const promotionRow = b.piece.color === 'white' ? 0 : 7;
                if (b.to.row === promotionRow) scoreB += 900;
            }
            
            if (a.special === 'kingSide' || a.special === 'queenSide') scoreA += 50;
            if (b.special === 'kingSide' || b.special === 'queenSide') scoreB += 50;
            
            const centerSquares = [[3,3], [3,4], [4,3], [4,4]];
            if (centerSquares.some(([r, c]) => r === a.to.row && c === a.to.col)) {
                scoreA += 30;
            }
            if (centerSquares.some(([r, c]) => r === b.to.row && c === b.to.col)) {
                scoreB += 30;
            }
            
            return scoreB - scoreA;
        });
    }

    getPieceValue(pieceType) {
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
        return values[pieceType] || 0;
    }

    getPositionKey(depth, maximizingPlayer) {
        let key = this.chessEngine.getPositionKey();
        key += `-${depth}-${maximizingPlayer}`;
        return key;
    }

    evaluateCurrentPosition() {
        const color = this.chessEngine.currentPlayer;
        return this.evaluator.evaluate(this.chessEngine.board, color) / 100;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEngine;
}