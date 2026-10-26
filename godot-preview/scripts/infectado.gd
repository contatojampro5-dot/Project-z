extends Pessoa
class_name Infectado
## Infectado comum (operário, executivo, paciente) ou corredor (atleta). Desde o R49 é um modelo 3D
## animado com os movimentos do Mixamo (Zumbi3D); `USAR_3D = false` volta aos desenhos do laboratório.

const USAR_3D := true
## qual personagem do Mixamo veste cada tipo (o corredor é o Yaku ou a Zombiegirl; a polícia vira o Copzombie ou o
## Swat; quem acabou de virar ainda tem cara de gente: o Ch18)
const PERSONAGEM_DE := {"operario": ["prisoner", "warzombie", "ch18"], "executivo": ["copzombie", "warzombie", "parasite", "ch18"],
	"paciente": ["parasite", "zombiegirl"], "atleta": ["yaku", "zombiegirl"], "policial": ["copzombie", "swat"],
	"mulher": ["zombiegirl"], "civil": ["ch18", "ch18", "prisoner", "warzombie", "parasite"]}

var tipo := "comum"
var hp := 2
var alvo: Node3D = null
var comendo := 0.0
var segurando: Node = null
var visao := 14.0
var horda := false
var pensa := 0.0
var vagar := Vector3.ZERO
var rapidez := 1.3
var gemido := 0.0
var corpo_t := 0.0
var modelo: Zumbi3D = null
var _lod_t := 0.0

func montar(c: Node, t := "comum", variante_ := "") -> Infectado:
	cena = c
	tipo = t
	var v := variante_
	if v == "":
		v = "atleta" if t == "corredor" else ["operario", "executivo", "paciente"].pick_random()
	if USAR_3D:
		variante = v
		modelo = Zumbi3D.new()
		add_child(modelo)
		modelo.montar(-1, 1.0, (PERSONAGEM_DE.get(v, Zumbi3D.PERSONAGENS) as Array).pick_random())
		_sombra_3d()
	else:
		if not Pessoa.indice().has(v):
			v = ["operario", "executivo", "paciente"].pick_random()
		vestir(v, 0.93)
	if t == "corredor":
		rapidez = randf_range(4.4, 4.9)
		hp = 3
		visao = 26.0
	else:
		rapidez = randf_range(0.9, 1.5)
	gemido = randf_range(2, 8)
	dir = randf() * TAU
	return self

func _physics_process(delta: float) -> void:
	if not vivo:
		animar(delta)
		corpo_t += delta
		if corpo_t > 40.0:
			queue_free()
		return
	atordoado = max(0.0, atordoado - delta)
	pensa -= delta
	gemido -= delta
	if gemido <= 0:
		gemido = randf_range(4, 11)
		cena.audio.gemido(global_position, tipo)
	if segurando != null:
		if not is_instance_valid(segurando) or segurando.agarrado_por != self:
			segurando = null
		else:
			vel = Vector3.ZERO
			olhar(segurando.global_position)
			var junto: Vector3 = segurando.global_position - Vector3(cos(dir), 0, sin(dir)) * 0.7
			global_position = global_position.lerp(junto, delta * 8.0)
			tocar("attack")
			animar(delta)
			return
	if comendo > 0:
		comendo -= delta
		vel = Vector3.ZERO
		tocar("attack")
		animar(delta, 0.6)
		mover(delta)
		return
	if atordoado > 0:
		vel = vel.move_toward(Vector3.ZERO, 10.0 * delta)
		mover(delta)
		animar(delta, 0.5)
		return
	if pensa <= 0:
		pensa = randf_range(0.2, 0.45)
		alvo = cena.humano_perto(global_position, 9999.0 if horda else visao)
		if alvo == null and (vagar == Vector3.ZERO or randf() < 0.05):
			vagar = global_position + Vector3(randf_range(-6, 6), 0, randf_range(-6, 6))
	var quer := Vector3.ZERO
	if alvo_cena != null:
		quer = vel_cena_agora().normalized()
	elif alvo != null and is_instance_valid(alvo):
		var d := alvo.global_position - global_position
		d.y = 0
		var dist := d.length()
		quer = d / max(dist, 0.01)
		if dist < raio + 0.7:
			_alcancar(alvo)
	elif vagar != Vector3.ZERO:
		var d2 := vagar - global_position
		d2.y = 0
		if d2.length() < 0.4:
			vagar = Vector3.ZERO
		else:
			quer = d2.normalized() * 0.45
	var v := rapidez if alvo_cena == null else vel_cena
	vel = vel.lerp(quer * v, clamp(delta * 5.0, 0, 1))
	if quer.length() > 0.05:
		dir = lerp_angle(dir, atan2(quer.z, quer.x), clamp(delta * 7.0, 0, 1))
	mover(delta)
	if anim != "hit" or anim_fim:
		tocar("walk")
	animar(delta, clamp(vel.length() / (1.4 if tipo == "comum" else 4.0), 0.4, 1.8))

