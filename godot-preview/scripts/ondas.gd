extends Node
class_name ModoOndas
## Modo Sobrevivência (ondas) no Godot (R50): o modo principal do jogo do navegador trazido para a cidade 3D.
## O Antônio fica na Av. dos Tecelões, na frente do mercado, com uma pistola e o extintor. Cada onda traz mais
## infectados (corredores a partir da onda 3), o anoitecer avança, zumbi morto pode largar caixa de bala ou
## kit de primeiros socorros, e cada nível dá para escolher 1 de 3 melhorias (a partida pausa).
## Sem tremor de tela (regra do dono); o clarão do tiro pode.

const INICIO := Vector3(100, 0, 2)
const MAX_VIVOS := 28                # infectados vivos ao mesmo tempo (leveza no navegador)
const MELHORIAS := [
	{"id": "dano", "nome": "Mão firme", "txt": "Tiro tira +1 de vida dos infectados"},
	{"id": "cadencia", "nome": "Gatilho rápido", "txt": "Atira 20% mais rápido"},
	{"id": "pente", "nome": "Pente estendido", "txt": "+4 balas no pente"},
	{"id": "vida", "nome": "Couro de bombeiro", "txt": "+25 de vida máxima e cura tudo"},
	{"id": "pernas", "nome": "Pernas leves", "txt": "Anda e corre 10% mais rápido"},
	{"id": "atravessa", "nome": "Bala que atravessa", "txt": "A bala passa por +1 infectado"},
	{"id": "extintor", "nome": "Extintor pesado", "txt": "Golpe do extintor tira +2 e empurra longe"},
	{"id": "sorte", "nome": "Olho de catador", "txt": "Infectados largam mais caixas"},
]
const FALAS_ONDA := {
	1: "Tá. Respira, Antônio. É só... uma horda. Uma horda inteira.",
	2: "Bombeiro apaga fogo. Ninguém me falou nada de apagar gente!",
	3: "Eles CORREM agora?! Desde quando eles correm?!",
	5: "Se eu sair dessa, fecho o mercado e vou vender coco na praia.",
	7: "Já tô até decorando a cara de vocês. Não é um elogio.",
	10: "Dez ondas. Alguém anota isso, porque ninguém vai acreditar.",
}

var main: Node = null
var p: Sobrevivente = null
var onda := 0
var restam := 0                      # infectados que ainda vão aparecer nesta onda
var abates := 0
var nivel := 1
var xp := 0
var xp_prox := 5
var pente := 12
var pente_max := 12
var reserva := 60
var dano := 1
var cadencia := 0.3
var atravessa := 0
var sorte := 1.0
var _tiro_t := 0.0
var _recarga_t := 0.0
var _surgir_t := 0.0
var _contados := {}
var _caixas: Array = []
var _mira := Vector3.ZERO
var _mira_mouse := false
var _rato_t := 0.0
var escolhendo := false
var _fim := false
var _falou_bala := false
var _recorde := 0
var _rodando := false
var _dbg_t := 0.0
var _entre_ondas := false

# interface própria do modo (por cima do HUD do prólogo)
var ui: CanvasLayer
var lb_onda: Label
var lb_restam: Label
var lb_bala: Label
var lb_abates: Label
var lb_nivel: Label
var bar_vida: ProgressBar
var bar_xp: ProgressBar
var mira_ui: Control
var painel_melhoria: PanelContainer
var caixa_opcoes: VBoxContainer
var painel_fim: PanelContainer
var lb_fim: Label
var lb_fim_sub: Label

func comecar(m: Node) -> void:
	main = m
	_entradas()
	_ler_recorde()
	m.amb.aplicar(0.3)
	# o canteiro da avenida é só uma guia baixa: aqui todo mundo passa por cima (os infectados não ficam presos)
	m.col.rets = m.col.rets.filter(func(rr: Rect2): return not (is_equal_approx(rr.position.y, -1.0) and is_equal_approx(rr.size.y, 2.0)))
	p = m.novo_sobrevivente("antonio", INICIO, true)
	p.vida = 100.0
	p.vida_max = 100.0
	p.dir = -PI * 0.5
	m.controlar(p)
	m.cam.seguir(p, 36.0)
	p.pego.connect(_morreu)
	m.colunas_de_fumaca(5)
	for q in [Vector3(132, 0, 8), Vector3(62, 0, -7), Vector3(168, 0, -6)]:
		m.destroco(q, randf_range(-0.4, 0.4) + (0.0 if q.z > 0 else PI), true)
	_montar_ui()
	_ajustar_pausa()
	m.hud.fade.color.a = 1.0
	m.hud.objective("")
	m.hud.set_hint("WASD: andar · Shift: correr · Espaço: pular\nClique: atirar · R: recarregar · F: extintor\nEsc: pausa")
	m.audio.tocar_musica("musica_ondas", -13.0, 3.0)
	m.hud.fade_to(0.0, 1.2)
	await m.hud.card("SOBREVIVÊNCIA", "Av. dos Tecelões  ·  na frente do mercado", 1.6)
	m.controle_livre = true
	_rodando = true
	_proxima_onda()

