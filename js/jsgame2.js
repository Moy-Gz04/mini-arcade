import { db, ref, get, set, push } from "./firebaseConfig4.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

// 🔹 Cargar la imagen del personaje
const playerImage = new Image();
playerImage.src = "img/personaje.png";

let player = {
    x: 100,
    y: canvas.height / 2,
    width: 40,
    height: 50,
    velocityY: 5,
    gravity: 0.15,
    jump: -4.5,
};

let obstacles = [];
let frame = 0;
let score = 0;
let gameOver = false;
let gameStarted = false;
let firstTap = false;
let coins = 0;
let coinObjects = [];
let raindrops = [];

// 🔹 Cargar monedas desde Firebase
let totalCoins = 0;
const coinsRef = ref(db, "monedas_global");
const rankingRef = ref(db, "ranking3"); // 📌 Ahora se guarda en ranking3

function obtenerMonedas() {
    get(coinsRef).then((snapshot) => {
        if (snapshot.exists()) {
            totalCoins = snapshot.val();
        }
    }).catch((error) => {
        console.error("❌ ERROR al obtener monedas desde Firebase:", error);
    });
}

function actualizarMonedas(nuevaCantidad) {
    set(coinsRef, nuevaCantidad).then(() => {
        console.log("✅ Monedas actualizadas en Firebase:", nuevaCantidad);
    }).catch((error) => {
        console.error("❌ ERROR al actualizar monedas en Firebase:", error);
    });
}

obtenerMonedas(); 

// 🔹 Lluvia en el fondo
function createRain() {
    raindrops = [];
    for (let i = 0; i < 50; i++) {
        raindrops.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: 20,
            speed: 0.5
        });
    }
}

// 🔹 Cargar imágenes
const backgroundImg = new Image();
const obstacleTopImg = new Image();
const obstacleBottomImg = new Image();

backgroundImg.src = "img/f21.jpg";
obstacleTopImg.src = "img/Murosup.png";
obstacleBottomImg.src = "img/Muroinf.png";

// 🔹 Crear ventana de preparación
const prepareModal = document.createElement("div");
prepareModal.classList.add("modal");
prepareModal.innerHTML = `
    <div class="modal-content">
        <h2>¡Prepárate!</h2>
        <p>Presiona espacio para comenzar</p>
    </div>
`;
document.body.appendChild(prepareModal);

// 🔹 Dibujar el fondo
function drawBackground() {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
}


// 🔹 Dibujar el jugador con una imagen en lugar del rectángulo amarillo
function drawPlayer() {
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        console.warn("⚠️ La imagen del personaje aún no se ha cargado.");
    }
}


// 🔹 Actualizar el jugador
function updatePlayer() {
    if (firstTap) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
    }

    if (player.y + player.height > canvas.height || player.y < 0) {
        endGame();
    }
}

let obstacleCounter = 0; 

function createObstacle() {
    let height = Math.floor(Math.random() * 200) + 50;
    let gap = 150;
    let obstacleTop = { x: canvas.width, y: 0, width: 50, height: height, type: "top" };
    let obstacleBottom = { x: canvas.width, y: height + gap, width: 50, height: canvas.height - height - gap, type: "bottom" };

    obstacles.push(obstacleTop, obstacleBottom);
    obstacleCounter++; 

    // ✅ Generar moneda cada 3 pares de obstáculos
    if (obstacleCounter % 3 === 0) {
        let coin = {
            x: canvas.width,
            y: height + gap / 2 - 10,
            radius: 10
        };
        coinObjects.push(coin);
        console.log(`✅ Moneda generada en X: ${coin.x}, Y: ${coin.y}`);
    }
}

