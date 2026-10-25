extends Node2D
class_name Aircraft
## Helicóptero (com holofote) ou jato militar passando por cima da cidade.

var main: Node = null
var kind := "heli"
var path: Array = []
var speed := 260.0
var rotor := 0.0
var spot: PointLight2D = null
var _audio: AudioStreamPlayer2D = null
var alt := 160.0

func setup(m: Node, k: String, pts: Array, spd: float) -> Aircraft:
	main = m
	kind = k
	path = pts.duplicate()
	position = path.pop_front()
	speed = spd
	z_index = 40
	return self

func _ready() -> void:
	if kind == "heli":
		spot = FX.make_light(self, Vector2(0, alt), Color(1, 1, 0.92), 1.5, 1.3)
		_audio = main.audio.loop_at("helicoptero", self, -2)
	else:
		alt = 320
		main.audio.sfx("jato", position, 6)

func _process(delta: float) -> void:
	rotor += delta * 30.0
	if path.is_empty():
		queue_free()
		return
	var t: Vector2 = path[0]
	var d := t - position
	if d.length() < speed * delta:
		position = t
		path.pop_front()
	else:
		position += d.normalized() * speed * delta
		rotation = 0
	if spot:
		spot.position = Vector2(sin(rotor * 0.03) * 60, alt)
	queue_redraw()

func _draw() -> void:
	var dir := Vector2.RIGHT
	if not path.is_empty():
		dir = (path[0] - position).normalized()
	var a := dir.angle()
	# sombra no chão (bem abaixo)
	draw_set_transform(Vector2(30, alt), a, Vector2.ONE)
	if kind == "heli":
		draw_rect(Rect2(-30, -10, 60, 20), Color(0, 0, 0, 0.3))
		draw_set_transform(Vector2.ZERO, a, Vector2.ONE)
		draw_rect(Rect2(-34, -11, 52, 22), Color("2f3a2a"))
		draw_rect(Rect2(14, -8, 14, 16), Color("1c2430"))
		draw_rect(Rect2(-80, -3, 48, 6), Color("2f3a2a"))
		draw_rect(Rect2(-84, -12, 6, 24), Color("2f3a2a"))
		for i in 2:
			var r := Vector2.from_angle(rotor + i * PI * 0.5) * 62
			draw_line(-r, r, Color(0.1, 0.1, 0.1, 0.55), 4)
		draw_circle(Vector2.ZERO, 5, Color("111"))
		draw_circle(Vector2(-6, 0), 3, Color(3, 0.4, 0.4) if fmod(rotor, 6.0) < 1.0 else Color("400"))
	else:
		var wing := PackedVector2Array([Vector2(30, 0), Vector2(-10, -40), Vector2(-22, -40), Vector2(-12, 0), Vector2(-22, 40), Vector2(-10, 40)])
		draw_colored_polygon(wing, Color(0, 0, 0, 0.28))
		draw_set_transform(Vector2.ZERO, a, Vector2.ONE)
		draw_rect(Rect2(-40, -5, 80, 10), Color("5d6266"))
		draw_colored_polygon(wing, Color("6f757a"))
		draw_circle(Vector2(-42, 0), 5, Color(3, 1.6, 0.6))
