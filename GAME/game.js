const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const baseSize = Math.min(canvas.width, canvas.height) * 0.15;

const heroImg = new Image(); heroImg.src = '1.png';
const backgroundImg = new Image(); backgroundImg.src = '10.jpeg';
const enemyImgs = [new Image(), new Image(), new Image(), new Image()];
enemyImgs[0].src = '5.png';
enemyImgs[1].src = '2.png';
enemyImgs[2].src = '3.png';
enemyImgs[3].src = '4.png';

const bgMusic = new Audio('6.mp3'); bgMusic.loop = true; bgMusic.volume = 0.3;
const shootSound = new Audio('8.mp3'); shootSound.volume = 0.10;
const killSound = new Audio('7.m4a'); killSound.volume = 0.7;
const endSound = new Audio('9.mp3'); endSound.volume = 0.8;
const introAudio = new Audio('12.m4a'); introAudio.volume = 0.5; // Audio iniziale

let gameState = {
    hero: { x: canvas.width / 2, y: canvas.height / 2, speed: 5, size: baseSize },
    bullets: [],
    enemies: [],
    score: 0,
    gameTime: 0,
    gameOver: false,
    enemyLevel: 0,
    killTextTimer: 0,
    heartAnimationTimer: 0,
    heartAlpha: 1.0,
    endCrawlDelayTimer: 0,
    endCrawlActive: false,
    endImagesTimer: 0,
    endBackgroundOpacity: 0,
    endForegroundOpacity: 0,
    finalTextOpacity: 0,
    scoreAnimationTimer: 0,
    scoreAnimationActive: false,
    restartTimer: 0,
    hasPlayedIntro: false,
    animationFrameId: null
};

function resetGame() {
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }
    gameState = {
        hero: { x: canvas.width / 2, y: canvas.height / 2, speed: 5, size: baseSize },
        bullets: [],
        enemies: [],
        score: 0,
        gameTime: 0,
        gameOver: false,
        enemyLevel: 0,
        killTextTimer: 0,
        heartAnimationTimer: 0,
        heartAlpha: 1.0,
        endCrawlDelayTimer: 0,
        endCrawlActive: false,
        endImagesTimer: 0,
        endBackgroundOpacity: 0,
        endForegroundOpacity: 0,
        finalTextOpacity: 0,
        scoreAnimationTimer: 0,
        scoreAnimationActive: false,
        restartTimer: 0,
        hasPlayedIntro: gameState.hasPlayedIntro, // Mantiene il valore precedente
        animationFrameId: null
    };
    document.getElementById('score').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('kill-text').style.display = 'none';
    document.getElementById('end-crawl').style.display = 'none';
    bgMusic.pause();
    bgMusic.currentTime = 0;
    startGame();
}

function playKillSound(times = 3) {
    let playCount = 0;
    function playNext() {
        if (playCount < times) {
            killSound.currentTime = 0;
            killSound.play().then(() => {
                playCount++;
            }).catch(err => console.log("Audio blocked:", err));
        }
    }
    killSound.onended = playNext;
    playNext();
}

function playShootSound() {
    const newShootSound = new Audio('8.mp3');
    newShootSound.volume = 0.07;
    newShootSound.play().catch(err => console.log("Audio blocked:", err));
}

function animateScore() {
    if (!gameState.scoreAnimationActive) return;

    const scoreElement = document.getElementById('score');
    const scale = 1 + Math.sin(gameState.scoreAnimationTimer * 0.2) * 0.3;
    scoreElement.style.transform = `scale(${scale})`;
    scoreElement.style.transition = 'transform 0.1s ease';

    gameState.scoreAnimationTimer--;
    if (gameState.scoreAnimationTimer <= 0) {
        gameState.scoreAnimationActive = false;
        scoreElement.style.transform = 'scale(1)';
    }
}

function startGame() {
    const video = document.getElementById('intro-video');
    if (!gameState.hasPlayedIntro) {
        video.volume = 0.5; // Volume per il video
        introAudio.play(); // Riproduce 12.m4a insieme al video
        video.style.display = 'block';
        video.onended = () => {
            video.style.display = 'none';
            introAudio.pause(); // Ferma l'audio quando il video finisce
            introAudio.currentTime = 0; // Riporta l'audio all'inizio
            canvas.style.display = 'block';
            gameState.hasPlayedIntro = true;
            document.getElementById('title').style.display = 'block';
            document.getElementById('subtitle').style.display = 'block';
            setTimeout(() => {
                document.getElementById('title').style.display = 'none';
                document.getElementById('subtitle').style.display = 'none';
                document.getElementById('score').style.display = 'block';
                bgMusic.play();
                spawnEnemy();
                gameLoop();
            }, 3000);
        };
    } else {
        canvas.style.display = 'block';
        document.getElementById('title').style.display = 'block';
        document.getElementById('subtitle').style.display = 'block';
        setTimeout(() => {
            document.getElementById('title').style.display = 'none';
            document.getElementById('subtitle').style.display = 'none';
            document.getElementById('score').style.display = 'block';
            bgMusic.play();
            spawnEnemy();
            gameLoop();
        }, 3000);
    }
}

