(() => {
  const ROUTES = new Set(window.__AGHWAR_ROUTES__ || []);

  function normalize(target) {
    if (!target) return null;
    try {
      const url = new URL(target, window.location.href);
      if (url.origin !== window.location.origin) return null;
      let path = url.pathname.replace(/\/+/g, '/');
      if (path.endsWith('/index.html')) path = path.slice(0, -10) || '/';
      if (!path.endsWith('/') && path !== '/') path += '/';
      return path;
    } catch (_) {
      return null;
    }
  }

  function go(target) {
    const path = normalize(target);
    if (!path) return false;
    const known = ROUTES.has(path) || path === '/' || path === '/index.html';
    if (!known) return false;
    window.location.assign(path);
    return true;
  }

  window.AghwarApp = window.AghwarApp || {};
  window.AghwarApp.navigate = go;
  window.AghwarApp.routes = ROUTES;

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      if (href && go(href)) event.preventDefault();
      return;
    }

    const routeElement = event.target.closest && event.target.closest('[data-route], [data-href]');
    if (routeElement) {
      const target = routeElement.getAttribute('data-route') || routeElement.getAttribute('data-href');
      if (go(target)) event.preventDefault();
    }
  }, true);
})();
