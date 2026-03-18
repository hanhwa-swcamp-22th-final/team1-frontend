/**
 * seller.js — SELLER Role 화면의 라우트 경로와 접근 권한을 정의한다.
 */
import { ROLES, ROUTE_NAMES } from '@/constants'

export default [
    // Seller 기본 진입 경로 → Dashboard로 리다이렉트
    {
        path: '/seller',
        redirect: { name: ROUTE_NAMES.SELLER_DASHBOARD },
    },

    // Seller Dashboard 메인 화면
    {
        path: '/seller/dashboard',
        name: ROUTE_NAMES.SELLER_DASHBOARD,
        component: () => import('@/views/seller/SellerDashboardView.vue'),
        meta: { role: ROLES.SELLER },
    },

    // Seller 주문 등록 화면
    {
        path: '/seller/orders/register',
        name: ROUTE_NAMES.SELLER_ORDER_REGISTER,
        component: () => import('@/views/seller/SellerOrderRegisterView.vue'),
        meta: { role: ROLES.SELLER },
    },
    // TODO(frontend): 주문 목록 라우트 추가
    // TODO(frontend): 주문 상세 라우트 추가

    // 상품 관리
    // TODO(frontend): 상품 등록 라우트 추가
    // TODO(frontend): 상품 목록 라우트 추가

    // 재고 관리
    // TODO(frontend): 재고 목록 라우트 추가

    // Seller ASN 등록 화면
    {
        path: '/seller/asn/create',
        name: ROUTE_NAMES.SELLER_ASN_CREATE,
        component: () => import('@/views/seller/SellerAsnCreateView.vue'),
        meta: { role: ROLES.SELLER },
    },
    // Seller ASN 목록 화면
    {
        path: '/seller/asn/list',
        name: ROUTE_NAMES.SELLER_ASN_LIST,
        component: () => import('@/views/seller/SellerAsnListView.vue'),
        meta: { role: ROLES.SELLER },
    },
    // TODO(frontend): ASN 상세 라우트 추가

    // 부가 기능
    // TODO(frontend): 마진 시뮬레이터 라우트 추가
    // TODO(frontend): 주문 연동 및 조회 라우트 추가
]
