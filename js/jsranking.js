import { db as db2, ref as ref2, get as get2 } from "./firebaseConfig2.js"; 
import { db as db3, ref as ref3, get as get3 } from "./firebaseConfig3.js"; 
import { db as db4, ref as ref4, get as get4 } from "./firebaseConfig4.js"; // 🔹 Agregamos ranking3

// 🔹 Referencias a las tablas en el HTML
const rankingTableBody = document.getElementById("ranking-body");   // Ranking del Laberinto
const rankingTableBody1 = document.getElementById("ranking1-body"); // Ranking del Juego de Puntos
const rankingTableBody2 = document.getElementById("ranking2-body"); // Ranking del Flappy Bird

// 📌 Cargar y mostrar el Ranking del Juego 1 (ranking - Laberinto)
function cargarRanking() {
    const rankingRef = ref2(db2, "ranking");

    get2(rankingRef).then(snapshot => {
        if (snapshot.exists()) {
            let rankingData = Object.values(snapshot.val());

            // Ordenar por tiempo (menor tiempo es mejor)
            rankingData.sort((a, b) => convertirTiempoASegundos(a.tiempo) - convertirTiempoASegundos(b.tiempo));

            actualizarTablaRanking(rankingData, rankingTableBody, true);
        } else {
            console.log("⚠️ No hay datos en ranking.");
        }
    }).catch(error => console.error("❌ Error al cargar ranking:", error));
}

// 📌 Cargar y mostrar el Ranking del Juego 2 (ranking1 - Juego de Puntos)
function cargarRanking1() {
    const rankingRef1 = ref3(db3, "ranking1");

    get3(rankingRef1).then(snapshot => {
        if (snapshot.exists()) {
            let rankingData1 = Object.values(snapshot.val());

            console.log("🔹 Datos obtenidos de ranking1:", rankingData1); // Verificar en consola

            // Ordenar por puntaje de mayor a menor
            rankingData1.sort((a, b) => b.puntaje - a.puntaje);

            actualizarTablaRanking(rankingData1, rankingTableBody1, false);
        } else {
            console.log("⚠️ No hay datos en ranking1.");
        }
    }).catch(error => console.error("❌ Error al cargar ranking1:", error));
}

// 📌 Cargar y mostrar el Ranking del Juego 3 (ranking3 - Flappy Bird)
function cargarRanking2() {
    const rankingRef2 = ref4(db4, "ranking3");

    get4(rankingRef2).then(snapshot => {
        if (snapshot.exists()) {
            let rankingData2 = Object.values(snapshot.val());

            console.log("🔹 Datos obtenidos de ranking3:", rankingData2); // Verificar en consola

            // Ordenar por puntaje de mayor a menor
            rankingData2.sort((a, b) => b.puntaje - a.puntaje);

            actualizarTablaRanking(rankingData2, rankingTableBody2, false);
        } else {
            console.log("⚠️ No hay datos en ranking3.");
        }
    }).catch(error => console.error("❌ Error al cargar ranking3:", error));
}

// 📌 Función para actualizar las tablas de ranking
function actualizarTablaRanking(rankingData, tableBody, esTiempo) {
    tableBody.innerHTML = ""; // Limpiar antes de actualizar

    rankingData.forEach((player, index) => {
        let medalla = "";
        if (index === 0) medalla = "🥇"; // Oro
        else if (index === 1) medalla = "🥈"; // Plata
        else if (index === 2) medalla = "🥉"; // Bronce

        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${medalla} ${index + 1}</td>
            <td>${player.nombre}</td>
            <td>${esTiempo ? player.tiempo : player.puntaje}</td>
        `;
        tableBody.appendChild(row);
    });

    console.log("✅ Ranking actualizado en pantalla.");
}

// 📌 Convertir formato "mm:ss" a segundos para ordenar correctamente (solo para ranking de tiempo)
function convertirTiempoASegundos(tiempo) {
    let [minutos, segundos] = tiempo.split(":").map(Number);
    return minutos * 60 + segundos;
}

// 🔥 Cargar todos los rankings al abrir la página
document.addEventListener("DOMContentLoaded", () => {
    cargarRanking();
    cargarRanking1();
    cargarRanking2();
});
