import { db, ref, get, set } from "./firebaseConfig.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const transitionMessage = document.getElementById("transitionMessage");
const coinCounter = document.getElementById("coinCount");

// Ajustar dimensiones del canvas
canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

// 🔹 Referencias en Firebase
const coinsRef = ref(db, "monedas_global");

// 🔹 Obtener monedas actuales de Firebase y mostrarlas en el index
function obtenerMonedas() {
    get(coinsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const coins = snapshot.val();
            document.getElementById("coinDisplay").innerText = coins;
        } else {
            actualizarMonedas(0); // Si no hay datos, inicializar en 0
        }
    }).catch((error) => {
        console.error("❌ ERROR al obtener monedas desde Firebase:", error);
    });
}

// 🔹 Actualizar monedas en Firebase
function actualizarMonedas(nuevaCantidad) {
    set(coinsRef, nuevaCantidad).then(() => {
        document.getElementById("coinDisplay").innerText = nuevaCantidad;
    }).catch((error) => {
        console.error("❌ ERROR al actualizar monedas en Firebase:", error);
    });
}

obtenerMonedas(); // 🔥 Cargar monedas al iniciar

// Datos del jugador
let player = { x: canvas.width / 2 - 20, y: canvas.height - 100, width: 40, height: 40, speed: 5 };

// Parámetros de los portales
const doorWidth = 150;
const doorHeight = 150;
const doorSpacing = 100;
const startX = (canvas.width - (doorWidth * 4 + doorSpacing * 3)) / 2;

let doors = [
    { x: startX, y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game1" },
    { x: startX + (doorWidth + doorSpacing), y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game2" },
    { x: startX + (doorWidth + doorSpacing) * 2, y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game3" },
    { x: startX + (doorWidth + doorSpacing) * 3, y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game4" }
];


let coin = { x: Math.random() * (canvas.width - 20), y: Math.random() * (canvas.height - 20), size: 15 };
let collisionStartTime = null;

// Cargar imágenes
const backgroundImage = new Image();
backgroundImage.src = "img/siso.webp";

const portalImage = new Image();
portalImage.src = "img/portal2.png";

let hue = 0;

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    doors.forEach((door) => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.drawImage(portalImage, door.x, door.y, door.width, door.height);
        ctx.restore();
    });

    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function updatePortalGlow() {
    hue += 2;
    if (hue > 360) hue = 0;
}

function checkCollisions() {
    let dx = player.x + player.width / 2 - coin.x;
    let dy = player.y + player.height / 2 - coin.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < coin.size + player.width / 2) {
        get(coinsRef).then((snapshot) => {
            let currentCoins = snapshot.exists() ? snapshot.val() : 0;
            currentCoins++;
            actualizarMonedas(currentCoins);
        });

        coin.x = Math.random() * (canvas.width - 20);
        coin.y = Math.random() * (canvas.height - 20);
    }

    for (let door of doors) {
        if (
            player.x < door.x + door.width &&
            player.x + player.width > door.x &&
            player.y < door.y + door.height &&
            player.y + player.height > door.y
        ) {
            if (!collisionStartTime) {
                collisionStartTime = Date.now();
            } else if (Date.now() - collisionStartTime >= 1500) {
                window.location.href = `${door.type}.html`;
            } else {
                transitionMessage.innerText = `Te estás dirigiendo a ${door.type}`;
                transitionMessage.style.display = "block";
            }
            return;
        }
    }
    collisionStartTime = null;
    transitionMessage.style.display = "none";
}

function handleKeyDown(event) {
    collisionStartTime = null;
    switch (event.key) {
        case "ArrowUp":
            player.y -= player.speed;
            break;
        case "ArrowDown":
            player.y += player.speed;
            break;
        case "ArrowLeft":
            player.x -= player.speed;
            break;
        case "ArrowRight":
            player.x += player.speed;
            break;
    }
    checkCollisions();
    drawGame();
}

setInterval(() => {
    updatePortalGlow();
    drawGame();
    checkCollisions();
}, 100);

document.addEventListener("keydown", handleKeyDown);
backgroundImage.onload = drawGame;
