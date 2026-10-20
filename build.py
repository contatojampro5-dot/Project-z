"""Hefesto · build do PROJECT Z.

Monta dist/index.html (arquivo único, autossuficiente) a partir de src/ e assets/.
Uso, dentro da pasta do projeto:  python3 build.py
Requer só Python 3.8+ (sem dependências).
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
MIME = {'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'flac': 'audio/flac', 'webp': 'image/webp',
        'png': 'image/png', 'jpg': 'image/jpeg', 'svg': 'image/svg+xml'}

def read(rel):
    return open(os.path.join(ROOT, rel), encoding='utf8').read()

def inline_assets(text):
    def rep(m):
        rel = m.group(1)
        raw = open(os.path.join(ROOT, rel), 'rb').read()
        return f'data:{MIME[rel.rsplit(".", 1)[1]]};base64,' + base64.b64encode(raw).decode()
    return re.sub(r'@@ASSET:([^@]+)@@', rep, text)

def build():
    man = json.load(open(os.path.join(ROOT, 'src/manifest.json'), encoding='utf8'))
    css = ''.join(f'\n/* ==== {os.path.basename(f)} ==== */\n' + read(f) for f in man['styles'])
    head_js = ''.join(f'<script>{read(f)}</script>' for f in man['headScripts'])
    main_js = ''.join(read(f) for f in man['mainScript'])
    page = read('src/index.html')
    page = page.replace('<!-- @styles -->', f'<style>{css}\n</style>', 1)
    page = page.replace('<!-- @headScripts -->', head_js, 1)
    page = page.replace('<!-- @mainScript -->', f'<script>{main_js}</script>', 1)
    page = inline_assets(page)
    assert '@@ASSET:' not in page and '<!-- @' not in page
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    out = os.path.join(ROOT, 'dist/index.html')
    open(out, 'w', encoding='utf8').write(page)
    print(f'dist/index.html  {len(page.encode()) / 1e6:.2f} MB')

if __name__ == '__main__':
    build()
