import './styles/main.css';
import { Game } from './game/Game.js';

// Inicializar el juego
const game = new Game('game-container');

// Ocultar pantalla de carga cuando todo esté listo
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  const body = document.body;
  
  if (loadingScreen && body) {
    // Pequeño delay para asegurar que todo esté renderizado
    setTimeout(() => {
      // Fade out de la pantalla de carga
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.4s ease';
      
      // Mostrar el body con fade in y restaurar scroll
      body.style.opacity = '1';
      body.style.transition = 'opacity 0.4s ease';
      body.style.overflowX = 'hidden';
      body.style.overflowY = 'auto';
      
      // Remover del DOM después de la animación
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.style.display = 'none';
        }
      }, 400);
    }, 500);
  }
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM cargado, inicializando...');
  
  // Mostrar pantalla de carga al inicio
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('visible');
  }
  
  // Inicializar el juego
  game.init();
  
  // Inicializar el juego automáticamente (activar y desactivar para que funcione correctamente)
  initializeGame();
  
  // Inicializar navegación
  initNavigation();
  
  // Inicializar portfolio
  initPortfolioFilters();
  initCarousels();
  
  // Inicializar footer de mejoras
  initUpgradeFooter();
  
  // Toggle del juego
  initGameControls();
  
  // Inicializar sistema de recompensas
  initConquestRewards();
  
  // Mostrar onboarding para usuarios nuevos
  initOnboarding();
  
  // Inicializar efecto de typing
  initTypingEffect();
  
  // Detectar si es móvil
  if (isMobile()) {
    showMobileWarning();
  }
  
  // Inicializar animaciones on-scroll
  initScrollReveal();
  
  // Inicializar pausa automática al cambiar de pestaña
  initVisibilityHandler();
  
  // Inicializar formulario de contacto
  initContactForm();
  
  // Inicializar sistema de notificaciones toast
  initToastSystem();
  
  // Inicializar página de progreso
  initProgressPage();
  
  // Inicializar navegación por teclado
  initKeyboardNavigation();
  
  // Registrar Service Worker
  registerServiceWorker();
  
  // Inicializar fondo de partículas
  initParticleBackground();
  
  // Inicializar botón de resetear progreso
  initResetProgressButton();
  
  // Ocultar pantalla de carga cuando todo esté listo
  hideLoadingScreen();
});

// ============================================
// SERVICE WORKER (PWA)
// ============================================

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('📱 Service Worker registrado:', registration.scope);
      
      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión disponible
            showToast('Nueva versión disponible. Recarga para actualizar.', 'info', 8000);
          }
        });
      });
    } catch (error) {
      console.warn('⚠️ Error registrando Service Worker:', error);
    }
  }
}

// ============================================
// PARTICLE BACKGROUND SYSTEM
// ============================================

function initParticleBackground() {
  const container = document.getElementById('particle-container');
  if (!container) return;
  
  // Configuración de partículas
  const config = {
    starCount: 80,
    shootingStarInterval: 8000,
    starSizes: ['small', 'medium', 'large'],
    starColors: ['', 'colored-cyan', 'colored-magenta', 'colored-indigo']
  };
  
  // Crear estrellas con animación escalonada
  for (let i = 0; i < config.starCount; i++) {
    createStar(container, config, i);
  }
  
  // Crear estrellas fugaces ocasionales
  setInterval(() => {
    if (Math.random() > 0.5) {
      createShootingStar(container);
    }
  }, config.shootingStarInterval);
  
  // Crear una estrella fugaz inicial después de un momento
  setTimeout(() => createShootingStar(container), 3000);
}

function createStar(container, config, index) {
  const star = document.createElement('div');
  star.className = 'star';
  
  // Tamaño aleatorio (más estrellas pequeñas que grandes)
  const sizeRandom = Math.random();
  let size;
  if (sizeRandom < 0.7) {
    size = 'small';
  } else if (sizeRandom < 0.9) {
    size = 'medium';
  } else {
    size = 'large';
  }
  star.classList.add(size);
  
  // Color aleatorio (mayoría blancas)
  if (Math.random() > 0.85) {
    const colors = config.starColors.filter(c => c !== '');
    star.classList.add(colors[Math.floor(Math.random() * colors.length)]);
  }
  
  // Posición inicial aleatoria
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  
  // Duración de animación variable (más lenta = más atmosférico)
  const duration = 20 + Math.random() * 40;
  star.style.animationDuration = `${duration}s`;
  
  // Delay escalonado para que no todas empiecen a la vez
  const delay = (index * 0.3) + Math.random() * 10;
  star.style.animationDelay = `${delay}s`;
  
  container.appendChild(star);
  
  // Recrear estrella cuando termine su animación
  star.addEventListener('animationend', () => {
    star.remove();
    createStar(container, config, 0);
  });
}

function createShootingStar(container) {
  const shootingStar = document.createElement('div');
  shootingStar.className = 'shooting-star';
  
  // Posición aleatoria en la parte superior
  shootingStar.style.left = `${20 + Math.random() * 60}%`;
  shootingStar.style.top = `${Math.random() * 40}%`;
  
  // Ángulo de caída variable
  const angle = -20 - Math.random() * 30;
  shootingStar.style.transform = `rotate(${angle}deg)`;
  
  // Color ocasional
  if (Math.random() > 0.7) {
    const colors = ['var(--accent-secondary)', 'var(--accent-primary)', 'var(--accent-tertiary)'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    shootingStar.style.background = `linear-gradient(90deg, ${color}, transparent)`;
  }
  
  container.appendChild(shootingStar);
  
  // Remover después de la animación
  setTimeout(() => {
    if (shootingStar.parentNode) shootingStar.remove();
  }, 1500);
}

// ============================================
// TYPING EFFECT
// ============================================

function initTypingEffect() {
  const typingElements = document.querySelectorAll('.typing-text[data-text]');
  if (!typingElements.length) return;
  
  // Verificar si prefers-reduced-motion está activo
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // Si el usuario prefiere menos movimiento, mostrar texto directamente
    typingElements.forEach(el => {
      el.textContent = el.dataset.text;
      el.classList.add('typing-complete');
    });
    return;
  }
  
  // Configuración de typing
  const config = {
    charDelay: 50,        // ms entre caracteres
    startDelay: 500,      // ms antes de empezar
    betweenDelay: 300,    // ms entre elementos
    cursorDuration: 2000  // ms que el cursor permanece visible después
  };
  
  let currentIndex = 0;
  let totalDelay = config.startDelay;
  
  function typeElement(element, startDelay) {
    const text = element.dataset.text;
    let charIndex = 0;
    
    setTimeout(() => {
      const typeInterval = setInterval(() => {
        element.textContent = text.substring(0, charIndex + 1);
        charIndex++;
        
        if (charIndex >= text.length) {
          clearInterval(typeInterval);
          
          // Mantener cursor visible un momento, luego ocultarlo
          setTimeout(() => {
            element.classList.add('typing-complete');
          }, config.cursorDuration);
        }
      }, config.charDelay);
    }, startDelay);
    
    // Retornar duración total de este elemento
    return text.length * config.charDelay;
  }
  
  // Iniciar typing secuencialmente
  typingElements.forEach((el, index) => {
    const duration = typeElement(el, totalDelay);
    totalDelay += duration + config.betweenDelay;
    
    // Quitar cursor de elementos anteriores cuando empiece el siguiente
    if (index > 0) {
      const prevEl = typingElements[index - 1];
      setTimeout(() => {
        prevEl.classList.add('no-cursor');
      }, totalDelay - config.betweenDelay - 100);
    }
  });
}

