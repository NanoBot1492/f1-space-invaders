import React from 'react';
import GameCanvas from './components/game/GameCanvas';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>F1 Racer</h1>
        <p>Red Bull Formula One Space Invaders</p>
      </header>
      <GameCanvas />
    </div>
  );
}

export default App;