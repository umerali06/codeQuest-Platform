/**
 * CodeQuest Game Player
 * Main controller for the game player interface
 */

class GamePlayer {
    constructor() {
        this.gameEngine = null;
        this.currentGame = null;
        this.gameStats = {
            gamesPlayed: 0,
            bestScore: 0,
            totalXP: 0
        };
        
        this.init();
    }

    init() {
        this.loadGameFromStorage();
        this.setupEventListeners();
        this.loadUserProgress();
        this.loadLeaderboard();
    }

    loadGameFromStorage() {
        const gameData = localStorage.getItem('codequest_current_game');
        if (gameData) {
            try {
                this.currentGame = JSON.parse(gameData);
                this.displayGameInfo();
                this.setupGame();
            } catch (error) {
                console.error('Failed to load game data:', error);
                this.showError('Failed to load game. Please return to games page.');
            }
        } else {
            this.showError('No game selected. Please return to games page.');
        }
    }

    displayGameInfo() {
        if (!this.currentGame) return;
        
        document.getElementById('gameTitle').textContent = this.currentGame.title;
        document.getElementById('gameDescription').textContent = this.currentGame.description;
        
        // Set up instructions based on game type
        const instructions = this.getGameInstructions(this.currentGame.category);
        document.getElementById('instructionsContent').innerHTML = instructions;
    }

    getGameInstructions(category) {
        const instructions = {
            'speed': `
                <h4>⚡ Speed Coding Challenge</h4>
                <p>Code blocks are falling from the top of the screen. Click on them to collect points!</p>
                <ul>
                    <li>Click falling code blocks to score points</li>
                    <li>Avoid letting them fall off the screen</li>
                    <li>Complete the challenge before time runs out</li>
                    <li>Each block is worth 10 points</li>
                </ul>
            `,
            'bugfix': `
                <h4>🐛 Bug Hunter</h4>
                <p>Find and identify bugs in the code snippets below.</p>
                <ul>
                    <li>Click on each code block to mark it as fixed</li>
                    <li>Each fixed bug is worth 25 points</li>
                    <li>Fix all bugs before time runs out</li>
                    <li>Look for syntax errors, logic mistakes, and best practice violations</li>
                </ul>
            `,
            'memory': `
                <h4>🧠 Code Memory</h4>
                <p>Test your memory by matching code symbols and patterns.</p>
                <ul>
                    <li>Click cards to flip them and reveal symbols</li>
                    <li>Find matching pairs to score points</li>
                    <li>Each match is worth 50 points</li>
                    <li>Complete all matches before time runs out</li>
                </ul>
            `,
            'puzzle': `
                <h4>🧩 Code Puzzle</h4>
                <p>Solve the sliding puzzle by arranging the tiles in order.</p>
                <ul>
                    <li>Click tiles adjacent to the empty space to move them</li>
                    <li>Arrange numbers 1-8 in order with empty space at bottom-right</li>
                    <li>Each move is worth 5 points</li>
                    <li>Complete the puzzle for a 100-point bonus</li>
                </ul>
            `,
            'algorithm': `
                <h4>📊 Algorithm Race</h4>
                <p>Solve algorithm challenges by writing efficient code.</p>
                <ul>
                    <li>Read the problem statement carefully</li>
                    <li>Write your solution in the code editor</li>
                    <li>Test your code with the provided test cases</li>
                    <li>Optimize for both correctness and efficiency</li>
                </ul>
            `
        };
        
        return instructions[category] || instructions['speed'];
    }

    setupGame() {
        if (!this.currentGame) return;
        
        // Initialize game engine based on game type
        if (this.currentGame.category === 'algorithm') {
            this.setupCodeEditor();
        } else {
            this.setupCanvasGame();
        }
    }

    setupCanvasGame() {
        // Show canvas container
        document.getElementById('gameCanvasContainer').style.display = 'block';
        document.getElementById('codeEditorContainer').style.display = 'none';
        
        // Initialize game engine
        this.gameEngine = new GameEngine();
        if (this.gameEngine.init('gameCanvas', this.currentGame.category, this.currentGame)) {
            console.log('Game engine initialized successfully');
        } else {
            console.error('Failed to initialize game engine');
        }
    }