// ============================================
// ONBOARDING MODAL
// ============================================

function initOnboarding() {
  const modal = document.getElementById('onboarding-modal');
  if (!modal) return;
  
  // Verificar si el usuario ya vio el onboarding
  const hasSeenOnboarding = localStorage.getItem('portfolio_onboarding_seen');
  if (hasSeenOnboarding) return;
  
  const slides = modal.querySelectorAll('.onboarding-slide');
  const dots = modal.querySelectorAll('.onboarding-dot');
  const nextBtn = document.getElementById('onboarding-next');
  const skipBtn = document.getElementById('onboarding-skip');
  const dontShowCheckbox = document.getElementById('onboarding-dont-show');
  
  let currentSlide = 0;
  const totalSlides = slides.length;
  
  // Mostrar modal después de un pequeño delay
  setTimeout(() => {
    modal.classList.add('active');
  }, 1000);
  
  function goToSlide(index) {
    // Marcar slide anterior como exit
    slides[currentSlide].classList.remove('active');
    slides[currentSlide].classList.add('exit-left');
    
    // Activar nuevo slide
    setTimeout(() => {
      slides.forEach(slide => slide.classList.remove('exit-left'));
      currentSlide = index;
      slides[currentSlide].classList.add('active');
      
      // Actualizar dots
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });
      
      // Actualizar texto del botón
      if (currentSlide === totalSlides - 1) {
        nextBtn.textContent = '¡Empezar!';
      } else {
        nextBtn.textContent = 'Siguiente';
      }
    }, 150);
  }
  
  function closeModal() {
    modal.classList.remove('active');
    
    // Guardar preferencia si checkbox está marcado
    if (dontShowCheckbox.checked) {
      localStorage.setItem('portfolio_onboarding_seen', 'true');
    } else {
      // Si no marcó "no mostrar", guardar que ya lo vio esta sesión
      sessionStorage.setItem('portfolio_onboarding_seen_session', 'true');
    }
    
    // Remover modal del DOM después de la animación
    setTimeout(() => {
      modal.remove();
    }, 500);
  }
  
  // Event listeners
  nextBtn.addEventListener('click', () => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else {
      closeModal();
    }
  });
  
  skipBtn.addEventListener('click', closeModal);
  
  // Clic en dots para navegar
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (index !== currentSlide) {
        goToSlide(index);
      }
    });
  });
  
  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Cerrar al hacer clic en overlay
  modal.querySelector('.onboarding-overlay').addEventListener('click', closeModal);
}

// ============================================
// NAVEGACIÓN ENTRE PÁGINAS
// ============================================

let isTransitioning = false;

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const ctaButtons = document.querySelectorAll('.btn[data-page]');
  const pages = document.querySelectorAll('.page');
  
  // Crear contenedor de líneas warp
  createWarpLinesContainer();
  
  function navigateTo(pageId) {
    if (isTransitioning) return;
    
    const currentPage = document.querySelector('.page.active');
    const targetPage = document.getElementById(`page-${pageId}`);
    
    // Si ya estamos en la página, no hacer nada
    if (currentPage === targetPage) return;
    
    // Actualizar links activos
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });
    
    // Verificar si prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Transición simple sin animación
      if (currentPage) currentPage.classList.remove('active');
      targetPage.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => observeActivePageElements(), 50);
    } else {
      // Transición warp animada
      isTransitioning = true;
      
      // Mostrar líneas de velocidad
      triggerWarpLines();
      
      // Animar salida de página actual
      if (currentPage) {
        currentPage.classList.add('warp-exit');
      }
      
      // Después de la animación de salida, cambiar páginas
      setTimeout(() => {
        if (currentPage) {
          currentPage.classList.remove('active', 'warp-exit');
        }
        
        // Scroll instantáneo al top antes de mostrar nueva página
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Mostrar nueva página con animación de entrada
        targetPage.classList.add('active', 'warp-enter');
        
        // Limpiar clase de animación después
        setTimeout(() => {
          targetPage.classList.remove('warp-enter');
          isTransitioning = false;
          observeActivePageElements();
        }, 600);
        
      }, 350);
    }
    
    // Guardar página actual en URL
    history.pushState({ page: pageId }, '', `#${pageId}`);
  }
  
  // Event listeners para nav links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.dataset.page;
      navigateTo(pageId);
    });
  });
  
  // Event listeners para CTA buttons
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = btn.dataset.page;
      navigateTo(pageId);
    });
  });
  
  // Manejar navegación con botones del navegador
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      navigateTo(e.state.page);
    }
  });
  
  // Verificar URL inicial
  const initialPage = window.location.hash.slice(1) || 'about';
  if (initialPage !== 'about') {
    navigateTo(initialPage);
  }
}

function createWarpLinesContainer() {
  const container = document.createElement('div');
  container.className = 'warp-lines';
  container.id = 'warp-lines';
  document.body.appendChild(container);
}

