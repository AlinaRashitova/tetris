import React, { useRef, useState, useEffect } from 'react'
import Board from '../Board/Board'
import Tetromino from '../Tetromino/Tetromino';
import Block from '../Block/Block';
import './App.css'

const App = () => {
  // Текущее тетромино
  const [currentTetromino, setCurrentTetromino] = useState(null);
  const currentTetrominoRef = useRef(null);

  // Следующее тетромино
  const [nextTetromino, setNextTetromino] = useState(null);
  const nextTetrominoRef = useRef(null);

  // Уровень
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);

  // Очки
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  // Лучшие очки
  const [topScores, setTopScores] = useState([]);
  const topScoresRef = useRef([]);

  // Количество удаленных линий
  const [deletedLines, setDeletedLines] = useState(0);
  const deletedLinesRef = useRef(0);

  // Состояние игры
  const [gameState, setGameState] = useState("running");
  const gameStateRef = useRef("running");

  // Мёртвые тетромино
  const [deadTetrominos, setDeadTetrominos] = useState([]);
  const deadTetrominosRef = useRef([]);

  const intervalIdRef = useRef(null);

  // Музыка
  const backgroundMusicRef = useRef(new Audio("background.mp3"));
  const dropMusicRef = useRef(new Audio("drop.mp3"));
  const gameOverMusicRef = useRef(new Audio("game-over.mp3"));
  const levelUpMusicRef = useRef(new Audio("level-up.mp3"));
  const moveHorizontallyMusicRef = useRef(new Audio("move-horizontally.mp3"));
  const pauseMusicRef = useRef(new Audio("pause.mp3"));
  const rotateMusicRef = useRef(new Audio("rotate.mp3"));
  const sliceMusicRef = useRef(new Audio("slice.mp3"));

  useEffect(() => {
    const newNextTetromino = generateTetromino(getRandomTetrominoType(), 0, 0, 60, getRandomTetrominoColor());
    const newTetromino = generateTetromino(getRandomTetrominoType(), 0, 0, 60, getRandomTetrominoColor());
    setNextTetromino(newNextTetromino);
    nextTetrominoRef.current = newNextTetromino;
    setCurrentTetromino(newTetromino);
    currentTetrominoRef.current = newTetromino;
    const userObject = JSON.parse(localStorage.getItem("userObject"));
    if (userObject) {
      setTopScores(userObject);
      topScoresRef.current = userObject;
    }
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  useEffect(() => {
    if (gameState === "running") {
      intervalIdRef.current = setInterval(() => moveTetromino("down"), increaseSpeed());
    } else if (gameState === "gameOver" || gameState === "pause") {
      backgroundMusicRef.current.pause();
      if (gameState === "gameOver") {
        play(gameOverMusicRef.current, true);
      }
      clearInterval(intervalIdRef.current);
    }
  }, [gameState]);

  function keyHandler(event) {
    if (event.key === "ArrowRight") {
      moveTetromino("right");
    } else if (event.key === "ArrowLeft") {
      moveTetromino("left");
    } else if (event.key === "ArrowDown") {
      moveTetromino("down");
    } else if (event.key === "ArrowLeft") {
      moveTetromino("left");
    } else if (event.code === "KeyX") {
      rotateTetromino("x");
    } else if (event.code === "KeyZ") {
      rotateTetromino("z");
    } else if (event.key === "Enter") {
      if (gameStateRef.current === "running") {
        setGameState("pause");
        gameStateRef.current = "pause";
        play(pauseMusicRef.current, true);
      } else if (gameStateRef.current === "pause") {
        play(pauseMusicRef.current, true);
        setGameState("running");
        gameStateRef.current = "running";
      }
    }
  }

  const play = (audio, force) => {
    if (force) {
      if (!audio.paused) {
        audio.load()
      }
    } else {
      audio.loop = true;
    }
    audio.play().catch(err => console.log(err));
  }

  const getRandomTetrominoType = () => {
    const tetrominosTypes = ["T", "L", "J", "O", "I", "Z", "S"];
    return tetrominosTypes[Math.trunc(Math.random() * tetrominosTypes.length)];
  }

  const getRandomTetrominoColor = () => {
    const blockColorR = Math.trunc(Math.random() * 256);
    const blockColorG = Math.trunc(Math.random() * 256);
    const blockColorB = Math.trunc(Math.random() * 256);
    return "rgb(" + blockColorR + "," + blockColorG + "," + blockColorB + "), " + "rgb(" + (blockColorR - 50) + "," + (blockColorG - 50) + "," + (blockColorB - 50) + ")";
  }

  const convertBlockCoordinates = (block, tetromino) => {
    const absoluteTop = block.props.top + tetromino.props.top;
    const absoluteLeft = block.props.left + tetromino.props.left;
    return [absoluteTop, absoluteLeft];
  }

  const hasLegalMoves = (tetromino) => {
    return tetromino.props.children.every((block) => {
      const [absoluteTop, absoluteLeft] = convertBlockCoordinates(block, tetromino);
      const isBlockInsideBoard = absoluteTop >= 0 && absoluteTop <= 570 && absoluteLeft >= 0 && absoluteLeft <= 270;
      const isBlockNotOverlapDeadBlocks = deadTetrominosRef.current.every((deadTetromino) => (deadTetromino.props.children.every((deadBlock) => {
        const [absoluteDeadTop, absoluteDeadLeft] = convertBlockCoordinates(deadBlock, deadTetromino);
        return ((absoluteDeadTop !== absoluteTop) || (absoluteDeadLeft !== absoluteLeft))
      })))
      return (isBlockInsideBoard && isBlockNotOverlapDeadBlocks)
    })
  }

  const increaseScoreAndLevel = (topToDelete) => {
    const allDeletedLines = deletedLinesRef.current + topToDelete.length;
    setDeletedLines(allDeletedLines);
    deletedLinesRef.current = allDeletedLines;

    const increaseLevel = Math.trunc(allDeletedLines / 10);
    if (increaseLevel > levelRef.current) {
      play(levelUpMusicRef.current, true);
    }
    setLevel(increaseLevel);
    levelRef.current = increaseLevel;
    clearInterval(intervalIdRef.current);
    intervalIdRef.current = setInterval(() => moveTetromino("down"), increaseSpeed());

    if (topToDelete.length > 0) {
      const numberOfPointsDeletedLines = [40, 100, 300, 1200];
      const increaseScore = scoreRef.current + (numberOfPointsDeletedLines[topToDelete.length - 1] * (levelRef.current + 1));
      setScore(increaseScore);
      scoreRef.current = increaseScore;
    }
  }

  const increaseSpeed = () => {
    const framesByLevel = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    const framesPerMove = (levelRef.current > framesByLevel.length) ? 1 : framesByLevel[levelRef.current];
    const currentSpeed = 1000 / 60 * framesPerMove;
    return currentSpeed;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const moveTetromino = (type) => {
    if (currentTetrominoRef.current && gameStateRef.current === "running") {
      if (type === "left") {
        const newMovedTetromino = generateTetromino(currentTetrominoRef.current.props.type, currentTetrominoRef.current.props.rotation, currentTetrominoRef.current.props.top, currentTetrominoRef.current.props.left - 30, currentTetrominoRef.current.props.backgroundColor);
        if (hasLegalMoves(newMovedTetromino)) {
          setCurrentTetromino(newMovedTetromino);
          currentTetrominoRef.current = newMovedTetromino;
          play(moveHorizontallyMusicRef.current, true);
        }
      } else if (type === "right") {
        const newMovedTetromino = generateTetromino(currentTetrominoRef.current.props.type, currentTetrominoRef.current.props.rotation, currentTetrominoRef.current.props.top, currentTetrominoRef.current.props.left + 30, currentTetrominoRef.current.props.backgroundColor);
        if (hasLegalMoves(newMovedTetromino)) {
          setCurrentTetromino(newMovedTetromino);
          currentTetrominoRef.current = newMovedTetromino;
          play(moveHorizontallyMusicRef.current, true);
        }
      } else if (type === "down") {
        if (backgroundMusicRef.current.paused) {
          play(backgroundMusicRef.current);
        }
        const newMovedTetromino = generateTetromino(currentTetrominoRef.current.props.type, currentTetrominoRef.current.props.rotation, currentTetrominoRef.current.props.top + 30, currentTetrominoRef.current.props.left, currentTetrominoRef.current.props.backgroundColor);
        if (hasLegalMoves(newMovedTetromino)) {
          setCurrentTetromino(newMovedTetromino);
          currentTetrominoRef.current = newMovedTetromino;
        } else {
          if (hasLegalMoves(nextTetrominoRef.current)) {
            const copyDeadTetrominos = [...deadTetrominosRef.current];
            copyDeadTetrominos.push(currentTetrominoRef.current);
            setCurrentTetromino(nextTetrominoRef.current);
            currentTetrominoRef.current = nextTetrominoRef.current;
            play(dropMusicRef.current, true);
            const newNextTetromino = generateTetromino(getRandomTetrominoType(), 0, 0, 60, getRandomTetrominoColor());
            setNextTetromino(newNextTetromino);
            nextTetrominoRef.current = newNextTetromino;

            const deadBlocksTop = copyDeadTetrominos.flatMap((tetromino) => tetromino.props.children.map((block) => {
              const [blockAbsoluteTop] = convertBlockCoordinates(block, tetromino);
              return blockAbsoluteTop;
            }))

            const topToDelete = Array.from(
              deadBlocksTop
                .reduce((accumulator, currentValue) => accumulator.set(currentValue, accumulator.has(currentValue) ? accumulator.get(currentValue) + 1 : 1), new Map())
            ).filter(([top, count]) => count === 10).map(([top, count]) => top)
            increaseScoreAndLevel(topToDelete);

            if (topToDelete.length > 0) {
              play(sliceMusicRef.current, true);
            }

            const newDeadTetrominosBlink = copyDeadTetrominos.map((tetromino, index) => {
              const newBlocks = tetromino.props.children.map((block) => {
                const [blockAbsoluteTop] = convertBlockCoordinates(block, tetromino)
                if (topToDelete.includes(blockAbsoluteTop)) {
                  return <Block top={block.props.top} left={block.props.left} key={block.key} backgroundColor={block.props.backgroundColor} isBlinkingBlock={true} />
                } else {
                  return block;
                }
              })
              return <Tetromino top={tetromino.props.top} left={tetromino.props.left} type={tetromino.props.type} rotation={tetromino.props.rotation} key={index} backgroundColor={tetromino.props.backgroundColor}>{newBlocks}</Tetromino>
            })
            setDeadTetrominos(newDeadTetrominosBlink);

            sleep(1000).then(() => {
              const newDeadTetrominos = copyDeadTetrominos.flatMap((tetromino, index) => {
                const newBlocks = tetromino.props.children.flatMap((block) => {
                  const [blockAbsoluteTop] = convertBlockCoordinates(block, tetromino)

                  if (topToDelete.includes(blockAbsoluteTop)) {
                    return [];
                  } else {
                    const shiftLines = topToDelete.filter((top) => top > blockAbsoluteTop).length;
                    if (shiftLines === 0) {
                      return block;
                    } else {
                      return <Block top={block.props.top + (30 * shiftLines)} left={block.props.left} key={block.key} backgroundColor={block.props.backgroundColor} />
                    }
                  }
                })
                if (newBlocks.length === 0) {
                  return [];
                } else {
                  return [<Tetromino top={tetromino.props.top} left={tetromino.props.left} type={tetromino.props.type} rotation={tetromino.props.rotation} key={index} backgroundColor={tetromino.props.backgroundColor} >
                    {newBlocks}
                  </Tetromino>]
                }

              })
              setDeadTetrominos(newDeadTetrominos);
              deadTetrominosRef.current = newDeadTetrominos;
            });
          } else {
            setGameState("gameOver");
            gameStateRef.current = "gameOver";
            if (scoreRef.current > 0 && (topScoresRef.current.length < 10 || topScoresRef.current.some(element => element[1] < scoreRef.current))) {
              const userName = prompt("What is your name?");
              if (userName) {
                const userObject = [userName, scoreRef.current];
                topScoresRef.current.push(userObject);
                topScoresRef.current.sort(([name1, score1], [name2, score2]) => score2 - score1);
                topScoresRef.current = topScoresRef.current.slice(0, 10);
                setTopScores(topScoresRef.current);
                localStorage.setItem("userObject", JSON.stringify(topScoresRef.current));
              }
            }
          }
        }
      }
    }
  }

  const rotateTetromino = (rotation) => {
    if (currentTetrominoRef.current && gameStateRef.current === "running") {
      if (rotation === "x") {
        const newRotatedTetromino = generateTetromino(currentTetrominoRef.current.props.type, (currentTetrominoRef.current.props.rotation + 90) % 360, currentTetrominoRef.current.props.top, currentTetrominoRef.current.props.left, currentTetrominoRef.current.props.backgroundColor);
        hasLegalMoves(newRotatedTetromino);
        setCurrentTetromino(newRotatedTetromino);
        currentTetrominoRef.current = newRotatedTetromino;
        play(rotateMusicRef.current, true);
      } else if (rotation === "z") {
        const newRotatedTetromino = generateTetromino(currentTetrominoRef.current.props.type, (currentTetrominoRef.current.props.rotation === 0 ? 360 : currentTetrominoRef.current.props.rotation) - 90, currentTetrominoRef.current.props.top, currentTetrominoRef.current.props.left, currentTetrominoRef.current.props.backgroundColor);
        hasLegalMoves(newRotatedTetromino);
        setCurrentTetromino(newRotatedTetromino);
        currentTetrominoRef.current = newRotatedTetromino;
        currentTetrominoRef.current = newRotatedTetromino;
        play(rotateMusicRef.current, true);
      }
    }
  }

  const generateTetromino = (type, rotation, top, left, color) => {
    let tetromino = null;
    if (type === "T") {
      if (rotation === 0) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={0} left={30} key={1} backgroundColor={color} />
          <Block top={0} left={60} key={2} backgroundColor={color} />
          <Block top={30} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 90) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={30} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={60} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 180) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={30} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={30} left={60} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 270) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={60} left={0} key={2} backgroundColor={color} />
          <Block top={30} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      }
    } else if (type === "L") {
      if (rotation === 0) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={0} left={30} key={1} backgroundColor={color} />
          <Block top={0} left={60} key={2} backgroundColor={color} />
          <Block top={30} left={0} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 90) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={0} left={30} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={60} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 180) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={60} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={30} left={60} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 270) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={60} left={0} key={2} backgroundColor={color} />
          <Block top={60} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      }
    } else if (type === "J") {
      if (rotation === 0) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} i>
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={0} left={30} key={1} backgroundColor={color} />
          <Block top={0} left={60} key={2} backgroundColor={color} />
          <Block top={30} left={60} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 90) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={30} key={0} backgroundColor={color} />
          <Block top={30} left={30} key={1} backgroundColor={color} />
          <Block top={60} left={0} key={2} backgroundColor={color} />
          <Block top={60} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 180) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={30} left={60} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 270) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={0} left={30} key={1} backgroundColor={color} />
          <Block top={30} left={0} key={2} backgroundColor={color} />
          <Block top={60} left={0} key={3} backgroundColor={color} />
        </Tetromino>
      }
    } else if (type === "S") {
      if (rotation === 0 || rotation === 180) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={30} key={0} backgroundColor={color} />
          <Block top={0} left={60} key={1} backgroundColor={color} />
          <Block top={30} left={0} key={2} backgroundColor={color} />
          <Block top={30} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 90 || rotation === 270) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={60} left={30} key={3} backgroundColor={color} />
        </Tetromino>
      }
    } else if (type === "Z") {
      if (rotation === 0 || rotation === 180) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={0} left={30} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={30} left={60} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 90 || rotation === 270) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={30} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={30} left={30} key={2} backgroundColor={color} />
          <Block top={60} left={0} key={3} backgroundColor={color} />
        </Tetromino>
      }
    } else if (type === "I") {
      if (rotation === 0 || rotation === 180) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={30} left={0} key={1} backgroundColor={color} />
          <Block top={60} left={0} key={2} backgroundColor={color} />
          <Block top={90} left={0} key={3} backgroundColor={color} />
        </Tetromino>
      } else if (rotation === 90 || rotation === 270) {
        tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
          <Block top={0} left={0} key={0} backgroundColor={color} />
          <Block top={0} left={30} key={1} backgroundColor={color} />
          <Block top={0} left={60} key={2} backgroundColor={color} />
          <Block top={0} left={90} key={3} backgroundColor={color} />
        </Tetromino>
      }
    } else if (type === "O") {
      tetromino = <Tetromino top={top} left={left} type={type} rotation={rotation} backgroundColor={color} >
        <Block top={0} left={0} key={0} backgroundColor={color} />
        <Block top={0} left={30} key={1} backgroundColor={color} />
        <Block top={30} left={0} key={2} backgroundColor={color} />
        <Block top={30} left={30} key={3} backgroundColor={color} />
      </Tetromino>
    }
    return tetromino;
  }

  return (
    <div className="app">
      <div className="app__info">
        <div className="app__info_container app__info_level">
          <div className="app__info_text">
            Level
          </div>
          <div className="app__info_number">
            {level}
          </div>
        </div>
        <div className="app__info_container app__info_score">
          <div className="app__info_text">
            Score
          </div>
          <div className="app__info_number">
            {score}
          </div>
        </div>
        <div className="app__info_container app__info_deletedLines">
          <div className="app__info_text">
            Lines
          </div>
          <div className="app__info_number">
            {deletedLines}
          </div>
        </div>
      </div>
      <Board currentTetromino={currentTetromino} gameState={gameState} deadTetrominos={deadTetrominos} />
      <div className="app__info">
        <div className="app__info_container app__info_nextTetromino">
          <div className="app__info_text">
            Next
          </div>
          <div className="app__info_tetromino">
            {nextTetromino}
          </div>
        </div>
        <div className="app__info_container app__info_topScores">
          <table className="app__info_table">
            <caption className="app__info_table-caption">Top scores</caption>
            {topScores.map(([name, score]) => <tr><td>{name}</td><td>{score}</td></tr>)}
          </table>
        </div>
      </div>
    </div>
  )
}

export default App
