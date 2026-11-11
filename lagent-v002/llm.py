# Comunicación con el modelo de lenguaje.

import os

import litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.

# Configuración: la clave de API y la URL base se leen de variables de entorno
# para no dejar datos sensibles escritos en el código.
API_KEY = os.environ.get("API_KEY")
BASE_URL = os.environ.get("BASE_URL")

# Función para enviar la conversación al modelo de lenguaje y obtener una respuesta.
# Recibe el modelo, el prompt de sistema (instrucciones para el modelo) y el historial de mensajes.
# Devuelve el texto de la respuesta y el uso de tokens (que puede ser None).
# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide
# qué hacer, así un error nunca se confunde con una respuesta del modelo.
def send_message(model, system_prompt, messages):
    response = litellm.completion(
        model=model,
        # La conversación es una lista de mensajes, cada uno con un rol:
        # "system" para las instrucciones, "user" para lo que escribe la persona
        # y "assistant" para lo que respondió el modelo. El prompt de sistema va
        # siempre primero y no se guarda en el historial.
        messages=[
            {
                "role": "system",
                "content": system_prompt
            }
            ] + messages,
        api_key=API_KEY,
        api_base=BASE_URL,
    )
    # "usage" informa los tokens enviados y puede venir vacío según el proveedor o el proxy.
    usage = getattr(response, "usage", None)
    # La respuesta trae una lista de opciones ("choices") y se toma el texto de la primera.
    return response.choices[0].message.content, usage  # type: ignore
