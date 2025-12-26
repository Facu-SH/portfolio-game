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
      
      // Mostrar el body con fade in
      body.style.opacity = '1';
      body.style.transition = 'opacity 0.4s ease';
      body.style.overflow = '';
      
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
  
  // Detectar si es móvil
  if (isMobile()) {
    showMobileWarning();
  }
  
  // Ocultar pantalla de carga cuando todo esté listo
  hideLoadingScreen();
});

// ============================================
// NAVEGACIÓN ENTRE PÁGINAS
// ============================================

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const ctaButtons = document.querySelectorAll('.btn[data-page]');
  const pages = document.querySelectorAll('.page');
  
  function navigateTo(pageId) {
    // Actualizar links activos
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });
    
    // Mostrar/ocultar páginas con animación
    pages.forEach(page => {
      const isTarget = page.id === `page-${pageId}`;
      
      if (isTarget && !page.classList.contains('active')) {
        page.classList.add('active');
        // Scroll al inicio de la página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (!isTarget) {
        page.classList.remove('active');
      }
    });
    
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
  
  // Si es la primera conquista, crear las estrellas
  if (Object.values(conquests).filter(v => v).length === 1) {
    createConquestStars();
  }
  
  console.log(`🏆 Sección "${sectionId}" conquistada!`);
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

// Exponer función para que el juego pueda marcar secciones como conquistadas
window.conquestSection = conquestSection;

// Exponer función para inicializar el juego (activar/desactivar automáticamente)
window.initializeGame = initializeGame;

// Exportar game para debugging
window.game = game;
