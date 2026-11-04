# LearningAgent

Este repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.

El nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.

Cada versión es un archivo independiente (`lagent-vXXX.py`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.

## Cómo está organizado

- Un archivo por versión: `lagent-v000.py`, `lagent-v001.py`, etc.
- Cada archivo empieza con un comentario que explica qué hace y qué le falta.
- Cada versión se puede ejecutar sola.

## Versiones

| Versión | Archivo | Qué agrega |
|---------|---------|------------|
| v000 | [lagent-v000.py](lagent-v000.py) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat. |
| v001 | [lagent-v001.py](lagent-v001.py) | Agrega memoria: guarda el historial de mensajes en una variable y en un archivo, para que el modelo recuerde la conversación y esta sobreviva entre sesiones. |

> Esta tabla crece a medida que el agente evoluciona.

## Requisitos

- Python 3
- [litellm](https://github.com/BerriAI/litellm): `pip install litellm`
- Variables de entorno:
  - `API_KEY`: clave de la API del proveedor.
  - `BASE_URL`: URL base del modelo.
  - `MODEL` (opcional): modelo a usar, con el formato `proveedor/modelo`. Por defecto `anthropic/claude-haiku-5-5`.

## Uso

```bash
export API_KEY="tu-clave"
export BASE_URL="https://tu-endpoint"
python lagent-v000.py
```

Escribe un mensaje después del prompt `>>>` y presiona Enter para enviarlo al modelo. Si solo presionas Enter, no se envía nada.

### Sesiones y memoria (v001)

Desde v001 el chat recuerda la conversación. Cada sesión se guarda en `memory/<nombre>.json` y se carga al arrancar:

```bash
python lagent-v001.py            # sesión "default"
python lagent-v001.py trabajo    # sesión "trabajo"
```

El nombre de la sesión solo puede tener letras, números, `-` y `_`. Cualquier otro nombre (por ejemplo `../x` o uno vacío) se rechaza, para que nunca se escriba fuera de `memory/`. Los archivos de sesión están en el `.gitignore`.

Antes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados (`[tokens enviados: 1234]`), si el proveedor la informa. Sirve para ver cómo crece el costo a medida que el historial se alarga.

Al abrir una sesión existente, el modelo retoma la conversación donde quedó.

> **Limitación: este sistema de memoria es ineficiente.** El historial completo se envía al modelo en cada mensaje, y solo se vacía de forma manual con `/clear`. Con el tiempo la memoria crece sin límite, así que cada mensaje lleva más contexto que el anterior. Como las APIs cobran por los tokens que se envían, el costo de cada respuesta aumenta a medida que la sesión se alarga, y eventualmente se puede superar el límite de contexto del modelo. Que la limpieza dependa del usuario hace que, en la práctica, casi nunca se haga. Las siguientes versiones tendrán que resolver esto.

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
