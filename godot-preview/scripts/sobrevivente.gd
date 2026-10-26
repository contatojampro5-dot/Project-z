extends Pessoa
class_name Sobrevivente
## Hannah, Antônio e Hadassa. Um é controlado pelo jogador; os outros seguem a cena ou acompanham.
## Antônio tem o coração (bpm na tela): correr e infectados por perto aceleram; acima de 150 ele fica
## mais lento e o fôlego volta devagar (decisão do Theo: sem minijogo).

var quem := "hannah"
var nome_tela := "Hannah"
var controlado := false
var andar := 2.7
var correr := 5.3
var folego := 1.0
var correndo := false
var pulo_t := -1.0
var pulo_dir := Vector3.ZERO
var agarrado_por: Node = null
var luta := 0.0
var luta_t := 0.0
var luta_espera := 0.0
var arma := ""
var golpe_espera := 0.0
var golpeando := false
var seguir: Node3D = null
var bpm := 78.0
var tem_coracao := false
var invencivel := false
var anim_fixa := ""            # cena pede uma animação (phone, look, cower...)

signal agarrado
signal soltou
signal pego

func montar(c: Node, id: String, com_extintor := false) -> Sobrevivente:
	cena = c
	quem = id
	nome_tela = {"hannah": "Hannah", "antonio": "Antônio", "hadassa": "Hadassa"}[id]
	vestir("civ_%s%s" % [{"hannah": "hanna"}.get(id, id), "_ext" if com_extintor else ""], 1.0)
	if id == "antonio":
		tem_coracao = true
		correr = 5.0
	if id == "hadassa":
		correr = 5.4
	if com_extintor:
		arma = "extintor"
	return self

func trocar_para_extintor() -> void:
	vestir("civ_antonio_ext", 1.0)
	arma = "extintor"

func _physics_process(delta: float) -> void:
	if not vivo:
		animar(delta)
		return
	luta_espera = max(0.0, luta_espera - delta)
	golpe_espera = max(0.0, golpe_espera - delta)
	atordoado = max(0.0, atordoado - delta)
	if agarrado_por != null:
		_lutar(delta)
		animar(delta)
		return
	if pulo_t >= 0.0:
		_pular(delta)
		return
	var quer := Vector3.ZERO
	if controlado and cena.controle_livre:
		var v2 := Input.get_vector("mover_esq", "mover_dir", "mover_cima", "mover_baixo")
		# relativo à câmera (diagonal estilo Zomboid)
		var b := camera.global_transform.basis
		var dir_d := Vector3(b.x.x, 0, b.x.z).normalized()
		var dir_f := Vector3(-b.z.x, 0, -b.z.z).normalized()
		quer = dir_d * v2.x - dir_f * v2.y
		correndo = Input.is_action_pressed("correr") and folego > 0.05 and quer.length() > 0.1
		if Input.is_action_just_pressed("pular"):
			_tentar_pulo(quer)
		if Input.is_action_just_pressed("atacar") and arma != "":
			golpear()
	elif alvo_cena != null:
		var vc := vel_cena_agora()
		quer = vc / max(0.01, vel_cena)
		correndo = vel_cena > 3.5
	elif seguir != null and is_instance_valid(seguir):
		var d := seguir.global_position - global_position
		d.y = 0
		var dist := d.length()
		if dist > 2.2:
			quer = d / dist
			correndo = dist > 4.0 or ("correndo" in seguir and seguir.correndo)
		if dist > 30.0:
			global_position = seguir.global_position - d.normalized() * 2.0
	var v := correr if correndo else andar
	if alvo_cena != null and not controlado:
		v = vel_cena
	if tem_coracao and bpm > 150:
		v *= 0.82
	if atordoado > 0:
		v *= 0.3
	vel = quer.limit_length(1.0) * v
	if quer.length() > 0.1:
		dir = atan2(quer.z, quer.x)
	if correndo and vel.length() > 0.5:
		folego = max(0.0, folego - delta * (0.11 if not tem_coracao else 0.15))
	else:
		folego = min(1.0, folego + delta * (0.2 if bpm < 140 else 0.07))
	if tem_coracao:
		var perto: int = cena.infectados_perto(global_position, 12.0)
		var meta := 76.0 + (58.0 if correndo else 0.0) + perto * 8.0
		bpm = move_toward(bpm, min(meta, 186.0), delta * (15.0 if meta > bpm else 6.0))
	mover(delta)
	if golpeando:
		if anim_fim:
			golpeando = false
	elif anim_fixa != "" and vel.length() < 0.3:
		tocar(anim_fixa)
	elif vel.length() > 3.4:
		tocar("run")
	elif vel.length() > 0.3:
		tocar("walk")
	else:
		tocar("idle")
	animar(delta, 1.0 if anim != "walk" else clamp(vel.length() / 2.4, 0.6, 1.4))

