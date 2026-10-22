"""Hefesto · build do PROJECT Z.

Monta dist/index.html (arquivo único, autossuficiente) a partir de src/ e assets/.
Com --web <pasta>, gera a versão leve para a web: sprites e músicas como arquivos separados.
Uso, dentro da pasta do projeto:  python3 build.py
Requer só Python 3.8+ (sem dependências).
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
MIME = {'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'flac': 'audio/flac', 'webp': 'image/webp',
        'png': 'image/png', 'webmanifest': 'application/manifest+json', 'jpg': 'image/jpeg', 'svg': 'image/svg+xml'}

def read(rel):
    return open(os.path.join(ROOT, rel), encoding='utf8').read()

EXTERNAL = ('assets/images/game/infectados/', 'assets/images/game/sobreviventes/', 'assets/audio/music/', 'assets/audio/voices/', 'assets/pwa/')

def inline_assets(text, web_dir=None):
    def rep(m):
        rel = m.group(1)
        if web_dir and rel.startswith(EXTERNAL):
            # versão web: arquivo separado, baixado em paralelo e guardado no cache do navegador
            dst = os.path.join(web_dir, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            open(dst, 'wb').write(open(os.path.join(ROOT, rel), 'rb').read())
            if rel.endswith('.webmanifest'):  # ícones do app instalável vão junto
                for ic in json.load(open(os.path.join(ROOT, rel)))['icons']:
                    src = os.path.join(os.path.dirname(rel), ic['src'])
                    open(os.path.join(web_dir, src), 'wb').write(open(os.path.join(ROOT, src), 'rb').read())
            return rel
        raw = open(os.path.join(ROOT, rel), 'rb').read()
        return f'data:{MIME[rel.rsplit(".", 1)[1]]};base64,' + base64.b64encode(raw).decode()
    return re.sub(r'@@ASSET:([^@]+)@@', rep, text)

def build(web_dir=None):
    man = json.load(open(os.path.join(ROOT, 'src/manifest.json'), encoding='utf8'))
    css = ''.join(f'\n/* ==== {os.path.basename(f)} ==== */\n' + read(f) for f in man['styles'])
    head_js = ''.join(f'<script>{read(f)}</script>' for f in man['headScripts'])
    main_js = ''.join(read(f) for f in man['mainScript'])
    page = read('src/index.html')
    page = page.replace('<!-- @styles -->', f'<style>{css}\n</style>', 1)
    page = page.replace('<!-- @headScripts -->', head_js, 1)
    page = page.replace('<!-- @mainScript -->', f'<script>{main_js}</script>', 1)
    page = inline_assets(page, web_dir)
    assert '@@ASSET:' not in page and '<!-- @' not in page
    out_dir = web_dir or os.path.join(ROOT, 'dist')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, 'index.html')
    open(out, 'w', encoding='utf8').write(page)
    print(f'{os.path.relpath(out, ROOT)}  {len(page.encode()) / 1e6:.2f} MB' + ('  (+ assets externos)' if web_dir else ''))

if __name__ == '__main__':
    # python3 build.py            → dist/index.html (arquivo único, joga offline)
    # python3 build.py --web jogo → jogo/index.html leve + jogo/assets/ (versão do GitHub Pages)
    if '--web' in sys.argv:
        build(os.path.join(ROOT, sys.argv[sys.argv.index('--web') + 1]))
    else:
        build()
