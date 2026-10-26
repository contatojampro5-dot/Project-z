extends Node3D
class_name Cidade
## Monta a cidade 3D inteira por código (Deméter + Hefesto). Ver Mapa para a planta.

static var _mats := {}
var col: Colisao
var postes: Array[Vector3] = []        # cabeças das luminárias (o diretor acende as perto da câmera)
var refletores: Array[SpotLight3D] = []
var portao_mercado: Node3D
var cortes: Array = []      # [parede, área]: paredes internas que abaixam quando o foco entra na área (estilo Zomboid)
var predios: Array[Predio] = []
var fac_oeste: Predio
var mercado: Predio
var hospital: Predio
var tela_tcc: MeshInstance3D

# ------------------------------------------------------------------ materiais
static func m(tex_nome: String, _escala := 1.0, cor := Color.WHITE) -> StandardMaterial3D:
	var k := tex_nome + str(cor)
	if not _mats.has(k):
		var mt := StandardMaterial3D.new()
		mt.albedo_texture = Predio.tex(tex_nome + ".png")
		mt.albedo_color = cor
		mt.roughness = 0.95
		mt.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
		mt.cull_mode = BaseMaterial3D.CULL_DISABLED
		_mats[k] = mt
	return _mats[k]

static func m_cor(c: Color, emissao := 0.0, metal := 0.0) -> StandardMaterial3D:
	var k := "cor" + str(c) + str(emissao) + str(metal)
	if not _mats.has(k):
		var mt := StandardMaterial3D.new()
		mt.albedo_color = c
		mt.roughness = 0.85 if metal == 0.0 else 0.35
		mt.metallic = metal
		mt.cull_mode = BaseMaterial3D.CULL_DISABLED
		if emissao > 0.0:
			mt.emission_enabled = true
			mt.emission = c
			mt.emission_energy_multiplier = emissao
		_mats[k] = mt
	return _mats[k]

static func m_tex_quad(tex_nome: String, emissao := 0.0, transparente := false) -> StandardMaterial3D:
	var k := "q" + tex_nome + str(emissao) + str(transparente)
	if not _mats.has(k):
		var mt := StandardMaterial3D.new()
		mt.albedo_texture = Predio.tex(tex_nome + ".png")
		mt.cull_mode = BaseMaterial3D.CULL_DISABLED
		mt.roughness = 0.9
		if transparente:
			mt.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
			mt.alpha_scissor_threshold = 0.4
		if emissao > 0.0:
			mt.emission_enabled = true
			mt.emission_texture = mt.albedo_texture
			mt.emission_energy_multiplier = emissao
		_mats[k] = mt
	return _mats[k]

# ------------------------------------------------------------------ montagem
func montar(c: Colisao) -> Cidade:
	col = c
	var rng := RandomNumberGenerator.new()
	rng.seed = 2026
	_chao()
	_ruas()
	_calcadas()
	_faculdade()
	_hospital()
	_mercado()
	_estadio()
	_bairro(rng)
	_morro(rng)
	_ruas_moveis(rng)
	_placas_de_rua()
	_fundo(rng)
	return self

func _chao() -> void:
	var L := Lote.new()
	var lote := m("calcada", 0.1, Color(0.62, 0.6, 0.56))
	L.quad(lote, Vector3(-300, 0, 200), Vector3(700, 0, 0), Vector3(0, 0, -355), Color.WHITE, Vector2.ZERO, true, 0.1)
	L.montar(self, "chao", false)

func _ruas() -> void:
	var L := Lote.new()
	var asf := m("asfalto", 1.0 / 9.0)
	for r in Mapa.RUAS:
		L.quad(asf, Vector3(r.position.x, 0.02, r.end.y), Vector3(r.size.x, 0, 0), Vector3(0, 0, -r.size.y), Color.WHITE, Vector2.ZERO, true, 1.0 / 9.0)
	var branco := m_cor(Color(0.86, 0.85, 0.8))
	var amarelo := m_cor(Color(0.86, 0.68, 0.2))
	# avenida: faixas tracejadas, bordas, faixa de ônibus
	for zf in [-7.5, -4.0, 4.0, 7.5]:
		var x := -258.0
		while x < 358:
			if not _no_cruzamento(x):
				L.quad(branco, Vector3(x, 0.04, zf + 0.08), Vector3(3.0, 0, 0), Vector3(0, 0, -0.16))
			x += 7.0
	for zf in [-10.6, 10.6]:
		L.quad(branco, Vector3(-260, 0.04, zf + 0.1), Vector3(620, 0, 0), Vector3(0, 0, -0.2))
	# ruas: faixa dupla amarela
	for r in [Mapa.H0, Mapa.H2]:
		for dz in [-0.15, 0.15]:
			L.quad(amarelo, Vector3(r.position.x, 0.04, r.get_center().y + dz + 0.06), Vector3(r.size.x, 0, 0), Vector3(0, 0, -0.12))
	for r in [Mapa.V1, Mapa.V2]:
		for dx in [-0.15, 0.15]:
			L.quad(amarelo, Vector3(r.get_center().x + dx - 0.06, 0.04, r.end.y), Vector3(0.12, 0, 0), Vector3(0, 0, -r.size.y))
	# faixas de pedestre nos cruzamentos
	for v in [Mapa.V1, Mapa.V2]:
		for h in [Mapa.AV, Mapa.H0, Mapa.H2]:
			for zz in [h.position.y - 3.4, h.end.y + 0.6]:
				var x2: float = v.position.x + 0.4
				while x2 < v.end.x - 0.6:
					L.quad(branco, Vector3(x2, 0.045, zz + 2.8), Vector3(0.55, 0, 0), Vector3(0, 0, -2.8))
					x2 += 1.1
			for xx in [v.position.x - 3.4, v.end.x + 0.6]:
				var z2: float = h.position.y + 0.4
				while z2 < h.end.y - 0.6:
					if not Mapa.CANTEIRO.has_point(Vector2(xx + 1, z2)):
						L.quad(branco, Vector3(xx, 0.045, z2 + 0.55), Vector3(2.8, 0, 0), Vector3(0, 0, -0.55))
					z2 += 1.1
	L.montar(self, "ruas", false)
	# canteiro central com árvores
	var L2 := Lote.new()
	var meio := m_cor(Color("a9a69a"))
	var grama := m("grama", 0.25)
	var x3 := -260.0
	while x3 < 360:
		var x4: float = min(x3 + 40.0, 360.0)
		if not _no_cruzamento((x3 + x4) * 0.5) and not _no_cruzamento(x3 + 1) and not _no_cruzamento(x4 - 1):
			L2.caixa(meio, Vector3((x3 + x4) * 0.5, 0, 0), Vector3(x4 - x3, 0.2, 2.0))
			L2.quad(grama, Vector3(x3 + 0.15, 0.21, 0.85), Vector3(x4 - x3 - 0.3, 0, 0), Vector3(0, 0, -1.7), Color.WHITE, Vector2.ZERO, true, 0.25)
			col.ret(Rect2(x3, -1, x4 - x3, 2))
		x3 += 40.0
	L2.montar(self, "canteiro")

func _no_cruzamento(x: float) -> bool:
	return abs(x - Mapa.V1.get_center().x) < 14.0 or abs(x - Mapa.V2.get_center().x) < 14.0

func _calcadas() -> void:
	var L := Lote.new()
	var meio_fio := m_cor(Color("b5b1a6"))
	var sp := m("calcada_sp", 0.5)
	var conc := m("calcada", 0.25)
	for r in Mapa.RUAS:
		var larg: float = Mapa.CALCADA_AV if r == Mapa.AV else Mapa.CALCADA
		var mat := sp if r == Mapa.AV else conc
		var esc := 0.5 if r == Mapa.AV else 0.25
		if r.size.x > r.size.y:   # horizontal
			for zz in [r.position.y - larg, r.end.y]:
				_faixa_calcada(L, mat, meio_fio, Rect2(r.position.x, zz, r.size.x, larg), esc)
		else:
			for xx in [r.position.x - larg, r.end.x]:
				_faixa_calcada(L, mat, meio_fio, Rect2(xx, r.position.y, larg, r.size.y), esc)
	L.montar(self, "calcadas", false)

func _faixa_calcada(L: Lote, mat: Material, meio_fio: Material, r: Rect2, esc: float) -> void:
	L.quad(mat, Vector3(r.position.x, 0.15, r.end.y), Vector3(r.size.x, 0, 0), Vector3(0, 0, -r.size.y), Color.WHITE, Vector2.ZERO, true, esc)
	L.caixa(meio_fio, Vector3(r.get_center().x, 0, r.get_center().y), Vector3(r.size.x, 0.15, r.size.y))

# ------------------------------------------------------------------ prédios
func predio(r: Rect2, andares: int, parede: int, lojas := "", telhado := "laje", oco := false) -> Predio:
	var p := Predio.new()
	add_child(p)
	p.montar(r, andares, parede, lojas, randf(), telhado)
	p.oco = oco
	predios.append(p)
	if not oco:
		col.ret(r)
	return p

func _placas_de_rua() -> void:
	## placa azul de esquina com o nome das duas ruas (nomes inventados, ver gerar_texturas.py)
	var esquinas := [[Vector3(7.6, 0, -13.6), "av", "v1"], [Vector3(192.4, 0, -13.6), "av", "v2"], [Vector3(7.6, 0, 13.6), "av", "v1"],
		[Vector3(192.4, 0, 13.6), "av", "v2"], [Vector3(192.4, 0, 93.6), "h2", "v2"], [Vector3(-7.6, 0, 93.6), "h2", "v1"],
		[Vector3(192.4, 0, -142.4), "h0", "v2"], [Vector3(209.0, 0, -157.0), "trilha", ""]]
	var L := Lote.new()
	var poste := m_cor(Color("3a3c3f"), 0, 0.5)
	for e in esquinas:
		var p: Vector3 = e[0]
		L.tubo(poste, p, p + Vector3(0, 3.6, 0), 0.05)
		col.circ(Vector2(p.x, p.z), 0.15)
		_placa("placa_rua_%s" % e[1], p + Vector3(0, 3.35, 0.06), 1.7, 0.42, 0.0, 0.25)
		if e[2] != "":
			_placa("placa_rua_%s" % e[2], p + Vector3(-0.06, 2.9, 0), 1.7, 0.42, -PI * 0.5, 0.25)
	L.montar(self, "placas_de_rua")

func _no_topo(p: Predio, n: Node3D) -> void:
	## pendura a placa no telhado do prédio: some junto quando o personagem entra
	n.reparent(p.topo)

