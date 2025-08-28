/**
 * CodeQuest Game Engine - Simplified Version
 * Powers the different types of coding games
 */

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.gameType = null;
        this.gameData = {};
        
        // Game entities
        this.entities = [];
        this.targets = [];
        this.particles = [];
        
        // Game state
        this.startTime = 0;
        this.timeRemaining = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 0;
    }

    // Initialize the game engine
    init(canvasId, gameType, gameData) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.gameType = gameType;
        this.gameData = gameData;
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Initialize game based on type
        this.initGame();
        
        // Set up input handlers
        this.setupInputHandlers();
        
        return true;
    }

    // Initialize specific game
    initGame() {
        switch (this.gameType) {
            case 'speed':
                this.initSpeedGame();
                break;
            case 'bugfix':
                this.initBugFixGame();
                break;
            case 'memory':
                this.initMemoryGame();
                break;
            case 'puzzle':
                this.initPuzzleGame();
                break;
            default:
                console.error('Unknown game type:', this.gameType);
        }
    }

    // Speed Coding Game
    initSpeedGame() {
        this.timeRemaining = this.gameData.time_limit || 300;
        this.startTime = Date.now();
        this.totalQuestions = 10;
        
        // Create target code blocks
        this.createTargetCodeBlocks();
        
        // Start spawning falling code blocks
        this.spawnCodeBlocks();
    }

    // Bug Fix Game
    initBugFixGame() {
        this.timeRemaining = this.gameData.time_limit || 600;
        this.startTime = Date.now();
        this.totalQuestions = 4;
        
        // Create buggy code blocks
        this.createBuggyCodeBlocks();
    }

    // Memory Game
    initMemoryGame() {
        this.timeRemaining = this.gameData.time_limit || 180;
        this.startTime = Date.now();
        this.totalQuestions = 8;
        
        // Create memory cards
        this.createMemoryCards();
    }

    // Puzzle Game
    initPuzzleGame() {
        this.timeRemaining = this.gameData.time_limit || 900;
        this.startTime = Date.now();
        this.totalQuestions = 1;
        
        // Create sliding puzzle
        this.createSlidingPuzzle();
    }

    // Create target code blocks for speed game
    createTargetCodeBlocks() {
        const codeTypes = ['function', 'variable', 'conditional', 'loop', 'class'];
        this.targets = codeTypes.map((type, index) => ({
            id: index,
            type: type,
            x: 50 + (index % 2) * 350,
            y: 50 + Math.floor(index / 2) * 100,
            width: 320,
            height: 80,
            color: this.getTypeColor(type),
            text: this.getTypeText(type)
        }));
    }

    // Create buggy code blocks
    createBuggyCodeBlocks() {
        const buggyCode = [
            { code: 'function add(a, b) { return a - b; }', bug: 'Should be +', fixed: false },
            { code: 'const name = "John"; name = "Jane";', bug: 'Cannot reassign const', fixed: false },
            { code: 'if (x = 5) { }', bug: 'Should be == or ===', fixed: false },
            { code: 'for (let i = 0; i < 10; i++) { console.log(i); }', bug: 'Missing semicolon', fixed: false }
        ];
        
        this.targets = buggyCode.map((item, index) => ({
            id: index,
            code: item.code,
            bug: item.bug,
            fixed: item.fixed,
            x: 50 + (index % 2) * 350,
            y: 50 + Math.floor(index / 2) * 120,
            width: 320,
            height: 100
        }));
    }

    // Create memory cards
    createMemoryCards() {
        const symbols = ['⚡', '🐛', '🧠', '🧩'];
        const cards = [];
        
        // Create pairs
        symbols.forEach((symbol, index) => {
            cards.push({ id: index * 2, symbol: symbol, x: 0, y: 0, isFlipped: false, isMatched: false });
            cards.push({ id: index * 2 + 1, symbol: symbol, x: 0, y: 0, isFlipped: false, isMatched: false });
        });
        
        // Shuffle and position
        this.shuffleArray(cards);
        cards.forEach((card, index) => {
            card.x = 100 + (index % 4) * 150;
            card.y = 100 + Math.floor(index / 4) * 120;
            card.width = 120;
            card.height = 100;
        });
        
        this.targets = cards;
    }

    // Create sliding puzzle
    createSlidingPuzzle() {
        const tiles = [];
        let tileNumber = 1;
        
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                if (x === 2 && y === 2) {
                    tiles.push({ id: 8, number: '', x: x, y: y, isEmpty: true });
                } else {
                    tiles.push({ id: tileNumber, number: tileNumber, x: x, y: y, isEmpty: false });
                }
                tileNumber++;
            }
        }
        
        // Shuffle tiles
        this.shuffleArray(tiles);
        
        this.targets = tiles.map(tile => ({
            ...tile,
            displayX: 250 + tile.x * 100,
            displayY: 150 + tile.y * 100,
            width: 90,
            height: 90
        }));
    }

    // Get color for code type
    getTypeColor(type) {
        const colors = {
            function: '#4CAF50',
            variable: '#2196F3',
            conditional: '#FF9800',
            loop: '#9C27B0',
            class: '#E91E63'
        };
        return colors[type] || '#666';
    }

    // Get text for code type
    getTypeText(type) {
        const texts = {
            function: 'function add(a, b) { return a + b; }',
            variable: 'const name = "John";',
            conditional: 'if (condition) { }',
            loop: 'for (let i = 0; i < 10; i++) { }',
            class: 'class MyClass { }'
        };
        return texts[type] || 'Code block';
    }

    // Shuffle array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Spawn code blocks for speed game
    spawnCodeBlocks() {
        if (this.gameType === 'speed' && this.isRunning) {
            const codeBlock = {
                id: Date.now(),
                code: this.getRandomCodeSnippet(),
                x: Math.random() * (this.canvas.width - 100),
                y: -50,
                width: 100,
                height: 30,
                speed: 2 + Math.random() * 2,
                color: this.getRandomColor()
            };
            
            this.entities.push(codeBlock);
            
            // Schedule next spawn
            setTimeout(() => this.spawnCodeBlocks(), 2000 + Math.random() * 3000);
        }
    }

    // Get random code snippet
    getRandomCodeSnippet() {
        const snippets = ['let x = 5;', 'if (true) { }', 'function() { }', 'const arr = [];', 'return value;'];
        return snippets[Math.floor(Math.random() * snippets.length)];
    }

    // Get random color
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Setup input handlers
    setupInputHandlers() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    // Handle mouse click
    handleClick(e) {
        if (!this.isRunning || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.handleGameClick(x, y);
    }

    // Handle game-specific click
    handleGameClick(x, y) {
        switch (this.gameType) {
            case 'speed':
                this.handleSpeedGameClick(x, y);
                break;
            case 'bugfix':
                this.handleBugFixGameClick(x, y);
                break;
            case 'memory':
                this.handleMemoryGameClick(x, y);
                break;
            case 'puzzle':
                this.handlePuzzleGameClick(x, y);
                break;
        }
    }

    // Speed game click handler
    handleSpeedGameClick(x, y) {
        // Check if clicked on a falling code block
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (x >= entity.x && x <= entity.x + entity.width &&
                y >= entity.y && y <= entity.y + entity.height) {
                
                // Remove the clicked entity
                this.entities.splice(i, 1);
                this.score += 10;
                this.addParticle(entity.x + entity.width/2, entity.y + entity.height/2, '+10');
                break;
            }
        }
    }

    // Bug fix game click handler
    handleBugFixGameClick(x, y) {
        this.targets.forEach(target => {
            if (x >= target.x && x <= target.x + target.width &&
                y >= target.y && y <= target.y + target.height) {
                
                if (!target.fixed) {
                    target.fixed = true;
                    this.score += 25;
                    this.correctAnswers++;
                    this.addParticle(target.x + target.width/2, target.y + target.height/2, '+25');
                }
            }
        });
    }

    // Memory game click handler
    handleMemoryGameClick(x, y) {
        this.targets.forEach(target => {
            if (x >= target.x && x <= target.x + target.width &&
                y >= target.y && y <= target.y + target.height) {
                
                if (!target.isFlipped && !target.isMatched) {
                    target.isFlipped = true;
                    this.checkMemoryMatch();
                }
            }
        });
    }

    // Puzzle game click handler
    handlePuzzleGameClick(x, y) {
        this.targets.forEach(target => {
            if (x >= target.displayX && x <= target.displayX + target.width &&
                y >= target.displayY && y <= target.displayY + target.height) {
                
                if (!target.isEmpty) {
                    this.movePuzzleTile(target);
                }
            }
        });
    }

    // Check memory match
    checkMemoryMatch() {
        const flippedCards = this.targets.filter(card => card.isFlipped && !card.isMatched);
        
        if (flippedCards.length === 2) {
            if (flippedCards[0].symbol === flippedCards[1].symbol) {
                // Match found
                flippedCards[0].isMatched = true;
                flippedCards[1].isMatched = true;
                this.score += 50;
                this.correctAnswers += 2;
                this.addParticle(400, 300, '+50');
            } else {
                // No match, flip back after delay
                setTimeout(() => {
                    flippedCards[0].isFlipped = false;
                    flippedCards[1].isFlipped = false;
                }, 1000);
            }
        }
    }

    // Move puzzle tile
    movePuzzleTile(tile) {
        const emptyTile = this.targets.find(t => t.isEmpty);
        if (!emptyTile) return;
        
        // Check if tile is adjacent to empty tile
        const dx = Math.abs(tile.x - emptyTile.x);
        const dy = Math.abs(tile.y - emptyTile.y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            // Swap positions
            [tile.x, emptyTile.x] = [emptyTile.x, tile.x];
            [tile.y, emptyTile.y] = [emptyTile.y, tile.y];
            [tile.displayX, emptyTile.displayX] = [emptyTile.displayX, tile.displayX];
            [tile.displayY, emptyTile.displayY] = [emptyTile.displayY, tile.displayY];
            
            this.score += 5;
            this.checkPuzzleComplete();
        }
    }

    // Check if puzzle is complete
    checkPuzzleComplete() {
        let isComplete = true;
        let expectedNumber = 1;
        
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const tile = this.targets.find(t => t.x === x && t.y === y);
                if (tile.isEmpty) {
                    if (x !== 2 || y !== 2) isComplete = false;
                } else if (tile.number !== expectedNumber) {
                    isComplete = false;
                }
                expectedNumber++;
            }
        }
        
        if (isComplete) {
            this.score += 100;
            this.correctAnswers++;
            this.addParticle(400, 300, 'Puzzle Complete! +100');
        }
    }

    // Add particle effect
    addParticle(x, y, text) {
        this.particles.push({
            x: x,
            y: y,
            text: text,
            life: 60,
            maxLife: 60,
            vx: (Math.random() - 0.5) * 2,
            vy: -2
        });
    }

    // Start the game
    start() {
        this.isRunning = true;
        this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
    }

    // Pause the game
    pause() {
        this.isPaused = true;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }

    // Resume the game
    resume() {
        this.isPaused = false;
        this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
    }

    // Stop the game
    stop() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }

    // Main game update loop
    update(currentTime) {
        if (!this.isRunning) return;
        
        // Update game entities
        this.updateEntities();
        
        // Update particles
        this.updateParticles();
        
        // Check game over conditions
        this.checkGameOver();
        
        // Render everything
        this.render();
        
        // Continue game loop
        if (this.isRunning) {
            this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
        }
    }

    // Update game entities
    updateEntities() {
        if (this.gameType === 'speed') {
            // Update falling code blocks
            this.entities.forEach((entity, index) => {
                entity.y += entity.speed;
                
                // Remove entities that fall off screen
                if (entity.y > this.canvas.height) {
                    this.entities.splice(index, 1);
                    // Penalty for missing code blocks
                    this.score = Math.max(0, this.score - 5);
                }
            });
        }
    }

    // Update particles
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // Check game over conditions
    checkGameOver() {
        if (this.correctAnswers >= this.totalQuestions) {
            this.gameOver();
        }
    }

    // Game over
    gameOver() {
        this.stop();
        
        // Emit game over event
        const event = new CustomEvent('gameOver', {
            detail: {
                score: this.score,
                timeTaken: 0,
                accuracy: this.totalQuestions > 0 ? (this.correctAnswers / this.totalQuestions) * 100 : 0
            }
        });
        document.dispatchEvent(event);
    }

    // Render the game
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render based on game type
        switch (this.gameType) {
            case 'speed':
                this.renderSpeedGame();
                break;
            case 'bugfix':
                this.renderBugFixGame();
                break;
            case 'memory':
                this.renderMemoryGame();
                break;
            case 'puzzle':
                this.renderPuzzleGame();
                break;
        }
        
        // Render particles
        this.renderParticles();
        
        // Render UI
        this.renderUI();
    }

    // Render speed game
    renderSpeedGame() {
        // Render target code blocks
        this.targets.forEach(target => {
            this.ctx.fillStyle = target.color;
            this.ctx.fillRect(target.x, target.y, target.width, target.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(target.text, target.x + target.width/2, target.y + target.height/2 + 4);
        });
        
        // Render falling code blocks
        this.entities.forEach(entity => {
            this.ctx.fillStyle = entity.color;
            this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(entity.code, entity.x + entity.width/2, entity.y + entity.height/2 + 3);
        });
    }

    // Render bug fix game
    renderBugFixGame() {
        this.targets.forEach(target => {
            this.ctx.fillStyle = target.fixed ? '#4CAF50' : '#FF9800';
            this.ctx.fillRect(target.x, target.y, target.width, target.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(target.code, target.x + 10, target.y + 25);
            this.ctx.fillText(target.bug, target.x + 10, target.y + 45);
            if (target.fixed) {
                this.ctx.fillText('✓ Fixed', target.x + 10, target.y + 65);
            }
        });
    }

    // Render memory game
    renderMemoryGame() {
        this.targets.forEach(card => {
            if (card.isMatched) {
                this.ctx.fillStyle = '#4CAF50';
            } else if (card.isFlipped) {
                this.ctx.fillStyle = '#2196F3';
            } else {
                this.ctx.fillStyle = '#666';
            }
            
            this.ctx.fillRect(card.x, card.y, card.width, card.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            
            if (card.isFlipped || card.isMatched) {
                this.ctx.fillText(card.symbol, card.x + card.width/2, card.y + card.height/2 + 8);
            } else {
                this.ctx.fillText('?', card.x + card.width/2, card.y + card.height/2 + 8);
            }
        });
    }

    // Render puzzle game
    renderPuzzleGame() {
        this.targets.forEach(tile => {
            if (!tile.isEmpty) {
                this.ctx.fillStyle = '#2196F3';
                this.ctx.fillRect(tile.displayX, tile.displayY, tile.width, tile.height);
                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(tile.number, tile.displayX + tile.width/2, tile.displayY + tile.height/2 + 8);
            }
        });
    }

    // Render particles
    renderParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(particle.text, particle.x, particle.y);
        });
    }

    // Render UI
    renderUI() {
        // Render score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Level: ${this.level}`, 20, 60);
        
        // Render progress
        if (this.totalQuestions > 0) {
            this.ctx.fillText(`Progress: ${this.correctAnswers}/${this.totalQuestions}`, 20, 90);
        }
    }

    // Get game statistics
    getStats() {
        return {
            score: this.score,
            level: this.level,
            correctAnswers: this.correctAnswers,
            totalQuestions: this.totalQuestions,
            accuracy: this.totalQuestions > 0 ? (this.correctAnswers / this.totalQuestions) * 100 : 0
        };
    }
}
