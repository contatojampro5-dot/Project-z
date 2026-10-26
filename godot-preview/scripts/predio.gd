extends Node3D
class_name Predio
## Prédio de 3 a 5 andares (regra do dono) com fachada do atlas, platibanda, laje, caixa d'água,
## antenas e aparelhos de ar. Térreo com lojas nas faces viradas para a rua. Fica vazado em
## pontinhos quando esconde o personagem (só quando ele passa atrás).

const ANDAR := 3.0
static var foco: Node3D = null
static var camera: Camera3D = null
static var _shader: Shader = null
static var _tex := {}

var ret: Rect2
var andares := 4
var oco := false            # dá para entrar (o prédio some quando o foco está dentro)
var mat: ShaderMaterial
var topo: Node3D
var _fade := 0.0
var _dentro := 0.0
var aabb: AABB

static func tex(n: String) -> Texture2D:
	if not _tex.has(n):
		_tex[n] = load("res://assets/tex/%s" % n)
	return _tex[n]

## faces_loja: "s", "n", "l" (leste), "o" (oeste) — quais faces têm lojas no térreo
func montar(r: Rect2, n_andares: int, material_parede: int, faces_loja := "", semente := 0.0, telhado := "laje") -> Predio:
	ret = r
	andares = clampi(n_andares, 1, 5)
	if _shader == null:
		_shader = load("res://shaders/fachada.gdshader")
	mat = ShaderMaterial.new()
	mat.shader = _shader
	mat.set_shader_parameter("atlas", tex("fachadas.png"))
	mat.set_shader_parameter("atlas_luz", tex("fachadas_luz.png"))
	mat.set_shader_parameter("lojas", tex("lojas.png"))
	mat.set_shader_parameter("lojas_luz", tex("lojas_luz.png"))
	mat.set_shader_parameter("andares", float(andares))
	var h := andares * ANDAR
	var plat := 0.9 if telhado == "laje" else 0.0
	var H := h + plat
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var x0 := r.position.x
	var z0 := r.position.y
	var x1 := r.end.x
	var z1 := r.end.y
	var s := fposmod(semente, 1.0)
	var row := float(material_parede) / 8.0 + 0.01
	# (canto inicial, direção ao longo, face)
	_parede(st, Vector3(x0, 0, z1), Vector3(x1 - x0, 0, 0), H, "s" in faces_loja, s, row)
	_parede(st, Vector3(x1, 0, z0), Vector3(x0 - x1, 0, 0), H, "n" in faces_loja, s, row)
	_parede(st, Vector3(x0, 0, z0), Vector3(0, 0, z1 - z0), H, "o" in faces_loja, s, row)
	_parede(st, Vector3(x1, 0, z1), Vector3(0, 0, z0 - z1), H, "l" in faces_loja, s, row)
	var mesh := st.commit()
	mesh.surface_set_material(0, mat)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)
	aabb = AABB(Vector3(x0, 0, z0), Vector3(r.size.x, H, r.size.y))
	# telhado e coisas em cima (somem junto quando o prédio vaza)
	topo = Node3D.new()
	add_child(topo)
	var L := Lote.new()
	if telhado == "laje":
		var laje := Cidade.m("laje", 0.18)
		L.quad(laje, Vector3(x0, h + 0.05, z1), Vector3(r.size.x, 0, 0), Vector3(0, 0, -r.size.y), Color.WHITE, Vector2.ZERO, true, 0.18)
		var pl := Cidade.m_cor(Color("b9b4a8"))
		var e := 0.25
		L.caixa(pl, Vector3(r.get_center().x, h, z0 + e * 0.5), Vector3(r.size.x, plat, e))
		L.caixa(pl, Vector3(r.get_center().x, h, z1 - e * 0.5), Vector3(r.size.x, plat, e))
		L.caixa(pl, Vector3(x0 + e * 0.5, h, r.get_center().y), Vector3(e, plat, r.size.y))
		L.caixa(pl, Vector3(x1 - e * 0.5, h, r.get_center().y), Vector3(e, plat, r.size.y))
		_coisas_no_telhado(L, h, semente)
	else:
		_telhado_telha(L, h)
	L.montar(topo, "telhado")
	if faces_loja != "":
		_marquises(faces_loja, semente)
	return self

