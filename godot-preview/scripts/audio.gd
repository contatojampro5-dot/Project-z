extends Node
class_name GameAudio
## Sons do prólogo: efeitos com posição na cidade, loops (fogo, sirene, helicóptero) e música.

const FILES := {
	"fire_loop": "fire_loop.mp3", "horde_loop": "horde_loop.mp3", "engine_loop": "engine_loop.mp3",
	"people_01": "people_01.mp3", "people_02": "people_02.mp3", "people_03": "people_03.mp3", "people_04": "people_04.mp3",
	"scream_01": "scream_01.mp3", "scream_02": "scream_02.mp3",
	"explosion_01": "explosion_01.mp3", "explosion_02": "explosion_02.mp3", "impact": "impact.mp3", "hurt": "hurt.mp3",
	"z_attack": "z_attack.mp3", "z_groan1": "z_groan1.mp3", "z_groan2": "z_groan2.mp3", "z_runner": "z_runner.mp3", "z_death": "z_death.mp3",
	"musica_fuga": "musica_fuga.mp3", "musica_final": "musica_final.mp3",
	"sirene": "sirene.wav", "coracao": "coracao.wav", "helicoptero": "helicoptero.wav", "portao": "portao.wav",
	"radio": "radio.wav", "golpe": "golpe.wav", "celular": "celular.wav", "jato": "jato.wav",
}
const LOOPS := ["fire_loop", "horde_loop", "engine_loop", "sirene", "coracao", "helicoptero", "radio", "musica_fuga", "musica_final"]

var main: Node = null
var _cache := {}
var _pool: Array[AudioStreamPlayer2D] = []
var _ui: Array[AudioStreamPlayer] = []
var _pi := 0
var _ui_i := 0
var _scream_t := 0.0
var _groan_t := 0.0
var music_player: AudioStreamPlayer = null
var horde: AudioStreamPlayer = null
var panic: AudioStreamPlayer = null
var heart: AudioStreamPlayer = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in 14:
		var p := AudioStreamPlayer2D.new()
		p.max_distance = 1500
		p.attenuation = 1.6
		add_child(p)
		_pool.append(p)
	for i in 4:
		var u := AudioStreamPlayer.new()
		add_child(u)
		_ui.append(u)
	music_player = AudioStreamPlayer.new()
	add_child(music_player)
	horde = _bed("horde_loop")
	panic = _bed("people_02")
	heart = _bed("coracao")

func _bed(name: String) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.stream = stream(name, true)
	p.volume_db = -60
	add_child(p)
	p.play()
	return p

func stream(name: String, force_loop := false) -> AudioStream:
	var key := name + ("#loop" if force_loop else "")
	if _cache.has(key):
		return _cache[key]
	var s: AudioStream = load("res://assets/audio/" + FILES[name])
	if force_loop or name in LOOPS:
		s = s.duplicate()
		if s is AudioStreamMP3:
			s.loop = true
		elif s is AudioStreamWAV:
			s.loop_mode = AudioStreamWAV.LOOP_FORWARD
			s.loop_begin = 0
			s.loop_end = s.data.size() / 2
	_cache[key] = s
	return s

func sfx(name: String, pos = null, db := 0.0, pitch_rand := 0.08) -> void:
	if pos == null:
		var u := _ui[_ui_i]
		_ui_i = (_ui_i + 1) % _ui.size()
		u.stream = stream(name)
		u.volume_db = db
		u.pitch_scale = 1.0 + randf_range(-pitch_rand, pitch_rand)
		u.play()
		return
	var p := _pool[_pi]
	_pi = (_pi + 1) % _pool.size()
	p.stream = stream(name)
	p.global_position = pos
	p.volume_db = db
	p.pitch_scale = 1.0 + randf_range(-pitch_rand, pitch_rand)
	p.play()

func loop_at(name: String, parent: Node2D, db := 0.0) -> AudioStreamPlayer2D:
	var p := AudioStreamPlayer2D.new()
	p.stream = stream(name, true)
	p.volume_db = db
	p.max_distance = 1300
	p.attenuation = 1.8
	parent.add_child(p)
	p.play(randf() * 0.8)
	return p

func scream(pos: Vector2, force := false) -> void:
	if _scream_t > 0 and not force:
		return
	_scream_t = randf_range(0.8, 1.6)
	var opts := ["scream_01", "scream_02", "people_01", "people_03", "people_04"]
	sfx(opts.pick_random(), pos, -4, 0.15)

func groan(pos: Vector2, kind: String) -> void:
	if _groan_t > 0 or main == null or main.cam == null:
		return
	if pos.distance_to(main.cam.get_screen_center_position()) > 800:
		return
	_groan_t = 0.5
	sfx("z_runner" if kind == "corredor" else ["z_groan1", "z_groan2"].pick_random(), pos, -8, 0.15)

func music(name: String, db := -8.0, fade := 2.0) -> void:
	var tw := create_tween()
	if music_player.playing:
		tw.tween_property(music_player, "volume_db", -50.0, fade * 0.5)
	tw.tween_callback(func():
		music_player.stream = stream(name)
		music_player.volume_db = -40
		music_player.play())
	tw.tween_property(music_player, "volume_db", db, fade)

func stop_music(fade := 2.0) -> void:
	var tw := create_tween()
	tw.tween_property(music_player, "volume_db", -60.0, fade)
	tw.tween_callback(music_player.stop)

func _process(delta: float) -> void:
	_scream_t -= delta
	_groan_t -= delta

func set_bed(p: AudioStreamPlayer, amount: float, max_db := -8.0, delta := 0.016) -> void:
	var target: float = lerp(-50.0, max_db, clamp(amount, 0.0, 1.0)) if amount > 0.01 else -60.0
	p.volume_db = move_toward(p.volume_db, target, delta * 30.0)
