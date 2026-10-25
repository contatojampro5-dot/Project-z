extends Actor
class_name Civilian
## Pessoa comum da cidade, desenhada por código (leve). Anda calma, entra em pânico, pode ser mordida
## e levantar infectada.

var state := "calm"            # calm, panic, down, dead
var shirt := Color.WHITE
var pants := Color.BLACK
var skin := Color.WHITE
var hair := Color.BLACK
var phase := 0.0
var think := 0.0
var flee_to := Vector2.ZERO
var turn_t := 0.0
var will_turn := true
var bubble := ""
var bubble_t := 0.0
var elderly := false
var scared_t := 0.0

const SHIRTS := ["c94b3c", "2f6db3", "e0d6c2", "3f8a5a", "d9a32e", "6b4b8f", "1f2a38", "b8b8b8", "e07a5f", "4a6d7c"]
const PANTS := ["2a3140", "3b3b3b", "5a4632", "1d1f24", "6e6a5e", "2f4a6b"]
const SKINS := ["f1c8a4", "d9a77c", "b07a52", "8a5a3a", "5f3b26"]
const HAIRS := ["1d1a17", "3a2a1e", "6b4a2e", "a07a4a", "c9c4bb", "2a2420"]

func setup(m: Node, calm := true) -> Civilian:
	main = m
	state = "calm" if calm else "panic"
	shirt = Color(SHIRTS.pick_random())
	pants = Color(PANTS.pick_random())
	skin = Color(SKINS.pick_random())
	hair = Color(HAIRS.pick_random())
	elderly = randf() < 0.18
	if elderly:
		hair = Color("d8d4cc")
	speed = randf_range(150, 205)
	radius = 9.0
	shadow_r = 11.0
	phase = randf() * TAU
	return self

func panic(from := Vector2.INF) -> void:
	if state == "calm":
		state = "panic"
		scared_t = randf_range(0, 0.5)
		if randf() < 0.25:
			main.audio.scream(position)

func bitten(z: Node) -> void:
	state = "down"
	vel = Vector2.ZERO
	knock = (position - z.position).normalized() * 80
	turn_t = randf_range(3.5, 7.0)
	main.blood(position, 16)
	main.audio.scream(position, true)
	z_index = -1

func _physics_process(delta: float) -> void:
	bubble_t = max(0.0, bubble_t - delta)
	if state == "down":
		move(delta)
		if will_turn:
			turn_t -= delta
			if turn_t <= 0:
				main.turn_into_zombie(self)
				return
		queue_redraw()
		return
	if state == "dead":
		return
	think -= delta
	var want := Vector2.ZERO
	if move_target != null:
		want = scripted_velocity() / max(1.0, move_speed)
	elif state == "calm":
		if think <= 0:
			think = randf_range(2, 5)
			flee_to = position + Vector2.from_angle(randf() * TAU) * randf_range(40, 140)
		var d := flee_to - position
		if d.length() > 8:
			want = d.normalized() * 0.35
		var z: Node2D = main.nearest_zombie(position, 230)
		if z != null:
			panic()
	else:
		scared_t -= delta
		if think <= 0:
			think = randf_range(0.25, 0.6)
			var z2: Node2D = main.nearest_zombie(position, 320)
			if z2 != null:
				var away := (position - z2.position).normalized()
				flee_to = position + away.rotated(randf_range(-0.6, 0.6)) * 260
			elif main.flee_point != Vector2.INF and randf() < 0.7:
				flee_to = main.flee_point + Vector2(randf_range(-300, 300), randf_range(-200, 200))
			else:
				flee_to = position + Vector2.from_angle(randf() * TAU) * 200
		var d2 := flee_to - position
		if d2.length() > 10 and scared_t <= 0:
			want = d2.normalized()
	var spd := speed if state == "panic" else speed * 0.4
	if move_target != null:
		spd = move_speed
	if elderly:
		spd *= 0.7
	vel = vel.lerp(want * spd, clamp(delta * 7.0, 0, 1))
	if vel.length() > 5:
		heading = vel.angle()
	move(delta)
	phase += delta * vel.length() / 9.0
	queue_redraw()

func say(text: String, t := 3.5) -> void:
	bubble = text
	bubble_t = t

func _draw() -> void:
	if state == "down" or state == "dead":
		# deitado no chão
		draw_circle(Vector2(0, 0), 16, Color(0.35, 0.02, 0.03, 0.6))
		var body := Vector2.from_angle(heading + PI * 0.5)
		draw_line(-body * 12, body * 10, pants, 7)
		draw_line(-body * 2, body * 9, shirt, 9)
		draw_circle(body * 14, 5, skin)
		return
	super._draw()
	var s := ENTITY_SCALE * 1.25
	var swing := sin(phase) * (1.0 if vel.length() > 20 else 0.15)
	var facing_left := cos(heading) < -0.2
	var back := sin(heading) < -0.5
	draw_set_transform(Vector2.ZERO, 0, Vector2(-s if facing_left else s, s))
	# pernas
	draw_line(Vector2(-3, -16), Vector2(-3 + swing * 5, -1), pants, 5)
	draw_line(Vector2(3, -16), Vector2(3 - swing * 5, -1), pants, 5)
	# tronco
	draw_rect(Rect2(-7, -33, 14, 18), shirt)
	# braços (balançam correndo; em pânico ficam para cima às vezes)
	var arm_up := state == "panic" and fmod(phase, 6.0) < 1.2
	var ay := -40.0 if arm_up else -18.0 + swing * 3
	draw_line(Vector2(-7, -30), Vector2(-10 - swing * 3, ay), shirt.darkened(0.15), 4)
	draw_line(Vector2(7, -30), Vector2(10 + swing * 3, -18.0 - swing * 3 if not arm_up else -40.0), shirt.darkened(0.15), 4)
	# cabeça
	draw_circle(Vector2(0, -39), 6.5, skin)
	if back:
		draw_circle(Vector2(0, -40), 6.5, hair)
	else:
		draw_rect(Rect2(-6.5, -46, 13, 5), hair)
	draw_set_transform(Vector2.ZERO)
	if bubble_t > 0 and bubble != "":
		var f: Font = main.hud.font_ui
		var w := f.get_string_size(bubble, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
		draw_rect(Rect2(-w * 0.5 - 6, -78, w + 12, 20), Color(0, 0, 0, 0.6))
		draw_string(f, Vector2(-w * 0.5, -63), bubble, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(1.6, 1.6, 1.5))
