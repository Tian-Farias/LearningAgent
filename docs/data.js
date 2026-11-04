window.LAGENT_DATA = {
 "repository": "https://github.com/Tian-Farias/LearningAgent",
 "versions": [
  {
   "id": "v000",
   "title": "Chat sin memoria",
   "arc": null,
   "solves": "Hablar con un modelo de lenguaje desde la terminal, con el código más simple posible.",
   "adds": "El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat.",
   "tasks": [],
   "state": "real",
   "lines": 106,
   "leaves": "Cada mensaje es independiente: el modelo no recuerda nada de lo anterior."
  },
  {
   "id": "v001",
   "title": "Memoria",
   "arc": null,
   "solves": "Cada mensaje es independiente: el modelo no recuerda nada de lo anterior.",
   "adds": "Agrega memoria: guarda el historial de mensajes en una variable y en un archivo, para que el modelo recuerde la conversación y esta sobreviva entre sesiones. Muestra los tokens enviados en cada mensaje para ver cómo crece el costo.",
   "tasks": [
    {
     "done": true,
     "text": "Quitar los espacios al final de línea en `\"role\": \"system\", `, `\"role\": \"user\", ` y `\"role\": \"assistant\", ` (`ruff check --select W291 --fix lagent-v001.py`)"
    }
   ],
   "state": "real",
   "lines": 211,
   "leaves": "El historial crece sin límite (la limitación que ya plantea el README)."
  },
  {
   "id": "v002",
   "title": "Ventana de memoria",
   "arc": "Arco 1: memoria",
   "solves": "El historial crece sin límite (la limitación que ya plantea el README).",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Enviar al modelo solo los últimos N mensajes, configurable con una variable de entorno"
    },
    {
     "done": false,
     "text": "Cortar siempre en un mensaje `user`, para que el historial enviado no empiece con `assistant`"
    },
    {
     "done": false,
     "text": "Guardar en disco el historial completo y enviar solo la ventana (memoria guardada y memoria enviada son cosas distintas)"
    },
    {
     "done": false,
     "text": "Mostrar los tokens enviados para comparar con v001 en la misma conversación"
    },
    {
     "done": false,
     "text": "README: explicar la limitación que deja, el modelo olvida de golpe lo que queda fuera de la ventana"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "La ventana pierde contexto importante."
  },
  {
   "id": "v003",
   "title": "Compactación",
   "arc": "Arco 1: memoria",
   "solves": "La ventana pierde contexto importante.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Cuando los tokens superen un umbral, resumir los mensajes viejos con el modelo y reemplazarlos por el resumen"
    },
    {
     "done": false,
     "text": "Resumen con secciones fijas (hechos, decisiones, pendientes), para que no se degrade resumen tras resumen"
    },
    {
     "done": false,
     "text": "Guardar el resumen en la sesión junto con los mensajes recientes"
    },
    {
     "done": false,
     "text": "Comando `/memoria` para ver qué recuerda el agente en ese momento"
    },
    {
     "done": false,
     "text": "Mostrar cuándo se compacta y cuántos tokens libera"
    },
    {
     "done": false,
     "text": "README: comparar v001, v002 y v003 con la misma conversación"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "El sistema solo conversa, no puede hacer nada."
  },
  {
   "id": "v004",
   "title": "Tools y loop",
   "arc": "Arco 2: de chat a agente",
   "solves": "El sistema solo conversa, no puede hacer nada.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Definir tools con schema (partir con dos inofensivas, por ejemplo leer un archivo y consultar la hora)"
    },
    {
     "done": false,
     "text": "Loop: si el modelo pide una tool, se ejecuta, se devuelve el resultado y se vuelve a llamar al modelo hasta que responda con texto"
    },
    {
     "done": false,
     "text": "Guardar en memoria los mensajes de tool call y de tool result, respetando el pareo entre ambos"
    },
    {
     "done": false,
     "text": "`send_message` devuelve la respuesta completa del modelo, ya no solo el texto (las respuestas con tool calls pueden traer contenido vacío)"
    },
    {
     "done": false,
     "text": "Decidir la estructura del repo: seguir con un archivo por versión o pasar a carpetas (`v004/agent.py`, `v004/tools.py`)"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "El agente puede ejecutar cualquier cosa y quedarse en un loop."
  },
  {
   "id": "v005",
   "title": "Guardrails",
   "arc": "Arco 2: de chat a agente",
   "solves": "El agente puede ejecutar cualquier cosa y quedarse en un loop.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Allowlist de tools y de comandos"
    },
    {
     "done": false,
     "text": "Paths confinados a una carpeta de trabajo"
    },
    {
     "done": false,
     "text": "Tope de pasos por mensaje del usuario"
    },
    {
     "done": false,
     "text": "Recortar resultados largos de tools antes de devolverlos al modelo"
    },
    {
     "done": false,
     "text": "Los bloqueos vuelven al modelo como resultado de la tool, sin cortar el loop"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "El modelo se autodeclara listo sin evidencia."
  },
  {
   "id": "v006",
   "title": "Sensores y gate",
   "arc": "Arco 2: de chat a agente",
   "solves": "El modelo se autodeclara listo sin evidencia.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Interfaz de sensor (`applies`, `check`) para no acoplar el loop a un tipo de tarea"
    },
    {
     "done": false,
     "text": "Sensores al cierre de cada paso si hubo cambios, con los fallos redactados como pendientes y no como órdenes"
    },
    {
     "done": false,
     "text": "Deduplicar: si el fallo es igual al del paso anterior, avisar que se repite y sugerir cambiar de enfoque"
    },
    {
     "done": false,
     "text": "Tool `complete_task` que el harness acepta solo si los sensores pasan"
    },
    {
     "done": false,
     "text": "Cortar la sesión si el mismo fallo se repite varias veces seguidas"
    },
    {
     "done": false,
     "text": "Memoria entre sesiones: `progress.md` con lo hecho y un handoff cuando se acaba el presupuesto de pasos"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "No se sabe qué pasó adentro del loop."
  },
  {
   "id": "v007",
   "title": "Trazas",
   "arc": "Arco 3: observabilidad y aislamiento",
   "solves": "No se sabe qué pasó adentro del loop.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Árbol de spans en JSONL: sesión, paso, llamada al modelo, tool, sensor, gate, bloqueo"
    },
    {
     "done": false,
     "text": "Guardar tokens, latencias, `stop_reason` y el texto del modelo entre tools"
    },
    {
     "done": false,
     "text": "No guardar contenido completo de archivos escritos, solo largo y hash"
    },
    {
     "done": false,
     "text": "Totales en el span raíz para comparar corridas"
    },
    {
     "done": false,
     "text": "Script `trace_report.py` que muestra el árbol, con opción `--errors`"
    },
    {
     "done": false,
     "text": "Nota: se puede adelantar justo después de v004, porque ayuda a depurar todo lo que viene"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "Los guardrails por allowlist son frágiles."
  },
  {
   "id": "v008",
   "title": "Sandbox",
   "arc": "Arco 3: observabilidad y aislamiento",
   "solves": "Los guardrails por allowlist son frágiles.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Las tools corren dentro de un contenedor Docker de larga vida por sesión"
    },
    {
     "done": false,
     "text": "Contenedor sin red, rootfs de solo lectura, sin capabilities, usuario no root y con límites de recursos"
    },
    {
     "done": false,
     "text": "Trabajo sobre un git worktree en rama propia, el repo original no se toca"
    },
    {
     "done": false,
     "text": "Al terminar, la rama queda lista para revisar como un PR"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "Costo y sesgo de autoevaluación con un solo modelo."
  },
  {
   "id": "v009",
   "title": "Varios modelos por rol",
   "arc": "Arco 4: escala",
   "solves": "Costo y sesgo de autoevaluación con un solo modelo.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Tabla de modelos por rol (planificador, trabajador, revisor, compactador)"
    },
    {
     "done": false,
     "text": "Revisor de otra familia de modelos"
    },
    {
     "done": false,
     "text": "Escalar al modelo grande cuando se repiten los fallos"
    },
    {
     "done": false,
     "text": "Todo a través del gateway, con el rol registrado en las trazas"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": "Tareas grandes que no caben en un solo contexto."
  },
  {
   "id": "v010",
   "title": "Orquestador y sub-agentes",
   "arc": "Arco 4: escala",
   "solves": "Tareas grandes que no caben en un solo contexto.",
   "adds": null,
   "tasks": [
    {
     "done": false,
     "text": "Planificador que produce un plan estructurado (JSON) como contrato común"
    },
    {
     "done": false,
     "text": "Sub-agentes en paralelo con contexto aislado y un semáforo de concurrencia"
    },
    {
     "done": false,
     "text": "Sensores por unidad de trabajo, con reintentos acotados"
    },
    {
     "done": false,
     "text": "Integrador final y gate sobre el resultado completo"
    },
    {
     "done": false,
     "text": "Ejemplo fuera de código: redacción de un documento por secciones"
    }
   ],
   "state": "plan",
   "lines": null,
   "leaves": null
  }
 ],
 "lanes": [
  {
   "name": "Chat",
   "pieces": [
    {
     "version": "v000",
     "name": "Chat y comandos"
    }
   ]
  },
  {
   "name": "Memoria",
   "pieces": [
    {
     "version": "v001",
     "name": "Historial"
    },
    {
     "version": "v002",
     "name": "Ventana"
    },
    {
     "version": "v003",
     "name": "Compactación"
    }
   ]
  },
  {
   "name": "Medición",
   "pieces": [
    {
     "version": "v001",
     "name": "Tokens"
    },
    {
     "version": "v007",
     "name": "Trazas"
    }
   ]
  },
  {
   "name": "Acción",
   "pieces": [
    {
     "version": "v004",
     "name": "Tools y loop"
    },
    {
     "version": "v008",
     "name": "Sandbox"
    }
   ]
  },
  {
   "name": "Control",
   "pieces": [
    {
     "version": "v005",
     "name": "Guardrails"
    },
    {
     "version": "v006",
     "name": "Sensores y gate"
    }
   ]
  },
  {
   "name": "Escala",
   "pieces": [
    {
     "version": "v009",
     "name": "Modelos por rol"
    },
    {
     "version": "v010",
     "name": "Sub-agentes"
    }
   ]
  }
 ],
 "stops": [
  {
   "id": "fa887a8",
   "kind": "commit",
   "version": "v000",
   "hash": "fa887a8",
   "sha": "fa887a8774df6482b95faf4671f3688c2d1a1b6c",
   "date": "2026-11-02",
   "message": "first lagent: v000",
   "published": true,
   "agent": "lagent-v000.py",
   "files": {
    ".gitignore": "6430774e9e7b13354d671836ed1a8819edecad15",
    "README.md": "33205013df818af0799147a5fd736090d87640b5",
    "lagent-v000.py": "e22a8408fae99e1fa0be25ba2c217bad1f82ac41"
   },
   "changes": [
    {
     "path": ".gitignore",
     "status": "added",
     "base": null
    },
    {
     "path": "README.md",
     "status": "added",
     "base": null
    },
    {
     "path": "lagent-v000.py",
     "status": "added",
     "base": null
    }
   ]
  },
  {
   "id": "c39fdd6",
   "kind": "commit",
   "version": "v000",
   "hash": "c39fdd6",
   "sha": "c39fdd68c282ebe484e1b7b58fb88834358358fb",
   "date": "2026-11-02",
   "message": "cambios basicos de flujo y documentacion",
   "published": true,
   "agent": "lagent-v000.py",
   "files": {
    ".gitignore": "6430774e9e7b13354d671836ed1a8819edecad15",
    "README.md": "9b61765fcbe43038eda7f5df9462f2bb6dbc42da",
    "lagent-v000.py": "5aba3e97c044b862c0b1052eb4d8a066a2753db4"
   },
   "changes": [
    {
     "path": "README.md",
     "status": "modified",
     "base": null
    },
    {
     "path": "lagent-v000.py",
     "status": "modified",
     "base": null
    }
   ]
  },
  {
   "id": "b8e71fd",
   "kind": "commit",
   "version": "v000",
   "hash": "b8e71fd",
   "sha": "b8e71fd4fb2ac50bb8881ff2f795da5ac4f63c5c",
   "date": "2026-11-02",
   "message": "Cambios simples que ayuden a explicar",
   "published": true,
   "agent": "lagent-v000.py",
   "files": {
    ".gitignore": "6430774e9e7b13354d671836ed1a8819edecad15",
    "README.md": "9b61765fcbe43038eda7f5df9462f2bb6dbc42da",
    "lagent-v000.py": "af93ee3b1a32bb70a7766680d62ce45b06880583"
   },
   "changes": [
    {
     "path": "lagent-v000.py",
     "status": "modified",
     "base": null
    }
   ]
  },
  {
   "id": "d293d32",
   "kind": "commit",
   "version": "v001",
   "hash": "d293d32",
   "sha": "d293d32efa009c4f4b7d902ae5a703bd4f9776f5",
   "date": "2026-11-04",
   "message": "Se agrega las primeras versiones de una memoria con soporte de sesiones",
   "published": true,
   "agent": "lagent-v001.py",
   "files": {
    ".gitignore": "6430774e9e7b13354d671836ed1a8819edecad15",
    "README.md": "766b35f418b03d0835dc14cfb9d295fe343dd483",
    "lagent-v000.py": "af93ee3b1a32bb70a7766680d62ce45b06880583",
    "lagent-v001.py": "e2015c926745c04dc0d98c82f7c23a1275dc2ab7",
    "memory/.fakeignore": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
   },
   "changes": [
    {
     "path": "README.md",
     "status": "modified",
     "base": null
    },
    {
     "path": "lagent-v001.py",
     "status": "added",
     "base": "lagent-v000.py"
    },
    {
     "path": "memory/.fakeignore",
     "status": "added",
     "base": null
    }
   ]
  },
  {
   "id": "61d1554",
   "kind": "commit",
   "version": "v001",
   "hash": "61d1554",
   "sha": "61d155475fc725cc6e397e7910482177b4538608",
   "date": "2026-11-04",
   "message": "Arreglo de algunos detalles en el manejo de memoria",
   "published": true,
   "agent": "lagent-v001.py",
   "files": {
    ".gitignore": "400208ded56ce21b8d5ac7bf6c64dd9d63a39e04",
    "README.md": "685443f89f83eeb357f82fe2f55e2a5d3ff514f6",
    "lagent-v000.py": "af93ee3b1a32bb70a7766680d62ce45b06880583",
    "lagent-v001.py": "874bdf8af4237220acd2ddc5c16f4763254f627f",
    "memory/.fakeignore": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
   },
   "changes": [
    {
     "path": ".gitignore",
     "status": "modified",
     "base": null
    },
    {
     "path": "README.md",
     "status": "modified",
     "base": null
    },
    {
     "path": "lagent-v001.py",
     "status": "modified",
     "base": null
    }
   ]
  },
  {
   "id": "13929ed",
   "kind": "commit",
   "version": "v001",
   "hash": "13929ed",
   "sha": "13929ed8c1fd2ca1d6827af4c03c7fd012c2faf8",
   "date": "2026-11-04",
   "message": "Ajustes finos sobre el uso de memoria",
   "published": true,
   "agent": "lagent-v001.py",
   "files": {
    ".gitignore": "fb1b08d949d5a63c24ba9c9ccb2045be642d76a2",
    "README.md": "685443f89f83eeb357f82fe2f55e2a5d3ff514f6",
    "lagent-v000.py": "af93ee3b1a32bb70a7766680d62ce45b06880583",
    "lagent-v001.py": "ca6a18e8798dc8f339811a564f7a92b0d2cf8727",
    "memory/.fakeignore": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
   },
   "changes": [
    {
     "path": ".gitignore",
     "status": "modified",
     "base": null
    },
    {
     "path": "lagent-v001.py",
     "status": "modified",
     "base": null
    }
   ]
  },
  {
   "id": "aead375",
   "kind": "commit",
   "version": "v001",
   "hash": "aead375",
   "sha": "aead37530bc68fa54f9fe2ebea1a645ac3ebabe5",
   "date": "2026-11-04",
   "message": "Ajustes al README.md",
   "published": true,
   "agent": "lagent-v001.py",
   "files": {
    ".gitignore": "fb1b08d949d5a63c24ba9c9ccb2045be642d76a2",
    "README.md": "98ed39d29eda5af2bf9c47a067cb01fdeda8c595",
    "lagent-v000.py": "af93ee3b1a32bb70a7766680d62ce45b06880583",
    "lagent-v001.py": "ca6a18e8798dc8f339811a564f7a92b0d2cf8727",
    "memory/.fakeignore": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
   },
   "changes": [
    {
     "path": "README.md",
     "status": "modified",
     "base": null
    }
   ]
  },
  {
   "id": "f4e0d5c",
   "kind": "commit",
   "version": "v001",
   "hash": "f4e0d5c",
   "sha": "f4e0d5cc0028738b8cac5fdeb656c8e5f7f1a527",
   "date": "2026-11-04",
   "message": "Creacion de TODO.md y limpieza",
   "published": true,
   "agent": "lagent-v001.py",
   "files": {
    ".gitignore": "fb1b08d949d5a63c24ba9c9ccb2045be642d76a2",
    "README.md": "98ed39d29eda5af2bf9c47a067cb01fdeda8c595",
    "TODO.md": "482af7b94b034c2b586eb6070e552facf0e485db",
    "lagent-v000.py": "af93ee3b1a32bb70a7766680d62ce45b06880583",
    "lagent-v001.py": "0aceca4d72154884ac64e8e7f4cc792ed6524428",
    "memory/.fakeignore": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
   },
   "changes": [
    {
     "path": "TODO.md",
     "status": "added",
     "base": null
    },
    {
     "path": "lagent-v001.py",
     "status": "modified",
     "base": null
    }
   ]
  },
  {
   "id": "v002",
   "kind": "plan",
   "version": "v002"
  },
  {
   "id": "v003",
   "kind": "plan",
   "version": "v003"
  },
  {
   "id": "v004",
   "kind": "plan",
   "version": "v004"
  },
  {
   "id": "v005",
   "kind": "plan",
   "version": "v005"
  },
  {
   "id": "v006",
   "kind": "plan",
   "version": "v006"
  },
  {
   "id": "v007",
   "kind": "plan",
   "version": "v007"
  },
  {
   "id": "v008",
   "kind": "plan",
   "version": "v008"
  },
  {
   "id": "v009",
   "kind": "plan",
   "version": "v009"
  },
  {
   "id": "v010",
   "kind": "plan",
   "version": "v010"
  }
 ],
 "blobs": {
  "6430774e9e7b13354d671836ed1a8819edecad15": "# Python\n__pycache__/\n*.py[cod]\n*.egg-info/\nbuild/\ndist/\n\n# Entornos virtuales\n.venv/\nvenv/\nenv/\n\n# Secretos y variables de entorno\n.env\n.env.*\n\n# IDE y sistema\n.vscode/\n.idea/\n.DS_Store\n\n# Claude Code\n.claude/\n",
  "33205013df818af0799147a5fd736090d87640b5": "# LearningAgent\n\nEste repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.\n\nEl nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.\n\nCada versión es un archivo independiente (`lagent-vXXX.py`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.\n\n## Cómo está organizado\n\n- Un archivo por versión: `lagent-v000.py`, `lagent-v001.py`, etc.\n- Cada archivo empieza con un comentario que explica qué hace y qué le falta.\n- Cada versión se puede ejecutar sola.\n\n## Versiones\n\n| Versión | Archivo | Qué agrega |\n|---------|---------|------------|\n| v000 | [lagent-v000.py](lagent-v000.py) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. |\n\n> Esta tabla crece a medida que el agente evoluciona.\n\n## Requisitos\n\n- Python 3\n- [litellm](https://github.com/BerriAI/litellm): `pip install litellm`\n- Variables de entorno:\n  - `API_KEY`: clave de la API del proveedor.\n  - `BASE_URL`: URL base del modelo.\n\n## Uso\n\n```bash\nexport API_KEY=\"tu-clave\"\nexport BASE_URL=\"https://tu-endpoint\"\npython lagent-v000.py\n```\n\n## Objetivo\n\nEntender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.\n",
  "e22a8408fae99e1fa0be25ba2c217bad1f82ac41": "# Sistema converscional mas simple que se puede hacer con litellm. \n# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.\n# No tiene memoria ni contexto, cada mensaje es independiente.\n\nimport os\nimport litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.\n\n# Configuración: la clave de API y la URL base se leen de variables de entorno\n# para no dejar datos sensibles escritos en el código.\nAPI_KEY = os.environ.get(\"API_KEY\")\nBASE_URL = os.environ.get(\"BASE_URL\")\n# Modelo a utilizar, con el formato \"proveedor/modelo\" que usa litellm.\nMODEL = \"anthropic/claude-haiku-5-5\"\n\n# Función para enviar un mensaje al modelo de lenguaje y obtener una respuesta.\n# Recibe el prompt de sistema (instrucciones para el modelo) y el mensaje del usuario.\n# Si algo falla (red, clave inválida, etc.) devuelve el error como texto.\ndef send_message(system_prompt, user_message):\n    try:\n        response = litellm.completion(\n            model=MODEL,\n            # La conversación es una lista de mensajes, cada uno con un rol:\n            # \"system\" para las instrucciones y \"user\" para lo que escribe la persona.\n            messages=[\n                {\n                    \"role\": \"system\", \n                    \"content\": system_prompt\n                },\n                {\n                    \"role\": \"user\", \n                    \"content\": user_message\n                },\n            ],\n            api_key=API_KEY,\n            api_base=BASE_URL,\n        )\n        # La respuesta trae una lista de opciones (\"choices\"); se toma el texto de la primera.\n        return response.choices[0].message.content # type: ignore\n    except Exception as e:\n        return f\"Error: {e}\"\n\n# Sistema de comandos basicos para controlar el chat.\n# Devuelve None si el texto no es un comando (se envía al modelo),\n# \"exit\" si hay que salir del chat, o \"handled\" si el comando ya se atendió.\ndef handle_command(user_input):\n    command = user_input.lower()\n    if command in [\"/exit\", \"/quit\"]:\n        print(\"Saliendo del chat...\")\n        return \"exit\"\n    # Muestra los comandos disponibles.\n    elif command == \"/help\":\n        print(\"Comandos disponibles:\")\n        print(\"/exit o /quit: Salir del chat.\")\n        print(\"/help: Mostrar esta ayuda.\")\n        return \"handled\"\n    return None\n\n# Función principal: bucle de chat en la terminal.\n# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.\ndef main():\n    try:\n        # Se repite hasta que el usuario salga con /exit, /quit o Ctrl+C.\n        while True:\n            user_input = input(\">>> \")\n            result = handle_command(user_input)\n            if result == \"exit\":\n                break\n            # Si fue un comando, se vuelve a pedir un mensaje.\n            if result == \"handled\":\n                continue\n            # Si no es un comando, se trata como un mensaje para el modelo.\n            response = send_message(\"Eres un asistente útil.\", user_input)\n            print(response)\n    # Ctrl+C: sale del chat de forma ordenada.\n    except KeyboardInterrupt:\n        print(\"\\nSaliendo del chat...\")\n    # Cualquier otro error inesperado se muestra en pantalla.\n    except Exception as e:\n        print(f\"Error: {e}\")\n\n# Ejecuta main() solo si el script se corre directamente (no si se importa).\nif __name__ == \"__main__\":\n    main()\n",
  "9b61765fcbe43038eda7f5df9462f2bb6dbc42da": "# LearningAgent\n\nEste repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.\n\nEl nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.\n\nCada versión es un archivo independiente (`lagent-vXXX.py`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.\n\n## Cómo está organizado\n\n- Un archivo por versión: `lagent-v000.py`, `lagent-v001.py`, etc.\n- Cada archivo empieza con un comentario que explica qué hace y qué le falta.\n- Cada versión se puede ejecutar sola.\n\n## Versiones\n\n| Versión | Archivo | Qué agrega |\n|---------|---------|------------|\n| v000 | [lagent-v000.py](lagent-v000.py) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat. |\n\n> Esta tabla crece a medida que el agente evoluciona.\n\n## Requisitos\n\n- Python 3\n- [litellm](https://github.com/BerriAI/litellm): `pip install litellm`\n- Variables de entorno:\n  - `API_KEY`: clave de la API del proveedor.\n  - `BASE_URL`: URL base del modelo.\n  - `MODEL` (opcional): modelo a usar, con el formato `proveedor/modelo`. Por defecto `anthropic/claude-haiku-5-5`.\n\n## Uso\n\n```bash\nexport API_KEY=\"tu-clave\"\nexport BASE_URL=\"https://tu-endpoint\"\npython lagent-v000.py\n```\n\nEscribe un mensaje después del prompt `>>>` y presiona Enter para enviarlo al modelo. Si solo presionas Enter, no se envía nada.\n\n### Comandos\n\nLos comandos empiezan con `/` y no se envían al modelo. No distinguen mayúsculas de minúsculas.\n\n| Comando | Qué hace |\n|---------|----------|\n| `/help` | Muestra los comandos disponibles. |\n| `/exit` o `/quit` | Sale del chat. |\n\nCualquier otro texto que empiece con `/` muestra `Comando desconocido` y no se envía al modelo. También puedes salir con `Ctrl+C` o `Ctrl+D`.\n\n## Objetivo\n\nEntender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.\n",
  "5aba3e97c044b862c0b1052eb4d8a066a2753db4": "# Sistema converscional mas simple que se puede hacer con litellm.\n# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.\n# No tiene memoria ni contexto, cada mensaje es independiente.\n\nimport os\nimport litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.\n\n# Configuración: la clave de API y la URL base se leen de variables de entorno\n# para no dejar datos sensibles escritos en el código.\nAPI_KEY = os.environ.get(\"API_KEY\")\nBASE_URL = os.environ.get(\"BASE_URL\")\n# Modelo a utilizar, con el formato \"proveedor/modelo\" que usa litellm.\n# Se puede cambiar con la variable de entorno MODEL sin tocar el código.\nMODEL = os.environ.get(\"MODEL\", \"anthropic/claude-haiku-5-5\")\n# Instrucciones generales para el modelo.\nSYSTEM_PROMPT = \"Eres un asistente útil.\"\n\n# Función para enviar un mensaje al modelo de lenguaje y obtener una respuesta.\n# Recibe el prompt de sistema (instrucciones para el modelo) y el mensaje del usuario.\n# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide\n# qué hacer, así un error nunca se confunde con una respuesta del modelo.\ndef send_message(system_prompt, user_message):\n    response = litellm.completion(\n        model=MODEL,\n        # La conversación es una lista de mensajes, cada uno con un rol:\n        # \"system\" para las instrucciones y \"user\" para lo que escribe la persona.\n        messages=[\n            {\n                \"role\": \"system\",\n                \"content\": system_prompt\n            },\n            {\n                \"role\": \"user\",\n                \"content\": user_message\n            },\n        ],\n        api_key=API_KEY,\n        api_base=BASE_URL,\n    )\n    # La respuesta trae una lista de opciones (\"choices\"); se toma el texto de la primera.\n    return response.choices[0].message.content # type: ignore\n\n# Sistema de comandos basicos para controlar el chat.\n# Devuelve None si el texto no es un comando (se envía al modelo),\n# \"exit\" si hay que salir del chat, o \"handled\" si el comando ya se atendió.\ndef handle_command(user_input):\n    command = user_input.lower()\n    if command in [\"/exit\", \"/quit\"]:\n        print(\"Saliendo del chat...\")\n        return \"exit\"\n    # Muestra los comandos disponibles.\n    elif command == \"/help\":\n        print(\"Comandos disponibles:\")\n        print(\"/exit o /quit: Salir del chat.\")\n        print(\"/help: Mostrar esta ayuda.\")\n        return \"handled\"\n    # Cualquier otra cosa que empiece con \"/\" es un comando mal escrito:\n    # no se manda al modelo.\n    elif command.startswith(\"/\"):\n        print(f\"Comando desconocido: {command}. Usa /help.\")\n        return \"handled\"\n    return None\n\n# Función principal: bucle de chat en la terminal.\n# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.\ndef main():\n    try:\n        # Se repite hasta que el usuario salga con /exit, /quit, Ctrl+C o Ctrl+D.\n        while True:\n            # strip() quita espacios sobrantes (por ejemplo \"/exit \").\n            user_input = input(\">>> \").strip()\n            # Si el usuario solo presiona Enter, no se envía nada.\n            if not user_input:\n                continue\n            result = handle_command(user_input)\n            if result == \"exit\":\n                break\n            # Si fue un comando, se vuelve a pedir un mensaje.\n            if result == \"handled\":\n                continue\n            # Si no es un comando, se trata como un mensaje para el modelo.\n            # El error se muestra en pantalla pero no se trata como respuesta del modelo.\n            try:\n                print(send_message(SYSTEM_PROMPT, user_input))\n            except Exception as e:\n                print(f\"Error: {e}\")\n    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.\n    except (KeyboardInterrupt, EOFError):\n        print(\"\\nSaliendo del chat...\")\n    # Cualquier otro error inesperado se muestra en pantalla.\n    except Exception as e:\n        print(f\"Error: {e}\")\n\n# Ejecuta main() solo si el script se corre directamente (no si se importa).\nif __name__ == \"__main__\":\n    main()\n",
  "af93ee3b1a32bb70a7766680d62ce45b06880583": "# Sistema converscional mas simple que se puede hacer con litellm.\n# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.\n# No tiene memoria ni contexto, cada mensaje es independiente.\n\nimport os\nimport litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.\n\n# Configuración: la clave de API y la URL base se leen de variables de entorno\n# para no dejar datos sensibles escritos en el código.\nAPI_KEY = os.environ.get(\"API_KEY\")\nBASE_URL = os.environ.get(\"BASE_URL\")\n\n#  Modelo a utilizar, con el formato \"proveedor/modelo\" que usa litellm.\n# Se puede cambiar con la variable de entorno MODEL sin tocar el código.\nMODEL = os.environ.get(\"MODEL\", \"anthropic/claude-haiku-5-5\")\n\n# Instrucciones generales para el modelo.\nSYSTEM_PROMPT = \"Eres un asistente útil.\"\n\n# Función para enviar un mensaje al modelo de lenguaje y obtener una respuesta.\n# Recibe el prompt de sistema (instrucciones para el modelo) y el mensaje del usuario.\n# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide\n# qué hacer, así un error nunca se confunde con una respuesta del modelo.\ndef send_message(system_prompt, user_message):\n    response = litellm.completion(\n        model=MODEL,\n        # La conversación es una lista de mensajes, cada uno con un rol:\n        # \"system\" para las instrucciones y \"user\" para lo que escribe la persona.\n        messages=[\n            {\n                \"role\": \"system\",\n                \"content\": system_prompt\n            },\n            {\n                \"role\": \"user\",\n                \"content\": user_message\n            },\n        ],\n        api_key=API_KEY,\n        api_base=BASE_URL,\n    )\n    # La respuesta trae una lista de opciones (\"choices\"); se toma el texto de la primera.\n    return response.choices[0].message.content # type: ignore\n\n# Sistema de comandos basicos para controlar el chat.\n# Devuelve:\n#   - None: el texto no es un comando, hay que enviarlo al modelo.\n#   - True: era un comando de salida, hay que terminar el chat.\n#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.\ndef handle_command(user_input):\n    command = user_input.lower()\n    if command in [\"/exit\", \"/quit\"]:\n        print(\"Saliendo del chat...\")\n        return True\n    # Muestra los comandos disponibles.\n    elif command == \"/help\":\n        print(\"Comandos disponibles:\")\n        print(\"/exit o /quit: Salir del chat.\")\n        print(\"/help: Mostrar esta ayuda.\")\n        return False\n    # Cualquier otra cosa que empiece con \"/\" es un comando mal escrito:\n    # no se manda al modelo.\n    elif command.startswith(\"/\"):\n        print(f\"Comando desconocido: {command}. Usa /help.\")\n        return False\n    return None\n\n# Función principal: bucle de chat en la terminal.\n# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.\ndef main():\n    try:\n        # Se repite hasta que el usuario salga con /exit, /quit, Ctrl+C o Ctrl+D.\n        while True:\n            # strip() quita espacios sobrantes (por ejemplo \"/exit \").\n            user_input = input(\">>> \").strip()\n            # Si el usuario solo presiona Enter, no se envía nada.\n            if not user_input:\n                continue\n\n            # Si el texto es un comando, handle_command lo atiende y devuelve\n            # True (salir) o False (seguir); si no lo es, devuelve None.\n            result = handle_command(user_input)\n\n            if result is True:\n                break\n            elif result is False:\n                continue\n\n            # Si no es un comando (result es None), se trata como un mensaje para el modelo.\n            # El error se muestra en pantalla pero no se trata como respuesta del modelo.\n            try:\n                print(send_message(SYSTEM_PROMPT, user_input))\n            except Exception as e:\n                print(f\"Error: {e}\")\n\n    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.\n    except (KeyboardInterrupt, EOFError):\n        print(\"\\nSaliendo del chat...\")\n\n    # Cualquier otro error inesperado se muestra en pantalla.\n    except Exception as e:\n        print(f\"Error: {e}\")\n\n# Ejecuta main() solo si el script se corre directamente (no si se importa).\nif __name__ == \"__main__\":\n    main()\n",
  "766b35f418b03d0835dc14cfb9d295fe343dd483": "# LearningAgent\n\nEste repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.\n\nEl nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.\n\nCada versión es un archivo independiente (`lagent-vXXX.py`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.\n\n## Cómo está organizado\n\n- Un archivo por versión: `lagent-v000.py`, `lagent-v001.py`, etc.\n- Cada archivo empieza con un comentario que explica qué hace y qué le falta.\n- Cada versión se puede ejecutar sola.\n\n## Versiones\n\n| Versión | Archivo | Qué agrega |\n|---------|---------|------------|\n| v000 | [lagent-v000.py](lagent-v000.py) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat. |\n| v001 | [lagent-v001.py](lagent-v001.py) | Agrega memoria: guarda el historial de mensajes en una variable y en un archivo, para que el modelo recuerde la conversación y esta sobreviva entre sesiones. |\n\n> Esta tabla crece a medida que el agente evoluciona.\n\n## Requisitos\n\n- Python 3\n- [litellm](https://github.com/BerriAI/litellm): `pip install litellm`\n- Variables de entorno:\n  - `API_KEY`: clave de la API del proveedor.\n  - `BASE_URL`: URL base del modelo.\n  - `MODEL` (opcional): modelo a usar, con el formato `proveedor/modelo`. Por defecto `anthropic/claude-haiku-5-5`.\n\n## Uso\n\n```bash\nexport API_KEY=\"tu-clave\"\nexport BASE_URL=\"https://tu-endpoint\"\npython lagent-v000.py\n```\n\nEscribe un mensaje después del prompt `>>>` y presiona Enter para enviarlo al modelo. Si solo presionas Enter, no se envía nada.\n\n### Sesiones y memoria (v001)\n\nDesde v001 el chat recuerda la conversación. Cada sesión se guarda en `memory/<nombre>.json` y se carga al arrancar:\n\n```bash\npython lagent-v001.py            # sesión \"default\"\npython lagent-v001.py trabajo    # sesión \"trabajo\"\n```\n\nAl abrir una sesión existente, el modelo retoma la conversación donde quedó.\n\n> **Limitación: este sistema de memoria es ineficiente.** El historial completo se envía al modelo en cada mensaje, y solo se vacía de forma manual con `/clear`. Con el tiempo la memoria crece sin límite, así que cada mensaje lleva más contexto que el anterior. Como las APIs cobran por los tokens que se envían, el costo de cada respuesta aumenta a medida que la sesión se alarga, y eventualmente se puede superar el límite de contexto del modelo. Que la limpieza dependa del usuario hace que, en la práctica, casi nunca se haga. Las siguientes versiones tendrán que resolver esto.\n\n### Comandos\n\nLos comandos empiezan con `/` y no se envían al modelo. No distinguen mayúsculas de minúsculas.\n\n| Comando | Qué hace |\n|---------|----------|\n| `/clear` | Borra la memoria de la sesión actual (v001 en adelante). |\n| `/help` | Muestra los comandos disponibles. |\n| `/exit` o `/quit` | Sale del chat. |\n\nCualquier otro texto que empiece con `/` muestra `Comando desconocido` y no se envía al modelo. También puedes salir con `Ctrl+C` o `Ctrl+D`.\n\n## Objetivo\n\nEntender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.\n",
  "e2015c926745c04dc0d98c82f7c23a1275dc2ab7": "# lagent-v001: conversación con memoria.\n# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.\n# A diferencia de v000, guarda el historial de mensajes en una variable y en un\n# archivo, así el modelo recuerda lo anterior y la conversación sobrevive entre sesiones.\n#\n# Uso: python lagent-v001.py [nombre_de_sesion]\n# Cada sesión se guarda en memory/<nombre_de_sesion>.json (por defecto \"default\").\n\nimport json\nimport os\nimport sys\nimport litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.\n\n# Configuración: la clave de API y la URL base se leen de variables de entorno\n# para no dejar datos sensibles escritos en el código.\nAPI_KEY = os.environ.get(\"API_KEY\")\nBASE_URL = os.environ.get(\"BASE_URL\")\n\n#  Modelo a utilizar, con el formato \"proveedor/modelo\" que usa litellm.\n# Se puede cambiar con la variable de entorno MODEL sin tocar el código.\nMODEL = os.environ.get(\"MODEL\", \"anthropic/claude-haiku-5-5\")\n\n# Instrucciones generales para el modelo.\nSYSTEM_PROMPT = \"Eres un asistente útil.\"\n\n# Carpeta donde se guardan las sesiones, una por archivo.\nMEMORY_DIR = \"memory\"\n\n# Carga el historial de una sesión desde su archivo.\n# Si el archivo no existe (sesión nueva) o está dañado, empieza con un historial vacío.\ndef load_memory(path):\n    if not os.path.exists(path):\n        return []\n    try:\n        with open(path, encoding=\"utf-8\") as f:\n            return json.load(f)\n    except (json.JSONDecodeError, OSError) as e:\n        print(f\"No se pudo leer la sesión ({e}). Se empieza con memoria vacía.\")\n        return []\n\n# Guarda el historial completo en el archivo de la sesión.\n# Se escribe primero a un archivo temporal y luego se reemplaza, para no dejar\n# el archivo a medias si el programa se corta mientras escribe.\ndef save_memory(path, messages):\n    os.makedirs(os.path.dirname(path), exist_ok=True)\n    tmp_path = path + \".tmp\"\n    with open(tmp_path, \"w\", encoding=\"utf-8\") as f:\n        json.dump(messages, f, ensure_ascii=False, indent=2)\n    os.replace(tmp_path, path)\n\n# Función para enviar la conversación al modelo de lenguaje y obtener una respuesta.\n# Recibe el prompt de sistema (instrucciones para el modelo) y el historial de mensajes.\n# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide\n# qué hacer, así un error nunca se confunde con una respuesta del modelo.\ndef send_message(system_prompt, messages):\n    response = litellm.completion(\n        model=MODEL,\n        # La conversación es una lista de mensajes, cada uno con un rol:\n        # \"system\" para las instrucciones, \"user\" para lo que escribe la persona\n        # y \"assistant\" para lo que respondió el modelo. El prompt de sistema va\n        # siempre primero y no se guarda en el historial.\n        messages=[{\"role\": \"system\", \"content\": system_prompt}] + messages,\n        api_key=API_KEY,\n        api_base=BASE_URL,\n    )\n    # La respuesta trae una lista de opciones (\"choices\"); se toma el texto de la primera.\n    return response.choices[0].message.content # type: ignore\n\n# Sistema de comandos basicos para controlar el chat.\n# Recibe el historial para poder modificarlo (por ejemplo, /clear lo vacía).\n# Devuelve:\n#   - None: el texto no es un comando, hay que enviarlo al modelo.\n#   - True: era un comando de salida, hay que terminar el chat.\n#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.\ndef handle_command(user_input, messages, memory_path):\n    command = user_input.lower()\n    if command in [\"/exit\", \"/quit\"]:\n        print(\"Saliendo del chat...\")\n        return True\n    # Borra la memoria de la sesión, tanto la variable como el archivo.\n    elif command == \"/clear\":\n        messages.clear()\n        save_memory(memory_path, messages)\n        print(\"Memoria borrada.\")\n        return False\n    # Muestra los comandos disponibles.\n    elif command == \"/help\":\n        print(\"Comandos disponibles:\")\n        print(\"/exit o /quit: Salir del chat.\")\n        print(\"/clear: Borrar la memoria de esta sesión.\")\n        print(\"/help: Mostrar esta ayuda.\")\n        return False\n    # Cualquier otra cosa que empiece con \"/\" es un comando mal escrito:\n    # no se manda al modelo.\n    elif command.startswith(\"/\"):\n        print(f\"Comando desconocido: {command}. Usa /help.\")\n        return False\n    return None\n\n# Función principal: bucle de chat en la terminal.\n# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.\ndef main():\n    # El nombre de la sesión se toma del primer argumento; define el archivo de memoria.\n    session = sys.argv[1] if len(sys.argv) > 1 else \"default\"\n    memory_path = os.path.join(MEMORY_DIR, f\"{session}.json\")\n\n    # Memoria: lista con todos los mensajes de la conversación, en orden.\n    # Cada elemento es {\"role\": \"user\" | \"assistant\", \"content\": texto}.\n    messages = load_memory(memory_path)\n    print(f\"Sesión '{session}' ({len(messages)} mensajes en memoria). Usa /help para ver los comandos.\")\n\n    try:\n        # Se repite hasta que el usuario salga con /exit, /quit, Ctrl+C o Ctrl+D.\n        while True:\n            # strip() quita espacios sobrantes (por ejemplo \"/exit \").\n            user_input = input(\">>> \").strip()\n            # Si el usuario solo presiona Enter, no se envía nada.\n            if not user_input:\n                continue\n\n            # Si el texto es un comando, handle_command lo atiende y devuelve\n            # True (salir) o False (seguir); si no lo es, devuelve None.\n            result = handle_command(user_input, messages, memory_path)\n\n            if result is True:\n                break\n            elif result is False:\n                continue\n\n            # Si no es un comando (result es None), se trata como un mensaje para el modelo.\n            # Primero se agrega a la memoria, para que el modelo lo reciba junto con todo lo anterior.\n            messages.append({\"role\": \"user\", \"content\": user_input})\n            try:\n                reply = send_message(SYSTEM_PROMPT, messages)\n                print(reply)\n                # Solo las respuestas reales del modelo entran a la memoria, y se guarda\n                # en el archivo después de cada intercambio por si el programa se corta.\n                messages.append({\"role\": \"assistant\", \"content\": reply})\n                save_memory(memory_path, messages)\n            except Exception as e:\n                # El error se muestra en pantalla pero no entra a la memoria: se quita\n                # también el mensaje del usuario para poder reintentar sin duplicarlo.\n                messages.pop()\n                print(f\"Error: {e}\")\n\n    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.\n    except (KeyboardInterrupt, EOFError):\n        print(\"\\nSaliendo del chat...\")\n\n    # Cualquier otro error inesperado se muestra en pantalla.\n    except Exception as e:\n        print(f\"Error: {e}\")\n\n# Ejecuta main() solo si el script se corre directamente (no si se importa).\nif __name__ == \"__main__\":\n    main()\n",
  "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391": "",
  "400208ded56ce21b8d5ac7bf6c64dd9d63a39e04": "# Python\n__pycache__/\n*.py[cod]\n*.egg-info/\nbuild/\ndist/\n\n# Entornos virtuales\n.venv/\nvenv/\nenv/\n\n# Secretos y variables de entorno\n.env\n.env.*\n\n# IDE y sistema\n.vscode/\n.idea/\n.DS_Store\n\n# Claude Code\n.claude/\n\n# Sesiones del agente\nmemory/*\n!memory/.fakeignore",
  "685443f89f83eeb357f82fe2f55e2a5d3ff514f6": "# LearningAgent\n\nEste repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.\n\nEl nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.\n\nCada versión es un archivo independiente (`lagent-vXXX.py`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.\n\n## Cómo está organizado\n\n- Un archivo por versión: `lagent-v000.py`, `lagent-v001.py`, etc.\n- Cada archivo empieza con un comentario que explica qué hace y qué le falta.\n- Cada versión se puede ejecutar sola.\n\n## Versiones\n\n| Versión | Archivo | Qué agrega |\n|---------|---------|------------|\n| v000 | [lagent-v000.py](lagent-v000.py) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat. |\n| v001 | [lagent-v001.py](lagent-v001.py) | Agrega memoria: guarda el historial de mensajes en una variable y en un archivo, para que el modelo recuerde la conversación y esta sobreviva entre sesiones. |\n\n> Esta tabla crece a medida que el agente evoluciona.\n\n## Requisitos\n\n- Python 3\n- [litellm](https://github.com/BerriAI/litellm): `pip install litellm`\n- Variables de entorno:\n  - `API_KEY`: clave de la API del proveedor.\n  - `BASE_URL`: URL base del modelo.\n  - `MODEL` (opcional): modelo a usar, con el formato `proveedor/modelo`. Por defecto `anthropic/claude-haiku-5-5`.\n\n## Uso\n\n```bash\nexport API_KEY=\"tu-clave\"\nexport BASE_URL=\"https://tu-endpoint\"\npython lagent-v000.py\n```\n\nEscribe un mensaje después del prompt `>>>` y presiona Enter para enviarlo al modelo. Si solo presionas Enter, no se envía nada.\n\n### Sesiones y memoria (v001)\n\nDesde v001 el chat recuerda la conversación. Cada sesión se guarda en `memory/<nombre>.json` y se carga al arrancar:\n\n```bash\npython lagent-v001.py            # sesión \"default\"\npython lagent-v001.py trabajo    # sesión \"trabajo\"\n```\n\nEl nombre de la sesión solo puede tener letras, números, `-` y `_`. Cualquier otro nombre (por ejemplo `../x` o uno vacío) se rechaza, para que nunca se escriba fuera de `memory/`. Los archivos de sesión están en el `.gitignore`.\n\nAntes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados (`[tokens enviados: 1234]`), si el proveedor la informa. Sirve para ver cómo crece el costo a medida que el historial se alarga.\n\nAl abrir una sesión existente, el modelo retoma la conversación donde quedó.\n\n> **Limitación: este sistema de memoria es ineficiente.** El historial completo se envía al modelo en cada mensaje, y solo se vacía de forma manual con `/clear`. Con el tiempo la memoria crece sin límite, así que cada mensaje lleva más contexto que el anterior. Como las APIs cobran por los tokens que se envían, el costo de cada respuesta aumenta a medida que la sesión se alarga, y eventualmente se puede superar el límite de contexto del modelo. Que la limpieza dependa del usuario hace que, en la práctica, casi nunca se haga. Las siguientes versiones tendrán que resolver esto.\n\n### Comandos\n\nLos comandos empiezan con `/` y no se envían al modelo. No distinguen mayúsculas de minúsculas.\n\n| Comando | Qué hace |\n|---------|----------|\n| `/clear` | Borra la memoria de la sesión actual (v001 en adelante). |\n| `/help` | Muestra los comandos disponibles. |\n| `/exit` o `/quit` | Sale del chat. |\n\nCualquier otro texto que empiece con `/` muestra `Comando desconocido` y no se envía al modelo. También puedes salir con `Ctrl+C` o `Ctrl+D`.\n\n## Objetivo\n\nEntender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.\n",
  "874bdf8af4237220acd2ddc5c16f4763254f627f": "# lagent-v001: conversación con memoria.\n# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.\n# A diferencia de v000, guarda el historial de mensajes en una variable y en un\n# archivo, así el modelo recuerda lo anterior y la conversación sobrevive entre sesiones.\n#\n# Uso: python lagent-v001.py [nombre_de_sesion]\n# Cada sesión se guarda en memory/<nombre_de_sesion>.json (por defecto \"default\").\n# El nombre solo puede tener letras, números, \"-\" y \"_\", para que nunca se pueda\n# escribir fuera de la carpeta memory/.\n# Antes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados,\n# para ver cómo crece el costo a medida que el historial se alarga.\n\nimport json\nimport os\nimport re\nimport sys\nimport litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.\n\n# Configuración: la clave de API y la URL base se leen de variables de entorno\n# para no dejar datos sensibles escritos en el código.\nAPI_KEY = os.environ.get(\"API_KEY\")\nBASE_URL = os.environ.get(\"BASE_URL\")\n\n#  Modelo a utilizar, con el formato \"proveedor/modelo\" que usa litellm.\n# Se puede cambiar con la variable de entorno MODEL sin tocar el código.\nMODEL = os.environ.get(\"MODEL\", \"anthropic/claude-haiku-5-5\")\n\n# Instrucciones generales para el modelo.\nSYSTEM_PROMPT = \"Eres un asistente útil.\"\n\n# Carpeta donde se guardan las sesiones, una por archivo.\nMEMORY_DIR = \"memory\"\n\n# Carga el historial de una sesión desde su archivo.\n# Si el archivo no existe (sesión nueva) o está dañado, empieza con un historial vacío.\n# Un JSON válido que no sea una lista de mensajes también se considera dañado.\ndef load_memory(path):\n    if not os.path.exists(path):\n        return []\n    try:\n        with open(path, encoding=\"utf-8\") as f:\n            data = json.load(f)\n        if not isinstance(data, list):\n            raise ValueError(\"el archivo no contiene una lista de mensajes\")\n        return data\n    except (ValueError, OSError) as e:  # JSONDecodeError es un tipo de ValueError\n        print(f\"No se pudo leer la sesión ({e}). Se empieza con memoria vacía.\")\n        return []\n\n# Guarda el historial completo en el archivo de la sesión.\n# Se escribe primero a un archivo temporal y luego se reemplaza, para no dejar\n# el archivo a medias si el programa se corta mientras escribe.\ndef save_memory(path, messages):\n    os.makedirs(os.path.dirname(path), exist_ok=True)\n    tmp_path = path + \".tmp\"\n    with open(tmp_path, \"w\", encoding=\"utf-8\") as f:\n        json.dump(messages, f, ensure_ascii=False, indent=2)\n    os.replace(tmp_path, path)\n\n# Función para enviar la conversación al modelo de lenguaje y obtener una respuesta.\n# Recibe el prompt de sistema (instrucciones para el modelo) y el historial de mensajes.\n# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide\n# qué hacer, así un error nunca se confunde con una respuesta del modelo.\ndef send_message(system_prompt, messages):\n    response = litellm.completion(\n        model=MODEL,\n        # La conversación es una lista de mensajes, cada uno con un rol:\n        # \"system\" para las instrucciones, \"user\" para lo que escribe la persona\n        # y \"assistant\" para lo que respondió el modelo. El prompt de sistema va\n        # siempre primero y no se guarda en el historial.\n        messages=[\n            {\n                \"role\": \"system\", \n                \"content\": system_prompt\n            }\n            ] + messages,\n        api_key=API_KEY,\n        api_base=BASE_URL,\n    )\n    # Mostramos los tokens enviados, que crecen con el historial y es lo que se cobra.\n    # \"usage\" puede venir vacío según el proveedor o el proxy. Por eso se lee con getattr\n    # y se muestra solo si existe: si faltara, un error acá descartaría una respuesta que\n    # el modelo ya generó (y que ya se cobró) solo por no poder mostrar el contador.\n    usage = getattr(response, \"usage\", None)\n    if usage is not None:\n        print(f\"[tokens enviados: {usage.prompt_tokens}]\")\n    # La respuesta trae una lista de opciones (\"choices\"); se toma el texto de la primera.\n    return response.choices[0].message.content # type: ignore\n\n# Sistema de comandos basicos para controlar el chat.\n# Recibe el historial para poder modificarlo (por ejemplo, /clear lo vacía).\n# Devuelve:\n#   - None: el texto no es un comando, hay que enviarlo al modelo.\n#   - True: era un comando de salida, hay que terminar el chat.\n#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.\ndef handle_command(user_input, messages, memory_path):\n    command = user_input.lower()\n    if command in [\"/exit\", \"/quit\"]:\n        print(\"Saliendo del chat...\")\n        return True\n    # Borra la memoria de la sesión, tanto la variable como el archivo.\n    elif command == \"/clear\":\n        messages.clear()\n        save_memory(memory_path, messages)\n        print(\"Memoria borrada.\")\n        return False\n    # Muestra los comandos disponibles.\n    elif command == \"/help\":\n        print(\"Comandos disponibles:\")\n        print(\"/exit o /quit: Salir del chat.\")\n        print(\"/clear: Borrar la memoria de esta sesión.\")\n        print(\"/help: Mostrar esta ayuda.\")\n        return False\n    # Cualquier otra cosa que empiece con \"/\" es un comando mal escrito:\n    # no se manda al modelo.\n    elif command.startswith(\"/\"):\n        print(f\"Comando desconocido: {command}. Usa /help.\")\n        return False\n    return None\n\n# Función principal: bucle de chat en la terminal.\n# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.\ndef main():\n    # El nombre de la sesión se toma del primer argumento; define el archivo de memoria.\n    # Se rechaza en vez de \"limpiarlo\": así un nombre con \"/\" o \"..\" no se transforma\n    # en silencio en otro archivo, y no hay forma de salirse de la carpeta memory/.\n    session = sys.argv[1] if len(sys.argv) > 1 else \"default\"\n    if not re.fullmatch(r\"[A-Za-z0-9_-]+\", session):\n        sys.exit(\"Nombre de sesión inválido: usa solo letras, números, '-' y '_'.\")\n    memory_path = os.path.join(MEMORY_DIR, f\"{session}.json\")\n\n    # Memoria: lista con todos los mensajes de la conversación, en orden.\n    # Cada elemento es {\"role\": \"user\" | \"assistant\", \"content\": texto}.\n    messages = load_memory(memory_path)\n    print(f\"Sesión '{session}' ({len(messages)} mensajes en memoria). Usa /help para ver los comandos.\")\n\n    try:\n        # Se repite hasta que el usuario salga con /exit, /quit, Ctrl+C o Ctrl+D.\n        while True:\n            # strip() quita espacios sobrantes (por ejemplo \"/exit \").\n            user_input = input(\">>> \").strip()\n            # Si el usuario solo presiona Enter, no se envía nada.\n            if not user_input:\n                continue\n\n            # Si el texto es un comando, handle_command lo atiende y devuelve\n            # True (salir) o False (seguir); si no lo es, devuelve None.\n            result = handle_command(user_input, messages, memory_path)\n\n            if result is True:\n                break\n            elif result is False:\n                continue\n\n            # Si no es un comando (result es None), se trata como un mensaje para el modelo.\n            # Primero se agrega a la memoria, para que el modelo lo reciba junto con todo lo anterior.\n            messages.append(\n                {\n                    \"role\": \"user\", \n                    \"content\": user_input\n                }\n            )\n            try:\n                reply = send_message(SYSTEM_PROMPT, messages)\n            except Exception as e:\n                # El error se muestra en pantalla pero no entra a la memoria: se quita\n                # también el mensaje del usuario para poder reintentar sin duplicarlo.\n                messages.pop()\n                print(f\"Error: {e}\")\n                continue\n\n            # Una respuesta vacía no se guarda: un mensaje vacío en el historial se\n            # reenviaría en cada pregunta siguiente y la API podría rechazarlo, dejando\n            # la sesión inutilizable. Se avisa y se quita el mensaje del usuario para reintentar.\n            if not reply:\n                messages.pop()\n                print(\"El modelo devolvió una respuesta vacía. Intenta de nuevo.\")\n                continue\n\n            print(reply)\n            # Solo las respuestas reales (no vacías) del modelo entran a la memoria.\n            messages.append(\n                {\n                    \"role\": \"assistant\", \n                    \"content\": reply\n                }\n            )\n\n            # Se guarda en el archivo después de cada intercambio por si el programa se corta.\n            # Va en su propio try: si falla el guardado la respuesta ya es válida, así que\n            # se conserva en la memoria en RAM y solo se avisa (no se deshace nada).\n            try:\n                save_memory(memory_path, messages)\n            except OSError as e:\n                print(f\"No se pudo guardar la sesión: {e}\")\n\n    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.\n    except (KeyboardInterrupt, EOFError):\n        print(\"\\nSaliendo del chat...\")\n\n    # Cualquier otro error inesperado se muestra en pantalla.\n    except Exception as e:\n        print(f\"Error: {e}\")\n\n# Ejecuta main() solo si el script se corre directamente (no si se importa).\nif __name__ == \"__main__\":\n    main()\n",
  "fb1b08d949d5a63c24ba9c9ccb2045be642d76a2": "# Python\n__pycache__/\n*.py[cod]\n*.egg-info/\nbuild/\ndist/\n\n# Entornos virtuales\n.venv/\nvenv/\nenv/\n\n# Secretos y variables de entorno\n.env\n.env.*\n\n# IDE y sistema\n.vscode/\n.idea/\n.DS_Store\n\n# Claude Code\n.claude/\n\n# Sesiones del agente\nmemory/*\n!memory/.fakeignore\n",
  "ca6a18e8798dc8f339811a564f7a92b0d2cf8727": "# lagent-v001: conversación con memoria.\n# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.\n# A diferencia de v000, guarda el historial de mensajes en una variable y en un\n# archivo, así el modelo recuerda lo anterior y la conversación sobrevive entre sesiones.\n#\n# Uso: python lagent-v001.py [nombre_de_sesion]\n# Cada sesión se guarda en memory/<nombre_de_sesion>.json (por defecto \"default\").\n# El nombre solo puede tener letras, números, \"-\" y \"_\", para que nunca se pueda\n# escribir fuera de la carpeta memory/.\n# Antes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados,\n# para ver cómo crece el costo a medida que el historial se alarga.\n\nimport json\nimport os\nimport re\nimport sys\nimport litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.\n\n# Configuración: la clave de API y la URL base se leen de variables de entorno\n# para no dejar datos sensibles escritos en el código.\nAPI_KEY = os.environ.get(\"API_KEY\")\nBASE_URL = os.environ.get(\"BASE_URL\")\n\n#  Modelo a utilizar, con el formato \"proveedor/modelo\" que usa litellm.\n# Se puede cambiar con la variable de entorno MODEL sin tocar el código.\nMODEL = os.environ.get(\"MODEL\", \"anthropic/claude-haiku-5-5\")\n\n# Instrucciones generales para el modelo.\nSYSTEM_PROMPT = \"Eres un asistente útil.\"\n\n# Carpeta donde se guardan las sesiones, una por archivo.\nMEMORY_DIR = \"memory\"\n\n# Carga el historial de una sesión desde su archivo.\n# Si el archivo no existe (sesión nueva) o está dañado, empieza con un historial vacío.\n# Un JSON válido que no sea una lista de mensajes también se considera dañado.\ndef load_memory(path):\n    if not os.path.exists(path):\n        return []\n    try:\n        with open(path, encoding=\"utf-8\") as f:\n            data = json.load(f)\n        if not isinstance(data, list):\n            raise ValueError(\"el archivo no contiene una lista de mensajes\")\n        return data\n    except (ValueError, OSError) as e:  # JSONDecodeError es un tipo de ValueError\n        print(f\"No se pudo leer la sesión ({e}). Se empieza con memoria vacía.\")\n        return []\n\n# Guarda el historial completo en el archivo de la sesión.\n# Se escribe primero a un archivo temporal y luego se reemplaza, para no dejar\n# el archivo a medias si el programa se corta mientras escribe.\ndef save_memory(path, messages):\n    os.makedirs(os.path.dirname(path), exist_ok=True)\n    tmp_path = path + \".tmp\"\n    with open(tmp_path, \"w\", encoding=\"utf-8\") as f:\n        json.dump(messages, f, ensure_ascii=False, indent=2)\n    os.replace(tmp_path, path)\n\n# Función para enviar la conversación al modelo de lenguaje y obtener una respuesta.\n# Recibe el prompt de sistema (instrucciones para el modelo) y el historial de mensajes.\n# Devuelve el texto de la respuesta y el uso de tokens (que puede ser None).\n# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide\n# qué hacer, así un error nunca se confunde con una respuesta del modelo.\ndef send_message(system_prompt, messages):\n    response = litellm.completion(\n        model=MODEL,\n        # La conversación es una lista de mensajes, cada uno con un rol:\n        # \"system\" para las instrucciones, \"user\" para lo que escribe la persona\n        # y \"assistant\" para lo que respondió el modelo. El prompt de sistema va\n        # siempre primero y no se guarda en el historial.\n        messages=[\n            {\n                \"role\": \"system\", \n                \"content\": system_prompt\n            }\n            ] + messages,\n        api_key=API_KEY,\n        api_base=BASE_URL,\n    )\n    # \"usage\" informa los tokens enviados y puede venir vacío según el proveedor o el proxy.\n    usage = getattr(response, \"usage\", None)\n    # La respuesta trae una lista de opciones (\"choices\"); se toma el texto de la primera.\n    return response.choices[0].message.content, usage  # type: ignore\n\n# Sistema de comandos basicos para controlar el chat.\n# Recibe el historial para poder modificarlo (por ejemplo, /clear lo vacía).\n# Devuelve:\n#   - None: el texto no es un comando, hay que enviarlo al modelo.\n#   - True: era un comando de salida, hay que terminar el chat.\n#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.\ndef handle_command(user_input, messages, memory_path):\n    command = user_input.lower()\n    if command in [\"/exit\", \"/quit\"]:\n        print(\"Saliendo del chat...\")\n        return True\n    # Borra la memoria de la sesión, tanto la variable como el archivo.\n    elif command == \"/clear\":\n        messages.clear()\n        save_memory(memory_path, messages)\n        print(\"Memoria borrada.\")\n        return False\n    # Muestra los comandos disponibles.\n    elif command == \"/help\":\n        print(\"Comandos disponibles:\")\n        print(\"/exit o /quit: Salir del chat.\")\n        print(\"/clear: Borrar la memoria de esta sesión.\")\n        print(\"/help: Mostrar esta ayuda.\")\n        return False\n    # Cualquier otra cosa que empiece con \"/\" es un comando mal escrito:\n    # no se manda al modelo.\n    elif command.startswith(\"/\"):\n        print(f\"Comando desconocido: {command}. Usa /help.\")\n        return False\n    return None\n\n# Función principal: bucle de chat en la terminal.\n# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.\ndef main():\n    # El nombre de la sesión se toma del primer argumento; define el archivo de memoria.\n    # Se rechaza en vez de \"limpiarlo\": así un nombre con \"/\" o \"..\" no se transforma\n    # en silencio en otro archivo, y no hay forma de salirse de la carpeta memory/.\n    session = sys.argv[1] if len(sys.argv) > 1 else \"default\"\n    if not re.fullmatch(r\"[A-Za-z0-9_-]+\", session):\n        sys.exit(\"Nombre de sesión inválido: usa solo letras, números, '-' y '_'.\")\n    memory_path = os.path.join(MEMORY_DIR, f\"{session}.json\")\n\n    # Memoria: lista con todos los mensajes de la conversación, en orden.\n    # Cada elemento es {\"role\": \"user\" | \"assistant\", \"content\": texto}.\n    messages = load_memory(memory_path)\n    print(f\"Sesión '{session}' ({len(messages)} mensajes en memoria). Usa /help para ver los comandos.\")\n\n    try:\n        # Se repite hasta que el usuario salga con /exit, /quit, Ctrl+C o Ctrl+D.\n        while True:\n            # strip() quita espacios sobrantes (por ejemplo \"/exit \").\n            user_input = input(\">>> \").strip()\n            # Si el usuario solo presiona Enter, no se envía nada.\n            if not user_input:\n                continue\n\n            # Si el texto es un comando, handle_command lo atiende y devuelve\n            # True (salir) o False (seguir); si no lo es, devuelve None.\n            result = handle_command(user_input, messages, memory_path)\n\n            if result is True:\n                break\n            elif result is False:\n                continue\n\n            # Si no es un comando (result es None), se trata como un mensaje para el modelo.\n            # Primero se agrega a la memoria, para que el modelo lo reciba junto con todo lo anterior.\n            messages.append(\n                {\n                    \"role\": \"user\", \n                    \"content\": user_input\n                }\n            )\n            try:\n                reply, usage = send_message(SYSTEM_PROMPT, messages)\n            except Exception as e:\n                # El error se muestra en pantalla pero no entra a la memoria: se quita\n                # también el mensaje del usuario para poder reintentar sin duplicarlo.\n                messages.pop()\n                print(f\"Error: {e}\")\n                continue\n\n            # Mostramos los tokens enviados, que crecen con el historial y es lo que se cobra.\n            # Va fuera del try anterior a propósito: ese except descarta la respuesta, y un\n            # contador incompleto no debe tirar una respuesta que el modelo ya generó (y que\n            # ya se cobró). Por eso se lee con getattr y se muestra solo si existe.\n            prompt_tokens = getattr(usage, \"prompt_tokens\", None)\n            if prompt_tokens is not None:\n                print(f\"[tokens enviados: {prompt_tokens}]\")\n\n            # Una respuesta vacía no se guarda: un mensaje vacío en el historial se\n            # reenviaría en cada pregunta siguiente y la API podría rechazarlo, dejando\n            # la sesión inutilizable. Se avisa y se quita el mensaje del usuario para reintentar.\n            if not reply:\n                messages.pop()\n                print(\"El modelo devolvió una respuesta vacía. Intenta de nuevo.\")\n                continue\n\n            print(reply)\n            # Solo las respuestas reales (no vacías) del modelo entran a la memoria.\n            messages.append(\n                {\n                    \"role\": \"assistant\", \n                    \"content\": reply\n                }\n            )\n\n            # Se guarda en el archivo después de cada intercambio por si el programa se corta.\n            # Va en su propio try: si falla el guardado la respuesta ya es válida, así que\n            # se conserva en la memoria en RAM y solo se avisa (no se deshace nada).\n            try:\n                save_memory(memory_path, messages)\n            except OSError as e:\n                print(f\"No se pudo guardar la sesión: {e}\")\n\n    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.\n    except (KeyboardInterrupt, EOFError):\n        print(\"\\nSaliendo del chat...\")\n\n    # Cualquier otro error inesperado se muestra en pantalla.\n    except Exception as e:\n        print(f\"Error: {e}\")\n\n# Ejecuta main() solo si el script se corre directamente (no si se importa).\nif __name__ == \"__main__\":\n    main()\n",
  "98ed39d29eda5af2bf9c47a067cb01fdeda8c595": "# LearningAgent\n\nEste repositorio cuenta la historia de un agente: desde la idea más simple hasta verlo complejizarse paso a paso. Es el camino de un programa sencillo que consume una API de IA hasta convertirse en un agente.\n\nEl nombre sigue la misma filosofía de sencillez: `lagent` viene de *learning agent*.\n\nCada versión es un archivo independiente (`lagent-vXXX.py`) que agrega una capacidad nueva sobre la anterior. Así se puede leer, ejecutar y comparar cada etapa por separado y ver qué cambia y por qué.\n\n## Cómo está organizado\n\n- Un archivo por versión: `lagent-v000.py`, `lagent-v001.py`, etc.\n- Cada archivo empieza con un comentario que explica qué hace y qué le falta.\n- Cada versión se puede ejecutar sola.\n\n## Versiones\n\n| Versión | Archivo | Qué agrega |\n|---------|---------|------------|\n| v000 | [lagent-v000.py](lagent-v000.py) | El sistema conversacional más simple posible con `litellm`. Cada mensaje es independiente: sin memoria ni contexto. Incluye comandos básicos para controlar el chat. |\n| v001 | [lagent-v001.py](lagent-v001.py) | Agrega memoria: guarda el historial de mensajes en una variable y en un archivo, para que el modelo recuerde la conversación y esta sobreviva entre sesiones. Muestra los tokens enviados en cada mensaje para ver cómo crece el costo. |\n\n> Esta tabla crece a medida que el agente evoluciona.\n\n## Requisitos\n\n- Python 3\n- [litellm](https://github.com/BerriAI/litellm): `pip install litellm`\n- Variables de entorno:\n  - `API_KEY`: clave de la API del proveedor.\n  - `BASE_URL`: URL base del modelo.\n  - `MODEL` (opcional): modelo a usar, con el formato `proveedor/modelo`. Por defecto `anthropic/claude-haiku-5-5`.\n\n## Uso\n\n```bash\nexport API_KEY=\"tu-clave\"\nexport BASE_URL=\"https://tu-endpoint\"\npython lagent-v000.py\n```\n\nEscribe un mensaje después del prompt `>>>` y presiona Enter para enviarlo al modelo. Si solo presionas Enter, no se envía nada.\n\n### Sesiones y memoria (v001)\n\nDesde v001 el chat recuerda la conversación. Cada sesión se guarda en `memory/<nombre>.json` y se carga al arrancar:\n\n```bash\npython lagent-v001.py            # sesión \"default\"\npython lagent-v001.py trabajo    # sesión \"trabajo\"\n```\n\nAl abrir una sesión existente, el modelo retoma la conversación donde quedó.\n\nEl nombre de la sesión solo puede tener letras, números, `-` y `_`. Cualquier otro nombre (por ejemplo `../x` o uno vacío) se rechaza, para que nunca se escriba fuera de `memory/`. Los archivos de sesión están en el `.gitignore`.\n\nAntes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados (`[tokens enviados: 1234]`), si el proveedor la informa. Sirve para ver cómo crece el costo a medida que el historial se alarga.\n\nCasos especiales:\n\n- Si el modelo devuelve una respuesta vacía, no se guarda en la memoria (un mensaje vacío en el historial podría hacer que la API rechace todos los mensajes siguientes). Se avisa y se puede reintentar.\n- Si la llamada al modelo falla, el error se muestra pero no entra a la memoria, y el mensaje del usuario se descarta para poder reintentar sin duplicarlo.\n- Si falla el guardado en disco, el chat sigue funcionando con la memoria en RAM y solo se avisa.\n\n> **Limitación: este sistema de memoria es ineficiente.** El historial completo se envía al modelo en cada mensaje, y solo se vacía de forma manual con `/clear`. Con el tiempo la memoria crece sin límite, así que cada mensaje lleva más contexto que el anterior. Como las APIs cobran por los tokens que se envían, el costo de cada respuesta aumenta a medida que la sesión se alarga, y eventualmente se puede superar el límite de contexto del modelo. Que la limpieza dependa del usuario hace que, en la práctica, casi nunca se haga. Las siguientes versiones tendrán que resolver esto.\n\n### Comandos\n\nLos comandos empiezan con `/` y no se envían al modelo. No distinguen mayúsculas de minúsculas.\n\n| Comando | Qué hace |\n|---------|----------|\n| `/clear` | Borra la memoria de la sesión actual (v001 en adelante). |\n| `/help` | Muestra los comandos disponibles. |\n| `/exit` o `/quit` | Sale del chat. |\n\nCualquier otro texto que empiece con `/` muestra `Comando desconocido` y no se envía al modelo. También puedes salir con `Ctrl+C` o `Ctrl+D`.\n\n## Objetivo\n\nEntender, construyendo, qué separa a una simple llamada a un modelo de lenguaje de un agente: memoria, herramientas, bucle de decisión y las demás piezas que van apareciendo en el camino.\n",
  "482af7b94b034c2b586eb6070e552facf0e485db": "# TODO: LearningAgent\n\nHoja de ruta para las próximas versiones de `lagent`. Cada versión agrega una sola capacidad y deja a la vista la limitación que motiva la siguiente.\n\n## v001: pendientes de cierre\n\n- [x] ~~Quitar los espacios al final de línea en `\"role\": \"system\", `, `\"role\": \"user\", ` y `\"role\": \"assistant\", ` (`ruff check --select W291 --fix lagent-v001.py`)~~\n\n## Arco 1: memoria\n\n### v002: ventana de memoria\n\nResuelve: el historial crece sin límite (la limitación que ya plantea el README).\n\n- [ ] Enviar al modelo solo los últimos N mensajes, configurable con una variable de entorno\n- [ ] Cortar siempre en un mensaje `user`, para que el historial enviado no empiece con `assistant`\n- [ ] Guardar en disco el historial completo y enviar solo la ventana (memoria guardada y memoria enviada son cosas distintas)\n- [ ] Mostrar los tokens enviados para comparar con v001 en la misma conversación\n- [ ] README: explicar la limitación que deja, el modelo olvida de golpe lo que queda fuera de la ventana\n\n### v003: compactación\n\nResuelve: la ventana pierde contexto importante.\n\n- [ ] Cuando los tokens superen un umbral, resumir los mensajes viejos con el modelo y reemplazarlos por el resumen\n- [ ] Resumen con secciones fijas (hechos, decisiones, pendientes), para que no se degrade resumen tras resumen\n- [ ] Guardar el resumen en la sesión junto con los mensajes recientes\n- [ ] Comando `/memoria` para ver qué recuerda el agente en ese momento\n- [ ] Mostrar cuándo se compacta y cuántos tokens libera\n- [ ] README: comparar v001, v002 y v003 con la misma conversación\n\n## Arco 2: de chat a agente\n\n### v004: tools y loop\n\nResuelve: el sistema solo conversa, no puede hacer nada.\n\n- [ ] Definir tools con schema (partir con dos inofensivas, por ejemplo leer un archivo y consultar la hora)\n- [ ] Loop: si el modelo pide una tool, se ejecuta, se devuelve el resultado y se vuelve a llamar al modelo hasta que responda con texto\n- [ ] Guardar en memoria los mensajes de tool call y de tool result, respetando el pareo entre ambos\n- [ ] `send_message` devuelve la respuesta completa del modelo, ya no solo el texto (las respuestas con tool calls pueden traer contenido vacío)\n- [ ] Decidir la estructura del repo: seguir con un archivo por versión o pasar a carpetas (`v004/agent.py`, `v004/tools.py`)\n\n### v005: guardrails\n\nResuelve: el agente puede ejecutar cualquier cosa y quedarse en un loop.\n\n- [ ] Allowlist de tools y de comandos\n- [ ] Paths confinados a una carpeta de trabajo\n- [ ] Tope de pasos por mensaje del usuario\n- [ ] Recortar resultados largos de tools antes de devolverlos al modelo\n- [ ] Los bloqueos vuelven al modelo como resultado de la tool, sin cortar el loop\n\n### v006: sensores y gate\n\nResuelve: el modelo se autodeclara listo sin evidencia.\n\n- [ ] Interfaz de sensor (`applies`, `check`) para no acoplar el loop a un tipo de tarea\n- [ ] Sensores al cierre de cada paso si hubo cambios, con los fallos redactados como pendientes y no como órdenes\n- [ ] Deduplicar: si el fallo es igual al del paso anterior, avisar que se repite y sugerir cambiar de enfoque\n- [ ] Tool `complete_task` que el harness acepta solo si los sensores pasan\n- [ ] Cortar la sesión si el mismo fallo se repite varias veces seguidas\n- [ ] Memoria entre sesiones: `progress.md` con lo hecho y un handoff cuando se acaba el presupuesto de pasos\n\n## Arco 3: observabilidad y aislamiento\n\n### v007: trazas\n\nResuelve: no se sabe qué pasó adentro del loop.\n\n- [ ] Árbol de spans en JSONL: sesión, paso, llamada al modelo, tool, sensor, gate, bloqueo\n- [ ] Guardar tokens, latencias, `stop_reason` y el texto del modelo entre tools\n- [ ] No guardar contenido completo de archivos escritos, solo largo y hash\n- [ ] Totales en el span raíz para comparar corridas\n- [ ] Script `trace_report.py` que muestra el árbol, con opción `--errors`\n- [ ] Nota: se puede adelantar justo después de v004, porque ayuda a depurar todo lo que viene\n\n### v008: sandbox\n\nResuelve: los guardrails por allowlist son frágiles.\n\n- [ ] Las tools corren dentro de un contenedor Docker de larga vida por sesión\n- [ ] Contenedor sin red, rootfs de solo lectura, sin capabilities, usuario no root y con límites de recursos\n- [ ] Trabajo sobre un git worktree en rama propia, el repo original no se toca\n- [ ] Al terminar, la rama queda lista para revisar como un PR\n\n## Arco 4: escala\n\n### v009: varios modelos por rol\n\nResuelve: costo y sesgo de autoevaluación con un solo modelo.\n\n- [ ] Tabla de modelos por rol (planificador, trabajador, revisor, compactador)\n- [ ] Revisor de otra familia de modelos\n- [ ] Escalar al modelo grande cuando se repiten los fallos\n- [ ] Todo a través del gateway, con el rol registrado en las trazas\n\n### v010: orquestador y sub-agentes\n\nResuelve: tareas grandes que no caben en un solo contexto.\n\n- [ ] Planificador que produce un plan estructurado (JSON) como contrato común\n- [ ] Sub-agentes en paralelo con contexto aislado y un semáforo de concurrencia\n- [ ] Sensores por unidad de trabajo, con reintentos acotados\n- [ ] Integrador final y gate sobre el resultado completo\n- [ ] Ejemplo fuera de código: redacción de un documento por secciones\n\n## Transversal\n\n- [ ] Cada versión con su fila en la tabla del README y su sección de limitaciones\n- [ ] Mantener cada versión ejecutable sola\n- [ ] Ejemplos reproducibles en el README para comparar versiones con la misma entrada",
  "0aceca4d72154884ac64e8e7f4cc792ed6524428": "# lagent-v001: conversación con memoria.\n# Se puede ejecutar desde la terminal y enviar mensajes al modelo de lenguaje.\n# A diferencia de v000, guarda el historial de mensajes en una variable y en un\n# archivo, así el modelo recuerda lo anterior y la conversación sobrevive entre sesiones.\n#\n# Uso: python lagent-v001.py [nombre_de_sesion]\n# Cada sesión se guarda en memory/<nombre_de_sesion>.json (por defecto \"default\").\n# El nombre solo puede tener letras, números, \"-\" y \"_\", para que nunca se pueda\n# escribir fuera de la carpeta memory/.\n# Antes de cada respuesta se muestra entre corchetes la cantidad de tokens enviados,\n# para ver cómo crece el costo a medida que el historial se alarga.\n\nimport json\nimport os\nimport re\nimport sys\nimport litellm  # Se usa para interactuar con muchos modelos de lenguaje de manera sencilla.\n\n# Configuración: la clave de API y la URL base se leen de variables de entorno\n# para no dejar datos sensibles escritos en el código.\nAPI_KEY = os.environ.get(\"API_KEY\")\nBASE_URL = os.environ.get(\"BASE_URL\")\n\n#  Modelo a utilizar, con el formato \"proveedor/modelo\" que usa litellm.\n# Se puede cambiar con la variable de entorno MODEL sin tocar el código.\nMODEL = os.environ.get(\"MODEL\", \"anthropic/claude-haiku-5-5\")\n\n# Instrucciones generales para el modelo.\nSYSTEM_PROMPT = \"Eres un asistente útil.\"\n\n# Carpeta donde se guardan las sesiones, una por archivo.\nMEMORY_DIR = \"memory\"\n\n# Carga el historial de una sesión desde su archivo.\n# Si el archivo no existe (sesión nueva) o está dañado, empieza con un historial vacío.\n# Un JSON válido que no sea una lista de mensajes también se considera dañado.\ndef load_memory(path):\n    if not os.path.exists(path):\n        return []\n    try:\n        with open(path, encoding=\"utf-8\") as f:\n            data = json.load(f)\n        if not isinstance(data, list):\n            raise ValueError(\"el archivo no contiene una lista de mensajes\")\n        return data\n    except (ValueError, OSError) as e:  # JSONDecodeError es un tipo de ValueError\n        print(f\"No se pudo leer la sesión ({e}). Se empieza con memoria vacía.\")\n        return []\n\n# Guarda el historial completo en el archivo de la sesión.\n# Se escribe primero a un archivo temporal y luego se reemplaza, para no dejar\n# el archivo a medias si el programa se corta mientras escribe.\ndef save_memory(path, messages):\n    os.makedirs(os.path.dirname(path), exist_ok=True)\n    tmp_path = path + \".tmp\"\n    with open(tmp_path, \"w\", encoding=\"utf-8\") as f:\n        json.dump(messages, f, ensure_ascii=False, indent=2)\n    os.replace(tmp_path, path)\n\n# Función para enviar la conversación al modelo de lenguaje y obtener una respuesta.\n# Recibe el prompt de sistema (instrucciones para el modelo) y el historial de mensajes.\n# Devuelve el texto de la respuesta y el uso de tokens (que puede ser None).\n# Si algo falla (red, clave inválida, etc.) lanza la excepción: quien la llama decide\n# qué hacer, así un error nunca se confunde con una respuesta del modelo.\ndef send_message(system_prompt, messages):\n    response = litellm.completion(\n        model=MODEL,\n        # La conversación es una lista de mensajes, cada uno con un rol:\n        # \"system\" para las instrucciones, \"user\" para lo que escribe la persona\n        # y \"assistant\" para lo que respondió el modelo. El prompt de sistema va\n        # siempre primero y no se guarda en el historial.\n        messages=[\n            {\n                \"role\": \"system\",\n                \"content\": system_prompt\n            }\n            ] + messages,\n        api_key=API_KEY,\n        api_base=BASE_URL,\n    )\n    # \"usage\" informa los tokens enviados y puede venir vacío según el proveedor o el proxy.\n    usage = getattr(response, \"usage\", None)\n    # La respuesta trae una lista de opciones (\"choices\"); se toma el texto de la primera.\n    return response.choices[0].message.content, usage  # type: ignore\n\n# Sistema de comandos basicos para controlar el chat.\n# Recibe el historial para poder modificarlo (por ejemplo, /clear lo vacía).\n# Devuelve:\n#   - None: el texto no es un comando, hay que enviarlo al modelo.\n#   - True: era un comando de salida, hay que terminar el chat.\n#   - False: era un comando (o uno desconocido) ya atendido, el chat continúa.\ndef handle_command(user_input, messages, memory_path):\n    command = user_input.lower()\n    if command in [\"/exit\", \"/quit\"]:\n        print(\"Saliendo del chat...\")\n        return True\n    # Borra la memoria de la sesión, tanto la variable como el archivo.\n    elif command == \"/clear\":\n        messages.clear()\n        save_memory(memory_path, messages)\n        print(\"Memoria borrada.\")\n        return False\n    # Muestra los comandos disponibles.\n    elif command == \"/help\":\n        print(\"Comandos disponibles:\")\n        print(\"/exit o /quit: Salir del chat.\")\n        print(\"/clear: Borrar la memoria de esta sesión.\")\n        print(\"/help: Mostrar esta ayuda.\")\n        return False\n    # Cualquier otra cosa que empiece con \"/\" es un comando mal escrito:\n    # no se manda al modelo.\n    elif command.startswith(\"/\"):\n        print(f\"Comando desconocido: {command}. Usa /help.\")\n        return False\n    return None\n\n# Función principal: bucle de chat en la terminal.\n# Lee lo que escribe el usuario, lo envía al modelo y muestra la respuesta.\ndef main():\n    # El nombre de la sesión se toma del primer argumento; define el archivo de memoria.\n    # Se rechaza en vez de \"limpiarlo\": así un nombre con \"/\" o \"..\" no se transforma\n    # en silencio en otro archivo, y no hay forma de salirse de la carpeta memory/.\n    session = sys.argv[1] if len(sys.argv) > 1 else \"default\"\n    if not re.fullmatch(r\"[A-Za-z0-9_-]+\", session):\n        sys.exit(\"Nombre de sesión inválido: usa solo letras, números, '-' y '_'.\")\n    memory_path = os.path.join(MEMORY_DIR, f\"{session}.json\")\n\n    # Memoria: lista con todos los mensajes de la conversación, en orden.\n    # Cada elemento es {\"role\": \"user\" | \"assistant\", \"content\": texto}.\n    messages = load_memory(memory_path)\n    print(f\"Sesión '{session}' ({len(messages)} mensajes en memoria). Usa /help para ver los comandos.\")\n\n    try:\n        # Se repite hasta que el usuario salga con /exit, /quit, Ctrl+C o Ctrl+D.\n        while True:\n            # strip() quita espacios sobrantes (por ejemplo \"/exit \").\n            user_input = input(\">>> \").strip()\n            # Si el usuario solo presiona Enter, no se envía nada.\n            if not user_input:\n                continue\n\n            # Si el texto es un comando, handle_command lo atiende y devuelve\n            # True (salir) o False (seguir); si no lo es, devuelve None.\n            result = handle_command(user_input, messages, memory_path)\n\n            if result is True:\n                break\n            elif result is False:\n                continue\n\n            # Si no es un comando (result es None), se trata como un mensaje para el modelo.\n            # Primero se agrega a la memoria, para que el modelo lo reciba junto con todo lo anterior.\n            messages.append(\n                {\n                    \"role\": \"user\",\n                    \"content\": user_input\n                }\n            )\n            try:\n                reply, usage = send_message(SYSTEM_PROMPT, messages)\n            except Exception as e:\n                # El error se muestra en pantalla pero no entra a la memoria: se quita\n                # también el mensaje del usuario para poder reintentar sin duplicarlo.\n                messages.pop()\n                print(f\"Error: {e}\")\n                continue\n\n            # Mostramos los tokens enviados, que crecen con el historial y es lo que se cobra.\n            # Va fuera del try anterior a propósito: ese except descarta la respuesta, y un\n            # contador incompleto no debe tirar una respuesta que el modelo ya generó (y que\n            # ya se cobró). Por eso se lee con getattr y se muestra solo si existe.\n            prompt_tokens = getattr(usage, \"prompt_tokens\", None)\n            if prompt_tokens is not None:\n                print(f\"[tokens enviados: {prompt_tokens}]\")\n\n            # Una respuesta vacía no se guarda: un mensaje vacío en el historial se\n            # reenviaría en cada pregunta siguiente y la API podría rechazarlo, dejando\n            # la sesión inutilizable. Se avisa y se quita el mensaje del usuario para reintentar.\n            if not reply:\n                messages.pop()\n                print(\"El modelo devolvió una respuesta vacía. Intenta de nuevo.\")\n                continue\n\n            print(reply)\n            # Solo las respuestas reales (no vacías) del modelo entran a la memoria.\n            messages.append(\n                {\n                    \"role\": \"assistant\",\n                    \"content\": reply\n                }\n            )\n\n            # Se guarda en el archivo después de cada intercambio por si el programa se corta.\n            # Va en su propio try: si falla el guardado la respuesta ya es válida, así que\n            # se conserva en la memoria en RAM y solo se avisa (no se deshace nada).\n            try:\n                save_memory(memory_path, messages)\n            except OSError as e:\n                print(f\"No se pudo guardar la sesión: {e}\")\n\n    # Ctrl+C o Ctrl+D: sale del chat de forma ordenada.\n    except (KeyboardInterrupt, EOFError):\n        print(\"\\nSaliendo del chat...\")\n\n    # Cualquier otro error inesperado se muestra en pantalla.\n    except Exception as e:\n        print(f\"Error: {e}\")\n\n# Ejecuta main() solo si el script se corre directamente (no si se importa).\nif __name__ == \"__main__\":\n    main()\n"
 }
};
