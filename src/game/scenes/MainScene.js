import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Spawner } from '../entities/Spawner.js';
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
      }
    ];
    
    this.currentSection = 0;
    this.currentScreenInSection = 0;
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
  }
  
  bulletHitSpawner(bullet, spawner) {
    const damage = bullet.damage;
    bullet.destroy();
    spawner.takeDamage(damage);
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
  }
  
  missileHitEnemy(missile, enemy) {
    if (!missile || !missile.active || missile.hasExploded || !missile.scene) return;
    if (!enemy || !enemy.active || enemy.hp <= 0) return;
    
    missile.explode();
    enemy.takeDamage(GAME_CONFIG.PLAYER.MISSILE_DAMAGE);
  }
  
  missileHitSpawner(missile, spawner) {
    if (!missile || !missile.active || missile.hasExploded || !missile.scene) return;
    if (!spawner || spawner.isDestroyed) return;
    
    missile.explode();
    spawner.takeDamage(GAME_CONFIG.PLAYER.MISSILE_DAMAGE);
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
    
    // Ocultar HUD en IDLE
    this.hudContainer.setVisible(false);
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
    this.gameState = GAME_CONFIG.STATES.PLAYING;
    this.currentSection = 0;
    this.currentScreenInSection = 0;
    this.screenCompleted = false;
    
    // Ocultar botón de inicio alternativo
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.classList.add('hidden');
    }
    
    // Activar captura de eventos del juego
    this.setGameActive(true);
    
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
    
    // Fondo oscuro
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(-this.scale.width / 2, -this.scale.height / 2, this.scale.width, this.scale.height);
    
    // Texto
    const pauseText = this.add.text(0, 0, 'PAUSA\n\nPresiona ESC para continuar', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '28px',
      color: '#00ffff',
      align: 'center'
    });
    pauseText.setOrigin(0.5);
    
    this.pauseUI.add([bg, pauseText]);
    this.pauseUI.setVisible(false);
  }
  
  sectionComplete() {
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
    
    this.createVictoryUI();
  }
  
  createVictoryUI() {
    this.victoryUI = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.victoryUI.setDepth(200);
    
    // Fondo
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-this.scale.width / 2, -this.scale.height / 2, this.scale.width, this.scale.height);
    
    // Texto de victoria
    const victoryText = this.add.text(0, -100, '¡VICTORIA!', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#003300',
      strokeThickness: 4
    });
    victoryText.setOrigin(0.5);
    
    // Calcular total de pantallas
    const totalScreens = this.sections.reduce((total, section) => total + section.screens.length, 0);
    
    // Stats
    const stats = this.add.text(0, 0,
      `Score Final: ${this.score}\n` +
      `Cristales: ${this.crystals}\n` +
      `Enemigos: ${this.enemiesKilled}\n` +
      `Pantallas: ${totalScreens}/${totalScreens}`,
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    );
    stats.setOrigin(0.5);
    
    // Mensaje
    const message = this.add.text(0, 100, '¡Gracias por explorar mi portfolio!', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '16px',
      color: '#00ffff'
    });
    message.setOrigin(0.5);
    
    // Botón de reiniciar
    const restartText = this.add.text(0, 160, '[ VOLVER A JUGAR ]', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '20px',
      color: '#00ff00',
      stroke: '#003300',
      strokeThickness: 2
    });
    restartText.setOrigin(0.5);
    restartText.setInteractive({ useHandCursor: true });
    
    restartText.on('pointerover', () => {
      restartText.setScale(1.1);
    });
    
    restartText.on('pointerout', () => {
      restartText.setScale(1);
    });
    
    restartText.on('pointerdown', () => {
      this.restartGame();
    });
    
    this.victoryUI.add([bg, victoryText, stats, message, restartText]);
    
    // Animación
    this.victoryUI.alpha = 0;
    this.tweens.add({
      targets: this.victoryUI,
      alpha: 1,
      duration: 500
    });
  }
  
  gameOver() {
    this.gameState = GAME_CONFIG.STATES.GAME_OVER;
    
    // Ocultar footer de mejoras
    this.hideUpgradeFooter();
    
    // Ocultar HUD de oleada
    if (this.waveHUD) {
      this.waveHUD.setVisible(false);
    }
    
    // Crear UI de game over
    this.createGameOverUI();
  }
  
  createGameOverUI() {
    this.gameOverUI = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.gameOverUI.setDepth(200);
    
    // Fondo
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-this.scale.width / 2, -this.scale.height / 2, this.scale.width, this.scale.height);
    
    // Texto
    const style = {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '48px',
      color: '#ff0066',
      stroke: '#330022',
      strokeThickness: 4
    };
    
    const gameOverText = this.add.text(0, -80, 'GAME OVER', style);
    gameOverText.setOrigin(0.5);
    
    // Stats
    const statsStyle = {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    };
    
    // Calcular total de pantallas
    const totalScreens = this.sections.reduce((total, section) => total + section.screens.length, 0);
    const currentScreenNumber = this.sections.slice(0, this.currentSection).reduce((total, section) => total + section.screens.length, 0) + this.currentScreenInSection + 1;
    
    const stats = this.add.text(0, 20,
      `Score: ${this.score}\n` +
      `Cristales: ${this.crystals}\n` +
      `Enemigos: ${this.enemiesKilled}\n` +
      `Pantalla: ${currentScreenNumber}/${totalScreens}`,
      statsStyle
    );
    stats.setOrigin(0.5);
    
    // Botón de reiniciar
    const restartText = this.add.text(0, 120, '[ Click para reiniciar ]', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '20px',
      color: '#00ffff'
    });
    restartText.setOrigin(0.5);
    restartText.setInteractive({ useHandCursor: true });
    
    restartText.on('pointerover', () => {
      restartText.setColor('#ffffff');
    });
    
    restartText.on('pointerout', () => {
      restartText.setColor('#00ffff');
    });
    
    restartText.on('pointerdown', () => {
      this.restartGame();
    });
    
    this.gameOverUI.add([bg, gameOverText, stats, restartText]);
    
    // Animación de entrada
    this.gameOverUI.alpha = 0;
    this.tweens.add({
      targets: this.gameOverUI,
      alpha: 1,
      duration: 500
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
        });
      } else {
        const bullet = new Bullet(this, bulletData.x, bulletData.y, bulletData.angle, false, bulletData.damage);
        this.playerBullets.add(bullet);
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
    
    // Verificar periódicamente si todos los spawners están destruidos
    if (this.spawners.getChildren().length > 0) {
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

