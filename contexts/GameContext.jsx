import { createContext, useContext, useState } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [mode, setMode] = useState(null);        // classic | craziest
  const [playType, setPlayType] = useState(null); // manual | virtual
  const [players, setPlayers] = useState(["",""]);     // lista jugadores
  const [scores, setScores] = useState({});       // { nombre: puntos }

  const resetGame = () => {
    setScores({});
    setPlayers([]);
    setDisabledFaces({});
    setTurn(0);
    setRound(1);
    setSecondPhase(false);
    setSecondPhaseStep(0);
};


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
