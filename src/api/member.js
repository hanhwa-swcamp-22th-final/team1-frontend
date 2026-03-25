import instance from './instance.js'

/**
 * 로그인
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function login(payload) {
  return instance.post('/member/auth/login', payload)
}

/**
 * 대시보드용 활성 셀러 수 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getSellerStats() {
  return instance.get('/member/sellers/stats')
}

/**
 * 셀러 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: Seller[] }
 */
export async function getSellerList() {
  return instance.get('/member/sellers')
}

/**
 * 셀러 등록
 * @param {{ brandNameEn: string, brandNameKo: string, contactName: string, contactEmail: string, warehouseIds: number[] }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function registerSeller(payload) {
  return instance.post('/member/sellers', payload)
}

/**
 * 계정 초대 (이메일 발송)
 * @param {{ role: string, organizationId: number, name: string, email: string }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function inviteAccount(payload) {
  return instance.post('/member/auth/invite', payload)
}

/**
 * 소속 사용자 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: User[] }
 */
export async function getUserList() {
  return instance.get('/member/users')
}

/**
 * 사용자 비밀번호 초기화
 * @param {number} userId
 * @returns {Promise<AxiosResponse>}
 */
export async function resetUserPassword(userId) {
  return instance.post(`/member/users/${userId}/reset-password`)
}

/**
 * 사용자 비활성화
 * @param {number} userId
 * @returns {Promise<AxiosResponse>}
 */
export async function deactivateUser(userId) {
  return instance.post(`/member/users/${userId}/deactivate`)
}

/**
 * 사용자 재활성화
 * @param {number} userId
 * @returns {Promise<AxiosResponse>}
 */
export async function reactivateUser(userId) {
  return instance.post(`/member/users/${userId}/reactivate`)
}

/**
 * 셀러별 당월 매출 조회
 * @returns {Promise<AxiosResponse>} { success, data: Array<{ sellerCode, sellerName, monthRevenue, totalOrders, avgOrderValue }> }
 */
export function getSellerRevenue() {
  return instance.get('/member/sellers/revenue')
}

/**
 * 대시보드용 셀러별 3PL 비용 요약 조회
 * @returns {Promise<AxiosResponse>} { success, data: Array<{ sellerCode, sellerName, estimatedCost, momGrowth, turnoverRate }> }
 */
export function getSellerFeeSummary() {
  return instance.get('/member/sellers/fee-summary')
}

// ── 시스템 관리자 (System Admin) ──────────────────────────────────────

export async function getCompanies(params = {}) {
  return instance.get('/member/admin/companies', { params })
}

export async function getCompany(id) {
  return instance.get(`/member/admin/companies/${id}`)
}

export async function createCompany(payload) {
  return instance.post('/member/admin/companies', payload)
}

export async function updateCompany(id, payload) {
  return instance.patch(`/member/admin/companies/${id}`, payload)
}

export async function getUsers(params = {}) {
  return instance.get('/member/admin/users', { params })
}

export async function createUser(payload) {
  return instance.post('/member/admin/users', payload)
}

export async function updateUser(id, payload) {
  return instance.patch(`/member/admin/users/${id}`, payload)
}

export async function getCompanyLogs(params = {}) {
  return instance.get('/member/admin/company-logs', { params })
}

export async function createCompanyLog(payload) {
  return instance.post('/member/admin/company-logs', payload)
}

export async function getFeeProfiles(params = {}) {
  return instance.get('/member/admin/fee-profiles', { params })
}

export async function updateFeeProfile(id, payload) {
  return instance.patch(`/member/admin/fee-profiles/${id}`, payload)
}
