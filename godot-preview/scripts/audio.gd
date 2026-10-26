extends Node
class_name SomZ
## Sons do prólogo (Apolo): efeitos com posição na cidade 3D, loops presos nas coisas (fogo, sirene,
## helicóptero), camadas de ambiente (multidão em pânico, horda, coração do Antônio) e música.
## Os arquivos `*_el.mp3` são gravações do ElevenLabs; quando existem, têm preferência.

const ARQ := {
	"fogo": ["fire_loop.mp3"], "horda": ["horde_loop.mp3"], "motor": ["engine_loop.mp3"],
	"multidao": ["multidao_el.mp3", "people_02.mp3"], "grito": ["grito1_el.mp3", "grito2_el.mp3", "scream_01.mp3", "scream_02.mp3", "people_01.mp3", "people_03.mp3", "people_04.mp3"],
	"explosao": ["explosao_el.mp3", "explosion_01.mp3"], "batida": ["batida_el.mp3", "explosion_02.mp3"], "pancada": ["impact.mp3"],
	"grito_curto": ["hurt.mp3"], "mordida": ["z_attack.mp3"], "gemido": ["z_groan1.mp3", "z_groan2.mp3"], "gemido_corredor": ["z_runner.mp3"],
	"morte_zumbi": ["z_death.mp3"], "musica_fuga": ["musica_fuga.mp3"], "musica_final": ["musica_final.mp3"],
	"sirene": ["sirene_el.mp3", "sirene.wav"], "coracao": ["coracao.wav"], "helicoptero": ["helicoptero_el.mp3", "helicoptero.wav"],
	"portao": ["portao_el.mp3", "portao.wav"], "radio": ["radio.wav"], "golpe": ["golpe.wav"], "pulo": ["golpe.wav"],
	"celular": ["celular.wav"], "jato": ["jato_el.mp3", "jato.wav"], "vidro": ["vidro_el.mp3", "impact.mp3"],
	"estadio": ["estadio_el.mp3", "people_02.mp3"], "alarme": ["alarme_el.mp3", "sirene.wav"],
}
const LOOPS := ["fogo", "horda", "motor", "multidao", "sirene", "coracao", "helicoptero", "radio", "musica_fuga", "musica_final", "estadio", "alarme"]

var cena: Node = null
var _cache := {}
var _pool: Array[AudioStreamPlayer3D] = []
var _ui: Array[AudioStreamPlayer] = []
var _pi := 0
var _ui_i := 0
var _grito_t := 0.0
var _gemido_t := 0.0
var musica: AudioStreamPlayer
var cama_horda: AudioStreamPlayer
var cama_multidao: AudioStreamPlayer
var cama_coracao: AudioStreamPlayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in 18:
		var p := AudioStreamPlayer3D.new()
		p.max_distance = 120.0
		p.unit_size = 10.0
		add_child(p)
		_pool.append(p)
	for i in 4:
		var u := AudioStreamPlayer.new()
		add_child(u)
		_ui.append(u)
	musica = AudioStreamPlayer.new()
	add_child(musica)
	cama_horda = _cama("horda")
	cama_multidao = _cama("multidao")
	cama_coracao = _cama("coracao")

func _cama(n: String) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.stream = stream(n, true)
	p.volume_db = -60
	add_child(p)
	p.play()
	return p

func _arquivo(n: String) -> String:
	var opcoes: Array = ARQ[n]
	var existentes := opcoes.filter(func(f): return ResourceLoader.exists("res://assets/audio/" + f))
	if existentes.is_empty():
		return ""
	# prefere as gravações do ElevenLabs (_el); entre as outras, sorteia
	var el := existentes.filter(func(f): return "_el" in f)
	return (el if not el.is_empty() else existentes).pick_random()

func stream(n: String, laco := false) -> AudioStream:
	var f := _arquivo(n)
	if f == "":
		return null
	var k := f + ("#laco" if laco else "")
	if _cache.has(k):
		return _cache[k]
	var s: AudioStream = load("res://assets/audio/" + f)
	if laco or n in LOOPS:
		s = s.duplicate()
		if s is AudioStreamMP3:
			s.loop = true
		elif s is AudioStreamWAV:
			s.loop_mode = AudioStreamWAV.LOOP_FORWARD
			s.loop_begin = 0
			s.loop_end = s.data.size() / 2
	_cache[k] = s
	return s

func som(n: String, pos = null, db := 0.0, variacao := 0.08) -> void:
	var s := stream(n)
	if s == null:
		return
	if pos == null:
		var u := _ui[_ui_i]
		_ui_i = (_ui_i + 1) % _ui.size()
		u.stream = s
		u.volume_db = db
		u.pitch_scale = 1.0 + randf_range(-variacao, variacao)
		u.play()
		return
	var p := _pool[_pi]
	_pi = (_pi + 1) % _pool.size()
	p.stream = s
	p.global_position = pos
	p.volume_db = db
	p.pitch_scale = 1.0 + randf_range(-variacao, variacao)
	p.play()

func loop_em(n: String, pai: Node3D, db := 0.0, alcance := 70.0) -> AudioStreamPlayer3D:
	var p := AudioStreamPlayer3D.new()
	p.stream = stream(n, true)
	p.volume_db = db
	p.max_distance = alcance
	p.unit_size = 8.0
	pai.add_child(p)
	p.play(randf() * 0.8)
	return p

func grito(pos: Vector3, forca := false) -> void:
	if _grito_t > 0 and not forca:
		return
	_grito_t = randf_range(0.7, 1.5)
	som("grito", pos, -2.0, 0.15)

func gemido(pos: Vector3, tipo: String) -> void:
	if _gemido_t > 0 or cena == null or cena.cam == null:
		return
	if pos.distance_to(cena.cam.foco) > 30.0:
		return
	_gemido_t = 0.45
	som("gemido_corredor" if tipo == "corredor" else "gemido", pos, -6.0, 0.15)

func tocar_musica(n: String, db := -10.0, fade := 2.0) -> void:
	var tw := create_tween()
	if musica.playing:
		tw.tween_property(musica, "volume_db", -50.0, fade * 0.5)
	tw.tween_callback(func():
		musica.stream = stream(n)
		musica.volume_db = -40
		musica.play())
	tw.tween_property(musica, "volume_db", db, fade)

func parar_musica(fade := 2.0) -> void:
	var tw := create_tween()
	tw.tween_property(musica, "volume_db", -60.0, fade)
	tw.tween_callback(musica.stop)

func cama(p: AudioStreamPlayer, quanto: float, max_db := -8.0, delta := 0.016) -> void:
	var alvo: float = lerp(-45.0, max_db, clamp(quanto, 0.0, 1.0)) if quanto > 0.01 else -60.0
	p.volume_db = move_toward(p.volume_db, alvo, delta * 30.0)

func _process(delta: float) -> void:
	_grito_t -= delta
	_gemido_t -= delta
