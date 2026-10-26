extends Pessoa
class_name Infectado
## Infectado comum (operário, executivo, paciente) ou corredor (atleta), refeitos no laboratório.

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

func montar(c: Node, t := "comum", variante_ := "") -> Infectado:
	cena = c
	tipo = t
	var v := variante_
	if v == "":
		v = "atleta" if t == "corredor" else ["operario", "executivo", "paciente"].pick_random()
	vestir(v, 0.93)
	if t == "corredor":
		rapidez = randf_range(4.4, 4.9)
		hp = 3
		visao = 26.0
	else:
		rapidez = randf_range(1.0, 1.6)
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
