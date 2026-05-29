export const SECTORS = [
  '반도체', '반도체장비', '반도체소재', '배터리',
  'AI/빅테크', 'IT/플랫폼', '소프트웨어',
  '바이오/제약', '뷰티/의료기기',
  '자동차/부품', '조선', '방산',
  '금융/은행', '보험', '전력기기',
  '에너지/화학', '철강/소재', '전자/부품',
  '통신', '로보틱스', '우주', '원자재',
  '소비재', '유통', '부동산', '게임/엔터',
  '매크로', '기타',
]

export type NoteType = 'stock' | 'study'

export interface Note {
  id: string
  type: NoteType
  ticker?: string
  stockName?: string
  sectors: string[]
  content: string
  createdAt: number
  updatedAt: number
}

const KEY = 'mlm-notes'

export function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch { return [] }
}

export function saveNote(note: Note): void {
  const all = loadNotes().filter((n) => n.id !== note.id)
  localStorage.setItem(KEY, JSON.stringify([note, ...all]))
}

export function deleteNote(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(loadNotes().filter((n) => n.id !== id)))
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function formatNoteDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}
