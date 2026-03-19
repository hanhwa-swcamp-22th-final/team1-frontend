import instance from './instance'

export async function getCompanies(params = {}) {
  return instance.get('/sys_companies', { params })
}

export async function getCompany(id) {
  return instance.get(`/sys_companies/${id}`)
}

export async function createCompany(payload) {
  return instance.post('/sys_companies', payload)
}

export async function updateCompany(id, payload) {
  return instance.patch(`/sys_companies/${id}`, payload)
}

export async function getUsers(params = {}) {
  return instance.get('/sys_users', { params })
}

export async function createUser(payload) {
  return instance.post('/sys_users', payload)
}

export async function updateUser(id, payload) {
  return instance.patch(`/sys_users/${id}`, payload)
}

export async function getCompanyLogs(params = {}) {
  return instance.get('/sys_company_logs', { params })
}

export async function createCompanyLog(payload) {
  return instance.post('/sys_company_logs', payload)
}

export async function getFeeProfiles(params = {}) {
  return instance.get('/sys_fee_profiles', { params })
}

export async function updateFeeProfile(id, payload) {
  return instance.patch(`/sys_fee_profiles/${id}`, payload)
}