function triggerWarpLines() {
  const container = document.getElementById('warp-lines');
  if (!container) return;
  
  // Limpiar líneas anteriores
  container.innerHTML = '';
  container.classList.add('active');
  
  // Crear líneas de velocidad
  const lineCount = 15;
  for (let i = 0; i < lineCount; i++) {
    const line = document.createElement('div');
    line.className = 'warp-line';
    
    // Posición horizontal aleatoria
    line.style.left = `${Math.random() * 100}%`;
    
    // Delay escalonado
    line.style.animationDelay = `${Math.random() * 0.2}s`;
    
    // Variación de color
    const colors = ['var(--accent-secondary)', 'var(--accent-primary)', 'var(--accent-tertiary)', 'white'];
    line.style.background = `linear-gradient(to bottom, transparent, ${colors[Math.floor(Math.random() * colors.length)]}, transparent)`;
    
    container.appendChild(line);
  }
  
  // Ocultar después de la animación
  setTimeout(() => {
    container.classList.remove('active');
  }, 500);
}

// ============================================
// FILTROS DEL PORTFOLIO
// ============================================

function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.portfolio-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      // Actualizar botón activo
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filtrar cards
      cards.forEach(card => {
        const category = card.dataset.category;
        const shouldShow = filter === 'all' || category === filter;
        
        if (shouldShow) {
          card.classList.remove('hidden');
          card.style.animation = 'slideUp 0.4s ease forwards';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// ============================================
// CARRUSELES DE PORTFOLIO
// ============================================

function initCarousels() {
  const carousels = document.querySelectorAll('.carousel');
  
  carousels.forEach(carousel => {
    const slides = carousel.querySelector('.carousel-slides');
    const slideElements = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.dot');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    
    if (slideElements.length <= 1) {
      // Ocultar controles si solo hay una slide
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dots.length) carousel.querySelector('.carousel-dots').style.display = 'none';
      return;
    }
    
    let currentIndex = 0;
    
    function goToSlide(index) {
      if (index < 0) index = slideElements.length - 1;
      if (index >= slideElements.length) index = 0;
      
      currentIndex = index;
      slides.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // Actualizar dots
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }
    
    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => goToSlide(i));
    });
    
    // Auto-advance opcional
    // setInterval(() => goToSlide(currentIndex + 1), 5000);
  });
}

// ============================================
// CONTROLES DEL JUEGO
// ============================================

// Función para inicializar el juego (activar y desactivar automáticamente)
function initializeGame() {
  // Activar el juego
  game.toggle();
  document.body.classList.add('game-mode');
  
  // Esperar un momento y luego desactivarlo
  setTimeout(() => {
    game.toggle();
    document.body.classList.remove('game-mode');
    
    // Asegurar que el botón de inicio esté visible
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.classList.remove('hidden');
    }
  }, 100);
}

function initGameControls() {
  const startBtn = document.getElementById('start-game-btn');
  
  // Función para actualizar visibilidad del botón de inicio
  function updateStartButtonVisibility() {
    if (startBtn) {
      if (game.isEnabled) {
        // Ocultar cuando el juego está activo
        startBtn.classList.add('hidden');
      } else {
        // Mostrar cuando el juego está desactivado
        startBtn.classList.remove('hidden');
      }
    }
  }
  
  // Botón de inicio del juego (abajo en el medio)
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const mainScene = game.game?.scene?.getScene('MainScene');
      
      if (!game.isEnabled) {
        // Activar el juego primero
        game.toggle();
        document.body.classList.add('game-mode');
        updateStartButtonVisibility();
      }
      
      // Esperar un momento para que el juego se inicialice y luego iniciarlo
      setTimeout(() => {
        const scene = game.game?.scene?.getScene('MainScene');
        if (scene) {
          // Asegurar que la escena esté activa
          if (scene.scene.isPaused()) {
            scene.scene.resume();
          }
          
          // Si el juego no está en IDLE, reiniciarlo primero
          if (scene.gameState !== 'IDLE') {
            scene.restartGame();
          } else {
            // Iniciar el juego directamente
            scene.startGame();
          }
        }
      }, 200);
    });
  }
  
  // Inicializar visibilidad del botón
  updateStartButtonVisibility();
}

// ============================================
// UTILIDADES
// ============================================

// Detectar móvil
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
}

