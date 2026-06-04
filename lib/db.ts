/**
 * Supabase CRUD — watchlist / study_notes / ipo_entries
 *
 * 필요한 테이블 SQL (Supabase 대시보드 > SQL Editor 에서 실행):
 *
 * create table watchlist (
 *   user_id uuid primary key references auth.users(id) on delete cascade,
 *   tickers text[] default '{}',
 *   updated_at timestamptz default now()
 * );
 * alter table watchlist enable row level security;
 * create policy "own" on watchlist for all using (auth.uid() = user_id);
 *
 * create table study_notes (
 *   id text primary key,
 *   user_id uuid references auth.users(id) on delete cascade not null,
 *   type text not null default 'study',
 *   ticker text,
 *   stock_name text,
 *   sectors text[] default '{}',
 *   content text default '',
 *   news_link text,
 *   created_at bigint not null,
 *   updated_at bigint not null
 * );
 * alter table study_notes enable row level security;
 * create policy "own" on study_notes for all using (auth.uid() = user_id);
 *
 * create table ipo_entries (
 *   id text primary key,
 *   user_id uuid references auth.users(id) on delete cascade not null,
 *   name text not null,
 *   market text default '',
 *   subscribe_date text default '',
 *   offering_price integer default 0,
 *   allocated_shares integer default 0,
 *   exit_price integer default 0,
 *   created_at timestamptz default now()
 * );
 * alter table ipo_entries enable row level security;
 * create policy "own" on ipo_entries for all using (auth.uid() = user_id);
 */

import { supabase } from './supabase'
import type { Note } from './notes'

// ══════════════════════════════════════════════════════════════
// ── Watchlist ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export async function dbLoadWatchlist(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('watchlist')
    .select('tickers')
    .eq('user_id', userId)
    .single()
  return data?.tickers ?? []
}

export async function dbSaveWatchlist(userId: string, tickers: string[]): Promise<void> {
  await supabase.from('watchlist').upsert({
    user_id: userId,
    tickers,
    updated_at: new Date().toISOString(),
  })
}

// ══════════════════════════════════════════════════════════════
// ── Study Notes ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export async function dbLoadNotes(userId: string): Promise<Note[]> {
  const { data } = await supabase
    .from('study_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(row => ({
    id:         row.id,
    type:       row.type,
    ticker:     row.ticker    ?? undefined,
    stockName:  row.stock_name ?? undefined,
    sectors:    row.sectors   ?? [],
    content:    row.content   ?? '',
    newsLink:   row.news_link ?? undefined,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  }))
}

export async function dbSaveNote(userId: string, note: Note): Promise<void> {
  await supabase.from('study_notes').upsert({
    id:         note.id,
    user_id:    userId,
    type:       note.type,
    ticker:     note.ticker    ?? null,
    stock_name: note.stockName ?? null,
    sectors:    note.sectors,
    content:    note.content,
    news_link:  note.newsLink  ?? null,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  })
}

export async function dbDeleteNote(userId: string, id: string): Promise<void> {
  await supabase.from('study_notes').delete()
    .eq('id', id).eq('user_id', userId)
}

// ══════════════════════════════════════════════════════════════
// ── IPO Entries ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export interface IpoEntryRow {
  id:              string
  name:            string
  market:          string
  subscribeDate:   string
  offeringPrice:   number
  allocatedShares: number
  exitPrice:       number
}

export async function dbLoadIpoEntries(userId: string): Promise<IpoEntryRow[]> {
  const { data } = await supabase
    .from('ipo_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(row => ({
    id:              row.id,
    name:            row.name,
    market:          row.market          ?? '',
    subscribeDate:   row.subscribe_date  ?? '',
    offeringPrice:   row.offering_price  ?? 0,
    allocatedShares: row.allocated_shares ?? 0,
    exitPrice:       row.exit_price      ?? 0,
  }))
}

export async function dbSaveIpoEntry(userId: string, e: IpoEntryRow): Promise<void> {
  await supabase.from('ipo_entries').upsert({
    id:               e.id,
    user_id:          userId,
    name:             e.name,
    market:           e.market,
    subscribe_date:   e.subscribeDate,
    offering_price:   e.offeringPrice,
    allocated_shares: e.allocatedShares,
    exit_price:       e.exitPrice,
  })
}

export async function dbDeleteIpoEntry(userId: string, id: string): Promise<void> {
  await supabase.from('ipo_entries').delete()
    .eq('id', id).eq('user_id', userId)
}