function spawnEnemy() {
    if (gameState.gameOver || gameState.enemyLevel >= enemyImgs.length) return;
    let enemyX, enemyY, distance;
    const minDistance = baseSize * 3;
    do {
        enemyX = Math.random() * (canvas.width - baseSize);
        enemyY = Math.random() * (canvas.height - baseSize);
        distance = Math.hypot(enemyX - gameState.hero.x, enemyY - gameState.hero.y);
    } while (distance < minDistance);

    const enemy = {
        x: enemyX,
        y: enemyY,
        speed: 1.35 + gameState.enemyLevel * 0.63,
        size: baseSize,
        health: Math.round((4 + gameState.enemyLevel * 3) * 0.9 * 1.7 * 1.4),
        img: enemyImgs[gameState.enemyLevel]
    };
    gameState.enemies.push(enemy);
}

function drawHeart() {
    const heartSize = Math.min(canvas.width, canvas.height) * 0.3 * (1 + Math.sin(gameState.heartAnimationTimer * 0.1) * 0.1);
    const x = canvas.width / 2;
    const y = canvas.height * 0.35;
    
    ctx.globalAlpha = gameState.heartAlpha;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(x, y + heartSize / 4);
    ctx.bezierCurveTo(x - heartSize / 2, y - heartSize / 2, x - heartSize, y + heartSize / 2, x, y + heartSize);
    ctx.bezierCurveTo(x + heartSize, y + heartSize / 2, x + heartSize / 2, y - heartSize / 2, x, y + heartSize / 4);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
}

function drawEndImagesAndText() {
    ctx.globalAlpha = gameState.endBackgroundOpacity;
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    const imgSize = baseSize * 2;
    const x = canvas.width / 2 - imgSize / 2;
    const y = canvas.height / 2 - imgSize / 2;
    ctx.globalAlpha = gameState.endForegroundOpacity;
    ctx.drawImage(heroImg, x, y, imgSize, imgSize);

    ctx.globalAlpha = gameState.finalTextOpacity;
    ctx.font = `bold ${Math.min(canvas.width, canvas.height) * 0.1}px Impact`;
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'center';
    ctx.fillText("Si è Fatto Inculare!!", canvas.width / 2, canvas.height * 0.75);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText("Si è Fatto Inculare!!", canvas.width / 2, canvas.height * 0.75);

    ctx.globalAlpha = 1.0;

    if (gameState.endImagesTimer < 120) {
        gameState.endBackgroundOpacity += 0.00833;
    } else if (gameState.endImagesTimer < 240) {
        gameState.endBackgroundOpacity = 1;
        gameState.endForegroundOpacity += 0.00833;
    } else if (gameState.endImagesTimer < 300) {
        gameState.endBackgroundOpacity = 1;
        gameState.endForegroundOpacity = 1;
        gameState.finalTextOpacity += 0.0167;
    } else {
        gameState.endBackgroundOpacity = 1;
        gameState.endForegroundOpacity = 1;
        gameState.finalTextOpacity = 1;
    }
}

