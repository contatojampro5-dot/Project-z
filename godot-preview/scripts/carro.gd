extends Node3D
class_name Carro
## Veículos brasileiros (hatch popular, sedã, Kombi, ônibus, viatura, ambulância) montados por código.
## Estados: parado, andando, batido, pegando fogo, queimado. Sem tremor de tela: a batida vem com
## faíscas, vidro, fumaça e luz.

static var _malhas := {}
var tipo := "hatch"
var cor := Color("c0392b")
var estado := "parado"
var vel := 0.0
var alvo := Vector3.ZERO
var caminho: Array = []
var ao_chegar := "bater"        # "bater", "sumir", "voltar" (trânsito)
var volta_de := Vector3.ZERO
var fogo_em := -1.0             # segundos depois da batida para pegar fogo
var explode_em := -1.0
var cena: Node = null           # diretor (efeitos, sons, gente por perto)
var corpo: MeshInstance3D
var giroflex: Array[OmniLight3D] = []
var farol: SpotLight3D
var _t := 0.0
var _baixo := -1
var _som: AudioStreamPlayer3D
var tam := Vector2(4.0, 1.75)

const CORES := ["c0392b", "e8e4d8", "2c3e50", "8a9094", "d4a017", "1f4e79", "2b2b2b", "7a1f2a", "b9b9b9", "3a5a3a", "e7e3d6", "5a6470"]

func montar(c: Node, t := "hatch", cor_hex := "") -> Carro:
	cena = c
	tipo = t
	cor = Color(cor_hex if cor_hex != "" else CORES.pick_random())
	match tipo:
		"viatura":
			cor = Color("ecebe6")
		"ambulancia":
			cor = Color("f2f1ec")
		"onibus":
			cor = Color("2f5c8a")
	corpo = MeshInstance3D.new()
	corpo.mesh = malha(tipo, cor)
	add_child(corpo)
	tam = {"hatch": Vector2(3.9, 1.7), "sedan": Vector2(4.4, 1.75), "kombi": Vector2(4.3, 1.8),
		"onibus": Vector2(12.0, 2.6), "viatura": Vector2(4.5, 1.8), "ambulancia": Vector2(5.2, 2.0)}.get(tipo, Vector2(4, 1.8))
	if tipo in ["viatura", "ambulancia"]:
		for k in 2:
			var l := OmniLight3D.new()
			l.light_color = Color(1, 0.08, 0.06) if k == 0 else Color(0.15, 0.3, 1.0)
			l.omni_range = 9.0
			l.light_energy = 0.0
			l.position = Vector3(0.0, 2.2, -0.35 + k * 0.7)
			add_child(l)
			giroflex.append(l)
	return self

func _ready() -> void:
	if estado != "andando":
		_registrar()

func _registrar() -> void:
	if _baixo >= 0 or cena == null:
		return
	var f := global_transform.basis.x
	var half := Vector2(abs(f.x) * tam.x + abs(f.z) * tam.y, abs(f.z) * tam.x + abs(f.x) * tam.y) * 0.5
	_baixo = cena.col.baixo(Rect2(Vector2(global_position.x, global_position.z) - half * 0.9, half * 1.8))

func _soltar() -> void:
	if _baixo >= 0:
		cena.col.baixos[_baixo] = Rect2()
		_baixo = -1

func dirigir(pontos: Array, velocidade: float, depois := "bater") -> void:
	caminho = pontos.duplicate()
	vel = velocidade
	ao_chegar = depois
	estado = "andando"
	_soltar()
	if farol == null:
		farol = SpotLight3D.new()
		farol.position = Vector3(tam.x * 0.5, 0.8, 0)
		farol.rotation_degrees = Vector3(-8, -90, 0)
		farol.spot_range = 22.0
		farol.spot_angle = 28.0
		farol.light_color = Color(1.0, 0.93, 0.78)
		farol.light_energy = 0.0
		add_child(farol)
	if caminho.size() > 0:
		_mirar(caminho[0])