// Aviso para móvil
function showMobileWarning() {
  const warning = document.createElement('div');
  warning.className = 'mobile-warning';
  warning.innerHTML = `
    <div class="warning-content">
      <p>📱 Para la mejor experiencia con el minijuego, te recomendamos usar un dispositivo con mouse.</p>
      <button class="warning-close">Entendido</button>
    </div>
  `;
  
  warning.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: rgba(12, 12, 20, 0.95);
    border: 1px solid var(--accent-primary, #6366f1);
    border-radius: 12px;
    padding: 20px;
    z-index: 1000;
    text-align: center;
    font-family: var(--font-mono);
    color: var(--text-primary, #f8fafc);
    backdrop-filter: blur(10px);
  `;
  
  document.body.appendChild(warning);
  
  const closeBtn = warning.querySelector('.warning-close');
  closeBtn.style.cssText = `
    margin-top: 15px;
    padding: 10px 24px;
    background: var(--accent-primary, #6366f1);
    border: none;
    color: white;
    font-family: var(--font-mono);
    cursor: pointer;
    border-radius: 20px;
    font-size: 14px;
  `;
  
  closeBtn.addEventListener('click', () => {
    warning.remove();
  });
}

// ============================================
// FOOTER DE MEJORAS
// ============================================

function initUpgradeFooter() {
  const footer = document.getElementById('upgrade-footer');
  if (!footer) return;
  
  // Event listeners para botones de mejora
  const upgradeBtns = footer.querySelectorAll('.upgrade-btn');
  upgradeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const upgradeKey = btn.dataset.upgrade;
      if (!upgradeKey) return;
      
      // Comprar mejora a través del juego
      if (game.game && game.game.scene) {
        const mainScene = game.game.scene.getScene('MainScene');
        if (mainScene) {
          const success = mainScene.purchaseUpgrade(upgradeKey);
          if (success) {
            // Efecto visual de compra
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
              btn.style.transform = '';
            }, 150);
          }
        }
      }
    });
  });
  
  // Botón para continuar
  const proceedBtn = document.getElementById('proceed-next-section');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      if (game.game && game.game.scene) {
        const mainScene = game.game.scene.getScene('MainScene');
        if (mainScene) {
          mainScene.proceedToNextSection();
        }
      }
    });
  }
}

// ============================================
// SISTEMA DE RECOMPENSAS POR CONQUISTA
// ============================================

const CONQUEST_STORAGE_KEY = 'portfolio_conquests';

function initConquestRewards() {
  // Cargar conquistas guardadas
  const conquests = loadConquests();
  
  // Aplicar recompensas visuales
  applyConquestRewards(conquests);
  
  // Actualizar indicador de progreso
  updateConquestProgress(conquests);
  
  // Crear estrellas de fondo si hay conquistas
  if (Object.values(conquests).some(v => v)) {
    createConquestStars();
  }
}

function loadConquests() {
  try {
    const saved = localStorage.getItem(CONQUEST_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error cargando conquistas:', e);
  }
  
  return {
    about: false,
    experience: false,
    portfolio: false
  };
}

function saveConquests(conquests) {
  try {
    localStorage.setItem(CONQUEST_STORAGE_KEY, JSON.stringify(conquests));
  } catch (e) {
    console.warn('Error guardando conquistas:', e);
  }
}

function conquestSection(sectionId) {
  const conquests = loadConquests();
  conquests[sectionId] = true;
  saveConquests(conquests);
  applyConquestRewards(conquests);
  updateConquestProgress(conquests);
  
  // Si es la primera conquista, crear las estrellas
  if (Object.values(conquests).filter(v => v).length === 1) {
    createConquestStars();
  }
  
  // Mostrar notificación de conquista
  showConquestNotification(sectionId);
  
  console.log(`🏆 Sección "${sectionId}" conquistada!`);
}

function updateConquestProgress(conquests) {
  const progressContainer = document.getElementById('conquest-progress');
  if (!progressContainer) return;
  
  const completed = Object.values(conquests).filter(v => v).length;
  const total = Object.keys(conquests).length;
  
  // Mostrar el indicador si hay progreso
  if (completed > 0 || document.querySelector('.game-active')) {
    progressContainer.classList.add('visible');
  }
  
  // Actualizar contador
  const countEl = document.getElementById('conquest-count');
  if (countEl) {
    countEl.textContent = `${completed}/${total}`;
  }
  
  // Actualizar barra de progreso
  const fillEl = document.getElementById('conquest-fill');
  if (fillEl) {
    fillEl.style.width = `${(completed / total) * 100}%`;
  }
  
  // Actualizar estado de cada sección
  Object.keys(conquests).forEach(section => {
    const sectionEl = progressContainer.querySelector(`[data-section="${section}"]`);
    if (sectionEl) {
      if (conquests[section]) {
        sectionEl.classList.add('completed');
        sectionEl.querySelector('.conquest-status').textContent = '⭐';
      } else {
        sectionEl.classList.remove('completed');
        sectionEl.querySelector('.conquest-status').textContent = '⭕';
      }
    }
  });
}

function showConquestNotification(sectionId) {
  const names = {
    about: 'Sobre Mí',
    experience: 'Experiencia',
    portfolio: 'Portfolio'
  };
  
  showToast(`🏆 ¡${names[sectionId]} conquistado!`, 'success', 4000);
}

function applyConquestRewards(conquests) {
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Aplicar badges a las secciones conquistadas
  navLinks.forEach(link => {
    const pageId = link.dataset.page;
    if (conquests[pageId]) {
      link.classList.add('conquered');
    }
  });
  
  // Mostrar navecitas flotantes
  if (conquests.about) {
    const ship1 = document.getElementById('floating-ship-1');
    if (ship1) ship1.classList.add('visible');
  }
  
  if (conquests.experience) {
    const ship2 = document.getElementById('floating-ship-2');
    if (ship2) ship2.classList.add('visible');
  }
  
  // Badge de Space Commander si completó todo
  const allConquered = conquests.about && conquests.experience && conquests.portfolio;
  if (allConquered) {
    const commanderBadge = document.getElementById('space-commander-badge');
    if (commanderBadge) commanderBadge.classList.add('visible');
    
    // Mostrar estrellas
    const starsContainer = document.getElementById('conquest-stars');
    if (starsContainer) starsContainer.classList.add('visible');
  }
}

function createConquestStars() {
  const container = document.getElementById('conquest-stars');
  if (!container || container.children.length > 0) return;
  
  // Crear 50 estrellas aleatorias
  for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'conquest-star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    star.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(star);
  }
  
  container.classList.add('visible');
}

// ============================================
// PÁGINA DE PROGRESO - DASHBOARD
// ============================================

const GLOBAL_STATS_KEY = 'portfolio_global_stats';
const ACHIEVEMENTS_KEY = 'portfolio_achievements';
const LEADERBOARD_KEY = 'portfolio_leaderboard';

// Sistema de rangos
const RANKS = [
  { name: 'Cadete', icon: '🎖️', minScore: 0, maxScore: 1000 },
  { name: 'Teniente', icon: '🎗️', minScore: 1000, maxScore: 5000 },
  { name: 'Capitán', icon: '⭐', minScore: 5000, maxScore: 15000 },
  { name: 'Comandante', icon: '🌟', minScore: 15000, maxScore: 50000 },
  { name: 'Almirante', icon: '💫', minScore: 50000, maxScore: Infinity }
];

function initProgressPage() {
  // Cargar y renderizar estadísticas cuando se carga la página
  renderProgressPage();
  
  // También actualizar cuando se navega a la página de progreso
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (link.dataset.page === 'progress') {
        setTimeout(renderProgressPage, 100);
      }
    });
  });
}

function renderProgressPage() {
  const stats = loadGlobalStats();
  const achievements = loadAchievements();
  const leaderboard = loadLeaderboard();
  const conquests = loadConquests();
  
  // Renderizar cada sección
  renderRankCard(stats);
  renderAchievements(achievements);
  renderCombatStats(stats);
  renderArsenalStats(stats);
  renderRecords(stats);
  renderLeaderboard(leaderboard);
  renderConquestsCard(conquests);
}

function loadGlobalStats() {
  try {
    const saved = localStorage.getItem(GLOBAL_STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error cargando estadísticas globales:', e);
  }
  return getDefaultGlobalStats();
}

function getDefaultGlobalStats() {
  return {
    totalGamesPlayed: 0,
    totalScore: 0,
    totalCrystals: 0,
    totalEnemiesKilled: 0,
    totalEnemiesByType: {
      SCOUT: 0,
      DRIFTER: 0,
      TANK: 0,
      SHOOTER: 0,
      SWARM: 0
    },
    totalBulletsFired: 0,
    totalBulletsHit: 0,
    totalMissilesFired: 0,
    totalMissilesHit: 0,
    totalPlayTime: 0,
    totalSpawnersDestroyed: 0,
    bossesDefeated: 0,
    gamesCompleted: 0,
    highestScore: 0,
    highestCombo: 0,
    mostCrystalsInGame: 0,
    fastestCompletion: null,
    longestGame: 0,
    totalUpgradesPurchased: 0
  };
}

function loadAchievements() {
  try {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error cargando logros:', e);
  }
  return {
    firstBlood: false,
    combo5: false,
    combo10: false,
    combo20: false,
    crystalCollector: false,
    bossSlayer: false,
    perfectSection: false,
    speedRunner: false,
    upgradeMaster: false,
    survivor: false
  };
}

function loadLeaderboard() {
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error cargando leaderboard:', e);
  }
  return [];
}

function getRank(totalScore) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalScore >= RANKS[i].minScore) {
      return { 
        ...RANKS[i], 
        index: i,
        nextRank: RANKS[i + 1] || null
      };
    }
  }
  return { ...RANKS[0], index: 0, nextRank: RANKS[1] };
}

function renderRankCard(stats) {
  const rank = getRank(stats.totalScore);
  
  // Icono y nombre del rango
  const rankIcon = document.getElementById('rank-icon');
  const rankName = document.getElementById('rank-name');
  if (rankIcon) rankIcon.textContent = rank.icon;
  if (rankName) rankName.textContent = rank.name;
  
  // Barra de progreso
  const progressFill = document.getElementById('rank-progress-fill');
  const progressText = document.getElementById('rank-progress-text');
  const nextRankText = document.getElementById('rank-next');
  
  if (rank.nextRank) {
    const progress = ((stats.totalScore - rank.minScore) / (rank.maxScore - rank.minScore)) * 100;
    if (progressFill) progressFill.style.width = `${Math.min(progress, 100)}%`;
    if (progressText) progressText.textContent = `${stats.totalScore.toLocaleString()} / ${rank.maxScore.toLocaleString()} pts`;
    if (nextRankText) nextRankText.textContent = `Siguiente: ${rank.nextRank.name}`;
  } else {
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = `${stats.totalScore.toLocaleString()} pts - ¡RANGO MÁXIMO!`;
    if (nextRankText) nextRankText.textContent = '¡Has alcanzado el rango máximo!';
  }
  
  // Stats mini
  const totalGames = document.getElementById('total-games');
  const totalScore = document.getElementById('total-score');
  const totalTime = document.getElementById('total-time');
  
  if (totalGames) totalGames.textContent = stats.totalGamesPlayed.toLocaleString();
  if (totalScore) totalScore.textContent = stats.totalScore.toLocaleString();
  if (totalTime) totalTime.textContent = formatPlayTime(stats.totalPlayTime);
}

function renderAchievements(achievements) {
  const achievementsGrid = document.getElementById('achievements-grid');
  if (!achievementsGrid) return;
  
  const achievementItems = achievementsGrid.querySelectorAll('.achievement-item');
  let unlockedCount = 0;
  
  achievementItems.forEach(item => {
    const achievementId = item.dataset.achievement;
    if (achievements[achievementId]) {
      item.classList.remove('locked');
      item.classList.add('unlocked');
      unlockedCount++;
    } else {
      item.classList.add('locked');
      item.classList.remove('unlocked');
    }
  });
  
  // Actualizar contador
  const counter = document.getElementById('achievements-counter');
  if (counter) {
    counter.textContent = `${unlockedCount}/10`;
  }
}

function renderCombatStats(stats) {
  // Enemigos por tipo
  const types = ['scout', 'drifter', 'tank', 'shooter', 'swarm'];
  types.forEach(type => {
    const countEl = document.getElementById(`kills-${type}`);
    if (countEl) {
      const typeKey = type.toUpperCase();
      countEl.textContent = (stats.totalEnemiesByType[typeKey] || 0).toLocaleString();
    }
  });
  
  // Totales
  const totalEnemies = document.getElementById('total-enemies');
  const totalSpawners = document.getElementById('total-spawners');
  const totalBosses = document.getElementById('total-bosses');
  
  if (totalEnemies) totalEnemies.textContent = stats.totalEnemiesKilled.toLocaleString();
  if (totalSpawners) totalSpawners.textContent = stats.totalSpawnersDestroyed.toLocaleString();
  if (totalBosses) totalBosses.textContent = stats.bossesDefeated.toLocaleString();
}

function renderArsenalStats(stats) {
  // Accuracy de balas
  const bulletAccuracy = stats.totalBulletsFired > 0 
    ? Math.round((stats.totalBulletsHit / stats.totalBulletsFired) * 100) 
    : 0;
  
  const bulletAccuracyEl = document.getElementById('bullet-accuracy');
  const bulletAccuracyFill = document.getElementById('bullet-accuracy-fill');
  const bulletsHit = document.getElementById('bullets-hit');
  const bulletsFired = document.getElementById('bullets-fired');
  
  if (bulletAccuracyEl) bulletAccuracyEl.textContent = `${bulletAccuracy}%`;
  if (bulletAccuracyFill) bulletAccuracyFill.style.width = `${bulletAccuracy}%`;
  if (bulletsHit) bulletsHit.textContent = stats.totalBulletsHit.toLocaleString();
  if (bulletsFired) bulletsFired.textContent = stats.totalBulletsFired.toLocaleString();
  
  // Accuracy de misiles
  const missileAccuracy = stats.totalMissilesFired > 0 
    ? Math.round((stats.totalMissilesHit / stats.totalMissilesFired) * 100) 
    : 0;
  
  const missileAccuracyEl = document.getElementById('missile-accuracy');
  const missileAccuracyFill = document.getElementById('missile-accuracy-fill');
  const missilesHit = document.getElementById('missiles-hit');
  const missilesFired = document.getElementById('missiles-fired');
  
  if (missileAccuracyEl) missileAccuracyEl.textContent = `${missileAccuracy}%`;
  if (missileAccuracyFill) missileAccuracyFill.style.width = `${missileAccuracy}%`;
  if (missilesHit) missilesHit.textContent = stats.totalMissilesHit.toLocaleString();
  if (missilesFired) missilesFired.textContent = stats.totalMissilesFired.toLocaleString();
  
  // Mejoras compradas
  const totalUpgrades = document.getElementById('total-upgrades');
  if (totalUpgrades) totalUpgrades.textContent = stats.totalUpgradesPurchased.toLocaleString();
}

function renderRecords(stats) {
  const recordScore = document.getElementById('record-score');
  const recordCombo = document.getElementById('record-combo');
  const recordCrystals = document.getElementById('record-crystals');
  const recordLongest = document.getElementById('record-longest');
  const recordFastest = document.getElementById('record-fastest');
  const recordCompleted = document.getElementById('record-completed');
  
  if (recordScore) recordScore.textContent = stats.highestScore.toLocaleString();
  if (recordCombo) recordCombo.textContent = `x${stats.highestCombo}`;
  if (recordCrystals) recordCrystals.textContent = stats.mostCrystalsInGame.toLocaleString();
  if (recordLongest) recordLongest.textContent = formatTime(stats.longestGame);
  if (recordFastest) recordFastest.textContent = stats.fastestCompletion ? formatTime(stats.fastestCompletion) : '--:--';
  if (recordCompleted) recordCompleted.textContent = stats.gamesCompleted.toLocaleString();
}

function renderLeaderboard(leaderboard) {
  const leaderboardList = document.getElementById('leaderboard-list');
  if (!leaderboardList) return;
  
  // Ordenar por puntuación
  const sortedLeaderboard = [...leaderboard]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  if (sortedLeaderboard.length === 0) {
    leaderboardList.innerHTML = `
      <div class="leaderboard-empty">
        <span class="empty-icon">🎮</span>
        <span class="empty-text">Aún no hay partidas registradas</span>
        <span class="empty-hint">¡Juega para aparecer aquí!</span>
      </div>
    `;
    return;
  }
  
  leaderboardList.innerHTML = sortedLeaderboard.map((entry, index) => `
    <div class="leaderboard-entry ${index === 0 ? 'highlight' : ''}">
      <span class="leaderboard-position">#${index + 1}</span>
      <div class="leaderboard-info">
        <span class="leaderboard-score">⭐ ${entry.score.toLocaleString()}</span>
        <span class="leaderboard-date">${formatDate(entry.date)}</span>
      </div>
      <span class="leaderboard-combo">x${entry.maxCombo || 0}</span>
      <span class="leaderboard-time">${formatTime(entry.time || 0)}</span>
    </div>
  `).join('');
}

function renderConquestsCard(conquests) {
  const conquestItems = ['about', 'experience', 'portfolio'];
  let completedCount = 0;
  
  conquestItems.forEach(id => {
    const item = document.querySelector(`.conquest-item[data-conquest="${id}"]`);
    const statusText = document.getElementById(`conquest-${id}-status`);
    const check = document.getElementById(`conquest-${id}-check`);
    
    if (conquests[id]) {
      completedCount++;
      if (item) item.classList.add('completed');
      if (statusText) statusText.textContent = '¡Conquistado!';
      if (check) check.textContent = '⭐';
    } else {
      if (item) item.classList.remove('completed');
      if (statusText) statusText.textContent = 'No conquistado';
      if (check) check.textContent = '⭕';
    }
  });
  
  // Space Commander status
  const commanderStatus = document.getElementById('space-commander-status');
  if (commanderStatus) {
    if (completedCount === 3) {
      commanderStatus.classList.add('achieved');
      commanderStatus.querySelector('.commander-text').textContent = '¡Felicidades! Eres un';
    } else {
      commanderStatus.classList.remove('achieved');
      commanderStatus.querySelector('.commander-text').textContent = `Conquista las 3 secciones para convertirte en`;
    }
  }
}

// Funciones auxiliares de formato
function formatTime(ms) {
  if (!ms || ms === 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatPlayTime(ms) {
  if (!ms || ms === 0) return '0h 0m';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDate(dateString) {
  if (!dateString) return 'Sin fecha';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (e) {
    return 'Sin fecha';
  }
}

// Exponer función para actualizar la página de progreso externamente
window.updateProgressPage = renderProgressPage;

// ============================================
// SISTEMA DE NOTIFICACIONES TOAST
// ============================================

let toastContainer = null;

function initToastSystem() {
  // Crear contenedor de toasts
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toastContainer);
}

function showToast(message, type = 'info', duration = 4000) {
  if (!toastContainer) initToastSystem();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icono según tipo
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    game: '🎮'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Cerrar notificación">×</button>
  `;
  
  // Agregar al contenedor
  toastContainer.appendChild(toast);
  
  // Animación de entrada
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });
  
  // Botón de cerrar
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto-cerrar
  const timeoutId = setTimeout(() => {
    removeToast(toast);
  }, duration);
  
  // Cancelar timeout si se cierra manualmente
  toast.dataset.timeoutId = timeoutId;
  
  return toast;
}

function removeToast(toast) {
  if (toast.dataset.timeoutId) {
    clearTimeout(parseInt(toast.dataset.timeoutId));
  }
  
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Exponer globalmente para uso desde el juego
window.showToast = showToast;

// ============================================
// NAVEGACIÓN POR TECLADO
// ============================================

function initKeyboardNavigation() {
  // Atajo para búsqueda rápida (Ctrl+K / Cmd+K)
  document.addEventListener('keydown', (e) => {
    // Solo si no está en modo juego
    if (document.body.classList.contains('game-mode')) return;
    
    // Ctrl+K o Cmd+K para buscar
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showQuickNav();
      return;
    }
    
    // Navegación con números 1-4
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const navKeys = {
        '1': 'about',
        '2': 'experience',
        '3': 'portfolio',
        '4': 'contact'
      };
      
      if (navKeys[e.key]) {
        const link = document.querySelector(`.nav-link[data-page="${navKeys[e.key]}"]`);
        if (link) {
          e.preventDefault();
          link.click();
          showToast(`Navegando a ${link.textContent.trim()}`, 'info', 2000);
        }
      }
    }
  });
  
  // Focus trap en modales
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Cerrar cualquier modal o overlay abierto
      const modals = document.querySelectorAll('.modal-overlay.active, .quick-nav.active');
      modals.forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

function showQuickNav() {
  // Verificar si ya existe
  let quickNav = document.getElementById('quick-nav');
  
  if (!quickNav) {
    quickNav = document.createElement('div');
    quickNav.id = 'quick-nav';
    quickNav.className = 'quick-nav';
    quickNav.innerHTML = `
      <div class="quick-nav-overlay"></div>
      <div class="quick-nav-content">
        <div class="quick-nav-header">
          <input type="text" class="quick-nav-input" placeholder="Buscar página..." autofocus>
          <span class="quick-nav-hint">ESC para cerrar</span>
        </div>
        <ul class="quick-nav-results">
          <li data-page="about"><span class="quick-nav-key">1</span> Sobre Mí</li>
          <li data-page="experience"><span class="quick-nav-key">2</span> Experiencia</li>
          <li data-page="portfolio"><span class="quick-nav-key">3</span> Portfolio</li>
          <li data-page="contact"><span class="quick-nav-key">4</span> Contacto</li>
        </ul>
      </div>
    `;
    document.body.appendChild(quickNav);
    
    // Event listeners
    const overlay = quickNav.querySelector('.quick-nav-overlay');
    const input = quickNav.querySelector('.quick-nav-input');
    const results = quickNav.querySelectorAll('.quick-nav-results li');
    
    overlay.addEventListener('click', () => hideQuickNav());
    
    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      results.forEach(result => {
        const text = result.textContent.toLowerCase();
        result.style.display = text.includes(query) ? 'flex' : 'none';
      });
    });
    
    results.forEach(result => {
      result.addEventListener('click', () => {
        const page = result.dataset.page;
        const link = document.querySelector(`.nav-link[data-page="${page}"]`);
        if (link) link.click();
        hideQuickNav();
      });
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const visibleResult = [...results].find(r => r.style.display !== 'none');
        if (visibleResult) {
          visibleResult.click();
        }
      }
    });
  }
  
  quickNav.classList.add('active');
  const input = quickNav.querySelector('.quick-nav-input');
  input.value = '';
  input.focus();
}

