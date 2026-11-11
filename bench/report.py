"""
Resume los registros de run.py: tokens por turno, costo total y si la memoria respondió bien.

Uso: python report.py conversacion.json runs/*.jsonl [--detalle]
  --detalle  muestra el inicio de cada respuesta a las preguntas de control
Deja además runs/tokens_por_turno.csv para graficar.
"""

import csv
import json
import sys
from collections import defaultdict


def main():
    script = json.load(open(sys.argv[1], encoding="utf-8"))
    runs = defaultdict(list)
    detail = "--detalle" in sys.argv
    for path in [a for a in sys.argv[2:] if not a.startswith("--")]:
        for line in open(path, encoding="utf-8"):
            r = json.loads(line)
            runs[r["version"]].append(r)

    versions = sorted(runs)
    turns = range(1, len(script) + 1)

    # Tokens enviados en la llamada de chat de cada turno (la que ve la persona).
    # Tokens por turno para el gráfico: lo que informó el proveedor, o la estimación local
    # si es una prueba con BENCH_MOCK o si el proveedor no informó nada.
    def tokens(r):
        if r.get("mock") or r["prompt_tokens"] is None:
            return r["estimated_tokens"]
        return r["prompt_tokens"]

    table = {v: {r["turn"]: tokens(r) for r in runs[v] if r["kind"] == "chat" and not r["error"]} for v in versions}
    with open("runs/tokens_por_turno.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["turno"] + versions)
        for t in turns:
            w.writerow([t] + [table[v].get(t, "") for v in versions])

    print("Resumen por versión")
    print("  tokens cobrados: los que informó el proveedor en las llamadas exitosas.")
    print("  tokens estimados: estimación local de todo lo que se intentó enviar, incluidas las llamadas fallidas.\n")
    print(f"{'versión':<12}{'llamadas':>9}{'errores':>9}{'resum. ok':>10}{'resum. mal':>11}{'tok. cobrados':>15}{'tok. estimados':>16}{'tok. resp.':>12}{'costo USD':>11}")
    for v in versions:
        rs = runs[v]
        ok = [r for r in rs if not r["error"]]
        # Una compactación falla si la llamada da error o si el resumen se cortó por el tope.
        sums = [r for r in rs if r["kind"] == "summary"]
        sum_bad = sum(bool(r["error"]) or r["finish_reason"] == "length" for r in sums)
        billed = sum(r["prompt_tokens"] or 0 for r in ok if not r.get("mock"))
        estimated = sum(r["estimated_tokens"] or 0 for r in rs)
        recv = sum(r["completion_tokens"] or 0 for r in ok)
        costs = [r["cost_usd"] for r in ok if r["cost_usd"] is not None]
        cost = f"{sum(costs):.4f}" if costs else "s/d"
        print(f"{v:<12}{len(rs):>9}{len(rs) - len(ok):>9}{len(sums) - sum_bad:>10}{sum_bad:>11}{billed:>15}{estimated:>16}{recv:>12}{cost:>11}")

    # Ahorro respecto de la primera versión con memoria completa (v001): cuánto menos se
    # cobró, contando las llamadas de resumen como parte del costo de compactar.
    base = next((v for v in versions if v.endswith("v001")), None)
    if base:
        def billed(v, kind=None):
            return sum(r["prompt_tokens"] or 0 for r in runs[v]
                       if not r["error"] and not r.get("mock") and (kind is None or r["kind"] == kind))
        def billed_out(v, kind=None):
            return sum(r["completion_tokens"] or 0 for r in runs[v]
                       if not r["error"] and (kind is None or r["kind"] == kind))
        def money(v):
            costs = [r["cost_usd"] for r in runs[v] if not r["error"] and r["cost_usd"] is not None]
            return sum(costs) if costs else None
        print(f"\nAhorro frente a {base} (tokens cobrados, entrada + salida)")
        b_total = billed(base) + billed_out(base)
        for v in versions:
            if v == base or v.endswith("v000"):
                continue
            chat = billed(v, "chat") + billed_out(v, "chat")
            summ = billed(v, "summary") + billed_out(v, "summary")
            net = b_total - (chat + summ)
            pct = f"{100 * net / b_total:.0f}%" if b_total else "s/d"
            line = f"  {v}: chat {chat}, resúmenes {summ}, total {chat + summ}. Ahorro neto {net} tokens ({pct})"
            if money(base) and money(v) is not None:
                line += f", costo {100 * (1 - money(v) / money(base)):.0f}% menor"
            print(line)

    # Errores agrupados por su comienzo, para ver rápido qué está fallando.
    errors = [(v, r) for v in versions for r in runs[v] if r["error"]]
    if errors:
        print("\nErrores (agrupados)")
        groups = defaultdict(lambda: defaultdict(int))
        for v, r in errors:
            text = " ".join(r["error"].split())
            if "cloudflare" in text.lower():
                text = "Bloqueo de Cloudflare (página HTML)"
            groups[text[:90]][f"{v}/{r['kind']}"] += 1
        for text, where in sorted(groups.items(), key=lambda kv: -sum(kv[1].values())):
            print(f"  {sum(where.values()):>4}  {text}")
            print(f"        en: " + ", ".join(f"{k} ({n})" for k, n in sorted(where.items())))

    # Preguntas de control: un paso del guion con "expect" se verifica en la respuesta.
    probes = [(i, s) for i, s in enumerate(script, 1) if "expect" in s]
    if probes:
        print("\nPreguntas de control (¿la respuesta contiene lo esperado?)")
        for i, step in probes:
            row = []
            for v in versions:
                r = next((r for r in runs[v] if r["turn"] == i and r["kind"] == "chat"), None)
                if r is None or r["error"]:
                    # si la llamada falló no hay respuesta que revisar: no cuenta como olvido
                    row.append(f"{v}: error")
                    continue
                reply = r.get("reply") or ""
                # "expect" puede ser un texto o una lista: todos deben aparecer en la respuesta
                expected = step["expect"] if isinstance(step["expect"], list) else [step["expect"]]
                ok = all(e.lower() in reply.lower() for e in expected)
                row.append(f"{v}: {'sí' if ok else 'no'}" + (f" «{reply[:80]}»" if detail else ""))
            sep = "\n      " if detail else ", "
            print(f"  turno {i} «{step['say']}» ->{sep if detail else ' '}{sep.join(row)}")

    print("\nCSV para graficar: runs/tokens_por_turno.csv")


if __name__ == "__main__":
    main()
