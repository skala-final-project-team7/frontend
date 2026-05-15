import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { router } from './router';
import './styles/main.css';

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}

async function bootstrap() {
  await enableMocking();

  createApp(App).use(createPinia()).use(router).mount('#app');
}

void bootstrap();