function hideQuickNav() {
  const quickNav = document.getElementById('quick-nav');
  if (quickNav) {
    quickNav.classList.remove('active');
  }
}

// ============================================
// FORMULARIO DE CONTACTO
// ============================================

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const statusEl = document.getElementById('form-status');
  
  // Validación básica
  const name = form.querySelector('#contact-name').value.trim();
  const email = form.querySelector('#contact-email').value.trim();
  const subject = form.querySelector('#contact-subject').value;
  const message = form.querySelector('#contact-message').value.trim();
  
  if (!name || !email || !subject || !message) {
    showFormStatus('error', 'Por favor, completa todos los campos requeridos.');
    return;
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFormStatus('error', 'Por favor, ingresa un email válido.');
    return;
  }
  
  // Deshabilitar botón y mostrar loading
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  statusEl.className = 'form-status';
  statusEl.style.display = 'none';
  
  try {
    // Obtener la URL del formulario (Formspree o similar)
    const formAction = form.action;
    
    // Si es un placeholder, simular envío exitoso
    if (formAction.includes('YOUR_FORM_ID')) {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mostrar mensaje de éxito con instrucciones
      showFormStatus('success', '✅ ¡Formulario configurado! Para activarlo, reemplaza "YOUR_FORM_ID" en el HTML con tu ID de Formspree.');
      console.log('📧 Datos del formulario:', { name, email, subject, message });
    } else {
      // Enviar formulario real
      const formData = new FormData(form);
      
      const response = await fetch(formAction, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        showFormStatus('success', '✅ ¡Mensaje enviado! Te responderé lo antes posible.');
        form.reset();
      } else {
        throw new Error('Error en el servidor');
      }
    }
  } catch (error) {
    console.error('Error enviando formulario:', error);
    showFormStatus('error', '❌ Hubo un error al enviar el mensaje. Por favor, intenta de nuevo o contáctame directamente por email.');
  } finally {
    // Restaurar botón
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

function showFormStatus(type, message) {
  const statusEl = document.getElementById('form-status');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `form-status ${type}`;
  statusEl.style.display = 'block';
  
  // Scroll al mensaje si no es visible
  statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Auto-ocultar mensaje de éxito después de 10 segundos
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 10000);
  }
}

