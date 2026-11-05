# Configuración del agente: lectura y validación del archivo TOML de esta versión.

import os
import tomllib

# Cada versión del agente tiene su propio lagent.toml y sus sesiones junto a su código.
# Las rutas se calculan desde este archivo para que no dependan de desde dónde se ejecute.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "lagent.toml")

# Comprueba que la configuración tenga todas las claves con valores válidos.
# Se hace al arrancar, en vez de fallar más tarde en medio del chat.
def validate_config(config):
    for key in ("model", "system_prompt"):
        if not isinstance(config.get(key), str) or not config[key]:
            raise ValueError(f"{key} debe ser un texto no vacío.")
    memory = config.get("memory")
    if not isinstance(memory, dict):
        raise ValueError("falta la sección [memory].")
    if not isinstance(memory.get("dir"), str) or not memory["dir"]:
        raise ValueError("memory.dir debe ser un texto no vacío.")
    # Sin esta validación window = 0 no daría error: messages[-0:] es la lista completa
    # y se enviaría todo el historial. Se usa type() porque True también es un int.
    if type(memory.get("window")) is not int or memory["window"] < 1:
        raise ValueError("memory.window debe ser un entero mayor que 0.")

# Lee y valida la configuración desde el archivo TOML.
# El modelo usa el formato "proveedor/modelo" de litellm, y la variable de entorno
# MODEL tiene prioridad sobre el archivo.
# memory.dir es relativo a la carpeta de esta versión; una ruta absoluta se respeta.
def load_config(path=CONFIG_PATH):
    with open(path, "rb") as f:
        config = tomllib.load(f)
    if "MODEL" in os.environ:
        config["model"] = os.environ["MODEL"]
    validate_config(config)
    config["memory"]["dir"] = os.path.join(BASE_DIR, config["memory"]["dir"])
    return config
