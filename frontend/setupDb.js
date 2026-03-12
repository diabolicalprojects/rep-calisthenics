
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBbGzfDHHotwDmoFx0REqidjI9UGxZ0NAU",
    authDomain: "rep-gym-96e22.firebaseapp.com",
    projectId: "rep-gym-96e22",
    storageBucket: "rep-gym-96e22.firebasestorage.app",
    messagingSenderId: "1094506780106",
    appId: "1:1094506780106:web:bceeff606fbec619846b33"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setup() {
    console.log("Cleaning up members...");
    const membersSnap = await getDocs(collection(db, "members"));
    for (const d of membersSnap.docs) {
        await deleteDoc(doc(db, "members", d.id));
    }

    console.log("Cleaning up memberships...");
    const membershipsSnap = await getDocs(collection(db, "memberships"));
    for (const d of membershipsSnap.docs) {
        await deleteDoc(doc(db, "memberships", d.id));
    }

    console.log("Creating new memberships...");
    const m1 = await addDoc(collection(db, "memberships"), {
        name: "Plan Básico",
        price: 500,
        duration: 30,
        description: "Acceso ilimitado a área de calistenia, clases grupales nivel 1, y uso de regaderas.",
        createdAt: serverTimestamp()
    });

    const m2 = await addDoc(collection(db, "memberships"), {
        name: "Piso Libre",
        price: 450,
        duration: 30,
        description: "Entrenamiento libre en el área de fuerza y calistenia. Horario extendido de lunes a sábado.",
        createdAt: serverTimestamp()
    });

    console.log("Creating default member...");
    await addDoc(collection(db, "members"), {
        name: "Usuario Demo",
        email: "demo@repcals.com",
        phone: "4491234567",
        plan: "Plan Básico",
        status: "Activo",
        createdAt: serverTimestamp()
    });

    console.log("Setup complete!");
}

setup().catch(console.error);
