// mock-data/member.cjs — 회원/인증 관련 mock 데이터
// 사용처: routes/auth.cjs, routes/members.cjs

const MOCK_ACCOUNTS = {
  'sys.admin@conk.com':    { token: 'mock-token-sys',    user: { id: 1, email: 'sys.admin@conk.com',    name: '시스템 관리자', role: 'SYSTEM_ADMIN', status: 'ACTIVE', organization: 'CONK 본사'    } },
  'master.admin@conk.com': { token: 'mock-token-master', user: { id: 2, email: 'master.admin@conk.com', name: '총괄 관리자',   role: 'MASTER_ADMIN', status: 'ACTIVE', organization: 'GLS Mega Hub' } },
  'wh.manager@conk.com':   { token: 'mock-token-whm',    user: { id: 3, email: 'wh.manager@conk.com',   name: '창고 관리자',   role: 'WH_MANAGER',   status: 'ACTIVE', organization: 'GLS Mega Hub' } },
  'WORKER-001':             { token: 'mock-token-worker', user: { id: 4, email: null,                    name: '창고 작업자',   role: 'WH_WORKER',    status: 'ACTIVE', organization: 'GLS Mega Hub' } },
  'seller@conk.com':       { token: 'mock-token-seller', user: { id: 5, email: 'seller@conk.com',       name: '셀러 담당자',   role: 'SELLER',       status: 'ACTIVE', organization: 'BrandCo Korea'} },
}

const SELLERS_STATS = {
  activeSellerCount: 18,
  newThisMonth: 2,
  trendType: 'up',
}

module.exports = { MOCK_ACCOUNTS, SELLERS_STATS }
