# Configuración del agente: modelo e instrucciones.

import os

#  Modelo a utilizar, con el formato "proveedor/modelo" que usa litellm.
# Se puede cambiar con la variable de entorno MODEL sin tocar el código.
MODEL = os.environ.get("MODEL", "anthropic/claude-haiku-5-5")

# Instrucciones generales para el modelo.
SYSTEM_PROMPT = "Eres un asistente útil."
