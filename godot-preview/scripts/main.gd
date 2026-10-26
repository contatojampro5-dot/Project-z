extends Node3D
## Diretor do prólogo "Dia Zero" (Zeus). Segue a história oficial (docs/historia.md):
## Hannah espera a banca do TCC → batida → a avenida vira caos → ela corre para o hospital.
## Antônio vê pelas câmeras o ataque às funcionárias, baixa o portão, vê tudo do telhado e salva a
## Hadassa do corredor com o extintor. Os dois fogem da horda até a casa no alto do morro.

static var capitulo := 0          # 0 = abertura, 1 = Hannah, 2 = Antônio, 3 = fuga

var auto := false                 # --autotest: o jogo se joga sozinho (para testar)
var pasta_fotos := ""
var mede_fps := false              # --fps: escreve quadros por segundo e quantos infectados há (teste de leveza)
var _fps_ms := 0
var amb: Ambiente
var cidade: Cidade
var col: Colisao
var efeitos: Node3D
var cam: CameraZ
var hud: Hud
var audio: SomZ
var jogador: Sobrevivente = null
var hannah: Sobrevivente = null
var antonio: Sobrevivente = null
var hadassa: Sobrevivente = null
var sobreviventes: Array = []
var civis: Array = []
var infectados: Array = []
var carros: Array = []
var fuga := Vector3.INF
var controle_livre := false
var _pego := false
var _fim := false
var _luzes: Array[OmniLight3D] = []
var _luz_t := 0.0
var _marcas: Array = []
var _estudantes: Array = []
var _funcionarias: Array = []
var _corredor: Infectado = null
var mordidos := 0                 # contágio: quantos foram mordidos e quantos já viraram
var viraram := 0
const MAX_INFECTADOS := 90        # acima disso, some o infectado mais longe da câmera (leveza)

func _ready() -> void:
	randomize()
	var args := OS.get_cmdline_user_args()
	auto = "--autotest" in args
	mede_fps = "--fps" in args
	for a in args:
		if a.begins_with("--fotos="):
			pasta_fotos = a.substr(8)
	if auto:
		Engine.time_scale = 2.5
		print("[autotest] capítulo ", capitulo)
	_entradas()
	audio = SomZ.new()
	audio.cena = self
	add_child(audio)
	amb = Ambiente.new()
	add_child(amb)
	amb.montar()
	col = Colisao.new()
	cidade = Cidade.new()
	add_child(cidade)
	cidade.montar(col)
	efeitos = Node3D.new()
	add_child(efeitos)
	cam = CameraZ.new()
	add_child(cam)
	Predio.camera = cam
	Pessoa.camera = cam
	for i in 10:
		var l := OmniLight3D.new()
		l.light_color = Color(1.0, 0.8, 0.52)
		l.omni_range = 16.0
		l.light_energy = 0.0
		add_child(l)
		_luzes.append(l)
	hud = Hud.new()
	add_child(hud)
	hud.setup(self)
	if "--rotas" in args:
		_checar_rotas()
		return
	match capitulo:
		0:
			_preparar_cap1()
			_abertura_e_cap1()
		1:
			_preparar_cap1()
			_cap1()
		2:
			_preparar_cap2()
			_cap2()
		_:
			_preparar_cap3()
			_cap3()

func _entradas() -> void:
	var teclas := {
		"mover_esq": [KEY_A, KEY_LEFT], "mover_dir": [KEY_D, KEY_RIGHT], "mover_cima": [KEY_W, KEY_UP], "mover_baixo": [KEY_S, KEY_DOWN],
		"correr": [KEY_SHIFT], "pular": [KEY_SPACE], "interagir": [KEY_E], "atacar": [KEY_F],
		"pular_fala": [KEY_ENTER, KEY_KP_ENTER], "pausa": [KEY_ESCAPE, KEY_P],
	}
	var botoes := {"pular": JOY_BUTTON_A, "interagir": JOY_BUTTON_X, "atacar": JOY_BUTTON_B, "correr": JOY_BUTTON_RIGHT_SHOULDER,
		"pausa": JOY_BUTTON_START, "pular_fala": JOY_BUTTON_Y}
	var eixos := {"mover_esq": [JOY_AXIS_LEFT_X, -1.0], "mover_dir": [JOY_AXIS_LEFT_X, 1.0], "mover_cima": [JOY_AXIS_LEFT_Y, -1.0], "mover_baixo": [JOY_AXIS_LEFT_Y, 1.0]}
	for a in teclas:
		if InputMap.has_action(a):
			continue
		InputMap.add_action(a, 0.25)
		for k in teclas[a]:
			var e := InputEventKey.new()
			e.physical_keycode = k
			InputMap.action_add_event(a, e)
		if botoes.has(a):
			var jb := InputEventJoypadButton.new()
			jb.button_index = botoes[a]
			InputMap.action_add_event(a, jb)
		if eixos.has(a):
			var jm := InputEventJoypadMotion.new()
			jm.axis = eixos[a][0]
			jm.axis_value = eixos[a][1]
			InputMap.action_add_event(a, jm)
	if InputMap.action_get_events("atacar").filter(func(e): return e is InputEventMouseButton).is_empty():
		var mb := InputEventMouseButton.new()
		mb.button_index = MOUSE_BUTTON_LEFT
		InputMap.action_add_event("atacar", mb)

# ======================================================================= gente e coisas
func novo_civil(p: Vector3, tipo := "", calmo := true) -> Civil:
	var c := Civil.new()
	add_child(c)
	c.montar(self, tipo, calmo)
	c.global_position = Vector3(p.x, 0, p.z)
	c.dir = randf() * TAU
	civis.append(c)
	return c

func novo_infectado(p: Vector3, tipo := "comum", variante := "") -> Infectado:
	var z := Infectado.new()
	add_child(z)
	z.montar(self, tipo, variante)
	z.global_position = Vector3(p.x, Mapa.altura(p.x, p.z), p.z)
	infectados.append(z)
	return z

func novo_carro(p: Vector3, ang: float, tipo := "hatch", cor := "") -> Carro:
	var c := Carro.new()
	c.montar(self, tipo, cor)
	c.position = Vector3(p.x, 0, p.z)
	c.rotation.y = ang
	add_child(c)
	carros.append(c)
	return c

func novo_sobrevivente(id: String, p: Vector3, ext := false) -> Sobrevivente:
	var s := Sobrevivente.new()
	add_child(s)
	s.montar(self, id, ext)
	s.global_position = p
	sobreviventes.append(s)
	s.pego.connect(_quando_pego)
	return s

func controlar(s: Sobrevivente) -> void:
	if jogador:
		jogador.controlado = false
	jogador = s
	s.controlado = true
	Predio.foco = s
	cam.seguir(s, 30.0)

func destroco(p: Vector3, ang: float, pegando_fogo := true, tipo := "hatch") -> Carro:
	var c := novo_carro(p, ang, tipo)
	c.estado = "batido"
	c.corpo.rotation.z = randf_range(-0.06, 0.06)
	if pegando_fogo:
		c.pegar_fogo()
		if randf() < 0.5:
			c.queimar()
	else:
		FX.fumaca(c, Vector3(1.2, 1.0, 0), 0.6, false)
	return c