# ------------------------------------------------------------------ controles extras (tiro, mira, recarga)
func _entradas() -> void:
	# no modo de ondas o clique atira (o extintor fica no F / botão B)
	for e in InputMap.action_get_events("atacar"):
		if e is InputEventMouseButton:
			InputMap.action_erase_event("atacar", e)
	var novas := {
		"atirar": [MOUSE_BUTTON_LEFT, KEY_J, JOY_AXIS_TRIGGER_RIGHT],
		"recarregar": [KEY_R, JOY_BUTTON_LEFT_SHOULDER],
	}
	for a in novas:
		if InputMap.has_action(a):
			continue
		InputMap.add_action(a, 0.3)
	if InputMap.action_get_events("atirar").is_empty():
		var mb := InputEventMouseButton.new()
		mb.button_index = MOUSE_BUTTON_LEFT
		InputMap.action_add_event("atirar", mb)
		var kj := InputEventKey.new()
		kj.physical_keycode = KEY_J
		InputMap.action_add_event("atirar", kj)
		var rt := InputEventJoypadMotion.new()
		rt.axis = JOY_AXIS_TRIGGER_RIGHT
		rt.axis_value = 1.0
		InputMap.action_add_event("atirar", rt)
	# mira no analógico direito
	for par in [["mira_esq", -1.0], ["mira_dir", 1.0], ["mira_cima", -1.0], ["mira_baixo", 1.0]]:
		if InputMap.has_action(par[0]):
			continue
		InputMap.add_action(par[0], 0.3)
		var jm := InputEventJoypadMotion.new()
		jm.axis = JOY_AXIS_RIGHT_X if par[0] in ["mira_esq", "mira_dir"] else JOY_AXIS_RIGHT_Y
		jm.axis_value = par[1]
		InputMap.action_add_event(par[0], jm)
	if InputMap.action_get_events("recarregar").is_empty():
		var kr := InputEventKey.new()
		kr.physical_keycode = KEY_R
		InputMap.action_add_event("recarregar", kr)
		var lb := InputEventJoypadButton.new()
		lb.button_index = JOY_BUTTON_LEFT_SHOULDER
		InputMap.action_add_event("recarregar", lb)

func _input(e: InputEvent) -> void:
	if e is InputEventMouseMotion:
		_mira_mouse = true
		_rato_t = 3.0
	elif e is InputEventJoypadMotion and absf(e.axis_value) > 0.4:
		_mira_mouse = false

# ------------------------------------------------------------------ ondas
func _proxima_onda() -> void:
	onda += 1
	restam = 5 + onda * 3
	_surgir_t = 2.5
	main.audio.som("onda", null, -2.0)
	main.amb.passar(clampf(0.3 + onda * 0.05, 0.0, 1.0), 6.0)
	if FALAS_ONDA.has(onda):
		main.hud.say("Antônio", FALAS_ONDA[onda])
	main.hud.card("ONDA %d" % onda, "%d infectados vindo" % restam, 1.0)
	if main.auto:
		print("[autotest] onda ", onda)
		main.foto("onda_%d" % onda)

func _vivos() -> int:
	var n := 0
	for z in main.infectados:
		if is_instance_valid(z) and z.vivo:
			n += 1
	return n

func _surgir() -> void:
	var corredor := onda >= 3 and randf() < clampf(0.12 + onda * 0.03, 0.0, 0.45)
	var pos := _ponto_de_surgir()
	var z: Infectado = main.novo_infectado(pos, "corredor" if corredor else "comum")
	z.horda = true
	z.visao = 9999.0
	z.hp = (3 if corredor else 2) + int(onda / 3)
	z.dano = 9.0 + onda * 0.8
	if not corredor:
		z.rapidez *= 1.0 + minf(onda * 0.04, 0.5)
	restam -= 1

