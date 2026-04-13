/**
 * pinia.js — 앱 공용 Pinia 인스턴스
 *
 * 분리 이유:
 *   - main.js, api/instance.js, stores/* 가 같은 Pinia 인스턴스를 공유해야 함
 *   - 인증 인터셉터에서 useAuthStore(pinia) 형태로 스토어에 접근하기 위함
 *
 * pinia-plugin-persistedstate 유지 이유:
 *   - auth store는 더 이상 persist를 사용하지 않음
 *   - 다른 store(예: warehouse)는 계속 persist를 사용할 수 있으므로 플러그인은 유지
 */
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

export default pinia
