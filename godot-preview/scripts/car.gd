extends Node2D
class_name Car
## Carro em caixa pseudo-3D. Pode estar parado, andando (fugindo), batido, pegando fogo ou queimado.

var main: Node = null
var body := Color("c0392b")
var size := Vector2(66, 30)   # comprimento x largura
var angle := 0.0
var state := "parked"          # parked, driving, crashed, burning, burnt
var speed := 0.0
var target := Vector2.ZERO
var kind := "carro"            # carro, viatura, ambulancia, onibus
var fire_node: Node2D = null
var low_idx := -1
var lights_on := false
var _t := 0.0
var _explode_in := -1.0
var _siren_l: PointLight2D = null
var _siren_r: PointLight2D = null
var _head: PointLight2D = null
var _audio: AudioStreamPlayer2D = null
var arrived_crash_fire := 2.5   # segundos até pegar fogo depois de bater (-1 = não pega)
var arrived_explode := -1.0     # segundos até explodir depois de bater (-1 = não explode)
var traffic_from = null        # Vector2: trânsito normal (volta ao começo da rua em vez de bater)

const COLORS := ["c0392b", "e8e4d8", "2c3e50", "7f8c8d", "d4a017", "1f4e79", "3a3a3a", "8e44ad", "b9b9b9", "a04000"]

func setup(m: Node, p: Vector2, ang: float, k := "carro", col := "") -> Car:
	main = m
	position = p
	angle = ang
	kind = k
	body = Color(col if col != "" else COLORS.pick_random())
	match kind:
		"viatura":
			body = Color("e9e9e9")
		"ambulancia":
			body = Color("f2f2ee")
			size = Vector2(80, 34)
		"onibus":
			body = Color("c8452f")
			size = Vector2(170, 40)
	return self

func _ready() -> void:
	if state != "driving":
		_register_obstacle()
	if kind == "viatura" or kind == "ambulancia":
		_siren_l = FX.make_light(self, Vector2(0, -26), Color(1, 0.1, 0.1), 0.0, 0.9)
		_siren_r = FX.make_light(self, Vector2(0, -26), Color(0.15, 0.3, 1), 0.0, 0.9)

func _register_obstacle() -> void:
	if low_idx >= 0:
		return
	var half := Vector2(abs(cos(angle)) * size.x + abs(sin(angle)) * size.y, abs(sin(angle)) * size.x + abs(cos(angle)) * size.y) * 0.5
	low_idx = main.world.add_low(Rect2(position - half * 0.86, half * 1.72))

func headlights(on: bool) -> void:
	lights_on = on
	if on and _head == null:
		_head = FX.make_light(self, Vector2.from_angle(angle) * 70, Color(1, 0.92, 0.7), 0.9, 1.1)
	queue_redraw()

func siren_sound(on: bool) -> void:
	if on and _audio == null:
		_audio = main.audio.loop_at("sirene", self, -8)
	elif not on and _audio:
		_audio.queue_free()
		_audio = null

func drive_to(p: Vector2, spd: float) -> void:
	state = "driving"
	target = p
	speed = spd
	angle = (p - position).angle()
	headlights(true)
	if low_idx >= 0:
		main.world.low_rects[low_idx] = Rect2()
		low_idx = -1

func _physics_process(delta: float) -> void:
	_t += delta
	if _siren_l:
		var on := fmod(_t, 0.5) < 0.25
		_siren_l.energy = 1.4 if on else 0.0
		_siren_r.energy = 0.0 if on else 1.4
	if state == "driving":
		var d := target - position
		var step := speed * delta
		if d.length() <= step:
			if traffic_from != null:
				position = traffic_from
			else:
				position = target
				crash(arrived_crash_fire, arrived_explode)
		else:
			position += d.normalized() * step
			_hit_people()
	if _explode_in > 0:
		_explode_in -= delta
		if _explode_in <= 0:
			explode()

func _hit_people() -> void:
	var fwd := Vector2.from_angle(angle)
	for a in main.actors_near(position + fwd * 30, 46):
		if a is Survivor:
			if not a.ghost:
				a.knock = (a.position - position).normalized() * 500 + fwd.orthogonal() * 200
				a.stun = 0.8
		elif a is Civilian and a.state != "down":
			a.knock = (a.position - position).normalized() * 600
		elif a is Zombie and a.alive:
			a.hit(3, fwd)