func _ponto_de_surgir() -> Vector3:
	var base := p.global_position
	for i in 30:
		var a := randf() * TAU
		var d := randf_range(26.0, 36.0)
		var q := Vector2(base.x + cos(a) * d, base.z + sin(a) * d)
		if main.col.bloqueado(q, 0.5) or not Mapa.na_rua(q):
			continue
		var p3 := Vector3(q.x, 0, q.y)
		if i < 20 and main.cam.is_position_in_frustum(p3 + Vector3(0, 1, 0)):
			continue
		return p3
	# sem lugar livre: vem pela avenida
	return Vector3(base.x + (36.0 if randf() < 0.5 else -36.0), 0, randf_range(-9, 9))

# ------------------------------------------------------------------ laço
func _process(delta: float) -> void:
	if not _rodando or main == null:
		return
	_atualizar_ui()
	if _fim or not is_instance_valid(p) or not p.vivo:
		return
	_tiro_t = maxf(0.0, _tiro_t - delta)
	_rato_t -= delta
	if main.auto:
		_robo()
		_dbg_t -= delta
		if _dbg_t <= 0.0:
			_dbg_t = 4.0
			print("[ondas] onda=%d restam=%d vivos=%d abates=%d bala=%d/%d vida=%d controle=%s" % [onda, restam, _vivos(), abates, pente, reserva, int(p.vida), main.controle_livre])
	_mirar()
	if _recarga_t > 0.0:
		_recarga_t -= delta
		if _recarga_t <= 0.0:
			var n := mini(pente_max - pente, reserva)
			pente += n
			reserva -= n
	elif main.controle_livre and not escolhendo:
		var quer_atirar: bool = Input.is_action_pressed("atirar") or (main.auto and _alvo_perto(22.0) != null)
		if Input.is_action_just_pressed("recarregar") and pente < pente_max and reserva > 0:
			_recarregar()
		elif quer_atirar and _tiro_t <= 0.0:
			_atirar()
	# surgir infectados
	if restam > 0:
		_surgir_t -= delta
		if _surgir_t <= 0.0 and _vivos() < MAX_VIVOS:
			_surgir_t = maxf(0.35, 1.1 - onda * 0.06)
			_surgir()
	_contar_abates()
	_destravar(delta)
	if restam <= 0 and not _entre_ondas and _vivos() == 0 and not escolhendo:
		_entre_ondas = true
		_intervalo()
	_caixas_tick(delta)

## Sem caminho pela cidade, um infectado pode ficar preso atrás de carro ou prédio: quem fica longe ou
## não chega mais perto em 8 s reaparece numa rua perto (fora da tela).
var _trava_t := 0.0
func _destravar(delta: float) -> void:
	_trava_t -= delta
	if _trava_t > 0.0:
		return
	_trava_t = 2.0
	var pj := p.global_position
	for z in main.infectados:
		if not is_instance_valid(z) or not z.vivo:
			continue
		var d: float = z.global_position.distance_to(pj)
		var antes: float = z.get_meta("dist", 9999.0)
		var parado: float = z.get_meta("parado", 0.0)
		parado = parado + 2.0 if d > antes - 1.0 and d > 7.0 else 0.0
		if d > 48.0 or parado >= 8.0:
			var q := _ponto_de_surgir()
			z.global_position = Vector3(q.x, Mapa.altura(q.x, q.z), q.z)
			d = 9999.0
			parado = 0.0
		z.set_meta("dist", minf(d, antes) if parado > 0.0 else d)
		z.set_meta("parado", parado)

func _intervalo() -> void:
	main.audio.som("nivel", null, -6.0)
	await main.hud.card("ONDA %d LIMPA" % onda, "respira... a próxima vem aí", 1.2)
	await main.esperar(2.5)
	if not _fim and is_inside_tree():
		_proxima_onda()
	_entre_ondas = false

func _contar_abates() -> void:
	for z in main.infectados:
		if not is_instance_valid(z) or z.vivo or _contados.has(z.get_instance_id()):
			continue
		_contados[z.get_instance_id()] = true
		abates += 1
		_ganhar_xp(2 if z.tipo == "corredor" else 1)
		if main.auto and abates in [12, 30]:
			main.foto("combate_%d" % abates)
		var r := randf()
		if r < 0.3 * sorte:
			_caixa("bala", z.global_position)
		elif r < (0.3 + 0.06) * sorte:
			_caixa("cura", z.global_position)
	if _contados.size() > 600:
		_contados.clear()

