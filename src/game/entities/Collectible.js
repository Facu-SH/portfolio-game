import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class Crystal extends Phaser.GameObjects.Container {
  constructor(scene, x, y, size = 'SMALL') {
    super(scene, x, y);
    
    this.scene = scene;
    this.size = size;
    this.value = GAME_CONFIG.DROPS.CRYSTAL_VALUES[size];
    this.isCollected = false;
    this.magnetized = false;
    
    // Crear gráficos
    this.createGraphics();
    
    scene.add.existing(this);
    
    // Física
    scene.physics.add.existing(this);
    this.body.setCircle(12, -12, -12);
    
    // Animación de aparición
    this.alpha = 0;
    this.scale = 0;
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Flotación
    this.floatOffset = Math.random() * Math.PI * 2;
    
    // Auto-destruir después de un tiempo
    this.lifeTimer = scene.time.delayedCall(15000, () => {
      this.fadeOut();
    });
  }
  
  createGraphics() {
    this.graphics = this.scene.add.graphics();
    
    const sizes = {
      SMALL: { outer: 8, inner: 5 },
      MEDIUM: { outer: 12, inner: 8 },
      LARGE: { outer: 16, inner: 11 }
    };
    
    const s = sizes[this.size];
    
    // Glow exterior
    this.graphics.fillStyle(GAME_CONFIG.COLORS.CYAN_NEON, 0.3);
    this.graphics.fillCircle(0, 0, s.outer + 5);
    
    // Cristal principal (forma de diamante)
    this.graphics.fillStyle(GAME_CONFIG.COLORS.CYAN_NEON, 0.9);
    this.graphics.fillPoints([
      { x: 0, y: -s.outer },
      { x: s.inner, y: 0 },
      { x: 0, y: s.outer },
      { x: -s.inner, y: 0 }
    ], true);
    
    // Brillo interno
    this.graphics.fillStyle(0xffffff, 0.6);
    this.graphics.fillPoints([
      { x: 0, y: -s.inner * 0.6 },
      { x: s.inner * 0.4, y: 0 },
      { x: 0, y: s.inner * 0.6 },
      { x: -s.inner * 0.4, y: 0 }
    ], true);
    
    this.add(this.graphics);
  }
  
  update(time, delta, playerX, playerY) {
    if (this.isCollected) return;
    
    // Si está magnetizado, moverse hacia el jugador (movimiento manual)
    if (this.magnetized) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      const speed = 500; // Velocidad rápida para recolección
      const dt = delta / 1000;
      
      // Movimiento manual hacia el jugador
      this.x += Math.cos(angle) * speed * dt;
      this.y += Math.sin(angle) * speed * dt;
      
      // Rotación más rápida cuando está magnetizado
      this.graphics.rotation += delta * 0.01;
    } else {
      // Flotación normal
      this.y += Math.sin(time * 0.003 + this.floatOffset) * 0.5;
      
      // Rotación sutil
      this.graphics.rotation += delta * 0.002;
    }
  }
  
  collect() {
    if (this.isCollected) return 0;
    this.isCollected = true;
    
    if (this.lifeTimer) {
      this.lifeTimer.destroy();
    }
    
    // Animación de recolección
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: 1.5,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          if (this.active) this.destroy();
        }
      });
    } else {
      if (this.active) this.destroy();
    }
    
    return this.value;
  }
  
  fadeOut() {
    if (this.isCollected || !this.scene || !this.active) return;
    
    if (this.scene.tweens) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          if (this.active) this.destroy();
        }
      });
    } else {
      if (this.active) this.destroy();
    }
  }
  
  magnetize() {
    this.magnetized = true;
  }
}

export class HealthDrop extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.scene = scene;
    this.healAmount = GAME_CONFIG.DROPS.HEALTH_RESTORE;
    this.isCollected = false;
    
    // Crear gráficos
    this.createGraphics();
    
    scene.add.existing(this);
    
    // Física
    scene.physics.add.existing(this);
    this.body.setCircle(12, -12, -12);
    
    // Animación de aparición
    this.alpha = 0;
    this.scale = 0;
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Flotación
    this.floatOffset = Math.random() * Math.PI * 2;
    
    // Auto-destruir
    this.lifeTimer = scene.time.delayedCall(10000, () => {
      this.fadeOut();
    });
  }
  
  createGraphics() {
    this.graphics = this.scene.add.graphics();
    
    // Glow
    this.graphics.fillStyle(GAME_CONFIG.COLORS.GREEN_TERMINAL, 0.3);
    this.graphics.fillCircle(0, 0, 18);
    
    // Fondo del corazón
    this.graphics.fillStyle(0x003300, 0.8);
    this.graphics.fillCircle(0, 0, 12);
    
    // Cruz de salud
    this.graphics.fillStyle(GAME_CONFIG.COLORS.GREEN_TERMINAL, 1);
    this.graphics.fillRect(-3, -8, 6, 16);
    this.graphics.fillRect(-8, -3, 16, 6);
    
    this.add(this.graphics);
  }
  
  update(time, delta, playerX, playerY) {
    if (this.isCollected) return;
    
    // Si está magnetizado, moverse hacia el jugador
    if (this.magnetized && playerX !== undefined && playerY !== undefined) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      const speed = 500;
      const dt = (delta || 16) / 1000;
      
      // Movimiento manual hacia el jugador
      this.x += Math.cos(angle) * speed * dt;
      this.y += Math.sin(angle) * speed * dt;
      
      // Pulso más rápido cuando está magnetizado
      const pulse = 1 + Math.sin(time * 0.01) * 0.2;
      this.scale = pulse;
    } else {
      // Flotación normal
      this.y += Math.sin(time * 0.004 + this.floatOffset) * 0.3;
      
      // Pulso
      const pulse = 1 + Math.sin(time * 0.006) * 0.1;
      this.scale = pulse;
    }
  }
  
  magnetize() {
    this.magnetized = true;
  }
  
  collect() {
    if (this.isCollected) return 0;
    this.isCollected = true;
    
    if (this.lifeTimer) {
      this.lifeTimer.destroy();
    }
    
    // Animación de recolección
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: 2,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          if (this.active) this.destroy();
        }
      });
    } else {
      if (this.active) this.destroy();
    }
    
    return this.healAmount;
  }
  
  fadeOut() {
    if (this.isCollected || !this.scene || !this.active) return;
    
    if (this.scene.tweens) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          if (this.active) this.destroy();
        }
      });
    } else {
      if (this.active) this.destroy();
    }
  }
}

export default { Crystal, HealthDrop };

