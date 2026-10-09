/**
* Template Name: iPortfolio
* Template URL: https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/
* Updated: Jun 29 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Header toggle
   */
  const headerToggleBtn = document.querySelector('.header-toggle');

  function headerToggle() {
    document.querySelector('#header').classList.toggle('header-show');
    headerToggleBtn.classList.toggle('bi-list');
    headerToggleBtn.classList.toggle('bi-x');
  }
  headerToggleBtn.addEventListener('click', headerToggle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.header-show')) {
        headerToggle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Init typed.js
   */
  const selectTyped = document.querySelector('.typed');
  if (selectTyped) {
    let typed_strings = selectTyped.getAttribute('data-typed-items');
    typed_strings = typed_strings.split(',');
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Animate the skills items on reveal
   */
  let skillsAnimation = document.querySelectorAll('.skills-animation');
  skillsAnimation.forEach((item) => {
    new Waypoint({
      element: item,
      offset: '80%',
      handler: function(direction) {
        let progress = item.querySelectorAll('.progress .progress-bar');
        progress.forEach(el => {
          el.style.width = el.getAttribute('aria-valuenow') + '%';
        });
      }
    });
  });

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

  /**
   * Portfolio AI agent chat widget
   * Temporarily inactive because the corresponding HTML block in index.html is commented out.
   * Keep this logic for future re-enable to avoid re-implementing endpoint/session handling.
   */
  const chatForm = document.querySelector('#agent-chat-form');
  const chatInput = document.querySelector('#agent-chat-input');
  const chatTranscript = document.querySelector('#agent-chat-transcript');
  const chatStatus = document.querySelector('#agent-chat-status');
  const chatSendButton = document.querySelector('#agent-chat-send');
  const sessionStorageKey = 'cam_agent_session_id';

  function resolveAgentChatEndpoint() {
    if (typeof window.AGENT_CHAT_ENDPOINT === 'string' && window.AGENT_CHAT_ENDPOINT.trim()) {
      return window.AGENT_CHAT_ENDPOINT.trim();
    }
    const meta = document.querySelector('meta[name="cam-agent-chat-endpoint"]');
    if (meta) {
      const fromMeta = (meta.getAttribute('content') || '').trim();
      if (fromMeta) return fromMeta;
    }
    if (window.location.protocol === 'file:') {
      return 'http://localhost:8787/api/agent/chat';
    }
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8787/api/agent/chat';
    }
    return `${window.location.origin.replace(/\/$/, '')}/api/agent/chat`;
  }

  function getSessionId() {
    let value = sessionStorage.getItem(sessionStorageKey);
    if (!value) {
      value = `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(sessionStorageKey, value);
    }
    return value;
  }

  function appendMessage(role, content, toolsUsed) {
    const messageElement = document.createElement('div');
    messageElement.className = role === 'user' ? 'agent-msg agent-msg--user' : 'agent-msg agent-msg--assistant';
    messageElement.textContent = content;
    chatTranscript.appendChild(messageElement);

    if (Array.isArray(toolsUsed) && toolsUsed.length > 0) {
      const toolsElement = document.createElement('p');
      toolsElement.className = 'agent-tools-used';
      toolsElement.textContent = `Tools used: ${toolsUsed.join(', ')}`;
      chatTranscript.appendChild(toolsElement);
    }

    chatTranscript.scrollTop = chatTranscript.scrollHeight;
  }

  async function sendMessage(message) {
    const endpoint = resolveAgentChatEndpoint();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sessionId: getSessionId()
      })
    });
    const rawBody = await response.text();
    let payload = {};
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch (_error) {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        const hint404 =
          response.status === 404 && !isLocal
            ? ` No JSON from ${endpoint.split('?')[0]} — usually missing Amplify rewrite to your agent, or set Amplify build env PORTFOLIO_AGENT_CHAT_URL to your full chat HTTPS URL (see README).`
            : '';
        const hintLocal = isLocal
          ? ' For local dev, run agent-backend on port 8787 (npm run dev in agent-backend/).'
          : '';
        payload = {
          error: `Backend returned non-JSON response (HTTP ${response.status}).${hint404}${hintLocal}`
        };
      }
    }
    return { response, payload };
  }

  if (chatForm && chatInput && chatTranscript && chatStatus && chatSendButton) {
    chatForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      appendMessage('user', message);
      chatInput.value = '';
      chatStatus.textContent = 'Thinking...';
      chatSendButton.disabled = true;

      try {
        const { response, payload } = await sendMessage(message);

        if (!response.ok) {
          const parts = [payload.error || `Request failed (HTTP ${response.status}).`];
          if (payload.code) {
            parts.push(`Code: ${payload.code}.`);
          }
          if (payload.traceId) {
            parts.push(`Trace: ${payload.traceId}.`);
          }
          if (payload.detail) {
            parts.push(String(payload.detail));
          }
          throw new Error(parts.join(' '));
        }

        appendMessage('assistant', payload.answer, payload.toolsUsed);
        chatStatus.textContent = '';
      } catch (error) {
        let detail = error && error.message ? error.message : String(error);
        if (/Failed to fetch|NetworkError|Load failed|network error/i.test(detail)) {
          detail =
            'Could not reach the agent API (network or browser block). On the live site, use HTTPS same-origin /api/agent/chat with an Amplify rewrite to your backend, or set meta cam-agent-chat-endpoint / window.AGENT_CHAT_ENDPOINT to your API URL. See repo README.';
        }
        appendMessage('assistant', `Sorry, I hit an error: ${detail}`);
        chatStatus.textContent = 'Request failed. Please try again.';
      } finally {
        chatSendButton.disabled = false;
      }
    });
  }

})();