func _ganhar_xp(n: int) -> void:
	xp += n
	if xp >= xp_prox:
		xp -= xp_prox
		nivel += 1
		xp_prox = 5 + nivel * 3
		_subir_nivel()

# ------------------------------------------------------------------ tiro
func _alvo_perto(r: float) -> Infectado:
	return main.infectado_perto(p.global_position, r)

func _mirar() -> void:
	var cam: Camera3D = main.cam
	var pj := p.global_position
	var stick := Input.get_vector("mira_esq", "mira_dir", "mira_cima", "mira_baixo") if InputMap.has_action("mira_esq") else Vector2.ZERO
	if stick.length() > 0.3:
		var b := cam.global_transform.basis
		var dd := Vector3(b.x.x, 0, b.x.z).normalized()
		var df := Vector3(-b.z.x, 0, -b.z.z).normalized()
		_mira = pj + (dd * stick.x - df * stick.y).normalized() * 10.0
	elif _mira_mouse and _rato_t > 0.0 and not main.auto:
		var mp := get_viewport().get_mouse_position()
		var o := cam.project_ray_origin(mp)
		var n := cam.project_ray_normal(mp)
		if absf(n.y) > 0.01:
			var t := (pj.y + 1.0 - o.y) / n.y
			_mira = o + n * t
	else:
		# sem mouse: mira sozinha no infectado mais perto (controle sem analógico direito, celular, teste)
		var z := _alvo_perto(20.0)
		_mira = z.global_position if z else pj + Vector3(cos(p.dir), 0, sin(p.dir)) * 8.0
	var d := _mira - pj
	d.y = 0
	if d.length() > 0.2 and (Input.is_action_pressed("atirar") or main.auto or _tiro_t > 0.0):
		p.mira_dir = atan2(d.z, d.x)
		p.mira_t = 0.35

func _atirar() -> void:
	if pente <= 0:
		if reserva > 0:
			_recarregar()
		else:
			_tiro_t = 0.5
			main.audio.som("sem_bala", p.global_position, -4.0)
			if not _falou_bala:
				_falou_bala = true
				main.hud.say("Antônio", "Sem bala! Extintor, meu velho amigo... (aperte F)")
		return
	pente -= 1
	_tiro_t = cadencia
	var o := p.global_position + Vector3(0, 1.15, 0)
	var d := _mira - p.global_position
	d.y = 0
	d = d.normalized() if d.length() > 0.1 else Vector3(cos(p.dir), 0, sin(p.dir))
	d = d.rotated(Vector3.UP, randf_range(-0.035, 0.035))
	p.mira_dir = atan2(d.z, d.x)
	p.mira_t = 0.35
	main.audio.som("tiro", p.global_position, -3.0, 0.1)
	# até onde a bala vai (para no prédio/carro)
	var alcance := 30.0
	var k := 0.6
	while k < alcance:
		var q := Vector2(o.x + d.x * k, o.z + d.z * k)
		if _bala_bloqueada(q):
			alcance = k
			break
		k += 0.6
	# quem está na linha do tiro (do mais perto para o mais longe)
	var acertos := []
	for z in main.infectados:
		if not is_instance_valid(z) or not z.vivo:
			continue
		var v: Vector3 = z.global_position - p.global_position
		v.y = 0
		var ao_longo := v.dot(d)
		if ao_longo < 0.2 or ao_longo > alcance:
			continue
		if (v - d * ao_longo).length() < 0.6:
			acertos.append([ao_longo, z])
	acertos.sort_custom(func(a, b): return a[0] < b[0])
	var fim := alcance
	for i in mini(acertos.size(), 1 + atravessa):
		var z: Infectado = acertos[i][1]
		_ferir(z, dano, d, 2.6)
		fim = acertos[i][0]
	_rastro(o + d * 0.7, o + d * fim)
	var luz := FX.luz(main.efeitos, o + d * 0.8, Color(1.0, 0.8, 0.45), 3.5, 7.0)
	get_tree().create_timer(0.05, false).timeout.connect(luz.queue_free)
	if pente == 0 and reserva > 0:
		_recarregar()
	elif pente + reserva <= 6 and not _falou_bala and reserva == 0:
		_falou_bala = true
		main.hud.say("Antônio", "Tá acabando a bala... cadê uma caixa amarela?")