func _placa(tex_nome: String, centro: Vector3, larg: float, alt: float, giro := 0.0, luz := 0.6) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(larg, alt)
	mi.mesh = q
	mi.material_override = m_tex_quad(tex_nome, luz)
	mi.position = centro
	mi.rotation.y = giro
	add_child(mi)
	return mi

func _faculdade() -> void:
	var c_parede := 6   # concreto
	var fac_n := predio(Mapa.FAC_N, 4, c_parede, "", "laje", true)
	_ala_norte()
	fac_oeste = predio(Mapa.FAC_W, 4, c_parede, "", "laje", true)
	predio(Mapa.FAC_E, 4, c_parede)
	# colisão da ala oeste: sólida fora da sala do TCC; a sala tem porta para o pátio
	var W := Mapa.FAC_W
	var S := Mapa.SALA_TCC
	col.ret(Rect2(W.position.x, W.position.y, W.size.x, S.position.y - W.position.y))
	col.ret(Rect2(W.position.x, S.end.y, W.size.x, W.end.y - S.end.y))
	col.ret(Rect2(W.position.x, S.position.y, 2.0, S.size.y))
	col.ret(Rect2(W.end.x - 0.4, S.position.y, 0.4, 12.0))
	col.ret(Rect2(W.end.x - 0.4, S.position.y + 16.0, 0.4, 4.0))
	var L := Lote.new()
	# pátio: grama, caminhos, quadra, bancos, mastro
	var grama := m("grama", 0.2)
	L.quad(grama, Vector3(48, 0.03, -60), Vector3(52, 0, 0), Vector3(0, 0, -52), Color.WHITE, Vector2.ZERO, true, 0.2)
	var piso := m("calcada", 0.25)
	L.quad(piso, Vector3(94, 0.035, -21), Vector3(12, 0, 0), Vector3(0, 0, -95), Color.WHITE, Vector2.ZERO, true, 0.25)
	L.quad(piso, Vector3(44, 0.035, -82), Vector3(50, 0, 0), Vector3(0, 0, -8), Color.WHITE, Vector2.ZERO, true, 0.25)
	var Q := Mapa.QUADRA
	L.quad(m_cor(Color("3d6f8e")), Vector3(Q.position.x - 2, 0.04, Q.end.y + 2), Vector3(Q.size.x + 4, 0, 0), Vector3(0, 0, -Q.size.y - 4))
	L.quad(m_cor(Color("b5683a")), Vector3(Q.position.x, 0.045, Q.end.y), Vector3(Q.size.x, 0, 0), Vector3(0, 0, -Q.size.y))
	var linha := m_cor(Color("e8e2d0"))
	L.quad(linha, Vector3(Q.position.x, 0.05, Q.get_center().y + 0.08), Vector3(Q.size.x, 0, 0), Vector3(0, 0, -0.16))
	for gx in [Q.position.x + Q.size.x * 0.5]:
		L.tubo(m_cor(Color("5a5a5a")), Vector3(gx, 0, Q.position.y + 1), Vector3(gx, 3.0, Q.position.y + 1), 0.06)
		L.tubo(m_cor(Color("5a5a5a")), Vector3(gx, 0, Q.end.y - 1), Vector3(gx, 3.0, Q.end.y - 1), 0.06)
	var madeira := m_cor(Color("6a4a32"))
	for b in [Vector3(60, 0, -86), Vector3(70, 0, -86), Vector3(80, 0, -86), Vector3(60, 0, -70), Vector3(80, 0, -50)]:
		L.caixa(madeira, b, Vector3(2.2, 0.45, 0.6))
		col.ret(Rect2(b.x - 1.1, b.z - 0.3, 2.2, 0.6))
	L.tubo(m_cor(Color("cfcfcf"), 0, 0.6), Vector3(100, 0, -34), Vector3(100, 9, -34), 0.07)
	# muro com o portão (o portão fica aberto)
	var muro := m_cor(Color("c7c0b0"))
	var z := Mapa.FAC_MURO_Z
	var pg := Mapa.FAC_PORTAO
	L.caixa(muro, Vector3((22 + pg.x) * 0.5, 0, z), Vector3(pg.x - 22, 2.4, 0.4))
	L.caixa(muro, Vector3((pg.y + 178) * 0.5, 0, z), Vector3(178 - pg.y, 2.4, 0.4))
	col.ret(Rect2(22, z - 0.2, pg.x - 22, 0.4))
	col.ret(Rect2(pg.y, z - 0.2, 178 - pg.y, 0.4))
	col.ret(Rect2(21.6, -54, 0.4, 34))
	col.ret(Rect2(178, -54, 0.4, 34))
	L.caixa(muro, Vector3(22, 0, -37), Vector3(0.4, 2.4, 34))
	L.caixa(muro, Vector3(178.2, 0, -37), Vector3(0.4, 2.4, 34))
	for px in [pg.x - 0.4, pg.y + 0.4]:
		L.caixa(m_cor(Color("8a8478")), Vector3(px, 0, z), Vector3(0.9, 4.6, 0.9))
	L.caixa(m_cor(Color("2a2d32")), Vector3((pg.x + pg.y) * 0.5, 4.2, z), Vector3(pg.y - pg.x + 1.6, 0.8, 0.6))
	L.montar(self, "faculdade")
	_placa("placa_faculdade", Vector3((pg.x + pg.y) * 0.5, 4.6, z + 0.35), 11.0, 2.0, 0.0, 0.8)
	_no_topo(fac_n, _placa("placa_faculdade", Vector3(100, 10.2, Mapa.FAC_N.end.y + 0.06), 18.0, 3.4, 0.0, 0.5))
	for t in [Vector2(56, -40), Vector2(70, -30), Vector2(86, -44), Vector2(124, -36), Vector2(146, -46), Vector2(60, -104)]:
		_arvore_cidade(t)
	_sala_tcc()

func _sala_tcc() -> void:
	## A sala onde a Hannah espera a banca: carteiras, mesa do professor, projetor com o slide do TCC.
	var S := Mapa.SALA_TCC
	var L := Lote.new()
	L.quad(m_cor(Color("8a7a62")), Vector3(S.position.x, 0.06, S.end.y), Vector3(S.size.x + 2, 0, 0), Vector3(0, 0, -S.size.y))
	var cart := m_cor(Color("b89a6a"))
	var ferro := m_cor(Color("2a2b2e"))
	for i in 4:
		for j in 3:
			var p := Vector3(S.position.x + 5 + j * 4.5, 0, S.position.y + 6 + i * 3.4)
			L.caixa(cart, p + Vector3(0, 0.72, 0), Vector3(1.2, 0.05, 0.7))
			L.caixa(ferro, p, Vector3(0.08, 0.72, 0.6))
			L.caixa(m_cor(Color("3a4a6a")), p + Vector3(0, 0, 0.7), Vector3(0.45, 0.45, 0.45))
			col.ret(Rect2(p.x - 0.6, p.z - 0.35, 1.2, 0.7))
	L.caixa(m_cor(Color("5a3e28")), Vector3(S.position.x + 9, 0, S.position.y + 2.5), Vector3(3.2, 0.78, 1.0))
	col.ret(Rect2(S.position.x + 7.4, S.position.y + 2.0, 3.2, 1.0))
	# paredes internas da sala (abaixam quando a Hannah está dentro)
	var parede := Node3D.new()
	add_child(parede)
	var L2 := Lote.new()
	var pm := m_cor(Color("d9d2c2"))
	L2.caixa(pm, Vector3(S.get_center().x + 1, 0, S.position.y), Vector3(S.size.x + 2, 3.0, 0.25))
	L2.caixa(pm, Vector3(S.get_center().x + 1, 0, S.end.y), Vector3(S.size.x + 2, 3.0, 0.25))
	L2.caixa(pm, Vector3(S.position.x + 2, 0, S.get_center().y), Vector3(0.25, 3.0, S.size.y))
	L2.caixa(pm, Vector3(S.end.x + 1.7, 0, S.position.y + 6), Vector3(0.25, 3.0, 12))
	L2.caixa(pm, Vector3(S.end.x + 1.7, 0, S.end.y - 2), Vector3(0.25, 3.0, 4))
	L2.montar(parede, "paredes_sala")
	cortes.append([parede, S.grow(1.0)])
	L.montar(self, "sala_tcc")
	# slide do TCC na parede norte (acende)
	tela_tcc = _placa("slide_tcc", Vector3(S.position.x + 9, 1.8, S.position.y + 0.2), 6.4, 3.6, 0.0, 1.3)
	var luz := OmniLight3D.new()
	luz.position = Vector3(S.position.x + 9, 2.6, S.position.y + 3)
	luz.light_color = Color(0.75, 0.82, 1.0)
	luz.light_energy = 1.2
	luz.omni_range = 9.0
	add_child(luz)
	# tomada onde ela carrega o celular
	var L3 := Lote.new()
	L3.caixa(m_cor(Color("eeeeea")), Mapa.TOMADA + Vector3(0, 0.4, 0), Vector3(0.12, 0.18, 0.18))
	L3.montar(self, "tomada")

func _paredes_ocas(r: Rect2, vaos_sul: Array) -> void:
	## colisão das paredes de um prédio oco, com vãos (x0, x1) na fachada sul
	var e := 0.4
	col.ret(Rect2(r.position.x, r.position.y, r.size.x, e))
	col.ret(Rect2(r.position.x, r.position.y, e, r.size.y))
	col.ret(Rect2(r.end.x - e, r.position.y, e, r.size.y))
	var x := r.position.x
	for v in vaos_sul:
		col.ret(Rect2(x, r.end.y - e, v.x - x, e))
		x = v.y
	col.ret(Rect2(x, r.end.y - e, r.end.x - x, e))

