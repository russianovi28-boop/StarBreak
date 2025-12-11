
export enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  width: number;
  height: number;
  color: string;
  rotation: number;
}

export interface Player extends Entity {
  invulnerable: number; // Frames remaining
  flash: boolean;
  doubleShotExpiresAt: number; // Timestamp when powerup expires
}

export interface Crater {
  x: number;
  y: number;
  r: number;
}

export interface Asteroid extends Entity {
  hp: number;
  scoreValue: number;
  rotationSpeed: number;
  shape: Point[]; // Polygon vertices relative to center
  craters: Crater[];
}

export interface Bullet extends Entity {
  damage: number;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  alpha: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  alpha: number;
  color: string;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface PowerUp extends Entity {
  type: 'DOUBLE_SHOT' | 'EXTRA_LIFE';
  pulse: number; // For animation
}
