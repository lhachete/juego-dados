import { createContext, useContext, useState } from "react";
import DADES from "../app/dades.jsx"; // ajusta ruta si hace falta
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
  const [gamePhase, setGamePhase] = useState("first"); // "first" | "second" | "finished"

  const [disabledFaces, setDisabledFaces] = useState({});
  const [usedFaces, setUsedFaces] = useState({}); // { jugador1: [idFigura, idFigura], jugador2: [...] }
  const TOTAL_ROUNDS = 12;

  const startGame = () => {
    const initialScores = {};
    const initialUsedFaces = {};
    const initialDisabled = {};

    players.forEach(p => {
      initialScores[p] = 0;
      initialUsedFaces[p] = [];
    });

    players.forEach(p => {
      initialDisabled[p] = [];
    });

    setDisabledFaces(initialDisabled);
    setScores(initialScores);
    setUsedFaces(initialUsedFaces);
    setIsGameStarted(true);
  };


  const resetRoundState = () => {
    setTurn(0);
    setRound(1);
    setScores({});
    setSecondPhaseOrder([]);
    setSecondPhaseStep(0);
    setGamePhase("first");
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
  

  const addUsedFace = (player, faceId) => {
    setUsedFaces(prev => {
      const prevFaces = prev[player] || [];

      // evitar duplicados
      if (prevFaces.includes(faceId)) return prev;

      return {
        ...prev,
        [player]: [...prevFaces, faceId], // 👈 NUEVA referencia
      };
    });
  };

  // Segunda fase - establecer orden y caras deshabilitadas
  const startSecondPhase = (type) => {
    let order = [];

    if (type === "negras") {
      order = DADES.map(f => f.id).sort((a, b) => a - b);
    } else {
      order = DADES.map(f => f.id).sort((a, b) => b - a);
    }

    setSecondPhaseOrder(order);
    setSecondPhaseStep(0);

    const firstId = order[0];
    const updated = {};

    players.forEach(p => {
      updated[p] = DADES
        .map(f => f.id)
        .filter(id => id !== firstId);
    });

    setDisabledFaces(updated);
  };

  // Estado de caras deshabilitadas en segunda fase
  const advanceSecondPhase = () => {
    const nextStep = secondPhaseStep + 1;

    if (nextStep >= secondPhaseOrder.length) {
      return;
    }

    const nextFigureId = secondPhaseOrder[nextStep];

    const updated = {};
    players.forEach(p => {
      updated[p] = DADES
        .map(f => f.id)
        .filter(id => id !== nextFigureId);
    });

    setDisabledFaces(updated);
    setSecondPhaseStep(nextStep);
  };




  //>>> Avanzar el juego (turno y ronda).
  const advanceGame = () => {
    // ¿último jugador de la ronda?
    if (turn === players.length - 1) {

      // ¿última ronda?
      if (round === TOTAL_ROUNDS) {
        setGamePhase("finished");
        return;
      }

      const nextRound = round + 1;
      setRound(nextRound);
      setTurn(0);

      if (gamePhase === "second") {
        advanceSecondPhase();
      }

      // 🔥 entrada a segunda fase
      if (nextRound === 7) {
        setGamePhase("second");
      }

    } else {
      // siguiente jugador normal
      setTurn(prev => prev + 1);
    }
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
        disabledFaces,
        setDisabledFaces,
        usedFaces,
        addUsedFace,
        addScore,
        startSecondPhase,
        gamePhase,
        advanceGame,

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
