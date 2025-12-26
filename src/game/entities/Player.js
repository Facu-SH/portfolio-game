import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.scene = scene;
    
    // Stats
    this.maxHp = GAME_CONFIG.PLAYER.MAX_HP;
    this.hp = this.maxHp;
    this.isInvulnerable = false;
    this.isDead = false;
    
    // Disparo normal
    this.fireRate = GAME_CONFIG.PLAYER.FIRE_RATE;
    this.lastFireTime = 0;
    this.bulletDamage = GAME_CONFIG.PLAYER.BULLET_DAMAGE;
    this.shotCount = 1; // Cantidad de balas por disparo (1 = normal, 2 = doble)
    
    // Misil especial
    this.missileCooldown = GAME_CONFIG.PLAYER.MISSILE_COOLDOWN;
    this.lastMissileTime = -this.missileCooldown; // Disponible al inicio
    this.maxMissiles = 1; // Cantidad máxima de misiles que se pueden cargar
    this.missileCount = 1; // Misiles actuales disponibles
    
    // Movimiento
    this.targetX = x;
    this.targetY = y;
    this.lerpFactor = GAME_CONFIG.PLAYER.LERP_FACTOR;
    
    // Agregar al scene PRIMERO
    scene.add.existing(this);
    
    // Configurar depth para que esté visible
    this.setDepth(10);
    this.setVisible(true);
    this.setActive(true);
    this.setAlpha(1);
    
    // Crear gráficos de la nave DESPUÉS de agregar a la escena
    this.createShipGraphics();
    
    // Crear indicador de cooldown del misil
    this.createCooldownIndicator();
    
    // Configurar física
    scene.physics.add.existing(this);
    this.body.setCircle(16, -16, -16);
    
    // Trail de partículas
    this.createTrail();
  }
  
  createShipGraphics() {
    // Cuerpo principal de la nave (triángulo apuntando hacia arriba)
    this.shipBody = this.scene.add.graphics();
    this.shipBody.setVisible(true);
    this.shipBody.setActive(true);
    this.shipBody.setAlpha(1);
    
    this.shipBody.lineStyle(2, GAME_CONFIG.COLORS.CYAN_NEON, 1);
    this.shipBody.fillStyle(0x001a33, 0.8);
    
    // Dibujar nave estilo triangular
    this.shipBody.beginPath();
    this.shipBody.moveTo(0, -20);  // Punta
    this.shipBody.lineTo(-15, 15); // Esquina izquierda
    this.shipBody.lineTo(-5, 10);  // Muesca izquierda
    this.shipBody.lineTo(0, 12);   // Centro trasero
    this.shipBody.lineTo(5, 10);   // Muesca derecha
    this.shipBody.lineTo(15, 15);  // Esquina derecha
    this.shipBody.closePath();
    this.shipBody.fillPath();
    this.shipBody.strokePath();
    
    // Motor (glow)
    this.engineGlow = this.scene.add.graphics();
    this.engineGlow.setVisible(true);
    this.engineGlow.setActive(true);
    this.engineGlow.setAlpha(1);
    this.updateEngineGlow(1);
    
    // Cabina
    this.shipBody.fillStyle(GAME_CONFIG.COLORS.CYAN_NEON, 0.3);
    this.shipBody.fillCircle(0, -5, 5);
    
    // IMPORTANTE: Agregar Graphics directamente a la escena, NO al Container
    // Los Graphics dentro de Containers no se renderizan correctamente en Phaser 3
    this.scene.add.existing(this.shipBody);
    this.scene.add.existing(this.engineGlow);
    this.shipBody.setDepth(10);
    this.engineGlow.setDepth(10);
    this.shipBody.setPosition(this.x, this.y);
    this.engineGlow.setPosition(this.x, this.y);
    this.shipBody.setVisible(true);
    this.shipBody.setActive(true);
    this.shipBody.setAlpha(1);
    this.engineGlow.setVisible(true);
    this.engineGlow.setActive(true);
    this.engineGlow.setAlpha(1);
    
    // Guardar referencia para actualizar posición en update()
    this.graphicsNeedsUpdate = true;
  }
  
  updateEngineGlow(intensity) {
    this.engineGlow.clear();
    this.engineGlow.fillStyle(GAME_CONFIG.COLORS.CYAN_NEON, 0.6 * intensity);
    this.engineGlow.fillTriangle(-5, 12, 5, 12, 0, 20 + (intensity * 10));
    
    // Glow exterior
    this.engineGlow.fillStyle(GAME_CONFIG.COLORS.CYAN_NEON, 0.2 * intensity);
    this.engineGlow.fillTriangle(-8, 12, 8, 12, 0, 25 + (intensity * 15));
  }
  
  createCooldownIndicator() {
    this.cooldownRing = this.scene.add.graphics();
    // Agregar directamente a la escena también
    this.scene.add.existing(this.cooldownRing);
    this.cooldownRing.setDepth(11); // Por encima de la nave
    this.cooldownRing.setPosition(this.x, this.y);
    this.cooldownRing.setVisible(true);
    this.cooldownRing.setActive(true);
    this.cooldownRing.setAlpha(1);
  }
  
  updateCooldownIndicator() {
    this.cooldownRing.clear();
    
    // Si tiene todos los misiles, mostrar que está listo
    if (this.missileCount >= this.maxMissiles) {
      // Listo para disparar - pulso sutil
      const pulse = 0.5 + Math.sin(this.scene.time.now * 0.005) * 0.3;
      this.cooldownRing.lineStyle(2, GAME_CONFIG.COLORS.MAGENTA, pulse);
      this.cooldownRing.strokeCircle(0, 0, 25);
      return;
    }
    
    // Si no tiene todos los misiles, mostrar progreso de recarga
    // El progreso es desde el último misil disparado hasta que se recargue uno
    const elapsed = this.scene.time.now - this.lastMissileTime;
    const progress = Math.min(elapsed / this.missileCooldown, 1);
    
    // Anillo de fondo
    this.cooldownRing.lineStyle(3, 0x333333, 0.5);
    this.cooldownRing.strokeCircle(0, 0, 25);
    
    // Anillo de progreso - UNA SOLA VUELTA (0 a 2π)
    // Empezar desde arriba (-π/2) y hacer una vuelta completa cuando progress = 1
    this.cooldownRing.lineStyle(3, GAME_CONFIG.COLORS.MAGENTA, 0.8);
    this.cooldownRing.beginPath();
    this.cooldownRing.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + (progress * Math.PI * 2), false);
    this.cooldownRing.strokePath();
  }
  
  createTrail() {
    // Trail simple con partículas
    this.trailParticles = [];
  }
  
  update(time, delta) {
    if (this.isDead) return;
    
    // Movimiento suave hacia el cursor
    this.x = Phaser.Math.Linear(this.x, this.targetX, this.lerpFactor);
    this.y = Phaser.Math.Linear(this.y, this.targetY, this.lerpFactor);
    
    // Actualizar posición de los Graphics si están fuera del Container
    if (this.graphicsNeedsUpdate && this.shipBody && this.engineGlow) {
      this.shipBody.setPosition(this.x, this.y);
      this.engineGlow.setPosition(this.x, this.y);
      this.shipBody.setRotation(this.rotation);
      this.engineGlow.setRotation(this.rotation);
      this.shipBody.setAlpha(this.alpha);
      this.engineGlow.setAlpha(this.alpha);
    }
    
    // Actualizar posición del cooldownRing si está fuera del Container
    if (this.cooldownRing && !this.cooldownRing.parentContainer) {
      this.cooldownRing.setPosition(this.x, this.y);
      this.cooldownRing.setRotation(this.rotation);
      this.cooldownRing.setAlpha(this.alpha);
    }
    
    // Calcular distancia al cursor
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
    
    // Rotar hacia el cursor (la nave siempre mira hacia donde está el mouse)
    if (distance > 5) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
      this.rotation = angle + Math.PI / 2;
    }
    
    // Actualizar glow del motor basado en movimiento
    const intensity = Math.min(distance / 100, 1);
    this.updateEngineGlow(0.5 + intensity * 0.5);
    
    // Recargar misiles uno a la vez si el cooldown terminó y hay espacio disponible
    if (this.missileCount < this.maxMissiles) {
      const timeSinceLastMissile = time - this.lastMissileTime;
      if (timeSinceLastMissile >= this.missileCooldown) {
        this.missileCount = Math.min(this.missileCount + 1, this.maxMissiles);
        this.lastMissileTime = time; // Resetear cooldown para el siguiente misil
      }
    }
    
    // Actualizar indicador de cooldown
    this.updateCooldownIndicator();
    
    // Actualizar física
    if (this.body) {
      this.body.position.set(this.x - 16, this.y - 16);
    }
  }
  
  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }
  
  canFire() {
    return this.scene.time.now - this.lastFireTime >= this.fireRate;
  }
  
  fire() {
    if (!this.canFire() || this.isDead) return null;
    
    this.lastFireTime = this.scene.time.now;
    
    // Disparo en la dirección que mira la nave (su rotación)
    const angle = this.rotation - Math.PI / 2;
    
    // Si tiene disparo doble, devolver array de balas
    if (this.shotCount >= 2) {
      // Offset perpendicular para balas paralelas
      const perpAngle = angle + Math.PI / 2;
      const offset = 8; // Distancia entre balas
      
      return [
        {
          x: this.x + Math.cos(angle) * 25 + Math.cos(perpAngle) * offset,
          y: this.y + Math.sin(angle) * 25 + Math.sin(perpAngle) * offset,
          angle: angle,
          damage: this.bulletDamage
        },
        {
          x: this.x + Math.cos(angle) * 25 - Math.cos(perpAngle) * offset,
          y: this.y + Math.sin(angle) * 25 - Math.sin(perpAngle) * offset,
          angle: angle,
          damage: this.bulletDamage
        }
      ];
    }
    
    // Disparo simple
    return {
      x: this.x + Math.cos(angle) * 25,
      y: this.y + Math.sin(angle) * 25,
      angle: angle,
      damage: this.bulletDamage
    };
  }
  
  canFireMissile() {
    // Puede disparar si tiene misiles disponibles (sin esperar cooldown)
    return this.missileCount > 0 && !this.isDead;
  }
  
  fireMissile() {
    if (!this.canFireMissile()) return null;
    
    // Usar un misil
    this.missileCount--;
    
    // El tiempo del último misil se actualizará desde MainScene cuando se dispare el último
    // Esto permite disparar todos los misiles rápidamente
    
    // Misil sale en la dirección que mira la nave (su rotación)
    const angle = this.rotation - Math.PI / 2;
    
    // Calcular punto de destino lejano en la dirección de la nave
    const targetDistance = 800;
    const targetX = this.x + Math.cos(angle) * targetDistance;
    const targetY = this.y + Math.sin(angle) * targetDistance;
    
    return {
      x: this.x + Math.cos(angle) * 25,
      y: this.y + Math.sin(angle) * 25,
      angle: angle,
      targetX: targetX,
      targetY: targetY
    };
  }
  
  takeDamage(amount) {
    if (this.isInvulnerable || this.isDead) return false;
    
    this.hp -= amount;
    this.isInvulnerable = true;
    
    // Flash de daño
    this.scene.tweens.add({
      targets: this.shipBody,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.shipBody.alpha = 1;
      }
    });
    
    // Screen shake
    this.scene.cameras.main.shake(100, 0.01);
    
    // Flash rojo en la pantalla
    this.scene.cameras.main.flash(100, 255, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        // Fin del flash
      }
    });
    
    // Periodo de invulnerabilidad
    this.scene.time.delayedCall(GAME_CONFIG.PLAYER.INVULNERABILITY_TIME, () => {
      this.isInvulnerable = false;
    });
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true; // Murió
    }
    
    return false;
  }
  
  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }
  
  die() {
    this.isDead = true;
    
    // Animación de muerte
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.events.emit('playerDeath');
      }
    });
  }
  
  reset() {
    this.hp = this.maxHp;
    this.isDead = false;
    this.isInvulnerable = false;
    this.alpha = 1;
    this.scale = 1;
    this.lastMissileTime = -this.missileCooldown;
    this.missileCount = this.maxMissiles;
  }
}

export default Player;

