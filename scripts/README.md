# scripts

## build_site.py

Genera `docs/data.js`, el archivo con todos los datos que usa la página de evolución del agente (`docs/index.html`). La página no calcula nada desde git: solo muestra lo que este script deja en ese archivo.

`docs/data.js` es un archivo generado, así que no se edita a mano. Cualquier cambio se pierde al volver a ejecutar el script.

### Cuándo ejecutarlo

Después de cada commit que deba aparecer en la página:

```bash
python3 scripts/build_site.py        # usa HEAD
python3 scripts/build_site.py main   # usa otra rama o commit
```

Solo necesita Python 3 y git, sin dependencias externas. Se puede ejecutar desde cualquier carpeta.

El script lee lo que está commiteado, no los archivos en disco. Un cambio sin commit en `TODO.md` o en `README.md` no aparece, aunque se ejecute de nuevo.

También conviene ejecutarlo después de hacer push: el enlace de un commit a GitHub solo se genera si ese commit ya está en `origin/main`.

### De dónde sale cada dato

| Fuente | Qué aporta |
|--------|------------|
| Historial de git | Un paso por commit, con su mensaje, fecha, archivos y qué cambió en cada uno. |
| `README.md` | La columna "Qué agrega" de la tabla de versiones. |
| `TODO.md` | Las versiones planificadas: arco, título, "Resuelve" y tareas. |
| `VERSION_NOTES` (en el script) | Título y "Resuelve" de v000 y v001, que `TODO.md` no describe. Tiene prioridad sobre `TODO.md`. |
| `LANES` (en el script) | Las piezas del agente en cada carril del mapa y la versión que introduce cada una. |

### Reglas que aplica

- **Versión de un commit:** es el `lagent-vXXX.py` más nuevo que existe en ese commit.
- **Versión nueva:** un `lagent-vXXX.py` nuevo se compara con el de la versión anterior (campo `base`). Para git es un archivo nuevo, pero en esta historia es el mismo agente que evoluciona.
- **Versión implementada o planificada:** una versión con commits muestra código. Una que solo está en `TODO.md` muestra su plan, y pasa a mostrar código sola cuando existe su archivo en un commit.
- **"Deja sin resolver":** es el "Resuelve" de la versión siguiente.
- **Exclusiones:** `docs/` y `scripts/` no entran en la historia. Un commit que solo toca esas carpetas no genera un paso.

### Formato que espera

Si estos formatos cambian, el dato deja de aparecer en la página sin que el script dé error.

En `TODO.md`:

```markdown
## Arco 1: memoria

### v002: ventana de memoria

Resuelve: el historial crece sin límite.

- [ ] Una tarea pendiente
- [x] Una tarea hecha
```

Un encabezado `##` que no empieza con `Arco` (por ejemplo `## Transversal`) cierra el arco actual, y sus tareas no se muestran.

En `README.md`, cada fila de la tabla de versiones:

```markdown
| v002 | [lagent-v002.py](lagent-v002.py) | Qué agrega esta versión. |
```

### Qué hay que tocar a mano

- **Pieza nueva en el mapa:** agregarla en `LANES`. Una versión sin pieza aparece igual en la línea de tiempo, pero sin nada en los carriles. Cada versión de `LANES` debe existir en `TODO.md` o en git, si no la página falla al cargar.
- **Cambio en la estructura del repo:** `AGENT_FILE` solo reconoce archivos `lagent-vXXX.py`. Si v004 pasa a carpetas (`v004/agent.py`, decisión pendiente en `TODO.md`), hay que ampliar ese patrón y la función `isAgent` de `docs/app.js`.
