"""
Corre una conversación guionada contra una versión de lagent y registra cada llamada al modelo.

No modifica el código de la versión: reemplaza litellm.completion por una envoltura que
mide y anota, y le pasa los mensajes del guion por la entrada estándar, como si alguien
los escribiera en la terminal.

Uso:
  python run.py ../lagent-v001 conversacion.json
  python run.py ../lagent-v003 conversacion.json --sin-contenido
  BENCH_MOCK=1 python run.py ...   # prueba sin llamar a un modelo real

Deja un archivo runs/<version>-<fecha>.jsonl con una línea por llamada.
"""

import io
import json
import os
import runpy
import sys
import time
from datetime import datetime

import litellm


def main():
    version_dir = os.path.abspath(sys.argv[1])
    script = json.load(open(sys.argv[2], encoding="utf-8"))
    with_content = "--sin-contenido" not in sys.argv
    version = os.path.basename(version_dir)
    session = f"bench-{datetime.now():%Y%m%d-%H%M%S}"

    os.makedirs("runs", exist_ok=True)
    out_path = os.path.abspath(f"runs/{version}-{session}.jsonl")
    out = open(out_path, "w", encoding="utf-8")

    original = litellm.completion
    turn = {"n": 0}  # número del mensaje del guion que se está procesando

    def recorded(*args, **kwargs):
        if os.environ.get("BENCH_MOCK"):
            kwargs["mock_response"] = fake_reply(kwargs)
        t0 = time.perf_counter()
        error, response = None, None
        try:
            response = original(*args, **kwargs)
            return response
        except Exception as e:
            error = f"{type(e).__name__}: {e}"
            raise
        finally:
            write(out, version, turn["n"], kwargs, response, error, time.perf_counter() - t0, with_content)

    litellm.completion = recorded

    # Cada línea del guion es lo que el usuario escribe. Se cuenta el turno al leer cada línea.
    lines = [step["say"] for step in script] + ["/exit"]
    sys.stdin = CountingInput(lines, turn)
    sys.argv = [os.path.join(version_dir, "main.py"), session]
    sys.path.insert(0, version_dir)
    cwd = os.getcwd()
    try:
        runpy.run_path(os.path.join(version_dir, "main.py"), run_name="__main__")
    finally:
        os.chdir(cwd)
        out.close()
        cleanup_session(version_dir, session)
    print(f"\nRegistro: {out_path}", file=sys.stderr)


class CountingInput(io.StringIO):
    """Entrega las líneas del guion una a una y avisa qué turno empieza."""

    def __init__(self, lines, turn):
        super().__init__("".join(line + "\n" for line in lines))
        self.turn = turn

    def readline(self, *args):
        line = super().readline(*args)
        if line and not line.startswith("/"):
            self.turn["n"] += 1
        return line


def write(out, version, turn, kwargs, response, error, seconds, with_content):
    messages = kwargs.get("messages", [])
    system = messages[0]["content"] if messages and messages[0]["role"] == "system" else ""
    usage = getattr(response, "usage", None)
    choice = response.choices[0] if response is not None else None
    reply = choice.message.content if choice is not None else None
    try:
        cost = litellm.completion_cost(completion_response=response) if response is not None else None
    except Exception:
        cost = None  # modelo sin precio conocido en litellm
    record = {
        "version": version,
        "turn": turn,
        # en v003 la llamada de resumen es la única que fija max_tokens
        "kind": "summary" if kwargs.get("max_tokens") else "chat",
        "model": kwargs.get("model"),
        "messages_sent": len(messages) - (1 if system else 0),
        "system_chars": len(system),
        "has_summary": "Resumen de la conversación" in system,
        "prompt_tokens": getattr(usage, "prompt_tokens", None),
        # estimación local con el tokenizador: sirve para contrastar con lo que informa el
        # proveedor, y es la única cifra útil en modo BENCH_MOCK
        "estimated_tokens": estimate(kwargs.get("model"), messages),
        "completion_tokens": getattr(usage, "completion_tokens", None),
        "cost_usd": cost,
        "seconds": round(seconds, 3),
        "finish_reason": getattr(choice, "finish_reason", None),
        "error": error,
        "mock": bool(os.environ.get("BENCH_MOCK")),
    }
    if with_content:
        record["sent"] = messages
        record["reply"] = reply
    out.write(json.dumps(record, ensure_ascii=False) + "\n")
    out.flush()


def estimate(model, messages):
    try:
        return litellm.token_counter(model=model, messages=messages)
    except Exception:
        return None


# Datos que conoce el modelo simulado: responde con los que encuentre en lo que recibe.
# Solo sirve para probar el registro sin gastar tokens, no mide la calidad de un modelo real.
FAKE_FACTS = ["Aurora", "Temuco", "Valparaíso", "Debian", "orion-01", "Ansible"]


def fake_reply(kwargs):
    context = " ".join(m["content"] for m in kwargs["messages"])
    known = [f for f in FAKE_FACTS if f in context]
    if kwargs.get("max_tokens"):
        facts = "\n".join(f"- {f}" for f in known) or "- Nada por ahora."
        return f"## Hechos\n{facts}\n## Decisiones\n- Nada por ahora.\n## Pendientes\n- Nada por ahora."
    if kwargs["messages"][-1]["content"].rstrip().endswith("?") and any(
        w in kwargs["messages"][-1]["content"] for w in ("llamo", "ciudad", "distribución", "servidor principal", "herramienta")
    ):
        return "Según lo que sé: " + (", ".join(known) or "no tengo ese dato.")
    return "Respuesta de prueba. " * 60


def cleanup_session(version_dir, session):
    for root, _, files in os.walk(version_dir):
        for f in files:
            if f.startswith(session):
                os.remove(os.path.join(root, f))


if __name__ == "__main__":
    main()
