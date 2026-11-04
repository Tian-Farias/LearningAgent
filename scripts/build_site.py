# Genera docs/data.js, los datos que usa la página de evolución del agente (docs/index.html).
# Lee todo desde git, así la página muestra exactamente lo que está en el historial:
#   - cada commit es un paso, con el contenido de sus archivos y qué cambió en él.
#   - README.md aporta la descripción de cada versión implementada.
#   - TODO.md aporta las versiones planificadas: arcos, qué resuelve cada una y sus tareas.
#
# Uso: python scripts/build_site.py [ref]      (por defecto HEAD)
# Solo usa la biblioteca estándar. Hay que volver a ejecutarlo después de cada commit.

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, "docs", "data.js")

# Lo que construye la página no es parte de la historia del agente.
EXCLUDED = ("docs/", "scripts/")

# Un archivo del agente por versión, como explica el README.
# Si v004 pasa a carpetas (ver TODO.md) hay que ampliar este patrón.
AGENT_FILE = re.compile(r"^lagent-(v\d{3})\.py$")

# Lo que TODO.md no dice porque son las versiones que ya existían cuando se escribió.
VERSION_NOTES = {
    "v000": {
        "title": "Chat sin memoria",
        "solves": "Hablar con un modelo de lenguaje desde la terminal, con el código más simple posible.",
    },
    "v001": {
        "title": "Memoria",
        "solves": "Cada mensaje es independiente: el modelo no recuerda nada de lo anterior.",
    },
}

# Las piezas del agente, agrupadas por carril: (versión que la introduce, nombre).
LANES = [
    ("Chat", [("v000", "Chat y comandos")]),
    ("Memoria", [("v001", "Historial"), ("v002", "Ventana"), ("v003", "Compactación")]),
    ("Medición", [("v001", "Tokens"), ("v007", "Trazas")]),
    ("Acción", [("v004", "Tools y loop"), ("v008", "Sandbox")]),
    ("Control", [("v005", "Guardrails"), ("v006", "Sensores y gate")]),
    ("Escala", [("v009", "Modelos por rol"), ("v010", "Sub-agentes")]),
]


def git(*args):
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, check=True)
    return result.stdout.decode("utf-8", errors="replace")


# Devuelve {ruta: id del blob} con los archivos de un commit, sin los excluidos.
def read_tree(ref):
    files = {}
    for entry in git("ls-tree", "-r", "-z", ref).split("\0"):
        if not entry:
            continue
        meta, path = entry.split("\t", 1)
        if not path.startswith(EXCLUDED):
            files[path] = meta.split()[2]
    return files


# El archivo del agente más nuevo que existe en un commit, o None si todavía no hay.
def latest_agent(files):
    agents = [path for path in files if AGENT_FILE.match(path)]
    return max(agents) if agents else None


# Recorre los commits y arma un paso por cada uno que cambie algo visible.
# Un lagent-vXXX.py nuevo se compara con el de la versión anterior (campo "base"):
# git lo ve como un archivo nuevo, pero en esta historia es el mismo agente que evoluciona.
def read_commits(ref):
    log = git("log", "--reverse", "--first-parent", "--date=short", "--format=%H%x00%h%x00%ad%x00%s", ref)
    stops = []
    previous = {}
    for line in log.splitlines():
        sha, short, date, subject = line.split("\0")
        files = read_tree(sha)
        if files == previous:
            continue
        changes = []
        for path in sorted(set(files) | set(previous)):
            if path not in previous:
                base = latest_agent(previous) if AGENT_FILE.match(path) else None
                changes.append({"path": path, "status": "added", "base": base})
            elif path not in files:
                changes.append({"path": path, "status": "deleted", "base": None})
            elif files[path] != previous[path]:
                changes.append({"path": path, "status": "modified", "base": None})
        agent = latest_agent(files)
        stops.append(
            {
                "id": short,
                "kind": "commit",
                "version": AGENT_FILE.match(agent).group(1) if agent else "v000",
                "hash": short,
                "sha": sha,
                "date": date,
                "message": subject,
                "published": is_published(sha),
                "agent": agent,
                "files": files,
                "changes": changes,
            }
        )
        previous = files
    return stops


# Un commit solo se puede enlazar a GitHub si ya está en origin/main.
def is_published(sha):
    check = ["git", "merge-base", "--is-ancestor", sha, "origin/main"]
    return subprocess.run(check, cwd=ROOT, capture_output=True).returncode == 0


