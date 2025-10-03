const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const messageDisplay = document.getElementById('messageDisplay');

// Elementos de la UI (Algunos ya no se usarán al redirigir, pero los mantengo para evitar errores)
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const endScreen = document.getElementById('endScreen');
const finalMessage = document.getElementById('finalMessage');
const ticketContainer = document.getElementById('ticketContainer');
const restartButton = document.getElementById('restartButton');
const btnJump = document.getElementById('btnJump');

// Elementos del MODAL DE PREMIO (Ventana Separada) - YA NO SON NECESARIOS, PERO MANTENEMOS LAS VARIABLES
const prizeModal = document.getElementById('prizeModal');
const modalTitle = document.getElementById('modalTitle');
const closePrizeButton = document.getElementById('closePrizeButton');


// --- Parámetros del Juego ---
const SPINO_WIDTH = 120;
const SPINO_HEIGHT = 90;
const GROUND_Y = canvas.height - 50;
const JUMP_POWER = -15; 
const GRAVITY = 0.5;

// 🚀 Variables de Velocidad Progresiva
const BASE_OBSTACLE_SPEED = 3; 
let OBSTACLE_SPEED = BASE_OBSTACLE_SPEED; 
const SPEED_INCREMENT = 0.5; 
// 🚨 CAMBIO AQUÍ: Establecemos el puntaje de victoria a 20, como solicitaste.
const SCORE_TO_WIN = 1; 

// AJUSTE DE DISTANCIA
const OBSTACLE_INTERVAL = 2000; 


// --- Estados del juego ---
const GAME_STATE = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WON: 'won'
};
let currentGameState = GAME_STATE.START;

// --- Carga de imágenes ---
const imagesToLoad = {};
let loadedImagesCount = 0;
const totalImages = 6; 

function loadImage(name, src) {
    imagesToLoad[name] = new Image();
    imagesToLoad[name].src = src;
    imagesToLoad[name].onload = () => {
        loadedImagesCount++;
        if (loadedImagesCount === totalImages) {
            console.log("Todas las imágenes cargadas.");
            showStartScreen(); 
            requestAnimationFrame(gameLoop); 
        }
    };
    imagesToLoad[name].onerror = () => {
        console.error(`ERROR: No se pudo cargar la imagen ${src}.`);
        messageDisplay.textContent = `Error: No se cargó la imagen ${src}.`;
        messageDisplay.style.display = 'block';
    };
}

loadImage('spinosaurus', 'spinosaurus.png');
loadImage('backgroundSky', 'bg_sky.png');
loadImage('backgroundMountains', 'bg_mountains.png');
loadImage('backgroundTrees', 'bg_trees.png');
loadImage('rock1', 'rock1.png');
loadImage('rock2', 'rock2.png');

// --- Lógica del Fondo Paralaje ---
const backgroundLayers = [
    { image: 'backgroundSky', speed: 0.5, x1: 0, x2: canvas.width },
    { image: 'backgroundMountains', speed: 1, x1: 0, x2: canvas.width },
    { image: 'backgroundTrees', speed: 2, x1: 0, x2: canvas.width }
];

function drawBackground() {
    backgroundLayers.forEach(layer => {
        if (imagesToLoad[layer.image] && imagesToLoad[layer.image].complete) {
            ctx.drawImage(imagesToLoad[layer.image], layer.x1, 0, canvas.width, canvas.height);
            ctx.drawImage(imagesToLoad[layer.image], layer.x2, 0, canvas.width, canvas.height);
        }

        if (currentGameState === GAME_STATE.PLAYING) {
            layer.x1 -= layer.speed;
            layer.x2 -= layer.speed;

            if (layer.x1 <= -canvas.width) {
                layer.x1 = canvas.width;
            }
            if (layer.x2 <= -canvas.width) {
                layer.x2 = canvas.width;
            }
        }
    });
}

// --- CLASES DEL JUEGO ---

class Spinosaurus {
    constructor() {
        this.x = 50;
        this.y = GROUND_Y - SPINO_HEIGHT;
        this.vy = 0;
        this.isJumping = false;
    }

    draw() {
        if (imagesToLoad.spinosaurus && imagesToLoad.spinosaurus.complete) {
            ctx.drawImage(imagesToLoad.spinosaurus, this.x, this.y, SPINO_WIDTH, SPINO_HEIGHT);
        }
    }

    update() {
        if (this.isJumping) {
            this.vy += GRAVITY;
            this.y += this.vy;

            if (this.y >= GROUND_Y - SPINO_HEIGHT) {
                this.y = GROUND_Y - SPINO_HEIGHT;
                this.isJumping = false;
            }
        }
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.vy = JUMP_POWER;
        }
    }
}

class Obstacle {
    constructor(x) {
        this.x = x;
        const rockTypes = ['rock1', 'rock2'];
        this.imageName = rockTypes[Math.floor(Math.random() * rockTypes.length)];
        this.image = imagesToLoad[this.imageName];

        this.width = 60; 
        this.height = 40; 

        this.y = GROUND_Y - this.height;
    }

