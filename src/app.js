import { Router } from './router.js';
import { AppShell } from './components/appShell.js';
import { Theme } from './components/themeToggle.js';

Theme.init();

const root = document.getElementById('app');
Router.mount(root, AppShell);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // La aplicación sigue funcionando sin caché offline.
    });
  });
}
