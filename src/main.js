import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import router from '@/router'
import App from './App.vue'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

createApp(App).use(pinia).use(router).mount('#app')
