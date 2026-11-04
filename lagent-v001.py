# lagent-v001: conversación con memoria.
# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.
# A diferencia de v000, guarda el historial de mensajes en una variable y en un
# archivo, así el modelo recuerda lo anterior y la conversación sobrevive entre sesiones.
#
# Uso: python lagent-v001.py [nombre_de_sesion]
# Cada sesión se guarda en memory/<nombre_de_sesion>.json (por defecto "default").

import json
import os
import sys
import litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.

# Configuración: la clave de API y la URL base se leen de variables de entorno
# para no dejar datos sensibles escritos en el código.
API_KEY = os.environ.get("API_KEY")
BASE_URL = os.environ.get("BASE_URL")

#  Modelo a utilizar, con el formato "proveedor/modelo" que usa litellm.
# Se puede cambiar con la variable de entorno MODEL sin tocar el código.
MODEL = os.environ.get("MODEL", "anthropic/claude-haiku-5-5")

# Instrucciones generales para el modelo.
SYSTEM_PROMPT = "Eres un asistente útil."

# Carpeta donde se guardan las sesiones, una por archivo.
MEMORY_DIR = "memory"

# Carga el historial de una sesión desde su archivo.
# Si el archivo no existe (sesión nueva) o está dañado, empieza con un historial vacío.
def load_memory(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
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

# Función para enviar la conversación al modelo de lenguaje y obtener una respuesta.
# Recibe el prompt de sistema (instrucciones para el modelo) y el historial de mensajes.
# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide
# qué hacer, así un error nunca se confunde con una respuesta del modelo.
def send_message(system_prompt, messages):
    response = litellm.completion(
        model=MODEL,
        # La conversación es una lista de mensajes, cada uno con un rol:
        # "system" para las instrucciones, "user" para lo que escribe la persona
        # y "assistant" para lo que respondió el modelo. El prompt de sistema va
        # siempre primero y no se guarda en el historial.
        messages=[{"role": "system", "content": system_prompt}] + messages,
        api_key=API_KEY,
        api_base=BASE_URL,
    )
    # La respuesta trae una lista de opciones ("choices"); se toma el texto de la primera.
    return response.choices[0].message.content # type: ignore

# Sistema de comandos basicos para controlar el chat.
# Recibe el historial para poder modificarlo (por ejemplo, /clear lo vacía).
# Devuelve:
#   - None: el texto no es un comando, hay que enviarlo al modelo.
#   - True: era un comando de salida, hay que terminar el chat.
#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.
def handle_command(user_input, messages, memory_path):
    command = user_input.lower()
    if command in ["/exit", "/quit"]:
        print("Saliendo del chat...")
        return True
    # Borra la memoria de la sesión, tanto la variable como el archivo.
    elif command == "/clear":
        messages.clear()
        save_memory(memory_path, messages)
        print("Memoria borrada.")
        return False
    # Muestra los comandos disponibles.
    elif command == "/help":
        print("Comandos disponibles:")
        print("/exit o /quit: Salir del chat.")
        print("/clear: Borrar la memoria de esta sesión.")
        print("/help: Mostrar esta ayuda.")
        return False
    # Cualquier otra cosa que empiece con "/" es un comando mal escrito:
    # no se manda al modelo.
    elif command.startswith("/"):
        print(f"Comando desconocido: {command}. Usa /help.")
        return False
    return None

# Función principal: bucle de chat en la terminal.
# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.
def main():
    # El nombre de la sesión se toma del primer argumento; define el archivo de memoria.
    session = sys.argv[1] if len(sys.argv) > 1 else "default"
    memory_path = os.path.join(MEMORY_DIR, f"{session}.json")

    # Memoria: lista con todos los mensajes de la conversación, en orden.
    # Cada elemento es {"role": "user" | "assistant", "content": texto}.
    messages = load_memory(memory_path)
    print(f"Sesión '{session}' ({len(messages)} mensajes en memoria). Usa /help para ver los comandos.")

    try:
        # Se repite hasta que el usuario salga con /exit, /quit, Ctrl+C o Ctrl+D.
        while True:
            # strip() quita espacios sobrantes (por ejemplo "/exit ").
            user_input = input(">>> ").strip()
            # Si el usuario solo presiona Enter, no se envía nada.
            if not user_input:
                continue

            # Si el texto es un comando, handle_command lo atiende y devuelve
            # True (salir) o False (seguir); si no lo es, devuelve None.
            result = handle_command(user_input, messages, memory_path)

            if result is True:
                break
            elif result is False:
                continue

            # Si no es un comando (result es None), se trata como un mensaje para el modelo.
            # Primero se agrega a la memoria, para que el modelo lo reciba junto con todo lo anterior.
            messages.append({"role": "user", "content": user_input})
            try:
                reply = send_message(SYSTEM_PROMPT, messages)
                print(reply)
                # Solo las respuestas reales del modelo entran a la memoria, y se guarda
                # en el archivo después de cada intercambio por si el programa se corta.
                messages.append({"role": "assistant", "content": reply})
                save_memory(memory_path, messages)
            except Exception as e:
                # El error se muestra en pantalla pero no entra a la memoria: se quita
                # también el mensaje del usuario para poder reintentar sin duplicarlo.
                messages.pop()
                print(f"Error: {e}")

    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.
    except (KeyboardInterrupt, EOFError):
        print("\nSaliendo del chat...")

    # Cualquier otro error inesperado se muestra en pantalla.
    except Exception as e:
        print(f"Error: {e}")

# Ejecuta main() solo si el script se corre directamente (no si se importa).
if __name__ == "__main__":
    main()
