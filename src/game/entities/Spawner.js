import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { SPAWN_WEIGHTS } from '../config/enemies.js';

export class Spawner extends Phaser.GameObjects.Container {
  constructor(scene, x, y, difficulty = 'easy', cardElement = null) {
    super(scene, x, y);
    
    this.scene = scene;
    this.difficulty = difficulty;
    this.cardElement = cardElement;
    
    // Stats
    this.maxHp = GAME_CONFIG.SPAWNER.BASE_HP;
    this.hp = this.maxHp;
    this.isDestroyed = false;
    
    // Spawn control
    this.lastSpawnTime = 0;
    this.spawnInterval = GAME_CONFIG.SPAWNER.SPAWN_INTERVAL;
    this.lastDamageThreshold = 1;
    this.spawningDisabled = false; // Flag para desactivar spawns
    
    // Crear gráficos
    this.createGraphics();
    
    scene.add.existing(this);
    
    // Configurar depth para que esté visible
    this.setDepth(10);
    
    // Física
    scene.physics.add.existing(this, true); // static body
    this.body.setCircle(32, -32, -32);
    
    // Efecto de aparición
    this.alpha = 0;
    this.scale = 0;
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }
  
  createGraphics() {
    const size = GAME_CONFIG.SIZES.SPAWNER;
    
    // Anillo exterior giratorio
    this.outerRing = this.scene.add.graphics();
    this.drawOuterRing();
    
    // Cuerpo principal
    this.mainBody = this.scene.add.graphics();
    this.mainBody.fillStyle(0x1a0033, 0.9);
    this.mainBody.lineStyle(3, GAME_CONFIG.COLORS.PURPLE, 1);
    
    // Hexágono
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      points.push({
        x: Math.cos(angle) * size / 2,
        y: Math.sin(angle) * size / 2
      });
    }
    this.mainBody.fillPoints(points, true);
    this.mainBody.strokePoints(points, true);
    
    // Core interior
    this.core = this.scene.add.graphics();
    this.updateCore();
    
    // Barra de vida
    this.healthBar = this.scene.add.graphics();
    
    this.add([this.outerRing, this.mainBody, this.core, this.healthBar]);
    
