"""Gera src/scripts/game/38v-data_ambientFiles.js a partir de assets/audio/ambient/.
Nome do arquivo: <grupo>_<nn>.mp3 ou <grupo>_loop.mp3 (ex.: people_03.mp3, fire_loop.mp3)."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
d = os.path.join(ROOT, 'assets/audio/ambient')
files = {}
for f in sorted(os.listdir(d)):
    m = re.match(r'([a-zA-Z]+)_(?:\d+|loop)\.mp3$', f)
    if m: files.setdefault(m.group(1), []).append(f'@@ASSET:assets/audio/ambient/{f}@@')
out = os.path.join(ROOT, 'src/scripts/game/38v-data_ambientFiles.js')
open(out, 'w', encoding='utf8').write('// -- gerado por laboratorio/src/gerar_dados_ambiente.py (não editar) --\nconst PZ_AMB_FILES=Object.freeze(' + json.dumps(files) + ');\n')
print(out, {k: len(v) for k, v in files.items()})