func virar_infectado(c: Civil) -> Infectado:
	if not is_instance_valid(c):
		return null
	# quem vira infectado continua parecido: policial vira o zumbi policial, mulher vira a zumbi
	var vv := "paciente" if c.idoso else ""
	if c.variante == "civ_policial":
		vv = "policial"
	elif c.variante in ["civ_atendente", "civ_estudante2", "civ_torcedora", "civ_idosa", "civ_funcionaria"]:
		vv = "mulher"
	var z := novo_infectado(c.global_position, "comum", vv)
	z.dir = c.dir
	if z.modelo:
		z.levantar()
	else:
		z.tocar("hit", true)
		z.atordoado = 1.0
	z.visao = 18.0
	z.pensa = 1.0
	viraram += 1
	audio.gemido(c.global_position, "comum")
	civis.erase(c)
	c.queue_free()
	if infectados.size() > MAX_INFECTADOS:
		var foco: Vector3 = cam.global_position
		var longe: Node3D = null
		var ld := 0.0
		for o in infectados:
			if is_instance_valid(o) and o != z and o.alvo_cena == null:
				var d := _d2(o.global_position, foco)
				if d > ld:
					ld = d
					longe = o
		if longe:
			infectados.erase(longe)
			longe.queue_free()
	return z

func marca(p: Vector3, tam: float, tipo := "sangue") -> void:
	_marcas.append(FX.mancha(efeitos, p + Vector3(randf_range(-0.3, 0.3), 0, randf_range(-0.3, 0.3)), tam * randf_range(0.8, 1.2), tipo))
	if _marcas.size() > 160:
		var m = _marcas.pop_front()
		if is_instance_valid(m):
			m.queue_free()

func _d2(a: Vector3, b: Vector3) -> float:
	return (a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z)

func perto(p: Vector3, r: float) -> Array:
	var out := []
	var r2 := r * r
	for lista in [civis, infectados, sobreviventes]:
		for a in lista:
			if is_instance_valid(a) and _d2(a.global_position, p) <= r2:
				out.append(a)
	return out

func infectado_perto(p: Vector3, r: float) -> Infectado:
	var best: Infectado = null
	var bd := r * r
	for z in infectados:
		if is_instance_valid(z) and z.vivo:
			var d := _d2(z.global_position, p)
			if d < bd:
				bd = d
				best = z
	return best

func infectados_perto(p: Vector3, r: float) -> int:
	var n := 0
	for z in infectados:
		if is_instance_valid(z) and z.vivo and _d2(z.global_position, p) < r * r:
			n += 1
	return n

func humano_perto(p: Vector3, r: float) -> Node3D:
	var best: Node3D = null
	var bd := r * r
	for c in civis:
		if is_instance_valid(c) and c.estado in ["calmo", "panico", "encolhido"]:
			var d := _d2(c.global_position, p)
			if d < bd:
				bd = d
				best = c
	for s in sobreviventes:
		if is_instance_valid(s) and s.vivo and s.visible and not s.get_meta("no_telhado", false):
			var d2 := _d2(s.global_position, p) * (0.6 if s.controlado else 1.0)
			if d2 < bd:
				bd = d2
				best = s
	return best

# ======================================================================= laço
func _physics_process(_delta: float) -> void:
	if Engine.get_physics_frames() % 30 == 0:
		infectados = infectados.filter(func(z): return is_instance_valid(z))
		civis = civis.filter(func(c): return is_instance_valid(c))
		carros = carros.filter(func(c): return is_instance_valid(c))
	# ninguém fica em cima de ninguém
	var todos := []
	for lista in [infectados, civis, sobreviventes]:
		for a in lista:
			if not is_instance_valid(a) or a.fantasma or not a.vivo:
				continue
			if a is Civil and not a.estado in ["calmo", "panico", "encolhido"]:
				continue
			todos.append(a)
	var n := todos.size()
	for i in n:
		var a: Pessoa = todos[i]
		for j in range(i + 1, n):
			var b: Pessoa = todos[j]
			var dx := a.global_position.x - b.global_position.x
			var dz := a.global_position.z - b.global_position.z
			var m := a.raio + b.raio
			var d2 := dx * dx + dz * dz
			if d2 < m * m and d2 > 0.0001:
				var d := sqrt(d2)
				var e := (m - d) * 0.5 / d
				a.global_position += Vector3(dx * e, 0, dz * e)
				b.global_position -= Vector3(dx * e, 0, dz * e)

func _process(delta: float) -> void:
	if mede_fps and Time.get_ticks_msec() - _fps_ms > 4000:
		_fps_ms = Time.get_ticks_msec()
		print("[fps] %d quadros/s  infectados=%d  civis=%d  capitulo=%d" % [Engine.get_frames_per_second(), infectados.size(), civis.size(), capitulo])
	var foco := cam.foco if not cam.livre else cam.global_position - cam.global_transform.basis.z * 30.0
	audio.cama(audio.cama_horda, infectados_perto(foco, 25.0) / 9.0, -8.0, delta)
	var np := 0
	for c in civis:
		if is_instance_valid(c) and c.estado == "panico" and _d2(c.global_position, foco) < 900.0:
			np += 1
	audio.cama(audio.cama_multidao, np / 10.0, -6.0, delta)
	if jogador and jogador.tem_coracao and jogador.vivo:
		audio.cama(audio.cama_coracao, (jogador.bpm - 100.0) / 60.0, -2.0, delta)
		audio.cama_coracao.pitch_scale = clamp(jogador.bpm / 80.0, 0.9, 2.2)
	else:
		audio.cama(audio.cama_coracao, 0.0, -2.0, delta)
	# luzes de poste: as 10 mais perto da câmera acendem ao anoitecer
	_luz_t -= delta
	if _luz_t <= 0:
		_luz_t = 0.4
		var noite: float = Ambiente.noite
		var ps := cidade.postes.duplicate()
		ps.sort_custom(func(a, b): return _d2(a, foco) < _d2(b, foco))
		for i in _luzes.size():
			if i < ps.size():
				_luzes[i].global_position = ps[i]
				_luzes[i].light_energy = 2.4 * noite
	# buraco de visão dos prédios: posição do personagem na tela
	if jogador and is_instance_valid(jogador) and not cam.is_position_behind(jogador.global_position):
		var vp := get_viewport()
		var esc := Vector2(vp.size) / vp.get_visible_rect().size
		RenderingServer.global_shader_parameter_set("foco_tela", cam.unproject_position(jogador.global_position + Vector3(0, 1.0, 0)) * esc)
		RenderingServer.global_shader_parameter_set("raio_tela", 150.0 * esc.y * clamp(30.0 / max(cam.distancia, 8.0), 0.6, 2.2))
	# paredes da sala do TCC abaixam quando a Hannah está dentro (como no Zomboid)
	for c in cidade.cortes:
		var f: Node3D = Predio.foco
		var dentro: bool = f != null and is_instance_valid(f) and c[1].has_point(Vector2(f.global_position.x, f.global_position.z))
		c[0].scale.y = move_toward(c[0].scale.y, 0.3 if dentro else 1.0, delta * 2.0)
	for r in cidade.refletores:
		r.light_energy = 1.2 + 2.0 * Ambiente.noite

# ======================================================================= ajudantes do roteiro
func esperar(t: float) -> void:
	if auto:
		t = min(t, 0.3)
	var e := 0.0
	while e < t and is_inside_tree():
		await get_tree().process_frame
		if not get_tree().paused:
			e += get_process_delta_time()

func esperar_ate(cond: Callable, limite := 8.0) -> void:
	var e := 0.0
	while not cond.call() and e < limite and is_inside_tree():
		await get_tree().process_frame
		if not get_tree().paused:
			e += get_process_delta_time()

func fala(quem: String, txt: String, dur := -1.0) -> void:
	await hud.say(quem, txt, dur)