func _ala_norte() -> void:
	## ala norte da faculdade: corredor com armários e murais, salas de aula com lousa e carteiras
	var N := Mapa.FAC_N
	var zc := Mapa.FAC_CORREDOR_Z
	var vaos := []
	for px in Mapa.FAC_PORTAS:
		vaos.append(Vector2(px - 1.6, px + 1.6))
	_paredes_ocas(N, vaos)
	var L := Lote.new()
	L.quad(m("piso_hospital", 0.25, Color(0.95, 0.9, 0.8)), Vector3(N.position.x, 0.06, N.end.y), Vector3(N.size.x, 0, 0), Vector3(0, 0, -N.size.y), Color.WHITE, Vector2.ZERO, true, 0.25)
	var cart := m_cor(Color("b89a6a"))
	var ferro := m_cor(Color("2a2b2e"))
	var cadeira := m_cor(Color("3a4a6a"))
	var armario := m_cor(Color("5d7d8e"), 0, 0.4)
	var parede := Node3D.new()
	add_child(parede)
	var Lp := Lote.new()
	var pm := m_cor(Color("d9d2c2"))
	var sala := 22.0
	var x := N.position.x + 0.4
	var k := 0
	while x < N.end.x - 4.0:
		var x1: float = minf(x + sala, N.end.x - 0.4)
		# parede entre o corredor e a sala (porta de 1,8 m) e a divisória entre salas
		var porta := x + 3.0
		Lp.caixa(pm, Vector3((x + porta) * 0.5, 0, zc), Vector3(porta - x, 3.0, 0.25))
		Lp.caixa(pm, Vector3((porta + 1.8 + x1) * 0.5, 0, zc), Vector3(x1 - porta - 1.8, 3.0, 0.25))
		col.ret(Rect2(x, zc - 0.15, porta - x, 0.3))
		col.ret(Rect2(porta + 1.8, zc - 0.15, x1 - porta - 1.8, 0.3))
		if x1 < N.end.x - 1.0:
			Lp.caixa(pm, Vector3(x1, 0, (N.position.y + zc) * 0.5), Vector3(0.25, 3.0, zc - N.position.y))
			col.ret(Rect2(x1 - 0.15, N.position.y, 0.3, zc - N.position.y))
		# lousa na parede norte e carteiras viradas para ela
		var meio := (x + x1) * 0.5
		var lousa := MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(7.0, 2.6)
		lousa.mesh = q
		lousa.material_override = m_tex_quad("lousa", 0.15)
		lousa.position = Vector3(meio, 1.7, N.position.y + 0.5)
		add_child(lousa)
		L.caixa(m_cor(Color("5a3e28")), Vector3(meio, 0, N.position.y + 2.4), Vector3(2.6, 0.78, 0.9))
		for i in 2:
			for j in 5:
				var p := Vector3(x + 3.2 + j * ((x1 - x - 6.0) / 4.0), 0, N.position.y + 5.0 + i * 2.6)
				if k % 3 == 1 and randf() < 0.3:
					L.caixa(cart, p + Vector3(0, 0.05, 0), Vector3(1.2, 0.05, 0.7), randf_range(0.6, 1.4))   # carteira caída
				else:
					L.caixa(cart, p + Vector3(0, 0.72, 0), Vector3(1.2, 0.05, 0.7))
					L.caixa(ferro, p, Vector3(0.08, 0.72, 0.6))
				L.caixa(cadeira, p + Vector3(0, 0, 0.8), Vector3(0.45, 0.45, 0.45))
		# armários e mural no corredor
		for a in 4:
			L.caixa(armario, Vector3(x + 9.0 + a * 0.9, 0, zc + 0.45), Vector3(0.85, 2.0, 0.5))
		col.ret(Rect2(x + 8.5, zc + 0.15, 3.6, 0.6))
		x = x1
		k += 1
	Lp.montar(parede, "paredes_ala_norte")
	cortes.append([parede, N.grow(0.5)])
	L.montar(self, "ala_norte")
	_placa("placa_semana", Vector3(100, 2.4, zc + 0.16), 6.0, 0.95, 0.0, 0.4)
	for lx in [50.0, 100.0, 150.0]:
		var luz := OmniLight3D.new()
		luz.position = Vector3(lx, 2.7, (N.position.y + N.end.y) * 0.5)
		luz.light_color = Color(0.85, 0.92, 1.0)
		luz.light_energy = 1.0
		luz.omni_range = 16.0
		add_child(luz)

func _hospital() -> void:
	hospital = predio(Mapa.HOSPITAL, 5, 7, "", "laje", true)
	_saguao_ps()
	var H := Mapa.HOSPITAL
	_no_topo(hospital, _placa("placa_hospital", Vector3(H.get_center().x, 13.2, H.end.y + 0.06), 30.0, 3.2, 0.0, 0.9))
	_placa("placa_ps", Vector3(Mapa.HOSP_PS.x, 4.0, H.end.y + 4.06), 10.0, 1.6, 0.0, 1.2)
	var L := Lote.new()
	L.caixa(m_cor(Color("d8d4ca")), Vector3(Mapa.HOSP_PS.x, 3.4, H.end.y + 2.0), Vector3(16, 0.4, 4.5))
	for px in [-7.5, 7.5]:
		L.caixa(m_cor(Color("9a968c")), Vector3(Mapa.HOSP_PS.x + px, 0, H.end.y + 4.0), Vector3(0.35, 3.4, 0.35))
		col.circ(Vector2(Mapa.HOSP_PS.x + px, H.end.y + 4.0), 0.3)
	# heliponto no telhado
	var hc := Vector3(H.get_center().x + 18, 15.1, H.get_center().y)
	L.cilindro(m_cor(Color("4f5257")), hc - Vector3(0, 0.05, 0), 9.0, 0.1, 24)
	L.montar(self, "hospital")
	var heli := _placa("heliponto", hc + Vector3(0, 0.12, 0), 15.0, 15.0, 0.0, 0.2)
	heli.rotation.x = -PI * 0.5
	heli.material_override = m_tex_quad("heliponto", 0.2, true)
	# estacionamento das ambulâncias
	var L2 := Lote.new()
	L2.quad(m_cor(Color("44464a")), Vector3(H.position.x, 0.03, -16.2), Vector3(H.size.x, 0, 0), Vector3(0, 0, -(-16.2 - H.end.y)))
	L2.montar(self, "patio_hospital", false)

func _saguao_ps() -> void:
	## saguão do pronto-socorro (térreo): recepção, cadeiras de espera, boxes de triagem com cortina,
	## macas no corredor, cadeira de rodas e luz fria. O resto do hospital fica fechado.
	var Hs := Mapa.HOSPITAL
	var S := Mapa.HOSP_HALL
	var pg := Mapa.HOSP_PORTA
	col.ret(Rect2(Hs.position.x, Hs.position.y, Hs.size.x, S.position.y - Hs.position.y))
	col.ret(Rect2(Hs.position.x, S.position.y, S.position.x - Hs.position.x, S.size.y))
	col.ret(Rect2(S.end.x, S.position.y, Hs.end.x - S.end.x, S.size.y))
	col.ret(Rect2(S.position.x, Hs.end.y - 0.4, pg.x - S.position.x, 0.4))
	col.ret(Rect2(pg.y, Hs.end.y - 0.4, S.end.x - pg.y, 0.4))
	var L := Lote.new()
	L.quad(m("piso_hospital", 0.2), Vector3(S.position.x, 0.06, S.end.y), Vector3(S.size.x, 0, 0), Vector3(0, 0, -S.size.y), Color.WHITE, Vector2.ZERO, true, 0.2)
	# paredes do saguão por dentro (verde-água de hospital, com faixa)
	var verde := m_cor(Color("b9d6cf"))
	L.caixa(verde, Vector3(S.get_center().x, 0, S.position.y + 0.15), Vector3(S.size.x, 3.0, 0.3))
	L.caixa(m_cor(Color("4f8f88")), Vector3(S.get_center().x, 0.9, S.position.y + 0.32), Vector3(S.size.x, 0.12, 0.05))
	L.caixa(verde, Vector3(S.position.x + 0.15, 0, S.get_center().y), Vector3(0.3, 3.0, S.size.y))
	L.caixa(verde, Vector3(S.end.x - 0.15, 0, S.get_center().y), Vector3(0.3, 3.0, S.size.y))
	# portas do corredor para dentro do hospital (escuras) e portas automáticas abertas
	for dx in [-96.0, -70.0, -44.0]:
		L.caixa(m_cor(Color("3b4a4f")), Vector3(dx, 0, S.position.y + 0.33), Vector3(2.4, 2.4, 0.05))
	var vidro := m_cor(Color(0.6, 0.75, 0.8))
	L.caixa(vidro, Vector3(pg.x - 1.0, 0, Hs.end.y - 0.2), Vector3(2.0, 2.6, 0.06))
	L.caixa(vidro, Vector3(pg.y + 1.0, 0, Hs.end.y - 0.2), Vector3(2.0, 2.6, 0.06))
	# recepção
	var branco := m_cor(Color("eceae4"))
	var azul := m_cor(Color("1f5f8b"))
	var rc := Vector3(-70, 0, -58)
	L.caixa(branco, rc, Vector3(8.0, 1.1, 1.2))
	L.caixa(azul, rc + Vector3(0, 0.3, 0.62), Vector3(8.0, 0.3, 0.04))
	col.ret(Rect2(rc.x - 4.0, rc.z - 0.6, 8.0, 1.2))
	for k in 3:
		L.caixa(m_cor(Color(0.55, 0.75, 0.9), 1.6), rc + Vector3(-2.5 + k * 2.5, 1.1, -0.2), Vector3(0.6, 0.45, 0.06))
	# cadeiras de espera (longarinas azuis) a leste
	var cad := m_cor(Color("2a66a6"))
	for zr in [-62.0, -58.5, -55.0, -51.5]:
		for xb in [-58.0, -48.0, -38.0]:
			L.caixa(ferro_(), Vector3(xb, 0, zr), Vector3(6.0, 0.42, 0.5))
			for c in 5:
				L.caixa(cad, Vector3(xb - 2.4 + c * 1.2, 0.42, zr), Vector3(1.0, 0.08, 0.55))
				L.caixa(cad, Vector3(xb - 2.4 + c * 1.2, 0.5, zr + 0.3), Vector3(1.0, 0.55, 0.06))
			col.ret(Rect2(xb - 3.0, zr - 0.3, 6.0, 0.7))
	# triagem: boxes com maca e cortina a oeste
	var cortina := m_cor(Color("8fc7b8"))
	for b in 5:
		var bx := -108.0 + b * 5.4
		var bz := S.position.y + 0.6
		L.caixa(branco, Vector3(bx + 2.2, 0.6, bz + 1.4), Vector3(0.9, 0.18, 2.0))
		L.caixa(ferro_(), Vector3(bx + 2.2, 0, bz + 1.4), Vector3(0.7, 0.6, 1.6))
		col.ret(Rect2(bx + 1.75, bz + 0.4, 0.9, 2.0))
		L.caixa(m_cor(Color(0.3, 0.9, 0.5), 1.4), Vector3(bx + 3.3, 1.4, bz + 0.2), Vector3(0.5, 0.4, 0.08))
		if b % 2 == 0:
			L.quad(cortina, Vector3(bx, 0.1, bz + 3.6), Vector3(4.6, 0, 0), Vector3(0, 2.3, 0))
		L.quad(cortina, Vector3(bx, 0.1, bz), Vector3(0, 0, 3.6), Vector3(0, 2.3, 0))
		L.tubo(ferro_(), Vector3(bx, 2.4, bz), Vector3(bx, 2.4, bz + 3.6), 0.02)
	# macas soltas, cadeira de rodas, soro
	for mp in [Vector3(-80, 0, -52), Vector3(-90, 0, -55), Vector3(-62, 0, -51)]:
		L.caixa(branco, mp + Vector3(0, 0.75, 0), Vector3(2.0, 0.15, 0.8), mp.x * 0.07)
		L.caixa(ferro_(), mp, Vector3(1.6, 0.75, 0.1), mp.x * 0.07)
		L.tubo(ferro_(), mp + Vector3(1.1, 0, 0), mp + Vector3(1.1, 1.9, 0), 0.02)
		L.caixa(m_cor(Color(0.85, 0.9, 0.95)), mp + Vector3(1.1, 1.6, 0), Vector3(0.2, 0.3, 0.1))
		col.ret(Rect2(mp.x - 1.0, mp.z - 0.4, 2.0, 0.8))
	var cr := Vector3(-66, 0, -52)
	L.cilindro(ferro_(), cr + Vector3(-0.35, 0.3, 0), 0.32, 0.05, 10)
	L.cilindro(ferro_(), cr + Vector3(0.35, 0.3, 0), 0.32, 0.05, 10)
	L.caixa(m_cor(Color("26282c")), cr + Vector3(0, 0.5, 0), Vector3(0.6, 0.08, 0.5))
	L.caixa(m_cor(Color("26282c")), cr + Vector3(0, 0.5, -0.25), Vector3(0.6, 0.6, 0.06))
	L.montar(self, "saguao_ps")
	_placa("placa_recepcao", rc + Vector3(0, 2.5, 0), 3.0, 0.75, 0.0, 1.0)
	_placa("placa_triagem", Vector3(-95, 2.6, S.position.y + 0.36), 8.0, 1.0, 0.0, 0.8)
	for lx in [-95.0, -70.0, -45.0]:
		var luz := OmniLight3D.new()
		luz.position = Vector3(lx, 2.8, S.get_center().y)
		luz.light_color = Color(0.85, 0.95, 1.0)
		luz.light_energy = 1.3
		luz.omni_range = 15.0
		add_child(luz)