func crash(fire_after := 2.5, explode_after := -1.0) -> void:
	state = "crashed"
	speed = 0
	headlights(false)
	_register_obstacle()
	main.audio.sfx("impact", position, 4, 0.1)
	main.audio.sfx("explosion_02", position, -10, 0.2)
	FX.sparks(main.entities, position + Vector2.from_angle(angle) * size.x * 0.5, 26)
	FX.smoke(self, Vector2.from_angle(angle) * size.x * 0.4 + Vector2(0, -20), 0.8)
	queue_redraw()
	if fire_after >= 0:
		get_tree().create_timer(fire_after, false).timeout.connect(ignite)
	if explode_after > 0:
		_explode_in = explode_after

func ignite() -> void:
	if state == "burning" or state == "burnt" or not is_inside_tree():
		return
	state = "burning"
	fire_node = FX.fire(self, Vector2(0, -18), 1.3 if kind != "onibus" else 2.0)
	main.audio.loop_at("fire_loop", self, -10)
	queue_redraw()

func explode() -> void:
	FX.explosion(main.entities, position + Vector2(0, -16), 1.4)
	main.audio.sfx("explosion_01", position, 6)
	main.scorch(position, 70)
	for a in main.actors_near(position, 150):
		var dir: Vector2 = (a.position - position).normalized()
		if a is Zombie and a.alive:
			a.hit(5, dir)
		elif a is Civilian and a.state == "panic":
			a.knock = dir * 500
		elif a is Survivor:
			a.knock = dir * 420
			a.stun = 0.6
	if state != "burning":
		ignite()
	state = "burnt"
	body = Color("2b2622")
	queue_redraw()

func _draw() -> void:
	var dark := state == "burnt"
	var b := body.darkened(0.6) if dark else body
	draw_set_transform(Vector2(6, 4), angle, Vector2.ONE)
	draw_rect(Rect2(-size * 0.5, size), Color(0, 0, 0, 0.35))
	# lataria em 3 camadas (volume)
	var hgt := 14.0 if kind != "onibus" else 26.0
	for i in 3:
		var off := Vector2(0, -hgt * i / 3.0)
		draw_set_transform(off, angle, Vector2.ONE)
		draw_rect(Rect2(-size * 0.5, size), b.darkened(0.35 - i * 0.12))
	var top := Vector2(0, -hgt)
	draw_set_transform(top, angle, Vector2.ONE)
	draw_rect(Rect2(-size * 0.5, size), b)
	if kind == "onibus":
		var x := -size.x * 0.5 + 10
		while x < size.x * 0.5 - 20:
			draw_rect(Rect2(x, -size.y * 0.5 + 3, 16, size.y - 6), Color("2a3440") if not dark else Color("111111"))
			x += 22
	else:
		# cabine (para-brisa + teto)
		var cab := Rect2(-size.x * 0.18, -size.y * 0.42, size.x * 0.46, size.y * 0.84)
		draw_rect(cab, Color("26313d") if not dark else Color("101010"))
		draw_rect(Rect2(cab.position + Vector2(size.x * 0.08, 3), cab.size - Vector2(size.x * 0.16, 6)), b.lightened(0.08))
		if kind == "viatura":
			draw_rect(Rect2(-size.x * 0.5, -size.y * 0.5, size.x * 0.22, size.y), Color("1d2c4f"))
			draw_rect(Rect2(size.x * 0.28, -size.y * 0.5, size.x * 0.22, size.y), Color("1d2c4f"))
			draw_rect(Rect2(0, -size.y * 0.4, 6, size.y * 0.8), Color(2, 0.3, 0.3) if fmod(_t, 0.5) < 0.25 else Color(0.3, 0.4, 2))
		if kind == "ambulancia":
			draw_rect(Rect2(-size.x * 0.35, -4, 22, 8), Color("c0262a"))
			draw_rect(Rect2(-size.x * 0.35 + 7, -11, 8, 22), Color("c0262a"))
	# faróis e lanternas
	var hl := Color(2.5, 2.3, 1.8) if lights_on else Color("d8d3b0")
	draw_rect(Rect2(size.x * 0.5 - 4, -size.y * 0.5 + 3, 4, 6), hl)
	draw_rect(Rect2(size.x * 0.5 - 4, size.y * 0.5 - 9, 4, 6), hl)
	draw_rect(Rect2(-size.x * 0.5, -size.y * 0.5 + 3, 3, 6), Color("9a1c1c"))
	draw_rect(Rect2(-size.x * 0.5, size.y * 0.5 - 9, 3, 6), Color("9a1c1c"))
	draw_set_transform(Vector2.ZERO)
