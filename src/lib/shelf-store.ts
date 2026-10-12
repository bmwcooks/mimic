"use client"

import { useSyncExternalStore } from "react"
import { DEFAULT_FIELDS, sanitizeFields, type FieldId } from "@/lib/fields"
import type { CatalogRow, KeptCard } from "@/lib/types"

const SHELF_KEY = "mimic-shelf-v1"
const FIELDS_KEY = "mimic-fields-v1"
const EMPTY_SHELF: KeptCard[] = []

let shelfCache: KeptCard[] | null = null
let fieldsCache: FieldId[] | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function readShelf(): KeptCard[] {
  if (shelfCache) return shelfCache
  if (typeof window === "undefined") return EMPTY_SHELF
  try {
    const parsed = JSON.parse(localStorage.getItem(SHELF_KEY) ?? "[]") as unknown
    shelfCache = Array.isArray(parsed) ? (parsed as KeptCard[]) : EMPTY_SHELF
  } catch {
    shelfCache = EMPTY_SHELF
  }
  return shelfCache
}

function writeShelf(next: KeptCard[]) {
  shelfCache = next.length ? next : EMPTY_SHELF
  localStorage.setItem(SHELF_KEY, JSON.stringify(shelfCache))
  emit()
}

function readFields(): FieldId[] {
  if (fieldsCache) return fieldsCache
  if (typeof window === "undefined") return DEFAULT_FIELDS
  try {
    const parsed = JSON.parse(localStorage.getItem(FIELDS_KEY) ?? "null") as unknown
    fieldsCache = parsed == null ? DEFAULT_FIELDS : sanitizeFields(parsed)
  } catch {
    fieldsCache = DEFAULT_FIELDS
  }
  return fieldsCache
}

function writeFields(next: FieldId[]) {
  fieldsCache = sanitizeFields(next)
  localStorage.setItem(FIELDS_KEY, JSON.stringify(fieldsCache))
  emit()
}

function getServerShelf() {
  return EMPTY_SHELF
}

function getServerFields() {
  return DEFAULT_FIELDS
}

export function useShelf() {
  return useSyncExternalStore(subscribe, readShelf, getServerShelf)
}

export function useFields() {
  return useSyncExternalStore(subscribe, readFields, getServerFields)
}

export function keepRows(rows: CatalogRow[]) {
  const current = readShelf()
  const map = new Map(current.map((item) => [item.key, item]))
  const now = new Date().toISOString()
  let added = 0
  let updated = 0
  for (const row of rows) {
    if (map.has(row.key)) updated += 1
    else added += 1
    map.set(row.key, { ...row, savedAt: now })
  }
  writeShelf([...map.values()])
  return { added, updated }
}

export function removeKeys(keys: Iterable<string>) {
  const drop = new Set(keys)
  writeShelf(readShelf().filter((item) => !drop.has(item.key)))
}

export function clearShelf() {
  writeShelf([])
}

export function toggleField(id: FieldId, enabled: boolean) {
  if (id === "name") return
  const current = new Set(readFields())
  if (enabled) current.add(id)
  else current.delete(id)
  writeFields([...current])
}

export function resetFields() {
  writeFields(DEFAULT_FIELDS)
}
