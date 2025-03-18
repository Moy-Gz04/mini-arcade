import { db, ref, get, set } from "./firebaseConfig.js";

const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");

// Ajustar el tamaño del canvas dinámicamente
canvas.width = 500;
canvas.height = 500;

// Referencias a los elementos del DOM
const spinButton = document.getElementById("spinButton");
const betAmountInput = document.getElementById("betAmount");
const resultText = document.getElementById("result");
const coinsDisplay = document.getElementById("coins");
const historyList = document.getElementById("historyList");
const notification = document.getElementById("notification");

let coins = 0;
let angle = 0;
let spinning = false;

// 🔹 Referencias en Firebase
const coinsRef = ref(db, "monedas_global");
const historyRef = ref(db, "historial_tiros");

// 📌 Obtener monedas desde Firebase
function obtenerMonedas() {
    get(coinsRef).then((snapshot) => {
        if (snapshot.exists()) {
            coins = snapshot.val();
            coinsDisplay.textContent = coins;
        } else {
            coins = 100;
            actualizarMonedas(coins);
        }
    }).catch((error) => {
        console.error("❌ ERROR al obtener monedas desde Firebase:", error);
    });
}

// 📌 Cargar historial de tiros desde Firebase
function cargarHistorial() {
    get(historyRef).then((snapshot) => {
        if (snapshot.exists()) {
            let history = snapshot.val();
            historyList.innerHTML = "";

            history.forEach((item) => {
                const historyItem = document.createElement("p");
                historyItem.textContent = `x${item.multiplier}`;
                historyItem.style.color = item.color;
                historyList.appendChild(historyItem);
            });
        }
    }).catch((error) => {
        console.error("❌ ERROR al cargar historial desde Firebase:", error);
    });
}

obtenerMonedas();
cargarHistorial();

// 🔹 Definición de las secciones de la ruleta
const sections = [
    { color: "#FF0000", multiplier: 0.2 },
    { color: "#FFA500", multiplier: 0.5 },
    { color: "#00FF00", multiplier: 1 },
    { color: "#FF0000", multiplier: 0.2 },
    { color: "#FFA500", multiplier: 0.5 },
    { color: "#0000FF", multiplier: 2 },
    { color: "#FFD700", multiplier: 50 }
];

const numSections = sections.length;

// 🔹 Dibujar la ruleta
function drawRoulette() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    const angleStep = (2 * Math.PI) / numSections;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);

    for (let i = 0; i < numSections; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angleStep * i, angleStep * (i + 1));
        ctx.closePath();

        ctx.fillStyle = sections[i].color;
        ctx.fill();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        drawMultiplierText(angleStep * i + angleStep / 2, sections[i].multiplier);
    }

    ctx.restore();
    drawIndicator();
}

// 🔹 Dibujar el texto del multiplicador
function drawMultiplierText(angle, multiplier) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2.5;

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeText(`x${multiplier}`, x, y);
    ctx.fillText(`x${multiplier}`, x, y);
}

// 🔹 Dibujar la flecha indicadora
function drawIndicator() {
    const centerX = canvas.width / 2;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(centerX - 15, 10);
    ctx.lineTo(centerX + 15, 10);
    ctx.lineTo(centerX, 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.stroke();
}

window.onload = () => {
    drawRoulette();
};

// 📌 Función para actualizar las monedas en Firebase
function actualizarMonedas(nuevaCantidad) {
    set(coinsRef, nuevaCantidad).then(() => {
        coins = nuevaCantidad; // ✅ Asegura que la variable local también se actualice
        coinsDisplay.textContent = nuevaCantidad;
        console.log("✅ Monedas actualizadas en Firebase:", nuevaCantidad);
    }).catch((error) => {
        console.error("❌ ERROR al actualizar monedas en Firebase:", error);
    });
}

spinButton.addEventListener("click", spinRoulette);

// 🔹 Lógica para girar la ruleta
function spinRoulette() {
    if (spinning) return;

    let bet = parseInt(betAmountInput.value);
    if (isNaN(bet) || bet < 5 || bet > coins) {
        showMessage("❌ Ingresa Minimo 5 Monedas.", "error");
        return;
    }

    coins -= bet;
    actualizarMonedas(coins);
    showMessage("🎰 ¡Girando la ruleta!", "info");

    spinning = true;
    spinButton.disabled = true; // 🔴 Se desactiva el botón mientras gira

    let spinTime = 3000;
    let startTime = Date.now();

    function animateSpin() {
        let elapsedTime = Date.now() - startTime;
        let rotationSpeed = (elapsedTime / spinTime) * (Math.PI * 4);
        angle += rotationSpeed;

        drawRoulette();

        if (elapsedTime < spinTime) {
            requestAnimationFrame(animateSpin);
        } else {
            spinning = false;
            spinButton.disabled = false; // 🟢 Se reactiva el botón al finalizar
            determineResult(bet);
        }
    }

    requestAnimationFrame(animateSpin);
}

// 🔹 Determina el resultado y actualiza el historial
function determineResult(bet) {
    let normalizedAngle = (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let sectionAngle = (2 * Math.PI) / numSections;
    let winningIndex = Math.floor(((numSections - (normalizedAngle / sectionAngle) + 5.25) % numSections));

    let multiplier = sections[winningIndex].multiplier;
    let winnings = Math.floor(bet * multiplier);
    coins += winnings;

    actualizarMonedas(coins);
    updateHistory(multiplier, sections[winningIndex].color);

    if (winnings > 0) {
        showMessage(`🎉 ¡Ganaste! x${multiplier}, obtuviste ${winnings} monedas.`, "success");
    } else {
        showMessage("😢 No ganaste esta vez, ¡inténtalo de nuevo!", "error");
    }

    spinButton.disabled = false; // 🔵 Asegurar que el botón se active después del giro
}

// 🔹 Guardar historial en Firebase
function updateHistory(multiplier, color) {
    const historyItem = document.createElement("p");
    historyItem.textContent = `x${multiplier}`;
    historyItem.style.color = color;
    historyList.prepend(historyItem);

    get(historyRef).then((snapshot) => {
        let history = snapshot.exists() ? snapshot.val() : [];
        if (!Array.isArray(history)) history = [];

        history.unshift({ multiplier, color });
        if (history.length > 10) history.pop();

        set(historyRef, history).catch((error) => {
            console.error("❌ ERROR al guardar historial en Firebase:", error);
        });
    });
}

// 📢 Mostrar mensajes visuales mejorados
function showMessage(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

// 🔹 Función para cerrar la ventana o redirigir
function exitGame() {
        window.location.href = "index.html"; // ✅ Redirige al menú principal
}

// 🔹 Agregar evento al botón de salida
document.getElementById("exitButton").addEventListener("click", exitGame);
