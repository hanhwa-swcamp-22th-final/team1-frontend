# Decisions

## 2026-03-18 Seller UI 우선 구현

### Decision
- 남은 Seller 화면은 당분간 `UI + 로컬 mock 데이터` 범위까지만 구현한다.

### Context
- Seller Dashboard, 주문 등록, ASN 등록, ASN 목록은 이미 화면 중심으로 진행되었다.
- 실제 API 계약과 저장 흐름은 화면마다 아직 확정되지 않았다.
- Pigma export HTML이 준비되어 있어, UI 정합성을 먼저 맞추는 편이 작업 분리가 쉽다.

### Alternatives Considered
- `UI + mock-server 저장`을 각 화면마다 동시에 붙이는 방식
- 실제 API 스펙이 정해질 때까지 새 화면 구현을 미루는 방식

### Why
- UI를 먼저 맞추면 Seller 화면 전체 흐름을 빠르게 검토할 수 있다.
- 저장/API를 뒤로 미루면 화면 구조 변경과 서버 계약 변경을 분리해서 다룰 수 있다.
- Pigma 기준 화면을 순서대로 맞추는 데 집중하기 쉬워진다.

## 2026-03-21 Seller mock-server 도메인 route 정렬

### Decision
- Seller mock API는 전용 `seller.cjs` 대신 기존 도메인 route인 `orders.cjs`, `wms.cjs`에 합친다.

### Context
- Seller 주문 목록, ASN 목록, 재고 목록을 `mock-server/data/seller.json` 기반으로 이관했다.
- 초기 구현에서는 Seller 전용 route 파일을 따로 만들어 `/seller/*` 경로를 노출했다.
- 하지만 기존 masterAdmin, whManager는 역할별 route가 아니라 도메인별 route 구조를 사용하고 있다.

### Alternatives Considered
- `seller.cjs`를 유지하고 Seller 전용 엔드포인트를 계속 분리하는 방식
- json-server 리소스 키를 프론트에서 직접 호출하는 방식

### Why
- 기존 프로젝트 구조와 가장 일관된 방식은 도메인별 route 파일 유지다.
- 주문은 `/orders/*`, ASN/재고는 `/wms/*` 아래에 두는 편이 API 책임이 명확하다.
- mock 단계에서 경로 설계를 맞춰두면 이후 실제 백엔드 전환 시 수정 범위를 줄일 수 있다.

## 2026-03-21 Seller 상품 mock API 도메인 분리

### Decision
- Seller 상품 목록 mock API는 `products.cjs`와 `src/api/product.js`를 새로 추가해 분리한다.

### Context
- Seller 주문 목록은 `orders.cjs`, ASN/재고 목록은 `wms.cjs`로 이관했다.
- 상품 목록은 기존 도메인 route 중 어느 쪽에도 자연스럽게 속하지 않았다.
- 현재 프로젝트에는 상품 조회용 mock route나 API 파일이 존재하지 않았다.

### Alternatives Considered
- 상품 목록을 `orders.cjs`에 함께 넣는 방식
- 상품 목록을 `wms.cjs`에 함께 넣는 방식
- json-server 리소스 키인 `/seller_products`를 프론트에서 직접 호출하는 방식

### Why
- 상품 목록은 주문이나 창고 도메인보다 상품 도메인으로 분리하는 편이 책임이 명확하다.
- 별도 `products` 도메인을 두면 이후 상품 상세, 저장, 수정 API 확장 시 경로 일관성을 유지하기 쉽다.
- mock 단계에서 도메인을 분리해두면 실제 백엔드 전환 시 프론트 수정 범위를 줄일 수 있다.

## 2026-03-21 Seller 연동 mock API 분리

### Decision
- Seller 주문 연동 및 조회 화면 mock API는 `integrations.cjs`와 `src/api/integration.js`로 분리한다.

### Context
- Seller 채널 연결 카드와 통합 주문 목록은 기존에 `channelOrders.utils.js` 로컬 상수를 직접 읽고 있었다.
- 기존 프로젝트에는 연동 도메인 API 파일로 `src/api/integration.js`가 이미 있었지만 구현은 비어 있었다.
- 주문/재고/상품과 달리 채널 연동 데이터는 별도 외부 연동 도메인으로 보는 편이 자연스럽다.

### Alternatives Considered
- 채널 연동 데이터를 `orders.cjs`에 함께 넣는 방식
- 채널 연동 데이터를 `products.cjs`나 `wms.cjs`에 넣는 방식
- json-server 리소스 키를 프론트에서 직접 호출하는 방식

