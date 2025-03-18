// 🔹 Importar Firebase
import { db, ref, get, set, push } from "./firebaseConfig3.js";

// 🔹 Referencias en el DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreCounter = document.getElementById("score");
const countdownElement = document.getElementById("countdown");
const nameModal = document.getElementById("nameModal");
const playerNameInput = document.getElementById("playerName");
const rankingRef = ref(db, "ranking1"); // Asegurar que está referenciando "ranking1"

// 🔹 Configuración del juego
canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

const bgImage = new Image();
bgImage.src = "img/fondo1.jpg";
const objectImage = new Image();
objectImage.src = "img/mancuerna.png";

let player = { x: canvas.width / 2 - 20, y: canvas.height - 50, width: 40, height: 40, speed: 15 };
let objects = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let coins = 0;

// 🔹 Referencias en Firebase
const coinsRef = ref(db, "monedas_global");

// 📌 Obtener monedas actuales de Firebase
function obtenerMonedas() {
    get(coinsRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                coins = snapshot.val();
            } else {
                coins = 0;
                actualizarMonedas(coins);
            }
        })
        .catch((error) => {
            console.error("❌ ERROR al obtener monedas desde Firebase:", error);
        });
}

// 📌 Actualizar monedas en Firebase
function actualizarMonedas(nuevaCantidad) {
    set(coinsRef, nuevaCantidad)
        .then(() => {
            console.log("✅ Monedas actualizadas en Firebase:", nuevaCantidad);
        })
        .catch((error) => {
            console.error("❌ ERROR al actualizar monedas en Firebase:", error);
        });
}

obtenerMonedas(); // 🔥 Cargar monedas al iniciar

function startCountdown() {
    let count = 3;
    countdownElement.style.display = "block";
    drawGame();
    const countdownInterval = setInterval(() => {
        countdownElement.innerText = count;
        if (count === 0) {
            clearInterval(countdownInterval);
            countdownElement.style.display = "none";
            gameStarted = true;
            spawnObjects();
            gameLoop();
        }
        count--;
    }, 1000);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    objects.forEach((obj) => {
        ctx.drawImage(objectImage, obj.x, obj.y, obj.size, obj.size);
    });
}

function spawnObjects() {
    objects = [];
    for (let i = 0; i < 3; i++) {
        objects.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            size: 50,
            speed: Math.random() * 5 + 3,
        });
    }
}

// 📌 Mostrar la ventana modal para ingresar el nombre
function mostrarModal() {
    nameModal.style.display = "flex";
    playerNameInput.value = ""; // Limpiar el input al abrir el modal
}

// 📌 Cerrar la ventana modal
function cerrarModal() {
    nameModal.style.display = "none";
}

// 📌 Guardar el nombre y registrar el puntaje
function guardarNombre() {
    let nombre = playerNameInput.value.trim(); // Quita espacios innecesarios

    if (nombre === "") {
        alert("⚠️ Ingresa un nombre válido.");
        return;
    }

    let puntaje = score > 0 ? score : 0; // Asegurar que el puntaje tiene un valor válido

    registrarPuntaje(nombre, puntaje);
}

// 📌 Guardar puntaje en Firebase y redirigir de inmediato al ranking
function registrarPuntaje(nombreUsuario, puntaje) {
    const nuevoRegistroRef = push(rankingRef); // Crear nuevo registro en Firebase

    set(nuevoRegistroRef, {
        nombre: nombreUsuario,
        puntaje: puntaje,
    })
        .then(() => {
            console.log("✅ Puntaje registrado en Firebase con éxito.");
            cerrarModal(); // 🔹 Cerrar el modal inmediatamente
            window.location.href = "ranking.html"; // 🔹 Redirigir directamente al ranking
        })
        .catch((error) => {
            console.error("❌ ERROR al registrar el puntaje:", error);
            alert("❌ Error al guardar el puntaje. Intenta de nuevo.");
        });
}

// 📌 Actualizar el juego y detectar colisiones
function updateGame() {
    if (gameOver || !gameStarted) return;

    objects.forEach((obj) => {
        obj.y += obj.speed;
        if (obj.y > canvas.height) {
            obj.y = -obj.size;
            obj.x = Math.random() * (canvas.width - obj.size);
            score++;
            scoreCounter.innerText = score;
        }

        // 📌 Detectar colisión con el jugador
        if (
            player.x < obj.x + obj.size &&
            player.x + player.width > obj.x &&
            player.y < obj.y + obj.size &&
            player.y + player.height > obj.y
        ) {
            gameOver = true;

            let coinsEarned = Math.floor(score / 25);
            coins += coinsEarned;
            actualizarMonedas(coins);

            // ✅ Mostrar modal en lugar del prompt
            mostrarModal();
        }
    });
}

// 🔹 Cerrar la ventana modal y redirigir al ranking
function closeScoreModal() {
    document.getElementById("scoreModal").style.display = "none";
    window.location.href = "ranking.html";
}

function gameLoop() {
    if (!gameOver && gameStarted) {
        updateGame();
        drawGame();
        requestAnimationFrame(gameLoop);
    }
}

document.addEventListener("keydown", (event) => {
    if (!gameStarted) return;
    if (event.key === "ArrowLeft" && player.x > 0) {
        player.x -= player.speed;
    } else if (event.key === "ArrowRight" && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
    drawGame();
});

startCountdown();

// 🔹 Hacer que las funciones sean accesibles globalmente
window.guardarNombre = guardarNombre;
window.cerrarModal = cerrarModal;
window.closeScoreModal = closeScoreModal;
window.mostrarModal = mostrarModal;
