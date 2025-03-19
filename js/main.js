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

// 🔥 Cargar la imagen del personaje
const playerImage = new Image();
playerImage.src = "img/personaje.png";

// 📌 Datos del jugador
let player = { 
    x: canvas.width / 2 - 20, 
    y: canvas.height - 100, 
    width: 120,  // Ajusta el tamaño si es necesario
    height: 120, 
    speed: 6 
};
// Parámetros de los portales
const doorWidth = 150;
const doorHeight = 150;
const doorSpacing = 50;
const startX = (canvas.width - (doorWidth * 4 + doorSpacing * 3)) / 2;

// Cargar imágenes de portales
const portalImages = ["img/mac1.png", "img/mac2.png", "img/mac3.png", "img/mac4.png"].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// Lista de partículas
let particles = [];

// Función para generar partículas en los portales
function createParticles() {
    doors.forEach((door) => {
        for (let i = 0; i < 8; i++) { // Aumentamos la cantidad de partículas
            particles.push({
                x: door.x + door.width / 2, // Aparecen en el centro horizontal del portal
                y: door.y + door.height / 1.2, // Más bajo para que salgan desde atrás
                size: Math.random() * 3 + 1, // Tamaño entre 1 y 4 píxeles
                speedX: (Math.random() - 0.5) * 3, // Movimiento aleatorio en X
                speedY: (Math.random() - 0.5) * 3, // Movimiento aleatorio en Y
                alpha: 1 // Opacidad inicial
            });
        }
    });
}

// Función para actualizar partículas
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha -= 0.02; // Hacer que desaparezcan gradualmente

        if (p.alpha <= 0) {
            particles.splice(i, 1); // Eliminar partículas invisibles
        }
    }
}

// Función para dibujar partículas
function drawParticles() {
    particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `rgba(255, 255, 255, 1)`; // 🔥 Color blanco sólido
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
    });
}



let doors = [
    { x: startX, y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game1", image: portalImages[0] },
    { x: startX + (doorWidth + doorSpacing), y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game2", image: portalImages[1] },
    { x: startX + (doorWidth + doorSpacing) * 2, y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game3", image: portalImages[2] },
    { x: startX + (doorWidth + doorSpacing) * 3, y: canvas.height / 3, width: doorWidth, height: doorHeight, type: "game4", image: portalImages[3] }
];

let coin = { x: Math.random() * (canvas.width - 20), y: Math.random() * (canvas.height - 20), size: 15 };
let collisionStartTime = null;
let hue = 0;

window.onload = function() {
    const rulesButtons = document.querySelectorAll(".rules-btn");
    const canvas = document.getElementById("gameCanvas");
    
    if (!canvas) {
        console.error("❌ ERROR: No se encontró el canvas.");
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();

    // Coordenadas precisas de los portales en el canvas
    const doors = [
        { x: 0.111, y: 0.35 },  // Portal 1 - Esquiva
        { x: 0.345, y: 0.35 }, // Portal 2 - Salta
        { x: 0.58, y: 0.35 },  // Portal 3 - Escapa
        { x: 0.82, y: 0.35 }  // Portal 4 - Apuesta
    ];
    
    

    rulesButtons.forEach((btn, index) => {
        const portal = doors[index];
        btn.style.position = "absolute";
        btn.style.top = `${canvasRect.top + (canvasRect.height * portal.y) - 150}px`; // Ajuste fino hacia arriba
        btn.style.left = `${canvasRect.left + (canvasRect.width * portal.x) - 195}px`; // Ajuste fino al centro
        btn.style.zIndex = "9999"; // Asegura que estén sobre el canvas
    });
};

// Función para alternar la visibilidad de las tarjetas de reglas
function toggleRules(rulesId) {
    let card = document.getElementById(rulesId);

    if (!card) {
        console.warn(`⚠️ No se encontró la tarjeta con ID: ${rulesId}`);
        return;
    }

    // Alternar visibilidad de la tarjeta
    let isVisible = card.classList.contains("active");

    // Ocultar todas las tarjetas antes de abrir la nueva
    document.querySelectorAll(".rules-card").forEach(card => card.classList.remove("active"));

    // Mostrar solo si no estaba visible antes
    if (!isVisible) {
        card.classList.add("active");
    }
}

// Hacer que la función sea accesible globalmente
window.toggleRules = toggleRules;
// 🔥 Variable de opacidad para el efecto de parpadeo de la moneda
let coinOpacity = 1;
let coinOpacityDirection = 1; // Dirección del cambio de opacidad

// 📌 Modificar la función para dibujar el personaje en lugar del cubo
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawParticles(); // 🔥 Dibujar partículas antes de los portales

    doors.forEach((door) => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.drawImage(door.image, door.x, door.y, door.width, door.height);
        ctx.restore();
    });

    // 📌 Dibujar la moneda con efecto de parpadeo
    ctx.globalAlpha = coinOpacity; 
    ctx.font = "28px Arial"; 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🪙", coin.x, coin.y);
    ctx.globalAlpha = 1;

    // 📌 Dibujar el personaje en lugar del cubo azul
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        console.warn("⚠️ La imagen del personaje aún no se ha cargado.");
    }
}
// 🔥 Función para actualizar la opacidad y hacer el efecto de parpadeo
function updateCoinOpacity() {
    coinOpacity += coinOpacityDirection * 0.02; // Cambia la opacidad gradualmente
    if (coinOpacity >= 1) {
        coinOpacityDirection = -1; // Reducir opacidad
    } else if (coinOpacity <= 0.5) {
        coinOpacityDirection = 1; // Aumentar opacidad
    }
}

function updateGlow() {
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

// 🔄 Integrar la actualización de opacidad en el loop principal
setInterval(() => {
    updateGlow();
    createParticles(); // 🔥 Generar nuevas partículas en cada ciclo
    updateParticles(); // 🔥 Mover y eliminar partículas viejas
    updateCoinOpacity(); // 🔥 Actualizar el parpadeo de la moneda
    drawGame();
    checkCollisions();
}, 100);

document.getElementById("scoreboardButton").addEventListener("click", function () {
    window.location.href = "ranking.html";
});

// 📌 Verifica si el usuario viene de otra página
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("instructionsModal");

    // Si el usuario ya ha visitado la página en esta sesión, no mostramos el modal
    if (sessionStorage.getItem("visited")) {
        modal.style.display = "none";
    } else {
        // Si es la primera visita, mostramos el modal y marcamos la sesión como visitada
        modal.style.display = "flex";
        sessionStorage.setItem("visited", "true");
    }
});

// 📌 Agregar la funcionalidad de movimiento con las teclas
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
        player.y -= player.speed;
    } else if (event.key === "ArrowDown") {
        player.y += player.speed;
    } else if (event.key === "ArrowLeft") {
        player.x -= player.speed;
    } else if (event.key === "ArrowRight") {
        player.x += player.speed;
    }
    drawGame();
});

// 📌 Ejecutar la función al cargar la página
document.addEventListener("DOMContentLoaded", bloquearMovil);


// 📌 Función para cerrar el modal manualmente
function closeInstructions() {
    document.getElementById("instructionsModal").style.display = "none";
}

// Hacer accesible la función globalmente
window.closeInstructions = closeInstructions;

document.addEventListener("keydown", handleKeyDown);
drawGame();
