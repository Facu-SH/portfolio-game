import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Spawner } from '../entities/Spawner.js';
import { Boss } from '../entities/Boss.js';
import { Bullet, Missile } from '../entities/Projectile.js';
import { Crystal, HealthDrop } from '../entities/Collectible.js';
import { UPGRADES, UPGRADE_ORDER, getUpgradeCost, getUpgradeValue } from '../config/upgrades.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }
  
  init() {
    this.gameState = GAME_CONFIG.STATES.IDLE;
    this.score = 0;
    this.crystals = 0;
    this.enemiesKilled = 0;
    this.currentSection = 0;
    this.currentScreenInSection = 0;
    this.screenCompleted = false;
    this.lastMouseX = undefined;
    this.lastMouseY = undefined;
    this.collectiblesAutoMagnetize = false;
    
    // Estadísticas detalladas
    this.gameStartTime = 0;
    this.gameEndTime = 0;
    this.enemiesKilledByType = {
      SCOUT: 0,
      DRIFTER: 0,
      TANK: 0,
      SHOOTER: 0,
      SWARM: 0
    };
    this.upgradesPurchased = [];
    this.sectionsCompleted = [];
    this.bulletsFired = 0;
    this.bulletsHit = 0;
    this.missilesFired = 0;
    this.missilesHit = 0;
    this.deathSection = null;
    this.deathScreen = null;
    
    // Sistema de mejoras - niveles actuales
    this.upgradeLevels = {
      BULLET_DAMAGE: 0,
      FIRE_RATE: 0,
      DOUBLE_SHOT: 0,
      MAX_HP: 0,
      MISSILE_COOLDOWN: 0,
      MISSILE_COUNT: 0
    };
    
    // Configuración de secciones y pantallas (oleadas)
    // Sección 1: 1 oleada, Sección 2: 2 oleadas, Sección 3: 3 oleadas
    this.sections = [
      {
        id: 'about',
        name: 'Sobre Mí',
        pageId: 'about',
        screens: [
          { difficulty: 'easy', spawnerCount: 2 }
        ]
      },
      {
        id: 'experience',
        name: 'Experiencia',
        pageId: 'experience',
        screens: [
          { difficulty: 'medium', spawnerCount: 2 },
          { difficulty: 'medium', spawnerCount: 3 }
        ]
      },
      {
        id: 'portfolio',
        name: 'Portfolio',
        pageId: 'portfolio',
        screens: [
          { difficulty: 'medium', spawnerCount: 3 },
          { difficulty: 'hard', spawnerCount: 3 },
          { difficulty: 'hard', spawnerCount: 4 }
        ]
      },
      {
        id: 'boss',
        name: 'JEFE FINAL',
        pageId: 'portfolio', // Mantener en la página de portfolio
        screens: [
          { difficulty: 'boss', spawnerCount: 0, isBoss: true }
        ]
      }
    ];
    
    this.currentSection = 0;
    this.currentScreenInSection = 0;
    
    // Sistema de jefe
    this.boss = null;
    this.isBossFight = false;
  }
  
  create() {
    console.log('🎮 MainScene.create() ejecutado');
    
    // Configurar fondo espacial oscuro
    this.cameras.main.setBackgroundColor('#05050f');
    
    // Crear fondo de estrellas
    this.createStarfield();
    
    // Grupos regulares (los objetos manejan su propia física)
    this.playerBullets = this.add.group();
    this.enemyBullets = this.add.group();
    this.missiles = this.add.group();
    this.enemies = this.add.group();
    this.spawners = this.add.group();
    this.crystalsGroup = this.add.group();
    this.healthDrops = this.add.group();
    
    // Crear jugador
    this.player = new Player(this, this.scale.width / 2, this.scale.height - 200);
    this.player.setVisible(true);
    this.player.setAlpha(1);
    console.log('👤 Jugador creado:', this.player.x, this.player.y, 'visible:', this.player.visible, 'alpha:', this.player.alpha);
    
    // Input
    this.setupInput();
    
    // Eventos del juego
    this.setupGameEvents();
    
    // Colisiones
    this.setupCollisions();
    
    // HUD
    this.createHUD();
    
    // UI de estado IDLE
    this.createIdleUI();
    
    // Escuchar resize
    this.scale.on('resize', this.handleResize, this);
  }
  
  createStarfield() {
    this.stars = [];
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
      const star = this.add.graphics();
      const x = Math.random() * this.scale.width;
      const y = Math.random() * this.scale.height;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.5 + 0.3;
      
      star.fillStyle(0xffffff, alpha);
      star.fillCircle(0, 0, size);
      star.setPosition(x, y);
      star.setDepth(-10);
      
      this.stars.push({
        graphic: star,
        speed: size * 20,
        baseAlpha: alpha
      });
    }
  }
  
  updateStarfield() {
    this.stars.forEach(star => {
      star.graphic.y += star.speed * 0.016;
      
      if (star.graphic.y > this.scale.height) {
        star.graphic.y = 0;
        star.graphic.x = Math.random() * this.scale.width;
      }
      
      // Twinkle
      const twinkle = Math.sin(this.time.now * 0.005 + star.graphic.x) * 0.2;
      star.graphic.alpha = star.baseAlpha + twinkle;
    });
  }
  
  setupInput() {
    console.log('🎮 Configurando input...');
    
    // Mouse move - usar coordenadas globales para evitar desfase con scroll
    this.input.on('pointermove', (pointer) => {
      if (this.gameState === GAME_CONFIG.STATES.PLAYING) {
        // Obtener coordenadas del canvas desde el evento global
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        
        // Calcular posición relativa al canvas considerando el scroll
        const x = pointer.x - rect.left;
        const y = pointer.y - rect.top;
        
        this.player.setTarget(x, y);
      }
    });
    
    // También escuchar eventos globales del mouse para mayor precisión
    this.globalMouseMoveHandler = (event) => {
      // Guardar coordenadas globales para sincronización después del scroll
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      
      if (this.gameState === GAME_CONFIG.STATES.PLAYING && this.player) {
        const canvas = this.game.canvas;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Solo actualizar si las coordenadas están dentro del canvas
        if (x >= 0 && x <= this.scale.width && y >= 0 && y <= this.scale.height) {
          this.player.setTarget(x, y);
        }
      }
    };
    
    window.addEventListener('mousemove', this.globalMouseMoveHandler);
    
    // Click para misil / reiniciar
    this.input.on('pointerdown', (pointer) => {
      console.log('🖱️ Click detectado! Estado:', this.gameState);
      if (this.gameState === GAME_CONFIG.STATES.IDLE) {
        console.log('🚀 Iniciando juego...');
        this.startGame();
      } else if (this.gameState === GAME_CONFIG.STATES.PLAYING) {
        this.fireMissile();
      } else if (this.gameState === GAME_CONFIG.STATES.GAME_OVER) {
        console.log('🔄 Reiniciando juego...');
        this.restartGame();
      }
    });
    
    // ESC para pausar/salir
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => {
      if (this.gameState === GAME_CONFIG.STATES.PLAYING) {
        this.pauseGame();
      } else if (this.gameState === GAME_CONFIG.STATES.PAUSED) {
        this.resumeGame();
      }
    });
    
    // Desactivar scroll con espacio cuando el juego está activo
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', (event) => {
      if (this.gameState === GAME_CONFIG.STATES.PLAYING) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
  
  setupGameEvents() {
    // Spawn de enemigos desde spawners
    this.events.on('spawnEnemy', (x, y, type) => {
      if (this.gameState !== GAME_CONFIG.STATES.PLAYING) return;
      
      const enemy = new Enemy(this, x, y, type);
      this.enemies.add(enemy);
    });
    
    // Disparo de enemigos
    this.events.on('enemyFire', (x, y, angle, damage) => {
      const bullet = new Bullet(this, x, y, angle, true);
      this.enemyBullets.add(bullet);
    });
    
    // Muerte de enemigos
    this.events.on('enemyDeath', (x, y, points, crystalDrop, type) => {
      this.score += points;
      this.enemiesKilled++;
      
      // Rastrear por tipo
      if (this.enemiesKilledByType[type] !== undefined) {
        this.enemiesKilledByType[type]++;
      }
      
      this.updateHUD();
      
      // Drop de cristales (cantidad según el tipo de enemigo)
      for (let i = 0; i < crystalDrop; i++) {
        // Offset aleatorio para que los cristales no aparezcan todos en el mismo punto
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        
        const crystal = new Crystal(this, x + offsetX, y + offsetY, 'SMALL');
        this.crystalsGroup.add(crystal);
        
        // Si está activo el auto-magnetismo, magnetizar inmediatamente
        if (this.collectiblesAutoMagnetize) {
          crystal.magnetize();
        }
      }
      
      // Chance de health drop (3%)
      if (Math.random() < 0.03) {
        const health = new HealthDrop(this, x, y);
        this.healthDrops.add(health);
        
        // Si está activo el auto-magnetismo, magnetizar inmediatamente
        if (this.collectiblesAutoMagnetize) {
          health.magnetize();
        }
      }
    });
    
    // Spawner destruido
    this.events.on('spawnerDestroyed', (x, y, cardElement) => {
      this.score += 500;
      this.updateHUD();
      
      // NO completar la pantalla si es una pelea de jefe - solo se completa cuando el jefe muere
      if (this.isBossFight) {
        console.log('⚔️ Spawner destruido durante pelea de jefe - esperando a que el jefe muera');
        return;
      }
      
      // Verificar si quedan spawners activos
      const activeSpawners = this.spawners.getChildren().filter(s => s.active && !s.isDestroyed);
      
      console.log('🔍 Spawners activos:', activeSpawners.length);
      
      if (activeSpawners.length === 0) {
        console.log('✅ Todos los spawners destruidos, completando pantalla...');
        this.sectionComplete();
      }
    });
    
    // Spawn de cristales
    this.events.on('spawnCrystal', (x, y, size) => {
      const crystal = new Crystal(this, x, y, size);
      this.crystalsGroup.add(crystal);
      
      // Si está activo el auto-magnetismo, magnetizar inmediatamente
      if (this.collectiblesAutoMagnetize) {
        crystal.magnetize();
      }
    });
    
    // Explosión de misil
    this.events.on('missileExplosion', (x, y, radius, damage) => {
      // Dañar enemigos en el área
      this.enemies.getChildren().forEach(enemy => {
        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        if (distance <= radius) {
          enemy.takeDamage(damage);
        }
      });
      
      // Dañar spawners en el área
      this.spawners.getChildren().forEach(spawner => {
        const distance = Phaser.Math.Distance.Between(x, y, spawner.x, spawner.y);
        if (distance <= radius) {
          spawner.takeDamage(damage);
        }
      });
      
      // Dañar al jefe en el área (el daño AOE puede atravesar escudos)
      if (this.boss && !this.boss.isDestroyed) {
        const bossDistance = Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y);
        if (bossDistance <= radius + this.boss.size * 0.4) {
          this.boss.takeDamage(damage);
        }
      }
    });
    
    // Muerte del jugador
    this.events.on('playerDeath', () => {
      this.gameOver();
    });
  }
  
  setupCollisions() {
    // Las colisiones se manejan manualmente en checkAllCollisions()
    // porque usamos grupos regulares, no grupos de física
  }
  
  bulletHitEnemy(bullet, enemy) {
    const damage = bullet.damage;
    bullet.destroy();
    enemy.takeDamage(damage);
    this.bulletsHit++;
  }
  
  bulletHitSpawner(bullet, spawner) {
    const damage = bullet.damage;
    bullet.destroy();
    spawner.takeDamage(damage);
    this.bulletsHit++;
  }
  
  checkAllCollisions() {
    const playerX = this.player.x;
    const playerY = this.player.y;
    const playerRadius = 16;
    
    // Balas del jugador vs enemigos
    this.playerBullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
      
      this.enemies.getChildren().forEach(enemy => {
        if (!enemy.active || enemy.hp <= 0) return;
        
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < enemy.config.size / 2 + 5) {
          this.bulletHitEnemy(bullet, enemy);
        }
      });
    });
    
    // Balas del jugador vs spawners
    this.playerBullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
      
      this.spawners.getChildren().forEach(spawner => {
        if (spawner.isDestroyed) return;
        
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, spawner.x, spawner.y);
        if (dist < 40) {
          this.bulletHitSpawner(bullet, spawner);
        }
      });
    });
    
    // Misiles vs enemigos y spawners
    this.missiles.getChildren().forEach(missile => {
      if (!missile || !missile.active || missile.hasExploded || !missile.scene) return;
      
      this.enemies.getChildren().forEach(enemy => {
        if (!enemy || !enemy.active || enemy.hp <= 0) return;
        
        const dist = Phaser.Math.Distance.Between(missile.x, missile.y, enemy.x, enemy.y);
        if (dist < enemy.config.size / 2 + 10) {
          this.missileHitEnemy(missile, enemy);
        }
      });
      
      this.spawners.getChildren().forEach(spawner => {
        if (!spawner || spawner.isDestroyed || !spawner.active) return;
        
        const dist = Phaser.Math.Distance.Between(missile.x, missile.y, spawner.x, spawner.y);
        if (dist < 50) {
          this.missileHitSpawner(missile, spawner);
        }
      });
    });
    
    // Balas enemigas vs jugador
    this.enemyBullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
      
      const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, playerX, playerY);
      if (dist < playerRadius + 5) {
        this.enemyBulletHitPlayer(this.player, bullet);
      }
    });
    
    // Enemigos vs jugador
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.hp <= 0) return;
      
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerX, playerY);
      if (dist < playerRadius + enemy.config.size / 2) {
        this.enemyHitPlayer(this.player, enemy);
      }
    });
    
    // Cristales vs jugador
    this.crystalsGroup.getChildren().forEach(crystal => {
      if (!crystal.active || crystal.isCollected) return;
      
      const dist = Phaser.Math.Distance.Between(crystal.x, crystal.y, playerX, playerY);
      if (dist < playerRadius + 15) {
        this.collectCrystal(this.player, crystal);
      }
    });
    
    // Health drops vs jugador
    this.healthDrops.getChildren().forEach(health => {
      if (!health.active || health.isCollected) return;
      
      const dist = Phaser.Math.Distance.Between(health.x, health.y, playerX, playerY);
      if (dist < playerRadius + 15) {
        this.collectHealth(this.player, health);
      }
    });
    
    // Colisiones con el jefe (si está activo)
    if (this.boss && !this.boss.isDestroyed) {
      // Balas del jugador vs jefe (verificar escudos primero)
      this.playerBullets.getChildren().forEach(bullet => {
        if (!bullet.active) return;
        
        // Verificar si la bala choca con un escudo
        if (this.boss.checkShieldCollision(bullet.x, bullet.y, 5)) {
          // Bala bloqueada por escudo - crear efecto visual
          this.createShieldBlockEffect(bullet.x, bullet.y);
          bullet.destroy();
          return;
        }
        
        // Verificar si la bala choca con el jefe
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.boss.x, this.boss.y);
        if (dist < this.boss.size * 0.4) {
          bullet.destroy();
          this.boss.takeDamage(bullet.damage);
        }
      });
      
      // Misiles vs jefe
      this.missiles.getChildren().forEach(missile => {
        if (!missile || !missile.active || missile.hasExploded || !missile.scene) return;
        
        // Los misiles también pueden ser bloqueados por escudos
        if (this.boss.checkShieldCollision(missile.x, missile.y, 10)) {
          this.createShieldBlockEffect(missile.x, missile.y);
          missile.explode(); // Explota al chocar con escudo
          return;
        }
        
        // Verificar si el misil choca con el jefe
        const dist = Phaser.Math.Distance.Between(missile.x, missile.y, this.boss.x, this.boss.y);
        if (dist < this.boss.size * 0.4 + 10) {
          missile.explode();
          this.boss.takeDamage(GAME_CONFIG.PLAYER.MISSILE_DAMAGE);
        }
      });
      
      // Jugador vs jefe (colisión directa)
      const bossPlayerDist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, playerX, playerY);
      if (bossPlayerDist < playerRadius + this.boss.size * 0.4) {
        if (!this.player.isInvulnerable) {
          this.player.takeDamage(GAME_CONFIG.DAMAGE.COLLISION * 2); // Más daño por chocar con el jefe
          this.updateHUD();
        }
      }
      
      // Jugador vs escudos del jefe
      if (this.boss.checkShieldCollision(playerX, playerY, playerRadius)) {
        if (!this.player.isInvulnerable) {
          this.player.takeDamage(GAME_CONFIG.DAMAGE.COLLISION);
          this.updateHUD();
        }
      }
    }
  }
  
  createShieldBlockEffect(x, y) {
    const effect = this.add.graphics();
    effect.setPosition(x, y);
    effect.fillStyle(0x00ffff, 1);
    effect.fillCircle(0, 0, 10);
    effect.lineStyle(2, 0x00ffff, 1);
    effect.strokeCircle(0, 0, 15);
    
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => effect.destroy()
    });
  }
  
  missileHitEnemy(missile, enemy) {
    if (!missile || !missile.active || missile.hasExploded || !missile.scene) return;
    if (!enemy || !enemy.active || enemy.hp <= 0) return;
    
    missile.explode();
    enemy.takeDamage(GAME_CONFIG.PLAYER.MISSILE_DAMAGE);
    this.missilesHit++;
  }
  
  missileHitSpawner(missile, spawner) {
    if (!missile || !missile.active || missile.hasExploded || !missile.scene) return;
    if (!spawner || spawner.isDestroyed) return;
    
    missile.explode();
    spawner.takeDamage(GAME_CONFIG.PLAYER.MISSILE_DAMAGE);
    this.missilesHit++;
  }
  
  enemyBulletHitPlayer(player, bullet) {
    bullet.destroy();
    this.player.takeDamage(GAME_CONFIG.DAMAGE.ENEMY_BULLET);
    this.updateHUD();
  }
  
  enemyHitPlayer(player, enemy) {
    if (!this.player.isInvulnerable) {
      this.player.takeDamage(GAME_CONFIG.DAMAGE.COLLISION);
      this.updateHUD();
    }
  }
  
  collectCrystal(player, crystal) {
    const value = crystal.collect();
    if (value > 0) {
      this.crystals += value;
      this.updateHUD();
    }
  }
  
  collectHealth(player, health) {
    const amount = health.collect();
    if (amount > 0) {
      this.player.heal(amount);
      this.updateHUD();
    }
  }
  
  createHUD() {
    const style = {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '16px',
      color: '#00ffff',
      stroke: '#003333',
      strokeThickness: 2
    };
    
    // Container del HUD
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setDepth(100);
    this.hudContainer.setScrollFactor(0);
    
    // Fondo del HUD (más alto para incluir el daño)
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0x000000, 0.7);
    this.hudBg.fillRect(10, 10, 200, 120);
    this.hudBg.lineStyle(2, GAME_CONFIG.COLORS.CYAN_NEON, 0.5);
    this.hudBg.strokeRect(10, 10, 200, 120);
    
    // HP Bar
    this.hpBarBg = this.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 1);
    this.hpBarBg.fillRect(20, 25, 180, 20);
    
    this.hpBar = this.add.graphics();
    
    // Textos
    this.hpText = this.add.text(20, 50, 'HP: 100/100', style);
    this.scoreText = this.add.text(20, 70, 'SCORE: 0', style);
    this.damageText = this.add.text(20, 90, 'DMG: 10', style);
    this.crystalText = this.add.text(120, 50, '💎 0', { ...style, fontSize: '14px' });
    
    this.hudContainer.add([this.hudBg, this.hpBarBg, this.hpBar, this.hpText, this.scoreText, this.damageText, this.crystalText]);
    
    // HUD de oleada (arriba centro)
    this.waveHUD = this.add.container(this.scale.width / 2, 0);
    this.waveHUD.setDepth(100);
    
    const waveBg = this.add.graphics();
    waveBg.fillStyle(0x000000, 0.7);
    waveBg.fillRoundedRect(-120, 10, 240, 50, 8);
    waveBg.lineStyle(2, GAME_CONFIG.COLORS.MAGENTA, 0.5);
    waveBg.strokeRoundedRect(-120, 10, 240, 50, 8);
    
    this.waveText = this.add.text(0, 25, 'Sobre Mí - Oleada 1/1', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '14px',
      color: '#ff00ff',
      stroke: '#330033',
      strokeThickness: 2
    });
    this.waveText.setOrigin(0.5, 0);
    
    this.waveHUD.add([waveBg, this.waveText]);
    this.waveHUD.setVisible(false); // Oculto hasta que inicie el juego
    
    // Barra de vida del jefe (parte inferior de la pantalla)
    this.bossHealthContainer = this.add.container(this.scale.width / 2, this.scale.height - 60);
    this.bossHealthContainer.setDepth(100);
    
    const bossBarWidth = 500;
    const bossBarHeight = 30;
    
    // Fondo de la barra
    const bossBarBg = this.add.graphics();
    bossBarBg.fillStyle(0x000000, 0.8);
    bossBarBg.fillRoundedRect(-bossBarWidth / 2 - 10, -bossBarHeight / 2 - 20, bossBarWidth + 20, bossBarHeight + 40, 8);
    bossBarBg.lineStyle(2, 0xff0066, 0.8);
    bossBarBg.strokeRoundedRect(-bossBarWidth / 2 - 10, -bossBarHeight / 2 - 20, bossBarWidth + 20, bossBarHeight + 40, 8);
    
    // Nombre del jefe
    this.bossNameText = this.add.text(0, -bossBarHeight / 2 - 10, '⚠️ GUARDIÁN DEL CÓDIGO ⚠️', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: '#ff0066',
      stroke: '#330022',
      strokeThickness: 2
    });
    this.bossNameText.setOrigin(0.5, 1);
    
    // Barra de fondo
    const bossHpBarBg = this.add.graphics();
    bossHpBarBg.fillStyle(0x330011, 1);
    bossHpBarBg.fillRect(-bossBarWidth / 2, -bossBarHeight / 2, bossBarWidth, bossBarHeight);
    
    // Barra de vida
    this.bossHpBar = this.add.graphics();
    this.bossHpBarWidth = bossBarWidth;
    this.bossHpBarHeight = bossBarHeight;
    
    // Texto de HP
    this.bossHpText = this.add.text(0, 0, '2000 / 2000', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.bossHpText.setOrigin(0.5);
    
    this.bossHealthContainer.add([bossBarBg, this.bossNameText, bossHpBarBg, this.bossHpBar, this.bossHpText]);
    this.bossHealthContainer.setVisible(false);
    
    // Ocultar HUD en IDLE
    this.hudContainer.setVisible(false);
  }
  
  updateBossHealthBar() {
    if (!this.boss || !this.bossHpBar) return;
    
    const hpPercent = this.boss.hp / this.boss.maxHp;
    
    // Color basado en fase
    let hpColor;
    if (hpPercent > 0.6) {
      hpColor = 0xff0066; // Rosa
    } else if (hpPercent > 0.3) {
      hpColor = 0xff6600; // Naranja
    } else {
      hpColor = 0xff0000; // Rojo
    }
    
    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(hpColor, 1);
    this.bossHpBar.fillRect(
      -this.bossHpBarWidth / 2, 
      -this.bossHpBarHeight / 2, 
      this.bossHpBarWidth * hpPercent, 
      this.bossHpBarHeight
    );
    
    // Efecto de brillo pulsante cuando está bajo de vida
    if (hpPercent <= 0.3) {
      const pulse = 0.7 + Math.sin(this.time.now * 0.01) * 0.3;
      this.bossHpBar.alpha = pulse;
    } else {
      this.bossHpBar.alpha = 1;
    }
    
    this.bossHpText.setText(`${this.boss.hp} / ${this.boss.maxHp}`);
  }
  
  updateHUD() {
    // Actualizar barra de HP
    this.hpBar.clear();
    const hpPercent = this.player.hp / this.player.maxHp;
    const hpColor = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffff00 : 0xff0000;
    
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRect(20, 25, 180 * hpPercent, 20);
    
    // Actualizar textos
    this.hpText.setText(`HP: ${this.player.hp}/${this.player.maxHp}`);
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.crystalText.setText(`💎 ${this.crystals}`);
    
    // Mostrar daño actual de las balas
    if (this.damageText) {
      this.damageText.setText(`DMG: ${this.player.bulletDamage}`);
    }
  }
  
  updateWaveHUD() {
    const section = this.sections[this.currentSection];
    if (!section) return;
    
    const totalScreens = section.screens.length;
    const currentScreen = this.currentScreenInSection + 1;
    
    if (this.waveText) {
      this.waveText.setText(`${section.name} - Oleada ${currentScreen}/${totalScreens}`);
    }
    
    if (this.waveHUD) {
      this.waveHUD.setVisible(this.gameState === GAME_CONFIG.STATES.PLAYING);
    }
  }
  
  createIdleUI() {
    this.idleContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.idleContainer.setDepth(50);
    
    // Título
    const titleStyle = {
      fontFamily: '"Orbitron", "Press Start 2P", sans-serif',
      fontSize: '32px',
      color: '#00ffff',
      stroke: '#003333',
      strokeThickness: 4,
      shadow: { color: '#00ffff', blur: 10, fill: true }
    };
    
    const title = this.add.text(0, -100, 'SPACE PORTFOLIO', titleStyle);
    title.setOrigin(0.5);
    
    // Instrucciones
    const instructionStyle = {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    };
    
    const instructions = this.add.text(0, 0, 
      'Click para comenzar\n\n' +
      '🖱️ Mover: Cursor\n' +
      '🔫 Disparo: Automático\n' +
      '🚀 Misil: Click\n' +
      '⏸️ Pausa: ESC',
      instructionStyle
    );
    instructions.setOrigin(0.5);
    
    // Pulso en el título
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.idleContainer.add([title, instructions]);
  }
  
  createSpawnersForScreen() {
    const section = this.sections[this.currentSection];
    if (!section) return;
    
    const screen = section.screens[this.currentScreenInSection];
    if (!screen) return;
    
    // Verificar si es pelea de jefe
    if (screen.isBoss) {
      this.startBossFight();
      return;
    }
    
    const spawnerCount = screen.spawnerCount;
    const difficulty = screen.difficulty;
    
    // Distribuir spawners horizontalmente en la pantalla
    const spacing = this.scale.width / (spawnerCount + 1);
    
    for (let i = 0; i < spawnerCount; i++) {
      const x = spacing * (i + 1);
      const y = 150 + Math.random() * 100; // Parte superior de la pantalla visible
      
      const spawner = new Spawner(this, x, y, difficulty);
      this.spawners.add(spawner);
    }
    
    // Mostrar nombre de la sección y oleada
    const totalScreens = section.screens.length;
    const currentScreen = this.currentScreenInSection + 1;
    this.showScreenTitle(section.name, currentScreen, totalScreens);
    
    // Actualizar HUD de oleada
    this.updateWaveHUD();
  }
  
  startBossFight() {
    console.log('🔥 ¡INICIANDO PELEA DE JEFE!');
    
    this.isBossFight = true;
    
    // Limpiar enemigos y spawners existentes
    this.enemies.clear(true, true);
    this.spawners.clear(true, true);
    
    // Mostrar advertencia
    this.showBossWarning();
    
    // Crear el jefe después de la advertencia
    this.time.delayedCall(2000, () => {
      // Posición inicial del jefe (centro superior)
      const bossX = this.scale.width / 2;
      const bossY = 200;
      
      this.boss = new Boss(this, bossX, bossY);
      
      // Mostrar barra de vida del jefe
      this.bossHealthContainer.setVisible(true);
      this.updateBossHealthBar();
      
      // Evento cuando el jefe muere
      this.events.once('bossDefeated', () => {
        this.onBossDefeated();
      });
    });
    
    // Actualizar HUD
    if (this.waveText) {
      this.waveText.setText('⚠️ JEFE FINAL ⚠️');
    }
  }
  
  showBossWarning() {
    // Fondo oscuro
    const warningBg = this.add.graphics();
    warningBg.fillStyle(0x000000, 0.7);
    warningBg.fillRect(0, 0, this.scale.width, this.scale.height);
    warningBg.setDepth(90);
    
    // Texto de advertencia
    const warningText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      '⚠️ PELIGRO ⚠️\n\nGUARDIÁN DEL CÓDIGO\nSE APROXIMA',
      {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: '36px',
        color: '#ff0066',
        stroke: '#330022',
        strokeThickness: 4,
        align: 'center'
      }
    );
    warningText.setOrigin(0.5);
    warningText.setDepth(91);
    
    // Efecto de parpadeo
    this.tweens.add({
      targets: warningText,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 5
    });
    
    // Shake de cámara
    this.cameras.main.shake(1500, 0.01);
    
    // Desvanecer después de 2 segundos
    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: [warningBg, warningText],
        alpha: 0,
        duration: 200,
        onComplete: () => {
          warningBg.destroy();
          warningText.destroy();
        }
      });
    });
  }
  
  onBossDefeated() {
    console.log('🏆 ¡JEFE DERROTADO! ¡VICTORIA!');
    
    this.isBossFight = false;
    this.boss = null;
    
    // Ocultar barra de vida del jefe
    this.bossHealthContainer.setVisible(false);
    
    // Magnetizar todos los collectibles
    this.magnetizeAllCollectibles();
    
    // Esperar a que se recojan los cristales
    this.time.delayedCall(2000, () => {
      this.victory();
    });
  }
  
  showScreenTitle(sectionName, currentWave, totalWaves) {
    const title = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      `${sectionName}\nOleada ${currentWave}/${totalWaves}`,
      {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: '32px',
        color: '#00ffff',
        stroke: '#003333',
        strokeThickness: 4,
        align: 'center'
      }
    );
    title.setOrigin(0.5);
    title.setDepth(100);
    title.alpha = 0;
    
    // Animación de entrada y salida
    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 500,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        title.destroy();
      }
    });
  }
  
  setGameActive(active) {
    const container = document.getElementById('game-container');
    if (container) {
      if (active) {
        container.classList.add('game-active');
        document.body.classList.add('game-mode');
        
        // Prevenir scroll con espacio
        this.preventSpaceScroll = (e) => {
          if (e.code === 'Space' && this.gameState === GAME_CONFIG.STATES.PLAYING) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        };
        document.addEventListener('keydown', this.preventSpaceScroll, true);
      } else {
        container.classList.remove('game-active');
        document.body.classList.remove('game-mode');
        
        // Remover prevención de scroll
        if (this.preventSpaceScroll) {
          document.removeEventListener('keydown', this.preventSpaceScroll, true);
        }
        // Remover listener global del mouse
        if (this.globalMouseMoveHandler) {
          window.removeEventListener('mousemove', this.globalMouseMoveHandler);
        }
      }
    }
  }
  
  startGame() {
    // Asegurar que la escena esté activa y no pausada
    if (this.scene.isPaused()) {
      this.scene.resume();
    }
    
    this.gameState = GAME_CONFIG.STATES.PLAYING;
    this.currentSection = 0;
    this.currentScreenInSection = 0;
    this.screenCompleted = false;
    
    // Iniciar tracking de estadísticas
    this.gameStartTime = this.time.now;
    this.enemiesKilledByType = {
      SCOUT: 0,
      DRIFTER: 0,
      TANK: 0,
      SHOOTER: 0,
      SWARM: 0
    };
    this.upgradesPurchased = [];
    this.sectionsCompleted = [];
    this.bulletsFired = 0;
    this.bulletsHit = 0;
    this.missilesFired = 0;
    this.missilesHit = 0;
    
    // Ocultar botón de inicio alternativo
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.classList.add('hidden');
    }
    
    // Activar captura de eventos del juego
    this.setGameActive(true);
    
    // Asegurar que el jugador sea visible
    if (this.player) {
      this.player.setVisible(true);
      this.player.setAlpha(1);
      this.player.setDepth(10);
      console.log('👤 Jugador visible al iniciar:', this.player.visible, this.player.alpha);
    }
    
    // Ocultar UI de idle
    this.tweens.add({
      targets: this.idleContainer,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.idleContainer.setVisible(false);
      }
    });
    
    // Mostrar HUD
    this.hudContainer.setVisible(true);
    this.hudContainer.alpha = 0;
    this.tweens.add({
      targets: this.hudContainer,
      alpha: 1,
      duration: 300
    });
    
    // Mostrar HUD de oleada
    if (this.waveHUD) {
      this.waveHUD.setVisible(true);
      this.waveHUD.alpha = 0;
      this.tweens.add({
        targets: this.waveHUD,
        alpha: 1,
        duration: 300
      });
    }
    
    // Actualizar HUD inicial
    this.updateHUD();
    this.updateWaveHUD();
    
    // Aplicar mejoras iniciales
    this.applyAllUpgrades();
    
    // Scroll a la primera sección (About)
    const aboutPage = document.getElementById('page-about');
    if (aboutPage) {
      aboutPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Crear spawners para la primera pantalla
    this.createSpawnersForScreen();
    
    // Iniciar spawners después de un pequeño delay
    this.time.delayedCall(500, () => {
      this.spawners.getChildren().forEach(spawner => {
        spawner.spawnInitialEnemies();
      });
    });
    
    // Posicionar jugador en el cursor actual
    const pointer = this.input.activePointer;
    this.player.setTarget(pointer.x, pointer.y);
  }
  
  pauseGame() {
    this.gameState = GAME_CONFIG.STATES.PAUSED;
    this.physics.pause();
    
    // Mostrar UI de pausa
    if (!this.pauseUI) {
      this.createPauseUI();
    }
    this.pauseUI.setVisible(true);
    
    // Animación de entrada
    this.pauseUI.alpha = 0;
    this.pauseUI.scale = 0.9;
    this.tweens.add({
      targets: this.pauseUI,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }
  
  resumeGame() {
    this.gameState = GAME_CONFIG.STATES.PLAYING;
    this.physics.resume();
    
    if (this.pauseUI) {
      this.pauseUI.setVisible(false);
    }
  }
  
  createPauseUI() {
    this.pauseUI = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.pauseUI.setDepth(150);
    
    // Fondo con efecto
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-this.scale.width / 2, -this.scale.height / 2, this.scale.width, this.scale.height);
    
    // Bordes decorativos
    bg.lineStyle(3, 0x00ffff, 0.6);
    bg.strokeRect(-this.scale.width / 2 + 20, -this.scale.height / 2 + 20, this.scale.width - 40, this.scale.height - 40);
    bg.lineStyle(1, 0x00ffff, 0.3);
    bg.strokeRect(-this.scale.width / 2 + 30, -this.scale.height / 2 + 30, this.scale.width - 60, this.scale.height - 60);
    
    // Partículas de fondo (estrellas)
    for (let i = 0; i < 20; i++) {
      const star = this.add.graphics();
      const x = (Math.random() - 0.5) * this.scale.width * 0.9;
      const y = (Math.random() - 0.5) * this.scale.height * 0.9;
      star.fillStyle(0x00ffff, Math.random() * 0.4 + 0.2);
      star.fillCircle(x, y, Math.random() * 2 + 1);
      this.pauseUI.add(star);
      
      // Animación de parpadeo
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Panel central
    const panelWidth = 400;
    const panelHeight = 300;
    const panel = this.add.graphics();
    panel.fillStyle(0x001122, 0.8);
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
    panel.lineStyle(2, 0x00ffff, 0.8);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
    
    // Título de pausa
    const pauseText = this.add.text(0, -100, '⏸️ PAUSA', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '42px',
      color: '#00ffff',
      stroke: '#003333',
      strokeThickness: 4
    });
    pauseText.setOrigin(0.5);
    
    // Efecto de pulso en el título
    this.tweens.add({
      targets: pauseText,
      scale: { from: 1, to: 1.05 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Estadísticas rápidas
    const gameTime = this.time.now - this.gameStartTime;
    const minutes = Math.floor(gameTime / 60000);
    const seconds = Math.floor((gameTime % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const statsText = this.add.text(0, -30,
      `⏱️ Tiempo: ${timeString}\n⭐ Puntos: ${this.score.toLocaleString()}\n💎 Cristales: ${this.crystals}`,
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8
      }
    );
    statsText.setOrigin(0.5);
    
    // Botón de reanudar
    const resumeBtn = this.add.graphics();
    resumeBtn.fillStyle(0x003333, 1);
    resumeBtn.fillRoundedRect(-140, 40, 280, 50, 10);
    resumeBtn.lineStyle(2, 0x00ffff, 1);
    resumeBtn.strokeRoundedRect(-140, 40, 280, 50, 10);
    
    const resumeText = this.add.text(0, 65, '▶️ REANUDAR (ESC)', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '18px',
      color: '#00ffff'
    });
    resumeText.setOrigin(0.5);
    
    const resumeHitArea = this.add.rectangle(0, 65, 280, 50, 0x000000, 0);
    resumeHitArea.setInteractive({ useHandCursor: true });
    
    resumeHitArea.on('pointerover', () => {
      resumeBtn.clear();
      resumeBtn.fillStyle(0x004444, 1);
      resumeBtn.fillRoundedRect(-140, 40, 280, 50, 10);
      resumeBtn.lineStyle(3, 0x00ffff, 1);
      resumeBtn.strokeRoundedRect(-140, 40, 280, 50, 10);
      resumeText.setScale(1.05);
    });
    
    resumeHitArea.on('pointerout', () => {
      resumeBtn.clear();
      resumeBtn.fillStyle(0x003333, 1);
      resumeBtn.fillRoundedRect(-140, 40, 280, 50, 10);
      resumeBtn.lineStyle(2, 0x00ffff, 1);
      resumeBtn.strokeRoundedRect(-140, 40, 280, 50, 10);
      resumeText.setScale(1);
    });
    
    resumeHitArea.on('pointerdown', () => {
      this.resumeGame();
    });
    
    // Botón de volver a la web
    const exitBtn = this.add.graphics();
    exitBtn.fillStyle(0x330011, 1);
    exitBtn.fillRoundedRect(-140, 110, 280, 50, 10);
    exitBtn.lineStyle(2, 0xff0066, 1);
    exitBtn.strokeRoundedRect(-140, 110, 280, 50, 10);
    
    const exitText = this.add.text(0, 135, '🌐 VOLVER A LA WEB', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '18px',
      color: '#ff0066'
    });
    exitText.setOrigin(0.5);
    
    const exitHitArea = this.add.rectangle(0, 135, 280, 50, 0x000000, 0);
    exitHitArea.setInteractive({ useHandCursor: true });
    
    exitHitArea.on('pointerover', () => {
      exitBtn.clear();
      exitBtn.fillStyle(0x550033, 1);
      exitBtn.fillRoundedRect(-140, 110, 280, 50, 10);
      exitBtn.lineStyle(3, 0xff0066, 1);
      exitBtn.strokeRoundedRect(-140, 110, 280, 50, 10);
      exitText.setScale(1.05);
    });
    
    exitHitArea.on('pointerout', () => {
      exitBtn.clear();
      exitBtn.fillStyle(0x330011, 1);
      exitBtn.fillRoundedRect(-140, 110, 280, 50, 10);
      exitBtn.lineStyle(2, 0xff0066, 1);
      exitBtn.strokeRoundedRect(-140, 110, 280, 50, 10);
      exitText.setScale(1);
    });
    
    exitHitArea.on('pointerdown', () => {
      // Recargar la página para volver a la web normal
      window.location.reload();
    });
    
    this.pauseUI.add([bg, panel, pauseText, statsText, resumeBtn, resumeText, resumeHitArea, exitBtn, exitText, exitHitArea]);
    this.pauseUI.setVisible(false);
  }
  
  sectionComplete() {
    // NO completar si es una pelea de jefe - solo se completa cuando el jefe muere
    if (this.isBossFight) {
      console.log('⚔️ Intento de completar pantalla durante pelea de jefe - ignorado');
      return;
    }
    
    // Evitar múltiples llamadas
    if (this.screenCompleted) return;
    this.screenCompleted = true;
    
    console.log('🎉 Pantalla completada!');
    
    // Limpiar enemigos restantes
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.die();
    });
    
    // Limpiar balas y misiles
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.missiles.clear(true, true);
    
    // Desactivar todos los spawners para que no sigan spawneando
    this.spawners.getChildren().forEach(spawner => {
      if (spawner.active && !spawner.isDestroyed) {
        spawner.disableSpawning();
      }
    });
    
    // Magnetizar todos los collectibles para que vuelen hacia el jugador
    this.magnetizeAllCollectibles();
    
    // Activar flag para magnetizar cualquier collectible nuevo que aparezca
    this.collectiblesAutoMagnetize = true;
    
    // Mostrar mensaje de pantalla completada
    this.showScreenCompleteMessage();
    
    // Esperar a que se recojan los collectibles
    this.time.delayedCall(2500, () => {
      const section = this.sections[this.currentSection];
      
      // Verificar si hay más pantallas en esta sección
      this.currentScreenInSection++;
      
      if (this.currentScreenInSection >= section.screens.length) {
        // Se completó toda la sección - mostrar footer de mejoras
        console.log('✅ Sección completada! Mostrando footer de mejoras...');
        
        // Rastrear sección completada
        this.sectionsCompleted.push({
          sectionId: section.id,
          sectionName: section.name,
          screensCompleted: section.screens.length
        });
        
        this.showUpgradeFooter();
      } else {
        // Hay más pantallas en esta sección - continuar
        console.log(`📺 Pasando a pantalla ${this.currentScreenInSection + 1} de la sección...`);
        
        // Limpiar spawners anteriores
        this.spawners.clear(true, true);
        
        // Resetear flags para la nueva pantalla
        this.screenCompleted = false;
        this.collectiblesAutoMagnetize = false;
        
        // Crear spawners para la nueva pantalla
        this.time.delayedCall(1000, () => {
          this.createSpawnersForScreen();
          
          // Iniciar spawners
          this.spawners.getChildren().forEach(spawner => {
            spawner.spawnInitialEnemies();
          });
        });
      }
    });
  }
  
  showUpgradeFooter() {
    // Pausar el juego
    this.gameState = GAME_CONFIG.STATES.PAUSED;
    
    // Marcar la sección actual como conquistada
    const currentSectionData = this.sections[this.currentSection];
    if (currentSectionData && window.conquestSection) {
      window.conquestSection(currentSectionData.pageId);
    }
    
    // Mostrar el footer de mejoras en el DOM
    const footer = document.getElementById('upgrade-footer');
    if (footer) {
      footer.classList.add('visible');
      this.updateUpgradeFooter();
    }
  }
  
  hideUpgradeFooter() {
    const footer = document.getElementById('upgrade-footer');
    if (footer) {
      footer.classList.remove('visible');
    }
    
    // Reanudar el juego
    if (this.gameState === GAME_CONFIG.STATES.PAUSED) {
      this.gameState = GAME_CONFIG.STATES.PLAYING;
    }
  }
  
  updateUpgradeFooter() {
    const footer = document.getElementById('upgrade-footer');
    if (!footer) return;
    
    // Actualizar cristales disponibles
    const crystalsDisplay = footer.querySelector('.upgrade-crystals');
    if (crystalsDisplay) {
      crystalsDisplay.textContent = this.crystals;
    }
    
    // Actualizar cada botón de mejora
    UPGRADE_ORDER.forEach(upgradeKey => {
      const upgrade = UPGRADES[upgradeKey];
      if (!upgrade) return;
      
      const currentLevel = this.upgradeLevels[upgradeKey] || 0;
      const cost = getUpgradeCost(upgradeKey, currentLevel);
      const isMaxLevel = currentLevel >= upgrade.maxLevel;
      
      const btn = footer.querySelector(`[data-upgrade="${upgradeKey}"]`);
      if (btn) {
        const costDisplay = btn.querySelector('.upgrade-cost');
        const levelDisplay = btn.querySelector('.upgrade-level');
        
        if (costDisplay) {
          costDisplay.textContent = isMaxLevel ? '✓ MAX' : `💎 ${cost}`;
        }
        
        if (levelDisplay) {
          levelDisplay.textContent = `${currentLevel}/${upgrade.maxLevel}`;
        }
        
        // Deshabilitar si no hay suficientes cristales o está al máximo
        btn.disabled = isMaxLevel || this.crystals < cost;
        btn.classList.toggle('max-level', isMaxLevel);
        btn.classList.toggle('cant-afford', !isMaxLevel && this.crystals < cost);
      }
    });
  }
  
  purchaseUpgrade(upgradeKey) {
    const currentLevel = this.upgradeLevels[upgradeKey];
    const cost = getUpgradeCost(upgradeKey, currentLevel);
    
    console.log(`💰 Intentando comprar mejora ${upgradeKey}: nivel actual ${currentLevel}, costo ${cost}, cristales ${this.crystals}`);
    
    if (this.crystals < cost || currentLevel >= UPGRADES[upgradeKey].maxLevel) {
      console.log(`  ❌ No se puede comprar: cristales insuficientes o nivel máximo alcanzado`);
      return false;
    }
    
    // Comprar mejora
    this.crystals -= cost;
    this.upgradeLevels[upgradeKey]++;
    
    // Rastrear mejora comprada
    const upgradeName = UPGRADES[upgradeKey].name;
    const newLevel = this.upgradeLevels[upgradeKey];
    this.upgradesPurchased.push({
      name: upgradeName,
      level: newLevel,
      cost: cost
    });
    
    console.log(`  ✅ Mejora comprada! Nuevo nivel: ${this.upgradeLevels[upgradeKey]}, cristales restantes: ${this.crystals}`);
    
    // Aplicar mejora al jugador
    this.applyUpgrade(upgradeKey);
    
    // Actualizar footer
    this.updateUpgradeFooter();
    
    // Actualizar HUD
    this.updateHUD();
    
    return true;
  }
  
  applyUpgrade(upgradeKey) {
    const level = this.upgradeLevels[upgradeKey];
    const value = getUpgradeValue(upgradeKey, level);
    
    console.log(`🔧 Aplicando mejora ${upgradeKey}: nivel ${level}, valor ${value}`);
    
    switch (upgradeKey) {
      case 'BULLET_DAMAGE':
        this.player.bulletDamage = value;
        console.log(`  → Daño de balas actualizado a: ${this.player.bulletDamage}`);
        break;
        
      case 'FIRE_RATE':
        this.player.fireRate = value;
        console.log(`  → Cadencia de disparo actualizada a: ${this.player.fireRate}ms`);
        break;
        
      case 'DOUBLE_SHOT':
        this.player.shotCount = value;
        console.log(`  → Cantidad de balas por disparo: ${this.player.shotCount}`);
        break;
        
      case 'MAX_HP':
        const oldMaxHp = this.player.maxHp;
        this.player.maxHp = value;
        // Mantener la misma proporción de HP
        const hpRatio = this.player.hp / oldMaxHp;
        this.player.hp = Math.floor(value * hpRatio);
        console.log(`  → Vida máxima actualizada a: ${this.player.maxHp}`);
        break;
        
      case 'MISSILE_COOLDOWN':
        this.player.missileCooldown = value;
        console.log(`  → Cooldown de misil actualizado a: ${this.player.missileCooldown}ms`);
        break;
        
      case 'MISSILE_COUNT':
        const oldMax = this.player.maxMissiles;
        this.player.maxMissiles = value;
        
        // Si aumentó el máximo, también aumentar el stock actual
        if (value > oldMax) {
          const difference = value - oldMax;
          this.player.missileCount = Math.min(this.player.missileCount + difference, this.player.maxMissiles);
          console.log(`  → Cantidad máxima de misiles actualizada a: ${this.player.maxMissiles}`);
          console.log(`  → Stock de misiles aumentado a: ${this.player.missileCount}/${this.player.maxMissiles}`);
        } else {
          this.player.missileCount = Math.min(this.player.missileCount, this.player.maxMissiles);
          console.log(`  → Cantidad máxima de misiles actualizada a: ${this.player.maxMissiles}`);
        }
        break;
    }
    
    // Actualizar HUD
    this.updateHUD();
  }
  
  applyAllUpgrades() {
    // Aplicar todas las mejoras actuales al jugador
    Object.keys(this.upgradeLevels).forEach(upgradeKey => {
      const level = this.upgradeLevels[upgradeKey];
      const value = getUpgradeValue(upgradeKey, level);
      
      switch (upgradeKey) {
        case 'BULLET_DAMAGE':
          this.player.bulletDamage = value;
          break;
        case 'FIRE_RATE':
          this.player.fireRate = value;
          break;
        case 'DOUBLE_SHOT':
          this.player.shotCount = value;
          break;
        case 'MAX_HP':
          this.player.maxHp = value;
          this.player.hp = value; // Al inicio, HP lleno
          break;
        case 'MISSILE_COOLDOWN':
          this.player.missileCooldown = value;
          break;
        case 'MISSILE_COUNT':
          this.player.maxMissiles = value;
          this.player.missileCount = value; // Stock lleno al inicio
          break;
      }
    });
    
    console.log(`🔧 Todas las mejoras aplicadas`);
  }
  
  proceedToNextSection() {
    this.currentSection++;
    this.currentScreenInSection = 0;
    this.screenCompleted = false;
    this.collectiblesAutoMagnetize = false;
    
    if (this.currentSection >= this.sections.length) {
      // Victoria - completó todas las secciones
      this.victory();
      return;
    }
    
    // Ocultar footer
    this.hideUpgradeFooter();
    
    // Limpiar spawners anteriores
    this.spawners.clear(true, true);
    
    // Navegar a la siguiente sección en la página web
    const nextSection = this.sections[this.currentSection];
    if (nextSection && nextSection.pageId) {
      // Disparar evento para cambiar de página
      const navLink = document.querySelector(`.nav-link[data-page="${nextSection.pageId}"]`);
      if (navLink) {
        navLink.click();
      }
    }
    
    // Crear spawners para la nueva sección
    this.time.delayedCall(1000, () => {
      this.createSpawnersForScreen();
      
      // Iniciar spawners
      this.spawners.getChildren().forEach(spawner => {
        spawner.spawnInitialEnemies();
      });
    });
  }
  
  magnetizeAllCollectibles() {
    // Magnetizar todos los cristales
    this.crystalsGroup.getChildren().forEach(crystal => {
      if (crystal.active && !crystal.isCollected) {
        crystal.magnetize();
      }
    });
    
    // Magnetizar todos los health drops
    this.healthDrops.getChildren().forEach(health => {
      if (health.active && !health.isCollected) {
        health.magnetize();
      }
    });
    
    console.log('🧲 Collectibles magnetizados hacia el jugador');
  }
  
  showScreenCompleteMessage() {
    const completeText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      '¡PANTALLA COMPLETADA!',
      {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: '32px',
        color: '#00ff00',
        stroke: '#003300',
        strokeThickness: 4
      }
    );
    completeText.setOrigin(0.5);
    completeText.setDepth(100);
    
    this.tweens.add({
      targets: completeText,
      alpha: 0,
      y: completeText.y - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        completeText.destroy();
      }
    });
  }
  
  scrollToNextSection() {
    // Esta función ya no se usa en el nuevo sistema de secciones
    // Se mantiene por compatibilidad pero no hace nada
    // La navegación ahora se maneja en proceedToNextSection()
    return;
  }
  
  victory() {
    this.gameState = GAME_CONFIG.STATES.GAME_OVER;
    
    // Rastrear tiempo de partida
    this.gameEndTime = this.time.now;
    
    // Marcar todas las secciones como completadas si no están ya
    this.sections.forEach((section, index) => {
      const alreadyCompleted = this.sectionsCompleted.find(s => s.sectionId === section.id);
      if (!alreadyCompleted) {
        this.sectionsCompleted.push({
          sectionId: section.id,
          sectionName: section.name,
          screensCompleted: section.screens.length
        });
      }
    });
    
    // Ocultar footer de mejoras
    this.hideUpgradeFooter();
    
    // Ocultar HUD de oleada
    if (this.waveHUD) {
      this.waveHUD.setVisible(false);
    }
    
    // Marcar la última sección como conquistada
    const lastSection = this.sections[this.sections.length - 1];
    if (lastSection && window.conquestSection) {
      window.conquestSection(lastSection.pageId);
    }
    
    // Navegar a "Sobre mí"
    const aboutLink = document.querySelector('.nav-link[data-page="about"]');
    if (aboutLink) {
      aboutLink.click();
    }
    
    this.createVictoryUI();
  }
  
  createVictoryUI() {
    this.victoryUI = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.victoryUI.setDepth(200);
    
    // Iconos de enemigos y mejoras
    const enemyIcons = {
      SCOUT: '🔵',
      DRIFTER: '🟢',
      TANK: '🟠',
      SHOOTER: '🔴',
      SWARM: '🟣'
    };
    
    const upgradeIcons = {
      'Daño de Balas': '⚔️',
      'Cadencia de Disparo': '🔫',
      'Disparo Doble': '⚡',
      'Vida Máxima': '❤️',
      'Cooldown de Misil': '⏱️',
      'Misiles Extra': '🚀'
    };
    
    // Fondo con efecto
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.95);
    bg.fillRect(-this.scale.width / 2, -this.scale.height / 2, this.scale.width, this.scale.height);
    
    // Bordes decorativos
    bg.lineStyle(3, 0x00ff00, 0.8);
    bg.strokeRect(-this.scale.width / 2 + 20, -this.scale.height / 2 + 20, this.scale.width - 40, this.scale.height - 40);
    bg.lineStyle(1, 0x00ff00, 0.3);
    bg.strokeRect(-this.scale.width / 2 + 30, -this.scale.height / 2 + 30, this.scale.width - 60, this.scale.height - 60);
    
    // Partículas de fondo (estrellas)
    for (let i = 0; i < 30; i++) {
      const star = this.add.graphics();
      const x = (Math.random() - 0.5) * this.scale.width * 0.9;
      const y = (Math.random() - 0.5) * this.scale.height * 0.9;
      star.fillStyle(0x00ff00, Math.random() * 0.5 + 0.2);
      star.fillCircle(x, y, Math.random() * 2 + 1);
      this.victoryUI.add(star);
      
      // Animación de parpadeo
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Título de victoria con efecto de brillo
    const victoryText = this.add.text(0, -260, '🏆 ¡VICTORIA! 🏆', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '52px',
      color: '#00ff00',
      stroke: '#003300',
      strokeThickness: 6
    });
    victoryText.setOrigin(0.5);
    
    // Efecto de pulso en el título
    this.tweens.add({
      targets: victoryText,
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Calcular tiempo de partida
    const gameTime = this.gameEndTime - this.gameStartTime;
    const minutes = Math.floor(gameTime / 60000);
    const seconds = Math.floor((gameTime % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Panel de estadísticas principales
    const statsPanel = this.add.graphics();
    const panelWidth = 500;
    const panelHeight = 80;
    const panelX = -panelWidth / 2;
    const panelY = -180;
    
    statsPanel.fillStyle(0x003300, 0.6);
    statsPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    statsPanel.lineStyle(2, 0x00ff00, 0.7);
    statsPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    
    const mainStats = this.add.text(0, panelY + panelHeight / 2,
      `⏱️ Tiempo: ${timeString}    ⭐ Puntos: ${this.score.toLocaleString()}    💎 Cristales: ${this.crystals}`,
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 20 }
      }
    );
    mainStats.setOrigin(0.5);
    
    // === SECCIÓN DE ENEMIGOS ===
    const enemiesY = -70;
    const enemiesTitle = this.add.text(0, enemiesY, '👾 ENEMIGOS ELIMINADOS', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: '#00ffff',
      stroke: '#003333',
      strokeThickness: 2
    });
    enemiesTitle.setOrigin(0.5);
    
    // Crear grid de enemigos con iconos
    const enemyContainer = this.add.container(0, enemiesY + 40);
    const enemyTypes = ['SCOUT', 'DRIFTER', 'TANK', 'SHOOTER', 'SWARM'];
    const enemySpacing = 100;
    const startX = -(enemyTypes.length - 1) * enemySpacing / 2;
    
    enemyTypes.forEach((type, index) => {
      const x = startX + index * enemySpacing;
      const count = this.enemiesKilledByType[type] || 0;
      
      // Icono del enemigo
      const icon = this.add.text(x, 0, enemyIcons[type], { fontSize: '28px' });
      icon.setOrigin(0.5);
      
      // Contador
      const countText = this.add.text(x, 25, `${count}`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '16px',
        color: count > 0 ? '#ffffff' : '#666666',
        fontStyle: count > 0 ? 'bold' : 'normal'
      });
      countText.setOrigin(0.5);
      
      enemyContainer.add([icon, countText]);
    });
    
    // === SECCIÓN DE MEJORAS ===
    const upgradesY = 50;
    const upgradesTitle = this.add.text(0, upgradesY, '⚡ MEJORAS ADQUIRIDAS', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: '#ff00ff',
      stroke: '#330033',
      strokeThickness: 2
    });
    upgradesTitle.setOrigin(0.5);
    
    // Crear grid de mejoras con iconos
    const upgradeContainer = this.add.container(0, upgradesY + 40);
    
    if (this.upgradesPurchased.length > 0) {
      const upgradeGroups = {};
      this.upgradesPurchased.forEach(upgrade => {
        if (!upgradeGroups[upgrade.name]) {
          upgradeGroups[upgrade.name] = upgrade.level;
        } else {
          upgradeGroups[upgrade.name] = Math.max(upgradeGroups[upgrade.name], upgrade.level);
        }
      });
      
      const upgradeNames = Object.keys(upgradeGroups);
      const upgradeSpacing = 90;
      const startUpgradeX = -(upgradeNames.length - 1) * upgradeSpacing / 2;
      
      upgradeNames.forEach((name, index) => {
        const x = startUpgradeX + index * upgradeSpacing;
        const level = upgradeGroups[name];
        const icon = upgradeIcons[name] || '✨';
        
        // Icono de la mejora
        const iconText = this.add.text(x, 0, icon, { fontSize: '24px' });
        iconText.setOrigin(0.5);
        
        // Nivel con barras
        let levelBars = '';
        for (let i = 0; i < level; i++) levelBars += '▮';
        
        const levelText = this.add.text(x, 22, levelBars, {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '12px',
          color: '#ff00ff'
        });
        levelText.setOrigin(0.5);
        
        upgradeContainer.add([iconText, levelText]);
      });
    } else {
      const noUpgrades = this.add.text(0, 0, '— Ninguna —', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '14px',
        color: '#666666'
      });
      noUpgrades.setOrigin(0.5);
      upgradeContainer.add(noUpgrades);
    }
    
    // === TIMELINE DE PROGRESO ===
    const timelineY = 150;
    const timelineTitle = this.add.text(0, timelineY, '📊 PROGRESO COMPLETO', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#333300',
      strokeThickness: 2
    });
    timelineTitle.setOrigin(0.5);
    
    // Crear timeline visual
    const timelineContainer = this.add.container(0, timelineY + 35);
    const timelineWidth = 500;
    const sectionWidth = timelineWidth / this.sections.length;
    
    this.sections.forEach((section, index) => {
      const x = -timelineWidth / 2 + sectionWidth * index + sectionWidth / 2;
      
      // Barra de progreso
      const bar = this.add.graphics();
      bar.fillStyle(0x00ff00, 1);
      bar.fillRoundedRect(x - sectionWidth / 2 + 5, -8, sectionWidth - 10, 16, 4);
      
      // Checkmark
      const check = this.add.text(x, 0, '✓', {
        fontSize: '14px',
        color: '#003300'
      });
      check.setOrigin(0.5);
      
      // Nombre de sección
      const sectionName = this.add.text(x, 20, section.name, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        color: '#00ff00',
        align: 'center'
      });
      sectionName.setOrigin(0.5);
      
      timelineContainer.add([bar, check, sectionName]);
    });
    
    // Mensaje final
    const message = this.add.text(0, timelineY + 80, '¡Gracias por explorar mi portfolio!', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '16px',
      color: '#00ffff'
    });
    message.setOrigin(0.5);
    
    // Botón para volver al portfolio
    const backBtn = this.add.graphics();
    backBtn.fillStyle(0x003300, 1);
    backBtn.fillRoundedRect(-120, timelineY + 115, 240, 50, 10);
    backBtn.lineStyle(2, 0x00ff00, 1);
    backBtn.strokeRoundedRect(-120, timelineY + 115, 240, 50, 10);
    
    const backText = this.add.text(0, timelineY + 140, '👋 VOLVER A SOBRE MÍ', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '18px',
      color: '#00ff00'
    });
    backText.setOrigin(0.5);
    
    // Hacer el área del botón interactiva
    const hitArea = this.add.rectangle(0, timelineY + 140, 240, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      backBtn.clear();
      backBtn.fillStyle(0x005500, 1);
      backBtn.fillRoundedRect(-120, timelineY + 115, 240, 50, 10);
      backBtn.lineStyle(3, 0x00ff00, 1);
      backBtn.strokeRoundedRect(-120, timelineY + 115, 240, 50, 10);
      backText.setScale(1.05);
    });
    
    hitArea.on('pointerout', () => {
      backBtn.clear();
      backBtn.fillStyle(0x003300, 1);
      backBtn.fillRoundedRect(-120, timelineY + 115, 240, 50, 10);
      backBtn.lineStyle(2, 0x00ff00, 1);
      backBtn.strokeRoundedRect(-120, timelineY + 115, 240, 50, 10);
      backText.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      // Mostrar pantalla de carga antes de recargar
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('visible');
      }
      
      // Recargar la página después de un pequeño delay para mostrar la pantalla de carga
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
    
    this.victoryUI.add([bg, statsPanel, victoryText, mainStats, enemiesTitle, enemyContainer, upgradesTitle, upgradeContainer, timelineTitle, timelineContainer, message, backBtn, backText, hitArea]);
    
    // Animación de entrada
    this.victoryUI.alpha = 0;
    this.victoryUI.scale = 0.8;
    this.tweens.add({
      targets: this.victoryUI,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });
  }
  
  gameOver() {
    this.gameState = GAME_CONFIG.STATES.GAME_OVER;
    
    // Rastrear tiempo de partida y lugar de muerte
    this.gameEndTime = this.time.now;
    const currentSection = this.sections[this.currentSection];
    if (currentSection) {
      this.deathSection = {
        id: currentSection.id,
        name: currentSection.name,
        screenIndex: this.currentScreenInSection,
        totalScreens: currentSection.screens.length
      };
    }
    
    // Ocultar footer de mejoras
    this.hideUpgradeFooter();
    
    // Ocultar HUD de oleada
    if (this.waveHUD) {
      this.waveHUD.setVisible(false);
    }
    
    // Ocultar barra de vida del jefe
    if (this.bossHealthContainer) {
      this.bossHealthContainer.setVisible(false);
    }
    
    // Navegar a "Sobre mí"
    const aboutLink = document.querySelector('.nav-link[data-page="about"]');
    if (aboutLink) {
      aboutLink.click();
    }
    
    // Crear UI de game over
    this.createGameOverUI();
  }
  
  createGameOverUI() {
    this.gameOverUI = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.gameOverUI.setDepth(200);
    
    // Iconos de enemigos y mejoras
    const enemyIcons = {
      SCOUT: '🔵',
      DRIFTER: '🟢',
      TANK: '🟠',
      SHOOTER: '🔴',
      SWARM: '🟣'
    };
    
    const upgradeIcons = {
      'Daño de Balas': '⚔️',
      'Cadencia de Disparo': '🔫',
      'Disparo Doble': '⚡',
      'Vida Máxima': '❤️',
      'Cooldown de Misil': '⏱️',
      'Misiles Extra': '🚀'
    };
    
    // Fondo con efecto
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.95);
    bg.fillRect(-this.scale.width / 2, -this.scale.height / 2, this.scale.width, this.scale.height);
    
    // Bordes decorativos rojos
    bg.lineStyle(3, 0xff0066, 0.8);
    bg.strokeRect(-this.scale.width / 2 + 20, -this.scale.height / 2 + 20, this.scale.width - 40, this.scale.height - 40);
    bg.lineStyle(1, 0xff0066, 0.3);
    bg.strokeRect(-this.scale.width / 2 + 30, -this.scale.height / 2 + 30, this.scale.width - 60, this.scale.height - 60);
    
    // Partículas de fondo (fragmentos rojos)
    for (let i = 0; i < 20; i++) {
      const fragment = this.add.graphics();
      const x = (Math.random() - 0.5) * this.scale.width * 0.9;
      const y = (Math.random() - 0.5) * this.scale.height * 0.9;
      fragment.fillStyle(0xff0066, Math.random() * 0.3 + 0.1);
      fragment.fillCircle(x, y, Math.random() * 3 + 1);
      this.gameOverUI.add(fragment);
      
      // Animación de caída
      this.tweens.add({
        targets: fragment,
        y: fragment.y + 50,
        alpha: 0,
        duration: 2000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000
      });
    }
    
    // Título de game over con efecto de shake
    const gameOverText = this.add.text(0, -260, '💀 GAME OVER 💀', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '52px',
      color: '#ff0066',
      stroke: '#330022',
      strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);
    
    // Efecto de shake suave
    this.tweens.add({
      targets: gameOverText,
      x: { from: -3, to: 3 },
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        gameOverText.x = 0;
      }
    });
    
    // Calcular tiempo de partida
    const gameTime = this.gameEndTime - this.gameStartTime;
    const minutes = Math.floor(gameTime / 60000);
    const seconds = Math.floor((gameTime % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Panel de estadísticas principales
    const statsPanel = this.add.graphics();
    const panelWidth = 500;
    const panelHeight = 80;
    const panelX = -panelWidth / 2;
    const panelY = -180;
    
    statsPanel.fillStyle(0x330011, 0.6);
    statsPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    statsPanel.lineStyle(2, 0xff0066, 0.7);
    statsPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    
    const mainStats = this.add.text(0, panelY + panelHeight / 2,
      `⏱️ Tiempo: ${timeString}    ⭐ Puntos: ${this.score.toLocaleString()}    💎 Cristales: ${this.crystals}`,
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 20 }
      }
    );
    mainStats.setOrigin(0.5);
    
    // === SECCIÓN DE ENEMIGOS ===
    const enemiesY = -70;
    const enemiesTitle = this.add.text(0, enemiesY, '👾 ENEMIGOS ELIMINADOS', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: '#00ffff',
      stroke: '#003333',
      strokeThickness: 2
    });
    enemiesTitle.setOrigin(0.5);
    
    // Crear grid de enemigos con iconos
    const enemyContainer = this.add.container(0, enemiesY + 40);
    const enemyTypes = ['SCOUT', 'DRIFTER', 'TANK', 'SHOOTER', 'SWARM'];
    const enemySpacing = 100;
    const startX = -(enemyTypes.length - 1) * enemySpacing / 2;
    
    enemyTypes.forEach((type, index) => {
      const x = startX + index * enemySpacing;
      const count = this.enemiesKilledByType[type] || 0;
      
      // Icono del enemigo
      const icon = this.add.text(x, 0, enemyIcons[type], { fontSize: '28px' });
      icon.setOrigin(0.5);
      
      // Contador
      const countText = this.add.text(x, 25, `${count}`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '16px',
        color: count > 0 ? '#ffffff' : '#666666',
        fontStyle: count > 0 ? 'bold' : 'normal'
      });
      countText.setOrigin(0.5);
      
      enemyContainer.add([icon, countText]);
    });
    
    // === SECCIÓN DE MEJORAS ===
    const upgradesY = 50;
    const upgradesTitle = this.add.text(0, upgradesY, '⚡ MEJORAS ADQUIRIDAS', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: '#ff00ff',
      stroke: '#330033',
      strokeThickness: 2
    });
    upgradesTitle.setOrigin(0.5);
    
    // Crear grid de mejoras con iconos
    const upgradeContainer = this.add.container(0, upgradesY + 40);
    
    if (this.upgradesPurchased.length > 0) {
      const upgradeGroups = {};
      this.upgradesPurchased.forEach(upgrade => {
        if (!upgradeGroups[upgrade.name]) {
          upgradeGroups[upgrade.name] = upgrade.level;
        } else {
          upgradeGroups[upgrade.name] = Math.max(upgradeGroups[upgrade.name], upgrade.level);
        }
      });
      
      const upgradeNames = Object.keys(upgradeGroups);
      const upgradeSpacing = 90;
      const startUpgradeX = -(upgradeNames.length - 1) * upgradeSpacing / 2;
      
      upgradeNames.forEach((name, index) => {
        const x = startUpgradeX + index * upgradeSpacing;
        const level = upgradeGroups[name];
        const icon = upgradeIcons[name] || '✨';
        
        // Icono de la mejora
        const iconText = this.add.text(x, 0, icon, { fontSize: '24px' });
        iconText.setOrigin(0.5);
        
        // Nivel con barras
        let levelBars = '';
        for (let i = 0; i < level; i++) levelBars += '▮';
        
        const levelText = this.add.text(x, 22, levelBars, {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '12px',
          color: '#ff00ff'
        });
        levelText.setOrigin(0.5);
        
        upgradeContainer.add([iconText, levelText]);
      });
    } else {
      const noUpgrades = this.add.text(0, 0, '— Ninguna —', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '14px',
        color: '#666666'
      });
      noUpgrades.setOrigin(0.5);
      upgradeContainer.add(noUpgrades);
    }
    
    // === TIMELINE DE PROGRESO CON PUNTO DE MUERTE ===
    const timelineY = 150;
    const timelineTitle = this.add.text(0, timelineY, '📊 PROGRESO', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#333300',
      strokeThickness: 2
    });
    timelineTitle.setOrigin(0.5);
    
    // Crear timeline visual
    const timelineContainer = this.add.container(0, timelineY + 35);
    const timelineWidth = 500;
    const sectionWidth = timelineWidth / this.sections.length;
    
    this.sections.forEach((section, index) => {
      const x = -timelineWidth / 2 + sectionWidth * index + sectionWidth / 2;
      const isCompleted = this.sectionsCompleted.find(s => s.sectionId === section.id);
      const isDeathSection = this.deathSection && this.deathSection.id === section.id;
      
      // Barra de progreso
      const bar = this.add.graphics();
      if (isCompleted) {
        bar.fillStyle(0x00ff00, 1);
      } else if (isDeathSection) {
        bar.fillStyle(0xff0066, 1);
      } else {
        bar.fillStyle(0x333333, 1);
      }
      bar.fillRoundedRect(x - sectionWidth / 2 + 5, -8, sectionWidth - 10, 16, 4);
      
      // Indicador de estado
      if (isCompleted) {
        const check = this.add.text(x, 0, '✓', {
          fontSize: '14px',
          color: '#003300'
        });
        check.setOrigin(0.5);
        timelineContainer.add(check);
      } else if (isDeathSection) {
        const skull = this.add.text(x, -25, '💀', { fontSize: '18px' });
        skull.setOrigin(0.5);
        timelineContainer.add(skull);
        
        // Efecto de pulso en el punto de muerte
        this.tweens.add({
          targets: bar,
          alpha: { from: 0.6, to: 1 },
          duration: 400,
          yoyo: true,
          repeat: -1
        });
      }
      
      // Nombre de sección
      const sectionName = this.add.text(x, 20, section.name, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        color: isCompleted ? '#00ff00' : isDeathSection ? '#ff0066' : '#666666',
        align: 'center'
      });
      sectionName.setOrigin(0.5);
      
      timelineContainer.add([bar, sectionName]);
    });
    
    // Información de dónde murió
    let deathInfo = '';
    if (this.deathSection) {
      const section = this.sections.find(s => s.id === this.deathSection.id);
      if (section) {
        const screenNum = this.deathSection.screenIndex + 1;
        const totalScreens = section.screens.length;
        deathInfo = `💀 Caíste en: ${this.deathSection.name} — Oleada ${screenNum}/${totalScreens}`;
      }
    }
    
    const deathInfoText = this.add.text(0, timelineY + 75, deathInfo, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      color: '#ff6699',
      align: 'center'
    });
    deathInfoText.setOrigin(0.5);
    
    // Botón para volver al portfolio
    const backBtn = this.add.graphics();
    backBtn.fillStyle(0x330022, 1);
    backBtn.fillRoundedRect(-120, timelineY + 105, 240, 50, 10);
    backBtn.lineStyle(2, 0xff0066, 1);
    backBtn.strokeRoundedRect(-120, timelineY + 105, 240, 50, 10);
    
    const backText = this.add.text(0, timelineY + 130, '👋 VOLVER A SOBRE MÍ', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '18px',
      color: '#ff0066'
    });
    backText.setOrigin(0.5);
    
    // Hacer el área del botón interactiva
    const hitArea = this.add.rectangle(0, timelineY + 130, 240, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      backBtn.clear();
      backBtn.fillStyle(0x550033, 1);
      backBtn.fillRoundedRect(-120, timelineY + 105, 240, 50, 10);
      backBtn.lineStyle(3, 0xff0066, 1);
      backBtn.strokeRoundedRect(-120, timelineY + 105, 240, 50, 10);
      backText.setScale(1.05);
    });
    
    hitArea.on('pointerout', () => {
      backBtn.clear();
      backBtn.fillStyle(0x330022, 1);
      backBtn.fillRoundedRect(-120, timelineY + 105, 240, 50, 10);
      backBtn.lineStyle(2, 0xff0066, 1);
      backBtn.strokeRoundedRect(-120, timelineY + 105, 240, 50, 10);
      backText.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      // Mostrar pantalla de carga antes de recargar
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('visible');
      }
      
      // Recargar la página después de un pequeño delay para mostrar la pantalla de carga
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
    
    this.gameOverUI.add([bg, statsPanel, gameOverText, mainStats, enemiesTitle, enemyContainer, upgradesTitle, upgradeContainer, timelineTitle, timelineContainer, deathInfoText, backBtn, backText, hitArea]);
    
    // Animación de entrada
    this.gameOverUI.alpha = 0;
    this.gameOverUI.scale = 0.8;
    this.tweens.add({
      targets: this.gameOverUI,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });
  }
  
  restartGame() {
    // Destruir UI de game over
    if (this.gameOverUI) {
      this.gameOverUI.destroy();
    }
    
    // Destruir UI de victoria si existe
    if (this.victoryUI) {
      this.victoryUI.destroy();
    }
    
    // Ocultar footer de mejoras
    this.hideUpgradeFooter();
    
    // Destruir jefe si existe
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
    this.isBossFight = false;
    
    // Ocultar barra de vida del jefe
    if (this.bossHealthContainer) {
      this.bossHealthContainer.setVisible(false);
    }
    
    // Limpiar grupos
    this.enemies.clear(true, true);
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.missiles.clear(true, true);
    this.spawners.clear(true, true);
    this.crystalsGroup.clear(true, true);
    this.healthDrops.clear(true, true);
    
    // Reset jugador
    this.player.reset();
    this.player.setPosition(this.scale.width / 2, this.scale.height - 200);
    
    // Reset stats
    this.score = 0;
    this.crystals = 0;
    this.enemiesKilled = 0;
    this.currentSection = 0;
    this.currentScreenInSection = 0;
    
    // Reset estadísticas detalladas
    this.gameStartTime = 0;
    this.gameEndTime = 0;
    this.enemiesKilledByType = {
      SCOUT: 0,
      DRIFTER: 0,
      TANK: 0,
      SHOOTER: 0,
      SWARM: 0
    };
    this.upgradesPurchased = [];
    this.sectionsCompleted = [];
    this.bulletsFired = 0;
    this.bulletsHit = 0;
    this.missilesFired = 0;
    this.missilesHit = 0;
    this.deathSection = null;
    this.deathScreen = null;
    
    // Reset mejoras
    this.upgradeLevels = {
      BULLET_DAMAGE: 0,
      FIRE_RATE: 0,
      DOUBLE_SHOT: 0,
      MAX_HP: 0,
      MISSILE_COOLDOWN: 0,
      MISSILE_COUNT: 0
    };
    
    // Volver a estado IDLE
    this.gameState = GAME_CONFIG.STATES.IDLE;
    
    // Desactivar captura de eventos del juego
    this.setGameActive(false);
    
    // Mostrar botón de inicio
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.classList.remove('hidden');
    }
    
    // Mostrar UI idle
    this.idleContainer.setVisible(true);
    this.idleContainer.alpha = 1;
    
    // Ocultar HUD
    this.hudContainer.setVisible(false);
    
    // Ocultar HUD de oleada
    if (this.waveHUD) {
      this.waveHUD.setVisible(false);
    }
    
    // Navegar a la primera sección (About Me)
    const aboutLink = document.querySelector('.nav-link[data-page="about"]');
    if (aboutLink) {
      aboutLink.click();
    }
    
    // Inicializar el juego automáticamente (activar y desactivar para que funcione correctamente)
    // Esto asegura que el juego esté listo para la próxima vez que se inicie
    if (window.initializeGame) {
      setTimeout(() => {
        window.initializeGame();
      }, 300);
    }
  }
  
  fireMissile() {
    // Disparar todos los misiles disponibles con 0.2s de separación
    const missilesToFire = this.player.missileCount;
    
    if (missilesToFire <= 0) {
      return; // No hay misiles disponibles
    }
    
    // Disparar todos los misiles con delay de 0.2s entre cada uno
    for (let i = 0; i < missilesToFire; i++) {
      this.time.delayedCall(i * 200, () => {
        // Verificar que todavía hay misiles disponibles
        if (this.player.missileCount > 0) {
          const missileData = this.player.fireMissile();
          if (missileData) {
            const missile = new Missile(
              this,
              missileData.x,
              missileData.y,
              missileData.angle,
              missileData.targetX,
              missileData.targetY
            );
            this.missiles.add(missile);
            this.missilesFired++;
            
            // Si es el último misil disparado, actualizar el tiempo para el cooldown
            // Esto permite que el cooldown empiece a contar desde el último disparo
            if (this.player.missileCount === 0) {
              this.player.lastMissileTime = this.time.now;
            }
          }
        }
      });
    }
  }
  
  handleResize(gameSize) {
    // Verificar que las dimensiones sean válidas
    if (!gameSize || !gameSize.width || !gameSize.height || 
        gameSize.width <= 0 || gameSize.height <= 0 ||
        isNaN(gameSize.width) || isNaN(gameSize.height)) {
      console.warn('⚠️ Dimensiones inválidas en resize:', gameSize);
      return;
    }
    
    // Actualizar posiciones de UI
    if (this.idleContainer) {
      this.idleContainer.setPosition(gameSize.width / 2, gameSize.height / 2);
    }
    
    // Recrear estrellas solo si las dimensiones son válidas
    if (this.stars && this.stars.length > 0) {
      this.stars.forEach(star => {
        if (star && star.graphic && star.graphic.active) {
          star.graphic.destroy();
        }
      });
      this.createStarfield();
    }
  }
  
  update(time, delta) {
    // Actualizar estrellas siempre
    this.updateStarfield();
    
    if (this.gameState !== GAME_CONFIG.STATES.PLAYING) {
      return;
    }
    
    // Actualizar jugador
    this.player.update(time, delta);
    
    // Disparo automático
    const bulletData = this.player.fire();
    if (bulletData) {
      // Puede ser un objeto o un array (disparo doble)
      if (Array.isArray(bulletData)) {
        bulletData.forEach(data => {
          const bullet = new Bullet(this, data.x, data.y, data.angle, false, data.damage);
          this.playerBullets.add(bullet);
          this.bulletsFired++;
        });
      } else {
        const bullet = new Bullet(this, bulletData.x, bulletData.y, bulletData.angle, false, bulletData.damage);
        this.playerBullets.add(bullet);
        this.bulletsFired++;
      }
    }
    
    // Actualizar enemigos
    this.enemies.getChildren().forEach(enemy => {
      enemy.update(time, delta, this.player.x, this.player.y);
    });
    
    // Actualizar spawners
    this.spawners.getChildren().forEach(spawner => {
      if (spawner.active && !spawner.isDestroyed) {
        spawner.update(time, delta);
      }
    });
    
    // Actualizar jefe (si está activo)
    if (this.boss && !this.boss.isDestroyed) {
      this.boss.update(time, delta);
      
      // Actualizar barra de vida del jefe periódicamente
      if (time % 100 < 20) {
        this.updateBossHealthBar();
      }
    }
    
    // Verificar periódicamente si todos los spawners están destruidos (solo si no es pelea de jefe)
    if (!this.isBossFight && this.spawners.getChildren().length > 0) {
      const activeSpawners = this.spawners.getChildren().filter(s => s.active && !s.isDestroyed);
      if (activeSpawners.length === 0 && !this.screenCompleted) {
        console.log('✅ Verificación periódica: Todos los spawners destruidos');
        this.screenCompleted = true;
        this.sectionComplete();
      }
    }
    
    // Actualizar balas del jugador
    this.playerBullets.getChildren().forEach(bullet => {
      bullet.update(time, delta);
    });
    
    // Actualizar balas enemigas
    this.enemyBullets.getChildren().forEach(bullet => {
      bullet.update(time, delta);
    });
    
    // Actualizar missiles
    this.missiles.getChildren().forEach(missile => {
      missile.update(time, delta);
    });
    
    // Verificar todas las colisiones manualmente
    this.checkAllCollisions();
    
    // Actualizar collectibles
    this.crystalsGroup.getChildren().forEach(crystal => {
      crystal.update(time, delta, this.player.x, this.player.y);
      
      // Si está activo el auto-magnetismo y el collectible no está magnetizado, magnetizarlo
      if (this.collectiblesAutoMagnetize && !crystal.magnetized && !crystal.isCollected) {
        crystal.magnetize();
      }
    });
    
    this.healthDrops.getChildren().forEach(health => {
      health.update(time, delta, this.player.x, this.player.y);
      
      // Si está activo el auto-magnetismo y el collectible no está magnetizado, magnetizarlo
      if (this.collectiblesAutoMagnetize && !health.magnetized && !health.isCollected) {
        health.magnetize();
      }
    });
  }
}

export default MainScene;

