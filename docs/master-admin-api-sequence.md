# Master Admin API Sequence

현재 브랜치 기준 총괄관리자(`MASTER_ADMIN`) 페이지에서 사용하는 API 호출 흐름이다.

## Dashboard

```mermaid
sequenceDiagram
    actor U as User
    participant P as Dashboard.vue
    participant API as Backend API

    U->>P: /master/dashboard 진입
    P->>API: GET /orders/outbound/stats
    P->>API: GET /wms/asn/stats
    P->>API: GET /wms/inventory/stats
    P->>API: GET /members/sellers/stats
    P->>API: GET /wms/warehouses/status
    API-->>P: 요약 통계 + 창고 상태
    P-->>U: 대시보드 렌더
```

## Warehouse List

```mermaid
sequenceDiagram
    actor U as User
    participant P as WarehouseList.vue
    participant API as Backend API

    U->>P: /master/warehouses 진입
    P->>API: GET /wms/warehouses/summary
    P->>API: GET /wms/warehouses
    API-->>P: KPI 요약 + 창고 목록
    P-->>U: 카드/리스트 렌더
```

## Warehouse Register

```mermaid
sequenceDiagram
    actor U as User
    participant P as WarehouseRegister.vue
    participant API as Backend API

    U->>P: 폼 입력
    U->>P: 창고 등록 완료 클릭
    P->>API: POST /wms/warehouses
    Note right of P: { name, sqft, address, city, state,\nopenTime, closeTime, timezone,\nmanagerName?, managerEmail? }
    API-->>P: 등록 결과
    P-->>U: 목록 페이지로 이동
```

## Warehouse Detail

```mermaid
sequenceDiagram
    actor U as User
    participant P as WarehouseDetail.vue
    participant API as Backend API

    U->>P: /master/warehouses/detail/:id 진입
    P->>API: GET /wms/warehouses
    P->>API: GET /wms/warehouses/:id/inventory
    P->>API: GET /wms/warehouses/:id/outbound
    P->>API: GET /wms/warehouses/:id/orders
    P->>API: GET /wms/warehouses/:id/locations
    API-->>P: 상세 화면용 데이터
    P-->>U: KPI/재고/출고/주문/로케이션 렌더
```

## ASN List

```mermaid
sequenceDiagram
    actor U as User
    participant P as AsnList.vue
    participant API as Backend API

    U->>P: /master/asn 진입
    P->>API: GET /wms/asns
    P->>API: GET /wms/asns/kpi
    API-->>P: ASN 목록 + KPI
    P-->>U: 테이블 렌더
    U->>P: 검색/필터/탭 변경
    P-->>U: 클라이언트 필터링 결과 렌더
```

## Order List

```mermaid
sequenceDiagram
    actor U as User
    participant P as OrderList.vue
    participant API as Backend API

    U->>P: /master/orders 진입
    P->>API: GET /orders/list
    API-->>P: 주문 목록
    P-->>U: 테이블 렌더
    U->>P: 검색/필터/탭 변경
    P-->>U: 클라이언트 필터링 결과 렌더
```

## Fee View

```mermaid
sequenceDiagram
    actor U as User
    participant P as FeeView.vue
    participant API as Backend API

    U->>P: /master/fee 진입
    P->>API: GET /wms/fee-settings
    API-->>P: FeeSettings
    P-->>U: 현재 요금 렌더
```

## Fee Settings

```mermaid
sequenceDiagram
    actor U as User
    participant P as FeeSettings.vue
    participant API as Backend API

    U->>P: /master/fee/settings 진입
    P->>API: GET /wms/fee-settings
    API-->>P: FeeSettings
    P-->>U: 수정 폼 렌더
    U->>P: 저장 클릭
    P->>API: PUT /wms/fee-settings
    Note right of P: FeeSettings 전체 객체
    API-->>P: { success, message }
    P-->>U: 저장 완료 토스트
```

## Seller List

```mermaid
sequenceDiagram
    actor U as User
    participant P as SellerList.vue
    participant API as Backend API

    U->>P: /master/sellers 진입
    P->>API: GET /members/sellers
    API-->>P: Seller[]
    P-->>U: 목록 렌더
    U->>P: 검색/탭 변경
    P-->>U: 클라이언트 필터링 결과 렌더
```

## Seller Register

```mermaid
sequenceDiagram
    actor U as User
    participant P as SellerRegister.vue
    participant API as Backend API

    U->>P: /master/sellers/register 진입
    P->>API: GET /wms/warehouses
    API-->>P: Warehouse[]
    P-->>U: 창고 선택 폼 렌더
    U->>P: 등록 클릭
    P->>API: POST /members/sellers
    Note right of P: { brandNameEn, brandNameKo,\ncontactName, contactEmail,\nwarehouseIds }
    API-->>P: 등록 결과
    P-->>U: 목록 페이지로 이동
```

## Account Invite

```mermaid
sequenceDiagram
    actor U as User
    participant P as AccountInvite.vue
    participant API as Backend API

    U->>P: /master/accounts/invite or /manager or /worker 진입
    P->>API: GET /members/sellers
    P->>API: GET /wms/warehouses
    API-->>P: 조직 선택용 목록
    P-->>U: role별 초대 폼 렌더
    U->>P: 초대 클릭
    P->>API: POST /auth/invite
    Note right of P: { role, organizationId, name, email }
    API-->>P: { success, message, data }
    P-->>U: 초대 결과 반영
```

## User List

```mermaid
sequenceDiagram
    actor U as User
    participant P as UserList.vue
    participant API as Backend API

    U->>P: /master/accounts 진입
    P->>API: GET /members/users
    API-->>P: User[]
    P-->>U: 목록 렌더

    alt 비밀번호 초기화
        U->>P: reset-password 클릭
        P->>API: POST /members/users/:id/reset-password
        API-->>P: { success, message }
        P->>API: GET /members/users
        API-->>P: 갱신된 목록
        P-->>U: 재렌더
    else 비활성화
        U->>P: deactivate 클릭
        P->>API: POST /members/users/:id/deactivate
        API-->>P: { success, message }
        P->>API: GET /members/users
        API-->>P: 갱신된 목록
        P-->>U: 재렌더
    else 재활성화
        U->>P: reactivate 클릭
        P->>API: POST /members/users/:id/reactivate
        API-->>P: { success, message }
        P->>API: GET /members/users
        API-->>P: 갱신된 목록
        P-->>U: 재렌더
    end
```

## RBAC Settings

```mermaid
sequenceDiagram
    actor U as User
    participant P as RbacSettings.vue

    U->>P: /master/rbac 진입
    P-->>U: 로컬 권한 매트릭스 렌더
    U->>P: 체크박스 변경
    P-->>U: 로컬 상태 반영
    U->>P: 저장 클릭
    P-->>U: 저장 토스트 표시
```
