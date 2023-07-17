import React from 'react'
import './Tetromino.css'

const Tetromino = (props) => {
  return (
    <div className="tetromino" style={{ top: props.top, left: props.left }}>
      {props.children}
    </div>
  )
}

export default Tetromino