function updateObstacles() {
    if (frame % 100 === 0 && (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 200)) {
        createObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 2.5;
        if (!obstacles[i].counted && obstacles[i].x + obstacles[i].width < player.x) {
            obstacles[i].counted = true; 
            if (obstacles[i].type === "top") { 
                score += 1;
                console.log(`🎯 Score aumentado: ${score}`);
            }
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // ✅ Mover monedas con los obstáculos y eliminarlas si están muy lejos
    for (let i = coinObjects.length - 1; i >= 0; i--) {
        coinObjects[i].x -= 2.5;
        if (coinObjects[i].x < -50) {  
            console.log("🛑 Moneda eliminada fuera de pantalla:", coinObjects[i]);
            coinObjects.splice(i, 1);
        }
    }
}

// 🔹 Detectar colisión con obstáculos y monedas
function checkCollision() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            endGame();
        }
    }

    // ✅ Verificar colisión con monedas
    for (let i = coinObjects.length - 1; i >= 0; i--) {
        if (
            player.x < coinObjects[i].x + 10 &&
            player.x + player.width > coinObjects[i].x &&
            player.y < coinObjects[i].y + 10 &&
            player.y + player.height > coinObjects[i].y
        ) {
            console.log("✅ Moneda recogida");
            coins++; // 🔹 Aumentar contador de monedas obtenidas
            coinObjects.splice(i, 1); // 🔹 Eliminar moneda recogida
        }
    }
}


// 🔹 Dibujar obstáculos
function drawObstacles() {
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(22, 181, 230, 0.8)";

    for (let obs of obstacles) {
        let img = obs.type === "top" ? obstacleTopImg : obstacleBottomImg;
        ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
    }

    ctx.shadowBlur = 0;
}

function drawCoins() {
    console.log("Dibujando monedas"); // ✅ Verificación de ejecución
    ctx.font = "35px Arial";
    ctx.fillStyle = "gold";

    for (let coin of coinObjects) {
        console.log(`🔹 Dibujando moneda en: X=${coin.x}, Y=${coin.y}`);
        ctx.fillText("🪙", coin.x, coin.y);
    }
}


// 🔹 Finalizar juego
function endGame() {
    gameOver = true;

    // 📌 🔹 Solicitar el nombre del usuario antes de registrar el puntaje
    let nombreUsuario = prompt("¡Juego terminado! Ingresa tu nombre:");

    if (nombreUsuario && nombreUsuario.trim() !== "") {
        registrarPuntaje(nombreUsuario, score);
    }

    document.getElementById("finalScore").innerText = score;
    document.getElementById("finalCoins").innerText = coins;
    document.getElementById("scoreModal").style.display = "flex";
    actualizarMonedas(totalCoins + coins);
}

// 📌 🔹 Guardar puntaje en Firebase
function registrarPuntaje(nombreUsuario, puntaje) {
    const nuevoRegistroRef = push(rankingRef); 

    set(nuevoRegistroRef, {
        nombre: nombreUsuario,
        puntaje: puntaje
    }).then(() => {
        console.log("✅ Puntaje registrado en Firebase con éxito.");
    }).catch(error => {
        console.error("❌ ERROR al registrar el puntaje:", error);
    });
}

// 🔹 Cerrar modal y volver al index
function closeScoreModal() {
    document.getElementById("scoreModal").style.display = "none";
    window.location.href = "index.html";
}
window.closeScoreModal = closeScoreModal;

function gameLoop() {
    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawPlayer();
        updatePlayer();
        updateObstacles();
        drawObstacles();
        drawCoins(); // ✅ Asegúrate de que está aquí
        checkCollision();

        // ✅ Mostrar puntaje correctamente
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + score, 20, 30);
        ctx.fillText("🪙: " + coins, 20, 60);

        frame++;
        requestAnimationFrame(gameLoop);
    }
}


document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        if (!gameStarted) {
            prepareModal.style.display = "none";
            gameStarted = true;
            obtenerMonedas();
            gameLoop();
        }
        firstTap = true;
        player.velocityY = player.jump;
    }
});
prepareModal.style.display = "flex";
