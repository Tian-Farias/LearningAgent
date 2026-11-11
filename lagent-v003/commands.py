# Comandos del chat: /exit, /quit, /clear, /memoria y /help.

from memory import save_memory

# Largo máximo con el que /memoria muestra cada mensaje, para que se pueda leer de un vistazo.
PREVIEW_CHARS = 200

# Muestra lo que el agente recuerda en este momento: es lo que recibe el modelo en cada mensaje.
def show_memory(memory):
    print("Resumen:")
    print(memory["summary"] or "(todavía no hay resumen)")
    print(f"\nMensajes recientes ({len(memory['messages'])}):")
    for message in memory["messages"]:
        content = message["content"]
        if len(content) > PREVIEW_CHARS:
            content = content[:PREVIEW_CHARS] + "..."
        print(f"- {message['role']}: {content}")

# Sistema de comandos básicos para controlar el chat.
# Recibe la memoria para poder modificarla (por ejemplo, /clear la vacía).
# Devuelve:
#   - None: el texto no es un comando, hay que enviarlo al modelo.
#   - True: era un comando de salida, hay que terminar el chat.
#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.
def handle_command(user_input, memory, memory_path):
    command = user_input.lower()
    if command in ["/exit", "/quit"]:
        print("Saliendo del chat...")
        return True
    # Borra la memoria de la sesión, tanto la variable como el archivo.
    elif command == "/clear":
        memory["summary"] = ""
        memory["messages"].clear()
        save_memory(memory_path, memory)
        print("Memoria borrada.")
        return False
    # Muestra el resumen y los mensajes recientes.
    elif command == "/memoria":
        show_memory(memory)
        return False
    # Muestra los comandos disponibles.
    elif command == "/help":
        print("Comandos disponibles:")
        print("/exit o /quit: Salir del chat.")
        print("/clear: Borrar la memoria de esta sesión.")
        print("/memoria: Ver qué recuerda el agente en este momento.")
        print("/help: Mostrar esta ayuda.")
        return False
    # Cualquier otra cosa que empiece con "/" es un comando mal escrito:
    # no se manda al modelo.
    elif command.startswith("/"):
        print(f"Comando desconocido: {command}. Usa /help.")
        return False
    return None
