extends Pessoa
class_name Civil
## Morador da Zona Leste: anda calmo, entra em pânico (corre com os braços para cima, se encolhe),
## pode ser mordido, cai e levanta infectado.

const TIPOS := ["civ_executivo", "civ_atendente", "civ_estudante", "civ_estudante2", "civ_idoso", "civ_idosa", "civ_pedreiro",
	"civ_motoboy", "civ_torcedor", "civ_torcedora", "civ_enfermeiro", "civ_jovem", "civ_policial"]

var estado := "calmo"        # calmo, panico, encolhido, caido, ferido, virando, morto
## CONTÁGIO (regra do Theo): quem é mordido ou agarrado vira infectado em 15 segundos.
## Cai com a mordida, levanta e continua fugindo machucado (espalha o surto pela cidade),
## nos últimos segundos desaba tremendo e levanta infectado.
const TEMPO_VIRAR := 15.0
const TEMPO_CONVULSAO := 3.2
var pensa := 0.0
var destino := Vector3.ZERO
var virar_em := 0.0
var vai_virar := true
var idoso := false
var rapidez := 4.2
var fala: Label3D
var fala_t := 0.0
var anim_fixa := ""
var modelo: Zumbi3D = null
var quem3d := ""                 # personagem do Mixamo deste civil ("" = desenho do laboratório)
var _lod_t := 0.0
## civis que já têm personagem humano do Mixamo (o resto continua desenho até chegarem mais personagens)
const CIVIS_3D := {"civ_policial": "swat", "civ_jovem": "ch18", "civ_motoboy": "ch18"}

func montar(c: Node, tipo := "", calmo := true) -> Civil:
	cena = c
	var t: String = tipo if tipo != "" else TIPOS.pick_random()
	if CIVIS_3D.has(t) and Infectado.USAR_3D:
		variante = t
		quem3d = CIVIS_3D[t]
		modelo = Zumbi3D.new()
		add_child(modelo)
		modelo.montar(-1, 0.98, quem3d, "h_idle")
		sombra = MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(0.9, 0.7)
		sombra.mesh = q
		sombra.material_override = Pessoa.mat_sombra()
		sombra.rotation.x = -PI * 0.5
		sombra.position.y = 0.04
		sombra.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(sombra)
	else:
		vestir(t, 0.97)
	idoso = t in ["civ_idoso", "civ_idosa"]
	estado = "calmo" if calmo else "panico"
	rapidez = randf_range(3.6, 4.8) * (0.62 if idoso else 1.0)
	raio = 0.3
	anim_t = randf() * 2.0
	return self

func panico() -> void:
	if estado == "calmo":
		estado = "panico"
		anim_fixa = ""
		pensa = randf_range(0.0, 0.4)
		if randf() < 0.3:
			cena.audio.grito(global_position)

func mordido(z: Node) -> void:
	estado = "caido"
	vel = Vector3.ZERO
	empurrao = (global_position - z.global_position).normalized() * 2.0
	virar_em = TEMPO_VIRAR
	tocar("mordido", true)
	cena.mordidos += 1
	cena.marca(global_position, 1.6, "sangue")
	cena.audio.grito(global_position, true)

func dizer(txt: String, t := 3.5) -> void:
	if fala == null:
		fala = Label3D.new()
		fala.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		fala.font = load("res://assets/fonts/texto-bold.ttf")
		fala.font_size = 34
		fala.outline_size = 10
		fala.outline_modulate = Color(0, 0, 0, 0.85)
		fala.modulate = Color(1, 0.96, 0.88)
		fala.position = Vector3(0, 2.1, 0)
		fala.no_depth_test = true
		fala.pixel_size = 0.006
		add_child(fala)
	fala.text = txt
	fala.visible = true
	fala_t = t

