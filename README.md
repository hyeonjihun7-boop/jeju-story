<div align="center">

# 🌿 탐험 제주

**날씨 보고 정하는 하루 — 옷차림부터 오름·올레, 축제, 로컬 브랜드, 이슈까지 한 화면에**

`React 19` · `Vite` · `React Router` · `Zustand` · `Bootstrap 5` · `Supabase` · `Vercel` · `Claude Sonnet 5.5`

[저장소](https://github.com/hyeonjihun7-boop/jeju-story) · 제주대 청년도약 부트캠프 1기 개별 과제

</div>

---

## ✨ 기획 의도

제주 여행의 하루는 **날씨가 반**입니다. 비 오는 날 오름에 올라가고, 바람 부는 날 해안도로에서 헤매고, 미세먼지가 짙은 날 야외 일정을 잡는 일이 반복됩니다.
**탐험 제주**는 오늘의 날씨·미세먼지·황사를 먼저 읽고, 그 결과로 *입을 옷*, *갈 곳(실내/실외)*, *먹고 살 것*, *알아야 할 이슈*를 한 번에 정리해 주는 하루 비서입니다.

> 비가 오면 **박물관·미술관**, 맑으면 **오름·올레**, 점심엔 **맛집·카페**, 저녁엔 **노을 산책** — 하루를 4칸으로 나눠 제안합니다.

## 🧭 주요 기능

| 칸 | 하는 일 | 사용하는 데이터 |
|---|---|---|
| ☀️ **오늘** | 현재 날씨, 시간대별 기온·강수 변화 그래프, 미세먼지·초미세먼지·황사 등급, **옷차림(얇은/적당/두꺼운 옷 · 겉옷 유무)**, 하루 4칸 실내·실외 플랜 | Open-Meteo 예보 · Open-Meteo 대기질 |
| 🧭 **탐험** | 날씨에 따라 자동 추천 — 맑음: **오름**(가까운 순, 고도·위키 설명), **올레길**, 비: **실내 명소**. 축제·행사 탭 | OpenStreetMap(Overpass) · 위키백과 · Open-Meteo 고도 · TourAPI |
| 🛍 **먹거리·쇼핑** | 제주 로컬 브랜드(우무·귤메달·제주바솔트·한라산과자점·모제이·한림수직 …), 소품샵, 주변 맛집·카페, 구매·예약·대기 링크 | 큐레이션 · OSM / 카카오 로컬 · 네이버 블로그 |
| 📰 **이슈** | 이슈제주 최신 기사 + 주제별 뉴스(4·3, 관광, 날씨, 축제) | 이슈제주 RSS · 네이버 뉴스 / Google 뉴스 RSS |
| ✨ **AI 비서** | 질문하면 Claude가 **스스로 도구를 골라** 호출하고 답변. 화면에 *호출한 도구 목록* 표시 | 위 모든 API를 도구(17개)로 사용 |
| 🔖 **북마크** | 마음에 든 곳을 담기, 닉네임별 저장, AI 대화 기록 | Supabase |

### 🌦 옷차림은 이렇게 정해요
체감온도 평균(9~20시)을 구간별로 나눠 *얇은 옷 / 적당한 옷 / 두꺼운 옷*을 고르고, 여기에 **일교차 ≥ 8°**, **풍속 ≥ 7m/s**, **강수**, **자외선 ≥ 6**, **미세먼지 나쁨·황사**를 얹어 겉옷·우산·바람막이·선크림·마스크를 덧붙입니다. (`server/outfit.js`)

## 🏗 아키텍처

```
┌──────────── 브라우저 (React) ────────────┐
│ router.jsx ─ AppLayout ─ pages/*          │
│ store/useAppStore.js  (Zustand: 공유 상태) │
│ api/client.js ─ fetch('/api/…')           │──┐
│ lib/supabase.js ─ 북마크·대화기록           │  │
└───────────────────────────────────────────┘  │
                                               ▼
┌──────── Vercel 서버 함수 api/*.js ─────────────┐     ┌───────────┐
│ today · explore · spot · festivals · shop      │     │ Supabase  │
│ food · news · station · agent                  │     │ favorites │
│   └─ server/*.js  (화면과 에이전트가 공용)       │     │ chat_logs │
│ 비밀 키(.env)는 여기에서만 사용                   │     └───────────┘
└───────┬───────────────────────────────────────┘
        ▼
 Open-Meteo · OSM(Overpass) · 위키백과 · 이슈제주 RSS · Google 뉴스 RSS
 TourAPI · 에어코리아 · 네이버 · 카카오  (키가 있으면)
```

- **store** — 여러 페이지가 함께 쓰는 값(지역, 오늘 데이터, 북마크, 대화)
- **router** — 이동 경로(`NAV_ITEMS`) 한 곳에서 관리
- **bootstrap** — 레이아웃·그리드·폼 + 숲녹색 테마(`styles/theme.css`), 데스크톱은 좌측 레일 / 모바일은 하단 탭바
- **server vs client** — 키가 필요하거나 CORS가 막힌 호출은 모두 서버 함수 경유

## 🤖 AI 에이전트

`api/agent.js`의 루프: **질문 → Claude가 도구 선택 → 서버가 API 실행 → 결과를 보고 다시 판단 → 최종 답변** (최대 6회).

| 분류 | 도구 |
|---|---|
| 날씨·옷차림 | `get_today_plan` `get_weather` `get_air_quality` `get_station_air` `find_place` |
| 자연·관광 | `find_oreum` `get_elevation` `get_wiki_summary` `find_olle_routes` `search_indoor_spots` `search_spots` `search_festivals` |
| 먹거리·쇼핑 | `search_local_brands` `search_restaurants` `search_blog_reviews` |
| 이슈 | `get_issue_jeju` `search_news` |

시스템 프롬프트는 *"날씨·장소는 추측하지 말고 도구로 확인, 비·미세먼지엔 실내 대안, 없는 정보는 지어내지 않기"* 를 요구합니다.

## 🔑 API 키 없이도 되는 것 / 키가 필요한 것

| | 키 | 없을 때 |
|---|---|---|
| 날씨·대기질·옷차림·하루 플랜 | 불필요 | — |
| 오름·고도·위키 | 불필요 | Overpass가 느리면 대표 오름으로 대체 |
| 이슈제주 · 뉴스 | 불필요 | 네이버 키가 있으면 네이버 뉴스로 전환 |
| 올레길 | 불필요 | 대표 코스 4개 + 제주올레 공식 사이트 링크 |
| **축제·행사 / 관광지 (TourAPI)** | `DATA_GO_KR_KEY` | 안내 메시지 표시 |
| 에어코리아 실측 | `DATA_GO_KR_KEY` | Open-Meteo 값 사용 |
| 맛집 검색(카카오 로컬) | `KAKAO_REST_KEY` | OSM 주변 식당·카페 → 대표 메뉴 검색 카드 |
| 옷차림·브랜드 **실제 사진**, 블로그 후기 (카카오 이미지·블로그 검색) | `KAKAO_REST_KEY` | 옷 일러스트·카테고리 배너 |
| **AI 비서** | `ANTHROPIC_API_KEY` | 안내 메시지 표시 |

> ⚠ TourAPI는 **KorService2** 주소를 써야 합니다. 예전 `KorService1`은 폐기되어 `NO_OPENAPI_SERVICE_ERROR (코드 12)`가 납니다.

## 🚀 실행하기

```bash
npm install
cp .env.example .env.local      # 값 채우기 (Windows: copy)
npm run dev                     # http://localhost:5173  (화면 + /api 함께 실행)
npm run test:server             # 서버 함수 점검 (API 응답 확인)
```

`vite.config.js`에 `/api/*`를 로컬에서 실행하는 플러그인이 들어 있어 `vercel dev` 없이도 동작합니다.

### Supabase 준비
1. [supabase.com](https://supabase.com)에서 프로젝트 생성 → Project URL과 anon key를 `.env.local`에 입력
2. SQL Editor에 [`supabase/schema.sql`](supabase/schema.sql) 붙여넣고 Run (`favorites`, `chat_logs`)
3. 북마크를 눌러 새로고침해도 남는지 확인

### Vercel 배포
1. GitHub에 push → [vercel.com](https://vercel.com)에서 저장소 Import (Framework: Vite)
2. Environment Variables에 `.env.example`의 값 입력 (`VITE_` 없는 키는 서버에서만 사용됨)
3. Deploy → 배포 주소에서 홈 화면과 AI 비서 동작 확인

## 📁 폴더 구조

```
api/        Vercel 서버 함수 (today, explore, spot, festivals, shop, food, news, station, agent, hello)
server/     외부 API 호출·규칙 로직 (weather, air, outfit, osm, tour, news, tools …) ← 화면·에이전트 공용
  data/       로컬 브랜드·실내 명소 큐레이션
src/
  pages/      Home · Explore · Eat · Issue · Agent · My
  components/ FavButton · PlacePicker · HourlyChart · Status
  layouts/    AppLayout (좌측 레일 / 하단 탭바)
  store/      Zustand 전역 상태
  api/        화면 → /api 호출 함수
  lib/        supabase 연결
supabase/   테이블 생성 SQL
scripts/    서버 함수 점검 스크립트
```

## 📝 출처와 유의사항

- 날씨·대기질: [Open-Meteo](https://open-meteo.com) · 지도 데이터: © OpenStreetMap contributors · 설명: 위키백과
- 뉴스: [이슈제주](https://www.issuejeju.com) RSS(제목·요약·원문 링크만 표시), 기사 저작권은 각 언론사에 있습니다
- 올레길 상세 코스는 [제주올레 공식 사이트](https://www.jejuolle.org/trail#/), 오름 이야기는 [오름나들이](http://www.ormstory.kr/)에서 확인하세요
- 로컬 브랜드·소품샵 목록은 직접 정리한 큐레이션이며, 영업·재고·가격은 방문 전 확인이 필요합니다
- 실습용 Supabase 정책은 *누구나 읽기·쓰기*입니다. 실제 서비스에서는 Supabase Auth로 바꾸세요
