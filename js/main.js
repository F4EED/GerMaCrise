// Horloge sans secondes
function updateClock() {
  const now = new Date();

  const optionsDate = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const optionsHeure = { hour: "2-digit", minute: "2-digit" }; // PAS de seconde

  const dateStr = now.toLocaleDateString("fr-FR", optionsDate);
  const timeStr = now.toLocaleTimeString("fr-FR", optionsHeure);

  document.getElementById("horloge").textContent = `${dateStr} - ${timeStr}`;
}

// Mettre à jour tout de suite au chargement
updateClock();

// Rafraîchir toutes les minutes
setInterval(updateClock, 60000);