func ferro_() -> StandardMaterial3D:
	return m_cor(Color("8c9096"), 0, 0.6)

func _mercado() -> void:
	mercado = predio(Mapa.MERCADO, 3, 7, "", "laje", true)
	var M := Mapa.MERCADO
	_no_topo(mercado, _placa("placa_mercado", Vector3(M.get_center().x, 4.3, M.position.y - 0.5), 18.0, 2.4, PI, 1.0))
	# paredes e coisas por dentro (colisão)
	var pg := Mapa.MERCADO_PORTAO
	for r in [Rect2(M.position.x, M.position.y, pg.x - M.position.x, 0.4), Rect2(pg.y, M.position.y, M.end.x - pg.y, 0.4),
			Rect2(M.position.x, M.end.y - 0.4, 26, 0.4), Rect2(M.position.x + 30, M.end.y - 0.4, M.size.x - 30, 0.4),
			Rect2(M.position.x, M.position.y, 0.4, M.size.y), Rect2(M.end.x - 0.4, M.position.y, 0.4, M.size.y),
			Rect2(108, 40, 0.4, 22)]:
		col.ret(r)
	var L := Lote.new()
	L.quad(m("piso_mercado", 0.5), Vector3(M.position.x, 0.06, M.end.y), Vector3(M.size.x, 0, 0), Vector3(0, 0, -M.size.y), Color.WHITE, Vector2.ZERO, true, 0.5)
	var prat := m_cor(Color("7d6a55"))
	var cores := [Color("c0392b"), Color("f1c40f"), Color("27ae60"), Color("2980b9"), Color("e67e22"), Color("ecf0f1"), Color("8e44ad")]
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	for sz in [47.0, 53.0, 59.0]:
		# gôndola: fundo, prateleiras e produtos dos dois lados
		L.caixa(prat, Vector3(87, 0, sz), Vector3(28, 1.9, 0.12))
		for py in [0.08, 0.7, 1.32]:
			L.caixa(m_cor(Color("b8b9b6"), 0, 0.3), Vector3(87, py, sz), Vector3(28, 0.04, 1.1))
			for lado in [-1.0, 1.0]:
				var px := 73.4
				while px < 100.6:
					var hp := rng.randf_range(0.25, 0.5)
					var lp := rng.randf_range(0.3, 0.6)
					var c: Color = cores[rng.randi() % cores.size()]
					if rng.randf() < 0.88:
						L.caixa(m_cor(c), Vector3(px + lp * 0.5, py + 0.04, sz + lado * 0.34), Vector3(lp, hp, 0.36))
					px += lp + 0.04
		col.ret(Rect2(73, sz - 0.6, 28, 1.2))
	for cz in [44.0, 48.0]:
		L.caixa(m_cor(Color("3d3d3d")), Vector3(104, 0, cz), Vector3(1.6, 1.0, 2.4))
		col.ret(Rect2(103.2, cz - 1.2, 1.6, 2.4))
	# depósito: caixas, mesa das câmeras com monitores, escada para o telhado
	var caixa := m_cor(Color("a77b4f"))
	for b in [Vector3(112, 0, 44), Vector3(116, 0, 44), Vector3(120, 0, 44), Vector3(112, 1.2, 44), Vector3(120, 0, 58), Vector3(112, 0, 58)]:
		L.caixa(caixa, b, Vector3(3.2, 1.2, 2.4), 0.05 * b.x)
		if b.y == 0:
			col.ret(Rect2(b.x - 1.7, b.z - 1.3, 3.4, 2.6))
	var mc := Mapa.MESA_CAMERAS
	L.caixa(m_cor(Color("4b3a2a")), mc + Vector3(0, 0, -1.0), Vector3(3.0, 0.8, 1.0))
	col.ret(Rect2(mc.x - 1.5, mc.z - 1.5, 3.0, 1.0))
	for k in 3:
		L.caixa(m_cor(Color(0.55, 0.8, 0.65), 2.2), mc + Vector3(-1.0 + k, 0.8, -1.3), Vector3(0.7, 0.5, 0.08))
	var es := Mapa.ESCADA
	for k in 6:
		L.caixa(m_cor(Color("6d6d6d"), 0, 0.5), es + Vector3(0, k * 0.5, 1.6), Vector3(0.9, 0.06, 0.06))
	L.tubo(m_cor(Color("6d6d6d"), 0, 0.5), es + Vector3(-0.45, 0, 1.6), es + Vector3(-0.45, 3.2, 1.6), 0.04)
	L.tubo(m_cor(Color("6d6d6d"), 0, 0.5), es + Vector3(0.45, 0, 1.6), es + Vector3(0.45, 3.2, 1.6), 0.04)
	L.montar(self, "mercado_dentro")
	# porta de aço da frente (desce na cena)
	portao_mercado = Node3D.new()
	add_child(portao_mercado)
	var L2 := Lote.new()
	# (o eixo fica no alto: aberta = enrolada no rolo, scale.y pequeno; a cena desenrola até 1)
	L2.caixa(m_cor(Color("9aa0a6"), 0, 0.5), Vector3((pg.x + pg.y) * 0.5, -3.2, M.position.y - 0.05), Vector3(pg.y - pg.x, 3.2, 0.12))
	L2.montar(portao_mercado, "porta_de_aco")
	portao_mercado.position.y = 3.2
	portao_mercado.scale.y = 0.04
	var L4 := Lote.new()
	L4.caixa(m_cor(Color("55595e"), 0, 0.4), Vector3((pg.x + pg.y) * 0.5, 3.15, M.position.y - 0.25), Vector3(pg.y - pg.x + 0.4, 0.45, 0.4))
	L4.montar(self, "rolo_da_porta")
	# luz fria do depósito e a luz dos monitores
	var l1 := OmniLight3D.new()
	l1.position = Vector3(116, 2.8, 52)
	l1.light_color = Color(0.8, 0.95, 0.85)
	l1.light_energy = 1.4
	l1.omni_range = 12
	add_child(l1)
	# estacionamento na frente
	var L3 := Lote.new()
	var E := Mapa.ESTACIONAMENTO
	L3.quad(m("asfalto", 1.0 / 9.0, Color(0.85, 0.85, 0.85)), Vector3(E.position.x, 0.03, E.end.y), Vector3(E.size.x, 0, 0), Vector3(0, 0, -E.size.y), Color.WHITE, Vector2.ZERO, true, 1.0 / 9.0)
	var x := E.position.x + 2
	while x < E.end.x - 2:
		L3.quad(m_cor(Color(0.85, 0.84, 0.78)), Vector3(x, 0.05, E.position.y + 5.2), Vector3(0.12, 0, 0), Vector3(0, 0, -5))
		L3.quad(m_cor(Color(0.85, 0.84, 0.78)), Vector3(x, 0.05, E.end.y - 0.2), Vector3(0.12, 0, 0), Vector3(0, 0, -5))
		x += 2.8
	L3.montar(self, "estacionamento", false)
	_cara_do_mercado()

