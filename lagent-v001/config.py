# Configuración del agente: modelo, instrucciones y carpeta de sesiones.

import os

#  Modelo a utilizar, con el formato "proveedor/modelo" que usa litellm.
# Se puede cambiar con la variable de entorno MODEL sin tocar el código.
MODEL = os.environ.get("MODEL", "anthropic/claude-haiku-5-5")

# Instrucciones generales para el modelo.
SYSTEM_PROMPT = "Eres un asistente útil."

# Carpeta donde se guardan las sesiones, una por archivo. Se calcula desde este archivo
# para que quede junto al código, sin importar desde dónde se ejecute.
MEMORY_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "memory")
