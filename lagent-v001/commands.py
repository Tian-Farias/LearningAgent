# Comandos del chat: /exit, /quit, /clear y /help.

from memory import save_memory

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
