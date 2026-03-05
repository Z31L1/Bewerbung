/**
 * Stefan Zeilberger Portfolio - Core System Engine
 * Location: Linz / 2026
 */

let isBooted = false;

/** * VERSION 16.6 - THE PYTHON SYNC
 * Synchronisiert auf: ljust(32) [\0 Padding] & [IV+TAG+CIPHER]
 */

async function loadBewerbungSecure() {
    const btn = document.querySelector('.scroll-down-btn');
    const hashContent = window.location.hash.substring(1);
    const KEY_LENGTH = 17;
// Alles VOR den letzten 17 Zeichen ist die Datei (der Matsch)
    const fileId = hashContent.slice(0, -KEY_LENGTH);
    
    // Die letzten exakt 17 Zeichen sind der Key
    const passphrase = hashContent.slice(-KEY_LENGTH);

    if (!hashContent || hashContent.length < KEY_LENGTH) {
        console.error("Ungültiger Passphrase-Länge.");
        btn.ariaDisabled = true;
        return;
    }


    const decrypt = async (fileId) => {
        const res = await fetch(`/assets/secure/${fileId}.enc`);
        
        if (!res.ok) throw new Error(`${fileId}.enc nicht gefunden`);
        
        const base64Data = await res.text();
        const buffer = Uint8Array.from(atob(base64Data.trim()), c => c.charCodeAt(0));
        
        // --- 1. Struktur-Extraktion (Synchron zu Python) ---
        const iv = buffer.slice(0, 12);
        const tag = buffer.slice(12, 28);
        const ciphertext = buffer.slice(28);

        // --- 2. Key-Sync (Null-Byte Padding) ---
        const encoder = new TextEncoder();
        const keyArray = new Uint8Array(32); // Alle 32 Bytes sind initial 0x00
        const encodedPass = encoder.encode(passphrase);
        keyArray.set(encodedPass.slice(0, 32)); // Key reinkopieren

        const key = await crypto.subtle.importKey(
            "raw", keyArray, "AES-GCM", false, ["decrypt"]
        );

        // --- 3. Entschlüsselung (Tag muss ans Ende des Buffers für WebCrypto) ---
        const dataToDecrypt = new Uint8Array([...ciphertext, ...tag]);

        const decBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv, tagLength: 128 },
            key,
            dataToDecrypt
        );
        
        return JSON.parse(new TextDecoder().decode(decBuffer));
    };

    try {
    // Wir nennen das Ergebnis 'daten', um nicht mit der 'fileId' (dem String) zu kollidieren
    const [daten] = await Promise.all([decrypt(fileId)]);
    
    // Injektion mit dem neuen Objektnamen
    document.getElementById('my-absender').innerHTML = `<strong>Zeilberger Stefan</strong><br>Wienerstrasse 230, 4030 Linz<br>Mobil: +43 660 400 68 07 | Email: Z31L1@gmx.at`;
    document.getElementById('dynamic-betreff').innerText = daten.betreff;
    document.getElementById('dynamic-content').innerHTML = daten.text;
    document.getElementById('current-date').innerText = daten.datum || new Date().toLocaleDateString('de-DE');

    console.log("System-Status: Tresorinhalt erfolgreich hydriert.");
} catch (err) {
    console.error("Krypto-GAU:", err);
    const content = document.getElementById('dynamic-content');
    if (content) content.innerHTML = "<span class='error'>System-Fehler: Integrität der Passphrase nicht verifizierbar.</span>";
}
}

document.addEventListener('DOMContentLoaded', loadBewerbungSecure);

// --- 2. SYSTEM-BOOT & SCROLL-LOGIK ---
function bootSystem() {
    if (isBooted) return;
    isBooted = true;
    
    document.body.classList.remove("shutdown-sequence");
    document.body.classList.add("scrolled");
    
    const btn = document.querySelector(".scroll-down-btn");
    if (btn) btn.style.opacity = "0";
    
    console.log("System Online.");
}

// ENTFERNE die shutdownSystem-Logik aus dem window.onscroll!
window.onscroll = function () {
    const scrollPos = window.scrollY;

    const bg = document.getElementById("parallax-bg");
    if (bg) bg.style.transform = `translate3d(0, -${scrollPos * 0.4}px, 0)`;
};

function scrollToLebenslauf() {
    const ziel = document.getElementById("lebenslauf-start");
    
    bootSystem(); 

    // WICHTIG: 200ms warten, damit "display: block" und "height: auto" greifen
    setTimeout(() => {
        const zielNeu = document.getElementById("lebenslauf-start");
        if (zielNeu) {
            zielNeu.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, 200); 
}

// --- 3. MODAL-STEUERUNG (Zeugnisse) ---
function openDualModal(img1, img2 = null) {
    const modal = document.getElementById("zeugnisModal");
    const target1 = document.getElementById("imgTarget1");
    const target2 = document.getElementById("imgTarget2");

    if (!modal || !target1) return;

    target1.src = img1;
    if (img2) {
        target2.src = img2;
        target2.style.display = "block";
    } else {
        target2.style.display = "none";
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    document.getElementById("zeugnisModal").style.display = "none";
    document.body.style.overflow = "auto";
}

// --- 4. INITIALISIERUNG ---
document.addEventListener('DOMContentLoaded', () => {
    loadBewerbungSecure();

    // Intersection Observer für Einblend-Effekte
    const beobachter = new IntersectionObserver(
        (eintraege) => {
            eintraege.forEach((eintrag) => {
                if (eintrag.isIntersecting) eintrag.target.classList.add("sichtbar");
            });
        },
        { threshold: 0.15 }
    );
    document.querySelectorAll(".blatt").forEach((b) => beobachter.observe(b));
});