    // Rotación del anillo
    this.ringRotation = 0;
  }
  
  drawOuterRing() {
    this.outerRing.clear();
    this.outerRing.lineStyle(2, GAME_CONFIG.COLORS.PURPLE, 0.5);
    
    // Arcos rotativos
    for (let i = 0; i < 3; i++) {
      const startAngle = this.ringRotation + (i * Math.PI * 2 / 3);
      this.outerRing.beginPath();
      this.outerRing.arc(0, 0, 40, startAngle, startAngle + Math.PI / 2);
      this.outerRing.strokePath();
    }
  }
  
  updateCore() {
    this.core.clear();
    
    const healthPercent = this.hp / this.maxHp;
    const pulseIntensity = 0.5 + Math.sin(this.scene.time.now * 0.005) * 0.3;
    
    // Color basado en vida
    let coreColor;
    if (healthPercent > 0.5) {
      coreColor = GAME_CONFIG.COLORS.PURPLE;
    } else if (healthPercent > 0.25) {
      coreColor = GAME_CONFIG.COLORS.ORANGE;
    } else {
      coreColor = GAME_CONFIG.COLORS.RED;
    }
    
    // Core pulsante
    this.core.fillStyle(coreColor, pulseIntensity);
    this.core.fillCircle(0, 0, 15 + (pulseIntensity * 5));
    
    // Glow
    this.core.fillStyle(coreColor, pulseIntensity * 0.3);
    this.core.fillCircle(0, 0, 25 + (pulseIntensity * 8));
  }
  
  updateHealthBar() {
    this.healthBar.clear();
    
    const width = 60;
    const height = 6;
    const y = -50;
    
    // Fondo
    this.healthBar.fillStyle(0x333333, 0.8);
    this.healthBar.fillRect(-width / 2, y, width, height);
    
    // Vida
    const healthPercent = this.hp / this.maxHp;
    const healthColor = healthPercent > 0.5 ? GAME_CONFIG.COLORS.PURPLE : 
                        healthPercent > 0.25 ? GAME_CONFIG.COLORS.ORANGE : 
                        GAME_CONFIG.COLORS.RED;
    
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRect(-width / 2, y, width * healthPercent, height);
    
    // Borde
    this.healthBar.lineStyle(1, 0xffffff, 0.5);
    this.healthBar.strokeRect(-width / 2, y, width, height);
  }
  
  update(time, delta) {
    if (this.isDestroyed) return;
    
    // Rotar anillo exterior
    this.ringRotation += delta * 0.001;
    this.drawOuterRing();
    
    // Actualizar core
    this.updateCore();
    
    // Actualizar barra de vida
    this.updateHealthBar();
    
    // Spawn de goteo (solo si no está deshabilitado)
    if (!this.spawningDisabled && time - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = time;
      this.spawnEnemy();
    }
  }
  
  spawnEnemy() {
    if (this.isDestroyed || this.spawningDisabled) return;
    
    // Determinar tipo de enemigo según dificultad y vida
    const effectiveDifficulty = this.getEffectiveDifficulty();
    const enemyType = this.selectEnemyType(effectiveDifficulty);
    
    // Posición de spawn cerca del spawner
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 30;
    const spawnX = this.x + Math.cos(angle) * distance;
    const spawnY = this.y + Math.sin(angle) * distance;
    
    // Emitir evento para crear enemigo
    this.scene.events.emit('spawnEnemy', spawnX, spawnY, enemyType);
    
    // Efecto visual de spawn
    this.createSpawnEffect(spawnX, spawnY);
  }
  
  getEffectiveDifficulty() {
    const healthPercent = this.hp / this.maxHp;
    
    if (healthPercent < GAME_CONFIG.SPAWNER.LOW_HP_THRESHOLD) {
      // Spawner moribundo = enemigos más fuertes
      if (this.difficulty === 'easy') return 'medium';
      if (this.difficulty === 'medium') return 'hard';
      return 'elite';
    }
    
    return this.difficulty;
  }
  
  selectEnemyType(difficulty) {
    const weights = SPAWN_WEIGHTS[difficulty];
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    
    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return type;
      }
    }
    
    return 'SCOUT';
  }
  
  createSpawnEffect(x, y) {
    const effect = this.scene.add.graphics();
    effect.setPosition(x, y);
    
    let frame = 0;
    const timer = this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        effect.clear();
        
        const progress = frame / 10;
        const radius = 30 * (1 - progress);
        const alpha = 1 - progress;
        
        effect.lineStyle(2, GAME_CONFIG.COLORS.PURPLE, alpha);
        effect.strokeCircle(0, 0, radius);
        
        frame++;
        if (frame >= 10) {
          timer.destroy();
          effect.destroy();
        }
      },
      repeat: 9
    });
  }
  
  spawnInitialEnemies() {
    if (this.spawningDisabled) return;
    
    const count = GAME_CONFIG.SPAWNER.INITIAL_SPAWN_COUNT + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        if (!this.spawningDisabled) {
          this.spawnEnemy();
        }
      });
    }
  }
  
  disableSpawning() {
    this.spawningDisabled = true;
  }
  
  takeDamage(amount) {
    if (this.isDestroyed) return false;
    
    this.hp -= amount;
    
    // Flash
    this.scene.tweens.add({
      targets: this.mainBody,
      alpha: 0.3,
      duration: 50,
      yoyo: true
    });
    
    // Spawn por daño recibido
    const currentThreshold = Math.ceil(this.hp / this.maxHp / GAME_CONFIG.SPAWNER.DAMAGE_SPAWN_THRESHOLD) * GAME_CONFIG.SPAWNER.DAMAGE_SPAWN_THRESHOLD;
    
    if (currentThreshold < this.lastDamageThreshold && !this.spawningDisabled) {
      this.lastDamageThreshold = currentThreshold;
      this.spawnEnemy();
    }
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }
    
    return false;
  }
  
  die() {
    if (this.isDestroyed) return; // Evitar múltiples llamadas
    
    this.isDestroyed = true;
    this.setActive(false);
    
    console.log('💀 Spawner destruido en:', this.x, this.y);
    
    // Gran explosión
    this.createDeathExplosion();
    
    // Emitir evento
    this.scene.events.emit('spawnerDestroyed', this.x, this.y, this.cardElement);
    
    // Screen shake grande
    this.scene.cameras.main.shake(300, 0.02);
    
    // Flash
    this.scene.cameras.main.flash(200, 153, 0, 255);
    
    // Animación de muerte
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  createDeathExplosion() {
    const particles = this.scene.add.graphics();
    particles.setPosition(this.x, this.y);
    
    const particleCount = 20;
    const particleData = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 100 + Math.random() * 150;
      particleData.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 5 + Math.random() * 10
      });
    }
    
    const timer = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        particles.clear();
        
        let allDead = true;
        particleData.forEach(p => {
          p.x += p.vx * 0.016;
          p.y += p.vy * 0.016;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.alpha -= 0.02;
          
          if (p.alpha > 0) {
            allDead = false;
            particles.fillStyle(GAME_CONFIG.COLORS.PURPLE, p.alpha);
            particles.fillCircle(p.x, p.y, p.size * p.alpha);
          }
        });
        
        if (allDead) {
          timer.destroy();
          particles.destroy();
        }
      },
      loop: true
    });
    
    // Drops de cristales
    this.dropCrystals();
  }
  
  dropCrystals() {
    const crystalCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < crystalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 50;
      const dropX = this.x + Math.cos(angle) * distance;
      const dropY = this.y + Math.sin(angle) * distance;
      
      this.scene.time.delayedCall(i * 100, () => {
        this.scene.events.emit('spawnCrystal', dropX, dropY, 'LARGE');
      });
    }
  }
}

export default Spawner;

