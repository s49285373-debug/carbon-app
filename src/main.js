import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 1. 引入剛剛寫好的 router
import './style.css'

const app = createApp(App)

app.use(router) // 2. 掛載 router

app.mount('#app')