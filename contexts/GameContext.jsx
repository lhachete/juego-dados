import { createContext, useContext, useState } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [mode, setMode] = useState(null);        // classic | craziest
  const [playType, setPlayType] = useState(null); // manual | virtual
  const [players, setPlayers] = useState(["", ""]);     // lista jugadores
  const [scores, setScores] = useState({});       // { nombre: puntos }
  const [scoresModalVisible, setScoresModalVisible] = useState(false);
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  // Para registrar el orden de selección en la segunda fase
  const [secondPhaseOrder, setSecondPhaseOrder] = useState([]);
  // índice actual de la figura en segunda tanda
  const [secondPhaseStep, setSecondPhaseStep] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const TOTAL_ROUNDS = 12;

  const startGame = () => {
    const initialScores = {};
    players.forEach(p => initialScores[p] = 0);
    setScores(initialScores);
    setIsGameStarted(true);
  };

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

  const resetGame = () => {
    setTurn(0);
    setRound(1);
  }

  const exitGame = () => {
    resetRoundState();
    setPlayers(["", ""]);
    setIsGameStarted(false);
  };

  const finishGame = () => {
    setIsGameStarted(false);
  };

  //virtual-mode
  const addScore = (player, points) => {
    setScores(prev => ({
      ...prev,
      [player]: (prev[player] || 0) + points,
    }));
  };

  const nextTurn = () => {
    setTurn(prevTurn => {
      if (prevTurn + 1 < players.length) {
        return prevTurn + 1;
      } else {
        // Nueva ronda
        setRound(prevRound => prevRound + 1);
        return 0;
      }
    });
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
        TOTAL_ROUNDS,
        scores,
        setScores,
        scoresModalVisible,
        setScoresModalVisible,
        addScore,
        nextTurn,

        turn, setTurn,
        round, setRound,
        secondPhaseOrder, setSecondPhaseOrder,
        secondPhaseStep, setSecondPhaseStep,
        resetRoundState,
        resetWholeGame,

        isGameStarted,
        startGame,
        resetRoundState,
        resetGame,
        exitGame,
        finishGame

      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