// ============================================
// SCROLL REVEAL (Intersection Observer)
// ============================================

function initScrollReveal() {
  // Verificar soporte de IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    // Fallback: mostrar todo inmediatamente
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }
  
  // Configurar el observer
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px 0px -50px 0px', // Trigger un poco antes de entrar
    threshold: 0.1 // 10% visible
  };
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Dejar de observar una vez revelado
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Guardar referencia global del observer
  window.revealObserver = revealObserver;
  
  // Agregar clase reveal a elementos existentes para activar animaciones
  addRevealClasses();
  
  // Observar elementos con clase reveal que están en la página activa
  observeActivePageElements();
}

function observeActivePageElements() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  
  // Revelar elementos visibles en viewport
  const revealVisibleElements = () => {
    const revealElements = activePage.querySelectorAll('.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .reveal-scale:not(.revealed)');
    
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Si el elemento está en el viewport o cerca
      if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
        el.classList.add('revealed');
      }
    });
  };
  
  // Revelar inmediatamente y después de un delay
  revealVisibleElements();
  requestAnimationFrame(revealVisibleElements);
  setTimeout(revealVisibleElements, 150);
  setTimeout(revealVisibleElements, 400);
}

// Scroll listener para revelar elementos
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    observeActivePageElements();
  }, 50);
}, { passive: true });

