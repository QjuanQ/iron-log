import { openDB } from 'idb'

// Iron Log storage — IndexedDB via idb
// Provides a simple get/set API backed by a real database

let _db = null

async function getDB() {
  if (_db) return _db
  _db = await openDB('ironlog', 1, {
    upgrade(db) {
      db.createObjectStore('kv')
    }
  })
  return _db
}

export const storage = {
  async get(key) {
    const db = await getDB()
    const val = await db.get('kv', key)
    return val !== undefined ? { value: val } : null
  },

  async set(key, value) {
    const db = await getDB()
    await db.put('kv', value, key)
  },

  async delete(key) {
    const db = await getDB()
    await db.delete('kv', key)
  }
}
