extends RefCounted
class_name FX
## Efeitos de cinema (Héstia + Hélio). Sem tremor de tela (regra do dono): o impacto das explosões
## vem do clarão, da bola de fogo, da onda de choque, dos destroços e da coluna de fumaça.

static var _mats := {}

static func _mat(tex: String, aditivo: bool, quadros := 1, sem_luz := true) -> StandardMaterial3D:
	var k := tex + str(aditivo) + str(quadros) + str(sem_luz)
	if not _mats.has(k):
		var m := StandardMaterial3D.new()
		m.albedo_texture = Predio.tex(tex + ".png")
		m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
		m.billboard_keep_scale = true
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.vertex_color_use_as_albedo = true
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED if sem_luz else BaseMaterial3D.SHADING_MODE_PER_PIXEL
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		if aditivo:
			m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		if quadros > 1:
			m.particles_anim_h_frames = 4
			m.particles_anim_v_frames = 4
			m.particles_anim_loop = true
		_mats[k] = m
	return _mats[k]

static func _quad(tam: float, m: Material) -> QuadMesh:
	var q := QuadMesh.new()
	q.size = Vector2(tam, tam)
	q.material = m
	return q

static func _rampa(cores: Array) -> Gradient:
	var g := Gradient.new()
	g.offsets = PackedFloat32Array(cores.map(func(c): return c[0]))
	g.colors = PackedColorArray(cores.map(func(c): return c[1]))
	return g

static func _curva(pts: Array) -> Curve:
	var c := Curve.new()
	for p in pts:
		c.add_point(p)
	return c

static func luz(pai: Node3D, pos: Vector3, cor: Color, energia: float, alcance: float) -> OmniLight3D:
	var l := OmniLight3D.new()
	l.position = pos
	l.light_color = cor
	l.light_energy = energia
	l.omni_range = alcance
	l.omni_attenuation = 1.2
	pai.add_child(l)
	return l

## Fogo que fica queimando (carros, destroços, prédios). Devolve o nó.
static func fogo(pai: Node3D, pos: Vector3, tam := 1.0) -> Node3D:
	var raiz := Node3D.new()
	raiz.position = pos
	pai.add_child(raiz)
	var f := CPUParticles3D.new()
	f.amount = int(22 * tam) + 6
	f.lifetime = 0.9
	f.mesh = _quad(1.6 * tam, _mat("fogo", true, 16))
	f.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	f.emission_sphere_radius = 0.7 * tam
	f.direction = Vector3.UP
	f.spread = 12
	f.gravity = Vector3(0, 2.5, 0)
	f.initial_velocity_min = 0.6
	f.initial_velocity_max = 1.6
	f.scale_amount_min = 0.7
	f.scale_amount_max = 1.4
	f.scale_amount_curve = _curva([Vector2(0, 0.6), Vector2(0.3, 1.0), Vector2(1, 0.2)])
	f.anim_speed_min = 1.0
	f.anim_speed_max = 1.4
	f.anim_offset_max = 1.0
	f.angle_min = -15
	f.angle_max = 15
	f.color_ramp = _rampa([[0.0, Color(1.6, 1.2, 0.8, 0.0)], [0.12, Color(1.8, 1.3, 0.8, 1)], [0.7, Color(1.4, 0.6, 0.25, 0.8)], [1.0, Color(0.6, 0.2, 0.1, 0)]])
	raiz.add_child(f)
	# fumaça preta subindo (coluna)
	fumaca(raiz, Vector3(0, 1.2 * tam, 0), tam, true)
	# brasas
	var b := CPUParticles3D.new()
	b.amount = int(14 * tam) + 4
	b.lifetime = 2.2
	b.mesh = _quad(0.08, _mat("brilho", true))
	b.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	b.emission_sphere_radius = 0.6 * tam
	b.direction = Vector3.UP
	b.spread = 35
	b.gravity = Vector3(0.6, 1.2, 0)
	b.initial_velocity_min = 1.5
	b.initial_velocity_max = 4.0
	b.color = Color(3.0, 1.4, 0.4)
	raiz.add_child(b)
	# luz que tremula e tinge as paredes em volta
	var l := luz(raiz, Vector3(0, 1.2 * tam, 0), Color(1.0, 0.5, 0.18), 2.8 * tam, 9.0 + 5.0 * tam)
	var tw := l.create_tween().set_loops()
	tw.tween_property(l, "light_energy", 2.0 * tam, randf_range(0.08, 0.15))
	tw.tween_property(l, "light_energy", 3.4 * tam, randf_range(0.06, 0.12))
	tw.tween_property(l, "light_energy", 2.6 * tam, randf_range(0.1, 0.18))
	return raiz