func _marquises(faces: String, semente: float) -> void:
	## marquise de concreto sobre as lojas, com toldos coloridos aqui e ali
	var L := Lote.new()
	var conc := Cidade.m_cor(Color("bdb7aa"))
	var cores := [Color("b8232a"), Color("1f4ea8"), Color("2f7a3a"), Color("d9a32e"), Color("e8e4da")]
	var rng := RandomNumberGenerator.new()
	rng.seed = int(semente * 9999.0) + 7
	var x0 := ret.position.x
	var z0 := ret.position.y
	var x1 := ret.end.x
	var z1 := ret.end.y
	var y := ANDAR + 0.05
	for f in faces:
		match f:
			"n":
				L.caixa(conc, Vector3((x0 + x1) * 0.5, y, z0 - 0.7), Vector3(ret.size.x, 0.18, 1.4))
				_toldos(L, rng, cores, Vector3(x0, y - 0.6, z0 - 0.4), Vector3(1, 0, 0), ret.size.x, Vector3(0, 0, -1))
			"s":
				L.caixa(conc, Vector3((x0 + x1) * 0.5, y, z1 + 0.7), Vector3(ret.size.x, 0.18, 1.4))
				_toldos(L, rng, cores, Vector3(x0, y - 0.6, z1 + 0.4), Vector3(1, 0, 0), ret.size.x, Vector3(0, 0, 1))
			"l":
				L.caixa(conc, Vector3(x1 + 0.7, y, (z0 + z1) * 0.5), Vector3(1.4, 0.18, ret.size.y))
			"o":
				L.caixa(conc, Vector3(x0 - 0.7, y, (z0 + z1) * 0.5), Vector3(1.4, 0.18, ret.size.y))
	L.montar(self, "marquises")

func _toldos(L: Lote, rng: RandomNumberGenerator, cores: Array, o: Vector3, ao_longo: Vector3, comp: float, fora: Vector3) -> void:
	var x := 0.6
	while x < comp - 4.0:
		if rng.randf() < 0.45:
			var c: Color = cores[rng.randi() % cores.size()]
			var a := o + ao_longo * x
			L.quad(Cidade.m_cor(c), a, ao_longo * 4.0, fora * 1.2 + Vector3(0, -0.5, 0))
		x += 5.0


func _parede(st: SurfaceTool, o: Vector3, U: Vector3, H: float, loja: bool, s: float, row: float) -> void:
	var V := Vector3(0, H, 0)
	var n := U.cross(V).normalized()
	var lu := U.length()
	var c := Color(1.0 if loja else 0.0, s, row)
	var pts := [o, o + V, o + U + V, o, o + U + V, o + U]
	var uvs := [Vector2(0, 0), Vector2(0, H), Vector2(lu, H), Vector2(0, 0), Vector2(lu, H), Vector2(lu, 0)]
	for i in 6:
		st.set_color(c)
		st.set_normal(n)
		st.set_uv(uvs[i])
		st.add_vertex(pts[i])

