// Sistema de Audio para el juego
// Usa Web Audio API para generar sonidos procedurales

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isInitialized = false;
    this.isMuted = false;
    
    // Volúmenes
    this.masterVolume = 0.5;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.6;
    
    // Música de fondo
    this.musicOscillators = [];
    this.musicPlaying = false;
    
    // Cache de buffers
    this.buffers = {};
    
    // Cargar preferencias guardadas
    this.loadPreferences();
  }
  
  // Inicializar el contexto de audio (debe llamarse después de interacción del usuario)
  init() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Crear nodos de ganancia
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.masterVolume;
      
      this.musicGain = this.audioContext.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = this.musicVolume;
      
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = this.sfxVolume;
      
      this.isInitialized = true;
      console.log('🔊 Sistema de audio inicializado');
      
      // Reanudar contexto si está suspendido
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (e) {
      console.warn('⚠️ No se pudo inicializar el audio:', e);
    }
  }
  
  // ============================================
  // EFECTOS DE SONIDO
  // ============================================
  
  // Disparo del jugador
  playShoot() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }
  
  // Disparo de misil
  playMissile() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
    
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  // Explosión de misil (AOE)
  playMissileExplosion() {
    if (!this.canPlay()) return;
    
    // Crear ruido para explosión
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    noise.start(this.audioContext.currentTime);
  }
  
  // Muerte de enemigo
  playEnemyDeath() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);
  }
  
  // Disparo enemigo
  playEnemyShoot() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.08);
  }
  
  // Recolectar cristal
  playCrystalCollect() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
    osc.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.05); // E5
    osc.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.1); // G5
    
    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);
  }
  
  // Recolectar vida
  playHealthCollect() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc.frequency.setValueAtTime(554, this.audioContext.currentTime + 0.1);
    osc.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  // Daño al jugador
  playPlayerHit() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.15);
  }
  
  // Compra de mejora
  playUpgrade() {
    if (!this.canPlay()) return;
    
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.audioContext.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }
  
  // Spawner destruido
  playSpawnerDestroyed() {
    if (!this.canPlay()) return;
    
    // Sonido grave de explosión
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.audioContext.currentTime);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);
    
    // Agregar ruido de explosión
    this.playExplosionNoise(0.4);
  }
  
  // Jefe derrotado
  playBossDefeated() {
    if (!this.canPlay()) return;
    
    // Secuencia épica de victoria
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.audioContext.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
    
    // Explosión final
    setTimeout(() => this.playExplosionNoise(0.8), 600);
  }
  
  // Game over
  playGameOver() {
    if (!this.canPlay()) return;
    
    const notes = [392, 330, 262, 196]; // G4, E4, C4, G3
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = this.audioContext.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }
  
  // Victoria
  playVictory() {
    if (!this.canPlay()) return;
    
    // Fanfarria de victoria
    const melody = [
      { note: 523, duration: 0.15 },  // C5
      { note: 523, duration: 0.15 },  // C5
      { note: 523, duration: 0.15 },  // C5
      { note: 523, duration: 0.4 },   // C5
      { note: 415, duration: 0.4 },   // Ab4
      { note: 466, duration: 0.4 },   // Bb4
      { note: 523, duration: 0.3 },   // C5
      { note: 466, duration: 0.15 },  // Bb4
      { note: 523, duration: 0.6 },   // C5
    ];
    
    let time = this.audioContext.currentTime;
    
    melody.forEach((note) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.type = 'square';
      osc.frequency.value = note.note;
      
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.setValueAtTime(0.2, time + note.duration * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
      
      osc.start(time);
      osc.stop(time + note.duration);
      
      time += note.duration;
    });
  }
  
  // Inicio de juego
  playGameStart() {
    if (!this.canPlay()) return;
    
    const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.audioContext.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }
  
  // Click de UI
  playUIClick() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sine';
    osc.frequency.value = 800;
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.05);
  }
  
  // Hover de UI
  playUIHover() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sine';
    osc.frequency.value = 600;
    
    gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.03);
  }
  
  // Combo incrementado
  playComboUp() {
    if (!this.canPlay()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }
  
  // Helper para ruido de explosión
  playExplosionNoise(volume = 0.5) {
    if (!this.canPlay()) return;
    
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    
    const noise = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    noise.start(this.audioContext.currentTime);
  }
  
  // ============================================
  // MÚSICA DE FONDO
  // ============================================
  
  startMusic() {
    if (!this.canPlay() || this.musicPlaying) return;
    
    this.musicPlaying = true;
    this.playAmbientMusic();
  }
  
  stopMusic() {
    this.musicPlaying = false;
    this.musicOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.musicOscillators = [];
  }
  
  playAmbientMusic() {
    if (!this.musicPlaying || !this.canPlay()) return;
    
    // Música ambiente espacial minimalista
    const baseNotes = [65.41, 82.41, 98.00, 73.42]; // C2, E2, G2, D2
    const duration = 4; // 4 segundos por nota
    
    const playDrone = (freq, startTime) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 1;
      
      // Envelope suave
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + duration * 0.3);
      gain.gain.linearRampToValueAtTime(0.15, startTime + duration * 0.7);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
      
      this.musicOscillators.push(osc);
      
      // Limpiar oscilador terminado
      osc.onended = () => {
        const idx = this.musicOscillators.indexOf(osc);
        if (idx > -1) this.musicOscillators.splice(idx, 1);
      };
    };
    
    // Programar loop de música
    const scheduleLoop = () => {
      if (!this.musicPlaying) return;
      
      const now = this.audioContext.currentTime;
      const noteIndex = Math.floor(Math.random() * baseNotes.length);
      
      playDrone(baseNotes[noteIndex], now);
      
      // Agregar armónicos sutiles ocasionalmente
      if (Math.random() > 0.5) {
        playDrone(baseNotes[noteIndex] * 2, now + 0.5);
      }
      
      // Programar siguiente nota
      setTimeout(scheduleLoop, duration * 1000 * 0.8);
    };
    
    scheduleLoop();
  }
  
  // ============================================
  // CONTROL DE VOLUMEN
  // ============================================
  
  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
    this.savePreferences();
  }
  
  setMusicVolume(value) {
    this.musicVolume = Math.max(0, Math.min(1, value));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
    this.savePreferences();
  }
  
  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, value));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
    this.savePreferences();
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
    this.savePreferences();
    return this.isMuted;
  }
  
  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }
  
  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }
  
  // ============================================
  // PERSISTENCIA
  // ============================================
  
  savePreferences() {
    try {
      localStorage.setItem('portfolio_audio_prefs', JSON.stringify({
        masterVolume: this.masterVolume,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        isMuted: this.isMuted
      }));
    } catch (e) {
      console.warn('No se pudieron guardar preferencias de audio');
    }
  }
  
  loadPreferences() {
    try {
      const saved = localStorage.getItem('portfolio_audio_prefs');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.masterVolume = prefs.masterVolume ?? 0.5;
        this.musicVolume = prefs.musicVolume ?? 0.3;
        this.sfxVolume = prefs.sfxVolume ?? 0.6;
        this.isMuted = prefs.isMuted ?? false;
      }
    } catch (e) {
      console.warn('No se pudieron cargar preferencias de audio');
    }
  }
  
  // ============================================
  // UTILIDADES
  // ============================================
  
  canPlay() {
    return this.isInitialized && !this.isMuted && this.audioContext?.state === 'running';
  }
  
  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  suspend() {
    if (this.audioContext?.state === 'running') {
      this.audioContext.suspend();
    }
  }
}

// Singleton
export const audioManager = new AudioManager();
export default audioManager;

