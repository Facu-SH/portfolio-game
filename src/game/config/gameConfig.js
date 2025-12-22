// Configuración principal del juego
export const GAME_CONFIG = {
  // Estados del juego
  STATES: {
    IDLE: 'IDLE',
    PLAYING: 'PLAYING',
    BASE: 'BASE',
    GAME_OVER: 'GAME_OVER',
    PAUSED: 'PAUSED'
  },

  // Configuración del jugador
  PLAYER: {
    MAX_HP: 100,
    SPEED: 8,
    LERP_FACTOR: 0.08, // Suavidad del movimiento hacia el cursor
    INVULNERABILITY_TIME: 500, // ms
    
    // Disparo normal
    FIRE_RATE: 200, // ms entre disparos (5 disparos/segundo)
    BULLET_DAMAGE: 10,
    BULLET_SPEED: 800,
    
    // Misil especial
    MISSILE_COOLDOWN: 2500, // ms
    MISSILE_DAMAGE: 50,
    MISSILE_AOE_DAMAGE: 25,
    MISSILE_AOE_RADIUS: 80,
    MISSILE_SPEED: 400
  },

  // Configuración de daño
  DAMAGE: {
    COLLISION: 20,
    ENEMY_BULLET: 15
  },

  // Configuración de drops
  DROPS: {
    HEALTH_RESTORE: 25,
    CRYSTAL_VALUES: {
      SMALL: 5,
      MEDIUM: 15,
      LARGE: 30
    }
  },

  // Configuración del spawner
  SPAWNER: {
    BASE_HP: 200,
    SPAWN_INTERVAL: 10000, // ms entre spawns de goteo
    INITIAL_SPAWN_COUNT: 3,
    DAMAGE_SPAWN_THRESHOLD: 0.2, // Cada 20% de vida perdida
    LOW_HP_THRESHOLD: 0.3 // Por debajo de esto, enemigos más fuertes
  },

  // Colores del tema
  COLORS: {
    BACKGROUND: 0x0a0a1a,
    CYAN_NEON: 0x00ffff,
    MAGENTA: 0xff00ff,
    GREEN_TERMINAL: 0x00ff00,
    ORANGE: 0xff6600,
    RED: 0xff0000,
    PURPLE: 0x9900ff
  },

  // Tamaños de sprites (usaremos gráficos procedurales por ahora)
  SIZES: {
    PLAYER: 32,
    BULLET: 8,
    MISSILE: 16,
    ENEMY_SMALL: 24,
    ENEMY_MEDIUM: 32,
    ENEMY_LARGE: 48,
    SPAWNER: 64
  }
};

export default GAME_CONFIG;

