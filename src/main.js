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
  
  // Inicializar navegación por teclado
  initKeyboardNavigation();
  
  // Registrar Service Worker
  registerServiceWorker();
  
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
        // Revelar elementos de la nueva página
        setTimeout(() => observeActivePageElements(), 50);
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

// Exportar game para debugging
window.game = game;

// Exponer utilidades
window.prefersReducedMotion = prefersReducedMotion;