func chegar(p: Vector3, r := 3.0) -> void:
	hud.waypoint = p + Vector3(0, 1.0, 0)
	var e := 0.0
	while is_instance_valid(jogador) and _d2(jogador.global_position, p) > r * r and is_inside_tree():
		await get_tree().process_frame
		e += get_process_delta_time()
		if auto and e > 0.5 and not _pego:
			jogador.global_position = Vector3(p.x, Mapa.altura(p.x, p.z), p.z)
	hud.waypoint = null

func usar(p: Vector3, r: float, txt: String, segurar := 0.0) -> void:
	hud.waypoint = p + Vector3(0, 1.0, 0)
	while is_inside_tree():
		await get_tree().process_frame
		if auto:
			jogador.global_position = Vector3(p.x, 0, p.z + 0.4)
			break
		var perto_ := _d2(jogador.global_position, p) < r * r and controle_livre
		hud.show_prompt("[E] " + txt if perto_ else "")
		if perto_ and Input.is_action_just_pressed("interagir"):
			if segurar <= 0.0:
				break
			var h := 0.0
			while Input.is_action_pressed("interagir") and h < segurar:
				await get_tree().process_frame
				h += get_process_delta_time()
				hud.show_prompt("[E] %s  %d%%" % [txt, int(h / segurar * 100)])
			if h >= segurar:
				break
	hud.show_prompt("")
	hud.waypoint = null

func cena() -> void:
	## começo de cena: tira o controle e solta o jogador se estiver agarrado
	controle_livre = false
	if jogador:
		jogador.vel = Vector3.ZERO
		if jogador.agarrado_por != null:
			var z: Node = jogador.agarrado_por
			jogador.agarrado_por = null
			jogador.luta_espera = 2.0
			if is_instance_valid(z):
				z.empurrado((z.global_position - jogador.global_position).normalized() * 9.0, 2.0)

func camera_lenta(fator: float, t: float) -> void:
	## câmera lenta curta nos momentos grandes (como no jogo web, R39)
	if auto:
		return
	Engine.time_scale = fator
	await get_tree().create_timer(t * fator, true, false, true).timeout
	Engine.time_scale = 1.0

func foto(nome: String) -> void:
	if pasta_fotos == "":
		return
	await get_tree().create_timer(1.4, true, false, true).timeout
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	if img:
		img.save_png("%s/%d_%s.png" % [pasta_fotos, capitulo, nome])
		print("[autotest] foto ", nome)

func proximo(n: int) -> void:
	await hud.fade_to(1.0, 1.2)
	capitulo = n
	Engine.time_scale = 2.5 if auto else 1.0
	get_tree().reload_current_scene()

func _quando_pego() -> void:
	if _pego:
		return
	_pego = true
	controle_livre = false
	hud.letterbox(true)
	await esperar(1.4)
	await hud.card("VOCÊ FOI PEGO", "Recomeçando o capítulo...", 1.2)
	await hud.fade_to(1.0, 0.8)
	get_tree().reload_current_scene()

func toggle_pause() -> void:
	if _fim:
		return
	get_tree().paused = not get_tree().paused
	hud.toggle_pause(get_tree().paused)

func on_pause_button(id: String) -> void:
	get_tree().paused = false
	hud.toggle_pause(false)
	Engine.time_scale = 1.0
	match id:
		"restart":
			get_tree().reload_current_scene()
		"skip":
			capitulo = min(capitulo + 1, 3) if capitulo > 0 else 2
			get_tree().reload_current_scene()
		"begin":
			capitulo = 0
			get_tree().reload_current_scene()

func _unhandled_input(e: InputEvent) -> void:
	if _fim and e.is_action_pressed("pular_fala"):
		capitulo = 0
		get_tree().reload_current_scene()

# ======================================================================= abertura
func _abertura_e_cap1() -> void:
	await _abertura()
	capitulo = 1
	_cap1()

func _abertura() -> void:
	controle_livre = false
	hud.fade.color.a = 1.0
	hud.letterbox(true, 0.01)
	await esperar(0.6)
	await hud.card("ESTE É O DIA EM QUE TUDO ACABOU.", "", 2.4)
	# a foto aérea do Theo e o rádio
	hud.photo.texture = load("res://assets/sprites/cidade-aerea.webp")
	hud.photo.visible = true
	hud.photo.pivot_offset = hud.root.size * 0.5
	hud.photo.scale = Vector2.ONE
	var radio := AudioStreamPlayer.new()
	radio.stream = audio.stream("radio", true)
	radio.volume_db = -16
	add_child(radio)
	radio.play()
	var zoom := create_tween()
	zoom.tween_property(hud.photo, "scale", Vector2(1.12, 1.12), 18.0)
	await hud.fade_to(0.0, 2.0)
	foto("abertura_foto")
	await fala("Rádio", "...a Secretaria de Saúde pede calma. O número de idosos internados com febre alta subiu de novo nesta terça...")
	await fala("Rádio", "...nas redes, boatos ligam os casos a um lote de vacina. O ministério nega. Ninguém sabe dizer de onde vem...")
	# a mesma cidade, agora em 3D: voo baixando do céu até a faculdade
	await hud.fade_to(1.0, 0.8)
	zoom.kill()
	hud.photo.visible = false
	cam.livre = true
	cam.transform = cam.pose_de(Vector3(150, 0, -60), -70.0, 26.0, 330.0)
	audio.tocar_musica("musica_final", -14.0, 3.0)
	await hud.fade_to(0.0, 1.6)
	foto("abertura_ceu")
	cam.voar(Vector3(110, 0, -40), -40.0, 34.0, 120.0, 9.0)
	await fala("Rádio", "...no estádio, o jogo começa às seis, com casa cheia...")
	await esperar(1.5)
	radio.stop()
	await hud.card("PROJECT Z", "PRÓLOGO  ·  DIA ZERO", 2.6)
	await cam.voar(hannah.global_position + Vector3(0, 1, 0), -45.0, 40.0, 16.0, 4.0).finished
	audio.parar_musica(2.0)

# ======================================================================= capítulo 1 — Hannah
func _preparar_cap1() -> void:
	amb.aplicar(0.0)
	hannah = novo_sobrevivente("hannah", Vector3(Mapa.SALA_TCC.position.x + 9, 0, Mapa.SALA_TCC.position.y + 5))
	hannah.dir = -PI * 0.5
	controlar(hannah)
	cam.distancia = 16.0
	# colegas e alunos no pátio, falando ao celular
	for p in [Vector3(60, 0, -78), Vector3(63, 0, -77), Vector3(82, 0, -60), Vector3(120, 0, -40), Vector3(124, 0, -41), Vector3(98, 0, -30), Vector3(70, 0, -44)]:
		var s := novo_civil(p, ["civ_estudante", "civ_estudante2", "civ_jovem", "civ_atendente"].pick_random())
		s.anim_fixa = "phone" if randf() < 0.6 else ""
		s.vai_virar = false
		_estudantes.append(s)
	# o trânsito normal da avenida e as calçadas cheias
	for k in 9:
		var z: float = [-8.6, -5.6][k % 2]
		var c := novo_carro(Vector3(randf_range(-240, 340), 0, z), PI, ["hatch", "sedan", "hatch", "kombi"].pick_random())
		c.volta_de = Vector3(350, 0, z)
		c.alvo = Vector3(-250, 0, z)
		c.dirigir([c.alvo], randf_range(9, 13), "voltar")
	for k in 9:
		var z2: float = [5.6, 8.6][k % 2]
		var c2 := novo_carro(Vector3(randf_range(-240, 340), 0, z2), 0, ["hatch", "sedan", "hatch", "kombi"].pick_random())
		c2.volta_de = Vector3(-250, 0, z2)
		c2.alvo = Vector3(350, 0, z2)
		c2.dirigir([c2.alvo], randf_range(9, 13), "voltar")
	var onibus := novo_carro(Vector3(118, 0, 8.6), 0, "onibus")
	onibus.estado = "parado"
	_estacionados()
	for k in 40:
		novo_civil(Vector3(randf_range(-20, 220), 0, (-14.0 if k % 2 == 0 else 14.0) + randf_range(-1.6, 1.6)))
	_torcida_no_estadio()