function gameLoop() {
    if (gameState.gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (gameState.heartAnimationTimer > 0) {
            if (gameState.heartAnimationTimer > 180) {
                drawHeart();
            } else {
                gameState.heartAlpha = gameState.heartAnimationTimer / 180;
                drawHeart();
            }
            gameState.heartAnimationTimer--;
            gameState.animationFrameId = requestAnimationFrame(gameLoop);
        } else {
            gameState.endCrawlDelayTimer++;
            if (gameState.endCrawlDelayTimer === 420 && !gameState.endCrawlActive) {
                const endCrawl = document.getElementById('end-crawl');
                endCrawl.innerHTML = "Ebbene sì, nonostante i tuoi sforzi il Dandy si è fatto <strong>inculare</strong>,\nprima si vedevano da soli, poi a casa di amici ... ma ora la svolta, un compleanno in pubblico che segna l'inizio del fidanzamento ufficiale";
                endCrawl.style.display = 'block';
                gameState.endCrawlActive = true;
                console.log("End crawl activated");
            }
            if (gameState.endCrawlDelayTimer > 1440) {
                gameState.endImagesTimer++;
                drawEndImagesAndText();
            }
            if (gameState.restartTimer > 0) {
                gameState.restartTimer--;
                if (gameState.restartTimer === 0) {
                    resetGame();
                    return;
                }
            }
            gameState.animationFrameId = requestAnimationFrame(gameLoop);
        }
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (touchX) gameState.hero.x += (touchX - gameState.hero.x) * 0.1;
    if (touchY) gameState.hero.y += (touchY - gameState.hero.y) * 0.1;
    updateHeroKeyboard();

    ctx.drawImage(heroImg, gameState.hero.x - gameState.hero.size / 2, gameState.hero.y - gameState.hero.size / 2, gameState.hero.size, gameState.hero.size);

    gameState.bullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed;
        ctx.fillStyle = 'white';
        ctx.fillRect(bullet.x, bullet.y, baseSize * 0.1, baseSize * 0.2);
        if (bullet.y < 0) gameState.bullets.splice(i, 1);
    });

    gameState.enemies.forEach((enemy, i) => {
        const dx = gameState.hero.x - enemy.x;
        const dy = gameState.hero.y - enemy.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
        ctx.drawImage(enemy.img, enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);

        gameState.bullets.forEach((bullet, j) => {
            if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.size / 2) {
                enemy.health--;
                gameState.bullets.splice(j, 1);
                playShootSound();
                if (enemy.health <= 0) {
                    gameState.enemies.splice(i, 1);
                    if (gameState.enemyLevel < enemyImgs.length - 1) {
                        playKillSound(3);
                        bgMusic.volume = 0.1;
                        setTimeout(() => {
                            bgMusic.volume = 0.3;
                            killSound.onended = null;
                        }, 1500);
                        document.getElementById('kill-text').style.display = 'block';
                        gameState.killTextTimer = 60;
                        gameState.enemyLevel++;
                        spawnEnemy();
                    } else {
                        endSound.play();
                        gameState.heartAnimationTimer = 360;
                        endGame("Hai fallito, ti sei comunque fidanzato con quella di Mammola", true);
                    }
                }
            }
        });

        if (Math.hypot(enemy.x - gameState.hero.x, enemy.y - gameState.hero.y) < (enemy.size + gameState.hero.size) / 2) {
            endGame("Hai fallito, Il Dandy si è fidanzato", false);
        }
    });

    gameState.gameTime++;
    if (gameState.gameTime % 100 === 0) {
        gameState.score++;
        document.getElementById('score').innerText = `Score: ${gameState.score} Giorni da single`;
        if (gameState.score % 10 === 0 && gameState.score > 0) {
            gameState.scoreAnimationActive = true;
            gameState.scoreAnimationTimer = 120;
            console.log(`Score milestone: ${gameState.score}`);
        }
    }

    animateScore();

    if (gameState.killTextTimer > 0) {
        gameState.killTextTimer--;
        if (gameState.killTextTimer === 0) {
            document.getElementById('kill-text').style.display = 'none';
        }
    }

    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame(message, showCrawl = false) {
    gameState.gameOver = true;
    bgMusic.pause();
    document.getElementById('game-over').innerText = message;
    document.getElementById('game-over').style.display = 'block';
    
    if (!showCrawl) {
        gameState.heartAnimationTimer = 0;
        gameState.restartTimer = 180;
    }
}

// Touch controls
let touchX, touchY;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    if (!gameState.gameOver) {
        gameState.bullets.push({ x: gameState.hero.x, y: gameState.hero.y - gameState.hero.size / 2, speed: 10 });
        playShootSound();
    }
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', () => {
    touchX = null;
    touchY = null;
});

// Keyboard controls
let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);
function updateHeroKeyboard() {
    if (keys['ArrowLeft']) gameState.hero.x -= gameState.hero.speed;
    if (keys['ArrowRight']) gameState.hero.x += gameState.hero.speed;
    if (keys['ArrowUp']) gameState.hero.y -= gameState.hero.speed;
    if (keys['ArrowDown']) gameState.hero.y += gameState.hero.speed;
    if (keys[' '] && !gameState.gameOver) {
        gameState.bullets.push({ x: gameState.hero.x, y: gameState.hero.y - gameState.hero.size / 2, speed: 10 });
        playShootSound();
        keys[' '] = false;
    }
    gameState.hero.x = Math.max(gameState.hero.size / 2, Math.min(canvas.width - gameState.hero.size / 2, gameState.hero.x));
    gameState.hero.y = Math.max(gameState.hero.size / 2, Math.min(canvas.height - gameState.hero.size / 2, gameState.hero.y));
}

// Start game
Promise.all([heroImg, backgroundImg, ...enemyImgs].map(img => img.complete ? Promise.resolve() : new Promise(resolve => img.onload = resolve)))
    .then(() => startGame());