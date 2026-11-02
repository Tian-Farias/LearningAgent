# Sistema converscional mas simple que se puede hacer con litellm.
# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.
# No tiene memoria ni contexto, cada mensaje es independiente.

import os
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

# Función para enviar un mensaje al modelo de lenguaje y obtener una respuesta.
# Recibe el prompt de sistema (instrucciones para el modelo) y el mensaje del usuario.
# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide
# qué hacer, así un error nunca se confunde con una respuesta del modelo.
def send_message(system_prompt, user_message):
    response = litellm.completion(
        model=MODEL,
        # La conversación es una lista de mensajes, cada uno con un rol:
        # "system" para las instrucciones y "user" para lo que escribe la persona.
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_message
            },
        ],
        api_key=API_KEY,
        api_base=BASE_URL,
    )
    # La respuesta trae una lista de opciones ("choices"); se toma el texto de la primera.
    return response.choices[0].message.content # type: ignore

# Sistema de comandos basicos para controlar el chat.
# Devuelve:
#   - None: el texto no es un comando, hay que enviarlo al modelo.
#   - True: era un comando de salida, hay que terminar el chat.
#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.
def handle_command(user_input):
    command = user_input.lower()
    if command in ["/exit", "/quit"]:
        print("Saliendo del chat...")
        return True
    # Muestra los comandos disponibles.
    elif command == "/help":
        print("Comandos disponibles:")
        print("/exit o /quit: Salir del chat.")
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
            result = handle_command(user_input)

            if result is True:
                break
            elif result is False:
                continue

            # Si no es un comando (result es None), se trata como un mensaje para el modelo.
            # El error se muestra en pantalla pero no se trata como respuesta del modelo.
            try:
                print(send_message(SYSTEM_PROMPT, user_input))
            except Exception as e:
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
