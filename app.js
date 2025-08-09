let chessEngine;
let evaluator;
let aiEngine;
let uiController;

document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

function initializeApplication() {
    try {
        // Check if all required classes are available
        if (typeof ChessEngine === 'undefined') {
            throw new Error('ChessEngine class not loaded');
        }
        if (typeof Evaluator === 'undefined') {
            throw new Error('Evaluator class not loaded');
        }
        if (typeof AIEngine === 'undefined') {
            throw new Error('AIEngine class not loaded');
        }
        if (typeof UIController === 'undefined') {
            throw new Error('UIController class not loaded');
        }
        
        // Initialize chess engine
        chessEngine = new ChessEngine();
        
        // Initialize evaluator
        evaluator = new Evaluator();
        
        // Initialize AI engine with chess engine and evaluator
        aiEngine = new AIEngine(chessEngine, evaluator);
        aiEngine.setDepth(3);
        
        // Initialize UI controller
        uiController = new UIController(chessEngine, aiEngine);
        
        console.log('Chess application initialized successfully!');
        console.log('Features:');
        console.log('- Player vs AI mode');
        console.log('- AI vs AI simulation mode');
        console.log('- Adjustable AI difficulty (depth 2-6)');
        console.log('- Full FIDE chess rules implementation');
        console.log('- Board and piece customization');
        console.log('- Move history in algebraic notation');
        console.log('- Position evaluation display');
        
        window.chessApp = {
            engine: chessEngine,
            ai: aiEngine,
            ui: uiController,
            
            getFEN: () => chessEngine.getFEN(),
            
            getEvaluation: () => aiEngine.evaluateCurrentPosition(),
            
            getAllMoves: () => chessEngine.getAllLegalMoves(),
            
            setPosition: (fen) => {
                console.log('Setting position from FEN not yet implemented');
            },
            
            analyzePosition: () => {
                const evaluation = aiEngine.evaluateCurrentPosition();
                const moves = chessEngine.getAllLegalMoves();
                const status = chessEngine.getGameStatus();
                
                console.log('Position Analysis:');
                console.log(`- Evaluation: ${evaluation > 0 ? '+' : ''}${evaluation.toFixed(2)}`);
                console.log(`- Legal moves: ${moves.length}`);
                console.log(`- Game status: ${status.status}`);
                console.log(`- Current player: ${chessEngine.currentPlayer}`);
                console.log(`- FEN: ${chessEngine.getFEN()}`);
                
                return {
                    evaluation,
                    legalMoves: moves.length,
                    status: status.status,
                    currentPlayer: chessEngine.currentPlayer,
                    fen: chessEngine.getFEN()
                };
            },
            
            getBestMove: () => {
                console.log('Calculating best move...');
                const move = aiEngine.getBestMove();
                if (move) {
                    const from = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
                    const to = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
                    console.log(`Best move: ${from} to ${to}`);
                    return `${from}-${to}`;
                }
                return null;
            }
        };
        
        const helpText = `
        Welcome to Chess Arena!
        
        Controls:
        - Click or drag pieces to move
        - Use "Player vs AI" or "AI vs AI" buttons to start a game
        - Adjust AI difficulty with the depth slider
        - Customize board and piece appearance
        
        Debug commands (in console):
        - chessApp.getFEN() - Get current position
        - chessApp.getEvaluation() - Get position evaluation
        - chessApp.getAllMoves() - List all legal moves
        - chessApp.analyzePosition() - Full position analysis
        - chessApp.getBestMove() - Get AI's best move
        `;
        
        console.log(helpText);
        
    } catch (error) {
        console.error('Failed to initialize chess application:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = 'Failed to initialize the chess application. ';
        if (error.message.includes('not loaded')) {
            errorMessage += error.message + '. Please refresh the page.';
        } else {
            errorMessage += 'Error: ' + error.message;
        }
        
        showErrorMessage(errorMessage);
    }
}

function showErrorMessage(message) {
    const statusElement = document.getElementById('gameStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.background = 'rgba(231, 76, 60, 0.2)';
    }
}

window.addEventListener('resize', () => {
    if (uiController) {
        const boardContainer = document.querySelector('.chessboard-container');
        if (boardContainer) {
            const width = boardContainer.offsetWidth;
            boardContainer.style.height = width + 'px';
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (!uiController) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (e.ctrlKey) {
                uiController.undoMove();
            }
            break;
        case 'f':
            if (e.ctrlKey) {
                e.preventDefault();
                uiController.flipBoard();
            }
            break;
        case 'n':
            if (e.ctrlKey) {
                e.preventDefault();
                uiController.resetGame();
            }
            break;
        case 'Escape':
            uiController.clearSelection();
            break;
    }
});

const preventDefaultDrag = (e) => {
    if (e.target.classList.contains('piece')) {
        e.preventDefault();
    }
};

document.addEventListener('dragover', preventDefaultDrag);
document.addEventListener('drop', preventDefaultDrag);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            console.log('Service worker registration skipped - file not found');
        });
    });
}

console.log('Chess Arena - Ready to play!');