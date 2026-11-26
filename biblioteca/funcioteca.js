 
const validatePlayers = (players) => {
    const trimmed = players.map(p => p.trim());
 
    if (trimmed.some(p => p === "")) {
        return {
            valid: false,
            error: "Todos los jugadores deben tener nombre.",
        };
    }
 
    const normalized = trimmed.map(p => p.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
        return {
            valid: false,
            error: "Los nombres de los jugadores no pueden repetirse.",
        };
    }
 
    return { valid: true };
};
 
 
/**
 * Jugador que decide el sentido de la segunda tanda: el que va ganando.
 * Si hay empate en cabeza, decide el primero de los empatados en el orden
 * de turno (el que juega antes).
 */
const getSecondPhaseChooser = (players, scores) => {
    let chooser = players[0];
    players.forEach((p) => {
        if ((scores[p] || 0) > (scores[chooser] || 0)) chooser = p;
    });
    return chooser;
};
 
export { validatePlayers, getSecondPhaseChooser };