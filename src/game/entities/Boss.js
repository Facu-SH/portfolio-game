import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { Spawner } from './Spawner.js';

export class Boss extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.scene = scene;
    
    // Stats del jefe - mucho más poderoso que enemigos normales
    this.maxHp = 2000;
    this.hp = this.maxHp;
    this.isDestroyed = false;
    
    // Tamaño grande
    this.size = 120;
    
    // Movimiento lento pero amenazante
    this.speed = 40;
    this.targetX = x;
    this.targetY = y;
    this.moveTimer = 0;
    this.moveCooldown = 3000; // Cambia de posición cada 3 segundos
    
    // Sistema de escudos rotatorios
    this.shieldCount = 4;
    this.shieldOrbitRadius = 100;
    this.shieldRotationSpeed = 1.5; // Radianes por segundo
    this.shieldAngle = 0;
    this.shields = [];
    
    // Sistema de invocación de spawners
    this.spawnTimer = 0;
    this.spawnCooldown = 8000; // Cada 8 segundos invoca un spawner
    this.maxSpawners = 3; // Máximo de spawners activos a la vez
    this.activeSpawners = [];
    
    // Sistema de ataque directo
    this.attackTimer = 0;
    this.attackCooldown = 2000; // Dispara cada 2 segundos
    this.bulletSpeed = 250;
    this.bulletDamage = 20;
    
    // Fases del jefe (se vuelve más agresivo con menos vida)
    this.phase = 1;
    
    // Agregar Container a la escena PRIMERO
    scene.add.existing(this);
    this.setDepth(10);
    this.setVisible(true);
    this.setActive(true);
    this.setAlpha(1);
    
    // Crear gráficos DESPUÉS de agregar a la escena
    this.createGraphics();
    this.createShields();
    
    // Física
    scene.physics.add.existing(this);
    const bodySize = this.size * 0.4;
    this.body.setCircle(bodySize, -bodySize, -bodySize);
    
    // Animación de entrada épica
    this.alpha = 0;
    this.scale = 0.3;
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 1500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Flash de advertencia
        scene.cameras.main.flash(300, 255, 0, 100);
      }
    });
  }
  
  createGraphics() {
    // Cuerpo principal del jefe - forma hexagonal amenazante
    this.bossBody = this.scene.add.graphics();
    
    // Glow exterior
    this.bossBody.lineStyle(4, 0xff0066, 0.3);
    this.drawHexagon(this.bossBody, 0, 0, this.size * 0.7, false);
    
    // Cuerpo principal
    this.bossBody.lineStyle(3, 0xff0066, 1);
    this.bossBody.fillStyle(0x1a0011, 0.9);
    this.drawHexagon(this.bossBody, 0, 0, this.size * 0.5, true);
    
    // Núcleo interior pulsante
    this.coreGlow = this.scene.add.graphics();
    this.updateCoreGlow(1);
    
    // Detalles internos
    this.bossBody.lineStyle(2, 0xff3399, 0.6);
    this.drawHexagon(this.bossBody, 0, 0, this.size * 0.3, false);
    
    // Ojo central
    this.bossBody.fillStyle(0xff0066, 0.8);
    this.bossBody.fillCircle(0, 0, 15);
    this.bossBody.fillStyle(0xffffff, 1);
    this.bossBody.fillCircle(0, 0, 8);
    this.bossBody.fillStyle(0xff0066, 1);
    this.bossBody.fillCircle(0, 0, 4);
    
    // IMPORTANTE: Agregar Graphics directamente a la escena, NO al Container
    // Los Graphics dentro de Containers no se renderizan correctamente en Phaser 3
    this.scene.add.existing(this.bossBody);
    this.scene.add.existing(this.coreGlow);
    this.bossBody.setDepth(10);
    this.coreGlow.setDepth(10);
    this.bossBody.setPosition(this.x, this.y);
    this.coreGlow.setPosition(this.x, this.y);
    this.bossBody.setVisible(true);
    this.bossBody.setActive(true);
    this.bossBody.setAlpha(1);
    this.coreGlow.setVisible(true);
    this.coreGlow.setActive(true);
    this.coreGlow.setAlpha(1);
    
    // Guardar referencia para actualizar posición en update()
    this.graphicsNeedsUpdate = true;
  }
  
  drawHexagon(graphics, x, y, radius, fill) {
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    if (fill) {
      graphics.fillPath();
    }
    graphics.strokePath();
  }
  
  updateCoreGlow(intensity) {
    this.coreGlow.clear();
    
    // Glow pulsante del núcleo
    const pulse = 0.5 + Math.sin(this.scene.time.now * 0.003) * 0.3;
    this.coreGlow.fillStyle(0xff0066, 0.2 * pulse * intensity);
    this.coreGlow.fillCircle(0, 0, this.size * 0.4);
    
    this.coreGlow.fillStyle(0xff3399, 0.3 * pulse * intensity);
    this.coreGlow.fillCircle(0, 0, this.size * 0.25);
  }
  
  createShields() {
    // Crear escudos orbitando
    for (let i = 0; i < this.shieldCount; i++) {
      const shield = this.scene.add.graphics();
      
      // Dibujar escudo triangular
      shield.lineStyle(3, 0x00ffff, 1);
      shield.fillStyle(0x003333, 0.8);
      shield.beginPath();
      shield.moveTo(0, -20);
      shield.lineTo(-15, 15);
      shield.lineTo(15, 15);
      shield.closePath();
      shield.fillPath();
      shield.strokePath();
      
      // Glow del escudo
      shield.lineStyle(2, 0x00ffff, 0.4);
      shield.strokeCircle(0, 0, 25);
      
      // Hitbox del escudo (para colisiones)
      shield.shieldRadius = 25;
      shield.isShield = true;
      
      this.shields.push(shield);
      this.scene.add.existing(shield);
    }
  }
  
  update(time, delta) {
    if (this.isDestroyed) return;
    
    // Actualizar posición de los Graphics si están fuera del Container
    if (this.graphicsNeedsUpdate && this.bossBody && this.coreGlow) {
      this.bossBody.setPosition(this.x, this.y);
      this.coreGlow.setPosition(this.x, this.y);
      this.bossBody.setRotation(this.rotation);
      this.coreGlow.setRotation(this.rotation);
      this.bossBody.setAlpha(this.alpha);
      this.coreGlow.setAlpha(this.alpha);
    }
    
    // Actualizar fase basada en HP
    this.updatePhase();
    
    // Movimiento lento hacia posición objetivo
    this.updateMovement(time, delta);
    
    // Rotar escudos
    this.updateShields(time, delta);
    
    // Actualizar visual del núcleo
    this.updateCoreGlow(1);
    
    // Invocar spawners
    this.updateSpawning(time);
    
    // Ataques directos
    this.updateAttacks(time);
    
    // Limpiar spawners destruidos
    this.activeSpawners = this.activeSpawners.filter(s => s.active && !s.isDestroyed);
  }
  
  updatePhase() {
    const hpPercent = this.hp / this.maxHp;
    
    if (hpPercent <= 0.3 && this.phase < 3) {
      this.phase = 3;
      this.shieldRotationSpeed = 3; // Escudos giran más rápido
      this.attackCooldown = 1000; // Ataca más seguido
      this.spawnCooldown = 5000; // Invoca spawners más seguido
      this.scene.cameras.main.shake(500, 0.02);
      console.log('🔥 Jefe entra en fase 3!');
    } else if (hpPercent <= 0.6 && this.phase < 2) {
      this.phase = 2;
      this.shieldRotationSpeed = 2;
      this.attackCooldown = 1500;
      this.spawnCooldown = 6000;
      this.scene.cameras.main.shake(300, 0.01);
      console.log('⚡ Jefe entra en fase 2!');
    }
  }
  
  updateMovement(time, delta) {
    this.moveTimer += delta;
    
    if (this.moveTimer >= this.moveCooldown) {
      this.moveTimer = 0;
      
      // Nueva posición aleatoria en la mitad superior de la pantalla
      const margin = 150;
      this.targetX = margin + Math.random() * (this.scene.scale.width - margin * 2);
      this.targetY = margin + Math.random() * (this.scene.scale.height * 0.4);
    }
    
    // Movimiento suave hacia el objetivo
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      const speed = this.speed * (delta / 1000);
      this.x += (dx / distance) * speed;
      this.y += (dy / distance) * speed;
    }
    
    // Actualizar física
    if (this.body) {
      this.body.position.set(this.x - this.size * 0.4, this.y - this.size * 0.4);
    }
  }
  
  updateShields(time, delta) {
    // Rotar escudos
    this.shieldAngle += this.shieldRotationSpeed * (delta / 1000);
    
    // Posicionar cada escudo en órbita
    for (let i = 0; i < this.shields.length; i++) {
      const shield = this.shields[i];
      const angle = this.shieldAngle + (Math.PI * 2 / this.shieldCount) * i;
      
      shield.x = this.x + Math.cos(angle) * this.shieldOrbitRadius;
      shield.y = this.y + Math.sin(angle) * this.shieldOrbitRadius;
      shield.rotation = angle + Math.PI / 2; // Apuntar hacia afuera
      
      // Guardar posición global para colisiones
      shield.globalX = shield.x;
      shield.globalY = shield.y;
    }
  }
  
  updateSpawning(time) {
    this.spawnTimer += this.scene.game.loop.delta;
    
    if (this.spawnTimer >= this.spawnCooldown && this.activeSpawners.length < this.maxSpawners) {
      this.spawnTimer = 0;
      this.spawnSpawner();
    }
  }
  
  spawnSpawner() {
    // Posición aleatoria cerca del jefe
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 100;
    
    let spawnX = this.x + Math.cos(angle) * distance;
    let spawnY = this.y + Math.sin(angle) * distance;
    
    // Mantener dentro de la pantalla
    spawnX = Math.max(50, Math.min(this.scene.scale.width - 50, spawnX));
    spawnY = Math.max(50, Math.min(this.scene.scale.height - 150, spawnY));
    
    // Crear spawner con dificultad basada en fase
    const difficulty = this.phase >= 3 ? 'hard' : this.phase >= 2 ? 'medium' : 'easy';
    const spawner = new Spawner(this.scene, spawnX, spawnY, difficulty);
    spawner.maxSpawns = 5; // Limitar spawns
    spawner.hp = 100; // Menos vida que spawners normales
    spawner.maxHp = 100;
    
    this.scene.spawners.add(spawner);
    this.activeSpawners.push(spawner);
    
    // Efecto visual de invocación
    this.scene.tweens.add({
      targets: spawner,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    console.log(`👾 Jefe invocó un spawner! (${this.activeSpawners.length}/${this.maxSpawners})`);
  }
  
  updateAttacks(time) {
    this.attackTimer += this.scene.game.loop.delta;
    
    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      this.fireAttack();
    }
  }
  
  fireAttack() {
    // Disparar hacia el jugador
    const player = this.scene.player;
    if (!player || player.isDead) return;
    
    // Ataque en abanico (múltiples disparos)
    const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
    const spreadCount = this.phase >= 2 ? 5 : 3;
    const spreadAngle = Math.PI / 8;
    
    for (let i = 0; i < spreadCount; i++) {
      const angle = baseAngle + spreadAngle * (i - (spreadCount - 1) / 2);
      
      // Emitir evento para crear bala enemiga
      this.scene.events.emit('enemyFire', this.x, this.y, angle, this.bulletDamage);
    }
    
    // Efecto visual de disparo
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1.1, to: 1 },
      duration: 100,
      ease: 'Quad.easeOut'
    });
  }
  
  // Verificar si un punto colisiona con algún escudo
  checkShieldCollision(x, y, radius = 8) {
    for (const shield of this.shields) {
      const dx = x - shield.globalX;
      const dy = y - shield.globalY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < shield.shieldRadius + radius) {
        return true; // Colisión con escudo
      }
    }
    return false;
  }
  
  takeDamage(amount) {
    if (this.isDestroyed) return false;
    
    this.hp -= amount;
    
    // Flash de daño
    this.scene.tweens.add({
      targets: this.bossBody,
      alpha: 0.5,
      duration: 50,
      yoyo: true,
      repeat: 2
    });
    
    // Screen shake menor
    this.scene.cameras.main.shake(50, 0.005);
    
    // Actualizar barra de vida
    this.scene.updateBossHealthBar();
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }
    
    return false;
  }
  
  die() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    
    console.log('💀 ¡JEFE DERROTADO!');
    
    // Destruir todos los spawners activos
    this.activeSpawners.forEach(spawner => {
      if (spawner.active) {
        spawner.takeDamage(9999);
      }
    });
    
    // Destruir escudos con animación
    this.shields.forEach((shield, index) => {
      this.scene.time.delayedCall(index * 100, () => {
        this.scene.tweens.add({
          targets: shield,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => shield.destroy()
        });
      });
    });
    
    // Animación de muerte épica
    this.scene.cameras.main.shake(1000, 0.03);
    this.scene.cameras.main.flash(500, 255, 100, 100);
    
    // Explosiones múltiples
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const offsetX = (Math.random() - 0.5) * this.size;
        const offsetY = (Math.random() - 0.5) * this.size;
        this.createExplosion(this.x + offsetX, this.y + offsetY);
      });
    }
    
    // Animación del cuerpo
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      rotation: Math.PI,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.events.emit('bossDefeated');
        this.destroy();
      }
    });
    
    // Drop masivo de cristales
    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        this.scene.events.emit('spawnCrystal', this.x + offsetX, this.y + offsetY, 'MEDIUM');
      });
    }
  }
  
  createExplosion(x, y) {
    const explosion = this.scene.add.graphics();
    explosion.setPosition(x, y);
    
    explosion.fillStyle(0xff6600, 1);
    explosion.fillCircle(0, 0, 30);
    explosion.fillStyle(0xffff00, 1);
    explosion.fillCircle(0, 0, 15);
    
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 2,
      duration: 400,
      onComplete: () => explosion.destroy()
    });
  }
  
  destroy() {
    // Limpiar escudos
    this.shields.forEach(shield => {
      if (shield && shield.active) shield.destroy();
    });
    this.shields = [];
    
    super.destroy();
  }
}

export default Boss;