# Extrae arcos, versiones, "Resuelve" y tareas de TODO.md.
def parse_todo(text):
    versions = {}
    current = None
    arc = None
    for line in text.splitlines():
        heading = re.match(r"^(#{2,3}) (?:(v\d{3}): )?(.+)$", line)
        if heading:
            level, version, title = heading.groups()
            current = None
            if version:
                current = {"title": title, "arc": arc, "solves": None, "tasks": []}
                versions[version] = current
            elif level == "##":
                arc = title if title.startswith("Arco") else None
            continue
        if current is None:
            continue
        if line.startswith("Resuelve: "):
            current["solves"] = line.removeprefix("Resuelve: ")
        task = re.match(r"^- \[([ x])\] (.+)$", line)
        if task:
            current["tasks"].append({"done": task.group(1) == "x", "text": task.group(2).strip("~")})
    return versions


# Extrae la columna "Qué agrega" de la tabla de versiones del README.
def parse_readme(text):
    return {
        match.group(1): match.group(2).strip()
        for match in re.finditer(r"^\| (v\d{3}) \|[^|]*\|(.+)\|$", text, re.MULTILINE)
    }


def capitalize(text):
    return text[:1].upper() + text[1:] if text else text


# Une lo que dicen git, README y TODO en una lista de versiones ordenada.
def build_versions(stops, todo, readme, blobs):
    real = {stop["version"] for stop in stops}
    versions = []
    for version_id in sorted(real | set(todo) | set(VERSION_NOTES)):
        planned = todo.get(version_id, {})
        notes = VERSION_NOTES.get(version_id, {})
        versions.append(
            {
                "id": version_id,
                "title": capitalize(notes.get("title") or planned.get("title")),
                "arc": planned.get("arc"),
                "solves": capitalize(notes.get("solves") or planned.get("solves")),
                "adds": readme.get(version_id),
                "tasks": planned.get("tasks", []),
                "state": "real" if version_id in real else "plan",
                "lines": None,
            }
        )
    # "Deja sin resolver" de cada versión es lo que resuelve la siguiente.
    for current, following in zip(versions, versions[1:]):
        current["leaves"] = following["solves"]
    versions[-1]["leaves"] = None
    # Largo del agente al terminar cada versión implementada.
    for version in versions:
        last = [stop for stop in stops if stop["version"] == version["id"]]
        if last:
            agent = last[-1]["agent"]
            version["lines"] = len(blobs[last[-1]["files"][agent]].splitlines()) if agent else None
    return versions


def repository_url():
    try:
        remote = git("remote", "get-url", "origin").strip()
    except subprocess.CalledProcessError:
        return None
    match = re.search(r"github\.com[:/](.+?)(?:\.git)?$", remote)
    return f"https://github.com/{match.group(1)}" if match else None


def main():
    ref = sys.argv[1] if len(sys.argv) > 1 else "HEAD"
    stops = read_commits(ref)

    # Cada contenido distinto se guarda una sola vez y los pasos lo referencian por id.
    blobs = {}
    for stop in stops:
        for blob in stop["files"].values():
            if blob not in blobs:
                blobs[blob] = git("cat-file", "blob", blob)

    todo = parse_todo(git("show", f"{ref}:TODO.md"))
    readme = parse_readme(git("show", f"{ref}:README.md"))
    versions = build_versions(stops, todo, readme, blobs)

    # Las versiones sin commits son un paso más, pero sin código: solo su plan.
    stops += [
        {"id": version["id"], "kind": "plan", "version": version["id"]}
        for version in versions
        if version["state"] == "plan"
    ]

    data = {
        "repository": repository_url(),
        "versions": versions,
        "lanes": [{"name": name, "pieces": [{"version": v, "name": n} for v, n in pieces]} for name, pieces in LANES],
        "stops": stops,
        "blobs": blobs,
    }
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("window.LAGENT_DATA = ")
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write(";\n")

    real_count = sum(1 for stop in stops if stop["kind"] == "commit")
    print(f"{OUTPUT}: {real_count} commits, {len(stops) - real_count} versiones planificadas.")


# Ejecuta main() solo si el script se corre directamente (no si se importa).
if __name__ == "__main__":
    main()