func _cara_do_mercado() -> void:
	## a cara do Mercado do Antônio: faixa vermelha e amarela na fachada, toldo listrado do
	## hortifrúti com caixotes de fruta, cartazes de oferta à mão, gaiola de botijão de gás, galões
	## de água, carrinhos, moto de entrega, mesinha de plástico e, por dentro, geladeira de bebidas,
	## açougue e luz fluorescente.
	var M := Mapa.MERCADO
	var z := M.position.y - 0.06
	var pg := Mapa.MERCADO_PORTAO
	var L := Lote.new()
	var verm := m_cor(Color("b8232a"))
	var amar := m_cor(Color("f5c518"))
	# faixa pintada da loja (por trás do letreiro) e friso amarelo
	L.quad(verm, Vector3(M.position.x, 2.6, z), Vector3(M.size.x, 0, 0), Vector3(0, 2.8, 0))
	L.quad(amar, Vector3(M.position.x, 2.45, z - 0.01), Vector3(M.size.x, 0, 0), Vector3(0, 0.22, 0))
	L.quad(amar, Vector3(M.position.x, 5.4, z - 0.01), Vector3(M.size.x, 0, 0), Vector3(0, 0.22, 0))
	# marquise de concreto nas laterais da porta com lâmpadas por baixo
	for seg in [Vector2(M.position.x, pg.x - 0.4), Vector2(pg.y + 0.4, M.end.x)]:
		L.caixa(m_cor(Color("bdb7aa")), Vector3((seg.x + seg.y) * 0.5, 2.6, z - 0.9), Vector3(seg.y - seg.x, 0.16, 1.8))
		var lx: float = seg.x + 2.0
		while lx < seg.y - 1.0:
			L.caixa(m_cor(Color(1.0, 0.98, 0.9), 1.4), Vector3(lx, 2.54, z - 1.2), Vector3(1.2, 0.06, 0.12))
			lx += 4.0
	# toldo listrado verde e branco sobre o hortifrúti (lado oeste da porta)
	var verde := m_cor(Color("2f7a3a"))
	var branco := m_cor(Color("ecebe4"))
	var tx := 72.0
	var i := 0
	while tx < 88.0:
		L.quad(verde if i % 2 == 0 else branco, Vector3(tx, 2.5, z), Vector3(1.0, 0, 0), Vector3(0, -0.7, -2.2))
		tx += 1.0
		i += 1
	# caixotes de fruta inclinados (laranja, tomate, banana, verdura, melancia)
	var frutas := [Color("f08a1c"), Color("c92a1f"), Color("f2d13a"), Color("4c9a35"), Color("2f5d2a"), Color("e7672a")]
	var madeira := m_cor(Color("a77b4f"))
	for k in 6:
		var cp := Vector3(73.5 + k * 2.4, 0, z - 1.3)
		L.caixa(madeira, cp, Vector3(2.0, 0.8, 1.0))
		L.caixa(m_cor(frutas[k]), cp + Vector3(0, 0.8, 0), Vector3(1.8, 0.18, 0.8), 0.0)
		for b in 5:
			L.caixa(m_cor(frutas[k].darkened(0.15 * (b % 2))), cp + Vector3(-0.7 + b * 0.35, 0.95, randf_range(-0.2, 0.2)), Vector3(0.22, 0.2, 0.22))
	col.ret(Rect2(72.5, z - 1.8, 14.4, 1.0))
	# lado leste: gaiola de botijões, galões de água, moto de entrega, carrinhos
	var gx := 110.0
	L.caixa(m_cor(Color("2c2e31"), 0, 0.4), Vector3(gx + 2.0, 0, z - 1.0), Vector3(4.0, 0.08, 1.6))
	for b in 6:
		var bp := Vector3(gx + 0.6 + (b % 3) * 1.2, 0.08, z - 1.4 + (b / 3) * 0.8)
		L.cilindro(m_cor(Color("2b5f9e") if b % 2 else Color("8c9096"), 0, 0.3), bp, 0.32, 0.75, 10)
	for t in 9:
		var tp := Vector3(gx + t * 0.5, 0, z - 1.8)
		L.tubo(m_cor(Color("3a3c3f"), 0, 0.5), tp, tp + Vector3(0, 1.5, 0), 0.02)
	L.tubo(m_cor(Color("3a3c3f"), 0, 0.5), Vector3(gx, 1.5, z - 1.8), Vector3(gx + 4.0, 1.5, z - 1.8), 0.02)
	col.ret(Rect2(gx, z - 1.9, 4.0, 1.8))
	var agua := m_cor(Color(0.45, 0.7, 0.95), 0.2)
	for w in 8:
		L.cilindro(agua, Vector3(gx + 5.2 + (w % 4) * 0.62, (w / 4) * 0.5, z - 0.8), 0.27, 0.48, 10)
	# moto de entrega (baú vermelho)
	var mo := Vector3(120.5, 0, z - 2.4)
	L.cilindro(m_cor(Color("1d1d1f")), mo + Vector3(-0.7, 0.3, 0), 0.3, 0.12, 10)
	L.cilindro(m_cor(Color("1d1d1f")), mo + Vector3(0.7, 0.3, 0), 0.3, 0.12, 10)
	L.caixa(m_cor(Color("c9c9c2"), 0, 0.5), mo + Vector3(0, 0.35, 0), Vector3(1.4, 0.35, 0.3))
	L.caixa(verm, mo + Vector3(-0.6, 0.75, 0), Vector3(0.7, 0.6, 0.6))
	col.ret(Rect2(mo.x - 1.0, mo.z - 0.4, 2.0, 0.8))
	# carrinhos de compra enfileirados
	var ar := m_cor(Color("c0c4c8"), 0, 0.7)
	for c in 4:
		var cp2 := Vector3(107.6, 0.35, z - 1.0 - c * 0.35)
		L.tubo(ar, cp2, cp2 + Vector3(0.0, 0.6, 0), 0.015)
		L.tubo(ar, cp2 + Vector3(0, 0.6, 0), cp2 + Vector3(0.9, 0.6, 0), 0.015)
		L.tubo(ar, cp2 + Vector3(0.9, 0.0, 0), cp2 + Vector3(0.9, 0.6, 0), 0.015)
		L.tubo(ar, cp2, cp2 + Vector3(0.9, 0, 0), 0.015)
	# mesinha de plástico com cadeiras (o cafezinho do fim de tarde)
	var pl := m_cor(Color("d83a2e"))
	var mp := Vector3(124.2, 0, z - 1.4)
	L.caixa(pl, mp + Vector3(0, 0.7, 0), Vector3(0.8, 0.05, 0.8))
	L.caixa(pl, mp, Vector3(0.1, 0.7, 0.1))
	for a in 3:
		var cd := mp + Vector3(cos(a * 2.1) * 0.9, 0, sin(a * 2.1) * 0.9)
		L.caixa(pl, cd, Vector3(0.45, 0.42, 0.45), a * 2.1)
	# por dentro: geladeira de bebidas (vidro aceso), balcão do açougue, lâmpadas
	L.caixa(m_cor(Color("dfe3e6")), Vector3(71.2, 0, 55), Vector3(1.4, 2.2, 14))
	L.quad(m_cor(Color(0.75, 0.9, 1.0), 1.8), Vector3(71.95, 0.2, 48.2), Vector3(0, 0, 13.6), Vector3(0, 1.8, 0))
	col.ret(Rect2(70.4, 48, 1.6, 14))
	L.caixa(m_cor(Color("eceae4")), Vector3(88, 0, 67.6), Vector3(12, 1.1, 1.0))
	L.quad(m_cor(Color(1.0, 0.55, 0.5), 1.2), Vector3(82, 0.4, 67.08), Vector3(12, 0, 0), Vector3(0, 0.6, 0))
	col.ret(Rect2(82, 67.1, 12, 1.0))
	# fundos (rua de trás) e lateral oeste: mesma faixa pintada, letreiro e a doca de mercadorias
	var Lb := Lote.new()   # (as faixas de trás somem quando o Antônio está dentro: ficam no telhado do prédio)
	Lb.quad(verm, Vector3(M.end.x, 2.6, M.end.y + 0.06), Vector3(-M.size.x, 0, 0), Vector3(0, 2.8, 0))
	Lb.quad(amar, Vector3(M.end.x, 2.45, M.end.y + 0.07), Vector3(-M.size.x, 0, 0), Vector3(0, 0.22, 0))
	Lb.quad(verm, Vector3(M.position.x - 0.06, 2.6, M.position.y), Vector3(0, 0, M.size.y), Vector3(0, 2.8, 0))
	Lb.quad(amar, Vector3(M.position.x - 0.07, 2.45, M.position.y), Vector3(0, 0, M.size.y), Vector3(0, 0.22, 0))
	Lb.montar(mercado.topo, "faixas_fundos")
	for pp in [Vector3(104, 0, 72.2), Vector3(106.4, 0, 72.2), Vector3(104, 0, 74.6)]:
		L.caixa(madeira, pp, Vector3(2.0, 0.15, 2.0))
		for b in 4:
			L.caixa(m_cor(Color("a77b4f").darkened(0.08 * b)), pp + Vector3(-0.5 + (b % 2), 0.15 + (b / 2) * 0.6, 0), Vector3(0.95, 0.6, 1.8))
		col.ret(Rect2(pp.x - 1.0, pp.z - 1.0, 2.0, 2.0))
	for lx2 in [112.0, 113.4]:
		L.caixa(m_cor(Color("2f6b3a")), Vector3(lx2, 0, 71.2), Vector3(1.2, 1.1, 1.0))
	col.ret(Rect2(111.4, 70.7, 2.6, 1.0))
	L.montar(self, "cara_do_mercado")
	_no_topo(mercado, _placa("placa_mercado", Vector3(M.get_center().x + 6, 3.9, M.end.y + 0.1), 14.0, 1.9, 0.0, 0.9))
	_no_topo(mercado, _placa("placa_mercado", Vector3(M.position.x - 0.1, 3.9, M.get_center().y), 14.0, 1.9, -PI * 0.5, 0.9))
	for k in 4:
		var cx: float = [74.0, 80.0, 109.0, 116.0][k]
		_placa("cartaz_%d" % (k + 1), Vector3(cx, 1.5, z - 0.02), 0.9, 1.15, PI, 0.25)
	_placa("placa_horti", Vector3(80, 2.95, z - 2.15), 3.4, 0.8, PI, 0.6)
	_placa("placa_entrega", Vector3(116, 2.95, z - 1.82), 5.0, 0.6, PI, 0.6)
	_placa("placa_acougue", Vector3(88, 2.3, 68.9), 3.2, 0.8, 0.0, 1.0)
	var l2 := OmniLight3D.new()
	l2.position = Vector3(86, 2.7, 54)
	l2.light_color = Color(0.95, 1.0, 0.95)
	l2.light_energy = 1.2
	l2.omni_range = 16
	add_child(l2)
	var refl := OmniLight3D.new()   # refletor do estacionamento, no alto da fachada
	refl.position = Vector3(98, 7.5, z - 3.0)
	refl.light_color = Color(1.0, 0.92, 0.75)
	refl.light_energy = 1.6
	refl.omni_range = 28
	add_child(refl)
	var l3 := OmniLight3D.new()
	l3.position = Vector3(98, 2.4, z - 1.2)
	l3.light_color = Color(1.0, 0.88, 0.65)
	l3.light_energy = 1.4
	l3.omni_range = 10
	add_child(l3)

