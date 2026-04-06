import { openDB } from 'idb'
import { supabase } from './supabase'

const DB_NAME = 'taxilog'
const DB_VERSION = 1

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('registros')) {
        const registrosStore = db.createObjectStore('registros', { keyPath: 'id' })
        registrosStore.createIndex('fecha', 'fecha')
      }
      if (!db.objectStoreNames.contains('gastos')) {
        const gastosStore = db.createObjectStore('gastos', { keyPath: 'id' })
        gastosStore.createIndex('fecha', 'fecha')
      }
      if (!db.objectStoreNames.contains('pendientes')) {
        db.createObjectStore('pendientes', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

// Registros
export async function getRegistrosLocal(fecha) {
  const db = await getDB()
  const user_id = await getUserId()
  const todos = await db.getAllFromIndex('registros', 'fecha', fecha)
  return todos.filter(r => r.user_id === user_id)
}

export async function guardarRegistroLocal(registro) {
  const db = await getDB()
  await db.put('registros', registro)
}

export async function eliminarRegistroLocal(id) {
  const db = await getDB()
  await db.delete('registros', id)
}

// Gastos
export async function getGastosLocal(fecha) {
  const db = await getDB()
  const user_id = await getUserId()
  const todos = await db.getAllFromIndex('gastos', 'fecha', fecha)
  return todos.filter(g => g.user_id === user_id)
}

export async function guardarGastoLocal(gasto) {
  const db = await getDB()
  await db.put('gastos', gasto)
}

export async function eliminarGastoLocal(id) {
  const db = await getDB()
  await db.delete('gastos', id)
}

// Operaciones pendientes de sincronizar
export async function añadirPendiente(operacion) {
  const db = await getDB()
  await db.add('pendientes', operacion)
}

export async function getPendientes() {
  const db = await getDB()
  return db.getAll('pendientes')
}

export async function eliminarPendiente(id) {
  const db = await getDB()
  await db.delete('pendientes', id)
}