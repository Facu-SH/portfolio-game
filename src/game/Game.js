import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene.js';

export class Game {
  constructor(containerId = 'game-container') {
    this.containerId = containerId;
    this.game = null;
    this.isEnabled = false; // Inicia deshabilitado (modo página normal)
  }
  
  init() {
    console.log('🎮 Inicializando juego...');
    
    // Asegurar dimensiones válidas
    const width = Math.max(window.innerWidth || 800, 800);
    const height = Math.max(window.innerHeight || 600, 600);
    
    const config = {
      type: Phaser.AUTO,
      parent: this.containerId,
      width: width,
      height: height,
      transparent: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: width,
        height: height
      },
      input: {
        activePointers: 3
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      }
    };
    
    this.game = new Phaser.Game(config);
    
    console.log('🎮 Juego creado:', this.game);
    
    // El juego inicia deshabilitado (modo página normal)
    const container = document.getElementById(this.containerId);
    if (container) {
      container.style.display = 'none';
    }
    this.game.pause();
    
    // Debounce para resize para evitar errores de WebGL
    let resizeTimeout;
    this.resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.game && this.game.scale && this.game.isRunning) {
          const newWidth = Math.max(window.innerWidth || 800, 800);
          const newHeight = Math.max(window.innerHeight || 600, 600);
          
          // Solo redimensionar si las dimensiones son válidas y diferentes
          if (newWidth > 0 && newHeight > 0 && 
              !isNaN(newWidth) && !isNaN(newHeight) &&
              (this.game.scale.width !== newWidth || this.game.scale.height !== newHeight)) {
            try {
              this.game.scale.resize(newWidth, newHeight);
            } catch (error) {
              console.warn('⚠️ Error al redimensionar:', error);
            }
          }
        }
      }, 300); // Debounce de 300ms
    };
    
    // Esperar un frame para que WebGL se inicialice completamente
    requestAnimationFrame(() => {
      window.addEventListener('resize', this.resizeHandler);
    });
    
    return this;
  }
  
  toggle() {
    this.isEnabled = !this.isEnabled;
    const container = document.getElementById(this.containerId);
    
    if (container) {
      container.style.display = this.isEnabled ? 'block' : 'none';
    }
    
    if (this.game) {
      if (this.isEnabled) {
        this.game.resume();
      } else {
        this.game.pause();
      }
    }
    
    return this.isEnabled;
  }
  
  enable() {
    if (!this.isEnabled) {
      this.toggle();
    }
  }
  
  disable() {
    if (this.isEnabled) {
      this.toggle();
    }
  }
  
  destroy() {
    // Remover listener de resize
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

export default Game;

