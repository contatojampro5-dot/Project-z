extends RefCounted
class_name FX
## Fogo, fumaça, faíscas, clarões e explosões. Sem tremor de tela (regra do dono): o impacto vem da luz.

static var _light_tex: Texture2D = null
static var _soft_tex: Texture2D = null

static func light_tex() -> Texture2D:
	if _light_tex == null:
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1))
		g.set_color(1, Color(1, 1, 1, 0))
		g.add_point(0.35, Color(1, 1, 1, 0.55))
		var t := GradientTexture2D.new()
		t.gradient = g
		t.fill = GradientTexture2D.FILL_RADIAL
		t.fill_from = Vector2(0.5, 0.5)
		t.fill_to = Vector2(0.5, 0.0)
		t.width = 256
		t.height = 256
		_light_tex = t
	return _light_tex

static func soft_tex() -> Texture2D:
	if _soft_tex == null:
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1))
		g.set_color(1, Color(1, 1, 1, 0))
		var t := GradientTexture2D.new()
		t.gradient = g
		t.fill = GradientTexture2D.FILL_RADIAL
		t.fill_from = Vector2(0.5, 0.5)
		t.fill_to = Vector2(0.5, 0.0)
		t.width = 64
		t.height = 64
		_soft_tex = t
	return _soft_tex

static func make_light(parent: Node, pos: Vector2, color: Color, energy: float, scale: float) -> PointLight2D:
	var l := PointLight2D.new()
	l.texture = light_tex()
	l.color = color
	l.energy = energy
	l.texture_scale = scale
	l.position = pos
	parent.add_child(l)
	return l

static func _particles(amount: int, life: float, tex: Texture2D) -> CPUParticles2D:
	var p := CPUParticles2D.new()
	p.amount = amount
	p.lifetime = life
	p.texture = tex
	p.local_coords = false
	return p

## Fogo que fica queimando (carros, destroços). Devolve o nó para poder apagar depois.
static func fire(parent: Node, pos: Vector2, size := 1.0) -> Node2D:
	var root := Node2D.new()
	root.position = pos
	root.z_index = 6
	parent.add_child(root)
	var flame := _particles(int(26 * size), 0.7, soft_tex())
	flame.emission_shape = CPUParticles2D.EMISSION_SHAPE_SPHERE
	flame.emission_sphere_radius = 14.0 * size
	flame.direction = Vector2(0, -1)
	flame.spread = 18
	flame.gravity = Vector2(0, -60)
	flame.initial_velocity_min = 30
	flame.initial_velocity_max = 80
	flame.scale_amount_min = 0.5 * size
	flame.scale_amount_max = 1.0 * size
	var ramp := Gradient.new()
	ramp.set_color(0, Color(3.0, 2.2, 0.9, 1))
	ramp.add_point(0.35, Color(2.6, 0.9, 0.2, 0.9))
	ramp.set_color(1, Color(0.5, 0.1, 0.05, 0))
	flame.color_ramp = ramp
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	flame.material = mat
	root.add_child(flame)
	var smoke := _particles(int(16 * size), 3.2, soft_tex())
	smoke.position = Vector2(0, -20)
	smoke.direction = Vector2(0.3, -1)
	smoke.spread = 20
	smoke.gravity = Vector2(18, -25)
	smoke.initial_velocity_min = 20
	smoke.initial_velocity_max = 50
	smoke.scale_amount_min = 1.2 * size
	smoke.scale_amount_max = 2.6 * size
	var sr := Gradient.new()
	sr.set_color(0, Color(0.18, 0.16, 0.15, 0.55))
	sr.set_color(1, Color(0.25, 0.24, 0.24, 0))
	smoke.color_ramp = sr
	smoke.z_index = 4
	root.add_child(smoke)
	var l := make_light(root, Vector2(0, -10), Color(1.0, 0.55, 0.2), 1.4, 1.6 * size)
	var tw := root.create_tween().set_loops()
	tw.tween_property(l, "energy", 1.0, 0.12)
	tw.tween_property(l, "energy", 1.6, 0.09)
	tw.tween_property(l, "energy", 1.2, 0.15)
	return root

static func smoke(parent: Node, pos: Vector2, size := 1.0) -> Node2D:
	var s := _particles(int(10 * size), 3.5, soft_tex())
	s.position = pos
	s.z_index = 5
	s.direction = Vector2(0.2, -1)
	s.spread = 25
	s.gravity = Vector2(14, -18)
	s.initial_velocity_min = 10
	s.initial_velocity_max = 30
	s.scale_amount_min = 1.0 * size
	s.scale_amount_max = 2.2 * size
	var sr := Gradient.new()
	sr.set_color(0, Color(0.55, 0.55, 0.55, 0.35))
	sr.set_color(1, Color(0.4, 0.4, 0.4, 0))
	s.color_ramp = sr
	parent.add_child(s)
	return s

static func sparks(parent: Node, pos: Vector2, n := 18) -> void:
	var p := _particles(n, 0.6, soft_tex())
	p.position = pos
	p.z_index = 7
	p.one_shot = true
	p.explosiveness = 1.0
	p.spread = 180
	p.initial_velocity_min = 120
	p.initial_velocity_max = 320
	p.gravity = Vector2(0, 300)
	p.scale_amount_min = 0.08
	p.scale_amount_max = 0.18
	p.color = Color(3, 2.2, 1.0)
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	p.material = mat
	parent.add_child(p)
	p.emitting = true
	p.finished.connect(p.queue_free)

## Explosão: bola de fogo, onda de choque, brasas e um clarão forte (no lugar do tremor de tela).
static func explosion(parent: Node, pos: Vector2, size := 1.0) -> void:
	var p := _particles(int(40 * size), 0.9, soft_tex())
	p.position = pos
	p.z_index = 8
	p.one_shot = true
	p.explosiveness = 0.95
	p.spread = 180
	p.initial_velocity_min = 60 * size
	p.initial_velocity_max = 260 * size
	p.damping_min = 120
	p.damping_max = 200
	p.scale_amount_min = 1.0 * size
	p.scale_amount_max = 2.4 * size
	var ramp := Gradient.new()
	ramp.set_color(0, Color(4, 3.2, 1.6, 1))
	ramp.add_point(0.3, Color(3, 1.1, 0.2, 0.9))
	ramp.set_color(1, Color(0.2, 0.15, 0.12, 0))
	p.color_ramp = ramp
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	p.material = mat
	parent.add_child(p)
	p.emitting = true
	p.finished.connect(p.queue_free)
	sparks(parent, pos, int(30 * size))
	var l := make_light(parent, pos, Color(1.0, 0.6, 0.25), 4.0, 4.0 * size)
	var tw := l.create_tween()
	tw.tween_property(l, "energy", 0.0, 1.4).set_ease(Tween.EASE_OUT)
	tw.tween_callback(l.queue_free)
	var ring := ShockRing.new()
	ring.position = pos
	ring.max_r = 140 * size
	parent.add_child(ring)