func _estacionados() -> void:
	var E := Mapa.ESTACIONAMENTO
	var x := E.position.x + 3.4
	while x < E.end.x - 2:
		if randf() < 0.7:
			novo_carro(Vector3(x, 0, E.position.y + 2.6), PI * 0.5, ["hatch", "sedan", "hatch"].pick_random())
		if randf() < 0.6:
			novo_carro(Vector3(x, 0, E.end.y - 2.6), -PI * 0.5, ["hatch", "sedan", "kombi"].pick_random())
		x += 2.8
	for p in [Vector3(-90, 0, -40), Vector3(-80, 0, -40)]:
		novo_carro(p, PI * 0.5, "ambulancia")
	var x2 := -240.0
	while x2 < 340:   # carros parados junto à calçada das ruas
		if randf() < 0.3 and not cidade._no_cruzamento(x2):
			novo_carro(Vector3(x2, 0, 99.0), 0, ["hatch", "sedan", "kombi"].pick_random())
		x2 += 9.0

func colunas_de_fumaca(n: int) -> void:
	## a cidade queimando ao longe: colunas de fumaça escura com fogo na base, fora do mapa
	var rng := RandomNumberGenerator.new()
	rng.seed = 99 + n
	for k in n:
		var a := rng.randf() * TAU
		var p := Vector3(140, 0, -60) + Vector3(cos(a) * rng.randf_range(300, 420), 0, sin(a) * rng.randf_range(260, 380))
		var raiz := Node3D.new()
		raiz.position = p
		efeitos.add_child(raiz)
		var col_ := FX.fumaca(raiz, Vector3(0, 4, 0), rng.randf_range(5.0, 8.0), true)
		col_.lifetime = 16.0
		col_.gravity = Vector3(2.0, 2.2, 0.6)
		FX.luz(raiz, Vector3(0, 6, 0), Color(1.0, 0.45, 0.15), 6.0, 60.0)

func _torcida_no_estadio() -> void:
	var som := Node3D.new()
	som.position = Vector3(Mapa.ESTADIO_C.x, 8, Mapa.ESTADIO_C.y)
	add_child(som)
	audio.loop_em("estadio", som, 2.0, 200.0)

func _cap1() -> void:
	controle_livre = false
	cam.seguir(hannah, 16.0)
	if capitulo == 1 and hud.fade.color.a > 0.5:
		hud.fade_to(0.0, 1.0)
	hud.letterbox(false)
	await hud.card("FACULDADE INTEGRADA DO PARI  ·  17:40", "Hannah, 21 anos  ·  dia da apresentação do TCC")
	await fala("Hannah", "Banca marcada pras cinco. Já são quase seis.")
	await fala("Hannah", "Nem professor, nem grupo. Vou apresentar o TCC pras cadeiras.")
	await fala("Hannah", "E o celular morreu. Claro que morreu.")
	controle_livre = true
	hud.set_hint("WASD / setas: andar\nE: interagir\nEsc: pausa")
	hud.objective("Carregue o celular na tomada da parede")
	await usar(Mapa.TOMADA + Vector3(1.0, 0, 0), 1.8, "Carregar o celular")
	cena()
	hannah.anim_fixa = "look"
	audio.som("celular", null, -2.0)
	await esperar(0.7)
	audio.som("celular", null, -2.0)
	hud.show_phone([["Hadassa · 14 chamadas perdidas", true], ["Hadassa: Hannah atende", false],
		["Hadassa: tá um caos aqui no hospital", false], ["Hadassa: fica onde você tá. eu vou te buscar", false]])
	cam.voar(hannah.global_position + Vector3(0, 1.2, 0), -60.0, 30.0, 7.0, 2.0)
	foto("celular")
	await fala("Hannah", "Quatorze chamadas? A Hadassa nunca liga quatorze vezes.")
	if _estudantes.size() >= 2:
		_estudantes[0].dizer("Minha vó passou mal... tô indo pro hospital!", 4)
		_estudantes[0].ir(Vector3(100, 0, -24), 4.0)
		_estudantes[1].dizer("Meu pai também. Levaram ele agora!", 4)
		_estudantes[1].ir(Vector3(102, 0, -26), 3.6)
	await esperar(2.0)
	hud.hide_phone()
	hannah.anim_fixa = ""
	# a batida lá fora
	_primeira_batida()
	await esperar(0.6)
	await fala("Hannah", "Que barulho foi esse?!")
	cam.voltar(hannah, 26.0)
	controle_livre = true
	hud.objective("Saia da sala e vá até o portão da faculdade")
	await chegar(Vector3(100, 0, -23), 3.0)
	# a cidade vira um caos
	cena()
	hud.letterbox(true)
	_caos_cap1()
	colunas_de_fumaca(3)
	amb.passar(0.15, 20.0)
	await cam.voar(Vector3(104, 0, 2), -20.0, 24.0, 46.0, 3.0).finished
	foto("caos")
	await fala("Alguém", "Ele mordeu ela! Ele MORDEU ela!")
	var heli := Aeronave.new()
	add_child(heli)
	heli.montar(self, "heli", [Vector3(-80, 38, -40), Vector3(110, 32, 0), Vector3(380, 40, 30)], 26.0)
	await fala("Hannah", "...Gente?")
	await fala("Hannah", "Hadassa. Hospital. Agora.")
	hud.letterbox(false)
	cam.voltar(hannah, 30.0)
	controle_livre = true
	audio.tocar_musica("musica_fuga", -12.0)
	hud.objective("Corra para o Hospital São Crispim: siga pela Av. dos Tecelões para o oeste")
	hud.set_hint("Shift: correr\nEspaço: pular carros e barreiras\nE: se soltar se te agarrarem")
	await chegar(Vector3(70, 0, -14), 4.0)
	_emboscada()
	await chegar(Vector3(14, 0, -14), 4.0)
	cena()
	cam.voar(hannah.global_position + Vector3(0, 1, 0), -100.0, 22.0, 18.0, 2.5)
	await fala("Hannah", "Aguenta, Hadassa. Tô chegando.")
	# o pronto-socorro (dá para entrar: o prédio some e aparece o saguão, como no Zomboid)
	var cida := _preparar_ps()
	cam.voltar(hannah, 26.0)
	controle_livre = true
	hud.objective("Entre no pronto-socorro do São Crispim e procure a Hadassa")
	await chegar(Mapa.HOSP_PS + Vector3(0, 0, -8.5), 3.0)
	cena()
	hud.letterbox(true)
	await cam.voar(Vector3(-72, 0, -57), -40.0, 42.0, 26.0, 2.0).finished
	foto("pronto_socorro")
	await fala("Hannah", "HADASSA! Alguém viu a enfermeira Hadassa?!")
	await fala("Enfermeiro", "A Hadassa? Saiu faz meia hora! Foi atrás da irmã, lá na faculdade!")
	await fala("Hannah", "Na faculdade... Ela foi me buscar. E eu vim pra cá.")
	# a idosa da maca convulsiona e levanta: a cadeia do contágio começa dentro do PS
	cida.vai_virar = true
	cida.virar_em = Civil.TEMPO_CONVULSAO
	cida.estado = "virando"
	cida.tocar("death", true)
	await fala("Enfermeiro", "Dona Cida? Dona Cida, fica deitada... DONA CIDA!", 3.0)
	await esperar_ate(func(): return viraram >= 1, 5.0)
	foto("ps_contagio")
	await esperar(2.2)
	await fala("Hannah", "Não. Não, não, não. Eu preciso sair daqui!", 2.4)
	hud.letterbox(false)
	cam.voltar(hannah, 22.0)
	controle_livre = true
	hud.objective("Saia do hospital!")
	await chegar(Vector3(-70, 0, -36), 3.0)
	cena()
	await fala("Hannah", "Hadassa, onde você tá?!", 2.0)
	proximo(2)

