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

/**
 * 셀러 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: Seller[] }
 */
export async function getSellerList() {
  return instance.get('/members/sellers')
}

/**
 * 셀러 등록
 * @param {{ brandNameEn: string, brandNameKo: string, contactName: string, contactEmail: string, warehouseIds: number[] }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function registerSeller(payload) {
  return instance.post('/members/sellers', payload)
}

/**
 * 계정 초대 (이메일 발송)
 * @param {{ role: string, organizationId: number, name: string, email: string }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function inviteAccount(payload) {
  return instance.post('/auth/invite', payload)
}

/**
 * 소속 사용자 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: User[] }
 */
export async function getUserList() {
  return instance.get('/members/users')
}

/**
 * 사용자 비밀번호 초기화
 * @param {number} userId
 * @returns {Promise<AxiosResponse>}
 */
export async function resetUserPassword(userId) {
  return instance.post(`/members/users/${userId}/reset-password`)
}

/**
 * 사용자 비활성화
 * @param {number} userId
 * @returns {Promise<AxiosResponse>}
 */
export async function deactivateUser(userId) {
  return instance.post(`/members/users/${userId}/deactivate`)
}

/**
 * 사용자 재활성화
 * @param {number} userId
 * @returns {Promise<AxiosResponse>}
 */
export async function reactivateUser(userId) {
  return instance.post(`/members/users/${userId}/reactivate`)
}