## A bala passa por cima de carro, canteiro e barreira; só para em prédio.
func _bala_bloqueada(q: Vector2) -> bool:
	for pr in main.cidade.predios:
		if is_instance_valid(pr) and pr.ret.has_point(q):
			return true
	return false

func _ferir(z: Infectado, n: int, d: Vector3, forca: float) -> void:
	z.hp -= n
	z.clarao()
	z.empurrao = d * forca
	z.atordoado = maxf(z.atordoado, 0.1)
	z.segurando = null
	main.marca(z.global_position, 0.7, "sangue")
	if z.hp <= 0:
		z.morrer()
	elif randf() < 0.35:
		z.tocar("hit", true)

func _rastro(a: Vector3, b: Vector3) -> void:
	var m := MeshInstance3D.new()
	var bx := BoxMesh.new()
	var L := maxf(0.1, a.distance_to(b))
	bx.size = Vector3(0.05, 0.05, L)
	m.mesh = bx
	var mt := StandardMaterial3D.new()
	mt.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mt.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mt.albedo_color = Color(1.0, 0.86, 0.5, 0.85)
	mt.emission_enabled = true
	mt.emission = Color(1.0, 0.75, 0.35)
	mt.emission_energy_multiplier = 3.0
	m.material_override = mt
	m.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	main.efeitos.add_child(m)
	m.global_position = (a + b) * 0.5
	if a.distance_to(b) > 0.05:
		m.look_at(b, Vector3.UP)
	var tw := m.create_tween()
	tw.tween_property(mt, "albedo_color:a", 0.0, 0.07)
	tw.tween_callback(m.queue_free)

func _recarregar() -> void:
	if _recarga_t > 0.0 or reserva <= 0:
		return
	_recarga_t = 1.1
	main.audio.som("recarga", p.global_position, -4.0)

# ------------------------------------------------------------------ caixas no chão (bala e cura)
func _caixa(tipo: String, onde: Vector3) -> void:
	var n := Node3D.new()
	var m := MeshInstance3D.new()
	var bx := BoxMesh.new()
	bx.size = Vector3(0.55, 0.36, 0.4) if tipo == "bala" else Vector3(0.5, 0.38, 0.5)
	m.mesh = bx
	var mt := StandardMaterial3D.new()
	mt.albedo_color = Color(0.85, 0.66, 0.12) if tipo == "bala" else Color(0.92, 0.92, 0.9)
	mt.emission_enabled = true
	mt.emission = Color(1.0, 0.7, 0.15) if tipo == "bala" else Color(0.9, 0.15, 0.12)
	mt.emission_energy_multiplier = 0.9
	m.material_override = mt
	n.add_child(m)
	if tipo == "cura":
		for s in [Vector3(0.3, 0.06, 0.1), Vector3(0.1, 0.06, 0.3)]:
			var c := MeshInstance3D.new()
			var cb := BoxMesh.new()
			cb.size = s
			c.mesh = cb
			c.position.y = 0.2
			c.material_override = Cidade.m_cor(Color(0.85, 0.08, 0.06), 1.5)
			m.add_child(c)
	main.efeitos.add_child(n)
	n.global_position = Vector3(onde.x, 0.45, onde.z)
	n.set_meta("tipo", tipo)
	n.set_meta("t", 0.0)
	_caixas.append(n)

func _caixas_tick(delta: float) -> void:
	var pj := p.global_position
	for n in _caixas.duplicate():
		if not is_instance_valid(n):
			_caixas.erase(n)
			continue
		var t: float = n.get_meta("t") + delta
		n.set_meta("t", t)
		n.rotation.y += delta * 2.2
		n.position.y = 0.45 + sin(t * 3.0) * 0.12
		var dx: float = n.global_position.x - pj.x
		var dz: float = n.global_position.z - pj.z
		if dx * dx + dz * dz < 1.6 * 1.6:
			if n.get_meta("tipo") == "bala":
				reserva += 15
				_falou_bala = false
			else:
				p.vida = minf(p.vida_max, p.vida + 35.0)
			main.audio.som("pegar", null, -4.0)
			_caixas.erase(n)
			n.queue_free()
		elif t > 35.0:
			_caixas.erase(n)
			n.queue_free()