func _physics_process(delta: float) -> void:
	if fala_t > 0:
		fala_t -= delta
		if fala_t <= 0 and fala:
			fala.visible = false
	atordoado = max(0.0, atordoado - delta)
	if estado in ["caido", "ferido", "virando"] and vai_virar:
		virar_em -= delta
		var inf := clampf(1.0 - virar_em / TEMPO_VIRAR, 0.0, 1.0)
		if quadro:
			quadro.set_instance_shader_parameter("infeccao", inf * inf)
		if virar_em <= 0:
			cena.virar_infectado(self)
			return
		if virar_em < TEMPO_CONVULSAO and estado != "virando":
			estado = "virando"
			vel = Vector3.ZERO
			alvo_cena = null
			tocar("convulsao", true)
			cena.audio.gemido(global_position, "comum")
		elif estado == "caido" and TEMPO_VIRAR - virar_em > 1.4:
			estado = "ferido"     # levanta e foge segurando a mordida
			pensa = 0.0
	if estado == "virando":
		# convulsão: o corpo treme no chão (só o corpo; a tela não treme)
		var forca := 0.06 * (1.0 - virar_em / TEMPO_CONVULSAO) + 0.02
		if quadro:
			quadro.position.x = randf_range(-forca, forca)
			quadro.position.z = randf_range(-forca, forca)
		mover(delta)
		animar(delta)
		return
	if estado == "caido":
		mover(delta)
		animar(delta)
		return
	if estado == "morto":
		animar(delta)
		return
	pensa -= delta
	var quer := Vector3.ZERO
	if alvo_cena != null:
		var vc := vel_cena_agora()
		quer = vc / max(0.01, vel_cena)
	elif estado == "calmo":
		if pensa <= 0:
			pensa = randf_range(2.0, 6.0)
			destino = global_position + Vector3(randf_range(-4, 4), 0, randf_range(-4, 4))
		var d := destino - global_position
		d.y = 0
		if d.length() > 0.4 and anim_fixa == "":
			quer = d.normalized() * 0.38
		var z: Node3D = cena.infectado_perto(global_position, 9.0)
		if z != null:
			panico()
	elif estado == "panico" or estado == "encolhido" or estado == "ferido":
		if pensa <= 0:
			pensa = randf_range(0.3, 0.7)
			var z2: Node3D = cena.infectado_perto(global_position, 14.0)
			if z2 != null:
				var longe := (global_position - z2.global_position)
				longe.y = 0
				destino = global_position + longe.normalized().rotated(Vector3.UP, randf_range(-0.7, 0.7)) * 12.0
				if estado != "ferido":
					estado = "panico"
			elif cena.fuga != Vector3.INF and randf() < 0.7:
				destino = cena.fuga + Vector3(randf_range(-25, 25), 0, randf_range(-12, 12))
			elif randf() < 0.12:
				estado = "encolhido"
			else:
				destino = global_position + Vector3(randf_range(-10, 10), 0, randf_range(-10, 10))
		if estado == "panico" or estado == "ferido":
			var d2 := destino - global_position
			d2.y = 0
			if d2.length() > 0.6:
				quer = d2.normalized()
	var v := rapidez if estado == "panico" else 1.4
	if estado == "ferido":
		v = rapidez * lerp(0.75, 0.4, 1.0 - virar_em / TEMPO_VIRAR)   # vai perdendo as forças
	if alvo_cena != null:
		v = vel_cena
	if atordoado > 0:
		v *= 0.25
	vel = vel.lerp(quer * v, clamp(delta * 6.0, 0, 1))
	if vel.length() > 0.2:
		dir = atan2(vel.z, vel.x)
	mover(delta)
	if anim_fixa != "" and vel.length() < 0.3:
		tocar(anim_fixa)
	elif estado == "encolhido":
		tocar("cower")
	elif estado == "ferido":
		tocar("walk" if vel.length() < 2.4 else "run")
	elif vel.length() > 3.0:
		tocar("flee" if (estado == "panico" and int(global_position.x * 7.0) % 3 == 0) else "run")
	elif vel.length() > 0.25:
		tocar("walk")
	else:
		tocar("idle")
	animar(delta)

# ------------------------------------------------------------------ corpo 3D (Mixamo): mesmos nomes das folhas
func tocar(nome: String, reinicia := false) -> void:
	if modelo == null:
		match nome:
			"mordido", "convulsao":
				nome = "death"
		super.tocar(nome, reinicia)
		return
	if nome == anim and not reinicia:
		return
	anim = nome
	anim_fim = false
	var n3 := "h_idle"
	match nome:
		"walk":
			n3 = "h_walk" if estado != "ferido" else "h_walk2"
		"run", "flee":
			n3 = "h_sprint" if rapidez > 4.5 and estado == "panico" else "h_run"
		"cower":
			n3 = "h_crouch"
		"mordido":
			n3 = "h_slip"           # a mordida derruba
		"convulsao":
			n3 = "h_writhe"         # se contorce no chão antes de virar
		"death":
			n3 = "dying"
		"hit":
			n3 = "hit"
	modelo.tocar(n3, reinicia, 0.25)

func animar(delta: float, ritmo_ := 1.0) -> void:
	if modelo == null:
		super.animar(delta, ritmo_)
		return
	anim_fim = modelo.anim_fim
	if estado == "caido" and modelo.anim == "h_slip" and modelo.anim_fim:
		modelo.tocar("h_crawl_back", false, 0.3)   # caído, se arrasta para trás
	modelo.rotation.y = lerp_angle(modelo.rotation.y, PI * 0.5 - dir, clampf(delta * 8.0, 0.0, 1.0))
	var v := Vector2(vel.x, vel.z).length()
	if modelo.anim in ["h_walk", "h_walk2", "h_run", "h_sprint", "h_crawl_back"]:
		modelo.ritmo(maxf(v, 0.4))
	elif modelo.anim == "h_crouch":
		modelo.ap.speed_scale = 0.25    # agachado, tremendo
	else:
		modelo.ap.speed_scale = 1.0
	modelo.position.y = altura_pulo
	_lod_t -= delta
	if _lod_t <= 0.0:
		_lod_t = 0.25
		var cam: Camera3D = Pessoa.camera
		var d2 := cam.global_position.distance_squared_to(global_position) if cam else 0.0
		modelo.ligado(cam == null or (cam.is_position_in_frustum(global_position + Vector3(0, 1, 0)) and d2 < 150.0 * 150.0), d2 > 220.0 * 220.0)

func clarao(t := 0.12) -> void:
	if modelo:
		modelo.clarao(t)
	else:
		super.clarao(t)