    setupCodeEditor() {
        // Show code editor container
        document.getElementById('gameCanvasContainer').style.display = 'none';
        document.getElementById('codeEditorContainer').style.display = 'block';
        
        // Set up editor tabs
        this.setupEditorTabs();
        
        // Set up initial code templates
        this.setupCodeTemplates();
    }

    setupEditorTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetTab + 'Tab') {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    setupCodeTemplates() {
        const templates = this.getCodeTemplates(this.currentGame.category);
        
        document.getElementById('htmlEditor').value = templates.html;
        document.getElementById('cssEditor').value = templates.css;
        document.getElementById('jsEditor').value = templates.js;
    }

    getCodeTemplates(category) {
        const templates = {
            'algorithm': {
                html: `<!DOCTYPE html>
<html>
<head>
    <title>Algorithm Challenge</title>
</head>
<body>
    <div id="output"></div>
    <script src="script.js"></script>
</body>
</html>`,
                css: `body {
    font-family: Arial, sans-serif;
    padding: 20px;
    background: #f0f0f0;
}

#output {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}`,
                js: `// Your algorithm solution here
function solveChallenge() {
    // Example: Sort array [3, 1, 4, 1, 5, 9, 2, 6]
    const arr = [3, 1, 4, 1, 5, 9, 2, 6];
    
    // Your sorting algorithm here
    const sorted = arr.sort((a, b) => a - b);
    
    // Display result
    document.getElementById('output').innerHTML = \`
        <h3>Original Array: [\${arr.join(', ')}]</h3>
        <h3>Sorted Array: [\${sorted.join(', ')}]</h3>
    \`;
}

// Run the solution
solveChallenge();`
            }
        };
        
        return templates[category] || templates['algorithm'];
    }

    setupEventListeners() {
        // Start game button
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Run code button
        document.getElementById('runCodeBtn').addEventListener('click', () => {
            this.runCode();
        });
        
        // Reset code button
        document.getElementById('resetCodeBtn').addEventListener('click', () => {
            this.resetCode();
        });
        
        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.playAgain();
        });
        
        // Back to games button
        document.getElementById('backToGamesBtn').addEventListener('click', () => {
            this.backToGames();
        });
        
        // Game over event listener
        document.addEventListener('gameOver', (e) => {
            this.handleGameOver(e.detail);
        });
    }

    startGame() {
        if (this.currentGame.category === 'algorithm') {
            this.startCodeEditorGame();
        } else {
            this.startCanvasGame();
        }
        
        // Hide instructions
        document.getElementById('gameInstructions').style.display = 'none';
    }

    startCanvasGame() {
        if (this.gameEngine) {
            this.gameEngine.start();
            this.startGameTimer();
        }
    }

    startCodeEditorGame() {
        // For code editor games, start the timer
        this.startGameTimer();
        this.runCode(); // Auto-run the code
    }

    startGameTimer() {
        const startTime = Date.now();
        const timeLimit = this.currentGame.time_limit || 300;
        
        const timer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, timeLimit - elapsed);
            
            this.updateTimer(remaining);
            
            if (remaining <= 0) {
                clearInterval(timer);
                this.gameOver();
            }
        }, 100);
    }

    updateTimer(timeRemaining) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = Math.floor(timeRemaining % 60);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timeRemaining').textContent = timeText;
    }

    togglePause() {
        if (this.gameEngine) {
            if (this.gameEngine.isPaused) {
                this.gameEngine.resume();
                document.getElementById('pauseBtn').textContent = 'Pause';
            } else {
                this.gameEngine.pause();
                document.getElementById('pauseBtn').textContent = 'Resume';
            }
        }
    }

    restartGame() {
        if (this.gameEngine) {
            this.gameEngine.stop();
            this.setupCanvasGame();
            this.gameEngine.start();
        }
    }

    runCode() {
        const html = document.getElementById('htmlEditor').value;
        const css = document.getElementById('cssEditor').value;
        const js = document.getElementById('jsEditor').value;
        
        const iframe = document.getElementById('codePreview');
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        
        doc.open();
        doc.write(html);
        doc.write('<style>' + css + '</style>');
        doc.write('<script>' + js + '<\/script>');
        doc.close();
        
        // Check if code meets requirements
        this.checkCodeRequirements();
    }

    resetCode() {
        this.setupCodeTemplates();
        document.getElementById('codePreview').src = 'about:blank';
    }

    checkCodeRequirements() {
        // This would check if the code meets the game's requirements
        // For now, just give some points for running code
        this.addScore(10);
    }

    addScore(points) {
        const currentScore = parseInt(document.getElementById('currentScore').textContent) || 0;
        const newScore = currentScore + points;
        document.getElementById('currentScore').textContent = newScore;
        
        // Update best score if needed
        if (newScore > this.gameStats.bestScore) {
            this.gameStats.bestScore = newScore;
            document.getElementById('bestScore').textContent = newScore;
        }
    }

    gameOver() {
        const finalScore = parseInt(document.getElementById('currentScore').textContent) || 0;
        const timeTaken = this.currentGame.time_limit - (parseInt(document.getElementById('timeRemaining').textContent.split(':')[0]) * 60 + parseInt(document.getElementById('timeRemaining').textContent.split(':')[1]));
        
        this.showGameResults(finalScore, timeTaken);
    }

    handleGameOver(gameData) {
        this.showGameResults(gameData.score, gameData.timeTaken, gameData.accuracy);
    }

    showGameResults(score, timeTaken, accuracy = 100) {
        // Hide game area
        document.getElementById('gameCanvasContainer').style.display = 'none';
        document.getElementById('codeEditorContainer').style.display = 'none';
        
        // Show results
        document.getElementById('gameResults').style.display = 'block';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('timeTaken').textContent = this.formatTime(timeTaken);
        document.getElementById('accuracy').textContent = accuracy.toFixed(1) + '%';
        
        // Update user progress
        this.updateUserProgress(score);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateUserProgress(score) {
        this.gameStats.gamesPlayed++;
        this.gameStats.totalXP += Math.floor(score / 10);
        
        // Save to localStorage
        localStorage.setItem('codequest_game_stats', JSON.stringify(this.gameStats));
        
        // Update display
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        document.getElementById('gamesPlayed').textContent = this.gameStats.gamesPlayed;
        document.getElementById('bestScore').textContent = this.gameStats.bestScore;
        document.getElementById('totalXP').textContent = this.gameStats.totalXP;
    }

    playAgain() {
        // Reset game
        document.getElementById('gameResults').style.display = 'none';
        document.getElementById('gameInstructions').style.display = 'block';
        document.getElementById('currentScore').textContent = '0';
        
        if (this.currentGame.category === 'algorithm') {
            this.setupCodeEditor();
        } else {
            this.setupCanvasGame();
        }
    }

    backToGames() {
        window.location.href = 'games.html';
    }

    loadUserProgress() {
        const savedStats = localStorage.getItem('codequest_game_stats');
        if (savedStats) {
            try {
                this.gameStats = JSON.parse(savedStats);
                this.updateProgressDisplay();
            } catch (error) {
                console.error('Failed to load user progress:', error);
            }
        }
    }

    loadLeaderboard() {
        // This would load from API in a real implementation
        const leaderboardData = [
            { rank: 1, name: 'CodeMaster', score: 1250 },
            { rank: 2, name: 'BugHunter', score: 1100 },
            { rank: 3, name: 'AlgorithmPro', score: 950 },
            { rank: 4, name: 'WebDev', score: 800 },
            { rank: 5, name: 'Coder123', score: 750 }
        ];
        
        this.displayLeaderboard(leaderboardData);
    }

    displayLeaderboard(data) {
        const leaderboardList = document.getElementById('leaderboardList');
        
        if (data.length === 0) {
            leaderboardList.innerHTML = '<div class="no-data">No leaderboard data available</div>';
            return;
        }
        
        const leaderboardHTML = data.map(item => `
            <div class="leaderboard-item">
                <span class="leaderboard-rank">#${item.rank}</span>
                <span class="leaderboard-name">${item.name}</span>
                <span class="leaderboard-score">${item.score}</span>
            </div>
        `).join('');
        
        leaderboardList.innerHTML = leaderboardHTML;
    }

    showError(message) {
        const gameArea = document.querySelector('.game-area');
        gameArea.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.href='games.html'">Back to Games</button>
            </div>
        `;
    }
}

// Initialize game player when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.gamePlayer = new GamePlayer();
});
