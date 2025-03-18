import { db, ref, get } from "./firebaseConfig2.js";

async function cargarTienda() {
    console.log("Cargando skins desde Realtime Database...");

    const tiendaDiv = document.getElementById("tienda");
    tiendaDiv.innerHTML = ""; // Limpiar antes de agregar nuevos elementos

    const skinsRef = ref(db, "skins");
    const snapshot = await get(skinsRef);

    if (!snapshot.exists()) {
        console.log("No hay skins en Realtime Database.");
        return;
    }

    const skins = snapshot.val();
    Object.keys(skins).forEach(skinID => {
        let skin = skins[skinID];
        let div = document.createElement("div");
        div.classList.add("skin");
        div.textContent = `${skin.nombre} - ${skin.precio} monedas`;
        tiendaDiv.appendChild(div);
    });

    console.log("Skins cargadas correctamente.");
}

cargarTienda();
