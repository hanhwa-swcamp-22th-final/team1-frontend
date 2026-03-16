import instance from './instance.js'

/**
 * 로그인
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function login(payload) {
  return instance.post('/auth/login', payload)
}

/**
 * 대시보드용 활성 셀러 수 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getSellerStats() {
  return instance.get('/members/sellers/stats')
}
