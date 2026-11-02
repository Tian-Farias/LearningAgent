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

### Comandos

Los comandos empiezan con `/` y no se envían al modelo. No distinguen mayúsculas de minúsculas.

| Comando | Qué hace |
|---------|----------|
| `/help` | Muestra los comandos disponibles. |
| `/exit` o `/quit` | Sale del chat. |

Cualquier otro texto que empiece con `/` muestra `Comando desconocido` y no se envía al modelo. También puedes salir con `Ctrl+C` o `Ctrl+D`.

## Objetivo

Entender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.
