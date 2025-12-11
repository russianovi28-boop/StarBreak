import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Button } from './components/Button';
import { GameState } from './types';
import { Heart, Trophy, Pause, Play, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.TITLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('cosmic-defender-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('cosmic-defender-highscore', score.toString());
    }
  }, [score, highScore]);

  // Reset helper
  const startGame = () => {
    setScore(0);
    setLives(3);
    setDifficultyMultiplier(1);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className={`relative w-screen h-screen bg-neutral-950 flex items-center justify-center overflow-hidden ${gameState === GameState.PLAYING ? 'cursor-none' : ''}`}>
      {/* Game Container (Aspect Ratio Maintained) */}
      <div className="relative w-full h-full max-w-[800px] max-h-[600px] aspect-[4/3] bg-black shadow-2xl overflow-hidden border-t border-b border-white/5 ring-1 ring-white/10">
        
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState}
          score={score}
          setScore={setScore}
          lives={lives}
          setLives={setLives}
          difficultyMultiplier={difficultyMultiplier}
          setDifficultyMultiplier={setDifficultyMultiplier}
        />

        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: "100% 2px, 3px 100%" }}></div>

        {/* HUD - Always visible when playing/paused/gameover */}
        {gameState !== GameState.TITLE && (
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-white/90 font-display">
                <span className="text-xl tracking-widest">{score.toString().padStart(6, '0')}</span>
              </div>
              <div className="text-[10px] text-white/40 font-mono tracking-[0.2em] uppercase">High Score: {highScore}</div>
            </div>
            
            <div className="flex items-center gap-2">
              {[...Array(3)].map((_, i) => (
                <Heart 
                  key={i} 
                  size={20}
                  className={`transition-all duration-300 ${
                    i < lives 
                      ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                      : 'fill-transparent text-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Title Screen */}
        {gameState === GameState.TITLE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center animate-fade-in relative">
              
              {/* Decorative elements */}
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent absolute -top-24"></div>

              <h1 className="text-5xl md:text-7xl font-display text-white tracking-widest mb-4 text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                STARBREAK
              </h1>
              <p className="text-slate-500 font-sans italic tracking-widest text-sm md:text-base mb-12">
                Beyond the Event Horizon
              </p>
              
              <div className="flex flex-col items-center gap-8">
                <Button onClick={startGame} variant="outline">
                  ENGAGE SYSTEMS
                </Button>

                {highScore > 0 && (
                   <div className="text-neutral-600 font-mono text-[10px] tracking-[0.3em] uppercase mt-4">
                     High Score: {highScore}
                   </div>
                )}
              </div>

               {/* Decorative elements */}
               <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent absolute -bottom-32"></div>
            </div>
            
            <div className="absolute bottom-8 flex flex-col items-center gap-2 text-neutral-700 font-mono text-[10px] tracking-widest uppercase">
               <p>Controls</p>
               <div className="flex gap-6">
                 <span>A / D / Arrows to Move</span>
                 <span>Space / Click to Shoot</span>
               </div>
            </div>
          </div>
        )}

        {/* Pause Menu */}
        {gameState === GameState.PAUSED && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-40">
            <h2 className="text-3xl font-display text-white mb-12 tracking-[0.2em]">SUSPENDED</h2>
            <div className="flex flex-col gap-6">
              <Button onClick={() => setGameState(GameState.PLAYING)} variant="outline">
                RESUME MISSION
              </Button>
              <Button onClick={() => setGameState(GameState.TITLE)} variant="outline">
                ABORT
              </Button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-50">
            <h2 className="text-4xl font-display text-red-500 mb-2 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">SIGNAL LOST</h2>
            <p className="text-neutral-500 font-sans italic mb-12 text-sm tracking-wide">Lost to the deep dark.</p>
            
            <div className="flex flex-col items-center mb-12 gap-2">
              <span className="text-neutral-600 text-[10px] tracking-[0.3em] uppercase">Final Score</span>
              <span className="text-5xl font-display text-white">{score}</span>
              {score >= highScore && score > 0 && (
                <span className="text-amber-400 text-xs tracking-widest mt-2 animate-pulse">NEW RECORD</span>
              )}
            </div>

            <div className="flex flex-col gap-4 w-64">
              <Button onClick={startGame} variant="outline">
                 REINITIATE
              </Button>
              <Button onClick={() => setGameState(GameState.TITLE)} variant="outline">
                RETURN TO MENU
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Controls Hint (Visible only on small screens) */}
      <div className="absolute bottom-4 text-neutral-600 text-[10px] tracking-widest uppercase text-center w-full md:hidden">
        Keyboard required for optimal navigation
      </div>
    </div>
  );
};

export default App;