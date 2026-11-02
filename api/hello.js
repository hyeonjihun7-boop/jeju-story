export default function handler(req, res) {
  res.status(200).json({
    ok: true, time: new Date().toISOString(),
    hasDataKey: Boolean(process.env.DATA_GO_KR_KEY),
    hasClaudeKey: Boolean(process.env.ANTHROPIC_API_KEY),
    hasNaverKey: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
    hasKakaoKey: Boolean(process.env.KAKAO_REST_KEY),
  })
}
