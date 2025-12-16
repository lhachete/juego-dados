
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


export { validatePlayers };