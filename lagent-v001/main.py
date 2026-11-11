# lagent-v001: conversación con memoria.
# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.
# A diferencia de v000, guarda el historial de mensajes en una variable y en un
# archivo, así el modelo recuerda lo anterior y la conversación sobrevive entre sesiones.
# Limitación: envía el historial completo en cada mensaje, así que el costo crece sin
# límite con la sesión y solo se frena a mano con /clear.
#
# El agente está separado en un archivo por funcionalidad:
#   main.py: el bucle del chat.
#   config.py: modelo, instrucciones y carpeta de sesiones.
#   memory.py: carga y guarda el historial.
#   llm.py: envía la conversación al modelo.
#   commands.py: comandos del chat.
#
# El porqué de cada decisión está en el README.md de esta carpeta.
#
# Uso: python main.py [nombre_de_sesion], indicando la ruta si se ejecuta desde otra carpeta.
# Cada sesión se guarda en memory/<nombre_de_sesion>.json (por defecto "default"),
# dentro de la carpeta de esta versión.
# El nombre solo puede tener letras, números, "-" y "_", para que nunca se pueda
# escribir fuera de la carpeta memory/.
# Antes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados,
# para ver cómo crece el costo a medida que el historial se alarga.

import os
import re
import sys

from commands import handle_command
from config import MEMORY_DIR, SYSTEM_PROMPT
from llm import send_message
from memory import load_memory, save_memory

# Función principal: bucle de chat en la terminal.
# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.
def main():
    # El nombre de la sesión se toma del primer argumento y define el archivo de memoria.
    # Se rechaza en vez de "limpiarlo": así un nombre con "/" o ".." no se transforma
    # en silencio en otro archivo, y no hay forma de salirse de la carpeta memory/.
    session = sys.argv[1] if len(sys.argv) > 1 else "default"
    if not re.fullmatch(r"[A-Za-z0-9_-]+", session):
        sys.exit("Nombre de sesión inválido: usa solo letras, números, '-' y '_'.")
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
            # True (salir) o False (seguir). Si no lo es, devuelve None.
            result = handle_command(user_input, messages, memory_path)

            if result is True:
                break
            elif result is False:
                continue

            # Si no es un comando (result es None), se trata como un mensaje para el modelo.
            # Primero se agrega a la memoria, para que el modelo lo reciba junto con todo lo anterior.
            messages.append(
                {
                    "role": "user",
                    "content": user_input
                }
            )
            try:
                reply, usage = send_message(SYSTEM_PROMPT, messages)
            except Exception as e:
                # El error se muestra en pantalla pero no entra a la memoria: se quita
                # también el mensaje del usuario para poder reintentar sin duplicarlo.
                messages.pop()
                print(f"Error: {e}")
                continue

            # Mostramos los tokens enviados, que crecen con el historial y es lo que se cobra.
            # Va fuera del try anterior a propósito: ese except descarta la respuesta, y un
            # contador incompleto no debe tirar una respuesta que el modelo ya generó (y que
            # ya se cobró). Por eso se lee con getattr y se muestra solo si existe.
            prompt_tokens = getattr(usage, "prompt_tokens", None)
            if prompt_tokens is not None:
                print(f"[tokens enviados: {prompt_tokens}]")

            # Una respuesta vacía no se guarda: un mensaje vacío en el historial se
            # reenviaría en cada pregunta siguiente y la API podría rechazarlo, dejando
            # la sesión inutilizable. Se avisa y se quita el mensaje del usuario para reintentar.
            if not reply:
                messages.pop()
                print("El modelo devolvió una respuesta vacía. Intenta de nuevo.")
                continue

            print(reply)
            # Solo las respuestas reales (no vacías) del modelo entran a la memoria.
            messages.append(
                {
                    "role": "assistant",
                    "content": reply
                }
            )

            # Se guarda en el archivo después de cada intercambio por si el programa se corta.
            # Va en su propio try: si falla el guardado la respuesta ya es válida, así que
            # se conserva en la memoria en RAM y solo se avisa (no se deshace nada).
            try:
                save_memory(memory_path, messages)
            except OSError as e:
                print(f"No se pudo guardar la sesión: {e}")

    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.
    except (KeyboardInterrupt, EOFError):
        print("\nSaliendo del chat...")

    # Cualquier otro error inesperado se muestra en pantalla.
    except Exception as e:
        print(f"Error: {e}")

# Ejecuta main() solo si el script se corre directamente (no si se importa).
if __name__ == "__main__":
    main()