func _preparar_ps() -> Civil:
	## pacientes esperando, o enfermeiro na recepção e a Dona Cida na maca (a primeira a virar)
	var enf := novo_civil(Vector3(-70, 0, -60.2), "civ_enfermeiro")
	enf.dir = PI * 0.5
	for zr in [-60.25, -56.75, -53.25]:
		for k in 4:
			var p := Vector3(randf_range(-60, -36), 0, zr)
			var c := novo_civil(p, ["civ_idoso", "civ_idosa", "civ_idosa", "civ_executivo", "civ_atendente", "civ_jovem"].pick_random())
			c.anim_fixa = ["cower", "phone", "idle", "cower"].pick_random()
			c.dir = -PI * 0.5
	for p2 in [Vector3(-100, 0, -61), Vector3(-90, 0, -61.5), Vector3(-84, 0, -54)]:
		var c2 := novo_civil(p2, "civ_idoso")
		c2.anim_fixa = "cower"
	var cida := novo_civil(Vector3(-80, 0, -53.6), "civ_idosa")
	cida.vai_virar = false
	cida.estado = "caido"
	cida.tocar("death", true)
	return cida

func _primeira_batida() -> void:
	var c := novo_carro(Vector3(240, 0, 5.6), PI, "sedan", "1f4e79")
	c.dirigir([Vector3(124, 0, 8.0)], 26.0)
	c.fogo_em = 1.2
	c.explode_em = 7.0
	audio.som("grito", Vector3(120, 0, 10), 0.0)

func _caos_cap1() -> void:
	fuga = Vector3.INF
	for p in [Vector3(130, 0, 4), Vector3(150, 0, 9), Vector3(96, 0, 14), Vector3(170, 0, -6), Vector3(80, 0, 6), Vector3(140, 0, 16), Vector3(186, 0, 12), Vector3(60, 0, -12)]:
		novo_infectado(p, "comum")
	for k in 26:
		novo_civil(Vector3(randf_range(40, 200), 0, randf_range(-14, 16)), "", false)
	for c in civis:
		if c not in _estudantes:
			c.panico()
	# o trânsito para: batidas em sequência
	var k2 := 0
	for car in carros:
		if car.estado == "andando":
			var frente: Vector3 = car.global_position + car.global_transform.basis.x * randf_range(10, 40)
			frente.x = clamp(frente.x, -240, 340)
			car.dirigir([frente], car.vel)
			car.fogo_em = randf_range(1.5, 6.0) if k2 % 2 == 0 else -1.0
			car.explode_em = randf_range(5.0, 12.0) if k2 % 3 == 0 else -1.0
			k2 += 1
	var pol := novo_carro(Vector3(-60, 0, 8.6), 0, "viatura")
	pol.sirene(true)
	pol.dirigir([Vector3(90, 0, 9.0)], 20.0)
	pol.fogo_em = -1.0

func _emboscada() -> void:
	var c := novo_carro(Vector3(-60, 0, -8.6), 0, "hatch", "d4a017")
	c.dirigir([Vector3(30, 0, -8.6), Vector3(48, 0, -13.5)], 24.0)
	c.fogo_em = 2.0
	c.explode_em = 9.0
	var z := novo_infectado(Vector3(42, 0, -15.5), "comum", "executivo")
	z.visao = 20.0

# ======================================================================= capítulo 2 — Antônio
func _preparar_cap2() -> void:
	amb.aplicar(0.3)
	antonio = novo_sobrevivente("antonio", Vector3(116, 0, 53))
	antonio.dir = -PI * 0.5
	controlar(antonio)
	var radio := Node3D.new()
	radio.position = Mapa.MESA_CAMERAS + Vector3(0, 1, 0)
	add_child(radio)
	audio.loop_em("radio", radio, -10.0, 20.0)
	for p in [Vector3(124, 0, 8), Vector3(90, 0, -8), Vector3(170, 0, 6), Vector3(40, 0, -5), Vector3(150, 0, -8)]:
		destroco(p, randf_range(-0.4, 0.4) + (0.0 if p.z > 0 else PI), true)
	destroco(Vector3(118, 0, 8.6), 0.1, true, "onibus")
	for k in 12:
		novo_infectado(Vector3(randf_range(20, 220), 0, randf_range(-14, 14)))
	for k in 22:
		novo_civil(Vector3(randf_range(20, 220), 0, randf_range(-14, 16)), "", false)
	_estacionados()
	colunas_de_fumaca(6)
	for p in [Vector3(94, 0, 37.5), Vector3(100, 0, 37.0)]:
		var f := novo_civil(p, "civ_funcionaria")
		f.vai_virar = false
		f.dir = -PI * 0.5
		_funcionarias.append(f)
	# clientes no estacionamento e na calçada do mercado (a cadeia do contágio passa por eles)
	for p in [Vector3(80, 0, 30), Vector3(86, 0, 34), Vector3(104, 0, 33), Vector3(112, 0, 28), Vector3(92, 0, 27), Vector3(118, 0, 34), Vector3(76, 0, 24), Vector3(99, 0, 21)]:
		var cl := novo_civil(p, ["civ_idosa", "civ_idoso", "civ_atendente", "civ_executivo", "civ_jovem", "civ_estudante"].pick_random())
		cl.anim_fixa = "phone" if randf() < 0.4 else ""
	_torcida_no_estadio()