func _estadio() -> void:
	## ARENA LESTE (time fictício): fachada de costelas de concreto inclinadas com vidro escuro e os
	## andares do saguão aparecendo, faixa de LED vermelha, cobertura branca em balanço, arquibancada em
	## dois anéis (torcida vermelha e preta, visitante azul), camarotes iluminados, telão e os portões do
	## oeste com catracas, bilheteria, carrinhos de comida e bandeiras (é por ali que a multidão sai).
	var C := Vector3(Mapa.ESTADIO_C.x, 0, Mapa.ESTADIO_C.y)
	var R := Mapa.ESTADIO_R
	var H := Mapa.ESTADIO_ALT
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var N := 96
	var pt := func(k: float, a: float, y: float) -> Vector3: return C + Vector3(cos(a) * R.x * k, y, sin(a) * R.y * k)
	var add := func(a: Vector3, b: Vector3, c: Vector3, cor: Color):
		var n := (b - a).cross(c - a).normalized()
		for v in [a, b, c]:
			st.set_color(cor)
			st.set_normal(-n)
			st.add_vertex(v)
	# faixa entre dois anéis (k0, y0) -> (k1, y1) no trecho a0..a1
	var faixa := func(a0: float, a1: float, k0: float, y0: float, k1: float, y1: float, cor: Color):
		add.call(pt.call(k0, a0, y0), pt.call(k1, a0, y1), pt.call(k1, a1, y1), cor)
		add.call(pt.call(k0, a0, y0), pt.call(k1, a1, y1), pt.call(k0, a1, y0), cor)
	var rng := RandomNumberGenerator.new()
	rng.seed = 13
	var portoes := [PI - 0.22, PI + 0.22, PI * 0.78, PI * 1.24]
	var no_portao := func(a: float) -> bool:
		for g in portoes:
			if absf(wrapf(a - g, -PI, PI)) < 0.045:
				return true
		return false
	var vidro := Color("1c2630")
	var laje := Color("b9b6ae")
	var dentro_cor := Color("3a3128")
	for i in N:
		var a0 := TAU * i / N
		var a1 := TAU * (i + 1) / N
		var am := (a0 + a1) * 0.5
		# pele de vidro escuro atrás das costelas, com as lajes do saguão (5,5 m e 11 m)
		if no_portao.call(am):
			faixa.call(a0, a1, 0.965, 0.0, 0.965, 5.2, dentro_cor)
			faixa.call(a0, a1, 0.965, 5.2, 0.965, H, vidro)
		else:
			faixa.call(a0, a1, 0.965, 0.0, 0.965, H, vidro.lerp(Color("2b3946"), 0.5 if i % 2 else 0.0))
		for yl in [5.2, 11.0]:
			faixa.call(a0, a1, 0.94, yl, 1.0, yl, laje)
			faixa.call(a0, a1, 1.0, yl, 1.0, yl + 0.7, laje.darkened(0.15))
		# faixa de LED vermelha no alto da fachada
		faixa.call(a0, a1, 1.02, H - 2.4, 1.02, H - 1.4, Color(1.6, 0.12, 0.14))
		# cobertura branca em balanço (por cima a membrana, por baixo a estrutura escura)
		faixa.call(a0, a1, 1.045, H + 0.6, 0.80, H + 2.6, Color("e9e7e1") if i % 2 else Color("dedbd3"))
		faixa.call(a0, a1, 1.045, H + 0.6, 1.045, H - 0.6, Color("cfccc4"))
		faixa.call(a0, a1, 0.80, H + 2.6, 0.80, H + 1.8, Color("8b8a86"))
		# arquibancada: anel de baixo, camarotes, anel de cima
		var setor := int(am / TAU * 12.0)
		var visitante := setor == 3
		var c1 := Color("23345e") if visitante else (Color("8e1b20") if setor % 2 == 0 else Color("1d1d20"))
		var c2 := Color("e8e8ea") if visitante else (Color("1d1d20") if setor % 2 == 0 else Color("8e1b20"))
		for f in 10:
			var k0 := 0.60 + f * 0.016
			var y0 := 0.9 + f * 0.66
			var gente := (c1 if (f + i) % 3 else c2).lerp(Color(rng.randf_range(0.5, 1.0), rng.randf_range(0.35, 0.8), rng.randf_range(0.3, 0.7)), rng.randf() * 0.35).darkened(rng.randf() * 0.3)
			faixa.call(a0, a1, k0, y0, k0, y0 + 0.66, Color("5a5c60"))
			faixa.call(a0, a1, k0, y0 + 0.66, k0 + 0.016, y0 + 0.66, gente)
		faixa.call(a0, a1, 0.76, 7.5, 0.76, 9.4, Color(1.4, 1.2, 0.85))   # vidro dos camarotes (aceso)
		faixa.call(a0, a1, 0.76, 9.4, 0.775, 9.4, laje)
		for f in 9:
			var k1 := 0.775 + f * 0.019
			var y1 := 9.4 + f * 0.9
			var gente2 := (c2 if (f + i) % 3 else c1).lerp(Color(rng.randf_range(0.5, 1.0), rng.randf_range(0.35, 0.8), rng.randf_range(0.3, 0.7)), rng.randf() * 0.35).darkened(rng.randf() * 0.3)
			faixa.call(a0, a1, k1, y1, k1, y1 + 0.9, Color("4d4f53"))
			faixa.call(a0, a1, k1, y1 + 0.9, k1 + 0.019, y1 + 0.9, gente2)
		# fosso e pista em volta do gramado
		faixa.call(a0, a1, 0.53, 0.32, 0.60, 0.32, Color("3d5c3a"))
		faixa.call(a0, a1, 0.60, 0.32, 0.60, 0.9, Color("6b6d70"))
	var mesh := st.commit()
	var mt := StandardMaterial3D.new()
	mt.vertex_color_use_as_albedo = true
	mt.cull_mode = BaseMaterial3D.CULL_DISABLED
	mt.roughness = 0.8
	mt.emission_enabled = true
	mt.emission_energy_multiplier = 0.0
	mesh.surface_set_material(0, mt)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)
	# LED e camarotes brilham de verdade (malha à parte, só o que acende)
	var st2 := SurfaceTool.new()
	st2.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in N:
		var a0 := TAU * i / N
		var a1 := TAU * (i + 1) / N
		for q in [[1.021, H - 2.4, 1.021, H - 1.4], [0.759, 7.5, 0.759, 9.4]]:
			var v := [pt.call(q[0], a0, q[1]), pt.call(q[2], a0, q[3]), pt.call(q[2], a1, q[3]), pt.call(q[0], a0, q[1]), pt.call(q[2], a1, q[3]), pt.call(q[0], a1, q[1])]
			for w in v:
				st2.set_color(Color(1.0, 0.1, 0.12) if q[0] > 1.0 else Color(1.0, 0.86, 0.62))
				st2.add_vertex(w)
	var brilho := st2.commit()
	var mt2 := StandardMaterial3D.new()
	mt2.vertex_color_use_as_albedo = true
	mt2.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mt2.cull_mode = BaseMaterial3D.CULL_DISABLED
	brilho.surface_set_material(0, mt2)
	var mi2 := MeshInstance3D.new()
	mi2.mesh = brilho
	mi2.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi2)
	# gramado
	var campo := MeshInstance3D.new()
	var q := PlaneMesh.new()
	q.size = Vector2(R.x * 1.06, R.y * 1.0)
	campo.mesh = q
	campo.material_override = m_tex_quad("campo")
	campo.position = C + Vector3(0, 0.35, 0)
	add_child(campo)
	var L := Lote.new()
	var conc := m_cor(Color("c9c6bd"))
	# costelas de concreto inclinadas para fora (a assinatura da fachada)
	for i in 48:
		var a := TAU * (i + 0.5) / 48.0
		if no_portao.call(a):
			continue
		L.tubo(conc, pt.call(0.985, a, 0.0), pt.call(1.04, a, H + 0.6), 0.55)
	# portões: pórtico, catracas, grade e placa
	for g in portoes:
		var fora := Vector3(cos(g), 0, sin(g))
		var lado := Vector3(-fora.z, 0, fora.x)
		var base: Vector3 = pt.call(1.0, g, 0.0)
		var giro := atan2(-fora.x, -fora.z)
		L.caixa(conc, base + lado * 4.6, Vector3(1.0, 5.4, 1.0), giro)
		L.caixa(conc, base - lado * 4.6, Vector3(1.0, 5.4, 1.0), giro)
		L.caixa(m_cor(Color("1d1f24")), base + Vector3(0, 5.2, 0), Vector3(10.4, 1.0, 1.0), giro)
		for k in 6:
			var tp := base + fora * 3.2 + lado * (-3.75 + k * 1.5)
			L.caixa(m_cor(Color("8c9096"), 0, 0.6), tp, Vector3(0.35, 1.0, 0.9), giro)
			L.tubo(m_cor(Color("c0c4c8"), 0, 0.7), tp + Vector3(0, 0.9, 0), tp + Vector3(0, 0.9, 0) + lado * 0.6, 0.03)
		_placa("placa_portao", base + fora * 0.62 + Vector3(0, 5.2, 0), 9.6, 1.2, giro + PI, 1.2)
		var luz := OmniLight3D.new()
		luz.position = base + fora * 1.5 + Vector3(0, 4.0, 0)
		luz.light_color = Color(1.0, 0.82, 0.55)
		luz.light_energy = 1.6
		luz.omni_range = 11.0
		add_child(luz)
	# torres de refletor (acesos no fim da tarde)
	for a in [0.55, 2.6, 3.7, 5.75]:
		var p: Vector3 = pt.call(1.12, a, 0)
		L.tubo(m_cor(Color("5a5d62"), 0, 0.4), p, p + Vector3(0, 34, 0), 0.5)
		L.caixa(m_cor(Color(1.0, 0.97, 0.88), 3.0), p + Vector3(0, 33, 0), Vector3(5.0, 2.6, 0.6), -a)
		var s := SpotLight3D.new()
		s.position = p + Vector3(0, 34, 0)
		add_child(s)
		s.look_at(C, Vector3.UP)
		s.spot_range = 120
		s.spot_angle = 32
		s.light_energy = 2.2
		s.light_color = Color(1.0, 0.96, 0.86)
		refletores.append(s)
	# telão no fundo norte, por cima da arquibancada
	var tp2: Vector3 = pt.call(0.9, -PI * 0.5, H + 2.6)
	L.caixa(m_cor(Color("26282c")), tp2 + Vector3(0, -1.0, 0), Vector3(22, 7.5, 1.2))
	L.montar(self, "arena")
	_placa("placa_arena", tp2 + Vector3(0, 2.8, 0.7), 20.0, 4.0, 0.0, 1.6)
	# nome da arena na cobertura, virado para a avenida (sudoeste, de onde a câmera olha)
	for a2 in [PI * 0.62, PI * 0.36]:
		var pn: Vector3 = pt.call(1.05, a2, H - 1.0)
		var nm := _placa("placa_arena", pn, 26.0, 5.0, 0.0, 1.0)
		nm.look_at(pn + Vector3(cos(a2) * R.y, 0, sin(a2) * R.x), Vector3.UP)
		nm.rotate_object_local(Vector3.UP, PI)
	_praca_do_estadio()

