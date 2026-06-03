// googleapis 대신 Gmail REST API 직접 호출 (Vercel 호환)

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GMAIL_CLIENT_ID!.trim(),
      client_secret: process.env.GMAIL_CLIENT_SECRET!.trim(),
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!.trim(),
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data))
  return data.access_token
}

// Base64 URL 디코딩
function decodeBase64(str: string): string {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

// 파트에서 HTML 본문 추출 (재귀)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractHtml(part: any): string {
  if (!part) return ''
  if (part.mimeType === 'text/html' && part.body?.data) {
    return decodeBase64(part.body.data)
  }
  if (part.parts) {
    for (const p of part.parts) {
      const html = extractHtml(p)
      if (html) return html
    }
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(part: any): string {
  if (!part) return ''
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeBase64(part.body.data)
  }
  if (part.parts) {
    for (const p of part.parts) {
      const text = extractText(p)
      if (text) return text
    }
  }
  return ''
}

export interface ParsedEmail {
  gmailId:    string
  sender:     'uppity' | 'dig'
  subject:    string
  content:    string
  receivedAt: string
}

const SENDERS = {
  uppity: 'moneyletter@uppity.co.kr',
  dig:    'dig@mk.co.kr',
}

export async function fetchNewEmails(afterTimestamp: string): Promise<ParsedEmail[]> {
  const token = await getAccessToken()
  const results: ParsedEmail[] = []

  for (const [key, email] of Object.entries(SENDERS)) {
    const query = `from:${email} after:${afterTimestamp}`
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=30`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const listData = await listRes.json()
    const messages: { id: string }[] = listData.messages ?? []

    for (const msg of messages) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const detail = await detailRes.json()

      const headers: { name: string; value: string }[] = detail.payload?.headers ?? []
      const subject    = headers.find(h => h.name === 'Subject')?.value ?? '(제목 없음)'
      const dateHeader = headers.find(h => h.name === 'Date')?.value ?? ''
      const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString()

      const html    = extractHtml(detail.payload)
      const text    = extractText(detail.payload)
      const content = html || `<pre>${text}</pre>`

      results.push({
        gmailId:    msg.id,
        sender:     key as 'uppity' | 'dig',
        subject,
        content,
        receivedAt,
      })
    }
  }

  return results
}