func _cap2() -> void:
	controle_livre = false
	# abre na fachada: a faixa vermelha, o hortifrúti, as funcionárias na porta
	Predio.foco = null
	cam.livre = true
	cam.transform = cam.pose_de(Vector3(98, 3, 40), 172.0, 14.0, 30.0)
	hud.fade_to(0.0, 1.0)
	cam.voar(Vector3(98, -1.5, 38), 150.0, 20.0, 30.0, 4.5)
	await esperar(1.2)
	foto("mercado_fachada")
	await hud.card("MERCADO DO ANTÔNIO  ·  17:52", "Antônio, 27 anos  ·  ex-sargento bombeiro")
	Predio.foco = antonio
	await cam.voltar(antonio, 16.0)
	await fala("Antônio", "Arroz, feijão, óleo... quem compra tanto óleo numa terça?")
	await fala("Rádio", "...hospitais da Zona Leste operam com lotação máxima. A orientação é evitar...")
	await fala("Antônio", "Lotação máxima. E eu aqui contando lata de óleo.")
	audio.grito(Vector3(96, 0, 37), true)
	await fala("Antônio", "...Que gritaria é essa lá na frente?")
	controle_livre = true
	hud.set_hint("WASD / setas: andar\nE: interagir\nEsc: pausa")
	hud.objective("Olhe as câmeras de segurança")
	await usar(Mapa.MESA_CAMERAS + Vector3(0, 0, 0.6), 2.0, "Ver as câmeras")
	cena()
	# câmera de segurança: o ataque às funcionárias
	Predio.foco = null
	hud.letterbox(true, 0.01)
	hud.cctv.visible = true
	cam.livre = true
	cam.fov = 64.0
	cam.transform = cam.pose_de(Vector3(97, 0, 25), 0.0, 40.0, 19.0)
	# só dois infectados entram no estacionamento. Cada um morde o mais perto e já vai atrás do
	# próximo; quem foi mordido levanta infectado em 15 segundos. Antônio assiste a cadeia toda.
	var z1 := novo_infectado(Vector3(84, 0, 22), "comum", "paciente")
	var z2 := novo_infectado(Vector3(110, 0, 23), "comum", "operario")
	for z in [z1, z2]:
		z.visao = 22.0
		z.rapidez = 1.9
	for f in _funcionarias:
		f.vai_virar = true
	var t0 := Time.get_ticks_msec()
	_funcionarias[0].dizer("Moço? O senhor tá bem?", 3)
	await esperar(1.0)
	foto("cctv")
	await esperar_ate(func(): return mordidos >= 1, 10)
	await fala("Antônio", "Não... não, não, não...")
	await esperar_ate(func(): return mordidos >= 3, 8)
	antonio.bpm = 172
	await fala("Antônio", "Levantou... tá fugindo, sangrando.", 2.6)
	await fala("Antônio", "E ele já largou ela e foi pro outro. Não para. Não come ninguém. Só morde.", 3.2)
	foto("cctv_cadeia")
	hud.cctv.visible = false
	cam.fov = 30.0
	cam.seguir(antonio, 12.0)
	Predio.foco = antonio
	await fala("Antônio", "Respira, Antônio. Igual no quartel. Quatro segundos.")
	await fala("Antônio", "Puxa... segura... solta.", 2.6)
	# de volta à câmera: as mordidas viram infectados
	Predio.foco = null
	hud.cctv.visible = true
	cam.livre = true
	cam.fov = 64.0
	cam.transform = cam.pose_de(Vector3(97, 0, 25), 0.0, 40.0, 19.0)
	await esperar_ate(func(): return viraram >= 1, 16.0)
	foto("cctv_virou")
	var seg := (Time.get_ticks_msec() - t0) / 1000.0
	await fala("Antônio", "Quinze segundos. Contei. Mordeu, quinze segundos, levanta." if seg > 10.0 else "Ela... levantou?", 3.0)
	await esperar_ate(func(): return viraram >= 3, 8.0)
	await fala("Antônio", "Dois viram quatro. Quatro viram oito. Essa conta não fecha...", 3.0)
	await esperar(1.6)
	hud.cctv.visible = false
	hud.letterbox(false, 0.3)
	cam.fov = 30.0
	cam.seguir(antonio, 16.0)
	Predio.foco = antonio
	await fala("Antônio", "O portão. O PORTÃO!")
	controle_livre = true
	hud.objective("Baixe a porta de aço da frente")
	await usar(Vector3((Mapa.MERCADO_PORTAO.x + Mapa.MERCADO_PORTAO.y) * 0.5, 0, Mapa.MERCADO.position.y + 1.6), 2.2, "Baixar a porta de aço (segure)", 1.0)
	audio.som("portao", Vector3(98, 2, 40), 4.0)
	create_tween().tween_property(cidade.portao_mercado, "scale:y", 1.0, 1.3)
	col.ret(Rect2(Mapa.MERCADO_PORTAO.x, Mapa.MERCADO.position.y - 0.2, Mapa.MERCADO_PORTAO.y - Mapa.MERCADO_PORTAO.x, 0.4))
	await fala("Antônio", "Pronto. Pronto. Ninguém entra, ninguém sai.")
	hud.objective("Suba no telhado pela escada do depósito")
	await usar(Mapa.ESCADA + Vector3(0, 0, 1.0), 2.0, "Subir no telhado")
	await _telhado()
	await _salvar_hadassa()
	proximo(3)

func _telhado() -> void:
	cena()
	hud.letterbox(true)
	await hud.fade_to(1.0, 0.5)
	var h := 3 * Predio.ANDAR + 0.05
	antonio.global_position = Vector3(98, h, 42)
	antonio.set_meta("no_telhado", true)
	antonio.dir = -PI * 0.5
	Predio.foco = null
	cam.livre = true
	cam.transform = cam.pose_de(Vector3(97, h + 1.0, 38), 8.0, 14.0, 15.0)
	amb.passar(0.42, 12.0)
	await hud.fade_to(0.0, 0.7)
	foto("telhado")
	await esperar(0.8)
	cam.voar(Vector3(90, 0, 0), -30.0, 26.0, 70.0, 4.0)
	var ex: Array = carros.filter(func(c): return is_instance_valid(c) and c.estado == "pegando_fogo")
	if not ex.is_empty():
		ex.pick_random().explodir()
		camera_lenta(0.35, 1.6)
	await fala("Antônio", "Meu Deus... a cidade inteira.")
	# ele vê a Hannah passando (ela segue para o hospital, como no capítulo 1)
	var hn := novo_sobrevivente("hannah", Vector3(60, 0, -14))
	hn.ir(Vector3(-30, 0, -14), 5.2)
	await esperar(1.2)
	await fala("Antônio", "Aquela ali... é a irmã da Hadassa? Correndo pro lado do hospital...")
	# e então a Hadassa, que vem do hospital procurando a irmã
	hadassa = novo_sobrevivente("hadassa", Vector3(-20, 0, 16))
	hadassa.invencivel = true
	hadassa.ir(Vector3(4, 0, 18), 5.0)
	var grupo: Array = []
	for k in 6:
		var g := novo_infectado(Vector3(72 + k * 2.4, 0, 100 + (k % 2) * 1.8))
		g.visao = 0.0
		grupo.append(g)
	cam.voar(Vector3(40, 0, 60), -30.0, 30.0, 90.0, 3.0)
	await fala("Antônio", "...Hadassa?")
	await esperar_ate(func(): return hadassa.alvo_cena == null, 6)
	hadassa.ir(Vector3(4, 0, 100), 5.0)
	var corredor := novo_infectado(Vector3(-24, 0, 18), "corredor")
	corredor.ir(Vector3(4, 0, 96), 4.6)
	await fala("Antônio", "Não, não, não! Por aí não!")
	await esperar_ate(func(): return hadassa.alvo_cena == null, 7)
	hadassa.ir(Vector3(62, 0, 101), 4.6)
	await esperar(1.6)
	if is_instance_valid(hn):
		sobreviventes.erase(hn)
		hn.queue_free()
	await hud.fade_to(1.0, 0.5)
	# de volta lá embaixo, perto da porta dos fundos
	antonio.global_position = Mapa.EXTINTOR + Vector3(2.5, 0, -1.0)
	antonio.set_meta("no_telhado", false)
	Predio.foco = antonio
	cam.seguir(antonio, 22.0)
	hadassa.alvo_cena = null
	hadassa.global_position = Vector3(64, 0, 101)
	corredor.alvo_cena = null
	corredor.global_position = Vector3(58, 0, 101.5)
	corredor.visao = 60.0
	for g in grupo:
		g.visao = 18.0
		g.rapidez = 0.9
	_corredor = corredor
	await hud.fade_to(0.0, 0.5)
	hud.letterbox(false)