func _coisas_no_telhado(L: Lote, h: float, semente: float) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = int(semente * 100000.0) + int(ret.position.x * 13.0)
	var c := ret.get_center()
	# caixa d'água azul (bem brasileira) sobre uma base
	var cx := Vector3(c.x + rng.randf_range(-ret.size.x * 0.3, ret.size.x * 0.3), h, c.y + rng.randf_range(-ret.size.y * 0.3, ret.size.y * 0.3))
	L.caixa(Cidade.m_cor(Color("8d8a82")), cx, Vector3(2.6, 1.2, 2.6))
	L.cilindro(Cidade.m_cor(Color("2f5f9a")), cx + Vector3(0, 1.2, 0), 1.1, 1.5, 10)
	# casa de máquinas
	if ret.size.x > 14:
		L.caixa(Cidade.m("laje", 0.3), Vector3(c.x - ret.size.x * 0.25, h, c.y), Vector3(4, 2.4, 3.5))
	# aparelhos de ar e antenas
	for i in rng.randi_range(2, 6):
		var p := Vector3(rng.randf_range(ret.position.x + 1.5, ret.end.x - 1.5), h, rng.randf_range(ret.position.y + 1.5, ret.end.y - 1.5))
		L.caixa(Cidade.m_cor(Color("c9c9c2")), p, Vector3(0.9, 0.6, 0.6), rng.randf() * PI)
	for i in rng.randi_range(1, 3):
		var p2 := Vector3(rng.randf_range(ret.position.x + 1, ret.end.x - 1), h, rng.randf_range(ret.position.y + 1, ret.end.y - 1))
		L.tubo(Cidade.m_cor(Color("3a3a3c")), p2, p2 + Vector3(0, rng.randf_range(2.5, 5.0), 0), 0.04)
		L.tubo(Cidade.m_cor(Color("3a3a3c")), p2 + Vector3(-0.6, 2.2, 0), p2 + Vector3(0.6, 2.2, 0), 0.03)

func _telhado_telha(L: Lote, h: float) -> void:
	# telhado de duas águas com telha cerâmica (casas)
	var t := Cidade.m("telha", 0.35)
	var x0 := ret.position.x - 0.4
	var x1 := ret.end.x + 0.4
	var z0 := ret.position.y - 0.4
	var z1 := ret.end.y + 0.4
	var zm := (z0 + z1) * 0.5
	var cume := h + ret.size.y * 0.32
	L.quad(t, Vector3(x0, h, z1), Vector3(x1 - x0, 0, 0), Vector3(0, cume - h, zm - z1), Color.WHITE, Vector2.ZERO, true, 0.35)
	L.quad(t, Vector3(x1, h, z0), Vector3(x0 - x1, 0, 0), Vector3(0, cume - h, zm - z0), Color.WHITE, Vector2.ZERO, true, 0.35)
	var oitao := Cidade.m_cor(Color("cdbfa6"))
	L.tri(oitao, Vector3(x0 + 0.4, h, z1 - 0.4), Vector3(x0 + 0.4, cume - 0.05, zm), Vector3(x0 + 0.4, h, z0 + 0.4))
	L.tri(oitao, Vector3(x1 - 0.4, h, z0 + 0.4), Vector3(x1 - 0.4, cume - 0.05, zm), Vector3(x1 - 0.4, h, z1 - 0.4))
	# caixa d'água na casa
	L.cilindro(Cidade.m_cor(Color("2f5f9a")), Vector3(ret.end.x - 2.0, h, ret.position.y + 2.0), 0.8, 1.1, 10)

func _process(delta: float) -> void:
	var alvo_fade := 0.0
	var alvo_dentro := 0.0
	if foco and is_instance_valid(foco) and camera:
		var p := foco.global_position
		if oco and ret.grow(-0.3).has_point(Vector2(p.x, p.z)):
			alvo_dentro = 1.0
		else:
			# esconde o personagem? (pé/cabeça → câmera atravessa o prédio): abre um buraco de visão
			var cam := camera.global_position
			for alt in [0.4, 1.6]:
				var a := p + Vector3(0, alt, 0)
				if aabb.grow(0.2).intersects_segment(a, cam):
					alvo_fade = 1.0
					break
	_fade = move_toward(_fade, alvo_fade, delta * 3.0)
	_dentro = move_toward(_dentro, alvo_dentro, delta * 2.5)
	mat.set_shader_parameter("fade", _fade)
	mat.set_shader_parameter("dentro", _dentro)
	topo.visible = _dentro < 0.4