### Why
- 채널 연결 상태와 외부 채널 주문은 주문 자체보다 연동 도메인 성격이 더 강하다.
- 기존 빈 `integration.js`를 실제 도메인 진입점으로 쓰면 파일 책임이 명확해진다.
- mock 단계에서 `integrations/*` 경로를 정리해두면 이후 실제 연동 API 전환 시 프론트 수정 범위를 줄일 수 있다.

## 2026-03-21 Seller 알림 mock API 분리

### Decision
- Seller 알림 목록 mock API는 `notifications.cjs`와 `src/api/notification.js`로 분리한다.

### Context
- Seller 알림 화면은 기존에 `notifications.utils.js` 로컬 상수를 직접 읽고 있었다.
- 기존 프로젝트에는 `src/api/notification.js` 파일이 있었지만 구현은 비어 있었다.
- 알림은 주문, 재고, 상품과 직접 묶기보다 별도 알림 도메인으로 나누는 편이 자연스럽다.

### Alternatives Considered
- 알림 데이터를 `orders.cjs`나 `wms.cjs`에 함께 넣는 방식
- json-server 리소스 키를 프론트에서 직접 호출하는 방식

### Why
- 알림은 조회/읽음 처리라는 별도 UI 흐름을 가지므로 도메인 분리가 명확하다.
- 기존 빈 `notification.js`를 실제 API 진입점으로 사용하면 책임이 명확해진다.
- mock 단계에서 `notifications/*` 경로를 정리해두면 이후 실제 알림 API 전환 시 프론트 수정 범위를 줄일 수 있다.

## 2026-03-22 Seller 대시보드 기존 API 조합 사용

### Decision
- Seller 대시보드는 별도 mock route를 추가하지 않고, 이미 이관한 주문/ASN/재고/채널 API를 병렬 조회해 화면 데이터를 계산한다.

### Context
- Seller 주문 목록, ASN 목록, 재고 목록, 채널 연동/조회는 이미 `seller.json` 기반 API로 이관되었다.
- 대시보드는 기존에 여러 로컬 util 상수를 직접 조합해 KPI, 추이, 최근 활동, 입고 목록을 계산하고 있었다.
- 대시보드 전용 mock route를 새로 만들면 동일 데이터가 `seller.json` 안에서 다시 중복될 가능성이 컸다.

### Alternatives Considered
- `seller_dashboard` 리소스를 `seller.json`에 추가하고 전용 API로 조회하는 방식
- 대시보드 전용 route 파일과 API 파일을 새로 만들어 서버에서 집계하는 방식

### Why
- 이미 이관된 Seller 도메인 API를 그대로 재사용하면 데이터 중복 없이 mock-server 일원화 목표를 충족할 수 있다.
- 대시보드 계산 로직은 프론트 유틸에 남기고, raw data source만 API로 바꾸는 편이 변경 범위가 가장 작다.
- 이후 실제 백엔드 연동 시에도 화면은 기존 도메인 API 또는 집계 API 중 하나로 쉽게 전환할 수 있다.

## 2026-03-22 Seller util 디렉토리 분리

### Decision
- Seller 전용 util 파일은 `src/utils` 루트에서 `src/utils/seller` 디렉토리로 이동한다.

### Context
- `src/utils` 루트에는 공통 util인 `format`, `validate`, `excel`, `storage`와 함께 Seller 화면 전용 util이 섞여 있었다.
- Seller mock 이관 이후에도 주문/ASN/재고/상품/대시보드/모달용 util은 Seller 화면과 컴포넌트에서만 소비되고 있었다.
- 루트 `utils`에 역할 전용 파일이 쌓이면서 공통 util과 화면 전용 helper의 경계가 흐려졌다.

### Alternatives Considered
- Seller util을 계속 `src/utils` 루트에 두는 방식
- Seller util을 `src/views/seller` 아래로 더 세분화해서 분산 배치하는 방식

### Why
- 공통 util과 Seller 전용 helper를 디렉토리 수준에서 구분하면 파일 책임이 더 명확해진다.
- 현재 import consumer 범위가 Seller 화면과 Seller 컴포넌트에 집중돼 있어 `src/utils/seller`로 모으는 비용이 가장 작다.
- 이후 raw mock 제거와 util 세분화 작업을 같은 범위 안에서 계속 진행하기 쉬워진다.

## 2026-03-22 Seller mockData 진입점 통일

### Decision
- Seller util의 raw row 상수는 각 util 파일에 중복 정의하지 않고 `src/utils/seller/mockData.utils.js`를 통해 `mock-server/data/seller.json`에서 공통으로 가져온다.

### Context
- 주문/ASN/재고/상품/채널/알림 화면은 이미 `seller.json` 기반 mock API 조회로 이관되었다.
- 하지만 util 파일 안에는 동일한 row 상수가 계속 남아 있어 대시보드, 쇼케이스, 테스트가 별도 데이터 소스를 유지하고 있었다.
- 이 상태를 두면 `seller.json`과 util 상수가 서로 다른 값으로 분기될 가능성이 있었다.