# ------------------------------------------------------------------ níveis e melhorias
func _subir_nivel() -> void:
	escolhendo = true
	main.audio.som("nivel", null, -2.0)
	var opcoes := MELHORIAS.duplicate()
	opcoes.shuffle()
	opcoes = opcoes.slice(0, 3)
	for c in caixa_opcoes.get_children():
		c.queue_free()
	for o in opcoes:
		var btn := Button.new()
		btn.text = "%s\n%s" % [o.nome, o.txt]
		btn.add_theme_font_override("font", main.hud.font_bold)
		btn.add_theme_font_size_override("font_size", 20)
		btn.custom_minimum_size = Vector2(440, 76)
		btn.pressed.connect(_escolher.bind(o.id))
		caixa_opcoes.add_child(btn)
	painel_melhoria.visible = true
	get_tree().paused = true
	if main.auto:
		await main.foto("nivel_%d" % nivel)
		_escolher(opcoes.pick_random().id)
	else:
		await get_tree().process_frame
		if caixa_opcoes.get_child_count() > 0:
			(caixa_opcoes.get_child(0) as Button).grab_focus()

func _escolher(id: String) -> void:
	if not escolhendo:
		return
	match id:
		"dano":
			dano += 1
		"cadencia":
			cadencia *= 0.8
		"pente":
			pente_max += 4
			pente += 4
		"vida":
			p.vida_max += 25.0
			p.vida = p.vida_max
		"pernas":
			p.andar *= 1.1
			p.correr *= 1.1
		"atravessa":
			atravessa += 1
		"extintor":
			p.golpe_dano += 2
			p.golpe_forca *= 1.4
		"sorte":
			sorte *= 1.35
	painel_melhoria.visible = false
	escolhendo = false
	get_tree().paused = false
	main.audio.som("pegar", null, -2.0)
	if nivel == 2:
		main.hud.say("Antônio", "Tô pegando o jeito. Acho. Talvez.")

# ------------------------------------------------------------------ fim
func _morreu() -> void:
	if _fim:
		return
	_fim = true
	main.controle_livre = false
	main.audio.parar_musica(2.0)
	var novo := onda > _recorde
	if novo:
		_recorde = onda
		_salvar_recorde()
	await main.esperar(1.6)
	lb_fim.text = "VOCÊ CAIU NA ONDA %d" % onda
	lb_fim_sub.text = "%d abates  ·  nível %d  ·  %s" % [abates, nivel, "NOVO RECORDE!" if novo else "recorde: onda %d" % _recorde]
	painel_fim.visible = true
	painel_fim.modulate.a = 0.0
	create_tween().tween_property(painel_fim, "modulate:a", 1.0, 0.8)
	if main.auto:
		main.foto("fim_ondas")
		await get_tree().create_timer(1.5, true, false, true).timeout
		print("[autotest] OK — sobrevivência: onda %d, %d abates, nível %d" % [onda, abates, nivel])
		get_tree().quit(0)
	else:
		await get_tree().process_frame
		var b := painel_fim.find_child("de_novo", true, false)
		if b:
			b.grab_focus()

func _ler_recorde() -> void:
	var cf := ConfigFile.new()
	if cf.load("user://ondas.cfg") == OK:
		_recorde = int(cf.get_value("ondas", "recorde", 0))

func _salvar_recorde() -> void:
	var cf := ConfigFile.new()
	cf.set_value("ondas", "recorde", _recorde)
	cf.save("user://ondas.cfg")

# ------------------------------------------------------------------ teste automático: o Antônio se vira sozinho
func _robo() -> void:
	var pj := p.global_position
	var foge := Vector3.ZERO
	for z in main.infectados:
		if is_instance_valid(z) and z.vivo:
			var v: Vector3 = pj - z.global_position
			v.y = 0
			var d := v.length()
			if d < 9.0 and d > 0.01:
				foge += v / d * (9.0 - d)
	var caixa: Node3D = null
	var cd := 9999.0
	for n in _caixas:
		if is_instance_valid(n):
			var dd2: float = n.global_position.distance_to(pj)
			if dd2 < cd:
				cd = dd2
				caixa = n
	if caixa and foge.length() < 4.0:
		foge += (caixa.global_position - pj).normalized() * 3.0
	# sem bala: vai para cima com o extintor
	if pente + reserva == 0 and caixa == null:
		var alvo := _alvo_perto(60.0)
		if alvo:
			foge = (alvo.global_position - pj).normalized() * 3.0
	var colado := _alvo_perto(2.0)
	if colado and pente == 0:
		if Input.is_action_pressed("atacar"):
			Input.action_release("atacar")
		else:
			Input.action_press("atacar")
	var volta := INICIO - pj
	volta.y = 0
	if volta.length() > 14.0:
		foge += volta.normalized() * 3.0
	# depois da onda 3 ele para de fugir e atirar (para testar a tela do fim)
	var cansou := onda >= 4
	if cansou:
		foge = Vector3.ZERO
		pente = 0
		reserva = 0
	var b: Basis = main.cam.global_transform.basis
	var dd := Vector3(b.x.x, 0, b.x.z).normalized()
	var df := Vector3(-b.z.x, 0, -b.z.z).normalized()
	var q := foge.normalized() if foge.length() > 0.5 else Vector3.ZERO
	var v2 := Vector2(q.dot(dd), -q.dot(df))
	for par in [["mover_esq", -v2.x], ["mover_dir", v2.x], ["mover_cima", -v2.y], ["mover_baixo", v2.y]]:
		if par[1] > 0.05:
			Input.action_press(par[0], clampf(par[1], 0.0, 1.0))
		else:
			Input.action_release(par[0])

