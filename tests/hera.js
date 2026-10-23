// Hera · roteiro de testes do PROJECT Z (roda em toda entrega).
// Uso: node tests/hera.js [caminho do index.html] [pasta de capturas]
// Requer: npm i playwright  (ou Chromium já instalado com Playwright)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FILE = path.resolve(process.argv[2] || path.join(__dirname, '../dist/index.html'));
const OUT = path.resolve(process.argv[3] || path.join(__dirname, 'capturas'));
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); };
const wait = (p, ms) => p.waitForTimeout(ms);

async function openSelection(p) {
  for (const f of p.frames().filter(x => x !== p.mainFrame())) {
    const el = await f.$('text=/^\\s*jogar\\s*$/i');
    if (el) { await el.click(); await wait(p, 900); return true; }
  }
  return false;
}
const q = (p, fn, arg) => p.evaluate(fn, arg);

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Computador ----------
  {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/autoplay/i.test(m.text())) errors.push(m.text()); });
    await p.goto('file://' + FILE); await wait(p, 1500);
    check('Menu cinematográfico carrega', await q(p, () => !!document.querySelector('.pz-v3-frame')));
    check('Botão JOGAR abre a seleção', await openSelection(p) && await q(p, () => !!document.querySelector('.pz-cs')));
    await p.screenshot({ path: path.join(OUT, 'pc-selecao.png') });

    const sel = () => q(p, () => document.querySelector('.pz-cs-tile.is-selected')?.dataset.character);
    await p.keyboard.press('ArrowRight'); await wait(p, 250);
    check('Seta → muda o personagem', (await sel()) === 'hadassa', await sel());
    await p.keyboard.press('Enter'); await wait(p, 300);
    check('Enter em personagem bloqueado não avança', await q(p, () => !!document.querySelector('.pz-cs')));
    await p.keyboard.press('ArrowLeft'); await wait(p, 250);
    await p.keyboard.press('Enter'); await wait(p, 400);
    check('Enter com Antônio vai para a dificuldade', await q(p, () => !!document.querySelector('.pz-ds')));
    await p.screenshot({ path: path.join(OUT, 'pc-dificuldade.png') });
    const ctaD = await q(p, () => { const r = document.querySelector('.pz-ds .pz-cs-cta')?.getBoundingClientRect(); return r && r.bottom <= innerHeight + 1 && r.width > 0; });
    check('Dificuldade: botão Iniciar visível sem rolar', ctaD);
    const dBefore = await q(p, () => document.querySelector('.pz-ds-card.is-selected')?.dataset.difficulty);
    await p.keyboard.press('ArrowRight'); await wait(p, 250);
    const dAfter = await q(p, () => document.querySelector('.pz-ds-card.is-selected')?.dataset.difficulty);
    check('Seta → muda a dificuldade', dBefore && dAfter && dBefore !== dAfter, `${dBefore} → ${dAfter}`);
    await p.keyboard.press('ArrowLeft'); await wait(p, 250);
    await p.keyboard.press('Escape'); await wait(p, 400);
    check('Esc na dificuldade volta à seleção', await q(p, () => !!document.querySelector('.pz-cs')));
    await p.keyboard.press('Escape'); await wait(p, 600);
    check('Esc na seleção volta ao menu', await q(p, () => document.querySelector('#pz-v3-overlay')?.getAttribute('aria-hidden') === 'false'));

    // Partida
    await openSelection(p);
    await q(p, () => document.querySelector('[data-action="char-to-difficulty"]').click()); await wait(p, 400);
    await q(p, () => document.querySelector('[data-action="start-preview"]').click()); await wait(p, 2500);
    check('Partida inicia (canvas em campo)', await q(p, () => document.querySelector('.app')?.dataset.scene === 'field'));

    // Seleção de texto: arrastar sobre o cartão de nova ameaça / HUD
    await p.mouse.move(300, 120); await p.mouse.down(); await p.mouse.move(1100, 650, { steps: 12 }); await p.mouse.up();
    const selected = await q(p, () => String(getSelection()));
    check('Arrastar o mouse não seleciona texto', selected.trim() === '', selected.slice(0, 60));
    await p.screenshot({ path: path.join(OUT, 'pc-partida-inicio.png') });

    const keys = ['KeyD', 'KeyW', 'KeyA', 'KeyS'];
    for (let i = 0; i < 8; i++) {
      await q(p, () => { document.querySelector('[data-action="dismiss-discovery"]')?.click(); document.querySelector('[data-action="choose-upgrade"]')?.click(); });
      await p.keyboard.down(keys[i % 4]); await p.mouse.down();
      for (let k = 0; k < 8; k++) { await p.mouse.move(720 + Math.cos(k + i) * 320, 450 + Math.sin(k + i) * 240); await wait(p, 120); }
      await p.mouse.up(); await p.keyboard.up(keys[i % 4]);
    }
    await p.screenshot({ path: path.join(OUT, 'pc-partida-combate.png') });
    const frame = await q(p, () => new Promise(r => { const t = []; let last = performance.now(); let n = 0;
      const f = now => { t.push(now - last); last = now; if (++n < 90) requestAnimationFrame(f); else { t.sort((a, b) => a - b); r({ mediana: t[45], p95: t[85] }); } };
      requestAnimationFrame(f); }));
    check('Tempo de quadro medido', true, `mediana ${frame.mediana.toFixed(1)} ms, p95 ${frame.p95.toFixed(1)} ms (máquina de teste sem GPU; não representa celular)`);
    // R34: a noite liga o mapa de luz, faróis, lanterna e postes — precisa rodar sem erro
    const nightErr = errors.length;
    await q(p, () => { window.__PROJECT_Z_CLIMATE_PREVIEW__ = { time: 250 }; }); await wait(p, 1800);
    await p.screenshot({ path: path.join(OUT, 'pc-partida-noite.png') });
    check('Noite roda sem erro (luzes, faróis, lanterna)', errors.length === nightErr, errors.slice(nightErr, nightErr + 2).join(' | '));
    await q(p, () => { window.__PROJECT_Z_CLIMATE_PREVIEW__ = null; });
    check('Nenhum erro de JavaScript no computador', errors.length === 0, errors.slice(0, 3).join(' | '));
    await p.close();
  }

  // ---------- 2. Notebook 1366×768, celular em pé e deitado ----------
  for (const [w, h, tag] of [[1366, 768, 'notebook-1366'], [390, 844, 'celular-em-pe'], [844, 390, 'celular-deitado']]) {
    const mobile = w < 1000;
    const p = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.goto('file://' + FILE); await wait(p, 1500);
    await openSelection(p);
    const cta = await q(p, () => { const r = document.querySelector('.pz-cs-cta')?.getBoundingClientRect(); return r && r.bottom <= innerHeight + 1 && r.top >= 0 && r.width > 0; });
    check(`${tag}: botão Continuar visível sem rolar`, cta);
    await q(p, () => document.querySelector('[data-action="char-to-difficulty"]')?.click()); await wait(p, 500);
    const ctaD = await q(p, () => { const r = document.querySelector('.pz-ds .pz-cs-cta')?.getBoundingClientRect(); return r && r.bottom <= innerHeight + 1 && r.top >= 0 && r.width > 0; });
    check(`${tag}: dificuldade com botão Iniciar visível sem rolar`, ctaD);
    await p.screenshot({ path: path.join(OUT, `${tag}-dificuldade.png`) });
    await q(p, () => document.querySelector('[data-action="difficulty-to-characters"]')?.click()); await wait(p, 400);
    const overflow = await q(p, () => document.documentElement.scrollWidth > innerWidth + 1);
    check(`${tag}: sem rolagem horizontal`, !overflow);
    await p.screenshot({ path: path.join(OUT, `${tag}-selecao.png`) });
    check(`${tag}: nenhum erro de JavaScript`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await p.close();
  }
  await browser.close();

  // ---------- Relatório ----------
  const pass = results.filter(r => r.ok).length;
  const lines = results.map(r => `${r.ok ? '✔' : '✘'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  const report = `HERA · ${pass}/${results.length} verificações aprovadas\n` + lines.join('\n');
  fs.writeFileSync(path.join(OUT, 'relatorio.txt'), report + '\n');
  console.log(report);
  process.exit(pass === results.length ? 0 : 1);
})();