func _praca_do_estadio() -> void:
	## praça dos portões do oeste: piso, bilheterias, carrinhos de comida com guarda-sol, grades da
	## polícia, bandeiras da torcida e as faixas penduradas na fachada
	var L := Lote.new()
	var piso := m("calcada", 0.25)
	L.quad(piso, Vector3(208.5, 0.04, -36), Vector3(13, 0, 0), Vector3(0, 0, -92), Color(0.95, 0.92, 0.88), Vector2.ZERO, true, 0.25)
	for z in [-104.0, -60.0]:
		L.caixa(m_cor(Color("a3161c")), Vector3(212.5, 0, z), Vector3(2.6, 2.6, 3.2))
		L.caixa(m_cor(Color("2a2c30")), Vector3(212.5, 2.6, z), Vector3(3.0, 0.25, 3.6))
		col.ret(Rect2(211.2, z - 1.6, 2.6, 3.2))
		_placa("placa_bilheteria", Vector3(211.15, 2.2, z), 2.8, 0.7, -PI * 0.5, 1.0)
	var cores_sol := [Color("f5c518"), Color("e8e4da"), Color("a3161c"), Color("2f7a3a")]
	var k := 0
	for z2 in [-112.0, -96.0, -88.0, -74.0, -52.0, -44.0]:
		var cp := Vector3(210.5 + (k % 2) * 2.0, 0, z2)
		L.caixa(m_cor(Color("bfc3c7"), 0, 0.6), cp, Vector3(1.8, 0.95, 1.0))
		L.caixa(m_cor(Color("3a3a3c")), cp + Vector3(0, 0.95, 0), Vector3(1.8, 0.08, 1.0))
		L.tubo(m_cor(Color("dcdcdc")), cp, cp + Vector3(0, 2.6, 0), 0.03)
		L.cilindro(m_cor(cores_sol[k % cores_sol.size()]), cp + Vector3(0, 2.4, 0), 1.3, 0.25, 8)
		col.ret(Rect2(cp.x - 0.9, cp.z - 0.5, 1.8, 1.0))
		k += 1
	# grades da polícia (amarelas) orientando a fila
	var grade := m_cor(Color("e0b21b"), 0, 0.3)
	for z3 in range(-118, -40, 6):
		if z3 % 18 == 0:
			continue
		var gp := Vector3(216.2, 0, float(z3))
		L.tubo(grade, gp + Vector3(0, 1.0, -1.2), gp + Vector3(0, 1.0, 1.2), 0.03)
		L.tubo(grade, gp + Vector3(0, 0.2, -1.2), gp + Vector3(0, 0.2, 1.2), 0.03)
		for dz in [-1.2, 0.0, 1.2]:
			L.tubo(grade, gp + Vector3(0, 0, dz), gp + Vector3(0, 1.0, dz), 0.02)
	# bandeiras da torcida nos mastros
	var tecido := [m_cor(Color("a3161c")), m_cor(Color("1d1d20")), m_cor(Color("f4f1ea"))]
	var j := 0
	for z4 in range(-122, -38, 8):
		var mp := Vector3(208.9, 0, float(z4))
		L.tubo(m_cor(Color("cfcfcf"), 0, 0.6), mp, mp + Vector3(0, 6.5, 0), 0.05)
		L.quad(tecido[j % 3], mp + Vector3(0, 6.4, 0), Vector3(0.12, 0, 1.6), Vector3(0.0, -1.0, 0.0))
		j += 1
	L.montar(self, "praca_estadio")
	# faixas da torcida penduradas na fachada (entre os portões)
	for a in [PI * 0.9, PI * 1.1, PI * 0.68]:
		var p := Vector3(Mapa.ESTADIO_C.x + cos(a) * Mapa.ESTADIO_R.x * 1.03, 8.2, Mapa.ESTADIO_C.y + sin(a) * Mapa.ESTADIO_R.y * 1.03)
		var f := _placa("faixa_torcida", p, 12.0, 1.9, 0.0, 0.3)
		f.look_at(p + Vector3(cos(a) * Mapa.ESTADIO_R.y, 0, sin(a) * Mapa.ESTADIO_R.x), Vector3.UP)
		f.rotate_object_local(Vector3.UP, PI)

func _bairro(rng: RandomNumberGenerator) -> void:
	# prédios com lojas viradas para a avenida (3 a 5 andares)
	var lado_av := [
		[Rect2(-240, 18, 30, 22), "n"], [Rect2(-205, 18, 26, 20), "n"], [Rect2(-174, 18, 34, 22), "n"], [Rect2(-134, 18, 26, 24), "n"],
		[Rect2(-104, 18, 30, 22), "n"], [Rect2(-70, 18, 28, 20), "n"], [Rect2(-38, 18, 26, 24), "nl"],
		[Rect2(14, 18, 44, 18), "n"], [Rect2(140, 18, 50, 18), "no"],
		[Rect2(212, 18, 30, 22), "no"], [Rect2(246, 18, 28, 20), "n"], [Rect2(278, 18, 34, 22), "n"], [Rect2(316, 18, 30, 24), "n"],
	]
	for e in lado_av:
		predio(e[0], rng.randi_range(3, 5), [0, 1, 2, 3, 4, 7][rng.randi() % 6], e[1])
	# miolo das quadras ao sul
	var miolo := [Rect2(-240, 50, 40, 36), Rect2(-190, 52, 30, 34), Rect2(-150, 48, 44, 38), Rect2(-96, 54, 34, 32), Rect2(-52, 50, 38, 36),
		Rect2(14, 46, 44, 24), Rect2(134, 48, 30, 36), Rect2(168, 50, 22, 34),
		Rect2(214, 48, 36, 38), Rect2(258, 52, 30, 32), Rect2(296, 48, 46, 38)]
	for r in miolo:
		predio(r, rng.randi_range(3, 5), rng.randi() % 8)
	# casas de telha depois da rua de trás
	var x := -248.0
	while x < 340:
		for zz in [110.0, 126.0]:
			if rng.randf() < 0.88:
				var w := rng.randf_range(8, 12)
				var r2 := Rect2(x, zz, w, rng.randf_range(9, 12))
				predio(r2, rng.randi_range(1, 2), [5, 0, 1, 2, 7][rng.randi() % 5], "", "telha")
		x += rng.randf_range(11, 14)
	# lado norte: prédios entre a avenida e o hospital/faculdade/estádio
	for r in [Rect2(-240, -110, 34, 60), Rect2(-200, -112, 36, 40), Rect2(-200, -64, 36, 34), Rect2(-160, -110, 30, 50)]:
		predio(r, rng.randi_range(3, 5), rng.randi() % 8, "s")
	for r in [Rect2(-240, -44, 34, 22), Rect2(-200, -46, 30, 24), Rect2(-160, -48, 32, 26)]:
		predio(r, rng.randi_range(3, 5), rng.randi() % 8, "s")
	for r in [Rect2(214, -20, 1, 1)]:
		pass
	# árvores nas calçadas
	var xx := -250.0
	while xx < 350:
		if not _no_cruzamento(xx) and rng.randf() < 0.55:
			_arvore_cidade(Vector2(xx, -14.6 if rng.randf() < 0.5 else 14.6))
		xx += rng.randf_range(14, 24)

func _arvore_cidade(p: Vector2) -> void:
	var L := Lote.new()
	L.cilindro(m_cor(Color("4a3a2a")), Vector3(p.x, 0, p.y), 0.22, 3.2, 6)
	L.montar(self, "tronco")
	_copa(Vector3(p.x, 3.0, p.y), randf_range(2.4, 3.4))
	col.circ(p, 0.35)

var _copas: Array = []   # [pos, raio] — viram uma malha só no fim (MultiMesh)
func _copa(p: Vector3, r: float) -> void:
	_copas.append([p, r])

func _morro(rng: RandomNumberGenerator) -> void:
	# relevo em grade (4 m), cor do vértice: vermelho = terra (trilha), verde = variação
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var x0 := -250.0
	var x1 := 350.0
	var z0 := -340.0
	var z1 := -158.0
	var passo := 5.0
	var nx := int((x1 - x0) / passo)
	var nz := int((z1 - z0) / passo)
	var alt := func(x: float, z: float) -> float: return Mapa.altura(x, z)
	for i in nx:
		for j in nz:
			var xa := x0 + i * passo
			var za := z0 + j * passo
			var quad := [Vector3(xa, 0, za), Vector3(xa + passo, 0, za), Vector3(xa + passo, 0, za + passo), Vector3(xa, 0, za + passo)]
			for v in quad:
				v.y = alt.call(v.x, v.z)
			var tri := [quad[0], quad[1], quad[2], quad[0], quad[2], quad[3]]
			for v in tri:
				var dt := Mapa.dist_trilha(Vector2(v.x, v.z))
				var terra: float = clamp(1.0 - (dt - 1.5) / 3.0, 0.0, 1.0)
				if Vector2(v.x, v.z).distance_to(Mapa.TOPO) < 16:
					terra = max(terra, 0.6)
				st.set_color(Color(terra, rng.randf_range(0.7, 1.0), 0))
				st.set_uv(Vector2(v.x, v.z))
				st.add_vertex(v)
	st.generate_normals()
	var mesh := st.commit()
	var sm := ShaderMaterial.new()
	sm.shader = load("res://shaders/chao.gdshader")
	sm.set_shader_parameter("grama", Predio.tex("grama.png"))
	sm.set_shader_parameter("terra", Predio.tex("terra.png"))
	mesh.surface_set_material(0, sm)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)
	# mata: copas fora da trilha e do topo
	var tent := 0
	var n := 0
	while n < 900 and tent < 9000:
		tent += 1
		var p := Vector2(rng.randf_range(100, 345), rng.randf_range(-338, -162))
		if Mapa.dist_trilha(p) < 5.5 or p.distance_to(Mapa.TOPO) < 20:
			continue
		var y := Mapa.altura(p.x, p.y)
		_copa(Vector3(p.x, y + rng.randf_range(1.5, 3.5), p.y), rng.randf_range(2.6, 4.6))
		n += 1
	# casa no alto do morro (a da foto), com caixa d'água
	var cs := Mapa.CASA_TOPO
	var ytopo := Mapa.altura(cs.get_center().x, cs.get_center().y)
	var casa := predio(cs, 1, 7, "", "telha")
	casa.position.y = ytopo
	casa.aabb.position.y += ytopo
	var L := Lote.new()
	L.cilindro(m_cor(Color("2f5f9a")), Vector3(cs.position.x - 4, ytopo, cs.position.y + 2), 1.2, 6.0, 10)
	# cerca de madeira na beira do topo
	for k in 16:
		var a := TAU * k / 16.0
		var p2 := Mapa.TOPO + Vector2(cos(a), sin(a)) * 15.5
		if Mapa.dist_trilha(p2) < 3.0:
			continue
		L.caixa(m_cor(Color("6a4a32")), Vector3(p2.x, Mapa.altura(p2.x, p2.y), p2.y), Vector3(0.15, 1.1, 0.15))
	L.montar(self, "topo")

