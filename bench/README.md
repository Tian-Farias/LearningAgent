# bench: medir cómo se comporta cada versión

> [Índice de la historia](../README.md#cómo-leer-esta-historia) · Esta carpeta guarda la herramienta que compara las versiones del agente entre sí.

Cada versión de `lagent` termina con una limitación que motiva la siguiente. En el [arco de la memoria](../README.md#arco-1-memoria), [v001](../lagent-v001/README.md) recuerda todo pero su costo crece sin límite, [v002](../lagent-v002/README.md) acota el costo pero olvida de golpe, y [v003](../lagent-v003/README.md) resume lo viejo para conservarlo. Los READMEs de cada versión cuentan esas limitaciones con ejemplos cortos. Esta carpeta las mide.

Tiene las herramientas para medir las versiones con datos reales. Sirve para responder dos preguntas con números en lugar de intuición:

1. **¿Cuánto cuesta cada versión?** Cuántos tokens se envían al modelo en cada mensaje y cuánto crece eso a lo largo de una conversación.
2. **¿Cuánto recuerda cada versión?** Si después de muchos mensajes el agente todavía sabe lo que le contaste al principio.

## Antes de empezar: algunos conceptos

Si es la primera vez que trabajas con modelos de lenguaje, estas ideas te van a ayudar a entender lo que mide esta carpeta.

**Token.** Los modelos leen el texto en pedazos llamados tokens. Un token es más o menos una palabra corta o un pedazo de una palabra larga. Las APIs cobran por token: por los que les envías y por los que te responden.

**Turno.** Un mensaje tuyo más la respuesta del modelo. Una conversación de 100 turnos son 100 preguntas con sus 100 respuestas.

**Contexto.** Todo lo que el modelo recibe en cada llamada. El modelo no recuerda nada por sí solo: si queremos que "se acuerde" de algo, hay que volver a enviárselo. Por eso la memoria cuesta tokens, y por eso cada versión de `lagent` maneja la memoria de una forma distinta.

**Pregunta de control.** Una pregunta cuya respuesta conocemos de antemano. Si en el turno 1 decimos "me llamo Aurora" y en el turno 50 preguntamos "¿cómo me llamo?", la respuesta debería contener "Aurora". Así medimos la memoria sin tener que leer las 100 respuestas.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
| --- | --- |
| `conversacion.json` | El guion: los 100 mensajes que se le envían al agente, en orden. |
| `run.py` | Ejecuta una versión con el guion y registra cada llamada al modelo. |
| `report.py` | Lee los registros y arma un resumen comparando las versiones. |
| `runs/` | Carpeta que se crea al ejecutar, con los registros de cada corrida. |

## Cómo funciona

### Medir sin tocar las versiones

Cada carpeta `lagent-vXXX/` es una foto congelada de un momento del proyecto. Si agregáramos código de medición dentro de cada versión, dejarían de ser fieles a cómo eran. Por eso `run.py` mide desde afuera.

Todas las versiones hablan con el modelo a través de la misma función: `litellm.completion`. Antes de ejecutar una versión, `run.py` reemplaza esa función por otra que hace exactamente lo mismo, pero que además anota cada llamada en un archivo:

```python
original = litellm.completion

def recorded(*args, **kwargs):
    t0 = time.perf_counter()
    ...
    response = original(*args, **kwargs)   # la llamada real, sin cambios
    ...
    write(out, version, turn["n"], kwargs, response, error, time.perf_counter() - t0, with_content)

litellm.completion = recorded
```

Esta técnica se llama *monkey patching*: cambiar una función mientras el programa corre. La versión cree que llama a litellm como siempre, y en el camino queda el registro.

### Escribir por la persona

Las versiones leen lo que escribes en la terminal. `run.py` les entrega las líneas del guion una a una por la entrada estándar, como si alguien las tecleara, y al final escribe `/exit` para cerrar el chat.

Cada corrida usa una sesión con un nombre único (por ejemplo `bench-20261111-110500`), y al terminar `run.py` la borra. Así las mediciones no se mezclan con tus sesiones normales.

### El guion

`conversacion.json` es una lista de pasos. Cada paso tiene el texto que se envía (`say`) y, si es una pregunta de control, lo que se espera encontrar en la respuesta (`expect`):

```json
[
  {"say": "Hola, me llamo Aurora y administro servidores Linux."},
  {"say": "¿Qué es un sistema de archivos?"},
  {"say": "¿Te acuerdas de cómo me llamo?", "expect": "Aurora"},
  {"say": "¿Cómo me llamo y desde dónde trabajo?", "expect": ["Aurora", "Valparaíso"]}
]
```

Si `expect` es una lista, todos los textos deben aparecer en la respuesta.

El guion incluido está armado así:

- **Datos plantados en distintos momentos:** el nombre (turno 1), la ciudad (turno 3), la distribución de Linux favorita (turno 5), el nombre del servidor (turno 12) y la herramienta del equipo (turno 30). Los datos más antiguos son los más difíciles de recordar.
- **Un dato que cambia:** en el turno 55 la ciudad pasa de Temuco a Valparaíso. Sirve para ver si el agente se queda con el dato nuevo.
- **Preguntas de relleno** sobre Linux e infraestructura, para que la conversación crezca.
- **Diez preguntas de control** repartidas entre el turno 10 y el 100.

## Requisitos

Los mismos que para ejecutar `lagent` (ver [Requisitos](../README.md#requisitos) en el README de la raíz):

- Python 3.11 o superior.
- `litellm` instalado (`pip install -r requirements.txt` desde la raíz).
- Las variables de entorno del proveedor, como se explica en [Conectarse a un proveedor](../README.md#conectarse-a-un-proveedor). No hacen falta para la prueba con `BENCH_MOCK=1`.

## Cómo usarlo

### 1. Prueba sin gastar tokens

Antes de usar un modelo real, conviene comprobar que todo funciona con el modo de prueba. Con `BENCH_MOCK=1`, `run.py` reemplaza las respuestas del modelo por respuestas simuladas, sin conectarse a ninguna API:

```bash
cd bench
BENCH_MOCK=1 python run.py ../lagent-v002 conversacion.json
```

Las respuestas simuladas sirven para probar que el registro y el reporte funcionan. Los números que producen **no sirven como medición**: las respuestas son inventadas y los tokens son estimaciones.

### 2. Medición real

```bash
cd bench
for v in v000 v001 v002 v003; do
    python run.py ../lagent-$v conversacion.json
done
```

Cada corrida deja un archivo en `runs/`, por ejemplo `runs/lagent-v001-bench-20261111-110500.jsonl`.

> **Ojo con el costo.** v001 envía toda la conversación en cada mensaje, así que en 100 turnos acumula muchos tokens. Entre las cuatro versiones son unas 400 llamadas y del orden de 2 millones de tokens de entrada. Revisa el precio de tu modelo antes de lanzarlo. Una opción es empezar por v002 y v003, y correr v001 al final.

### 3. Ver los resultados

```bash
python report.py conversacion.json runs/*.jsonl
```

El reporte tiene hasta cuatro partes. La primera resume cada versión. Este ejemplo sale de una prueba con `BENCH_MOCK=1`, por eso `tok. cobrados` vale 0 y solo la estimación local tiene sentido:

```text
versión      llamadas  errores resum. ok resum. mal  tok. cobrados  tok. estimados  tok. resp.  costo USD
lagent-v001       100        0         0          0              0         1471970        2000     0.0011
lagent-v002       100        0         0          0              0           89340        2000     0.0011
lagent-v003       103        0         3          0              0          438523        2060     0.0011
```

- **llamadas:** cuántas veces se llamó al modelo. En v003 hay más llamadas que turnos porque cada compactación es una llamada extra.
- **errores:** llamadas que fallaron.
- **resum. ok** y **resum. mal:** compactaciones de memoria que salieron bien y que fallaron. Una falla si la llamada da error o si el resumen se cortó por el tope de tokens.
- **tok. cobrados:** tokens enviados según informa el proveedor, en las llamadas exitosas. Es lo que se cobra.
- **tok. estimados:** tokens enviados según la estimación local, incluidas las llamadas que fallaron.
- **tok. resp.:** tokens que respondió el modelo.
- **costo USD:** costo calculado con la tabla de precios de litellm. Aparece `s/d` (sin dato) si litellm no conoce el precio del modelo.

La segunda parte aparece si entre las corridas está v001. Compara cada versión con ella en tokens cobrados, de entrada y de salida, y suma a v003 lo que gastan sus compactaciones. Con `BENCH_MOCK=1` no hay tokens cobrados, así que estos números no dicen nada.

La tercera parte aparece solo si hubo errores, agrupados por su texto para ver rápido qué está fallando.

La última parte revisa la memoria con las preguntas de control:

```text
turno 50 «¿Te acuerdas de cómo me llamo?» -> lagent-v001: sí, lagent-v002: no, lagent-v003: sí
```

Si la llamada de esa pregunta falló, aparece `error`, porque no hay respuesta que revisar y no corresponde contarlo como olvido. Por el mismo motivo, una corrida hecha con `--sin-contenido` muestra `sin contenido`.

Para leer el comienzo de cada respuesta, agrega `--detalle`:

```bash
python report.py conversacion.json runs/*.jsonl --detalle
```

Además, `report.py` deja el archivo `runs/tokens_por_turno.csv`, con una fila por turno y una columna por versión. Lo puedes abrir en una planilla para graficar cómo crecen los tokens en cada versión.

## Qué se registra en cada llamada

Cada línea de un archivo `.jsonl` es un objeto JSON con los datos de una llamada al modelo. JSONL significa "JSON por líneas": un objeto por línea, fácil de leer con cualquier lenguaje.

| Campo | Qué es |
| --- | --- |
| `version` | La versión medida, por ejemplo `lagent-v003`. |
| `turn` | El número del paso del guion que se estaba procesando. |
| `kind` | `chat` para una respuesta a la persona, `summary` para una compactación de memoria. |
| `model` | El modelo usado. |
| `messages_sent` | Cuántos mensajes de la conversación se enviaron (sin contar las instrucciones). |
| `system_chars` | Largo de las instrucciones del sistema, en caracteres. En v003 crece cuando incluye el resumen. |
| `has_summary` | Si las instrucciones incluían un resumen de la conversación. |
| `prompt_tokens` | Tokens enviados, según informa el proveedor. Es lo que se cobra. |
| `completion_tokens` | Tokens de la respuesta, según informa el proveedor. |
| `estimated_tokens` | Tokens enviados, estimados en tu máquina. Sirve para comparar con la cifra del proveedor. |
| `cost_usd` | Costo de la llamada, si litellm conoce el precio. |
| `seconds` | Cuánto tardó la llamada. |
| `finish_reason` | Por qué terminó la respuesta. `length` significa que se cortó por llegar al tope de tokens. |
| `error` | El error, si la llamada falló. |
| `mock` | Si la llamada fue simulada con `BENCH_MOCK`. |
| `sent` | Los mensajes enviados completos. |
| `reply` | La respuesta completa del modelo. |

Los campos `sent` y `reply` guardan la conversación completa. Si no los necesitas, usa `--sin-contenido`:

```bash
python run.py ../lagent-v003 conversacion.json --sin-contenido
```

Sin `reply` el reporte no puede revisar las preguntas de control, así que esa opción sirve solo para medir el costo.

## Cosas a tener en cuenta

- **Los modelos no responden siempre igual.** Si corres dos veces la misma versión, los números van a variar un poco. Para conclusiones firmes, conviene correr cada versión más de una vez.
- **La revisión automática es simple.** Busca el texto esperado dentro de la respuesta, sin entenderla. En la pregunta de la ciudad, una respuesta que diga "antes Temuco, ahora Valparaíso" pasa la revisión, y una que mencione las dos ciudades sin aclarar cuál es la actual también. Por eso existe `--detalle`.
- **v003 compacta según su `lagent.toml`.** Si la conversación no llega al umbral de `compact_at_tokens`, v003 se comporta igual que v001. Con respuestas reales, más largas que las simuladas, el umbral se alcanza antes.
- **Los registros guardan tus conversaciones.** Por eso la carpeta `runs/` está en el `.gitignore` de la raíz y no se sube al repositorio.
- **`runs/` se crea donde ejecutas.** `run.py` y `report.py` usan la carpeta `runs/` del directorio actual, así que conviene ejecutarlos siempre desde `bench/`.

## Crear tu propio guion

Puedes copiar `conversacion.json` y modificarlo para probar otras situaciones. Algunas ideas:

- Un dato plantado al principio y preguntado solo al final, para ver el caso más difícil.
- Mensajes muy largos (por ejemplo, un log pegado) para ver cómo afectan a la ventana de v002 y a la compactación de v003.
- Varios datos que cambian, para ver si el resumen se queda con el más reciente.

Después ejecutas `run.py` con tu archivo en lugar de `conversacion.json`.

---

> [Índice de la historia](../README.md#cómo-leer-esta-historia) · [v000](../lagent-v000/README.md) · [v001](../lagent-v001/README.md) · [v002](../lagent-v002/README.md) · [v003](../lagent-v003/README.md)
