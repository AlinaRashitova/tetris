import React from 'react'
import './Block.css'

const Block = ({ top, left, backgroundColor, isBlinkingBlock }) => {
  return (
    <div className={`block ${isBlinkingBlock ? 'blink' : ''}`} style={{ top: top, left: left, background: `radial-gradient(${backgroundColor})` }} />
  )
}

export default Block
