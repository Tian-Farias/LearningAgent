# LearningAgent

Este repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.

El nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.

Cada versión es una carpeta independiente (`lagent-vXXX/`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.

## Cómo está organizado

- Una carpeta por versión: `lagent-v000/`, `lagent-v001/`, etc.
- Dentro de cada carpeta, un archivo por funcionalidad: `main.py` (el bucle del chat), `config.py` (configuración), `llm.py` (llamada al modelo), `commands.py` (comandos) y `memory.py` (historial, desde v001).
- Desde v001, las sesiones de cada versión se guardan en su propia carpeta `memory/`.
- Desde v002, cada versión lleva su propio archivo de configuración, `lagent.toml`.
- El `main.py` de cada versión empieza con un comentario que explica qué hace.
- Cada versión se puede ejecutar sola, desde cualquier carpeta.

## Versiones

| Versión | Carpeta | Qué agrega |
|---------|---------|------------|
| v000 | [lagent-v000/](lagent-v000/) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat. |
| v001 | [lagent-v001/](lagent-v001/) | Agrega memoria: guarda el historial de mensajes en una variable y en un archivo, para que el modelo recuerde la conversación y esta sobreviva entre sesiones. Muestra los tokens enviados en cada mensaje para ver cómo crece el costo. |
| v002 | [lagent-v002/](lagent-v002/) | Agrega la ventana de memoria: guarda en disco el historial completo, pero envía al modelo solo los últimos mensajes. Lee la configuración de `lagent.toml`. |

> Esta tabla crece a medida que el agente evoluciona.

## Requisitos

- Python 3.11 o superior (`lagent-v002/` usa `tomllib`)
- [litellm](https://github.com/BerriAI/litellm): `pip install litellm`
- Variables de entorno:
  - `API_KEY`: clave de la API del proveedor.
  - `BASE_URL`: URL base del modelo.
  - `MODEL` (opcional): modelo a usar, con el formato `proveedor/modelo`. En v000 y v001 el valor por defecto es `anthropic/claude-haiku-5-5`; en v002 tiene prioridad sobre `lagent.toml`.

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
dir = "memory"
window = 20
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
cp lagent-v001/memory/trabajo.json lagent-v002/memory/trabajo.json
```

Después ejecuta `python main.py trabajo` en la carpeta de cada versión y envía el mismo mensaje en ambas. La diferencia de tokens muestra lo que ahorra la ventana.

> **Limitación: el modelo olvida de golpe.** Lo que queda fuera de la ventana desaparece por completo para el modelo, aunque siga en el archivo. Un dato importante dicho al principio, como un nombre o una decisión, se olvida sin aviso cuando sale de la ventana, y el modelo puede contradecirlo o inventar otro. Además, la ventana cuenta mensajes y no tokens, así que unos pocos mensajes muy largos todavía pueden costar mucho o superar el límite de contexto. Las siguientes versiones tendrán que resolver esto.

### Comandos

Los comandos empiezan con `/` y no se envían al modelo. No distinguen mayúsculas de minúsculas.

| Comando | Qué hace |
|---------|----------|
| `/clear` | Borra la memoria de la sesión actual (v001 en adelante). |
| `/help` | Muestra los comandos disponibles. |
| `/exit` o `/quit` | Sale del chat. |

Cualquier otro texto que empiece con `/` muestra `Comando desconocido` y no se envía al modelo. También puedes salir con `Ctrl+C` o `Ctrl+D`.

## Objetivo

Entender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.
