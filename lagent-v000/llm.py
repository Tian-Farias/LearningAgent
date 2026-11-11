# Comunicación con el modelo de lenguaje.

import os
import litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.

from config import MODEL

# Configuración: la clave de API y la URL base se leen de variables de entorno
# para no dejar datos sensibles escritos en el código.
API_KEY = os.environ.get("API_KEY")
BASE_URL = os.environ.get("BASE_URL")

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
    # La respuesta trae una lista de opciones ("choices") y se toma el texto de la primera.
    return response.choices[0].message.content # type: ignore