func _mirar(p: Vector3) -> void:
	var d := p - global_position
	if Vector2(d.x, d.z).length() > 0.01:
		rotation.y = atan2(-d.z, d.x)

func sirene(liga: bool) -> void:
	if liga and _som == null and cena:
		_som = cena.audio.loop_em("sirene", self, -6.0)
	elif not liga and _som:
		_som.queue_free()
		_som = null

func _physics_process(delta: float) -> void:
	_t += delta
	if not giroflex.is_empty():
		var on := fmod(_t, 0.5) < 0.25
		giroflex[0].light_energy = 3.0 if on else 0.0
		giroflex[1].light_energy = 0.0 if on else 3.0
	if farol:
		farol.light_energy = 3.5 * Ambiente.noite + 0.6 if estado == "andando" else 0.0
	if estado == "andando" and not caminho.is_empty():
		var p: Vector3 = caminho[0]
		var d := p - global_position
		d.y = 0
		var passo := vel * delta
		if d.length() <= passo:
			global_position = Vector3(p.x, global_position.y, p.z)
			caminho.pop_front()
			if caminho.is_empty():
				match ao_chegar:
					"voltar":
						global_position = volta_de
						caminho = [alvo]
					"sumir":
						queue_free()
					_:
						bater()
			else:
				_mirar(caminho[0])
		else:
			global_position += d.normalized() * passo
			_atropela()
	if explode_em > 0:
		explode_em -= delta
		if explode_em <= 0:
			explodir()

func _atropela() -> void:
	if cena == null:
		return
	var f := global_transform.basis.x
	for a in cena.perto(global_position + f * tam.x * 0.4, tam.y * 0.9):
		if a.has_method("atropelado"):
			a.atropelado(f * vel, self)

func bater(fogo := -2.0, explode := -2.0) -> void:
	estado = "batido"
	vel = 0.0
	if farol:
		farol.light_energy = 0.0
	_registrar()
	var frente := global_position + global_transform.basis.x * tam.x * 0.5 + Vector3(0, 0.6, 0)
	if cena:
		cena.audio.som("batida", frente, 6.0)
		FX.faiscas(cena.efeitos, frente, 40)
		FX.vidro(cena.efeitos, frente)
		FX.fumaca(self, Vector3(tam.x * 0.4, 1.0, 0), 0.7, false)
	# amassado: a frente sobe e o carro gira um pouco (sem tremer a tela)
	var tw := create_tween()
	tw.tween_property(self, "rotation:y", rotation.y + randf_range(-0.35, 0.35), 0.25).set_trans(Tween.TRANS_BACK)
	tw.parallel().tween_property(corpo, "rotation:z", randf_range(-0.05, 0.05), 0.2)
	var f2: float = fogo if fogo > -2.0 else fogo_em
	var e2: float = explode if explode > -2.0 else explode_em
	if f2 >= 0:
		get_tree().create_timer(f2, false).timeout.connect(pegar_fogo)
	if e2 > 0:
		explode_em = e2

func pegar_fogo() -> void:
	if estado in ["pegando_fogo", "queimado"] or not is_inside_tree():
		return
	estado = "pegando_fogo"
	FX.fogo(self, Vector3(0, 1.0, 0), 1.0 if tipo != "onibus" else 2.2)
	if cena:
		cena.audio.loop_em("fogo", self, -8.0)

func explodir() -> void:
	if cena == null:
		return
	FX.explosao(cena.efeitos, global_position + Vector3(0, 1.0, 0), 1.6 if tipo != "onibus" else 2.6)
	cena.audio.som("explosao", global_position, 10.0)
	cena.marca(global_position, 5.0, "queimado")
	for a in cena.perto(global_position, 9.0):
		if a.has_method("empurrado"):
			a.empurrado((a.global_position - global_position).normalized() * 12.0, 1.2)
	if estado != "pegando_fogo":
		pegar_fogo()
	queimar()

func queimar() -> void:
	estado = "queimado"
	var preto := Cidade.m_cor(Color("1c1916"))
	for i in corpo.mesh.get_surface_count():
		corpo.set_surface_override_material(i, preto if i != 2 else Cidade.m_cor(Color("0a0a0a")))
	corpo.position.y = -0.18