# ------------------------------------------------------------------ corpo 3D (mesmos nomes das folhas)
func _sombra_3d() -> void:
	## mancha escura macia no pé (a sombra do sol já vem do modelo; esta ajuda a "pisar" no chão)
	sombra = MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.9, 0.7)
	sombra.mesh = q
	sombra.material_override = Pessoa.mat_sombra()
	sombra.rotation.x = -PI * 0.5
	sombra.position.y = 0.04
	sombra.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(sombra)

func tocar(nome: String, reinicia := false) -> void:
	if modelo == null:
		super.tocar(nome, reinicia)
		return
	if nome == anim and not reinicia:
		return
	anim = nome
	anim_fim = false
	var n3 := nome
	match nome:
		"walk":
			n3 = "run" if tipo == "corredor" else ("walk2" if rapidez < 1.0 else "walk")
		"attack":
			n3 = "bite"
		"death":
			n3 = "death" if randf() < 0.6 else "dying"
		"hit":
			n3 = "hit" if randf() < 0.5 else "hit2"
	modelo.tocar(n3, reinicia)

func animar(delta: float, ritmo_ := 1.0) -> void:
	if modelo == null:
		super.animar(delta, ritmo_)
		return
	anim_fim = modelo.anim_fim
	var alvo_giro := PI * 0.5 - dir
	modelo.rotation.y = lerp_angle(modelo.rotation.y, alvo_giro, clampf(delta * 8.0, 0.0, 1.0))
	var v := Vector2(vel.x, vel.z).length()
	if anim == "walk":
		modelo.ritmo(v)
	else:
		modelo.ap.speed_scale = ritmo_ if anim in ["attack"] else 1.0
	modelo.position.y = altura_pulo
	# leveza: fora da tela a animação não é calculada
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

func levantar() -> void:
	## acabou de virar: levanta do chão com a animação do Mixamo
	if modelo:
		modelo.tocar("stand_up", true, 0.05)
		anim = "stand_up"
		atordoado = 2.6

func _alcancar(a: Node3D) -> void:
	if a is Civil:
		if a.estado in ["calmo", "panico", "encolhido"]:
			a.mordido(self)
			comendo = randf_range(0.9, 1.4)   # morde e já larga: vai atrás do próximo mais perto
			pensa = comendo
			alvo = null
			cena.audio.som("mordida", global_position, -2.0)
	elif a is Sobrevivente:
		if a.controlado:
			if a.agarrar(self):
				segurando = a
		elif a.vivo:
			empurrado((global_position - a.global_position).normalized() * 6.0, 0.9)

func empurrado(forca: Vector3, atordoa := 0.5) -> void:
	segurando = null
	super.empurrado(forca, atordoa)
	tocar("hit", true)

func ferir(dano: int, d: Vector3) -> void:
	if not vivo:
		return
	hp -= dano
	clarao()
	segurando = null
	empurrado(d * (7.0 if tipo == "comum" else 9.0), 0.5)
	cena.marca(global_position, 0.9, "sangue")
	if hp <= 0:
		morrer()

func morrer() -> void:
	vivo = false
	segurando = null
	vel = Vector3.ZERO
	tocar("death", true)
	cena.audio.som("morte_zumbi", global_position, -2.0)
	cena.marca(global_position, 1.8, "sangue")