static func fumaca(pai: Node3D, pos: Vector3, tam := 1.0, preta := false) -> CPUParticles3D:
	var s := CPUParticles3D.new()
	s.position = pos
	s.amount = int(18 * tam) + 6
	s.lifetime = 6.0 + tam * 2.0
	s.mesh = _quad(3.0 * tam, _mat("fumaca", false, 1, false))
	s.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	s.emission_sphere_radius = 0.6 * tam
	s.direction = Vector3.UP
	s.spread = 14
	s.gravity = Vector3(0.9, 0.9, 0.3)
	s.initial_velocity_min = 1.2
	s.initial_velocity_max = 2.4
	s.damping_min = 0.2
	s.damping_max = 0.4
	s.angle_min = -180
	s.angle_max = 180
	s.angular_velocity_min = -10
	s.angular_velocity_max = 10
	s.scale_amount_curve = _curva([Vector2(0, 0.35), Vector2(1, 2.6)])
	var c0 := Color(0.12, 0.11, 0.11) if preta else Color(0.55, 0.53, 0.5)
	s.color_ramp = _rampa([[0.0, Color(c0, 0.0)], [0.1, Color(c0, 0.75)], [0.6, Color(c0.lightened(0.1), 0.45)], [1.0, Color(c0.lightened(0.2), 0.0)]])
	pai.add_child(s)
	return s

static func _uma_vez(p: CPUParticles3D, vida: float) -> void:
	p.one_shot = true
	p.explosiveness = 0.95
	p.emitting = true
	p.get_tree().create_timer(vida + 0.5, false).timeout.connect(p.queue_free)

static func faiscas(pai: Node3D, pos: Vector3, n := 30) -> void:
	var p := CPUParticles3D.new()
	p.position = pos
	p.amount = n
	p.lifetime = 0.7
	p.mesh = _quad(0.12, _mat("brilho", true))
	p.direction = Vector3.UP
	p.spread = 80
	p.gravity = Vector3(0, -12, 0)
	p.initial_velocity_min = 4
	p.initial_velocity_max = 11
	p.color = Color(3.0, 2.0, 0.9)
	pai.add_child(p)
	_uma_vez(p, 0.7)

static func vidro(pai: Node3D, pos: Vector3) -> void:
	var p := CPUParticles3D.new()
	p.position = pos
	p.amount = 40
	p.lifetime = 1.0
	var b := BoxMesh.new()
	b.size = Vector3(0.06, 0.02, 0.05)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.75, 0.85, 0.9)
	m.metallic = 0.8
	m.roughness = 0.1
	b.material = m
	p.mesh = b
	p.direction = Vector3.UP
	p.spread = 70
	p.gravity = Vector3(0, -14, 0)
	p.initial_velocity_min = 2
	p.initial_velocity_max = 6
	p.angular_velocity_min = -400
	p.angular_velocity_max = 400
	pai.add_child(p)
	_uma_vez(p, 1.0)

