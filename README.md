# SISO Q&A

숭실대학교 교환학생을 위한 **이중 언어(한국어/영어) FAQ 웹사이트**입니다. 혼자 기획하고 만들고 운영합니다.

Live site: https://ssuinternational.kro.kr

## 주요 기능

- **한국어/영어 페이지 제공**: 영어 페이지와 `korean/` 폴더의 한국어 페이지를 따로 둡니다.
- **주제별 FAQ**: RC, 시간표, 기숙사, 학교 정보(SSU) 페이지로 나눠 구성
- **Google Sheets로 FAQ 관리**: 코드를 수정하지 않고 스프레드시트만 고쳐서 질문과 답변을 갱신합니다. 시트를 불러오지 못하면 HTML에 들어 있는 기존 FAQ가 그대로 보입니다.
- **Google Analytics**로 방문 현황 확인
- **커스텀 도메인** 연결

## 구조

```
index.html                    영어 랜딩 페이지
RC.html  timetable.html
dorm.html  ssu.html           영어 FAQ 페이지
korean/                       한국어 페이지
css/styles.css                공통 스타일
js/analytics.js               Google Analytics 설정
js/faq_loader.js              Google Sheets FAQ 로더
images/                       로고, 지도 등 이미지
```

## 기술

HTML, CSS, JavaScript (프레임워크 없음), Google Sheets (Google Visualization JSON endpoint), Google Analytics

## FAQ를 Google Sheets로 수정하기

1. 스프레드시트를 "링크가 있는 모든 사용자 보기"로 공유합니다.
2. 페이지마다 시트 탭을 하나씩 둡니다: `RC`, `Dorm`, `Timetable`, `SSU`
3. 열은 이 순서로 만듭니다: `id`, `questionKo`, `answerKo`, `questionEn`, `answerEn`, `order`, `active`
4. 보여줄 행은 `active`를 `TRUE`로 둡니다.
5. 시트를 바꾸려면 `js/faq_loader.js`의 기본 시트 ID를 고치거나, FAQ 페이지에 아래 meta 태그를 추가합니다.

```html
<meta name="faq-sheet-id" content="YOUR_GOOGLE_SHEET_ID">
```

답변에는 줄바꿈, `**굵은 글씨**`, `[링크 텍스트](https://example.com)`를 쓸 수 있습니다.

## 개발 메모

- 공통 스타일과 분석 코드는 `css/styles.css`, `js/analytics.js`에 둡니다.
- 꼭 필요한 예외가 아니면 HTML에 인라인 스타일을 쓰지 않습니다.
- Google Sheets 데이터는 Google Visualization JSON endpoint로 불러옵니다.
