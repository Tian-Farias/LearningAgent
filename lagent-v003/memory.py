# Memoria del agente: carga y guarda cada sesión en un archivo, con el resumen de lo
# compactado y los mensajes recientes.

import json
import os

# Comprueba que el historial sea una lista de mensajes con rol y texto.
def is_message_list(data):
    return isinstance(data, list) and all(
        isinstance(m, dict) and isinstance(m.get("role"), str) and isinstance(m.get("content"), str)
        for m in data
    )

# Carga una sesión desde su archivo: {"summary": texto, "messages": lista de mensajes}.
# Si el archivo no existe (sesión nueva) o está dañado, empieza con la memoria vacía.
# Las sesiones de v001 y v002 son solo una lista de mensajes: se cargan sin resumen.
def load_memory(path):
    if not os.path.exists(path):
        return {"summary": "", "messages": []}
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            data = {"summary": "", "messages": data}
        if not isinstance(data, dict) or not isinstance(data.get("summary"), str) or not is_message_list(data.get("messages")):
            raise ValueError("el archivo no contiene una sesión válida")
        return {"summary": data["summary"], "messages": data["messages"]}
    except (ValueError, OSError) as e:  # JSONDecodeError es un tipo de ValueError
        print(f"No se pudo leer la sesión ({e}). Se empieza con memoria vacía.")
        return {"summary": "", "messages": []}

# Guarda el resumen y los mensajes recientes en el archivo de la sesión.
# Se escribe primero a un archivo temporal y luego se reemplaza, para no dejar
# el archivo a medias si el programa se corta mientras escribe.
def save_memory(path, memory):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(memory, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)

# Agrega el resumen a las instrucciones del modelo. Va en el prompt de sistema y no como
# un mensaje más, para no alterar la alternancia entre "user" y "assistant".
def build_system_prompt(system_prompt, summary):
    if not summary:
        return system_prompt
    return f"{system_prompt}\n\nResumen de la conversación hasta ahora:\n{summary}"

# Devuelve las posiciones donde empieza cada turno: un turno es un mensaje "user" y lo que
# le sigue hasta el próximo "user". Cortar ahí evita dejar una respuesta sin su pregunta.
def turn_starts(messages):
    return [i for i, message in enumerate(messages) if message["role"] == "user"]