    draw() {
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    update() {
        this.x -= OBSTACLE_SPEED;
    }
}


// ❌ ELIMINAMOS O SIMPLIFICAMOS LA CLASE PrizeManager
// Ya no necesitamos toda la lógica del modal y la impresión.
class PrizeManager {
    // Mantengo el constructor vacío para evitar errores si otras partes del código lo llaman
    constructor(container, prizeModal, closeButton) {
        // Lógica de redirección manejada en el gameLoop
    }
    openForm(prize) {
        // Esta función ya no se usa
    }
    // ... otras funciones también se vuelven irrelevantes.
}
// 🏆 Inicializar el PrizeManager (mantenido solo para compatibilidad)
const prizeManager = new PrizeManager(ticketContainer, prizeModal, closePrizeButton);


// --- LÓGICA DE GESTIÓN DE PANTALLAS Y ESTADOS ---

let spinosaurus = new Spinosaurus();
let obstacles = [];
let score = 0;
let lastObstacleTime = 0;
// 🚨 AÑADIDO: Variable para controlar si el juego ha sido ganado (para la redirección)
let gameWon = false; 

function resetGame() {
    spinosaurus = new Spinosaurus();
    obstacles = [];
    score = 0;
    gameWon = false; // Restablecer al reiniciar
    OBSTACLE_SPEED = BASE_OBSTACLE_SPEED; 
    scoreDisplay.textContent = `Puntaje: 0`;
    messageDisplay.style.display = 'none';
    currentGameState = GAME_STATE.PLAYING;
    endScreen.style.display = 'none';
    
    // Ocultar el modal de premio al reiniciar (Mantenido)
    if (ticketContainer) ticketContainer.style.display = 'none';
    if (prizeModal) prizeModal.style.display = 'none'; 
    
    backgroundLayers.forEach(layer => {
        layer.x1 = 0;
        layer.x2 = canvas.width;
    });
}

function showStartScreen() {
    startScreen.style.display = 'flex';
    endScreen.style.display = 'none';
    canvas.style.display = 'block'; 
    scoreDisplay.style.display = 'none';
}

function startGame() {
    startScreen.style.display = 'none';
    scoreDisplay.style.display = 'block';
    resetGame(); 
}

// --- BUCLE PRINCIPAL DEL JUEGO (GAME LOOP) ---

function gameLoop(timestamp) {
    if (loadedImagesCount !== totalImages) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // 🚨 ACTUALIZADO: Si está GANADO, salimos del loop para permitir la redirección.
    if (currentGameState !== GAME_STATE.PLAYING || gameWon) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        requestAnimationFrame(gameLoop); 
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(); 

    ctx.fillStyle = '#6b4f4f'; 
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    spinosaurus.update();
    spinosaurus.draw();

    // Lógica de generación de obstáculos con el intervalo ajustado
    if (timestamp - lastObstacleTime > OBSTACLE_INTERVAL / (OBSTACLE_SPEED / BASE_OBSTACLE_SPEED)) {
        obstacles.push(new Obstacle(canvas.width));
        lastObstacleTime = timestamp;
    }

    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();
        
        // 🎯 CÁLCULO DEL HITBOX DEL DINOSAURIO (COLISIÓN PRECISA)
        const dinoHitbox = {
            x: spinosaurus.x + 20,           
            y: spinosaurus.y + 20,           
            width: SPINO_WIDTH - 40,         
            height: SPINO_HEIGHT - 20        
        };
        
        // 🎯 LÓGICA DE COLISIÓN MEJORADA
        if (
            dinoHitbox.x < obstacle.x + obstacle.width &&
            dinoHitbox.x + dinoHitbox.width > obstacle.x &&
            dinoHitbox.y + dinoHitbox.height > obstacle.y &&
            dinoHitbox.y < obstacle.y + obstacle.height 
        ) {
            currentGameState = GAME_STATE.GAME_OVER;
            finalMessage.textContent = '¡Juego terminado! 💀';
            endScreen.style.display = 'flex';
        }

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score++;
            scoreDisplay.textContent = `Puntaje: ${score}`;
            
            // 🚀 Lógica de aumento de velocidad CADA 10 PUNTOS
            if (score > 0 && score % 10 === 0) {
                OBSTACLE_SPEED += SPEED_INCREMENT;
                console.log(`¡Velocidad aumentada a: ${OBSTACLE_SPEED.toFixed(1)}!`);
            }
        }
    });

    // 🏆 CONDICIÓN DE VICTORIA (REDIRECCIÓN)
    if (score >= SCORE_TO_WIN && currentGameState === GAME_STATE.PLAYING) {
        gameWon = true;
        currentGameState = GAME_STATE.WON;
        // ✅ LÓGICA SOLICITADA: Redirige a la página de registro
        window.location.href = 'registro.html?score=' + score; 
    }

    requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame); 

// ⌨️ Salto con Barra Espaciadora (Laptop/PC)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spinosaurus.isJumping && currentGameState === GAME_STATE.PLAYING) {
        spinosaurus.jump();
    }
});

// 🖱️ Controles: móvil y puntero (Click/Touch)
(function(){
    function jumpAction(){
        if (typeof spinosaurus !== 'undefined' && !spinosaurus.isJumping && currentGameState === GAME_STATE.PLAYING){
 spinosaurus.jump();
}
 }

 // Botón "Saltar" móvil
 if (btnJump){
 btnJump.addEventListener('click', jumpAction, {passive:true});
 btnJump.addEventListener('touchstart', function(e){ e.preventDefault(); jumpAction(); }, {passive:false});
    }

    // Click/Tap en el canvas
    if (canvas){
        canvas.addEventListener('pointerdown', (e)=>{
if (e.isPrimary) jumpAction();
 }, {passive:true});

        canvas.addEventListener('touchstart', function(e){
 e.preventDefault();
 jumpAction();
  }, {passive:false});
    }
})();