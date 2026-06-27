/**
 * 토스 Open API 고정 IP 프록시
 *
 * 토스는 모든 요청에서 호출자 IP 를 검사한다(IP 화이트리스트).
 * Vercel serverless 는 IP 가 고정이 아니라 등록이 불가능하므로,
 * 등록된 IP(이 머신)에서 이 프록시를 띄우고 외부에 노출(localtunnel/cloudflared)하여
 * Vercel → 이 프록시 → 토스 순으로 호출한다.
 *
 * 보안: X-Proxy-Secret 헤더가 PROXY_SECRET 과 일치하는 요청만 전달한다.
 *
 * 실행:
 *   PROXY_SECRET=<secret> node scripts/toss-proxy.mjs
 */
import http from 'node:http'

const PORT = process.env.PROXY_PORT || 4000
const SECRET = process.env.PROXY_SECRET
const TOSS_BASE = 'https://openapi.tossinvest.com'

if (!SECRET) {
  console.error('PROXY_SECRET 환경변수가 필요합니다.')
  process.exit(1)
}

const server = http.createServer(async (req, res) => {
  // 헬스체크
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // 시크릿 검증
  if (req.headers['x-proxy-secret'] !== SECRET) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'forbidden' }))
    return
  }

  // 요청 본문 수집
  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = Buffer.concat(chunks)

  // 토스로 전달할 헤더 (host/proxy-secret 등 제거)
  const fwdHeaders = {}
  for (const [k, v] of Object.entries(req.headers)) {
    const lk = k.toLowerCase()
    if (['host', 'x-proxy-secret', 'connection', 'content-length'].includes(lk)) continue
    fwdHeaders[k] = v
  }

  try {
    const target = TOSS_BASE + req.url
    const tossRes = await fetch(target, {
      method: req.method,
      headers: fwdHeaders,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
    })

    const buf = Buffer.from(await tossRes.arrayBuffer())
    res.writeHead(tossRes.status, {
      'Content-Type': tossRes.headers.get('content-type') || 'application/json',
    })
    res.end(buf)
    console.log(`${req.method} ${req.url} → ${tossRes.status}`)
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'proxy-upstream-error', message: String(err) }))
    console.error('upstream error:', err)
  }
})

server.listen(PORT, () => {
  console.log(`[toss-proxy] listening on :${PORT} → ${TOSS_BASE}`)
})