### Alternatives Considered
- 각 util 파일 안에 raw row 상수를 계속 유지하는 방식
- `seller.json`에만 의존하도록 모든 테스트와 consumer에서 직접 JSON을 import하는 방식

### Why
- `mockData.utils.js`를 두면 util export 이름은 유지하면서도 원본은 `seller.json` 하나로 통일할 수 있다.
- 기존 consumer import를 거의 건드리지 않고 중복 raw mock을 제거할 수 있다.
- 이후 fallback 정리나 실제 API 전환 시에도 Seller util 레이어 변경 범위를 최소화할 수 있다.

## 2026-03-22 Seller 상품 등록 mock 저장 연결

### Decision
- Seller 상품 등록은 `POST /products/seller/register` mock API를 통해 `seller_products` 리소스에 저장한다.

### Context
- 상품 등록 화면은 기존에 로컬 검증과 성공 메시지까지만 구현돼 있었고 실제 저장은 연결되지 않은 상태였다.
- 상품 목록은 이미 `GET /products/seller/list`를 통해 `seller_products` 리소스를 조회하고 있었다.
- 상품 등록 후 목록과 같은 원본 데이터를 바라보게 하려면 상품 등록도 같은 리소스에 써야 했다.

### Alternatives Considered
- 상품 등록 성공 메시지만 보여주고 저장은 연결하지 않는 방식
- 상품 등록 전용 별도 리소스를 만들고 목록에서 다시 조합하는 방식

### Why
- 등록과 목록이 같은 `seller_products`를 공유하면 mock 단계에서도 흐름이 가장 자연스럽다.
- 상품 등록 route에서 중복 SKU를 검증하면 화면에서 별도 목록 조회 없이도 기본 저장 오류를 처리할 수 있다.
- 이후 실제 API 전환 시에도 상품 등록과 목록이 같은 도메인 파일 `product.js` 아래에 있어 구조가 단순하다.

## 2026-03-22 Seller ASN 등록 mock 저장 연결

### Decision
- Seller ASN 등록은 `POST /wms/seller/asns` mock API를 통해 `seller_asns` 리소스에 저장한다.

### Context
- ASN 등록 화면은 기존에 로컬 검증과 성공 메시지까지만 구현돼 있었고 실제 저장은 연결되지 않은 상태였다.
- ASN 목록은 이미 `GET /wms/seller/asns`를 통해 `seller_asns` 리소스를 조회하고 있었다.
- ASN 등록 후 목록과 같은 원본 데이터를 바라보게 하려면 ASN 등록도 같은 리소스에 써야 했다.

### Alternatives Considered
- ASN 등록 성공 메시지만 보여주고 저장은 연결하지 않는 방식
- ASN 등록 전용 별도 리소스를 만들고 목록에서 다시 조합하는 방식

### Why
- 등록과 목록이 같은 `seller_asns`를 공유하면 mock 단계에서도 흐름이 가장 자연스럽다.
- ASN 등록 route에서 중복 ASN 번호를 검증하면 화면에서 별도 조회 없이도 기본 저장 오류를 처리할 수 있다.
- 이후 실제 API 전환 시에도 ASN 등록과 목록이 같은 도메인 파일 `wms.js` 아래에 있어 구조가 단순하다.

## 2026-03-22 Seller 상품 수정 화면 재사용

### Decision
- Seller 상품 수정은 별도 화면을 만들지 않고 기존 상품 등록 화면을 `productId` query 기반 수정 모드로 재사용한다.

### Context
- 상품 목록에는 `수정` 버튼이 있었지만 실제 진입/저장 흐름은 아직 연결되지 않은 상태였다.
- 상품 등록 화면은 이미 입력 섹션, 검증, mock 저장까지 완성되어 있어 구조를 새로 만들 필요가 없었다.
- mock-server 상품 데이터는 `seller_products` 하나로 관리되고 있어 등록과 수정이 같은 도메인에서 동작하는 편이 자연스러웠다.

### Alternatives Considered
- 상품 수정 전용 화면을 새로 만드는 방식
- 상품 목록 내 모달 편집으로 처리하는 방식

### Why
- 등록 화면을 재사용하면 레이아웃과 검증 로직을 중복 없이 그대로 활용할 수 있다.
- 목록은 `수정 진입`, 등록 화면은 `신규/수정 모드`만 구분하면 되어 변경 범위가 가장 작다.
- mock 단계에서도 `GET /products/seller/:id`, `PUT /products/seller/:id` 구조를 먼저 맞춰두면 이후 실제 API 전환이 단순해진다.