# ------------------------------------------------------------------ malhas
static func malha(t: String, c: Color) -> ArrayMesh:
	var k := t + c.to_html()
	if _malhas.has(k):
		return _malhas[k]
	var L := Lote.new()
	var lata := Cidade.m_cor(c, 0.0, 0.35)
	var vidro := Cidade.m_cor(Color("1a222c"), 0.0, 0.6)
	var preto := Cidade.m_cor(Color("141414"))
	var farol := Cidade.m_cor(Color(1.0, 0.95, 0.8), 2.0)
	var lanterna := Cidade.m_cor(Color(0.9, 0.08, 0.06), 1.5)
	# o comprimento fica no eixo X (frente = +X)
	match t:
		"onibus":
			L.caixa(lata, Vector3(0, 0.35, 0), Vector3(12.0, 2.9, 2.55))
			L.caixa(Cidade.m_cor(Color("e8e4da")), Vector3(0, 0.35, 0), Vector3(12.02, 0.55, 2.57))
			L.caixa(vidro, Vector3(0.4, 1.55, 0), Vector3(10.4, 1.1, 2.6))
			L.caixa(vidro, Vector3(5.95, 1.2, 0), Vector3(0.15, 1.6, 2.2))
			L.caixa(Cidade.m_cor(Color("d6d2c6")), Vector3(0, 3.25, 0), Vector3(11.0, 0.2, 2.2))
			_rodas(L, preto, [Vector3(4.2, 0, 1.2), Vector3(4.2, 0, -1.2), Vector3(-3.6, 0, 1.2), Vector3(-3.6, 0, -1.2)], 0.5)
			L.caixa(farol, Vector3(6.0, 0.7, 0.9), Vector3(0.06, 0.25, 0.4))
			L.caixa(farol, Vector3(6.0, 0.7, -0.9), Vector3(0.06, 0.25, 0.4))
		"kombi":
			L.caixa(lata, Vector3(0, 0.35, 0), Vector3(4.3, 1.0, 1.75))
			L.caixa(Cidade.m_cor(Color("ecebe4")), Vector3(0, 1.35, 0), Vector3(4.3, 0.85, 1.75))
			L.caixa(vidro, Vector3(0.2, 1.45, 0), Vector3(4.32, 0.55, 1.77))
			L.caixa(Cidade.m_cor(Color("ecebe4")), Vector3(1.6, 0.6, 0), Vector3(1.0, 0.2, 1.77))
			_rodas(L, preto, [Vector3(1.4, 0, 0.82), Vector3(1.4, 0, -0.82), Vector3(-1.4, 0, 0.82), Vector3(-1.4, 0, -0.82)], 0.32)
			L.caixa(farol, Vector3(2.16, 0.8, 0.6), Vector3(0.05, 0.18, 0.18))
			L.caixa(farol, Vector3(2.16, 0.8, -0.6), Vector3(0.05, 0.18, 0.18))
		"ambulancia":
			L.caixa(lata, Vector3(0, 0.35, 0), Vector3(5.2, 2.2, 1.95))
			L.caixa(Cidade.m_cor(Color("c41f24")), Vector3(0, 1.1, 0), Vector3(5.22, 0.25, 1.97))
			L.caixa(vidro, Vector3(2.0, 1.55, 0), Vector3(1.2, 0.7, 1.97))
			L.caixa(Cidade.m_cor(Color(1, 0.2, 0.2), 3.0), Vector3(1.6, 2.55, -0.4), Vector3(0.3, 0.15, 0.6))
			L.caixa(Cidade.m_cor(Color(0.2, 0.35, 1), 3.0), Vector3(1.6, 2.55, 0.4), Vector3(0.3, 0.15, 0.6))
			_rodas(L, preto, [Vector3(1.7, 0, 0.9), Vector3(1.7, 0, -0.9), Vector3(-1.7, 0, 0.9), Vector3(-1.7, 0, -0.9)], 0.36)
			L.caixa(farol, Vector3(2.62, 0.8, 0.7), Vector3(0.05, 0.2, 0.25))
			L.caixa(farol, Vector3(2.62, 0.8, -0.7), Vector3(0.05, 0.2, 0.25))
		_:
			var comp := 4.4 if t != "hatch" else 3.9
			var larg := 1.75 if t != "hatch" else 1.7
			L.caixa(lata, Vector3(0, 0.3, 0), Vector3(comp, 0.62, larg))
			# cabine com para-brisa inclinado (prisma)
			var traseira := -comp * 0.38 if t == "hatch" else -comp * 0.25
			var frente := comp * 0.12
			_cabine(L, lata, vidro, traseira, frente, larg * 0.92, 0.92, 0.6)
			if t == "viatura":
				L.caixa(Cidade.m_cor(Color("1d2c4f")), Vector3(0, 0.3, 0), Vector3(comp * 0.42, 0.63, larg + 0.02))
				L.caixa(preto, Vector3(-0.3, 1.55, 0), Vector3(0.35, 0.12, 1.2))
				L.caixa(Cidade.m_cor(Color(1, 0.2, 0.2), 3.0), Vector3(-0.3, 1.62, -0.32), Vector3(0.3, 0.12, 0.5))
				L.caixa(Cidade.m_cor(Color(0.2, 0.35, 1), 3.0), Vector3(-0.3, 1.62, 0.32), Vector3(0.3, 0.12, 0.5))
			_rodas(L, preto, [Vector3(comp * 0.32, 0, larg * 0.47), Vector3(comp * 0.32, 0, -larg * 0.47), Vector3(-comp * 0.32, 0, larg * 0.47), Vector3(-comp * 0.32, 0, -larg * 0.47)], 0.3)
			L.caixa(farol, Vector3(comp * 0.5, 0.62, larg * 0.32), Vector3(0.05, 0.14, 0.3))
			L.caixa(farol, Vector3(comp * 0.5, 0.62, -larg * 0.32), Vector3(0.05, 0.14, 0.3))
			L.caixa(lanterna, Vector3(-comp * 0.5, 0.62, larg * 0.36), Vector3(0.05, 0.16, 0.24))
			L.caixa(lanterna, Vector3(-comp * 0.5, 0.62, -larg * 0.36), Vector3(0.05, 0.16, 0.24))
	var tmp := Node3D.new()
	var mi := L.montar(tmp)
	var mesh: ArrayMesh = mi.mesh
	tmp.free()
	_malhas[k] = mesh
	return mesh