function addRevealClasses() {
  // Agregar clases reveal a elementos que queremos animar
  
  // Timeline items
  document.querySelectorAll('.timeline-item').forEach((item, index) => {
    item.classList.add('reveal');
    item.style.transitionDelay = `${index * 0.1}s`;
  });
  
  // Skill groups
  document.querySelectorAll('.skill-group').forEach((group, index) => {
    group.classList.add('reveal-scale');
    group.style.transitionDelay = `${index * 0.1}s`;
  });
  
  // Portfolio cards (ya tienen animaciones, pero agregamos reveal también)
  document.querySelectorAll('.portfolio-card').forEach((card, index) => {
    card.classList.add('reveal');
    card.style.transitionDelay = `${index * 0.05}s`;
  });
  
  // Stats
  document.querySelectorAll('.stat').forEach((stat, index) => {
    stat.classList.add('reveal-scale');
    stat.style.transitionDelay = `${index * 0.1}s`;
  });
  
  // Section titles
  document.querySelectorAll('.section-title, .page-header').forEach(el => {
    el.classList.add('reveal');
  });
  
  // Contact cards
  document.querySelectorAll('.contact-card').forEach((card, index) => {
    card.classList.add('reveal-left');
    card.style.transitionDelay = `${index * 0.1}s`;
  });
  
  // Contact form
  document.querySelectorAll('.contact-form-container').forEach(el => {
    el.classList.add('reveal-right');
  });
}

