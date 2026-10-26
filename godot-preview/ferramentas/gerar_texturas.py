#!/usr/bin/env python3
"""Gera as texturas da Zona Leste para o prólogo em Godot (Deméter + Afrodite).

Tudo por código, no estilo do jogo web: asfalto remendado, calçada de concreto e "mapa de SP",
fachadas de prédio (reboco, pastilha, tijolo à vista) com janelas de grade, portas de aço com
pixo e letreiros de marcas fictícias, telhados, grama, terra, fogo, fumaça e explosão.

Uso: python3 godot-preview/ferramentas/gerar_texturas.py
Saída: godot-preview/assets/tex/
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(AQUI, "..", "assets", "tex")
FONTES = os.path.join(AQUI, "fontes")
os.makedirs(OUT, exist_ok=True)
R = np.random.default_rng(11)
random.seed(11)


def fonte(nome, tam):
    return ImageFont.truetype(os.path.join(FONTES, nome), tam)


# ------------------------------------------------------------------ ruído (repete nas bordas)
def ruido(n, celulas, seed=0):
    """Ruído de valor suave e periódico (n x n), com `celulas` células por lado."""
    g = np.random.default_rng(seed).random((celulas, celulas))
    x = np.linspace(0, celulas, n, endpoint=False)
    i0 = np.floor(x).astype(int)
    t = x - i0
    t = t * t * (3 - 2 * t)
    i1 = (i0 + 1) % celulas
    a = g[np.ix_(i0, i0)]
    b = g[np.ix_(i0, i1)]
    c = g[np.ix_(i1, i0)]
    d = g[np.ix_(i1, i1)]
    ty = t[:, None]
    tx = t[None, :]
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty


def fbm(n, base=4, oit=5, seed=0, ganho=0.5):
    s = np.zeros((n, n))
    amp = 1.0
    tot = 0.0
    for o in range(oit):
        s += ruido(n, base * 2 ** o, seed + o * 17) * amp
        tot += amp
        amp *= ganho
    return s / tot


def salvar(arr, nome):
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr).save(os.path.join(OUT, nome))
    print("ok", nome, arr.shape)


def cor(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)


# ------------------------------------------------------------------ asfalto
def asfalto():
    n = 1024
    f = fbm(n, 8, 6, 1)
    grao = R.random((n, n))
    base = 52 + f * 26 + (grao - 0.5) * 22
    img = np.stack([base, base * 1.01, base * 1.04], -1)
    # pedrinhas claras do agregado
    pts = R.random((n, n)) > 0.985
    img[pts] += 30
    # remendos (asfalto novo mais escuro, retangular, de operação tapa-buraco)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im, "RGBA")
    for _ in range(9):
        x, y = R.integers(0, n, 2)
        w, h = R.integers(60, 220, 2)
        tom = int(R.integers(30, 44))
        d.rectangle([x, y, x + w, y + h], fill=(tom, tom, tom + 3, 210), outline=(70, 70, 72, 160), width=3)
    # manchas de óleo
    for _ in range(14):
        x, y = R.integers(0, n, 2)
        r = int(R.integers(14, 46))
        d.ellipse([x - r, y - r * 0.6, x + r, y + r * 0.6], fill=(18, 18, 20, 70))
    # rachaduras
    for _ in range(26):
        x, y = R.integers(0, n, 2).astype(float)
        a = R.random() * math.tau
        pts = [(x, y)]
        for _k in range(int(R.integers(6, 16))):
            a += R.normal(0, 0.6)
            x += math.cos(a) * R.integers(8, 22)
            y += math.sin(a) * R.integers(8, 22)
            pts.append((x, y))
        d.line(pts, fill=(22, 22, 24, 200), width=2)
    salvar(np.array(im), "asfalto.png")


# ------------------------------------------------------------------ calçadas
def calcada_concreto():
    n = 512
    f = fbm(n, 6, 5, 3)
    base = 132 + f * 34 + (R.random((n, n)) - 0.5) * 16
    img = np.stack([base, base * 0.98, base * 0.93], -1)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im, "RGBA")
    for k in range(0, n, 128):  # juntas das placas
        d.line([(k, 0), (k, n)], fill=(70, 66, 60, 220), width=3)
        d.line([(0, k), (n, k)], fill=(70, 66, 60, 220), width=3)
    for _ in range(10):  # rachaduras e remendos de cimento
        x, y = R.integers(0, n, 2).astype(float)
        a = R.random() * math.tau
        pts = [(x, y)]
        for _k in range(8):
            a += R.normal(0, 0.7)
            x += math.cos(a) * 14
            y += math.sin(a) * 14
            pts.append((x, y))
        d.line(pts, fill=(64, 60, 56, 180), width=2)
    for _ in range(4):
        x, y = R.integers(0, n - 100, 2)
        d.rectangle([x, y, x + int(R.integers(40, 100)), y + int(R.integers(30, 80))], fill=(150, 146, 136, 150))
    for _ in range(40):  # chiclete e sujeira
        x, y = R.integers(0, n, 2)
        d.ellipse([x, y, x + 5, y + 4], fill=(40, 38, 36, 120))
    salvar(np.array(im), "calcada.png")


def calcada_sp():
    """Piso paulista (Mirthes Bernardes): módulo preto e branco que forma o mapa do estado."""
    n = 512
    m = 64  # tamanho do módulo
    im = Image.new("RGB", (n, n), (158, 153, 143))
    d = ImageDraw.Draw(im)
    escuro = (58, 58, 60)
    for my in range(0, n, m):
        for mx in range(0, n, m):
            q = m // 4
            # "mapa": quadrado central com meias-caras (triângulos) nas bordas
            d.rectangle([mx + q, my + q, mx + 3 * q - 1, my + 3 * q - 1], fill=escuro)
            d.polygon([(mx + q, my), (mx + 2 * q, my), (mx + q, my + q)], fill=escuro)
            d.polygon([(mx + 3 * q, my + q), (mx + 4 * q, my + 2 * q), (mx + 3 * q, my + 2 * q)], fill=escuro)
            d.polygon([(mx + 2 * q, my + 4 * q), (mx + 3 * q, my + 4 * q), (mx + 3 * q, my + 3 * q)], fill=escuro)
            d.polygon([(mx, my + 2 * q), (mx + q, my + 3 * q), (mx + q, my + 2 * q)], fill=escuro)
    arr = np.array(im).astype(float)
    # pedrinhas (pedra portuguesa): juntas escuras em grade irregular
    pedra = fbm(n, 64, 2, 9)
    arr *= (0.86 + 0.18 * pedra)[..., None]
    arr += (R.random((n, n, 1)) - 0.5) * 18
    arr *= (0.9 + 0.12 * fbm(n, 4, 4, 5))[..., None]
    salvar(arr, "calcada_sp.png")


# ------------------------------------------------------------------ fachadas
PAREDES = [  # (nome, cor, tipo)
    ("creme", "#d8c9a8", "reboco"), ("salmao", "#d39a7e", "reboco"), ("verdeagua", "#9fbfae", "reboco"),
    ("pastilha_bege", "#c8b89a", "pastilha"), ("pastilha_azul", "#7f97ad", "pastilha"), ("tijolo", "#9a5a3e", "tijolo"),
    ("concreto", "#9a978e", "concreto"), ("branco", "#d9d6cc", "reboco"),
]


def parede(tipo, c, n=256, seed=0):
    f = fbm(n, 4, 5, seed)
    base = cor(c)[None, None, :] * (0.82 + 0.26 * f[..., None])
    if tipo == "pastilha":
        g = 12
        yy, xx = np.mgrid[0:n, 0:n]
        junta = ((xx % g) < 2) | ((yy % g) < 2)
        var = ruido(n, n // g, seed + 3)[..., None]
        base = base * (0.9 + 0.2 * var)
        base[junta] *= 0.72
    elif tipo == "tijolo":
        yy, xx = np.mgrid[0:n, 0:n]
        fila = yy // 16
        off = (fila % 2) * 24
        junta = ((yy % 16) < 3) | (((xx + off) % 48) < 3)
        var = ruido(n, 16, seed + 5)[..., None]
        base = base * (0.78 + 0.4 * var)
        base[junta] = cor("#b8ae9a") * 0.8
    elif tipo == "concreto":
        base += (R.random((n, n, 1)) - 0.5) * 20
        for k in (0, 128):
            base[k:k + 2, :] *= 0.7
    # sujeira escorrendo de cima (chuva + fuligem)
    esc = fbm(n, 16, 3, seed + 9)
    esc = np.clip((esc - 0.45) * 2.2, 0, 1) * np.linspace(1, 0.15, n)[:, None]
    base *= (1 - 0.35 * esc[..., None])
    return base


def janela(d, x0, y0, w, h, variante, rng):
    """Desenha uma janela de prédio paulistano (vista de fora, de frente)."""
    vidro = (38, 46, 56)
    quadro = (178, 180, 176)
    d.rectangle([x0 - 6, y0 - 6, x0 + w + 6, y0 + h + 10], fill=(0, 0, 0, 60))   # recuo/sombra
    d.rectangle([x0 - 8, y0 + h + 4, x0 + w + 8, y0 + h + 12], fill=(200, 196, 186, 255))  # peitoril
    if variante == "persiana":
        d.rectangle([x0, y0, x0 + w, y0 + h], fill=(150, 146, 136))
        for k in range(y0, y0 + h, 7):
            d.line([(x0, k), (x0 + w, k)], fill=(112, 108, 100), width=2)
        return
    d.rectangle([x0, y0, x0 + w, y0 + h], fill=vidro)
    # reflexo do céu
    d.polygon([(x0, y0), (x0 + w * 0.6, y0), (x0, y0 + h * 0.7)], fill=(70, 84, 98, 140))
    d.rectangle([x0, y0, x0 + w, y0 + h], outline=quadro, width=4)
    d.line([(x0 + w // 2, y0), (x0 + w // 2, y0 + h)], fill=quadro, width=3)
    if variante == "cortina":
        d.rectangle([x0 + 4, y0 + 4, x0 + w // 2 - 2, y0 + h - 4], fill=(170, 120, 90))
    if variante == "quebrada":
        cx, cy = x0 + w * 0.6, y0 + h * 0.4
        for _ in range(7):
            a = rng.random() * math.tau
            d.line([(cx, cy), (cx + math.cos(a) * w * 0.4, cy + math.sin(a) * h * 0.4)], fill=(200, 210, 220), width=1)
    if variante in ("grade", "ar", "quebrada", "cortina"):
        for k in range(x0 + 6, x0 + w, 12):  # grade de ferro (bem paulistano)
            d.line([(k, y0 - 4), (k, y0 + h + 4)], fill=(40, 40, 42), width=3)
        d.line([(x0 - 4, y0 + h // 2), (x0 + w + 4, y0 + h // 2)], fill=(40, 40, 42), width=3)
    if variante == "ar":
        d.rectangle([x0 + w - 44, y0 + h - 30, x0 + w + 10, y0 + h + 6], fill=(206, 206, 200), outline=(120, 120, 116), width=2)
        for k in range(x0 + w - 40, x0 + w + 6, 5):
            d.line([(k, y0 + h - 26), (k, y0 + h + 2)], fill=(150, 150, 146))
    if variante == "sacada":
        d.rectangle([x0 - 14, y0 + h - 20, x0 + w + 14, y0 + h + 12], fill=(0, 0, 0, 0), outline=(60, 60, 62), width=3)
        for k in range(x0 - 12, x0 + w + 14, 8):
            d.line([(k, y0 + h - 20), (k, y0 + h + 12)], fill=(60, 60, 62), width=2)
        if rng.random() < 0.7:  # roupa no varal
            for k in range(3):
                c = [(200, 60, 60), (230, 230, 220), (60, 90, 160), (220, 180, 60)][rng.integers(0, 4)]
                d.rectangle([x0 + 8 + k * 24, y0 + h - 34, x0 + 24 + k * 24, y0 + h - 12], fill=c)


def fachadas():
    """Atlas 2048x2048: 8 tipos de parede (linhas) x 8 tipos de janela (colunas). Cada célula = 1 andar x 1 vão."""
    n = 256
    atlas = Image.new("RGB", (n * 8, n * 8))
    emit = Image.new("L", (n * 8, n * 8), 0)
    variantes = ["grade", "ar", "persiana", "sacada", "cortina", "quebrada", "grade", "lisa"]
    rng = np.random.default_rng(5)
    for r, (nome, c, tipo) in enumerate(PAREDES):
        for col, var in enumerate(variantes):
            base = parede(tipo, c, n, seed=r * 31 + col)
            im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert("RGBA")
            d = ImageDraw.Draw(im, "RGBA")
            # laje entre andares
            d.rectangle([0, n - 14, n, n], fill=(0, 0, 0, 50))
            d.line([(0, n - 14), (n, n - 14)], fill=(255, 255, 255, 40), width=2)
            if var == "lisa":
                d.line([(40, 0), (40, n)], fill=(110, 110, 106, 255), width=6)  # cano
            else:
                janela(d, 58, 54, 140, 118, var, rng)
            atlas.paste(im.convert("RGB"), (col * n, r * n))
            if var not in ("lisa", "persiana"):
                ed = ImageDraw.Draw(emit)
                ed.rectangle([col * n + 62, r * n + 58, col * n + 194, r * n + 168], fill=255)
    atlas.save(os.path.join(OUT, "fachadas.png"))
    emit.save(os.path.join(OUT, "fachadas_luz.png"))
    print("ok fachadas.png")


# ------------------------------------------------------------------ térreo: lojas com porta de aço
MARCAS = [  # marcas fictícias (regra do dono)
    ("CASAS DO BRÁS", "#1f4ea8", "#ffd23a"), ("DROGARIA SÉ", "#e8e4da", "#c8202a"), ("PARADA 24H", "#c8202a", "#ffffff"),
    ("PADARIA LESTE", "#5a3a22", "#f2d8a8"), ("BAR DO ZÉ", "#1d6a3a", "#f2f0e8"), ("LOTÉRICA MOOCA", "#1d4aa8", "#ffffff"),
    ("ÓTICA PARI", "#202024", "#e8c547"), ("BANCO TIETÊ", "#0f3a6a", "#f2a020"),
]


def pixo(d, x, y, larg, alt, rng, cor_=(18, 18, 20)):
    """Pixo paulistano: letras retas, altas e pontudas (estilo rúnico)."""
    letras = int(larg // (alt * 0.55))
    for i in range(letras):
        lx = x + i * alt * 0.55
        h = alt * rng.uniform(0.8, 1.1)
        w = alt * 0.4
        forma = rng.integers(0, 5)
        traços = {
            0: [(lx, y + h, lx, y), (lx, y, lx + w, y), (lx + w, y, lx + w, y + h * 0.5), (lx, y + h * 0.5, lx + w, y + h * 0.5)],
            1: [(lx, y + h, lx + w * 0.5, y), (lx + w * 0.5, y, lx + w, y + h), (lx + w * 0.2, y + h * 0.6, lx + w * 0.8, y + h * 0.6)],
            2: [(lx, y, lx, y + h), (lx, y + h, lx + w, y + h), (lx + w, y + h, lx + w, y + h * 0.3)],
            3: [(lx, y, lx + w, y), (lx + w * 0.5, y, lx + w * 0.5, y + h), (lx + w * 0.2, y + h, lx + w * 0.8, y + h)],
            4: [(lx, y + h, lx, y), (lx, y, lx + w, y + h * 0.3), (lx + w, y + h * 0.3, lx, y + h * 0.6), (lx, y + h * 0.6, lx + w, y + h)],
        }[forma]
        for t in traços:
            d.line(t, fill=cor_ + (235,), width=max(2, int(alt * 0.09)))


def lojas():
    """Atlas 2048x1024: 4x2 lojas de 512x512 (porta de aço, vitrine, boteco...)."""
    W = 512
    atlas = Image.new("RGBA", (W * 4, W * 2))
    emit = Image.new("L", (W * 4, W * 2), 0)
    rng = np.random.default_rng(8)
    for i, (nome, fundo, letra) in enumerate(MARCAS):
        cx, cy = (i % 4) * W, (i // 4) * W
        base = parede("reboco", ["#cfc6b2", "#c9b49a", "#b9c0b4", "#d0c8bc"][i % 4], W, seed=40 + i)
        im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert("RGBA")
        d = ImageDraw.Draw(im, "RGBA")
        e = ImageDraw.Draw(emit)
        # letreiro (faixa no alto)
        d.rectangle([10, 30, W - 10, 140], fill=tuple(cor(fundo).astype(int).tolist()) + (255,), outline=(30, 30, 30, 255), width=4)
        tam = 76 if len(nome) < 12 else 58
        f = fonte("Anton.ttf", tam)
        tw = d.textlength(nome, font=f)
        d.text(((W - tw) / 2, 85 - tam * 0.62), nome, font=f, fill=tuple(cor(letra).astype(int).tolist()) + (255,))
        e.rectangle([cx + 10, cy + 30, cx + W - 10, cy + 140], fill=150)
        aberta = i in (1, 2, 4)
        # porta de aço (ondulada) ou vitrine iluminada
        if aberta:
            # interior iluminado: fundo quente, prateleiras com produtos, balcão e gente
            for k in range(160, W - 10):
                t = (k - 160) / (W - 170)
                d.line([(30, k), (W - 30, k)], fill=(int(250 - 40 * t), int(232 - 50 * t), int(190 - 60 * t), 255))
            for sy in (236, 300, 364):
                d.rectangle([44, sy, W - 44, sy + 8], fill=(120, 96, 70, 255))
                px = 48
                while px < W - 50:
                    w_ = int(rng.integers(8, 18))
                    h_ = int(rng.integers(20, 46))
                    c_ = tuple(int(v) for v in rng.integers(60, 230, 3)) + (255,)
                    d.rectangle([px, sy - h_, px + w_, sy], fill=c_)
                    px += w_ + 3
            d.rectangle([60, 410, 300, 470], fill=(90, 70, 52, 255))   # balcão
            for gx in (150, 360):                                        # silhuetas
                d.ellipse([gx - 16, 360, gx + 16, 392], fill=(40, 32, 28, 255))
                d.rectangle([gx - 24, 390, gx + 24, W - 10], fill=(50, 44, 40, 255))
            d.rectangle([30, 160, W - 30, 214], fill=(150, 150, 150, 255))  # porta de aço meio aberta
            for k in range(162, 214, 8):
                d.line([(30, k), (W - 30, k)], fill=(110, 110, 110, 255), width=3)
            e.rectangle([cx + 30, cy + 214, cx + W - 30, cy + W - 10], fill=255)
        else:
            d.rectangle([30, 160, W - 30, W - 10], fill=(150, 152, 150, 255))
            for k in range(162, W - 10, 9):
                d.line([(30, k), (W - 30, k)], fill=(108, 110, 108, 255), width=4)
            d.rectangle([W // 2 - 30, W - 40, W // 2 + 30, W - 22], fill=(70, 70, 70, 255))  # cadeado
            pixo(d, 60, 260, W - 120, 90, rng)
        # sujeira na parte de baixo
        d.rectangle([0, W - 26, W, W], fill=(60, 54, 46, 120))
        atlas.paste(im, (cx, cy))
    atlas.convert("RGB").save(os.path.join(OUT, "lojas.png"))
    emit.save(os.path.join(OUT, "lojas_luz.png"))
    print("ok lojas.png")


def placa(texto, fundo, letra, nome, w=1024, h=192, fonte_="Anton.ttf", borda=(20, 20, 20)):
    im = Image.new("RGBA", (w, h), tuple(cor(fundo).astype(int).tolist()) + (255,))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=borda, width=8)
    tam = int(h * 0.62)
    f = fonte(fonte_, tam)
    while d.textlength(texto, font=f) > w - 60:
        tam -= 4
        f = fonte(fonte_, tam)
    tw = d.textlength(texto, font=f)
    d.text(((w - tw) / 2, h / 2 - tam * 0.62), texto, font=f, fill=tuple(cor(letra).astype(int).tolist()) + (255,))
    im.save(os.path.join(OUT, nome))
    print("ok", nome)


def placas():
    placa("FACULDADE INTEGRADA DO PARI", "#1b2430", "#f2efe6", "placa_faculdade.png")
    placa("HOSPITAL MUNICIPAL SÃO CRISPIM", "#f2f0ea", "#b31f24", "placa_hospital.png", borda=(180, 30, 36))
    placa("MERCADO DO ANTÔNIO", "#b8232a", "#fff4d8", "placa_mercado.png")
    placa("ESTÁDIO", "#20242a", "#e9e6d8", "placa_estadio.png", w=768)
    placa("PRONTO-SOCORRO", "#b31f24", "#ffffff", "placa_ps.png", w=768)
    # placas de rua (nomes inventados, com a história do bairro: tecelagens, armazéns, o cruzeiro do morro)
    for nome, texto in [("av", "AV. DOS TECELÕES"), ("v1", "R. SÃO CRISPIM"), ("v2", "R. DAS TORCIDAS"),
                        ("h0", "R. DO CRUZEIRO"), ("h2", "R. DOS ARMAZÉNS"), ("trilha", "TRILHA DO CRUZEIRO")]:
        placa(texto, "#1d4f8a", "#ffffff", "placa_rua_%s.png" % nome, w=512, h=128, fonte_="BebasNeue.ttf", borda=(240, 240, 240))


def pixos():
    """Faixa com pixos e pichações para colar no alto dos prédios (com transparência)."""
    W, H = 2048, 256
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    rng = np.random.default_rng(3)
    x = 20
    while x < W - 200:
        larg = int(rng.integers(180, 420))
        pixo(d, x, int(rng.integers(30, 90)), larg, int(rng.integers(70, 130)), rng,
             cor_=[(16, 16, 18), (16, 16, 18), (150, 24, 24), (20, 40, 110)][rng.integers(0, 4)])
        x += larg + int(rng.integers(30, 90))
    f = fonte("PermanentMarker.ttf", 60)
    for frase, px, c in (("O GOVERNO SABIA", 120, (190, 30, 30)), ("QUARENTENA É PRISÃO", 900, (230, 226, 218)), ("SP RESISTE", 1600, (30, 60, 160))):
        d.text((px, 168), frase, font=f, fill=c + (220,))
    im.save(os.path.join(OUT, "pixos.png"))
    print("ok pixos.png")


# ------------------------------------------------------------------ telhados e chão natural
def telhados():
    n = 512
    f = fbm(n, 6, 5, 21)
    base = 120 + f * 40 + (R.random((n, n)) - 0.5) * 14
    img = np.stack([base, base * 0.97, base * 0.92], -1)
    mancha = np.clip((fbm(n, 4, 4, 22) - 0.5) * 3, 0, 1)[..., None]
    img = img * (1 - 0.35 * mancha) + np.array([40, 46, 34]) * 0.35 * mancha  # limo
    salvar(img, "laje.png")
    # telha cerâmica (casas)
    yy, xx = np.mgrid[0:n, 0:n]
    onda = np.sin(xx / n * math.tau * 16) * 0.5 + 0.5
    fila = (yy % 32) / 32
    t = 0.65 + 0.35 * onda * (1 - fila * 0.6)
    var = ruido(n, 16, 23)
    telha = np.stack([168 * t * (0.85 + 0.3 * var), 82 * t * (0.85 + 0.3 * var), 58 * t * (0.85 + 0.3 * var)], -1)
    telha[(yy % 32) < 3] *= 0.6
    salvar(telha, "telha.png")


def natural():
    n = 512
    f = fbm(n, 8, 6, 31)
    g = fbm(n, 32, 3, 32)
    grama = np.stack([52 + f * 30 + g * 20, 78 + f * 44 + g * 26, 34 + f * 16 + g * 10], -1)
    salvar(grama, "grama.png")
    t = fbm(n, 6, 6, 33)
    pedr = (R.random((n, n)) > 0.992)
    terra = np.stack([118 + t * 40, 90 + t * 30, 62 + t * 22], -1)
    terra[pedr] = [150, 140, 126]
    salvar(terra, "terra.png")
    # copa de árvore vista de cima (com transparência)
    m = 256
    yy, xx = np.mgrid[0:m, 0:m] / m - 0.5
    r = np.sqrt(xx ** 2 + yy ** 2)
    fol = fbm(m, 8, 5, 34)
    alfa = np.clip((0.48 - r + (fol - 0.5) * 0.25) * 18, 0, 1)
    luz = np.clip(0.55 + (-xx - yy) * 0.9 + (fol - 0.5) * 0.9, 0.2, 1.3)
    copa = np.stack([40 * luz, 74 * luz, 30 * luz, alfa * 255], -1)
    salvar(copa, "copa.png")


# ------------------------------------------------------------------ efeitos: fogo, fumaça, explosão, brilho
def fumaca():
    m = 256
    yy, xx = np.mgrid[0:m, 0:m] / m - 0.5
    r = np.sqrt(xx ** 2 + yy ** 2)
    f = fbm(m, 4, 6, 41)
    alfa = np.clip((0.46 - r + (f - 0.5) * 0.35) * 5, 0, 1) ** 1.3
    luz = 0.75 + (f - 0.5) * 0.6 - yy * 0.4
    img = np.stack([200 * luz, 196 * luz, 190 * luz, alfa * 255], -1)
    salvar(img, "fumaca.png")


def flipbook(nome, quadros, gerador, m=128, cols=4):
    linhas = math.ceil(quadros / cols)
    out = np.zeros((m * linhas, m * cols, 4))
    for q in range(quadros):
        out[(q // cols) * m:(q // cols + 1) * m, (q % cols) * m:(q % cols + 1) * m] = gerador(q / max(1, quadros - 1), m, q)
    salvar(out, nome)


def quadro_fogo(t, m, q):
    yy, xx = np.mgrid[0:m, 0:m] / m
    f = fbm(m, 4, 5, 50 + q * 3)
    sobe = np.roll(f, -int(q * m / 16), axis=0)
    torce = (np.roll(fbm(m, 3, 4, 90 + q), -int(q * m / 10), axis=0) - 0.5) * 0.45 * (1 - yy)
    forma = np.clip(1 - np.abs(xx + torce - 0.5) * (2.2 + (1 - yy) * 3.2), 0, 1) * np.clip(yy * 1.6 - 0.1, 0, 1)
    calor = np.clip(forma * (0.55 + sobe * 0.9) - (1 - yy) * 0.35, 0, 1)
    rgb = np.stack([np.clip(calor * 3.0, 0, 1), np.clip(calor * 2.0 - 0.45, 0, 1), np.clip(calor * 2.2 - 1.3, 0, 1)], -1)
    return np.concatenate([rgb * 255, np.clip(calor * 2.2, 0, 1)[..., None] * 255], -1)


def quadro_explosao(t, m, q):
    yy, xx = np.mgrid[0:m, 0:m] / m - 0.5
    r = np.sqrt(xx ** 2 + yy ** 2)
    f = fbm(m, 4, 5, 70 + q)
    raio = 0.2 + 0.28 * (t ** 0.45)
    borda = np.clip((raio - r + (f - 0.5) * 0.22) * 10, 0, 1)
    calor = np.clip((1.15 - t * 1.3) * (1.2 - r / max(raio, 0.01)) * 1.9 + (f - 0.5) * 0.8 - t * 0.2, 0, 1)
    fum = np.clip(t * 1.4 - 0.25, 0, 1)
    rgb = np.stack([0.95 * calor + (1 - calor) * 0.22, 0.7 * calor ** 1.4 + (1 - calor) * 0.2, 0.35 * calor ** 2.5 + (1 - calor) * 0.19], -1)
    rgb = rgb * (1 - fum * 0.5 * (1 - calor))[..., None]
    return np.concatenate([np.clip(rgb, 0, 1) * 255, (borda * (1 - np.clip((t - 0.75) * 4, 0, 1)))[..., None] * 255], -1)


def brilho():
    m = 128
    yy, xx = np.mgrid[0:m, 0:m] / m - 0.5
    r = np.sqrt(xx ** 2 + yy ** 2)
    a = np.clip(1 - r * 2, 0, 1) ** 2.2
    salvar(np.stack([a * 255, a * 255, a * 255, a * 255], -1), "brilho.png")
    # faísca alongada
    f = np.clip(1 - np.abs(yy) * 14, 0, 1) * np.clip(1 - np.abs(xx) * 2.2, 0, 1)
    salvar(np.stack([f * 255] * 4, -1), "faisca.png")


def mancha_sangue():
    m = 256
    yy, xx = np.mgrid[0:m, 0:m] / m - 0.5
    r = np.sqrt(xx ** 2 + yy ** 2)
    f = fbm(m, 6, 5, 90)
    a = np.clip((0.3 - r + (f - 0.5) * 0.4) * 12, 0, 1)
    gotas = (R.random((m, m)) > 0.997)
    a = np.maximum(a, ImageFilter and np.array(Image.fromarray((gotas * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) / 255 * (r < 0.48))
    salvar(np.stack([92 * np.ones_like(a), 12 * np.ones_like(a), 14 * np.ones_like(a), a * 230], -1), "sangue.png")
    q = np.clip((0.42 - r + (f - 0.5) * 0.3) * 4, 0, 1)
    salvar(np.stack([12 * np.ones_like(q), 10 * np.ones_like(q), 9 * np.ones_like(q), q * 220], -1), "queimado.png")


def extras():
    # slide do TCC da Hannah (tema cânone: guerra, defesa e desenvolvimento tecnológico)
    W, H = 1280, 720
    im = Image.new("RGB", (W, H), (16, 28, 52))
    d = ImageDraw.Draw(im)
    for k in range(H):
        d.line([(0, k), (W, k)], fill=(16 + k // 40, 28 + k // 30, 52 + k // 24))
    d.rectangle([0, 0, W, 10], fill=(232, 177, 13))
    d.text((70, 70), "TRABALHO DE CONCLUSÃO DE CURSO", font=fonte("BebasNeue.ttf", 54), fill=(232, 177, 13))
    d.text((70, 150), "Guerra, defesa e o", font=fonte("Oswald.ttf", 76), fill=(240, 238, 230))
    d.text((70, 240), "desenvolvimento científico", font=fonte("Oswald.ttf", 76), fill=(240, 238, 230))
    d.text((70, 330), "e tecnológico de um país", font=fonte("Oswald.ttf", 76), fill=(240, 238, 230))
    d.text((70, 520), "Hannah  ·  Química e Física", font=fonte("Oswald.ttf", 40), fill=(170, 186, 210))
    d.text((70, 580), "Banca: 17h00", font=fonte("Oswald.ttf", 34), fill=(170, 186, 210))
    for i in range(6):  # gráfico de barras
        h = [80, 120, 100, 170, 210, 260][i]
        d.rectangle([880 + i * 52, 640 - h, 916 + i * 52, 640], fill=(70 + i * 25, 120 + i * 12, 190))
    im.save(os.path.join(OUT, "slide_tcc.png"))
    # heliponto
    n = 512
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([20, 20, n - 20, n - 20], outline=(236, 232, 222, 255), width=26)
    f = fonte("Anton.ttf", 300)
    tw = d.textlength("H", font=f)
    d.text(((n - tw) / 2, 60), "H", font=f, fill=(236, 232, 222, 255))
    im.save(os.path.join(OUT, "heliponto.png"))
    # gramado do estádio
    W, H = 1024, 704
    im = Image.new("RGB", (W, H), (58, 128, 52))
    d = ImageDraw.Draw(im)
    for k in range(0, W, 64):
        if (k // 64) % 2 == 0:
            d.rectangle([k, 0, k + 63, H], fill=(68, 142, 60))
    c = (232, 230, 216)
    d.rectangle([40, 40, W - 40, H - 40], outline=c, width=6)
    d.line([(W // 2, 40), (W // 2, H - 40)], fill=c, width=6)
    d.ellipse([W // 2 - 90, H // 2 - 90, W // 2 + 90, H // 2 + 90], outline=c, width=6)
    for x0, x1 in ((40, 200), (W - 200, W - 40)):
        d.rectangle([x0, H // 2 - 170, x1, H // 2 + 170], outline=c, width=6)
    im.save(os.path.join(OUT, "campo.png"))
    print("ok extras")


def lugares():
    """Placas, cartazes e pisos dos lugares com cara própria (estádio, mercado, hospital, faculdade)."""
    placa("ARENA FÚRIA", "#f4f1ea", "#a3161c", "placa_arena.png", w=1024, h=200, borda=(163, 22, 28))
    placa("PORTÃO 3  ·  FÚRIA LESTE F.C.", "#1d1f24", "#f5c518", "placa_portao.png", w=1024, h=128, fonte_="BebasNeue.ttf", borda=(245, 197, 24))
    placa("BILHETERIA", "#a3161c", "#ffffff", "placa_bilheteria.png", w=512, h=128, fonte_="BebasNeue.ttf", borda=(255, 255, 255))
    placa("RECEPÇÃO", "#e9eef2", "#1f5f8b", "placa_recepcao.png", w=512, h=128, fonte_="BebasNeue.ttf", borda=(31, 95, 139))
    placa("TRIAGEM  ·  CLASSIFICAÇÃO DE RISCO", "#1f5f8b", "#ffffff", "placa_triagem.png", w=1024, h=128, fonte_="BebasNeue.ttf", borda=(255, 255, 255))
    placa("AÇOUGUE", "#7a1a1a", "#fff4d8", "placa_acougue.png", w=512, h=128, fonte_="BebasNeue.ttf")
    placa("HORTIFRÚTI", "#2f7a3a", "#fff4d8", "placa_horti.png", w=512, h=128, fonte_="BebasNeue.ttf")
    placa("DISK ENTREGA  2091-0000", "#f5c518", "#7a1a1a", "placa_entrega.png", w=1024, h=128, fonte_="BebasNeue.ttf", borda=(122, 26, 26))
    placa("SEMANA DE QUÍMICA E FÍSICA", "#203a5c", "#f2efe6", "placa_semana.png", w=1024, h=160, fonte_="Oswald.ttf")
    # faixa da torcida (time fictício): listras vermelho e preto
    W, H = 1024, 160
    im = Image.new("RGB", (W, H), (163, 22, 28))
    d = ImageDraw.Draw(im)
    for k in range(0, W, 128):
        d.rectangle([k, 0, k + 63, H], fill=(20, 20, 22))
    d.rectangle([0, 40, W, 120], fill=(244, 241, 234))
    f = fonte("PermanentMarker.ttf", 64)
    t = "FÚRIA LESTE  ·  ATÉ O FIM"
    d.text(((W - d.textlength(t, font=f)) / 2, 38), t, font=f, fill=(163, 22, 28))
    im.save(os.path.join(OUT, "faixa_torcida.png"))
    # cartazes de oferta do mercado (amarelo com preço à mão)
    ofertas = [("ARROZ 5KG", "22,90"), ("FEIJÃO 1KG", "7,49"), ("ÓLEO", "6,99"), ("CERVEJA", "GELADA!")]
    for i, (prod, preco) in enumerate(ofertas):
        im = Image.new("RGB", (256, 320), (250, 214, 40))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 255, 319], outline=(200, 30, 30), width=10)
        d.text((22, 20), "OFERTA", font=fonte("Anton.ttf", 56), fill=(200, 30, 30))
        fp = fonte("PermanentMarker.ttf", 40)
        d.text((20, 110), prod, font=fp, fill=(25, 25, 30))
        fq = fonte("PermanentMarker.ttf", 70 if len(preco) < 6 else 50)
        d.text((20, 180), ("R$ " if "," in preco else "") + preco if len(preco) < 6 else preco, font=fq, fill=(200, 30, 30))
        im.save(os.path.join(OUT, "cartaz_%d.png" % (i + 1)))
    # lousa da faculdade
    im = Image.new("RGB", (1024, 384), (34, 64, 48))
    d = ImageDraw.Draw(im)
    rng = np.random.default_rng(5)
    for _ in range(900):  # pó de giz
        x, y = rng.integers(0, 1024), rng.integers(0, 384)
        d.point((int(x), int(y)), fill=(70, 100, 84))
    d.rectangle([0, 0, 1023, 383], outline=(120, 86, 52), width=14)
    fg = fonte("PermanentMarker.ttf", 46)
    d.text((40, 40), "Termodinâmica  -  prova dia 30", font=fg, fill=(226, 230, 222))
    d.text((40, 120), "dU = dQ - dW", font=fg, fill=(226, 230, 222))
    d.text((40, 200), "AVISO: aulas suspensas amanhã?", font=fg, fill=(240, 200, 120))
    d.text((40, 280), "(ninguém sabe de nada)", font=fonte("PermanentMarker.ttf", 34), fill=(200, 210, 200))
    im.save(os.path.join(OUT, "lousa.png"))
    # piso quadriculado (mercado) e piso vinílico (hospital), repetem
    n = 256
    a = np.zeros((n, n, 3))
    xx, yy = np.meshgrid(np.arange(n), np.arange(n))
    xadrez = ((xx // 64 + yy // 64) % 2)[..., None]
    a[:] = np.where(xadrez, cor("#e9e4d8"), cor("#b0392f"))
    a += (fbm(n, 4, 4, 31)[..., None] - 0.5) * 30
    a[(xx % 64 < 2) | (yy % 64 < 2)] *= 0.75
    salvar(a, "piso_mercado.png")
    a = np.zeros((n, n, 3))
    a[:] = cor("#c9d3d2")
    a += (fbm(n, 6, 4, 32)[..., None] - 0.5) * 26
    a[(xx % 128 < 2) | (yy % 128 < 2)] *= 0.82
    salvar(a, "piso_hospital.png")
    print("ok lugares")


if __name__ == "__main__":
    lugares()
    extras()
    asfalto()
    calcada_concreto()
    calcada_sp()
    fachadas()
    lojas()
    placas()
    pixos()
    telhados()
    natural()
    fumaca()
    flipbook("fogo.png", 16, quadro_fogo, m=256)
    flipbook("explosao.png", 16, quadro_explosao, m=256)
    brilho()
    mancha_sangue()
    print("FIM")
