// Configuración de tipos de enemigos
export const ENEMY_TYPES = {
  SCOUT: {
    name: 'Scout',
    hp: 20,
    speed: 200,
    behavior: 'chase',
    points: 10,
    crystalDrop: 1, // Cantidad de cristales que dropea
    crystalDropChance: 1.0, // 100% de probabilidad
    color: 0x3399ff, // Azul
    size: 24
  },
  
  DRIFTER: {
    name: 'Drifter',
    hp: 30,
    speed: 150,
    behavior: 'zigzag',
    points: 15,
    crystalDrop: 1,
    crystalDropChance: 1.0,
    color: 0x33ff66, // Verde
    size: 28
  },
  
  TANK: {
    name: 'Tank',
    hp: 80,
    speed: 60,
    behavior: 'chase',
    points: 30,
    crystalDrop: 2, // Más resistente = más cristales
    crystalDropChance: 1.0,
    color: 0xff9933, // Naranja
    size: 48
  },
  
  SHOOTER: {
    name: 'Shooter',
    hp: 40,
    speed: 100,
    behavior: 'shoot',
    fireRate: 1500,
    bulletSpeed: 300,
    bulletDamage: 15,
    points: 25,
    crystalDrop: 3, // El más peligroso = más recompensa
    crystalDropChance: 1.0,
    color: 0xff3333, // Rojo
    size: 32
  },
  
  SWARM: {
    name: 'Swarm',
    hp: 10,
    speed: 250,
    behavior: 'swarm',
    points: 5,
    crystalDrop: 1,
    crystalDropChance: 1.0,
    color: 0xcc33ff, // Púrpura
    size: 16
  }
};

// Probabilidades de spawn según dificultad
export const SPAWN_WEIGHTS = {
  easy: {
    SCOUT: 80,
    DRIFTER: 15,
    TANK: 5,
    SHOOTER: 0,
    SWARM: 0
  },
  medium: {
    SCOUT: 40,
    DRIFTER: 25,
    TANK: 15,
    SHOOTER: 15,
    SWARM: 5
  },
  hard: {
    SCOUT: 20,
    DRIFTER: 20,
    TANK: 20,
    SHOOTER: 25,
    SWARM: 15
  },
  elite: {
    SCOUT: 10,
    DRIFTER: 15,
    TANK: 25,
    SHOOTER: 30,
    SWARM: 20
  }
};

export default ENEMY_TYPES;
