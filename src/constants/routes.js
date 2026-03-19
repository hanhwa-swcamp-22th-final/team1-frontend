/**
 * ROUTE_NAMES — 라우트 name 상수
 *
 * 오타 방지를 위해 router.push({ name: ROUTE_NAMES.LOGIN }) 형식으로만 사용.
 * 문자열 직접 사용 금지: router.push('/login') ❌
 *
 * 네이밍 규칙:
 *   - Auth 계열     : 소문자 kebab  (예: 'login', 'set-password')
 *   - Seller        : 'seller-{기능}' (예: 'seller-dashboard')
 *   - Master Admin  : 'master-{기능}' (예: 'master-dashboard')
 *   - WH Manager    : 'whm-{기능}'   (예: 'whm-dashboard')   ← 접두어 주의
 *   - WH Worker     : 'whw-{기능}'   (예: 'whw-task-list')   ← 접두어 주의
 *   - System Admin  : 'sys-{기능}'   (예: 'sys-company-list')
 *
 * 각 상수값은 router/routes/ 파일의 { name } 필드와 반드시 일치해야 합니다.
 * 새 라우트 추가 시 이 파일에 먼저 상수를 추가하고, 라우트 파일에서 참조하세요.
 */
export const ROUTE_NAMES = {
  // ── Auth — 레이아웃 없이 단독 페이지
  LOGIN: 'login',
  SET_PASSWORD: 'set-password',
  CHANGE_PASSWORD: 'change-password',

  // ── Common — 오류 페이지
  NOT_FOUND: 'not-found',
  FORBIDDEN: 'forbidden',

  // ── Seller — 셀러 셀프서비스 (views/seller/)
  SELLER_DASHBOARD: 'seller-dashboard',
  SELLER_PRODUCT_LIST: 'seller-product-list',
  SELLER_PRODUCT_REGISTER: 'seller-product-register',
  SELLER_ASN_LIST: 'seller-asn-list',
  SELLER_ASN_CREATE: 'seller-asn-create',
  SELLER_ASN_DETAIL: 'seller-asn-detail',
  SELLER_INVENTORY: 'seller-inventory',
  SELLER_ORDER_LIST: 'seller-order-list',
  SELLER_ORDER_DETAIL: 'seller-order-detail',
  SELLER_ORDER_REGISTER: 'seller-order-register',
  SELLER_AMAZON_CONNECT: 'seller-amazon-connect',
  SELLER_MARGIN_SIMULATOR: 'seller-margin-simulator',
  SELLER_NOTIFICATIONS: 'seller-notifications',

  // ── Master Admin — 창고사 관리 (views/masterAdmin/)
  MASTER_DASHBOARD: 'master-dashboard',
  MASTER_WAREHOUSE_LIST: 'master-warehouse-list',
  MASTER_WAREHOUSE_REGISTER: 'master-warehouse-register',
  MASTER_WAREHOUSE_DETAIL: 'master-warehouse-detail',
  MASTER_ASN_LIST: 'master-asn-list',
  MASTER_ORDER_LIST: 'master-order-list',
  MASTER_FEE_SETTING: 'master-fee-setting',
  MASTER_FEE_SETTINGS: 'master-fee-settings',
  MASTER_SELLER_COMPANY_LIST: 'master-seller-company-list',
  MASTER_SELLER_COMPANY_REGISTER: 'master-seller-company-register',
  MASTER_ACCOUNT_LIST: 'master-account-list',
  MASTER_ACCOUNT_INVITE: 'master-account-invite',
  MASTER_RBAC_SETTING: 'master-rbac-setting',

  // ── WH Manager — 창고 운영 (views/whManager/)
  // 접두어: 'whm-' (WH Manager 약자)
  WH_MANAGER_DASHBOARD: 'whm-dashboard',
  WH_MANAGER_ASN_LIST: 'whm-asn-list',
  WH_MANAGER_ASN_DETAIL: 'whm-asn-detail',
  WH_MANAGER_INSPECTION: 'whm-inspection',
  WH_MANAGER_LOCATION: 'whm-location',
  WH_MANAGER_INVENTORY: 'whm-inventory',
  WH_MANAGER_ORDER_LIST: 'whm-order-list',
  WH_MANAGER_ORDER_DETAIL: 'whm-order-detail',
  WH_MANAGER_OUTBOUND: 'whm-outbound',
  WH_MANAGER_OUTBOUND_DISPATCH: 'whm-outbound-dispatch',
  WH_MANAGER_PICKING_LIST: 'whm-picking-list',
  WH_MANAGER_LABEL_PRINT: 'whm-label-print',
  WH_MANAGER_OUTBOUND_CONFIRM: 'whm-outbound-confirm',
  WH_MANAGER_WORKER_ACCOUNT: 'whm-worker-account',
  WH_MANAGER_WORKER_TASK: 'whm-worker-task',
  WH_MANAGER_BIN_ASSIGN: 'whm-bin-assign',

  // ── WH Worker — 태블릿 작업 화면 (views/whWorker/)
  // 접두어: 'whw-' (WH Worker 약자)
  // ⚠️  이 라우트들은 태블릿 터치 UI 기준으로 개발할 것
  // WH_WORKER_TASK_LIST: 'whw-task-list',
  // WH_WORKER_INSPECTION: 'whw-inspection',
  // WH_WORKER_PICKING: 'whw-picking',
  // WH_WORKER_PACKING: 'whw-packing',
  // WH_WORKER_DASHBOARD: 'whw-dashboard',
  WH_WORKER_DASHBOARD: 'whw-dashboard',
  WH_WORKER_TASKS: 'whw-tasks',
  WH_WORKER_INBOUND: 'whw-inbound',
  WH_WORKER_OUTBOUND: 'whw-outbound',
  WH_WORKER_INVENTORY: 'whw-inventory',

  // ── System Admin — 플랫폼 최상위 관리 (views/systemAdmin/)
  // 접두어: 'sys-'
  SYS_COMPANY_LIST: 'sys-company-list',
  SYS_COMPANY_REGISTER: 'sys-company-register',
  SYS_COMPANY_DETAIL: 'sys-company-detail',
  SYS_FEE_SETTING: 'sys-fee-setting',
  SYS_USER_ACCOUNT_LIST: 'sys-user-account-list',
}
