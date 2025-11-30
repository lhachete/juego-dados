import { createContext, useContext, useState } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [mode, setMode] = useState(null);        // classic | craziest
  const [playType, setPlayType] = useState(null); // manual | virtual
  const [players, setPlayers] = useState(["", ""]);     // lista jugadores
  const [scores, setScores] = useState({});       // { nombre: puntos }

  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);


  // Para registrar el orden de selección en la segunda fase
  const [secondPhaseOrder, setSecondPhaseOrder] = useState([]);
  // índice actual de la figura en segunda tanda
  const [secondPhaseStep, setSecondPhaseStep] = useState(0);

  const resetRoundState = () => {
    setTurn(0);
    setRound(1);
    setScores({});
    setSecondPhaseOrder([]);
    setSecondPhaseStep(0);
  };

  const resetWholeGame = () => {
    setMode(null);
    setPlayType(null);
    setPlayers(["", ""]);
    setScores({});
    setTurn(0);
    setRound(1);
    setSecondPhaseOrder([]);
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

        turn, setTurn,
        round, setRound,
        secondPhaseOrder, setSecondPhaseOrder,
        secondPhaseStep, setSecondPhaseStep,
        resetRoundState,
        resetWholeGame,

      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