func _salvar_hadassa() -> void:
	controle_livre = true
	hud.objective("Pegue o extintor perto da porta dos fundos")
	await usar(Mapa.EXTINTOR, 1.8, "Pegar o extintor")
	antonio.trocar_para_extintor()
	audio.som("pancada", antonio.global_position, -4.0)
	await fala("Antônio", "Extintor. Quinze anos de bombeiro pra chegar nisso.")
	hud.objective("Salve a Hadassa!  (F ou clique para golpear)")
	hud.set_hint("F / clique: golpear\nShift: correr\nE: se soltar")
	audio.tocar_musica("musica_fuga", -11.0)
	var gritou := false
	var e := 0.0
	while is_instance_valid(_corredor) and _corredor.vivo and is_inside_tree():
		await get_tree().process_frame
		e += get_process_delta_time()
		hud.waypoint = _corredor.global_position + Vector3(0, 2.2, 0)
		if not gritou and _d2(antonio.global_position, hadassa.global_position) < 22.0 * 22.0:
			gritou = true
			fala("Antônio", "HADASSA! CORRE!", 1.6)
		if auto and e > 1.0:
			_corredor.morrer()
	hud.waypoint = null
	cena()
	for z in infectados:
		if is_instance_valid(z) and z.vivo and _d2(z.global_position, antonio.global_position) < 900.0:
			z.empurrado((z.global_position - antonio.global_position).normalized() * 6.0, 3.0)
			z.visao = 0.0
	hud.letterbox(true)
	hadassa.olhar(antonio.global_position)
	hadassa.ir(antonio.global_position + (hadassa.global_position - antonio.global_position).normalized() * 1.6, 2.4)
	cam.voar((antonio.global_position + hadassa.global_position) * 0.5 + Vector3(0, 1, 0), -80.0, 24.0, 12.0, 2.0)
	foto("resgate")
	await fala("Hadassa", "Antônio?!")
	await fala("Antônio", "Eu... eu nem sei o que eu fiz.")
	await fala("Hadassa", "A Hannah! Eu não acho a minha irmã. Ela não atende!")
	await fala("Antônio", "Eu vi ela! Lá de cima. Correndo pro lado do hospital!")
	await fala("Hadassa", "Então é pra lá que a gente vai.")

# ======================================================================= capítulo 3 — a fuga para o morro
func _preparar_cap3() -> void:
	amb.aplicar(0.5)
	antonio = novo_sobrevivente("antonio", Vector3(64, 0, 101), true)
	controlar(antonio)
	antonio.dir = PI
	hadassa = novo_sobrevivente("hadassa", Vector3(66, 0, 102.5))
	hadassa.invencivel = true
	hadassa.seguir = antonio
	for p in [Vector3(124, 0, 8), Vector3(90, 0, -8), Vector3(170, 0, 6), Vector3(40, 0, -5), Vector3(150, 0, -8), Vector3(230, 0, 6), Vector3(-30, 0, -8)]:
		destroco(p, randf_range(-0.4, 0.4) + (0.0 if p.z > 0 else PI), randf() < 0.75)
	destroco(Vector3(118, 0, 8.6), 0.1, true, "onibus")
	for k in 22:
		novo_infectado(Vector3(randf_range(-20, 240), 0, randf_range(-14, 14)))
	for k in 6:
		novo_infectado(Vector3(randf_range(90, 180), 0, randf_range(98, 104)))
	for k in 18:
		novo_civil(Vector3(randf_range(-20, 240), 0, randf_range(-14, 16)), "", false)
	colunas_de_fumaca(10)
	_torcida_no_estadio()

func _cap3() -> void:
	controle_livre = false
	cam.seguir(antonio, 30.0)
	hud.fade_to(0.0, 1.0)
	await hud.card("AV. DOS TECELÕES  ·  18:10", "Antônio e Hadassa")
	controle_livre = true
	audio.tocar_musica("musica_fuga", -10.0)
	hud.set_hint("Shift: correr  ·  Espaço: pular\nF / clique: golpear  ·  E: se soltar")
	hud.objective("Vá para o hospital (oeste, depois a rua do hospital)")
	amb.passar(0.72, 60.0)
	await chegar(Vector3(0, 0, 40), 6.0)
	# engavetamento e a horda vindo do hospital
	cena()
	hud.letterbox(true)
	cam.voar(Vector3(0, 0, 8), -10.0, 20.0, 42.0, 1.8)
	var bus := novo_carro(Vector3(-120, 0, 5.6), 0, "onibus")
	bus.dirigir([Vector3(-6, 0, 4.0)], 30.0)
	bus.fogo_em = 0.2
	bus.explode_em = 1.2
	for p in [Vector3(-2, 0, 16.5), Vector3(3.5, 0, 17.5)]:
		var v := novo_carro(p, randf_range(-0.4, 0.4) + PI * 0.5, "viatura")
		v.estado = "batido"
		v.sirene(p.x < 0)
	col.ret(Rect2(-5.5, 15.5, 11, 2.0))
	var parede_fogo := Node3D.new()
	add_child(parede_fogo)
	for fx_ in [-4.0, 0.0, 4.0]:
		FX.fogo(parede_fogo, Vector3(fx_, 0.2, 19.0), 1.2)
	var horda: Array = []
	for k in 26:
		horda.append(novo_infectado(Vector3(randf_range(-30, 30), 0, randf_range(-40, -14))))
	await esperar(1.6)
	camera_lenta(0.3, 1.4)
	foto("engavetamento")
	await fala("Hadassa", "Por aqui não dá!")
	await fala("Antônio", "O Morro do Cruzeiro! Tem uma trilha atrás da Arena!")
	for z in horda:
		z.horda = true
		z.rapidez *= 1.25
	hud.letterbox(false)
	cam.voltar(antonio, 30.0)
	controle_livre = true
	hud.objective("Fuja para o Morro do Cruzeiro: a trilha fica atrás da Arena Fúria")
	await chegar(Vector3(196, 0, 101), 7.0)
	_perseguidores(6)
	await chegar(Vector3(200, 0, -18), 7.0)
	_saida_do_estadio()
	var heli := Aeronave.new()
	add_child(heli)
	heli.montar(self, "heli", [Vector3(120, 34, -60), Vector3(205, 26, -40), Vector3(320, 34, 60), Vector3(500, 40, 160)], 18.0)
	heli.alvo_luz = antonio.global_position
	fala("Hadassa", "Ei! AQUI! AQUI EMBAIXO!", 2.2)
	_perseguidores(5, true)
	await chegar(Vector3(200, 0, -110), 7.0)
	if is_instance_valid(heli):
		heli.alvo_luz = null
	fala("Antônio", "Eles não vão parar... CORRE!", 1.8)
	await chegar(Vector3(212, 0, -158), 5.0)
	var jato := Aeronave.new()
	add_child(jato)
	jato.montar(self, "jato", [Vector3(-320, 70, -260), Vector3(120, 55, -120), Vector3(560, 70, 40)], 120.0)
	_bombas_longe(5)
	await chegar(Vector3(236, 0, -200), 4.0)
	fala("Hadassa", "Não para! Não para agora!", 2.0)
	await chegar(Vector3(258, 0, -240), 4.0)
	await chegar(Vector3(Mapa.TOPO.x, 0, Mapa.TOPO.y), 8.0)
	await _final()

