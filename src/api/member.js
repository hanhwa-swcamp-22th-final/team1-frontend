import instance from './instance.js'

/**
 * 로그인
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function login(payload) {
  return instance.post('/member/auth/login', payload, { _skipAuthRefresh: true })
}

/**
 * 앱 부팅/토큰 만료 시 refresh cookie로 access token 재발급
 * @returns {Promise<AxiosResponse>}
 */
export async function refreshSession() {
  return instance.post('/member/auth/refresh', null, { _skipAuthRefresh: true })
}

/**
 * 서버 세션 종료(refresh cookie 삭제)
 * @returns {Promise<AxiosResponse>}
 */
export async function logoutSession() {
  return instance.post('/member/auth/logout')
}

/**
 * 임시 비밀번호 사용자 비밀번호 변경
 * @param {{ newPassword: string }} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function changePassword(payload) {
  return instance.post('/member/auth/change-password', payload, { _skipAuthRefresh: true })
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

// ── 시스템 관리자 (System Admin) ──────────────────────────────────────

/**
 * 시스템 관리자용 업체 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: Company[] }
 */
export async function getCompanies(params = {}) {
  return instance.get('/member/admin/companies', { params })
}

/**
 * 시스템 관리자용 업체 단건 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: Company }
 */
export async function getCompany(id) {
  return instance.get(`/member/admin/companies/${id}`)
}

/**
 * 시스템 관리자용 업체 등록
 * @returns {Promise<AxiosResponse>} { success: true, data: Company }
 */
export async function createCompany(payload) {
  return instance.post('/member/admin/companies', payload)
}

/**
 * 시스템 관리자용 업체 수정
 * @returns {Promise<AxiosResponse>} { success: true, data: Company }
 */
export async function updateCompany(id, payload) {
  return instance.patch(`/member/admin/companies/${id}`, payload)
}

/**
 * 시스템 관리자용 사용자 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: User[] }
 */
export async function getUsers(params = {}) {
  return instance.get('/member/admin/users', { params })
}

/**
 * 시스템 관리자용 사용자 생성
 * @returns {Promise<AxiosResponse>} { success: true, data: User }
 */
export async function createUser(payload) {
  return instance.post('/member/admin/users', payload)
}

/**
 * 시스템 관리자용 사용자 수정
 * @returns {Promise<AxiosResponse>} { success: true, data: User }
 */
export async function updateUser(id, payload) {
  return instance.patch(`/member/admin/users/${id}`, payload)
}

/**
 * 시스템 관리자용 업체 로그 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: CompanyLog[] }
 */
export async function getCompanyLogs(params = {}) {
  return instance.get('/member/admin/company-logs', { params })
}

/**
 * 시스템 관리자용 업체 로그 생성
 * @returns {Promise<AxiosResponse>} { success: true, data: CompanyLog }
 */
export async function createCompanyLog(payload) {
  return instance.post('/member/admin/company-logs', payload)
}

/**
 * 시스템 관리자용 수수료 프로필 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: FeeProfile[] }
 */
export async function getFeeProfiles(params = {}) {
  return instance.get('/member/admin/fee-profiles', { params })
}

/**
 * 시스템 관리자용 수수료 프로필 수정
 * @returns {Promise<AxiosResponse>} { success: true, data: FeeProfile }
 */
export async function updateFeeProfile(id, payload) {
  return instance.patch(`/member/admin/fee-profiles/${id}`, payload)
}
