import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Player, Asteroid, Bullet, Particle, Star, Crater, PowerUp, FloatingText } from '../types';

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 3.5; 
const BULLET_SPEED = 10;
const FIRE_RATE = 30; // Slower shooting
const INITIAL_LIVES = 3;
const ASTEROID_SPAWN_RATE_INITIAL = 158; // Increased rate

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  score: number;
  setScore: (score: number | ((prev: number) => number)) => void;
  lives: number;
  setLives: (lives: number | ((prev: number) => number)) => void;
  difficultyMultiplier: number;
  setDifficultyMultiplier: (val: number | ((prev: number) => number)) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  score,
  setScore,
  lives,
  setLives,
  difficultyMultiplier,
  setDifficultyMultiplier,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Mutable Game State (Refs for performance)
  const playerRef = useRef<Player>({
    id: 'player',
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 80,
    vx: 0,
    vy: 0,
    width: 50,
    height: 60,
    color: '#06b6d4',
    rotation: 0,
    invulnerable: 0,
    flash: false,
    doubleShotExpiresAt: 0
  });
  
  const bulletsRef = useRef<Bullet[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  // Input State
  const keysPressed = useRef<Set<string>>(new Set());
  const framesSinceLastShot = useRef<number>(FIRE_RATE);
  const framesSinceLastSpawn = useRef<number>(0);
  
  // Initialize Stars Background
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.2,
        brightness: Math.random()
      });
    }
    starsRef.current = stars;
  }, []);

  // Reset Game Helper
  const resetGame = useCallback(() => {
    playerRef.current = {
      id: 'player',
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      vx: 0,
      vy: 0,
      width: 50,
      height: 60,
      color: '#06b6d4',
      rotation: 0,
      invulnerable: 0,
      flash: false,
      doubleShotExpiresAt: 0
    };
    bulletsRef.current = [];
    asteroidsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];
    setScore(0);
    setLives(INITIAL_LIVES);
    setDifficultyMultiplier(1);
    framesSinceLastSpawn.current = 0;
    framesSinceLastShot.current = FIRE_RATE; 
  }, [setScore, setLives, setDifficultyMultiplier]);

  // Handle Game Over / Restart
  useEffect(() => {
    if (gameState === GameState.PLAYING && score === 0 && lives === INITIAL_LIVES && asteroidsRef.current.length > 0) {
        resetGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current.add(e.code);
      
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
        else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        keysPressed.current.add('MouseLeft');
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        keysPressed.current.delete('MouseLeft');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, setGameState]);

  const generateAsteroidShape = (radius: number) => {
    const points = [];
    const numPoints = 8 + Math.floor(Math.random() * 6); 
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const variance = 0.6 + Math.random() * 0.6; 
      const pointRadius = radius * variance;
      points.push({
        x: Math.cos(angle) * pointRadius,
        y: Math.sin(angle) * pointRadius
      });
    }
    return points;
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string = '#ffffff') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      life: 40,
      maxLife: 40,
      alpha: 1,
      color,
      size: 20
    });
  };

  // Game Loop
  const update = useCallback(() => {
    // Always animate stars regardless of state
    starsRef.current.forEach(star => {
      star.y += star.speed;
      if (star.y > CANVAS_HEIGHT) star.y = 0;
    });

    if (gameState !== GameState.PLAYING) return;

    const player = playerRef.current;
    const now = Date.now();
    const isDoubleShot = now < player.doubleShotExpiresAt;
    
    // 1. Player Movement
    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('KeyA')) {
      player.x -= PLAYER_SPEED;
      player.rotation = Math.max(player.rotation - 2, -15);
    } else if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('KeyD')) {
      player.x += PLAYER_SPEED;
      player.rotation = Math.min(player.rotation + 2, 15);
    } else {
      if (player.rotation > 0) player.rotation -= 1;
      if (player.rotation < 0) player.rotation += 1;
    }
    
    player.x = Math.max(player.width / 2, Math.min(CANVAS_WIDTH - player.width / 2, player.x));

    // 2. Shooting
    framesSinceLastShot.current++;
    if (keysPressed.current.has('Space') || keysPressed.current.has('MouseLeft')) {
      if (framesSinceLastShot.current >= FIRE_RATE) {
        
        if (isDoubleShot) {
          // Double Shot
           [-12, 12].forEach(offset => {
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: player.x + offset,
              y: player.y - player.height / 2,
              vx: 0,
              vy: -BULLET_SPEED,
              width: 4,
              height: 12,
              color: '#facc15',
              rotation: 0,
              damage: 1
            });
          });
        } else {
          // Single Shot
          bulletsRef.current.push({
            id: Math.random().toString(),
            x: player.x,
            y: player.y - player.height / 2,
            vx: 0,
            vy: -BULLET_SPEED,
            width: 4,
            height: 12,
            color: '#67e8f9',
            rotation: 0,
            damage: 1
          });
        }
        
        framesSinceLastShot.current = 0;
      }
    }

    // 3. Update Bullets
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -20);
    bulletsRef.current.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
    });

    // 4. Update PowerUps
    powerUpsRef.current.forEach(p => {
      p.y += p.vy;
      p.pulse += 0.1;
      
      // Collision with player
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < player.width) {
        if (p.type === 'DOUBLE_SHOT') {
            player.doubleShotExpiresAt = Date.now() + 10000;
        } else if (p.type === 'EXTRA_LIFE') {
            setLives(prev => Math.min(prev + 1, 3));
        }
        p.id = 'collected'; // Mark for removal
      }
    });
    powerUpsRef.current = powerUpsRef.current.filter(p => p.y < CANVAS_HEIGHT + 50 && p.id !== 'collected');


    // 5. Update Asteroids
    // Spawning
    framesSinceLastSpawn.current++;
    const currentSpawnRate = Math.max(30, ASTEROID_SPAWN_RATE_INITIAL - (difficultyMultiplier * 5));
    if (framesSinceLastSpawn.current >= currentSpawnRate) {
      // 50% chance for size < 70 (approx)
      const size = Math.random() * 60 + 40; // 40 - 100
      
      // Guaranteed CAP at 2 HP
      const hp = size < 70 ? 1 : 2; 
      
      const craters: Crater[] = [];
      const numCraters = Math.floor(Math.random() * 3) + 1;
      for(let i=0; i<numCraters; i++) {
        craters.push({
           x: (Math.random() - 0.5) * (size * 0.6),
           y: (Math.random() - 0.5) * (size * 0.6),
           r: Math.random() * (size * 0.15) + (size * 0.05)
        });
      }

      asteroidsRef.current.push({
        id: Math.random().toString(),
        x: Math.random() * (CANVAS_WIDTH - size) + size/2,
        y: -size,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() * 1.0 + 0.5) * (1 + difficultyMultiplier * 0.1), 
        width: size,
        height: size,
        color: '#94a3b8',
        rotation: 0,
        hp: hp,
        scoreValue: 1, // 1 Point per asteroid
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        shape: generateAsteroidShape(size / 2),
        craters: craters
      });
      framesSinceLastSpawn.current = 0;
      setDifficultyMultiplier(prev => prev + 0.02);
    }

    // Move & Collision
    asteroidsRef.current.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.rotationSpeed;

      // Bounce off walls
      if (a.x < a.width / 2) {
          a.x = a.width / 2;
          a.vx *= -1;
      }
      if (a.x > CANVAS_WIDTH - a.width / 2) {
          a.x = CANVAS_WIDTH - a.width / 2;
          a.vx *= -1;
      }

      // Check ground collision
      if (a.y - a.height/2 > CANVAS_HEIGHT && a.id !== 'destroyed') {
          setLives(prev => Math.max(0, prev - 1));
          a.id = 'destroyed';
      }

      // Collision with Bullets
      bulletsRef.current.forEach(b => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < a.width / 2) {
          a.hp -= b.damage;
          b.y = -100; // Remove bullet
          
          // Spawn hit particles
          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              id: Math.random().toString(),
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 10,
              maxLife: 10,
              alpha: 1,
              width: 2,
              height: 2,
              color: '#ffffff',
              rotation: 0
            });
          }

          if (a.hp <= 0) {
             a.id = 'destroyed';
             setScore(prev => prev + a.scoreValue);
             spawnFloatingText(a.x, a.y, `+${a.scoreValue}`);
             
             // Explosion particles
             for (let i = 0; i < 15; i++) {
                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: a.x,
                  y: a.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  life: 30 + Math.random() * 20,
                  maxLife: 50,
                  alpha: 1,
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  color: '#94a3b8',
                  rotation: 0
                });
             }

             // Spawn PowerUp (6% chance)
             if (Math.random() < 0.06) {
                 const isExtraLife = Math.random() < 0.25; // 25% chance for extra life
                 powerUpsRef.current.push({
                     id: Math.random().toString(),
                     x: a.x,
                     y: a.y,
                     vx: 0,
                     vy: 1.5, // Faster drop
                     width: 20,
                     height: 20,
                     color: isExtraLife ? '#f472b6' : '#fbbf24',
                     rotation: 0,
                     type: isExtraLife ? 'EXTRA_LIFE' : 'DOUBLE_SHOT',
                     pulse: 0
                 });
             }
          }
        }
      });

      // Collision with Player
      if (player.invulnerable <= 0 && a.id !== 'destroyed') {
        const dx = player.x - a.x;
        const dy = player.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Simple circle collision for now
        if (dist < (a.width / 2 + player.width / 3)) {
          setLives(prev => Math.max(0, prev - 1));
          player.invulnerable = 120; // 2 seconds invulnerability
          player.flash = true;
          a.id = 'destroyed';
          
          // Player hit particles
          for (let i = 0; i < 20; i++) {
            particlesRef.current.push({
              id: Math.random().toString(),
              x: player.x,
              y: player.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 40,
              maxLife: 40,
              alpha: 1,
              width: 3,
              height: 3,
              color: '#ef4444',
              rotation: 0
            });
          }
        }
      }
    });

    asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== 'destroyed');

    // 6. Update Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = p.life / p.maxLife;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // 7. Update Floating Text
    floatingTextsRef.current.forEach(t => {
        t.y -= 1; // Float up
        t.life--;
        t.alpha = t.life / t.maxLife;
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(t => t.life > 0);

    // 8. Player State
    if (player.invulnerable > 0) {
      player.invulnerable--;
      if (player.invulnerable % 10 === 0) player.flash = !player.flash;
    } else {
      player.flash = false;
    }

    if (lives <= 0) {
      setGameState(GameState.GAME_OVER);
    }
    
  }, [gameState, keysPressed, setLives, setScore, setGameState, difficultyMultiplier, setDifficultyMultiplier]);

  // Draw Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Background (Nebula Gradient)
    const gradient = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH);
    gradient.addColorStop(0, '#1a1a2e'); // Deep blue/purple center
    gradient.addColorStop(1, '#000000'); // Black edges
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Stars
    starsRef.current.forEach(star => {
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // If Title Screen, stop drawing here (just background)
    if (gameState === GameState.TITLE) return;

    // Draw Bullets
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.fillRect(b.x - b.width/2, b.y, b.width, b.height);
      ctx.shadowBlur = 0;
    });

    // Draw PowerUps
    powerUpsRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        const scale = 1 + Math.sin(p.pulse) * 0.1;
        ctx.scale(scale, scale);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        
        if (p.type === 'EXTRA_LIFE') {
            // Draw Heart
            ctx.fillStyle = p.color;
            ctx.beginPath();
            const topCurveHeight = p.height * 0.3;
            ctx.moveTo(0, p.height * 0.3);
            ctx.bezierCurveTo(0, 0, -p.width/2, 0, -p.width/2, topCurveHeight);
            ctx.bezierCurveTo(-p.width/2, (p.height + topCurveHeight) / 2, 0, p.height * 0.8, 0, p.height);
            ctx.bezierCurveTo(0, p.height * 0.8, p.width/2, (p.height + topCurveHeight) / 2, p.width/2, topCurveHeight);
            ctx.bezierCurveTo(p.width/2, 0, 0, 0, 0, topCurveHeight);
            ctx.fill();
        } else {
            // Draw Orb (Double Shot)
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, p.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner symbol
            ctx.fillStyle = '#fff';
            // Draw two small rects
            ctx.fillRect(-4, -6, 3, 12);
            ctx.fillRect(1, -6, 3, 12);
        }
        
        ctx.restore();
    });

    // Draw Player
    const player = playerRef.current;
    if (!player.flash) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.rotation * Math.PI / 180);
      
      // Spaceship Body (Metallic Gradient)
      const shipGradient = ctx.createLinearGradient(-player.width/2, 0, player.width/2, 0);
      shipGradient.addColorStop(0, '#0e7490'); // Dark Cyan
      shipGradient.addColorStop(0.5, '#22d3ee'); // Bright Cyan
      shipGradient.addColorStop(1, '#0e7490'); // Dark Cyan
      
      ctx.fillStyle = shipGradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = player.color;
      
      ctx.beginPath();
      // Nose
      ctx.moveTo(0, -player.height/2);
      // Right Body
      ctx.lineTo(player.width * 0.2, -player.height * 0.1);
      // Right Wing Tip
      ctx.lineTo(player.width/2, player.height * 0.2);
      // Right Wing Back
      ctx.lineTo(player.width * 0.2, player.height * 0.2);
      // Right Engine
      ctx.lineTo(player.width * 0.15, player.height/2);
      // Center Engine
      ctx.lineTo(0, player.height * 0.4);
      // Left Engine
      ctx.lineTo(-player.width * 0.15, player.height/2);
      // Left Wing Back
      ctx.lineTo(-player.width * 0.2, player.height * 0.2);
      // Left Wing Tip
      ctx.lineTo(-player.width/2, player.height * 0.2);
      // Left Body
      ctx.lineTo(-player.width * 0.2, -player.height * 0.1);
      ctx.closePath();
      ctx.fill();

      // Wing Details
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(player.width * 0.2, -player.height * 0.1);
      ctx.lineTo(player.width * 0.2, player.height * 0.2);
      ctx.moveTo(-player.width * 0.2, -player.height * 0.1);
      ctx.lineTo(-player.width * 0.2, player.height * 0.2);
      ctx.stroke();

      // Cockpit
      const cockpitGradient = ctx.createLinearGradient(0, -player.height * 0.2, 0, 0);
      cockpitGradient.addColorStop(0, '#1e293b');
      cockpitGradient.addColorStop(1, '#64748b');
      ctx.fillStyle = cockpitGradient;
      
      ctx.beginPath();
      ctx.moveTo(0, -player.height * 0.2);
      ctx.lineTo(player.width * 0.1, 0);
      ctx.lineTo(0, player.height * 0.1);
      ctx.lineTo(-player.width * 0.1, 0);
      ctx.closePath();
      ctx.fill();

      // Engine Flame
      const flameGradient = ctx.createLinearGradient(0, player.height * 0.45, 0, player.height * 0.8);
      flameGradient.addColorStop(0, '#fef08a'); // Yellow
      flameGradient.addColorStop(1, '#f97316'); // Orange
      
      ctx.fillStyle = flameGradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-player.width * 0.1, player.height * 0.45);
      ctx.lineTo(0, player.height * 0.45 + (Math.random() * 15 + 15));
      ctx.lineTo(player.width * 0.1, player.height * 0.45);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();

      // Draw Powerup Timer Bar
      const timeRemaining = player.doubleShotExpiresAt - Date.now();
      if (timeRemaining > 0) {
          const maxWidth = 40;
          const barWidth = (timeRemaining / 10000) * maxWidth;
          ctx.fillStyle = '#333';
          ctx.fillRect(player.x - maxWidth/2, player.y + 40, maxWidth, 4);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(player.x - maxWidth/2, player.y + 40, barWidth, 4);
      }
    }

    // Draw Asteroids
    asteroidsRef.current.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      
      // Draw Polygon Body
      ctx.fillStyle = a.color;
      ctx.beginPath();
      if (a.shape.length > 0) {
        ctx.moveTo(a.shape[0].x, a.shape[0].y);
        for (let i = 1; i < a.shape.length; i++) {
          ctx.lineTo(a.shape[i].x, a.shape[i].y);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      // Draw Craters
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      a.craters.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    ctx.globalAlpha = 1.0;

    // Draw Floating Text
    floatingTextsRef.current.forEach(t => {
        ctx.globalAlpha = t.alpha;
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px 'Orbitron', sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'black';
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;

  }, [gameState]);

  // Animation Loop
  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block w-full h-full object-contain cursor-none"
    />
  );
};