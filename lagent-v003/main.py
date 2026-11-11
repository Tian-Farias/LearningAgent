# lagent-v003: conversación con compactación de memoria.
# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.
# La sesión se guarda en una variable y en un archivo, así la conversación sobrevive
# entre sesiones.
# A diferencia de v002, ya no olvida de golpe: cuando la conversación supera un umbral de
# tokens, resume los mensajes viejos con el modelo y los reemplaza por el resumen.
# Limitación: los mensajes resumidos ya no se pueden recuperar, y cada compactación
# es una llamada más al modelo.
#
# El agente está separado en un archivo por funcionalidad:
#   main.py: el bucle del chat.
#   config.py: lectura del archivo TOML.
#   memory.py: carga y guarda la sesión.
#   compaction.py: resume los mensajes viejos.
#   llm.py: envía la conversación al modelo y estima los tokens.
#   commands.py: comandos del chat.
#   lagent.toml: configuración de esta versión.
#
# El porqué de cada decisión está en el README.md de esta carpeta.
#
# Uso: python main.py [nombre_de_sesion], indicando la ruta si se ejecuta desde otra carpeta.
# Cada sesión se guarda en <memory.dir>/<nombre_de_sesion>.json (por defecto "default"),
# y memory.dir es relativo a la carpeta de esta versión.
# El nombre solo puede tener letras, números, "-" y "_", para que nunca se pueda
# escribir fuera de la carpeta de sesiones.
# Antes de cada respuesta se muestra entre corchetes cuántos mensajes se enviaron y la
# cantidad de tokens enviados, y también se avisa cuando se compacta y cuánto libera.

import os
import re
import sys

from commands import handle_command
from compaction import compact_if_needed
from config import load_config
from llm import send_message
from memory import build_system_prompt, load_memory, save_memory

# Función principal: bucle de chat en la terminal.
# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.
def main():
    # Sin una configuración válida no hay con qué seguir: se avisa y se termina al arrancar.
    # El ValueError cubre los valores inválidos y los errores de sintaxis del TOML,
    # porque TOMLDecodeError es un tipo de ValueError.
    try:
        config = load_config()
    except OSError as e:
        sys.exit(f"No se pudo leer lagent.toml: {e}")
    except ValueError as e:
        sys.exit(f"Error en lagent.toml: {e}")
    model = config["model"]
    system_prompt = config["system_prompt"]
    memory_dir = config["memory"]["dir"]
    compact_at_tokens = config["memory"]["compact_at_tokens"]
    keep_recent_turns = config["memory"]["keep_recent_turns"]

    # El nombre de la sesión se toma del primer argumento y define el archivo de memoria.
    # Se rechaza en vez de "limpiarlo": así un nombre con "/" o ".." no se transforma
    # en silencio en otro archivo, y no hay forma de salirse de la carpeta de sesiones.
    session = sys.argv[1] if len(sys.argv) > 1 else "default"
    if not re.fullmatch(r"[A-Za-z0-9_-]+", session):
        sys.exit("Nombre de sesión inválido: usa solo letras, números, '-' y '_'.")
    memory_path = os.path.join(memory_dir, f"{session}.json")

    # Memoria: el resumen de lo compactado y la lista de mensajes recientes, en orden.
    # Cada mensaje es {"role": "user" | "assistant", "content": texto}.
    # Al modelo se envía todo: el resumen en el prompt de sistema y luego los mensajes.
    memory = load_memory(memory_path)
    messages = memory["messages"]
    summary_info = ", con resumen" if memory["summary"] else ""
    print(f"Sesión '{session}' ({len(messages)} mensajes en memoria{summary_info}). Usa /help para ver los comandos.")

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
            result = handle_command(user_input, memory, memory_path)

            if result is True:
                break
            elif result is False:
                continue

            # Si no es un comando (result es None), se trata como un mensaje para el modelo.
            # Primero se agrega a la memoria, para que el modelo lo reciba junto con los mensajes anteriores.
            messages.append(
                {
                    "role": "user",
                    "content": user_input
                }
            )

            # Se compacta antes de enviar: si se esperara a la respuesta, una conversación que
            # ya supera el límite del modelo fallaría al enviarse y nunca llegaría a compactarse.
            compact_if_needed(model, system_prompt, memory, compact_at_tokens, keep_recent_turns)

            try:
                reply, usage, _ = send_message(model, build_system_prompt(system_prompt, memory["summary"]), messages)
            except Exception as e:
                # El error se muestra en pantalla pero no entra a la memoria: se quita
                # también el mensaje del usuario para poder reintentar sin duplicarlo.
                messages.pop()
                print(f"Error: {e}")
                continue

            # Mostramos cuánto se envió y los tokens, que es lo que se cobra.
            # Va fuera del try anterior a propósito: ese except descarta la respuesta, y un
            # contador incompleto no debe tirar una respuesta que el modelo ya generó (y que
            # ya se cobró). Por eso los tokens se leen con getattr y se muestran solo si existen.
            prompt_tokens = getattr(usage, "prompt_tokens", None)
            sent_info = f"mensajes enviados: {len(messages)}"
            if memory["summary"]:
                sent_info += " más el resumen"
            if prompt_tokens is not None:
                sent_info += f", tokens enviados: {prompt_tokens}"
            print(f"[{sent_info}]")

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
            # Solo aquí, con el intercambio completo, para que el archivo nunca termine en un
            # mensaje sin respuesta. Va en su propio try: si falla el guardado la respuesta ya
            # es válida, así que se conserva la memoria en RAM y solo se avisa (no se deshace nada).
            try:
                save_memory(memory_path, memory)
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
