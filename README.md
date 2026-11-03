<div align="center">

# 🍊 탐험 제주

**날씨 보고 정하는 하루 — 옷차림부터 실내·야외 탐험, 다크 투어리즘, 축제, 로컬 브랜드, 이슈, AI 여행 일정까지 한 곳에**

`React 19` · `Vite` · `React Router` · `Zustand` · `Bootstrap 5` · `Leaflet` · `Three.js` · `Supabase` · `Vercel` · `Claude / Gemini`

[배포 주소](https://jeju-story.vercel.app) · [저장소](https://github.com/hyeonjihun7-boop/jeju-story) · 제주대 청년도약 부트캠프 1기 개별 과제

</div>

---

## ✨ 기획 의도

제주 여행의 하루는 **날씨가 반**입니다. 비 오는 날 오름에 올라가고, 바람 부는 날 해안도로에서 헤매고, 미세먼지가 짙은 날 야외 일정을 잡는 일이 반복됩니다.
**탐험 제주**는 오늘의 날씨·미세먼지·황사를 먼저 읽고, 그 결과로 *입을 옷*, *갈 곳(실내/야외)*, *먹고 살 것*, *알아야 할 이슈*를 정리하고, AI 비서가 이를 모아 **시간표 일정**까지 만들어 주는 제주 여행 비서입니다.

## 🧭 주요 기능

| 칸 | 하는 일 | 사용하는 데이터 |
|---|---|---|
| ☀️ **오늘** | **“오늘 이렇게 보내세요” 한 줄 요약**(날씨·옷차림·실내/야외 추천), 현재 날씨, 시간대별 기온·강수 그래프, 미세먼지·초미세먼지·황사 등급, **옷차림**(실제 사진), **오늘의 추천**(날마다 바뀜) | Open-Meteo 예보·대기질 · 카카오 이미지 |
| 🧭 **탐험** | **실내 / 야외 / 다크 투어리즘 / 축제·행사 / 문화생활 / 오늘 날씨 추천** 탭, 검색, **3D 지도**(제주 범위), 핀을 누르면 사진·주소·설명, 카카오 길찾기 | TourAPI · OpenStreetMap(Overpass) · 위키백과 · Open-Meteo 고도 |
| 🛍 **먹거리·쇼핑** | 로컬 브랜드(간식·디저트 / 의류 / 액세서리·소품), 지역별 맛집·카페, 실제 사진 | TourAPI · 카카오 이미지·블로그 |
| 📰 **이슈** | 이슈제주 최신 기사 + 주제별 뉴스 | 이슈제주 RSS · Google 뉴스 RSS |
| ✨ **AI 비서** | 질문하면 AI가 **스스로 도구를 골라** 호출하고 답변, *호출한 도구 목록* 표시. “1박 2일 일정 짜줘” → **시간표**로 보여주고 저장 | 위 모든 API를 도구(18개)로 사용 |
| 🚩 **탐험하기** | **스탬프**(GPS 현장 인증) · **레벨·칭호·연속 탐험일** · **오늘의 미션** · **안개 지도** · **코스 만들기·공유** · **탐험 일지** · **탐험가 랭킹** | Supabase · 내 위치(GPS) |
| 🔖 **북마크** | 담은 곳을 종류별로 거르고 **지도에서 한꺼번에 보기**, **카드 이미지 저장**, **북마크로 여행 계획 만들기·공유 링크**, 저장한 일정 목록, AI 대화 기록 | Supabase |

### 🗓 AI 여행 일정
- AI가 날씨·장소 API를 호출해 `## N일차` + `시간 | 장소 | 설명` 형식으로 일정을 만들면, 화면에서 **시간표**로 바꿔 보여줍니다.
- 장소마다 **카카오 길찾기** 버튼, 하루 단위 **지도로 보기**(번호 핀 + 이동 경로).
- **내 일정에 저장**(Supabase `trips`) → 북마크 탭에서 다시 보기 → **공유 링크**(`/trip/:id`)를 복사해 누구에게나 보여주기.
- 장소 이름 → 좌표는 TourAPI 키워드 검색으로 찾되, 이름이 거의 같을 때만 받아들입니다. 못 찾으면 엉뚱한 곳에 찍지 않고 핀을 생략합니다.
- AI가 바쁠 때(무료 한도)를 위해 **예시 일정 보기(AI 없이)** 버튼, 모델 폴백, 같은 질문 10분 캐시를 둡니다.

### 🚩 탐험하기
가 보고, 도장 찍고, 기록하는 칸입니다. (`src/pages/Quest.jsx`, `src/components/quest/`)
- **도트 풍경**: 탐험하기 맨 위에 한라산·바다·돌하르방·해녀가 있는 제주 도트 장면이 움직입니다. 이미지 파일 없이 캔버스에 코드로 그리고(`src/lib/pixelJeju.js`, `src/components/quest/PixelJeju.jsx`), 화면에서 벗어나거나 탭이 숨겨지면 멈추며 "움직임 줄이기" 설정이면 정지 그림으로 나옵니다.
  - **날씨·시간대 연동**: 오늘 날씨(맑음·구름·흐림·안개·이슬비·비·천둥·눈)와 일출·일몰 시각으로 하늘색, 구름, 비·눈, 우산, 별·달, 노을, 야자수 흔들림을 바꿉니다(`src/lib/pixelMood.js`). 확인용으로 주소 끝에 `?pixel=rain,night,wind9`처럼 붙이면 날씨·시간대를 강제로 바꿔 볼 수 있습니다.
  - **해녀 말풍선**: 풍경 속 해녀가 제주 말씨와 표준말 풀이로 날씨·미션·일지를 안내합니다(`src/lib/haenyeo.js`). 7초마다 바뀌고 누르면 다음 말로 넘어갑니다.
  - **레벨별 도트 캐릭터**: 탐험하기 레벨 카드의 캐릭터가 레벨이 오를 때마다 달라집니다. Lv.1 육지 손님(캐리어) → Lv.2 제주 새내기(밀짚모자·감귤) → Lv.3 탐험 수습생(배낭·지도) → Lv.4 제주 탐험가(조끼·트레킹 폴) → Lv.5 제주 길잡이(올레 리본 깃발·목도리) → Lv.6 탐험 대장(금관·망토·감귤 깃발). 자랑 카드에도 들어가고, 레벨업 연출에서는 이전 모습이 번쩍하고 새 모습으로 바뀝니다(`src/lib/avatar.js`, `src/components/quest/Avatar.jsx`).
  - **도장·레벨업·완주 연출**: 스탬프를 찍으면 도장이 쾅 찍히고 감귤이 터지며, 레벨업은 해녀가 점프하고 코스·올레 완주는 금메달이 나옵니다(`src/components/FxLayer.jsx`).
- **스탬프**: 오름·바다·숲·폭포·역사·맛집 40여 곳. 내 위치(GPS)가 장소 반경 안이면 인증되고, 기기가 알려 주는 오차(최대 150m)만큼은 반경에 더해 줍니다. 오차가 1km를 넘으면 인증하지 않습니다. 장소 좌표는 한국관광공사·OpenStreetMap 두 곳으로 대조했습니다.
- **데모 모드**: 현장에 없어도 스탬프를 찍어 볼 수 있는 시연용 스위치. 데모 스탬프는 "데모"로 표시되고 서버·랭킹에는 올라가지 않습니다.
- **레벨·칭호·연속 탐험일**: 스탬프 수로 레벨, 종류별 1·3·5곳에서 칭호(오름 마스터 등), 스탬프나 일지를 남긴 날이 이어지면 보너스 칭호.
- **오늘의 미션**: 날씨에 맞춰 매일 바뀌는 3개(장소 스탬프 · 한 줄 일지 · 코스 만들기).
- **안개 지도**: 안 가 본 곳은 물음표 핀, 스탬프를 찍으면 색이 켜집니다(3D·2D 모두).
- **코스 만들기·공유**: 핀을 골라 시간표 코스로 저장하면 `/trip/:id` 공유 링크와 코스 갤러리에 올라갑니다.
- **탐험 일지**: 장소마다 사진 한 장과 한 줄 메모, 타임라인과 지도. `journal` 테이블이 있으면 서버에도 저장됩니다.
- **코스 완주 도전**: 스탬프 장소 3~4곳을 테마별로 묶은 6개 코스(서귀포 올레길 산책·동부 오름·서쪽 노을·남서 해안·숲길·동쪽 끝 일출). 모두 인증하면 완주 배지가 붙고, 남은 곳은 다음 장소 길찾기로 이어집니다. 코스 구성은 `src/data/courses.js`, 진행 계산은 `src/lib/trail.js`.
- **제주올레 코스 완주**: 공공데이터포털 「제주특별자치도_올레코스현황」(제주올레 제공, 2026-07-31 기준)의 공식 코스 정보로, 코스의 **시작점과 종점을 둘 다 GPS로 인증**하면 완주 배지가 붙습니다(걸은 경로 전체를 확인하지는 않습니다). 이어진 코스는 지점 하나를 함께 씁니다. 공식 데이터에는 좌표가 없어서 시종점 좌표를 한국관광공사 TourAPI(올레 코스 시작점)와 OpenStreetMap으로 대조해, 두 곳이 700m 안에서 맞은 지점만 인증 대상(17개 코스)으로 썼고 나머지 7개 코스(10-1·12·13·14·14-1·17·18)는 안내만 보여 줍니다. 데이터는 `src/data/olle.js`, 진행 계산은 `src/lib/trail.js`, 화면은 `src/components/quest/OlleCourses.jsx`. 인증 기록은 이 기기에만 저장되고 랭킹에는 들어가지 않습니다.
- **탐험가 랭킹**: 서버에 올라온 스탬프를 닉네임별로 세어 순위를 냅니다.
- **앱 설치(PWA)**: 크롬·엣지·안드로이드는 "홈 화면에 앱 설치" 버튼, iOS 사파리는 공유 → 홈 화면에 추가. 서비스 워커(`public/sw.js`)가 앱 껍데기를 저장해 오프라인에서도 첫 화면이 열립니다(API 응답은 저장하지 않음).
- **자랑 카드 · AI 연결**: 레벨·칭호를 이미지 한 장으로 저장하고, 가 본 곳을 뺀 안 가 본 곳으로 AI에게 1박 2일 일정을 부탁합니다.

### 🕯 다크 투어리즘
4·3 유적 등 제주의 아픈 역사를 기억하는 장소 12곳과 프로그램(모바일 스탬프 투어, (사)제주다크투어)을 소개합니다. 사진은 TourAPI 우선, 없으면 카카오 이미지로 채웁니다.

### 🌦 옷차림은 이렇게 정해요
체감온도 평균(9~20시)을 구간별로 나눠 *얇은 옷 / 적당한 옷 / 두꺼운 옷*을 고르고, 여기에 **일교차 ≥ 8°**, **풍속 ≥ 7m/s**, **강수**, **자외선 ≥ 6**, **미세먼지 나쁨·황사**를 얹어 겉옷·우산·바람막이·선크림·마스크를 덧붙입니다. (`server/outfit.js`)

### 🗺 3D 지도
모든 지도(탐험·다크 투어리즘·북마크·AI 일정)가 **Three.js 3D 지형 지도**로 열립니다. 고도 타일(AWS Terrain Tiles)로 제주 지형을 솟게 하고 그 위에 OpenStreetMap 지도를 입혔습니다(키 불필요).
- 드래그로 회전, 휠·핀치로 확대, 핀을 누르면 사진·주소·설명 카드. 일정 지도는 번호 핀과 이동 경로를 지형 위에 보여줍니다.
- 오른쪽 위 버튼으로 **2D(Leaflet)** 와 전환하고, 3D를 못 쓰는 기기는 자동으로 2D로 돌아갑니다.
- 3D 코드(`src/components/Map3D.jsx`)는 지도를 처음 열 때만 내려받아 다른 화면이 느려지지 않습니다.

### 🎨 디자인
제주 바다·한라산·감귤 모티프의 테마, 감귤 모양 마우스 커서(마우스가 있는 기기에서만), 데스크톱은 좌측 레일 / 모바일은 하단 탭바.

## 🏗 아키텍처

```
┌──────────── 브라우저 (React) ────────────┐
│ router.jsx ─ AppLayout ─ pages/*          │
│ store/useAppStore.js  (Zustand: 공유 상태) │
│ api/client.js ─ fetch('/api/…')           │──┐
│ lib/supabase.js ─ 북마크·일정·대화기록       │  │
└───────────────────────────────────────────┘  │
                                               ▼
┌──────── Vercel 서버 함수 api/*.js ─────────────┐     ┌───────────┐
│ today · explore · spot · festivals · culture   │     │ Supabase  │
│ shop · food-regions · news · outfit-photo      │     │ favorites │
│ agent                                          │     │ chat_logs │
│   └─ server/*.js  (화면과 에이전트가 공용)       │     │ trips     │
│ 비밀 키(.env)는 여기에서만 사용                   │     └───────────┘
└───────┬───────────────────────────────────────┘
        ▼
 Open-Meteo · OSM(Overpass) · 위키백과 · 이슈제주 RSS · Google 뉴스 RSS
 한국관광공사 TourAPI · 카카오 (키가 있으면) · Gemini / Claude
```

- **store** — 여러 페이지가 함께 쓰는 값(지역, 오늘 데이터, 북마크, 일정, 대화). 탐험하기의 스탬프·일지·코스는 `useQuestStore`(이 기기에 저장 + Supabase 동기화)
- **Supabase 테이블** — `favorites` · `chat_logs` · `trips` · `stamps` · `journal`
- **router** — 이동 경로(`NAV_ITEMS`) 한 곳에서 관리, 공유 일정은 `/trip/:id`
- **server vs client** — 키가 필요하거나 CORS가 막힌 호출은 모두 서버 함수 경유

## 🤖 AI 에이전트

`api/agent.js`의 루프: **질문 → AI가 도구 선택 → 서버가 API 실행 → 결과를 보고 다시 판단 → 최종 답변** (최대 6회).
`ANTHROPIC_API_KEY`가 있으면 Claude(배포본), 없고 `GEMINI_API_KEY`가 있으면 Gemini로 같은 도구를 사용합니다.

| 분류 | 도구 |
|---|---|
| 날씨·옷차림 | `get_today_plan` `get_weather` `get_air_quality` `get_station_air` `find_place` |
| 자연·관광 | `find_oreum` `get_elevation` `get_wiki_summary` `find_olle_routes` `search_indoor_spots` `search_spots` `search_festivals` `search_dark_tourism` |
| 먹거리·쇼핑 | `search_local_brands` `search_restaurants` `search_blog_reviews` |
| 이슈 | `get_issue_jeju` `search_news` |

시스템 프롬프트는 *“날씨·장소는 추측하지 말고 도구로 확인, 비·미세먼지엔 실내 대안, 없는 정보는 지어내지 않기, 일정은 정해진 표 형식으로”* 를 요구합니다.

## 🔑 API 키 없이도 되는 것 / 키가 필요한 것

| | 키 | 없을 때 |
|---|---|---|
| 날씨·대기질·옷차림 | 불필요 | — |
| 오름·고도·위키 | 불필요 | Overpass가 느리면 대표 오름으로 대체 |
| 이슈제주 · 뉴스 | 불필요 | — |
| 올레길 | 불필요(코스 정보는 앱에 내장) | 공공데이터포털 올레코스현황(odcloud 파일 API, `DATA_GO_KR_KEY`로 조회해 `src/data/olle.js`에 정리) + 제주올레 공식 사이트 링크 |
| **축제·행사·관광지·맛집 (TourAPI)**, 일정 장소 좌표 | `DATA_GO_KR_KEY` | 안내 메시지 표시 |
| 옷차림·브랜드·다크투어 **실제 사진**, 블로그 후기 | `KAKAO_REST_KEY` | 일러스트·카테고리 배너 |
| **AI 비서** | `GEMINI_API_KEY` 또는 `ANTHROPIC_API_KEY` | 안내 메시지 + 예시 일정 |
| 북마크·일정·스탬프·일지 저장 | `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` | 저장 기능 꺼짐 (스탬프·일지는 이 기기에만 저장) |
| 스탬프 현장 인증 | 없음 (브라우저 위치 권한, HTTPS 필요) | 데모 모드로 대신 |

> ⚠ TourAPI는 **KorService2**, 제주 필터는 `lDongRegnCd=50`을 써야 합니다. 예전 `KorService1`은 폐기되었고, `areaCode=39`는 일부 데이터만 돌려줍니다.

## 🚀 실행하기

```bash
npm install
cp .env.example .env.local      # 값 채우기 (Windows: copy)
npm run dev                     # http://localhost:5173  (화면 + /api 함께 실행)
```

`vite.config.js`에 `/api/*`를 로컬에서 실행하는 플러그인이 들어 있어 `vercel dev` 없이도 동작합니다. (`server/` 파일을 고치면 개발 서버를 다시 시작하세요.)

### Supabase 준비
1. [supabase.com](https://supabase.com)에서 프로젝트 생성 → Project URL과 anon key를 `.env.local`에 입력
2. SQL Editor에 [`supabase/schema.sql`](supabase/schema.sql) 붙여넣고 Run (`favorites`, `chat_logs`, `trips`, `stamps`, `journal`)
3. 북마크·일정을 저장하고 새로고침해도 남는지 확인

### Vercel 배포
1. GitHub에 push → [vercel.com](https://vercel.com)에서 저장소 Import (Framework: Vite)
2. Environment Variables에 `.env.example`의 값 입력 (`VITE_` 없는 키는 서버에서만 사용됨)
3. Deploy → 배포 주소에서 홈 화면과 AI 비서 동작 확인
4. 다른 사람에게 보여주려면 Settings → Deployment Protection에서 Vercel Authentication을 끕니다

## 📁 폴더 구조

```
api/        Vercel 서버 함수 11개 — Hobby 한도(12개) 이하
server/     외부 API 호출·규칙 로직 (weather, air, outfit, tour, places, dark, daily, news, tools …) ← 화면·에이전트 공용
src/
  pages/      Home · Explore · Quest · Eat · Issue · Agent · My · TripShare
  components/ Itinerary · MapView · DarkTour · DailyPicks · BookmarkTools · NaviButton · FavButton …
    quest/    StampTab · QuestMap · CourseTab · JournalTab · RankTab · ShareCard
  layouts/    AppLayout (좌측 레일 / 하단 탭바)
  store/      Zustand 전역 상태
  api/        화면 → /api 호출 함수
  lib/        supabase 연결 · quest(레벨·미션·연속일) · plan(시간표 글) · shareImage(이미지 저장)
  data/       spots(스탬프 장소) · sampleTrip
  styles/     theme · jeju · cursor · dark · trip · quest
supabase/   테이블 생성 SQL
```

## 📝 출처와 유의사항

- 날씨·대기질: [Open-Meteo](https://open-meteo.com) · 지도 데이터: © OpenStreetMap contributors · 3D 지형: [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) · 설명: 위키백과
- 관광지·축제·맛집: 한국관광공사 TourAPI(공공데이터포털), 사진: 카카오 이미지 검색
- 뉴스: [이슈제주](https://www.issuejeju.com) RSS(제목·요약·원문 링크만 표시), 기사 저작권은 각 언론사에 있습니다
- 올레길 상세 코스는 [제주올레 공식 사이트](https://www.jejuolle.org/trail#/), 오름 이야기는 [오름나들이](http://www.ormstory.kr/)에서 확인하세요
- 로컬 브랜드·소품샵 목록은 직접 정리한 큐레이션이며, 영업·재고·가격은 방문 전 확인이 필요합니다
- AI 일정은 참고용입니다. 영업시간과 이동 시간은 가기 전에 확인하세요
- 실습용 Supabase 정책은 *누구나 읽기·쓰기*입니다. 실제 서비스에서는 Supabase Auth로 바꾸세요
