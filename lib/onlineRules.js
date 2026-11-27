// lib/onlineRules.js
// Copia de las reglas del servidor (supabase/02_fase2_partida.sql) para que
// la pantalla sepa qué botones enseñar sin preguntar. Quien manda es el
// servidor: si algo de aquí no cuadra, la jugada simplemente se rechaza.

export const ACE = 6;
export const TOTAL_ROUNDS = 12;

export const currentPlayer = (s) => s?.players?.[s.turn] ?? null;

export const isLeft = (s, id) => (s?.left ?? []).includes(id);

// Figuras que puede anotar el jugador ahora.
export const allowedFaces = (s, id) => {
    if (!s) return [];
    if (s.phase === "second" && s.order) return [s.order[s.round - 7]];
    const used = s.used_faces?.[id] ?? [];
    return [1, 2, 3, 4, 5, 6].filter((f) => !used.includes(f));
};

// ¿Puede hacer la tirada extra (5 iguales guardados y tiradas por delante)?
export const bonusFaceAvailable = (s, id) => {
    const dice = s?.dice ?? [];
    if (!s || s.rolls_left <= 0 || dice.length !== 5) return null;
    if (!dice.every((d) => d.locked)) return null;
    const nonAces = [...new Set(dice.map((d) => d.face).filter((f) => f !== ACE))];
    if (nonAces.length > 1) return null;
    const base = nonAces[0] ?? ACE;
    if (!allowedFaces(s, id).includes(base)) return null;
    if (s.bonus_face != null && s.bonus_face !== base) return null;
    return base;
};

// ¿Se puede guardar/soltar este dado? (igual que game_toggle_die)
export const canToggleDie = (s, index) => {
    const d = s?.dice?.[index];
    if (!d || d.face == null) return false;
    if (d.locked) return true;
    if (s.bonus_face != null) return d.face === s.bonus_face || d.face === ACE;
    if (s.rolls_left > 0) return true;
    const firstNonAce = s.dice.find((x) => x.locked && x.face !== ACE)?.face;
    return firstNonAce == null || d.face === ACE || d.face === firstNonAce;
};

// Lo que se anotaría con los dados guardados ahora mismo.
export const scorePreview = (s) => {
    const selected = (s?.dice ?? []).filter((d) => d.locked);
    const bonus = s?.bonus_points ?? 0;
    if (selected.length === 0 && bonus === 0) {
        return { zero: true, count: 0, total: 0, bonus: 0, base: null };
    }
    const nonAce = selected.find((d) => d.face !== ACE)?.face;
    const base = s.bonus_face ?? nonAce ?? ACE;
    return {
        zero: false,
        count: selected.length,
        faces: selected.map((d) => d.face),
        base,
        bonus,
        total: bonus + selected.length * base,
    };
};