static func _rodas(L: Lote, mt: Material, pos: Array, r: float) -> void:
	for p in pos:
		L.caixa(mt, p, Vector3(r * 2.0, r * 2.0, 0.26))

static func _cabine(L: Lote, lata: Material, vidro: Material, x0: float, x1: float, larg: float, y0: float, h: float) -> void:
	var w := larg * 0.5
	var topo0 := x0 + 0.25
	var topo1 := x1 - 0.55
	var y1 := y0 + h
	# vidros laterais e para-brisas
	L.quad(vidro, Vector3(x0, y0, w), Vector3(x1 - x0, 0, 0), Vector3(0, h, 0) + Vector3(topo0 - x0, 0, -0.1) * 0.0 + Vector3(0, 0, -0.08), Color.WHITE)
	L.quad(vidro, Vector3(x1, y0, -w), Vector3(x0 - x1, 0, 0), Vector3(0, h, 0.08), Color.WHITE)
	L.quad(vidro, Vector3(x1, y0, w), Vector3(0, 0, -2.0 * w), Vector3(topo1 - x1, h, 0), Color.WHITE)
	L.quad(vidro, Vector3(x0, y0, -w), Vector3(0, 0, 2.0 * w), Vector3(topo0 - x0, h, 0), Color.WHITE)
	# teto
	L.quad(lata, Vector3(topo0, y1, w - 0.08), Vector3(topo1 - topo0, 0, 0), Vector3(0, 0, -2.0 * w + 0.16), Color.WHITE)
