extends Node3D
class_name Aeronave
## Helicóptero (holofote que varre a rua, cone de luz visível) ou jato militar passando baixo.

var cena: Node = null
var tipo := "heli"
var caminho: Array = []
var vel := 30.0
var rotor: Node3D
var holofote: SpotLight3D
var cone: MeshInstance3D
var _t := 0.0
var alvo_luz = null      # Vector3 opcional: o holofote mira aqui

func montar(c: Node, t: String, pontos: Array, v: float) -> Aeronave:
	cena = c
	tipo = t
	caminho = pontos.duplicate()
	vel = v
	var L := Lote.new()
	if tipo == "heli":
		var corpo := Cidade.m_cor(Color("2e3a2c"), 0.0, 0.3)
		L.caixa(corpo, Vector3(0, 0, 0), Vector3(4.2, 1.9, 1.9))
		L.caixa(Cidade.m_cor(Color("1a222c"), 0.0, 0.6), Vector3(1.9, 0.5, 0), Vector3(1.0, 1.1, 1.7))
		L.caixa(corpo, Vector3(-4.6, 0.9, 0), Vector3(5.2, 0.45, 0.4))
		L.caixa(corpo, Vector3(-7.0, 0.9, 0), Vector3(0.6, 1.8, 0.12))
		for s in [-0.9, 0.9]:
			L.caixa(Cidade.m_cor(Color("1a1a1a")), Vector3(0, -0.5, s), Vector3(3.6, 0.08, 0.08))
		L.caixa(Cidade.m_cor(Color(3, 0.4, 0.4), 3.0), Vector3(-7.0, 2.0, 0), Vector3(0.2, 0.2, 0.2))
		L.montar(self, "heli")
		rotor = Node3D.new()
		rotor.position = Vector3(0, 2.1, 0)
		add_child(rotor)
		var Lr := Lote.new()
		var pa := Cidade.m_cor(Color("161616"))
		Lr.caixa(pa, Vector3.ZERO, Vector3(13.0, 0.05, 0.35))
		Lr.caixa(pa, Vector3.ZERO, Vector3(0.35, 0.05, 13.0))
		Lr.montar(rotor, "rotor")
		holofote = SpotLight3D.new()
		holofote.position = Vector3(1.6, -0.6, 0)
		holofote.spot_range = 90.0
		holofote.spot_angle = 9.0
		holofote.light_energy = 14.0
		holofote.light_color = Color(1.0, 0.98, 0.92)
		holofote.shadow_enabled = true
		add_child(holofote)
		# cone de luz visível (fake volumétrico)
		cone = MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.3
		cm.bottom_radius = 8.0
		cm.height = 60.0
		cm.radial_segments = 16
		cone.mesh = cm
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		m.albedo_color = Color(0.9, 0.92, 1.0, 0.05)
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		cone.material_override = m
		cone.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(cone)
		if cena:
			cena.audio.loop_em("helicoptero", self, 6.0, 160.0)
	else:
		var cinza := Cidade.m_cor(Color("6f757a"), 0.0, 0.5)
		L.caixa(cinza, Vector3.ZERO, Vector3(14.0, 1.4, 1.5))
		L.caixa(cinza, Vector3(-1.0, 0.4, 0), Vector3(5.0, 0.15, 11.0))
		L.caixa(cinza, Vector3(-6.0, 0.6, 0), Vector3(2.0, 0.12, 5.0))
		L.caixa(cinza, Vector3(-6.0, 1.4, 0), Vector3(2.0, 2.0, 0.12))
		L.caixa(Cidade.m_cor(Color(3, 1.6, 0.6), 4.0), Vector3(-7.1, 0, 0), Vector3(0.4, 0.8, 0.8))
		L.montar(self, "jato")
		if cena:
			cena.audio.som("jato", global_position if is_inside_tree() else pontos[0], 12.0)
	if not caminho.is_empty():
		position = caminho.pop_front()
	return self

func _process(delta: float) -> void:
	_t += delta
	if rotor:
		rotor.rotation.y += delta * 28.0
	if caminho.is_empty():
		queue_free()
		return
	var p: Vector3 = caminho[0]
	var d := p - global_position
	if d.length() < vel * delta:
		global_position = p
		caminho.pop_front()
	else:
		global_position += d.normalized() * vel * delta
		var ang := atan2(-d.z, d.x)
		rotation.y = lerp_angle(rotation.y, ang, delta * 2.0)
		rotation.z = -0.12 if tipo == "heli" else 0.0
	if holofote:
		var mira: Vector3 = alvo_luz if alvo_luz != null else global_position + Vector3(10 + sin(_t * 0.7) * 8, -global_position.y, cos(_t * 0.5) * 8)
		holofote.look_at(mira, Vector3.UP)
		var dl := mira - holofote.global_position
		cone.global_position = holofote.global_position + dl.normalized() * 30.0
		cone.look_at(cone.global_position + dl, Vector3.UP if absf(dl.normalized().y) < 0.99 else Vector3.RIGHT)
		cone.rotate_object_local(Vector3.RIGHT, PI * 0.5)
