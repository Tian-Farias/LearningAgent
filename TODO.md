# TODO: LearningAgent

Hoja de ruta para las próximas versiones de `lagent`. Cada versión agrega una sola capacidad y deja a la vista la limitación que motiva la siguiente.

Las versiones ya construidas tienen su capítulo en la carpeta de cada una, y el [README raíz](README.md#cómo-leer-esta-historia) explica en qué orden leerlos. Esta hoja de ruta es lo que viene. Cuando una versión se construye, sus casillas se marcan aquí y su historia pasa a contarse en su propio README.

## v001: pendientes de cierre

- [x] Quitar los espacios al final de línea en `"role": "system", `, `"role": "user", ` y `"role": "assistant", ` (`ruff check --select W291 --fix lagent-v001.py`)

## Arco 1: memoria

Meta: que el agente recuerde la conversación con un costo acotado. El arco empieza en v001, que da memoria reenviando todo el historial.

### v002: ventana de memoria

Resuelve: el historial crece sin límite (la limitación que ya plantea el README).

- [x] Archivo Toml de configuracion para parametros de comportamiento.
- [x] Decidir la estructura del repo: seguir con un archivo por versión o pasar a carpetas (`v004/agent.py`, `v004/tools.py`)
- [x] Enviar al modelo solo los últimos N mensajes, configurable en el archivo toml (window)
- [x] Cortar siempre en un mensaje `user`, para que el historial enviado no empiece con `assistant`
- [x] Guardar en disco el historial completo y enviar solo la ventana (memoria guardada y memoria enviada son cosas distintas)
- [x] Mostrar los tokens enviados para comparar con v001 en la misma conversación
- [x] README: explicar la limitación que deja, el modelo olvida de golpe lo que queda fuera de la ventana

### v003: compactación

Resuelve: la ventana pierde contexto importante.

- [x] Cuando los tokens superen un umbral, resumir los mensajes viejos con el modelo y reemplazarlos por el resumen
- [x] Resumen con secciones fijas (hechos, decisiones, pendientes), para que no se degrade resumen tras resumen
- [x] Guardar el resumen en la sesión junto con los mensajes recientes
- [x] Comando `/memoria` para ver qué recuerda el agente en ese momento
- [x] Mostrar cuándo se compacta y cuántos tokens libera
- [x] README: comparar v001, v002 y v003 con la misma conversación

## Arco 2: de chat a agente

### v004: tools y loop

Resuelve: el sistema solo conversa, no puede hacer nada.

- [ ] Definir tools con schema (partir con dos inofensivas, por ejemplo leer un archivo y consultar la hora)
- [ ] Loop: si el modelo pide una tool, se ejecuta, se devuelve el resultado y se vuelve a llamar al modelo hasta que responda con texto
- [ ] Guardar en memoria los mensajes de tool call y de tool result, respetando el pareo entre ambos
- [ ] `send_message` devuelve la respuesta completa del modelo, ya no solo el texto (las respuestas con tool calls pueden traer contenido vacío)

### v005: guardrails

Resuelve: el agente puede ejecutar cualquier cosa y quedarse en un loop.

- [ ] Allowlist de tools y de comandos
- [ ] Paths confinados a una carpeta de trabajo
- [ ] Tope de pasos por mensaje del usuario
- [ ] Recortar resultados largos de tools antes de devolverlos al modelo
- [ ] Los bloqueos vuelven al modelo como resultado de la tool, sin cortar el loop

### v006: sensores y gate

Resuelve: el modelo se autodeclara listo sin evidencia.

- [ ] Interfaz de sensor (`applies`, `check`) para no acoplar el loop a un tipo de tarea
- [ ] Sensores al cierre de cada paso si hubo cambios, con los fallos redactados como pendientes y no como órdenes
- [ ] Deduplicar: si el fallo es igual al del paso anterior, avisar que se repite y sugerir cambiar de enfoque
- [ ] Tool `complete_task` que el harness acepta solo si los sensores pasan
- [ ] Cortar la sesión si el mismo fallo se repite varias veces seguidas
- [ ] Memoria entre sesiones: `progress.md` con lo hecho y un handoff cuando se acaba el presupuesto de pasos

## Arco 3: observabilidad y aislamiento

### v007: trazas

Resuelve: no se sabe qué pasó adentro del loop.

- [ ] Árbol de spans en JSONL: sesión, paso, llamada al modelo, tool, sensor, gate, bloqueo
- [ ] Guardar tokens, latencias, `stop_reason` y el texto del modelo entre tools
- [ ] No guardar contenido completo de archivos escritos, solo largo y hash
- [ ] Totales en el span raíz para comparar corridas
- [ ] Script `trace_report.py` que muestra el árbol, con opción `--errors`
- [ ] Nota: se puede adelantar justo después de v004, porque ayuda a depurar todo lo que viene

### v008: sandbox

Resuelve: los guardrails por allowlist son frágiles.

- [ ] Las tools corren dentro de un contenedor Docker de larga vida por sesión
- [ ] Contenedor sin red, rootfs de solo lectura, sin capabilities, usuario no root y con límites de recursos
- [ ] Trabajo sobre un git worktree en rama propia, el repo original no se toca
- [ ] Al terminar, la rama queda lista para revisar como un PR

## Arco 4: escala

### v009: varios modelos por rol

Resuelve: costo y sesgo de autoevaluación con un solo modelo.

- [ ] Tabla de modelos por rol (planificador, trabajador, revisor, compactador)
- [ ] Revisor de otra familia de modelos
- [ ] Escalar al modelo grande cuando se repiten los fallos
- [ ] Todo a través del gateway, con el rol registrado en las trazas

### v010: orquestador y sub-agentes

Resuelve: tareas grandes que no caben en un solo contexto.

- [ ] Planificador que produce un plan estructurado (JSON) como contrato común
- [ ] Sub-agentes en paralelo con contexto aislado y un semáforo de concurrencia
- [ ] Sensores por unidad de trabajo, con reintentos acotados
- [ ] Integrador final y gate sobre el resultado completo
- [ ] Ejemplo fuera de código: redacción de un documento por secciones

## Transversal

- [ ] Cada versión con su fila en la tabla del README y su sección de limitaciones
- [ ] Mantener cada versión ejecutable sola
- [ ] Ejemplos reproducibles en el README para comparar versiones con la misma entrada