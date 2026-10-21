import json
d=json.load(open('/home/claude/project-z/assets/images/game/sobreviventes/sobreviventes.json'))
out={}
for k,v in sorted(d.items()):
    out[k]=dict(url=f"@@ASSET:assets/images/game/sobreviventes/{k}.webp@@",cell=v['cell'],anims={a:{'row':m['row'],'frames':m['frames'],'fps':m['fps']} for a,m in v['anims'].items()},muzzle=v['muzzle'])
js="// -- gerado de assets/images/game/sobreviventes/sobreviventes.json (laboratório) --\nconst PZ_SURV_SHEETS="+json.dumps(out,ensure_ascii=False,separators=(',',':'))+";\n"
open('/home/claude/project-z/src/scripts/game/08b-data_survivorSheets.js','w').write(js)
print(len(out),'folhas')
