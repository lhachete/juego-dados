import { createContext, useContext, useState } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [mode, setMode] = useState(null);        // classic | craziest
  const [playType, setPlayType] = useState(null); // manual | virtual
  const [players, setPlayers] = useState(["",""]);     // lista jugadores
  const [scores, setScores] = useState({});       // { nombre: puntos }

  return (
    <GameContext.Provider
      value={{
        mode,
        setMode,
        playType,
        setPlayType,
        players,
        setPlayers,
        scores,
        setScores,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