func _tentar_pulo(quer: Vector3) -> void:
	var d := quer.normalized() if quer.length() > 0.1 else Vector3(cos(dir), 0, sin(dir))
	pulo_dir = d
	pulo_t = 0.0
	if cena.col.baixo_a_frente(chao2(), Vector2(d.x, d.z)):
		fantasma = true
	cena.audio.som("pulo", global_position, -6.0)

func _pular(delta: float) -> void:
	pulo_t += delta
	var dur := 0.55
	var k := pulo_t / dur
	var n := chao2() + Vector2(pulo_dir.x, pulo_dir.z) * 5.4 * delta
	if fantasma or not cena.col.bloqueado(n, raio):
		global_position = Vector3(n.x, Mapa.altura(n.x, n.y), n.y)
	altura_pulo = sin(PI * clamp(k, 0.0, 1.0)) * 0.85
	tocar("run")
	animar(delta, 0.4)
	if k >= 1.0:
		pulo_t = -1.0
		altura_pulo = 0.0
		if fantasma and cena.col.bloqueado(chao2(), raio, true):
			pulo_t = 0.62
			return
		fantasma = false

## Um infectado agarrou: aperte E sem parar para se soltar.
func agarrar(z: Node) -> bool:
	if agarrado_por != null or luta_espera > 0 or pulo_t >= 0 or invencivel or not vivo:
		return false
	agarrado_por = z
	luta = 0.25
	luta_t = 3.3 if quem != "antonio" else 3.7
	tocar("hit", true)
	cena.audio.som("grito_curto", global_position, 0.0)
	agarrado.emit()
	return true

func _lutar(delta: float) -> void:
	vel = Vector3.ZERO
	luta_t -= delta
	luta = max(0.0, luta - delta * 0.17)
	var apertou: bool = controlado and Input.is_action_just_pressed("interagir")
	if apertou or (cena.auto and randf() < 0.3) or not controlado:
		luta += 0.11 if controlado else 0.05
		empurrao = Vector3(randf_range(-1, 1), 0, randf_range(-1, 1))
		if anim != "hit" or anim_fim:
			tocar("hit", true)
	if luta >= 1.0:
		var z: Node = agarrado_por
		agarrado_por = null
		luta_espera = 1.8
		if is_instance_valid(z):
			z.empurrado((z.global_position - global_position).normalized() * 9.0, 1.6)
		soltou.emit()
	elif luta_t <= 0:
		agarrado_por = null
		vivo = false
		tocar("death", true)
		pego.emit()

func golpear() -> void:
	if golpe_espera > 0:
		return
	golpe_espera = 0.6
	golpeando = true
	tocar("swing", true)
	cena.audio.som("golpe", global_position, -2.0)
	get_tree().create_timer(0.22, false).timeout.connect(_acertar)

func _acertar() -> void:
	var f := Vector3(cos(dir), 0, sin(dir))
	var acertou := false
	for z in cena.infectados:
		if not is_instance_valid(z) or not z.vivo:
			continue
		var d: Vector3 = z.global_position - global_position
		d.y = 0
		if d.length() < 1.9 and f.dot(d.normalized()) > 0.1:
			z.ferir(1, d.normalized())
			acertou = true
	if acertou:
		cena.audio.som("pancada", global_position, 2.0)
		FX.faiscas(cena.efeitos, global_position + f * 1.0 + Vector3(0, 1.2, 0), 8)