# ------------------------------------------------------------------ interface
func _ajustar_pausa() -> void:
	var h: Hud = main.hud
	if h.pause_btns.has("restart"):
		h.pause_btns.restart.text = "Recomeçar partida"
	if h.pause_btns.has("skip"):
		h.pause_btns.skip.visible = false
	if h.pause_btns.has("ondas"):
		h.pause_btns.ondas.visible = false
	if h.pause_btns.has("begin"):
		h.pause_btns.begin.text = "Ir para o prólogo"
	h.pause_hint.text = "WASD/setas: andar · Shift: correr · Espaço: pular\nClique/J/RT: atirar · R/LB: recarregar · F/B: extintor"

func _barra(cor: Color, larg: float) -> ProgressBar:
	var b := ProgressBar.new()
	b.show_percentage = false
	b.custom_minimum_size = Vector2(larg, 12)
	var fundo := StyleBoxFlat.new()
	fundo.bg_color = Color(0, 0, 0, 0.55)
	fundo.border_color = Color(1, 1, 1, 0.15)
	fundo.set_border_width_all(1)
	var cheio := StyleBoxFlat.new()
	cheio.bg_color = cor
	b.add_theme_stylebox_override("background", fundo)
	b.add_theme_stylebox_override("fill", cheio)
	b.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return b