## Explosão: bola de fogo animada, clarão, onda de choque, destroços, brasas e coluna de fumaça.
static func explosao(pai: Node3D, pos: Vector3, tam := 1.0) -> void:
	var bola := CPUParticles3D.new()
	bola.position = pos
	bola.amount = 14
	bola.lifetime = 1.2
	bola.mesh = _quad(4.5 * tam, _mat("explosao", true, 16))
	bola.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	bola.emission_sphere_radius = 1.2 * tam
	bola.direction = Vector3.UP
	bola.spread = 60
	bola.initial_velocity_min = 1.5 * tam
	bola.initial_velocity_max = 4.5 * tam
	bola.gravity = Vector3(0, 3, 0)
	bola.anim_speed_min = 1.0
	bola.anim_speed_max = 1.0
	bola.scale_amount_min = 0.8
	bola.scale_amount_max = 1.6
	bola.scale_amount_curve = _curva([Vector2(0, 0.4), Vector2(0.25, 1.0), Vector2(1, 1.3)])
	bola.color_ramp = _rampa([[0.0, Color(2.6, 2.0, 1.4, 1)], [0.5, Color(1.6, 0.9, 0.5, 0.9)], [1.0, Color(0.4, 0.3, 0.25, 0)]])
	pai.add_child(bola)
	_uma_vez(bola, 1.2)
	faiscas(pai, pos, int(60 * tam))
	# destroços (pedaços escuros que voam e caem)
	var d := CPUParticles3D.new()
	d.position = pos
	d.amount = int(24 * tam)
	d.lifetime = 1.8
	var bm := BoxMesh.new()
	bm.size = Vector3(0.25, 0.12, 0.3)
	bm.material = Cidade.m_cor(Color("2a2622"))
	d.mesh = bm
	d.direction = Vector3.UP
	d.spread = 65
	d.gravity = Vector3(0, -15, 0)
	d.initial_velocity_min = 6 * tam
	d.initial_velocity_max = 14 * tam
	d.angular_velocity_min = -500
	d.angular_velocity_max = 500
	d.scale_amount_min = 0.5
	d.scale_amount_max = 1.6
	pai.add_child(d)
	_uma_vez(d, 1.8)
	# coluna de fumaça que sobe e fica um tempo
	var col := fumaca(pai, pos, 2.2 * tam, true)
	col.amount = 30
	col.lifetime = 9.0
	col.get_tree().create_timer(14.0, false).timeout.connect(col.set.bind("emitting", false))
	col.get_tree().create_timer(24.0, false).timeout.connect(col.queue_free)
	# clarão forte (no lugar do tremor de tela)
	var l := luz(pai, pos + Vector3(0, 2, 0), Color(1.0, 0.65, 0.3), 16.0 * tam, 30.0 * tam)
	var tw := l.create_tween()
	tw.tween_property(l, "light_energy", 0.0, 1.6).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_EXPO)
	tw.tween_callback(l.queue_free)
	# onda de choque (anel no chão)
	var anel := MeshInstance3D.new()
	var tor := TorusMesh.new()
	tor.inner_radius = 0.9
	tor.outer_radius = 1.0
	anel.mesh = tor
	var am := StandardMaterial3D.new()
	am.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	am.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	am.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	am.albedo_color = Color(1.0, 0.8, 0.6, 0.7)
	anel.material_override = am
	anel.position = Vector3(pos.x, 0.3, pos.z)
	anel.scale = Vector3(0.5, 0.15, 0.5)
	pai.add_child(anel)
	var ta := anel.create_tween().set_parallel()
	ta.tween_property(anel, "scale", Vector3(14 * tam, 0.4, 14 * tam), 0.5).set_ease(Tween.EASE_OUT)
	ta.tween_property(am, "albedo_color:a", 0.0, 0.5)
	ta.chain().tween_callback(anel.queue_free)

## Mancha no chão (sangue, queimado): um quadrado transparente deitado.
static func mancha(pai: Node3D, pos: Vector3, tam: float, tipo := "sangue") -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(tam, tam)
	mi.mesh = q
	var k := "mancha" + tipo
	if not _mats.has(k):
		var m := StandardMaterial3D.new()
		m.albedo_texture = Predio.tex(tipo + ".png")
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.roughness = 0.4 if tipo == "sangue" else 1.0
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		_mats[k] = m
	mi.material_override = _mats[k]
	mi.position = Vector3(pos.x, 0.17 if not Mapa.na_rua(Vector2(pos.x, pos.z)) else 0.05, pos.z)
	mi.rotation = Vector3(-PI * 0.5, randf() * TAU, 0)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	pai.add_child(mi)
	return mi
