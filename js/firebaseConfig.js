// Importa las funciones necesarias desde el SDK de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";

// Configuración de tu Firebase (reemplaza estos valores con los tuyos)
const firebaseConfig = {
    apiKey: "AIzaSyBM2WrxsfHfgCudjgOdMjZTZr6wd7osFnU",
    authDomain: "monedas-e2c12.firebaseapp.com",
    projectId: "monedas-e2c12",
    storageBucket: "monedas-e2c12.appspot.com",
    messagingSenderId: "1001399126941",
    appId: "1:1001399126941:web:82f18d939afd61b6b1fd74",
    measurementId: "G-G4FN43V0VN",
    databaseURL: "https://monedas-e2c12-default-rtdb.firebaseio.com/"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Exportamos la base de datos para usarla en otros archivos
export { db, ref, get, set };