func _montar_ui() -> void:
	var h: Hud = main.hud
	ui = CanvasLayer.new()
	ui.layer = 11
	ui.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(ui)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(root)
	# topo: onda e quantos faltam
	var topo := VBoxContainer.new()
	topo.set_anchors_preset(Control.PRESET_CENTER_TOP)
	topo.grow_horizontal = Control.GROW_DIRECTION_BOTH
	topo.position.y = 14
	topo.alignment = BoxContainer.ALIGNMENT_CENTER
	topo.mouse_filter = Control.MOUSE_FILTER_IGNORE
	lb_onda = h._label("ONDA 1", h.font_title, 46, Color("e8b10d"))
	lb_onda.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lb_restam = h._label("", h.font_label, 15, Color("d8d2c2"))
	lb_restam.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	topo.add_child(lb_onda)
	topo.add_child(lb_restam)
	root.add_child(topo)
	# canto de cima à esquerda: vida e nível
	var esq := VBoxContainer.new()
	esq.position = Vector2(22, 18)
	esq.add_theme_constant_override("separation", 4)
	esq.mouse_filter = Control.MOUSE_FILTER_IGNORE
	esq.add_child(h._label("VIDA", h.font_label, 13, Color("e06a5a")))
	bar_vida = _barra(Color("c8402e"), 240)
	esq.add_child(bar_vida)
	lb_nivel = h._label("NÍVEL 1", h.font_label, 13, Color("e8c547"))
	esq.add_child(lb_nivel)
	bar_xp = _barra(Color("e8b10d"), 240)
	bar_xp.custom_minimum_size.y = 7
	esq.add_child(bar_xp)
	root.add_child(esq)
	# canto de cima à direita: abates
	lb_abates = h._label("ABATES 0", h.font_label, 16)
	lb_abates.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	lb_abates.offset_left = -360
	lb_abates.offset_right = -28
	lb_abates.offset_top = -112
	lb_abates.offset_bottom = -88
	lb_abates.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	root.add_child(lb_abates)
	# canto de baixo à direita: balas
	lb_bala = h._label("12 / 48", h.font_title, 52)
	lb_bala.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	lb_bala.offset_left = -420
	lb_bala.offset_right = -28
	lb_bala.offset_top = -88
	lb_bala.offset_bottom = -20
	lb_bala.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	lb_bala.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	root.add_child(lb_bala)
	# mira
	mira_ui = Control.new()
	mira_ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	mira_ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mira_ui.draw.connect(_desenhar_mira)
	root.add_child(mira_ui)
	# escolha de melhoria
	painel_melhoria = PanelContainer.new()
	painel_melhoria.add_theme_stylebox_override("panel", h._panel_style(0.93))
	painel_melhoria.set_anchors_preset(Control.PRESET_CENTER)
	painel_melhoria.grow_horizontal = Control.GROW_DIRECTION_BOTH
	painel_melhoria.grow_vertical = Control.GROW_DIRECTION_BOTH
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	vb.add_child(h._label("Subiu de nível", h.font_title, 52, Color("e8b10d")))
	vb.add_child(h._label("ESCOLHA UMA MELHORIA", h.font_label, 14, Color("b8b2a2")))
	caixa_opcoes = VBoxContainer.new()
	caixa_opcoes.add_theme_constant_override("separation", 8)
	vb.add_child(caixa_opcoes)
	painel_melhoria.add_child(vb)
	painel_melhoria.visible = false
	root.add_child(painel_melhoria)
	# fim de partida
	painel_fim = PanelContainer.new()
	painel_fim.add_theme_stylebox_override("panel", h._panel_style(0.93))
	painel_fim.set_anchors_preset(Control.PRESET_CENTER)
	painel_fim.grow_horizontal = Control.GROW_DIRECTION_BOTH
	painel_fim.grow_vertical = Control.GROW_DIRECTION_BOTH
	var vf := VBoxContainer.new()
	vf.add_theme_constant_override("separation", 10)
	lb_fim = h._label("", h.font_title, 56, Color("e06a5a"))
	lb_fim_sub = h._label("", h.font_bold, 20)
	vf.add_child(lb_fim)
	vf.add_child(lb_fim_sub)
	for b in [["Jogar de novo", "de_novo"], ["Ir para o prólogo", "prologo"]]:
		var btn := Button.new()
		btn.name = b[1]
		btn.text = b[0]
		btn.add_theme_font_override("font", h.font_bold)
		btn.add_theme_font_size_override("font_size", 22)
		btn.custom_minimum_size = Vector2(320, 46)
		btn.pressed.connect(main.on_pause_button.bind("restart" if b[1] == "de_novo" else "begin"))
		vf.add_child(btn)
	painel_fim.add_child(vf)
	painel_fim.visible = false
	root.add_child(painel_fim)

func _atualizar_ui() -> void:
	lb_onda.text = "ONDA %d" % maxi(onda, 1)
	var faltam := maxi(restam, 0) + _vivos()
	lb_restam.text = ("%d INFECTADOS" % faltam) if faltam > 0 else "PRÓXIMA ONDA CHEGANDO"
	if is_instance_valid(p):
		bar_vida.max_value = p.vida_max
		bar_vida.value = maxf(p.vida, 0.0)
	lb_nivel.text = "NÍVEL %d" % nivel
	bar_xp.max_value = xp_prox
	bar_xp.value = xp
	lb_abates.text = "ABATES %d" % abates
	if _recarga_t > 0.0:
		lb_bala.text = "recarregando..."
		lb_bala.label_settings.font_size = 30
	else:
		lb_bala.text = "%d / %d" % [pente, reserva]
		lb_bala.label_settings.font_size = 52
		lb_bala.label_settings.font_color = Color("e06a5a") if pente <= 3 else Color("ece6d6")
	mira_ui.queue_redraw()

func _desenhar_mira() -> void:
	if _fim or not is_instance_valid(p) or main.cam.is_position_behind(_mira):
		return
	var vp := mira_ui.get_viewport()
	var esc := vp.get_visible_rect().size / Vector2(vp.size)
	var s: Vector2 = main.cam.unproject_position(_mira) * esc
	if _mira_mouse and _rato_t > 0.0:
		s = vp.get_mouse_position()
	var cor := Color(1.0, 0.85, 0.4, 0.9)
	mira_ui.draw_arc(s, 11.0, 0.0, TAU, 24, cor, 2.0)
	for v in [Vector2(1, 0), Vector2(-1, 0), Vector2(0, 1), Vector2(0, -1)]:
		mira_ui.draw_line(s + v * 6.0, s + v * 15.0, cor, 2.0)
