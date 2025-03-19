import { db, ref, get, set, push } from "./firebaseConfig2.js";

const rankingRef = ref(db, "ranking");

get(rankingRef).then(snapshot => {
    if (snapshot.exists()) {
        console.log(snapshot.val());
    }
});

// Configuración del canvas y contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 600;

// Configuración del laberinto
const cols = 22;
const rows = 22;
const cellSize = canvas.width / cols;

// Laberinto fijo con una única ruta hacia la salida
const maze = [
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0],
    [1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0],
    [0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0],
    [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0]
  ];

  // 🔹 Cargar la imagen del personaje
const playerImage = new Image();
playerImage.src = "img/personaje.png";

// Personaje
const player = {
  x: 0,
  y: 0,
  size: cellSize * 0.8,
};

// Configuración del Timer
let timerSeconds = 0;
let timerElement = document.getElementById("timer");

function updateTimer() {
  let minutes = Math.floor(timerSeconds / 60);
  let seconds = timerSeconds % 60;
  timerElement.textContent = 
      (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  timerSeconds++;
}

let timerInterval = setInterval(updateTimer, 1000); // Inicia el temporizador

// Función para cargar el ranking desde Firebase y actualizar pantalla
function cargarRankingDesdeFirebase() {
  const rankingRef = ref(db, "ranking");

  get(rankingRef).then(snapshot => {
      if (snapshot.exists()) {
          let rankingData = Object.entries(snapshot.val()).map(([key, value]) => ({
              id: key,
              ...value
          }));

          rankingData.sort((a, b) => convertirTiempoASegundos(a.tiempo) - convertirTiempoASegundos(b.tiempo));

          actualizarRankingEnPantalla(rankingData);
      } else {
          console.log("No hay datos de ranking en la base de datos.");
      }
  }).catch(error => console.error("Error al cargar el ranking:", error));
}

// Convierte un string "mm:ss" en segundos
function convertirTiempoASegundos(tiempo) {
  let [minutos, segundos] = tiempo.split(":").map(Number);
  return minutos * 60 + segundos;
}

// Función para actualizar el ranking en el HTML
function actualizarRankingEnPantalla(rankingData) {
  let rankingList = document.getElementById("ranking-list");
  rankingList.innerHTML = ""; 

  rankingData.forEach((player, index) => {
      let li = document.createElement("li");
      li.textContent = `${index + 1}. ${player.nombre} - ${player.tiempo}`;
      rankingList.appendChild(li);
  });

  console.log("Ranking actualizado en pantalla.");
}

// Movimiento del personaje y detección de llegada a la meta
window.addEventListener("keydown", (event) => {
  let newX = player.x;
  let newY = player.y;

  if (event.key === "ArrowUp") newY--;
  if (event.key === "ArrowDown") newY++;
  if (event.key === "ArrowLeft") newX--;
  if (event.key === "ArrowRight") newX++;

  if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && maze[newY][newX] === 0) {
      player.x = newX;
      player.y = newY;
      drawGame();
  }

  if (player.x === cols - 1 && player.y === rows - 1) {
    clearInterval(timerInterval); // Detiene el temporizador
    
    let nombreUsuario = prompt("¡Has ganado! Ingresa tu nombre:");
    
    if (nombreUsuario) {
        let tiempoFinal = timerElement.textContent;
        registrarTiempoEnRanking(nombreUsuario, tiempoFinal);
        
        // Redirigir al index.html después de registrar el tiempo
        alert("¡Tiempo guardado! Serás redirigido al inicio.");
        window.location.href = "index.html";
    }
}

});

// Función para registrar el tiempo en Firebase
function registrarTiempoEnRanking(nombreUsuario, tiempo) {
  const rankingRef = ref(db, "ranking");
  const nuevoRegistroRef = push(rankingRef);

  set(nuevoRegistroRef, {
      nombre: nombreUsuario,
      tiempo: tiempo
  }).then(() => {
      console.log("Tiempo registrado en Firebase con éxito.");
      cargarRankingDesdeFirebase(); 
  }).catch(error => {
      console.error("Error al registrar el tiempo:", error);
  });
}

// Dibujar la salida parpadeante
let exitBlinkState = true;
setInterval(() => {
  exitBlinkState = !exitBlinkState;
  drawGame();
}, 500);

function drawExit() {
  const exitX = (cols - 1) * cellSize;
  const exitY = (rows - 1) * cellSize;
  ctx.fillStyle = exitBlinkState ? "white" : "gray";
  ctx.fillRect(exitX, exitY, cellSize, cellSize);
}

// Dibujar el laberinto y las paredes visibles en la luz del personaje
function drawMaze() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let dx = x - player.x;
      let dy = y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2.5) {
        if (maze[y][x] === 1) {
          ctx.fillStyle = "rgba(7, 30, 73, 0.8)"; // Color de las paredes
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Dibujar el personaje con iluminación
// 🔹 Dibujar el personaje con la imagen en lugar del recuadro rojo
function drawPlayer() {
  const lightRadius = cellSize * 2;
  const gradient = ctx.createRadialGradient(
    player.x * cellSize + cellSize / 2,
    player.y * cellSize + cellSize / 2,
    cellSize / 4,
    player.x * cellSize + cellSize / 2,
    player.y * cellSize + cellSize / 2,
    lightRadius
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🔹 Dibujar el personaje con la imagen en lugar del rectángulo rojo
  if (playerImage.complete) {
    ctx.drawImage(
      playerImage,
      player.x * cellSize + (cellSize - player.size) / 2,
      player.y * cellSize + (cellSize - player.size) / 2,
      player.size,
      player.size
    );
  } else {
    console.warn("⚠️ La imagen del personaje aún no se ha cargado.");
  }
}


// Dibujar todo el juego
function drawGame() {
  drawMaze();
  drawExit();
  drawPlayer();
}

drawGame();
cargarRankingDesdeFirebase();
