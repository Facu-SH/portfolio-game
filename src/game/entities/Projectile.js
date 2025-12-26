import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class Bullet extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y, angle, isEnemy = false, damage = null) {
    super(scene);
    
    this.scene = scene;
    this.isEnemy = isEnemy;
    // Si no se pasa daño, usar el valor por defecto
    this.damage = damage !== null 
      ? damage 
      : (isEnemy ? GAME_CONFIG.DAMAGE.ENEMY_BULLET : GAME_CONFIG.PLAYER.BULLET_DAMAGE);
    this.speed = isEnemy ? 300 : GAME_CONFIG.PLAYER.BULLET_SPEED;
    this.angle = angle;
    
    // Velocidad en componentes
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    
    // Dibujar bala
    const color = isEnemy ? GAME_CONFIG.COLORS.RED : GAME_CONFIG.COLORS.CYAN_NEON;
    this.fillStyle(color, 1);
    this.fillCircle(0, 0, isEnemy ? 5 : 4);
    
    // Glow
    this.fillStyle(color, 0.3);
    this.fillCircle(0, 0, isEnemy ? 8 : 6);
    
    this.setPosition(x, y);
    scene.add.existing(this);
    
    // Auto-destruir fuera de pantalla
    this.lifespan = 3000;
    scene.time.delayedCall(this.lifespan, () => {
      if (this.active) this.destroy();
    });
  }
  
  update(time, delta) {
    if (!this.scene || !this.active) return;
    
    // Mover manualmente
    const dt = delta / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Verificar si está fuera de la pantalla
    if (this.x < -50 || this.x > this.scene.scale.width + 50 ||
        this.y < -50 || this.y > this.scene.scale.height + 50) {
      this.destroy();
    }
  }
}

export class Missile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, angle, targetX, targetY) {
    super(scene, x, y);
    
    this.scene = scene;
    this.damage = GAME_CONFIG.PLAYER.MISSILE_DAMAGE;
    this.aoeDamage = GAME_CONFIG.PLAYER.MISSILE_AOE_DAMAGE;
    this.aoeRadius = GAME_CONFIG.PLAYER.MISSILE_AOE_RADIUS;
    this.speed = GAME_CONFIG.PLAYER.MISSILE_SPEED;
    this.hasExploded = false;
    this.distanceTraveled = 0;
    this.minDistance = 100; // Distancia mínima antes de poder explotar
    this.startX = x;
    this.startY = y;
    
    // Si el target está muy cerca, extenderlo en la misma dirección
    const distToTarget = Phaser.Math.Distance.Between(x, y, targetX, targetY);
    if (distToTarget < 150) {
      const targetAngle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
      this.targetX = x + Math.cos(targetAngle) * 500;
      this.targetY = y + Math.sin(targetAngle) * 500;
    } else {
      this.targetX = targetX;
      this.targetY = targetY;
    }
    
    // Crear gráficos del misil
    this.createMissileGraphics();
    
    scene.add.existing(this);
    
    // Calcular ángulo hacia el objetivo
    const moveAngle = Phaser.Math.Angle.Between(x, y, this.targetX, this.targetY);
    this.rotation = moveAngle + Math.PI / 2;
    this.moveAngle = moveAngle;
    
    // Velocidad en componentes (movimiento manual)
    this.vx = Math.cos(moveAngle) * this.speed;
    this.vy = Math.sin(moveAngle) * this.speed;
    
