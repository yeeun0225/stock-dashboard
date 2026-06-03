import { google } from 'googleapis'

export function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  )
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return google.gmail({ version: 'v1', auth })
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
  content:    string   // HTML
  receivedAt: string   // ISO string
}

const SENDERS = {
  uppity: 'moneyletter@uppity.co.kr',
  dig:    'dig@mk.co.kr',
}

export async function fetchNewEmails(afterDate: string): Promise<ParsedEmail[]> {
  const gmail = getGmailClient()
  const results: ParsedEmail[] = []

  for (const [key, email] of Object.entries(SENDERS)) {
    const query = `from:${email} after:${afterDate}`
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 30,
    })

    const messages = listRes.data.messages ?? []

    for (const msg of messages) {
      if (!msg.id) continue

      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })

      const headers = detail.data.payload?.headers ?? []
      const subject = headers.find(h => h.name === 'Subject')?.value ?? '(제목 없음)'
      const dateHeader = headers.find(h => h.name === 'Date')?.value ?? ''
      const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString()

      const html = extractHtml(detail.data.payload)
      const text = extractText(detail.data.payload)
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
