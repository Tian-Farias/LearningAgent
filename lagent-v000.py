# Sistema converscional mas simple que se puede hacer con litellm. 
# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.
# No tiene memoria ni contexto, cada mensaje es independiente.

import os
import litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.

# Configuración: la clave de API y la URL base se leen de variables de entorno
# para no dejar datos sensibles escritos en el código.
API_KEY = os.environ.get("API_KEY")
BASE_URL = os.environ.get("BASE_URL")
# Modelo a utilizar, con el formato "proveedor/modelo" que usa litellm.
MODEL = "anthropic/claude-haiku-5-5"

# Función para enviar un mensaje al modelo de lenguaje y obtener una respuesta.
# Recibe el prompt de sistema (instrucciones para el modelo) y el mensaje del usuario.
# Si algo falla (red, clave inválida, etc.) devuelve el error como texto.
def send_message(system_prompt, user_message):
    try:
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
    except Exception as e:
        return f"Error: {e}"

# Sistema de comandos basicos para controlar el chat.
# Devuelve None si el texto no es un comando (se envía al modelo),
# "exit" si hay que salir del chat, o "handled" si el comando ya se atendió.
def handle_command(user_input):
    command = user_input.lower()
    if command in ["/exit", "/quit"]:
        print("Saliendo del chat...")
        return "exit"
    # Muestra los comandos disponibles.
    elif command == "/help":
        print("Comandos disponibles:")
        print("/exit o /quit: Salir del chat.")
        print("/help: Mostrar esta ayuda.")
        return "handled"
    return None

# Función principal: bucle de chat en la terminal.
# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.
def main():
    try:
        # Se repite hasta que el usuario salga con /exit, /quit o Ctrl+C.
        while True:
            user_input = input(">>> ")
            result = handle_command(user_input)
            if result == "exit":
                break
            # Si fue un comando, se vuelve a pedir un mensaje.
            if result == "handled":
                continue
            # Si no es un comando, se trata como un mensaje para el modelo.
            response = send_message("Eres un asistente útil.", user_input)
            print(response)
    # Ctrl+C: sale del chat de forma ordenada.
    except KeyboardInterrupt:
        print("\nSaliendo del chat...")
    # Cualquier otro error inesperado se muestra en pantalla.
    except Exception as e:
        print(f"Error: {e}")

# Ejecuta main() solo si el script se corre directamente (no si se importa).
if __name__ == "__main__":
    main()