    // Trail del misil
    this.createTrail();
  }
  
  createMissileGraphics() {
    this.missileBody = this.scene.add.graphics();
    
    // Cuerpo del misil
    this.missileBody.fillStyle(GAME_CONFIG.COLORS.MAGENTA, 1);
    this.missileBody.fillRect(-4, -12, 8, 20);
    
    // Punta
    this.missileBody.fillTriangle(-4, -12, 4, -12, 0, -18);
    
    // Aletas
    this.missileBody.fillTriangle(-4, 8, -10, 12, -4, 4);
    this.missileBody.fillTriangle(4, 8, 10, 12, 4, 4);
    
    // Glow
    this.missileBody.fillStyle(GAME_CONFIG.COLORS.MAGENTA, 0.3);
    this.missileBody.fillCircle(0, 0, 12);
    
    this.add(this.missileBody);
  }
  
  createTrail() {
    // Trail del motor
    this.trail = this.scene.add.graphics();
    this.add(this.trail);
  }
  
  update(time, delta) {
    if (this.hasExploded || !this.scene || !this.active) return;
    
    // Mover manualmente
    const dt = (delta || 16) / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Calcular distancia recorrida
    this.distanceTraveled = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
    
    // Actualizar trail
    this.trail.clear();
    this.trail.fillStyle(GAME_CONFIG.COLORS.MAGENTA, 0.5);
    this.trail.fillTriangle(-3, 10, 3, 10, 0, 25 + Math.random() * 10);
    this.trail.fillStyle(GAME_CONFIG.COLORS.ORANGE, 0.3);
    this.trail.fillTriangle(-5, 10, 5, 10, 0, 30 + Math.random() * 15);
    
    // Solo explotar si ha viajado la distancia mínima
    if (this.distanceTraveled >= this.minDistance) {
      // Verificar si llegó al objetivo
      const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
      if (distToTarget < 30) {
        this.explode();
        return;
      }
    }
    
    // Auto-destruir si sale de pantalla
    if (this.x < -50 || this.x > this.scene.scale.width + 50 ||
        this.y < -50 || this.y > this.scene.scale.height + 50) {
      this.explode(); // Explotar al salir para hacer daño en área
    }
  }
  
  explode() {
    if (this.hasExploded || !this.scene || !this.active) return;
    this.hasExploded = true;
    
    // Guardar posición antes de destruir
    const explosionX = this.x;
    const explosionY = this.y;
    const aoeRadius = this.aoeRadius;
    const aoeDamage = this.aoeDamage;
    
    // Usar el sistema de explosión mejorado si está disponible
    if (this.scene.createExplosion) {
      this.scene.createExplosion(explosionX, explosionY, aoeRadius, GAME_CONFIG.COLORS.MAGENTA);
    } else {
      // Fallback: explosión básica
      if (this.scene && this.scene.add) {
        const explosion = this.scene.add.graphics();
        explosion.setPosition(explosionX, explosionY);
        
        // Animación de explosión
        let frame = 0;
        const maxFrames = 15;
        
        if (this.scene.time) {
          const explosionTimer = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
              if (!explosion || !explosion.active) return;
              
              explosion.clear();
              
              const progress = frame / maxFrames;
              const radius = aoeRadius * progress;
              const alpha = 1 - progress;
              
              // Círculo exterior
              explosion.fillStyle(GAME_CONFIG.COLORS.MAGENTA, alpha * 0.5);
              explosion.fillCircle(0, 0, radius);
              
              // Círculo interior
              explosion.fillStyle(GAME_CONFIG.COLORS.ORANGE, alpha * 0.8);
              explosion.fillCircle(0, 0, radius * 0.6);
              
              // Centro brillante
              explosion.fillStyle(0xffffff, alpha);
              explosion.fillCircle(0, 0, radius * 0.2);
              
              frame++;
              if (frame >= maxFrames) {
                if (explosionTimer) explosionTimer.destroy();
                if (explosion && explosion.active) explosion.destroy();
              }
            },
            repeat: maxFrames - 1
          });
        }
      }
    }
    
    // Emitir evento de explosión para dañar enemigos en el área
    if (this.scene && this.scene.events) {
      this.scene.events.emit('missileExplosion', explosionX, explosionY, aoeRadius, aoeDamage);
    }
    
    // Destruir el misil
    if (this.active) {
      this.destroy();
    }
  }
}

export default { Bullet, Missile };