func _ruas_moveis(rng: RandomNumberGenerator) -> void:
	## Postes de concreto com a fiação paulistana, luminárias, orelhões, bancas, pontos de ônibus,
	## lixeiras, caçambas e semáforos.
	var L := Lote.new()
	var conc := m_cor(Color("a8a59c"))
	var fio := m_cor(Color("161616"))
	var lum := m_cor(Color(1.0, 0.9, 0.7), 2.5)
	for lado in [-1, 1]:
		var zp: float = lado * 13.8
		var anterior = null
		var x := -255.0
		while x < 355:
			if _no_cruzamento(x):
				x += 6
				anterior = null
				continue
			var base := Vector3(x, 0, zp)
			L.caixa(conc, base, Vector3(0.32, 9.0, 0.32))
			L.caixa(conc, base + Vector3(0, 8.4, 0), Vector3(0.18, 0.18, 2.2))
			col.circ(Vector2(x, zp), 0.3)
			if int(x) % 3 == 0:
				L.cilindro(m_cor(Color("5f6366")), base + Vector3(0.45, 6.2, 0), 0.35, 1.0, 8)
			# braço da luminária para a rua
			var ponta := base + Vector3(0, 8.0, -lado * 2.4)
			L.tubo(conc, base + Vector3(0, 7.6, 0), ponta, 0.05)
			L.caixa(lum, ponta + Vector3(0, -0.2, 0), Vector3(0.5, 0.18, 0.9))
			postes.append(ponta + Vector3(0, -0.4, 0))
			if anterior != null:
				for k in 4:
					var dz: float = -0.9 + k * 0.6
					_fio(L, fio, (anterior as Vector3) + Vector3(0, 8.45 - (k % 2) * 0.12, dz), base + Vector3(0, 8.45 - (k % 2) * 0.12, dz), 0.55 + k * 0.1)
				_fio(L, fio, (anterior as Vector3) + Vector3(0, 6.8, 0.2), base + Vector3(0, 6.8, 0.2), 0.9)
				if rng.randf() < 0.25:   # fio atravessando a avenida
					_fio(L, fio, base + Vector3(0, 8.3, 0), Vector3(x + rng.randf_range(-3, 3), 8.3, -zp), 1.4)
			anterior = base
			x += rng.randf_range(26, 32)
	# orelhões, bancas, pontos de ônibus, lixeiras, caçambas, hidrantes
	var laranja := m_cor(Color("e46a1f"))
	for p in [Vector2(-60, 14.6), Vector2(40, 14.4), Vector2(150, -14.6), Vector2(240, 14.5), Vector2(-150, -14.4), Vector2(-20, -14.6)]:
		L.tubo(m_cor(Color("3a3a3c")), Vector3(p.x, 0, p.y), Vector3(p.x, 2.0, p.y), 0.05)
		L.caixa(laranja, Vector3(p.x, 1.5, p.y + 0.3 * sign(p.y)), Vector3(0.9, 1.1, 0.7))
		col.circ(p, 0.4)
	for p in [Vector2(60, -14.2), Vector2(-110, 14.3), Vector2(260, -14.3)]:
		L.caixa(m_cor(Color("2f6a3a")), Vector3(p.x, 0, p.y), Vector3(3.2, 2.6, 2.2))
		L.caixa(m_cor(Color("e8e2c8")), Vector3(p.x, 2.6, p.y), Vector3(3.6, 0.2, 2.6))
		col.ret(Rect2(p.x - 1.6, p.y - 1.1, 3.2, 2.2))
	for p in [Vector2(120, 14.0), Vector2(-90, -13.9), Vector2(230, -13.9)]:
		L.caixa(m_cor(Color("4a5a6a"), 0, 0.4), Vector3(p.x, 2.6, p.y), Vector3(5.0, 0.12, 1.8))
		for dx in [-2.3, 2.3]:
			L.tubo(m_cor(Color("4a5a6a"), 0, 0.4), Vector3(p.x + dx, 0, p.y), Vector3(p.x + dx, 2.6, p.y), 0.05)
		L.caixa(m_cor(Color("6f6f6a")), Vector3(p.x, 0.45, p.y + 0.4 * sign(p.y)), Vector3(4.0, 0.08, 0.5))
	for p in [Vector2(-30, 14.2), Vector2(70, -14.3), Vector2(180, 14.3), Vector2(-200, -14.3), Vector2(300, 14.2)]:
		L.cilindro(m_cor(Color("e07a1f")), Vector3(p.x, 0, p.y), 0.3, 0.9, 8)
	for p in [Vector2(140, 92), Vector2(-60, 92.5), Vector2(260, -141)]:
		L.caixa(m_cor(Color("d9822b")), Vector3(p.x, 0, p.y), Vector3(4.6, 1.4, 2.0))
		L.caixa(m_cor(Color("6f6a60")), Vector3(p.x, 1.2, p.y), Vector3(4.2, 0.4, 1.6))
		col.ret(Rect2(p.x - 2.3, p.y - 1.0, 4.6, 2.0))
	# semáforos nos cruzamentos da avenida
	for cx in [Mapa.V1.get_center().x, Mapa.V2.get_center().x]:
		for c in [Vector2(cx - 7.2, -12.4), Vector2(cx + 7.2, 12.4)]:
			L.tubo(m_cor(Color("2a2b2e")), Vector3(c.x, 0, c.y), Vector3(c.x, 5.2, c.y), 0.07)
			L.tubo(m_cor(Color("2a2b2e")), Vector3(c.x, 5.2, c.y), Vector3(c.x, 5.2, c.y + sign(-c.y) * 5.0), 0.05)
			var cab := Vector3(c.x, 4.6, c.y + sign(-c.y) * 4.6)
			L.caixa(m_cor(Color("1a1b1d")), cab, Vector3(0.35, 1.0, 0.35))
			L.caixa(m_cor(Color(1, 0.15, 0.1), 4.0), cab + Vector3(0, 0.7, 0.18 * sign(c.y)), Vector3(0.2, 0.2, 0.05))
			col.circ(c, 0.2)
	L.montar(self, "mobiliario")
	# copas: uma malha só para todas as árvores (leve). Cada copa = camadas de folhagem vistas de
	# cima (como as árvores do Zomboid) + duas em cruz para quem olha de lado.
	var copa := _malha_copa()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = copa
	mm.instance_count = _copas.size()
	for i in _copas.size():
		var p: Vector3 = _copas[i][0]
		var r: float = _copas[i][1]
		mm.set_instance_transform(i, Transform3D(Basis().scaled(Vector3(r, r * 0.9, r)).rotated(Vector3.UP, randf() * TAU), p))
		mm.set_instance_color(i, Color(0.8, 0.86, 0.72).lerp(Color(1.1, 1.1, 0.95), randf()))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	add_child(mmi)

func _malha_copa() -> ArrayMesh:
	var L := Lote.new()
	var mt := StandardMaterial3D.new()
	mt.albedo_texture = Predio.tex("copa.png")
	mt.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	mt.alpha_scissor_threshold = 0.45
	mt.vertex_color_use_as_albedo = true
	mt.cull_mode = BaseMaterial3D.CULL_DISABLED
	mt.roughness = 1.0
	mt.backlight_enabled = true
	mt.backlight = Color(0.25, 0.3, 0.12)
	for k in 4:
		var y := -0.6 + k * 0.42
		var s2: float = 1.25 - absf(k - 1.3) * 0.22
		var g := k * 0.9
		var u := Vector3(cos(g), 0, sin(g)) * 2.0 * s2
		var v := Vector3(-sin(g), 0, cos(g)) * 2.0 * s2
		L.quad(mt, Vector3(0, y, 0) - u * 0.5 - v * 0.5, u, v, Color(0.85 + k * 0.06, 0.85 + k * 0.06, 0.85 + k * 0.06), Vector2.ZERO, false)
	for k in 2:
		var g2 := k * PI * 0.5 + 0.4
		var u2 := Vector3(cos(g2), 0, sin(g2)) * 2.3
		L.quad(mt, Vector3(0, -1.0, 0) - u2 * 0.5, u2, Vector3(0, 2.1, 0), Color(0.75, 0.75, 0.75), Vector2.ZERO, false)
	var tmp := Node3D.new()
	var mi := L.montar(tmp)
	var mesh: ArrayMesh = mi.mesh
	tmp.free()
	return mesh

func _fio(L: Lote, mt: Material, a: Vector3, b: Vector3, cai: float) -> void:
	var n := 7
	var prev := a
	for i in range(1, n + 1):
		var t := float(i) / n
		var p := a.lerp(b, t) - Vector3(0, sin(t * PI) * cai, 0)
		L.tubo(mt, prev, p, 0.018)
		prev = p

func _fundo(rng: RandomNumberGenerator) -> void:
	## Silhueta da cidade em volta do mapa (caixas simples com janelas acesas pela fachada).
	var anel := []
	var x := -330.0
	while x < 420:
		anel.append(Rect2(x, 158 + rng.randf_range(0, 20), rng.randf_range(16, 30), rng.randf_range(14, 24)))
		anel.append(Rect2(x, -380 - rng.randf_range(0, 20), rng.randf_range(16, 30), rng.randf_range(14, 24)))
		x += rng.randf_range(22, 34)
	var z := -330.0
	while z < 170:
		anel.append(Rect2(-300 - rng.randf_range(0, 20), z, rng.randf_range(14, 24), rng.randf_range(16, 28)))
		anel.append(Rect2(370 + rng.randf_range(0, 20), z, rng.randf_range(14, 24), rng.randf_range(16, 28)))
		z += rng.randf_range(22, 32)
	# quarteirões densos a noroeste (atrás do hospital, onde não se anda)
	for i in 9:
		for j in 4:
			anel.append(Rect2(-240 + i * 36 + rng.randf_range(-3, 3), -330 + j * 40 + rng.randf_range(-3, 3), rng.randf_range(18, 28), rng.randf_range(18, 30)))
	for r in anel:
		var p := Predio.new()
		add_child(p)
		p.montar(r, rng.randi_range(3, 5), rng.randi() % 8, "", rng.randf())
		p.position.y = Mapa.altura(r.get_center().x, r.get_center().y) * 0.6
		p.set_process(false)
