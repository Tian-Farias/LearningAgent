# lagent-v000: conversación sin memoria.
# El sistema conversacional más simple que se puede hacer con litellm.
# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.
# Es el punto de partida de la historia: todavía no hay versión anterior.
# Limitación: no tiene memoria ni contexto, cada mensaje es independiente.
#
# El agente está separado en un archivo por funcionalidad:
#   main.py: el bucle del chat.
#   config.py: modelo e instrucciones.
#   llm.py: envía el mensaje al modelo.
#   commands.py: comandos del chat.
#
# El porqué de cada decisión está en el README.md de esta carpeta.
#
# Uso: python main.py, indicando la ruta si se ejecuta desde otra carpeta.

from commands import handle_command
from config import SYSTEM_PROMPT
from llm import send_message

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
            # True (salir) o False (seguir). Si no lo es, devuelve None.
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
