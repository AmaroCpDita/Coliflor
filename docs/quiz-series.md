# Hogar inicial y quiz diarios

Para activar los cambios sobre una base con la migración 021, ejecutar **todo**
`supabase/activate-starter-and-quizzes.sql` en el SQL Editor de Supabase. Es una
transacción y se puede repetir. No reinicia mundos, borra respuestas ni modifica
preguntas publicadas. También están disponibles las migraciones 022, 023 y 024 por separado, en ese orden.

La Casa del Árbol es el hogar del nivel 1. El regalo ahora incluye ese
nivel; antes la entrega omitía el nivel 1. El inventario y los objetos colocados
se consideran antes de entregar cada objeto inicial, para conservar las copias
existentes. Las claves de recompensa evitan que se reponga el paquete al reabrirlo.
La app consulta las recompensas pendientes sin entregarlas automáticamente. Al
tocar el regalo se reciben todas las recompensas de los niveles pendientes en una
transacción. El regalo vuelve a activarse al alcanzar un nuevo nivel. Las
recompensas son compartidas: ambos ven cuándo ya se recogieron.

`submit_daily_quiz` valida la pareja, la fecha de Santiago, el ID del quiz y las cinco
respuestas. Guarda y entrega 5 XP por miembro y fecha en una sola transacción.
Los reintentos conservan la primera respuesta y no suman XP. Las respuestas previas
a la activación no reciben XP retroactivo. El cliente conserva el guardado normal
si la RPC todavía no está instalada y solo anuncia la XP confirmada por el servidor.

La serie contiene 30 quiz (150 preguntas nuevas), del **4 de octubre al 2 de noviembre
de 2026**. La fecha determina una edición fija, compartida por ambos miembros.
El quiz del 3 de octubre se conserva para no alterar respuestas ya enviadas.
Al agotarse la serie se muestra que faltan preguntas nuevas; nunca vuelve al inicio.
Un registro en PostgreSQL impide publicar la misma pregunta en otra fecha.

Para ampliar la serie, **agregar** ediciones al final de `src/lib/quizSeries.ts`.
No cambiar, eliminar ni reordenar las ya publicadas. Ejecutar
`node scripts/build-quiz-series.mjs` y aplicar los nuevos registros de la migración
023: los existentes se conservan con `ON CONFLICT DO NOTHING`. Mantener este contenido
como una nueva migración incremental si se usa un sistema de despliegue de migraciones.

Validación:

- `node scripts/check-quiz-series.mjs`: preguntas únicas, fechas estables y agotamiento.
- `node scripts/check-starter-quiz-sql.mjs`: entrega inicial, XP, autorización y reintentos
  en PostgreSQL con PGlite instalado en `tmp.local/sql-check`.
- `node scripts/check-world-editor.mjs`: edición, halo nocturno y catálogo.
- `npm run build`.
