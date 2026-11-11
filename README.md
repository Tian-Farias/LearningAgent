# LearningAgent

Este repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.

El nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.

Cada versión es una carpeta independiente (`lagent-vXXX/`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.

## Cómo está organizado

- Una carpeta por versión: `lagent-v000/`, `lagent-v001/`, etc.
- Dentro de cada carpeta, un archivo por funcionalidad: `main.py` (el bucle del chat), `config.py` (configuración), `llm.py` (llamada al modelo), `commands.py` (comandos), `memory.py` (historial, desde v001) y `compaction.py` (resumen de lo viejo, desde v003).
- Desde v001, las sesiones de cada versión se guardan en su propia carpeta: `memory/` en v001 y `mem_session/` desde v002.
- Desde v002, cada versión lleva su propio archivo de configuración, `lagent.toml`.
- El `main.py` de cada versión empieza con un comentario que explica qué hace.
- Cada versión se puede ejecutar sola, desde cualquier carpeta.
- La carpeta [bench/](bench/) tiene las herramientas para medir y comparar las versiones (ver [Benchmarks](#benchmarks)).

## Versiones

| Versión | Carpeta | Qué agrega |
|---------|---------|------------|
| v000 | [lagent-v000/](lagent-v000/) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat. |
| v001 | [lagent-v001/](lagent-v001/) | Agrega memoria: guarda el historial de mensajes en una variable y en un archivo, para que el modelo recuerde la conversación y esta sobreviva entre sesiones. Muestra los tokens enviados en cada mensaje para ver cómo crece el costo. |
| v002 | [lagent-v002/](lagent-v002/) | Agrega la ventana de memoria: guarda en disco el historial completo, pero envía al modelo solo los últimos mensajes. Lee la configuración de `lagent.toml`. |
| v003 | [lagent-v003/](lagent-v003/) | Agrega la compactación: cuando la conversación supera un umbral de tokens, resume los mensajes viejos con el modelo y los reemplaza por el resumen. Agrega el comando `/memoria`. |

> Esta tabla crece a medida que el agente evoluciona.

## Requisitos

- Python 3.11 o superior (desde `lagent-v002/` se usa `tomllib`)
- [litellm](https://github.com/BerriAI/litellm): `pip install -r requirements.txt`
- Variables de entorno:
  - `API_KEY`: clave de la API del proveedor.
  - `BASE_URL`: URL base del modelo.
  - `MODEL` (opcional): modelo a usar, con el formato `proveedor/modelo`. En v000 y v001 el valor por defecto es `anthropic/claude-haiku-5-5`; desde v002 tiene prioridad sobre `lagent.toml`.

## Uso

```bash
export API_KEY="tu-clave"
export BASE_URL="https://tu-endpoint"
cd lagent-v000
python main.py
```

Escribe un mensaje después del prompt `>>>` y presiona Enter para enviarlo al modelo. Si solo presionas Enter, no se envía nada.

### Sesiones y memoria (v001)

Desde v001 el chat recuerda la conversación. Cada sesión se guarda en `memory/<nombre>.json`, dentro de la carpeta de la versión, y se carga al arrancar:

```bash
cd lagent-v001
python main.py            # sesión "default"
python main.py trabajo    # sesión "trabajo"
```

Al abrir una sesión existente, el modelo retoma la conversación donde quedó.

El nombre de la sesión solo puede tener letras, números, `-` y `_`. Cualquier otro nombre (por ejemplo `../x` o uno vacío) se rechaza, para que nunca se escriba fuera de `memory/`. Los archivos de sesión están en el `.gitignore`.

Antes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados (`[tokens enviados: 1234]`), si el proveedor la informa. Sirve para ver cómo crece el costo a medida que el historial se alarga.

Casos especiales:

- Si el modelo devuelve una respuesta vacía, no se guarda en la memoria (un mensaje vacío en el historial podría hacer que la API rechace todos los mensajes siguientes). Se avisa y se puede reintentar.
- Si la llamada al modelo falla, el error se muestra pero no entra a la memoria, y el mensaje del usuario se descarta para poder reintentar sin duplicarlo.
- Si falla el guardado en disco, el chat sigue funcionando con la memoria en RAM y solo se avisa.

> **Limitación: este sistema de memoria es ineficiente.** El historial completo se envía al modelo en cada mensaje, y solo se vacía de forma manual con `/clear`. Con el tiempo la memoria crece sin límite, así que cada mensaje lleva más contexto que el anterior. Como las APIs cobran por los tokens que se envían, el costo de cada respuesta aumenta a medida que la sesión se alarga, y eventualmente se puede superar el límite de contexto del modelo. Que la limpieza dependa del usuario hace que, en la práctica, casi nunca se haga. Las siguientes versiones tendrán que resolver esto.

### Configuración (v002)

Desde v002, el comportamiento del agente se define en un `lagent.toml` junto a su código, y cada versión tiene el suyo:

```toml
model = "anthropic/claude-haiku-5-5"
system_prompt = "Eres un asistente útil."

[memory]
dir = "mem_session"
window = 8
```

| Clave | Qué define |
|-------|------------|
| `model` | Modelo a usar, con el formato `proveedor/modelo`. La variable de entorno `MODEL` tiene prioridad sobre este valor. |
| `system_prompt` | Instrucciones generales para el modelo. |
| `memory.dir` | Carpeta de las sesiones, relativa a la carpeta de la versión. También acepta una ruta absoluta. |
| `memory.window` | Cantidad máxima de mensajes que se envían al modelo. Debe ser un entero mayor que 0. |

Las claves comentadas en el archivo corresponden a versiones futuras. `API_KEY` y `BASE_URL` siguen en variables de entorno, para que el archivo se pueda versionar sin datos sensibles.

El código no tiene valores por defecto. Si el archivo no existe, tiene un error de sintaxis, o le falta una clave o alguna tiene un valor no válido, el agente muestra el error y termina al arrancar. `model`, `system_prompt` y `memory.dir` deben ser textos no vacíos. `model` puede faltar si está definida la variable `MODEL`.

### Ventana de memoria (v002)

v002 separa la memoria guardada de la memoria enviada: el archivo de la sesión conserva el historial completo, pero al modelo solo le llegan los últimos mensajes, como máximo `memory.window`. Así, lo que se envía deja de crecer a medida que la sesión se alarga.

La ventana siempre empieza en un mensaje `user`, para que el modelo no reciba una respuesta sin su pregunta. Si el corte cae en una respuesta, esa también queda fuera, así que a veces se envía un mensaje menos que `window`: en un chat normal, con `window = 20` se envían 19.

Antes de cada respuesta se muestra cuánto se envió del historial y, si el proveedor la informa, la cantidad de tokens:

```text
[mensajes enviados: 19 de 45, tokens enviados: 1234]
```

Para comparar con v001 en la misma conversación, copia la sesión a v002, porque usan el mismo formato:

```bash
mkdir -p lagent-v002/mem_session
cp lagent-v001/memory/trabajo.json lagent-v002/mem_session/trabajo.json
```

Después ejecuta `python main.py trabajo` en la carpeta de cada versión y envía el mismo mensaje en ambas. La diferencia de tokens muestra lo que ahorra la ventana.

> **Limitación: el modelo olvida de golpe.** Lo que queda fuera de la ventana desaparece por completo para el modelo, aunque siga en el archivo. Un dato importante dicho al principio, como un nombre o una decisión, se olvida sin aviso cuando sale de la ventana, y el modelo puede contradecirlo o inventar otro. Además, la ventana cuenta mensajes y no tokens, así que unos pocos mensajes muy largos todavía pueden costar mucho o superar el límite de contexto. Las siguientes versiones tendrán que resolver esto.

### Compactación (v003)

v003 ya no olvida de golpe. Antes de enviar cada mensaje, si la conversación supera un umbral de tokens, le pide al modelo que resuma los mensajes viejos y los reemplaza por el resumen. Al modelo le llega todo lo que queda: el resumen en el prompt de sistema y luego los mensajes recientes. Por eso v003 ya no usa `window`: si la ventana siguiera, los mensajes saldrían de ella antes de llegar al umbral y se perderían sin resumirse.

El disparo se mide en tokens porque el costo y el límite de contexto se miden en tokens: 20 mensajes cortos no justifican compactar, y 3 muy largos sí. El corte se hace por turnos porque debe caer en un límite limpio de la conversación. Un turno es un mensaje `user` y lo que le sigue hasta el próximo `user`.

```toml
[memory]
dir = "mem_session"
compact_at_tokens = 8000
keep_recent_turns = 3
```

| Clave | Qué define |
|-------|------------|
| `memory.compact_at_tokens` | Umbral de tokens sobre el que se compacta. Debe ser un entero mayor que 0. |
| `memory.keep_recent_turns` | Cantidad máxima de turnos recientes que se conservan sin resumir, incluido el mensaje actual. Debe ser un entero mayor que 0. |

La compactación busca dejar la conversación bajo la mitad del umbral, para no repetirse en el mensaje siguiente. Con `compact_at_tokens = 8000`, el resumen tiene un tope de 2000 tokens y los turnos recientes, otros 2000. Si los turnos no caben, se conservan menos. Así, unos turnos largos no pueden impedir que se compacte, pero con un umbral muy bajo un mensaje normal podría no caber: conviene que sea holgado, al menos de unos miles de tokens.

El archivo de la sesión guarda el resumen junto con los mensajes recientes (`{"summary": ..., "messages": [...]}`). v003 también puede abrir las sesiones de v001 y v002, y las convierte a este formato.

El resumen tiene tres secciones fijas: `## Hechos`, `## Decisiones` y `## Pendientes`. En cada compactación, el modelo recibe el resumen anterior y lo actualiza con los mensajes nuevos, en vez de resumir un resumen. Así se reduce el riesgo de que se degrade con cada pasada.

Cuando se compacta, se avisa cuántos tokens libera, según una estimación local que puede diferir un poco de lo que cobra el proveedor:

```text
[compactación: 100 mensajes resumidos, 8040 -> 456 tokens estimados, 7584 liberados]
```

El comando `/memoria` muestra lo que el agente recuerda en ese momento: el resumen completo y los mensajes recientes, cada uno recortado a 200 caracteres.

Casos especiales:

- Si el modelo falla al resumir, o el resumen se corta en el tope o no trae las tres secciones, se avisa y el historial queda intacto. Se vuelve a intentar con el próximo mensaje.
- Si el resumen no libera tokens, se descarta.
- Si el mensaje actual no cabe en el espacio de los turnos recientes, por ejemplo un log pegado, se avisa y se envía sin compactar. Se compacta con el mensaje siguiente.
- El archivo de la sesión se guarda solo con el intercambio completo. Si interrumpes con `Ctrl+C` o falla el envío, queda como estaba tras el último intercambio.

#### Comparación de v001, v002 y v003

Esta es la misma conversación de 80 mensajes de la persona, con `window = 8` en v002, y `compact_at_tokens = 8000` y `keep_recent_turns = 3` en v003. El dato "Mi proyecto se llama Aurora" va en el primer mensaje.

| Mensaje | v001 | v002 | v003 |
|---------|------|------|------|
| 1 | 84 | 84 | 84 |
| 20 | 2991 | 537 | 2991 |
| 40 | 6051 | 537 | 6051 |
| 60 | 9111 | 537 | 1527 |
| 80 | 12171 | 537 | 4587 |
| **Tokens totales enviados** | 490200 | 42066 | 285630 |
| **¿Sigue enviando el dato en el mensaje 80?** | Sí | No, lo pierde desde el mensaje 5 | Sí, en el resumen |

Son tokens estimados con el contador local de `litellm`. **Las respuestas y el resumen son simulados, sin llamadas a la API.** La tabla sirve para ver la forma de cada curva, no el costo real, y el dato sigue en v003 porque el resumen simulado lo incluye: un modelo real podría omitirlo. El total de v003 incluye 7782 tokens de su única compactación.

v002 es la más barata, pero olvida. v001 lo recuerda todo, pero su costo crece sin límite. v003 conserva lo importante con un costo acotado, aunque hasta llegar al umbral cuesta lo mismo que v001.

Para repetir la comparación con un modelo real, copia una misma sesión a las carpetas de cada versión y envía el mismo mensaje en las tres. v003 compacta antes de enviarlo si la sesión supera el umbral. Para una medición completa, con una conversación guionada y preguntas de control, usa los [benchmarks](#benchmarks).

#### Un mensaje enorme: por qué contar tokens y no mensajes

La ventana de v002 es ciega al tamaño. En esta conversación de 30 mensajes, simulada igual que la anterior, el mensaje 20 es un log pegado:

| Mensaje | v002: tokens (mensajes) | v003: tokens (mensajes) |
|---------|-------------------------|-------------------------|
| 19 | 537 (7) | 2832 (37) |
| 20 | 6892 (7) | 9340 (39) |
| 21 | 6892 (7) | 143 (1) |
| 23 | 6892 (7) | 449 (5) |
| 24 | 537 (7) | 602 (7) |

v002 sigue enviando siempre 7 mensajes, pero durante cuatro mensajes cuesta 13 veces más, y aun así olvida lo anterior. v003 avisa en el mensaje 20 y lo compacta en el 21. El costo de esa rapidez es que el log solo queda en el resumen: si la persona pregunta por una línea concreta en el mensaje 21, el modelo ya no la tiene.

> **Limitación: el resumen reemplaza, y sigue sin haber acción.** Los mensajes resumidos ya no se pueden recuperar, ni siquiera del archivo, y si el modelo omite algo al resumir, ese dato se pierde sin aviso. Un mensaje muy largo se resume en cuanto llega el siguiente, aunque la conversación siga hablando de él. Cada compactación es además una llamada más al modelo, y un resumen rechazado se paga y se vuelve a intentar con el próximo mensaje. Con esto la memoria queda mejor resuelta, pero el agente todavía solo conversa: no puede hacer nada. Las siguientes versiones tendrán que resolver esto.

### Comandos

Los comandos empiezan con `/` y no se envían al modelo. No distinguen mayúsculas de minúsculas.

| Comando | Qué hace |
|---------|----------|
| `/clear` | Borra la memoria de la sesión actual (v001 en adelante). |
| `/memoria` | Muestra el resumen y los mensajes recientes (v003 en adelante). |
| `/help` | Muestra los comandos disponibles. |
| `/exit` o `/quit` | Sale del chat. |

Cualquier otro texto que empiece con `/` muestra `Comando desconocido` y no se envía al modelo. También puedes salir con `Ctrl+C` o `Ctrl+D`.

## Benchmarks

La carpeta [bench/](bench/) mide las versiones con datos reales, sin modificar su código. Responde dos preguntas con números:

1. **¿Cuánto cuesta cada versión?** Cuántos tokens se envían al modelo en cada mensaje y cuánto crece eso a lo largo de la conversación.
2. **¿Cuánto recuerda cada versión?** Si después de muchos mensajes el agente todavía sabe lo que se le dijo al principio.

Cada versión recibe la misma conversación guionada de 100 mensajes, con datos plantados en distintos momentos y preguntas de control cuya respuesta se conoce de antemano. `run.py` ejecuta una versión y registra cada llamada al modelo, y `report.py` compara las corridas:

```bash
cd bench
BENCH_MOCK=1 python run.py ../lagent-v002 conversacion.json   # prueba sin llamar a la API
python run.py ../lagent-v003 conversacion.json                 # medición real
python report.py conversacion.json runs/*.jsonl
```

Una medición real de las cuatro versiones gasta del orden de 2 millones de tokens de entrada. Revisa el precio de tu modelo antes de lanzarla.

El detalle de cómo funciona, qué se registra y cómo crear tus propios guiones está en el [README de bench](bench/README.md).

## Objetivo

Entender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.