// ============================================
// VISIBILITY HANDLER (Pausa automática)
// ============================================

function initVisibilityHandler() {
  // Manejar cambio de visibilidad de la pestaña
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // También manejar cuando la ventana pierde foco
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
}

function handleVisibilityChange() {
  if (document.hidden) {
    // La pestaña está oculta - pausar el juego
    pauseGameIfPlaying();
  }
  // No reanudar automáticamente al volver - el usuario debe hacerlo manualmente
}

function handleWindowBlur() {
  // La ventana perdió el foco
  // Solo pausar si el juego está activo y jugando
  pauseGameIfPlaying();
}

function handleWindowFocus() {
  // La ventana recuperó el foco
  // No hacer nada automáticamente - el jugador reanuda con ESC
}

function pauseGameIfPlaying() {
  if (!game.game || !game.game.scene) return;
  
  const mainScene = game.game.scene.getScene('MainScene');
  if (mainScene && mainScene.gameState === 'PLAYING') {
    mainScene.pauseGame();
    console.log('⏸️ Juego pausado automáticamente');
  }
}

// ============================================
// PREFERENCIAS DE USUARIO
// ============================================

// Detectar preferencia de movimiento reducido
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Escuchar cambios en la preferencia
if (window.matchMedia) {
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) {
      console.log('🎯 Preferencia de movimiento reducido activada');
      // CSS ya maneja esto con @media query
    }
  });
}

// ============================================
// EXPORTS GLOBALES
// ============================================

// Exponer función para que el juego pueda marcar secciones como conquistadas
window.conquestSection = conquestSection;

// Exponer función para inicializar el juego (activar/desactivar automáticamente)
window.initializeGame = initializeGame;

// ============================================
// FUNCIÓN PARA RESETEAR PROGRESO
// ============================================

function resetAllProgress() {
  try {
    // Limpiar conquistas
    localStorage.removeItem('portfolio_conquests');
    
    // Limpiar onboarding
    localStorage.removeItem('portfolio_onboarding_seen');
    sessionStorage.removeItem('portfolio_onboarding_seen_session');
    
    // Limpiar tutorial
    localStorage.removeItem('portfolio_tutorial_completed');
    
    // Limpiar leaderboard
    localStorage.removeItem('portfolio_leaderboard');
    
    // Limpiar logros
    localStorage.removeItem('portfolio_achievements');
    
    // Limpiar estadísticas globales
    localStorage.removeItem('portfolio_global_stats');
    
    // Limpiar preferencias de audio
    localStorage.removeItem('portfolio_audio_prefs');
    
    // Remover clases visuales de conquistas
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('conquered');
    });
    
    // Ocultar naves flotantes
    const ship1 = document.getElementById('floating-ship-1');
    const ship2 = document.getElementById('floating-ship-2');
    if (ship1) ship1.classList.remove('visible');
    if (ship2) ship2.classList.remove('visible');
    
    // Ocultar badge de Space Commander
    const commanderBadge = document.getElementById('space-commander-badge');
    if (commanderBadge) commanderBadge.classList.remove('visible');
    
    // Ocultar estrellas de conquista
    const starsContainer = document.getElementById('conquest-stars');
    if (starsContainer) {
      starsContainer.classList.remove('visible');
      starsContainer.innerHTML = '';
    }
    
    // Resetear indicador de progreso
    const progressContainer = document.getElementById('conquest-progress');
    if (progressContainer) {
      progressContainer.classList.remove('visible');
      const countEl = document.getElementById('conquest-count');
      const fillEl = document.getElementById('conquest-fill');
      if (countEl) countEl.textContent = '0/3';
      if (fillEl) fillEl.style.width = '0%';
      
      // Resetear estados de secciones
      progressContainer.querySelectorAll('.conquest-section').forEach(section => {
        section.classList.remove('completed');
        const status = section.querySelector('.conquest-status');
        if (status) status.textContent = '⭕';
      });
    }
    
    console.log('✅ Todo el progreso ha sido restablecido');
    console.log('🔄 Recarga la página para ver los cambios');
    
    return true;
  } catch (e) {
    console.error('❌ Error al restablecer progreso:', e);
    return false;
  }
}

// Exponer función para resetear progreso
window.resetAllProgress = resetAllProgress;

// ============================================
// BOTÓN DE RESETEAR PROGRESO
// ============================================

function initResetProgressButton() {
  const resetBtn = document.getElementById('reset-progress-btn');
  if (!resetBtn) return;
  
  resetBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres restablecer TODO el progreso?\n\nEsto eliminará:\n- Todas las conquistas\n- El tutorial completado\n- El leaderboard\n- Los logros\n- Las estadísticas globales\n- El rango de comandante\n- El estado del onboarding')) {
      const success = resetAllProgress();
      if (success) {
        // Recargar la página después de 500ms
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  });
}

// Exportar game para debugging
window.game = game;

// Exponer utilidades
window.prefersReducedMotion = prefersReducedMotion;
