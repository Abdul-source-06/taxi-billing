import { supabase } from './supabase'
import { getPendientes, eliminarPendiente, guardarRegistroLocal, guardarGastoLocal, eliminarRegistroLocal, eliminarGastoLocal } from './db'

export async function sincronizar() {
  if (!navigator.onLine) return

  const pendientes = await getPendientes()
  if (pendientes.length === 0) return

  console.log(`Sincronizando ${pendientes.length} operaciones pendientes...`)

  const { data: { session } } = await supabase.auth.getSession()
  const user_id = session?.user?.id
  if (!user_id) return

  for (const op of pendientes) {
    try {
      if (op.tipo === 'insertar_registro') {
        const { data } = await supabase.from('registros').insert([{ ...op.datos, user_id }]).select()
        if (data) {
          await guardarRegistroLocal(data[0])
          await eliminarPendiente(op.id)
        }
      } else if (op.tipo === 'eliminar_registro') {
        await supabase.from('registros').delete().eq('id', op.datos.id)
        await eliminarRegistroLocal(op.datos.id)
        await eliminarPendiente(op.id)
      } else if (op.tipo === 'editar_registro') {
        const { data } = await supabase
          .from('registros')
          .update({ importe: op.datos.importe, tipo: op.datos.tipo, notas: op.datos.notas })
          .eq('id', op.datos.id)
          .select()
        if (data) {
          await guardarRegistroLocal(data[0])
          await eliminarPendiente(op.id)
        }
      } else if (op.tipo === 'insertar_gasto') {
        const { data } = await supabase.from('gastos').insert([{ ...op.datos, user_id }]).select()
        if (data) {
          await guardarGastoLocal(data[0])
          await eliminarPendiente(op.id)
        }
      } else if (op.tipo === 'eliminar_gasto') {
        await supabase.from('gastos').delete().eq('id', op.datos.id)
        await eliminarGastoLocal(op.datos.id)
        await eliminarPendiente(op.id)
      }
    } catch (err) {
      console.error('Error sincronizando operación:', err)
    }
  }

  console.log('Sincronización completada')
}