# Memoria del agente: carga y guarda el historial de cada sesión en un archivo.

import json
import os

# Carga el historial de una sesión desde su archivo.
# Si el archivo no existe (sesión nueva) o está dañado, empieza con un historial vacío.
# Un JSON válido que no sea una lista de mensajes también se considera dañado.
def load_memory(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("el archivo no contiene una lista de mensajes")
        return data
    except (ValueError, OSError) as e:  # JSONDecodeError es un tipo de ValueError
        print(f"No se pudo leer la sesión ({e}). Se empieza con memoria vacía.")
        return []

# Guarda el historial completo en el archivo de la sesión.
# Se escribe primero a un archivo temporal y luego se reemplaza, para no dejar
# el archivo a medias si el programa se corta mientras escribe.
def save_memory(path, messages):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)
