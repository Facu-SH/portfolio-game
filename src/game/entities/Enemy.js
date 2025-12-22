import Phaser from 'phaser';
import { ENEMY_TYPES } from '../config/enemies.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type = 'SCOUT') {
    super(scene, x, y);
    
    this.scene = scene;
    this.type = type;
    this.config = ENEMY_TYPES[type];
    
    // Stats
    this.hp = this.config.hp;
    this.maxHp = this.config.hp;
    this.speed = this.config.speed;
    this.points = this.config.points;
    this.crystalDropChance = this.config.crystalDropChance;
    this.crystalDrop = this.config.crystalDrop || 1; // Cantidad de cristales que dropea
    this.behavior = this.config.behavior;
    
    // Para shooters
    if (this.behavior === 'shoot') {
      this.fireRate = this.config.fireRate;
      this.lastFireTime = 0;
      this.bulletSpeed = this.config.bulletSpeed;
      this.bulletDamage = this.config.bulletDamage;
    }
    
    // Para zigzag
    this.zigzagTimer = 0;
    this.zigzagDirection = 1;
    
    // Para swarm
    this.swarmOffset = Math.random() * Math.PI * 2;
    
    // Crear gráficos
    this.createGraphics();
    
    scene.add.existing(this);
    
    // Física
    scene.physics.add.existing(this);
    const bodySize = this.config.size * 0.4;
    this.body.setCircle(bodySize, -bodySize, -bodySize);
    
    // Animación de entrada
    this.alpha = 0;
    this.scale = 0.5;
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }
  
  createGraphics() {
    const size = this.config.size;
    const color = this.config.color;
    
    this.graphics = this.scene.add.graphics();
    
    // Dibujar según tipo
    switch (this.type) {
      case 'SCOUT':
        this.drawScout(size, color);
        break;
      case 'DRIFTER':
        this.drawDrifter(size, color);
        break;
      case 'TANK':
        this.drawTank(size, color);
        break;
      case 'SHOOTER':
        this.drawShooter(size, color);
        break;
      case 'SWARM':
        this.drawSwarm(size, color);
        break;
      default:
        this.drawScout(size, color);
    }
    
    this.add(this.graphics);
    
    // Barra de vida
    this.createHealthBar();
  }
  
  drawScout(size, color) {
    // Triangulo simple
    this.graphics.fillStyle(color, 0.8);
    this.graphics.lineStyle(2, color, 1);
    
    const s = size / 2;
    this.graphics.fillTriangle(0, -s, -s * 0.8, s, s * 0.8, s);
    this.graphics.strokeTriangle(0, -s, -s * 0.8, s, s * 0.8, s);
    
    // Core brillante
    this.graphics.fillStyle(0xffffff, 0.5);
    this.graphics.fillCircle(0, 0, s * 0.3);
  }
  
  drawDrifter(size, color) {
    // Forma de diamante
    this.graphics.fillStyle(color, 0.8);
    this.graphics.lineStyle(2, color, 1);
    
    const s = size / 2;
    this.graphics.fillPoints([
      { x: 0, y: -s },
      { x: s, y: 0 },
      { x: 0, y: s },
      { x: -s, y: 0 }
    ], true);
    
    this.graphics.strokePoints([
      { x: 0, y: -s },
      { x: s, y: 0 },
      { x: 0, y: s },
      { x: -s, y: 0 }
    ], true);
    
    // Centro
    this.graphics.fillStyle(0xffffff, 0.5);
    this.graphics.fillCircle(0, 0, s * 0.25);
  }
  
  drawTank(size, color) {
    // Hexágono grande
    this.graphics.fillStyle(color, 0.8);
    this.graphics.lineStyle(3, color, 1);
    
    const s = size / 2;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      points.push({
        x: Math.cos(angle) * s,
        y: Math.sin(angle) * s
      });
    }
    
    this.graphics.fillPoints(points, true);
    this.graphics.strokePoints(points, true);
    
    // Armadura interior
    this.graphics.lineStyle(2, 0xffffff, 0.3);
    const innerPoints = points.map(p => ({ x: p.x * 0.6, y: p.y * 0.6 }));
    this.graphics.strokePoints(innerPoints, true);
    
    // Core
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(0, 0, s * 0.3);
  }
  
  drawShooter(size, color) {
    // Forma de nave con cañón
    this.graphics.fillStyle(color, 0.8);
    this.graphics.lineStyle(2, color, 1);
    
    const s = size / 2;
    
    // Cuerpo
    this.graphics.fillTriangle(0, -s, -s * 0.7, s * 0.5, s * 0.7, s * 0.5);
    this.graphics.strokeTriangle(0, -s, -s * 0.7, s * 0.5, s * 0.7, s * 0.5);
    
    // Cañón
    this.graphics.fillRect(-3, -s * 1.2, 6, s * 0.5);
    
    // Motores
    this.graphics.fillStyle(GAME_CONFIG.COLORS.ORANGE, 0.8);
    this.graphics.fillCircle(-s * 0.4, s * 0.5, s * 0.2);
    this.graphics.fillCircle(s * 0.4, s * 0.5, s * 0.2);
  }
  
  drawSwarm(size, color) {
    // Pequeño círculo
    this.graphics.fillStyle(color, 0.8);
    this.graphics.lineStyle(1, color, 1);
    
    const s = size / 2;
    this.graphics.fillCircle(0, 0, s);
    this.graphics.strokeCircle(0, 0, s);
    
    // Brillo central
    this.graphics.fillStyle(0xffffff, 0.6);
    this.graphics.fillCircle(0, 0, s * 0.4);
  }
  
  createHealthBar() {
    // La barra de vida se crea FUERA del container para que no rote
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(10); // Por encima del enemigo
  }
  
  updateHealthBar() {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    const width = this.config.size;
    const height = 4;
    
    // Posición fija encima del enemigo (no rota)
    const barX = this.x - width / 2;
    const barY = this.y - this.config.size / 2 - 12;
    
    // Fondo
    this.healthBar.fillStyle(0x333333, 0.8);
    this.healthBar.fillRect(barX, barY, width, height);
    
    // Vida actual
    const healthPercent = this.hp / this.maxHp;
    const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRect(barX, barY, width * healthPercent, height);
  }
  
  update(time, delta, playerX, playerY) {
    if (this.hp <= 0 || !this.active) return;
    
    // Actualizar barra de vida
    this.updateHealthBar();
    
    // Calcular movimiento
    let moveAngle = 0;
    let shouldMove = true;
    
    // Comportamiento según tipo
    switch (this.behavior) {
      case 'chase':
        moveAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        break;
      case 'zigzag':
        this.zigzagTimer += delta;
        if (this.zigzagTimer > 500) {
          this.zigzagTimer = 0;
          this.zigzagDirection *= -1;
        }
        moveAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        moveAngle += this.zigzagDirection * Math.PI / 4;
        break;
      case 'shoot':
        const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        if (distance > 200) {
          moveAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        } else {
          shouldMove = false;
          // Rotar hacia el jugador y disparar
          moveAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
          if (time - this.lastFireTime >= this.fireRate) {
            this.lastFireTime = time;
            this.scene.events.emit('enemyFire', this.x, this.y, moveAngle, this.bulletDamage);
          }
        }
        break;
      case 'swarm':
        moveAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        moveAngle += Math.sin(time * 0.005 + this.swarmOffset) * 0.5;
        break;
    }
    
    // Aplicar movimiento manual
    if (shouldMove) {
      const moveSpeed = this.speed * (delta / 1000);
      this.x += Math.cos(moveAngle) * moveSpeed;
      this.y += Math.sin(moveAngle) * moveSpeed;
    }
    
    // Rotar hacia la dirección de movimiento
    this.rotation = moveAngle + Math.PI / 2;
  }
  
  chasePlayer(playerX, playerY) {
    // Ya no se usa, el movimiento está en update()
  }
  
  zigzagMove(playerX, playerY, delta) {
    // Ya no se usa, el movimiento está en update()
  }
  
  shootBehavior(playerX, playerY, time) {
    // Ya no se usa, el movimiento está en update()
  }
  
  swarmMove(playerX, playerY, time) {
    // Ya no se usa, el movimiento está en update()
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    
    // Flash de daño
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.3,
      duration: 50,
      yoyo: true
    });
    
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }
  
  die() {
    // Destruir barra de vida
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    
    // Emitir evento con posición y datos para drops/puntos
    this.scene.events.emit('enemyDeath', this.x, this.y, this.points, this.crystalDrop, this.type);
    
    // Animación de muerte
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Partículas de explosión
    this.createDeathParticles();
  }
  
  createDeathParticles() {
    const particles = this.scene.add.graphics();
    particles.setPosition(this.x, this.y);
    
    const particleCount = 8;
    const particleData = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      particleData.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * (50 + Math.random() * 50),
        vy: Math.sin(angle) * (50 + Math.random() * 50),
        alpha: 1
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
          p.alpha -= 0.05;
          
          if (p.alpha > 0) {
            allDead = false;
            particles.fillStyle(this.config.color, p.alpha);
            particles.fillCircle(p.x, p.y, 4);
          }
        });
        
        if (allDead) {
          timer.destroy();
          particles.destroy();
        }
      },
      loop: true
    });
  }
}

export default Enemy;

