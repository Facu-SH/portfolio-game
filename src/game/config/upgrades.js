// Sistema de mejoras del jugador
// Total de cristales estimados en el juego: ~250-300
// Objetivo: poder comprar ~70-80% de mejoras al final

export const UPGRADES = {
  // Mejora de daño de balas: 3 niveles, +20% cada uno
  BULLET_DAMAGE: {
    name: 'Daño de Balas',
    icon: '⚔️',
    baseValue: 10,
    maxLevel: 3,
    costFormula: (level) => [25, 45, 70][level] || Infinity,
    valueFormula: (level) => Math.floor(10 * (1 + 0.2 * level)), // 10 → 12 → 14 → 16
    description: (level) => {
      const nextValue = Math.floor(10 * (1 + 0.2 * (level + 1)));
      return `Daño: ${nextValue} (+20%)`
    }
  },
  
  // Mejora de cadencia de disparo: 3 niveles, -10% cooldown cada uno
  FIRE_RATE: {
    name: 'Cadencia de Disparo',
    icon: '🔫',
    baseValue: 200, // ms entre disparos
    maxLevel: 3,
    costFormula: (level) => [20, 40, 65][level] || Infinity,
    // Reduce el tiempo entre disparos en 10% cada nivel
    valueFormula: (level) => Math.floor(200 * Math.pow(0.9, level)), // 200 → 180 → 162 → 146
    description: (level) => {
      const reduction = (level + 1) * 10;
      return `Dispara ${reduction}% más rápido`
    }
  },
  
  // Mejora de cantidad de disparos: 1 nivel (disparo doble paralelo)
  DOUBLE_SHOT: {
    name: 'Disparo Doble',
    icon: '⚡',
    baseValue: 1,
    maxLevel: 1,
    costFormula: (level) => [50][level] || Infinity,
    valueFormula: (level) => 1 + level, // 1 → 2 balas
    description: () => `Dispara 2 balas paralelas`
  },
  
  // Mejora de vida máxima: 3 niveles, +20% cada uno
  MAX_HP: {
    name: 'Vida Máxima',
    icon: '❤️',
    baseValue: 100,
    maxLevel: 3,
    costFormula: (level) => [30, 50, 75][level] || Infinity,
    valueFormula: (level) => Math.floor(100 * (1 + 0.2 * level)), // 100 → 120 → 144 → 172
    description: (level) => {
      const nextValue = Math.floor(100 * (1 + 0.2 * (level + 1)));
      return `Vida: ${nextValue} (+20%)`
    }
  },
  
  // Mejora de cooldown de misiles: 3 niveles, -15% cada uno
  MISSILE_COOLDOWN: {
    name: 'Cooldown de Misil',
    icon: '⏱️',
    baseValue: 2500,
    maxLevel: 3,
    costFormula: (level) => [35, 55, 80][level] || Infinity,
    // Reduce el cooldown en 15% cada nivel
    valueFormula: (level) => Math.floor(2500 * Math.pow(0.85, level)), // 2500 → 2125 → 1806 → 1535
    description: (level) => {
      const reduction = (level + 1) * 15;
      return `Recarga ${reduction}% más rápido`
    }
  },
  
  // Mejora de cantidad de misiles: 1 nivel (de 1 a 2)
  MISSILE_COUNT: {
    name: 'Misiles Extra',
    icon: '🚀',
    baseValue: 1,
    maxLevel: 1,
    costFormula: (level) => [60][level] || Infinity,
    valueFormula: (level) => 1 + level, // 1 → 2 misiles
    description: () => `Carga 2 misiles`
  }
};

// Orden de visualización en el footer
export const UPGRADE_ORDER = [
  'BULLET_DAMAGE',
  'FIRE_RATE', 
  'DOUBLE_SHOT',
  'MAX_HP',
  'MISSILE_COOLDOWN',
  'MISSILE_COUNT'
];

// Calcular el costo de una mejora en un nivel específico
export function getUpgradeCost(upgradeKey, currentLevel) {
  const upgrade = UPGRADES[upgradeKey];
  if (!upgrade || currentLevel >= upgrade.maxLevel) {
    return Infinity;
  }
  return upgrade.costFormula(currentLevel);
}

// Obtener el valor de una mejora en un nivel específico
export function getUpgradeValue(upgradeKey, level) {
  const upgrade = UPGRADES[upgradeKey];
  if (!upgrade) return 0;
  return upgrade.valueFormula(level);
}

// Obtener descripción de mejora
export function getUpgradeDescription(upgradeKey, level) {
  const upgrade = UPGRADES[upgradeKey];
  if (!upgrade) return '';
  return upgrade.description(level);
}

// Calcular costo total de todas las mejoras (para análisis)
export function getTotalUpgradeCost() {
  let total = 0;
  for (const key of UPGRADE_ORDER) {
    const upgrade = UPGRADES[key];
    for (let i = 0; i < upgrade.maxLevel; i++) {
      total += upgrade.costFormula(i);
    }
  }
  return total;
}

/*
=== ANÁLISIS DE ECONOMÍA ===

Costos totales de mejoras:
- Daño de Balas (3 niveles): 25 + 45 + 70 = 140
- Cadencia de Disparo (3 niveles): 20 + 40 + 65 = 125
- Disparo Doble (1 nivel): 50
- Vida Máxima (3 niveles): 30 + 50 + 75 = 155
- Cooldown de Misil (3 niveles): 35 + 55 + 80 = 170
- Misiles Extra (1 nivel): 60

TOTAL: 700 cristales para todas las mejoras

Cristales por enemigo:
- SCOUT: 1 cristal (5 puntos)
- DRIFTER: 1 cristal (5 puntos)
- TANK: 2 cristales (10 puntos)
- SHOOTER: 3 cristales (15 puntos)
- SWARM: 1 cristal (5 puntos)

Estimación por sección:
- Sección 1 (1 oleada, easy): ~15-20 enemigos ≈ 80-100 cristales
- Sección 2 (2 oleadas, medium): ~30-40 enemigos ≈ 150-200 cristales
- Sección 3 (3 oleadas, hard): ~50-70 enemigos ≈ 250-350 cristales

Total estimado: 480-650 cristales

Resultado: El jugador puede comprar ~70-90% de las mejoras, 
obligándolo a elegir estratégicamente qué mejorar.
*/
