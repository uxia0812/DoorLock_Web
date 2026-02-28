# 웹사이트 셋업 가이드

## 1단계: 네이버 API 키 발급 (5분)

1. https://developers.naver.com 접속 → 로그인
2. 상단 **[Application] → [애플리케이션 등록]** 클릭
3. 아래와 같이 입력:
   - 애플리케이션 이름: `doorlock-web` (아무거나 가능)
   - 사용 API: **검색** 선택 → **지역** 체크
   - 환경: **WEB** 선택 → URL: 배포된 도메인 입력 (예: `https://your-site.vercel.app`)
4. 등록 완료 후 **Client ID**와 **Client Secret** 복사해 두기

> 무료 한도: 하루 25,000회 호출 (충분)

---

## 2단계: data/reviews.json 수정

`data/reviews.json` 파일에서 각 매장의 **실제 정보**로 교체:

```json
{
  "stores": [
    {
      "id": "store-1",
      "searchQuery": "강성24시출장열쇠번호키디지털도어락 강서구",
      "naverMapUrl": "← 네이버 지도에서 매장 검색 후 공유 링크 붙여넣기",
      "reviews": [
        {
          "author": "김**",
          "rating": 5,
          "date": "2025.01.15",
          "text": "← 실제 리뷰 내용"
        }
      ]
    }
  ]
}
```

### 네이버 플레이스 URL 찾는 방법:
1. 네이버 지도 앱 또는 PC에서 매장 검색
2. 매장 상세 페이지에서 **[공유]** 버튼 클릭
3. 복사된 링크를 `naverMapUrl`에 붙여넣기

---

## 3단계: js/main.js CONFIG 수정

```js
const CONFIG = {
  brandName: '강성24시출장열쇠번호키디지털도어락',  // ← 실제 상호명으로 교체
  displayCount: 5,   // 표시할 매장 수
  mainPhone: '010-XXXX-XXXX',  // ← 대표 전화번호
};
```

---

## 4단계: Vercel 배포

### 최초 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 루트에서 실행
vercel

# 안내에 따라 로그인 및 설정 완료
```

### 환경변수 설정 (중요!)
배포 후 Vercel 대시보드에서:
1. 프로젝트 선택 → **Settings → Environment Variables**
2. 아래 두 변수 추가:

| 이름 | 값 |
|------|-----|
| `NAVER_CLIENT_ID` | 1단계에서 복사한 Client ID |
| `NAVER_CLIENT_SECRET` | 1단계에서 복사한 Client Secret |

3. **Save** 후 **Redeploy** 실행

---

## 5단계: 매장 검색 쿼리 확인

브라우저에서 아래 URL 접속해서 결과 확인:
```
https://your-site.vercel.app/api/naver-search?query=강성24시출장열쇠번호키디지털도어락&display=5
```

올바른 매장이 뜨면 완료!

---

## 리뷰 업데이트 방법

`data/reviews.json` 파일을 직접 수정하고 git push → 자동 재배포됩니다.

리뷰는 네이버 플레이스에서 새로운 리뷰가 쌓이면 수동으로 복사해서 추가하세요.
(월 1~2회 업데이트 권장)