func _perseguidores(n: int, com_corredor := false) -> void:
	var tras := -Vector3(cos(jogador.dir), 0, sin(jogador.dir))
	for k in n:
		var p := jogador.global_position + tras * randf_range(28, 36) + tras.cross(Vector3.UP) * randf_range(-10, 10)
		if col.bloqueado(Vector2(p.x, p.z), 0.4):
			continue
		var z := novo_infectado(p, "corredor" if com_corredor and k == 0 else "comum")
		z.horda = true
		z.rapidez *= 1.35 if z.tipo == "comum" else 0.9

func _saida_do_estadio() -> void:
	## a multidão sai do estádio pelos portões do oeste, com infectados no meio (Guerra Mundial Z)
	fuga = Vector3(120, 0, 30)
	for k in 46:
		var p := Vector3(Mapa.ESTADIO_C.x - Mapa.ESTADIO_R.x - 2 - randf_range(0, 6), 0, Mapa.ESTADIO_C.y + randf_range(-30, 30))
		var c := novo_civil(p, ["civ_torcedor", "civ_torcedora", "civ_torcedor", "civ_jovem", "civ_policial"].pick_random(), false)
		c.empurrado(Vector3(-randf_range(4, 8), 0, randf_range(-1, 1)), 0.2)
	for k in 7:
		novo_infectado(Vector3(Mapa.ESTADIO_C.x - Mapa.ESTADIO_R.x - 3, 0, Mapa.ESTADIO_C.y + randf_range(-25, 25)))
	audio.grito(Vector3(215, 0, -80), true)
	audio.som("multidao", Vector3(215, 0, -80), 8.0)

func _bombas_longe(n: int) -> void:
	for k in n:
		get_tree().create_timer(1.0 + k * 1.4, false).timeout.connect(func():
			var p := Vector3(randf_range(-240, 60), 0, randf_range(-320, -170))
			p.y = Mapa.altura(p.x, p.z)
			FX.explosao(efeitos, p, 3.2)
			FX.fogo(efeitos, p, 2.5)
			audio.som("explosao", p, 16.0, 0.2))

func _final() -> void:
	cena()
	hud.objective("")
	hud.set_hint("")
	hud.letterbox(true)
	for z in infectados:
		if is_instance_valid(z) and z.vivo:
			z.horda = false
			z.visao = 0.0
			z.alvo = null
			if Mapa.no_morro(z.chao2()):
				z.ir(Vector3(210, 0, -150), 1.0)
	antonio.ir(Vector3(Mapa.TOPO.x - 3, 0, Mapa.TOPO.y + 7), 1.6)
	hadassa.seguir = null
	hadassa.ir(Vector3(Mapa.TOPO.x - 1, 0, Mapa.TOPO.y + 8), 1.6)
	audio.tocar_musica("musica_final", -8.0, 3.0)
	amb.passar(1.0, 10.0)
	var ytopo := Mapa.altura(Mapa.TOPO.x, Mapa.TOPO.y)
	cam.voar(Vector3(Mapa.TOPO.x, ytopo + 1, Mapa.TOPO.y + 8), -170.0, 14.0, 12.0, 3.0)
	await esperar(3.5)
	# a cidade queimando lá embaixo
	var acesos := 0
	while acesos < 22:
		var p := Vector3(randf_range(-200, 330), 0.2, randf_range(-140, 140))
		if Mapa.na_rua(Vector2(p.x, p.z)):
			FX.fogo(efeitos, p, randf_range(2.2, 3.6))
			acesos += 1
	for pr in cidade.predios.slice(0, 40):
		if randf() < 0.3 and is_instance_valid(pr):
			pr.mat.set_shader_parameter("queimado", 0.6)
			FX.fogo(efeitos, Vector3(pr.ret.get_center().x, pr.andares * 3.0, pr.ret.get_center().y), 2.6)
	amb.neblina = 0.5
	_bombas_longe(8)
	var heli2 := Aeronave.new()
	add_child(heli2)
	heli2.montar(self, "heli", [Vector3(-200, 40, 120), Vector3(100, 36, 0), Vector3(420, 40, -60)], 22.0)
	await fala("Hadassa", "A Hannah tá lá embaixo, Antônio.")
	cam.voar(Vector3(120, 0, -20), -175.0, 18.0, 260.0, 9.0)
	await fala("Antônio", "Eu sei.")
	await fala("Antônio", "A gente vai achar ela. Eu prometo.")
	await fala("Hadassa", "...Vou cobrar.")
	await esperar(3.0)
	foto("final")
	hud.show_end([["PROJECT Z", 104, true, Color("e8b10d")], ["PRÓLOGO  ·  DIA ZERO", 28, false],
		[" ", 14, false], ["Hannah — sozinha, a caminho do hospital.", 23, false],
		["San — ninguém sabe onde ele está.", 23, false], [" ", 14, false], ["CONTINUA...", 44, true],
		[" ", 20, false], ["Enter: jogar de novo", 18, false, Color("9a958a")]])
	_fim = true
	if auto:
		await esperar(0.5)
		foto("fim")
		await get_tree().create_timer(2.0, true, false, true).timeout
		print("[autotest] OK — prólogo completo")
		get_tree().quit(0)

# ======================================================================= teste de rotas
func _checar_rotas() -> void:
	var rotas := {
		"cap1": [Vector3(33, 0, -95), Mapa.TOMADA + Vector3(1.0, 0, 0), Vector3(100, 0, -23), Vector3(70, 0, -14), Vector3(14, 0, -14),
			Mapa.HOSP_PS + Vector3(0, 0, -8.5), Vector3(-70, 0, -36)],
		"cap2": [Vector3(116, 0, 53), Mapa.MESA_CAMERAS + Vector3(0, 0, 0.6), Vector3(98, 0, 41.6), Mapa.ESCADA + Vector3(0, 0, 1.0), Mapa.EXTINTOR, Vector3(64, 0, 101)],
		"cap3": [Vector3(64, 0, 101), Vector3(0, 0, 40), Vector3(196, 0, 101), Vector3(200, 0, -18), Vector3(200, 0, -110), Vector3(212, 0, -158),
			Vector3(236, 0, -200), Vector3(258, 0, -240), Vector3(Mapa.TOPO.x, 0, Mapa.TOPO.y)],
	}
	var ok := true
	for nome in rotas:
		var pts: Array = rotas[nome]
		for i in pts.size() - 1:
			var bom := _andavel(Vector2(pts[i].x, pts[i].z), Vector2(pts[i + 1].x, pts[i + 1].z))
			print("[rotas] %s  %s -> %s : %s" % [nome, pts[i], pts[i + 1], "OK" if bom else "BLOQUEADO"])
			ok = ok and bom
	print("[rotas] ", "TUDO OK" if ok else "HÁ ROTAS BLOQUEADAS")
	get_tree().quit(0 if ok else 1)

func _andavel(a: Vector2, b: Vector2) -> bool:
	var passo := 0.5
	var caixa := Rect2(a, Vector2.ZERO).expand(b).grow(60.0)
	var ini := Vector2i(roundi(a.x / passo), roundi(a.y / passo))
	var fim := Vector2i(roundi(b.x / passo), roundi(b.y / passo))
	var visto := {ini: true}
	var fila: Array[Vector2i] = [ini]
	var i := 0
	while i < fila.size():
		var c: Vector2i = fila[i]
		i += 1
		if (c - fim).length_squared() <= 16:
			return true
		for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
			var n: Vector2i = c + d
			if visto.has(n):
				continue
			visto[n] = true
			var w := Vector2(n) * passo
			if caixa.has_point(w) and not col.bloqueado(w, 0.32):
				fila.append(n)
	return false
