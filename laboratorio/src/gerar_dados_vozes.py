# Gera src/scripts/game/08c-data_voiceFiles.js a partir dos arquivos em assets/audio/voices/<personagem>/<id>.mp3
import os,json
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
base=os.path.join(ROOT,'assets/audio/voices');out={}
for ch in sorted(os.listdir(base)):
    d=os.path.join(base,ch)
    if not os.path.isdir(d):continue
    out[ch]={int(f[:-4]):f'@@ASSET:assets/audio/voices/{ch}/{f}@@' for f in sorted(os.listdir(d)) if f.endswith('.mp3')}
js='// -- gerado por laboratorio/src/gerar_dados_vozes.py: um arquivo de voz por fala (ElevenLabs) --\nconst PZ_VOICE_FILES=Object.freeze('+json.dumps(out,ensure_ascii=False,separators=(',',':'))+');\n'
open(os.path.join(ROOT,'src/scripts/game/08c-data_voiceFiles.js'),'w').write(js)
print({k:len(v) for k,v in out.items()})
