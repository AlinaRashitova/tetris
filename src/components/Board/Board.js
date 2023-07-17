import React from 'react';
import './Board.css';

const Board = ({currentTetromino, gameState, deadTetrominos}) => {
  return (
    <div className="board">
      {currentTetromino}
      <div className={`board__window ${(gameState === "pause") ? 'board__window_display' : ''}`}>Pause</div>
      <div className={`board__window ${(gameState === "gameOver") ? 'board__window_display' : ''}`}>Game over</div>
      {deadTetrominos}
    </div>
  )
}

export default Board
