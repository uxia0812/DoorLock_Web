/**
 * Vercel Serverless Function
 * 네이버 지역 검색 API 프록시
 *
 * 호출: GET /api/naver-search?query=강성24시출장열쇠&display=5
 *
 * 환경변수 (Vercel 대시보드 > Settings > Environment Variables):
 *   NAVER_CLIENT_ID     — 네이버 개발자센터 Client ID
 *   NAVER_CLIENT_SECRET — 네이버 개발자센터 Client Secret
 */

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { query, display = '5' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query 파라미터가 필요합니다.' });
  }

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'API 키가 서버에 설정되지 않았습니다.' });
  }

  try {
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${display}&sort=comment`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id':     clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();

    // HTML 태그 제거 유틸
    const stripHtml = (str) => str.replace(/<[^>]*>/g, '');

    // 응답 정규화
    const items = (data.items || []).map((item) => ({
      title:       stripHtml(item.title),
      address:     item.roadAddress || item.address,
      telephone:   item.telephone,
      category:    item.category,
      mapx:        item.mapx,  // 경도 (WGS84 변환 필요)
      mapy:        item.mapy,  // 위도
      // 네이버 플레이스 링크 생성
      naverMapUrl: `https://map.naver.com/v5/search/${encodeURIComponent(stripHtml(item.title))}`,
    }));

    // 캐시 5분 (CDN 엣지 캐싱)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ items });

  } catch (err) {
    console.error('[naver-search] Error:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
