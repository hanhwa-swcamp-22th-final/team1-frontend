import instance from './instance.js'

/**
 * 로그인
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function login(payload) {
  return instance.post('/auth/login', payload)
}