## 2026-04-13 Seller 주문 단건 조회 계약 우선 적용

### Decision
- Seller 주문 단건 조회 화면은 백엔드의 `GET /orders/seller/{orderId}` 응답 계약을 기준으로 연결하고, 목록 응답 차이는 프론트 정규화로 흡수한다.

### Context
- 백엔드 단건 조회는 이미 `orderId`, `orderChannel`, `receiverName`, `phone`, `street1`, `street2`, `state`, `zip`, `country`, `canCancel`, `items` 구조로 구현되어 있다.
- 프론트 Seller 주문 상세 모달은 과거 mock 기준 필드인 `receiverPhone`, `addressLine`, `shippingMethod`, `carrier`, `unitPrice`, `amount`를 기대하고 있었다.
- 이번 작업 범위는 Seller 단건 조회 항목이며, 목록/취소/등록 계약 전체를 한 번에 바꾸는 것은 범위를 넘는다.

### Alternatives Considered
- 백엔드 단건 조회 응답을 프론트 mock 필드 구조에 맞게 변경하는 방식
- 셀러 주문 목록 응답까지 동시에 `orderId` 기준으로 전면 개편하는 방식

### Why
- 이미 구현된 백엔드 단건 조회 계약을 유지하면 변경 범위를 Seller 상세 조회 연결에 집중할 수 있다.
- 프론트 정규화 레이어를 두면 목록 응답과 상세 응답의 차이를 화면 컴포넌트 밖에서 정리할 수 있다.
- 이후 셀러 주문 목록 항목을 별도로 진행할 때도 영향 범위를 명확히 나눌 수 있다.

## 2026-04-13 Seller 주문 목록 조회 BE 계약 우선 적용

### Decision
- Seller 주문 목록 화면은 백엔드의 `GET /orders/seller/list` 계약을 그대로 따르고, 프론트에서는 `status`, `page`, `size`만 전송한다.

### Context
- 백엔드 Seller 주문 목록 조회는 `status`, `startDate`, `endDate`, `page`, `size`를 지원하고 응답은 `data.orders`, `totalCount`, `page`, `size` 구조로 내려온다.
- 프론트 Seller 주문 목록 화면은 과거 mock 기준으로 `channel`, `search`를 함께 전송하고, 응답도 배열, `orders`, `items`를 모두 허용하고 있었다.
- 이번 작업 범위는 Seller 주문 목록 FE/BE 계약 정렬이며, 백엔드 검색 조건 확장은 포함하지 않는다.

### Alternatives Considered
- 백엔드에 `channel`, `search`를 추가 지원하는 방식
- 프론트에서 `channel`, `search`를 유지한 채 로컬 필터만 적용하는 방식

### Why
- 현재 백엔드 구현을 기준으로 프론트를 맞추는 편이 변경 범위가 가장 작고 검증이 단순하다.
- `data.orders`만 해석하도록 고정하면 응답 계약이 명확해지고 예외 처리 분기도 줄어든다.
- `channel`, `search`는 백엔드 지원이 준비된 뒤 다시 붙이는 편이 API 의미와 UI 동작이 일치한다.

## 2026-04-14 주문 상태 raw/display 분리

### Decision
- 주문 상태는 백엔드 raw status를 그대로 유지하고, 프론트에서는 `display status`로 매핑해 창고관리자와 총괄관리자 화면에 표시한다.

### Context
- 백엔드 주문 상태는 `RECEIVED`, `ALLOCATED`, `OUTBOUND_INSTRUCTED`, `PICKING`, `PACKING`, `OUTBOUND_PENDING`, `OUTBOUND_COMPLETED`, `CANCELED`로 세분화되어 있다.
- 프론트의 주문 배지와 목록 탭은 `PENDING`, `CONFIRMED`, `PREPARING_ITEM`, `SHIPPED`, `CANCELLED` 다섯 단계만 전제로 작성되어 있다.
- 화면 요구사항은 다섯 단계 표시를 유지하되, 백엔드 내부 상태는 더 자세한 단계로 운영하는 것이다.

### Alternatives Considered
- 백엔드 응답 상태를 프론트의 다섯 단계 값으로 직접 축약해서 내려주는 방식
- 프론트 화면을 백엔드 raw status 단계 수에 맞게 모두 재설계하는 방식

### Why
- raw status를 유지하면 도메인 상태 전이와 API 의미를 손상시키지 않는다.
- 프론트에서 display status를 따로 두면 기존 UI 문구, 배지 색상, 탭 구조를 유지할 수 있다.
- 공통 매핑 유틸을 두면 목록, 배지, 상세 타임라인이 같은 기준으로 동작한다.
