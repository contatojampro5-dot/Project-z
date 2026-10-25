extends Node2D
class_name Decals
## Marcas no chão: sangue e queimado. Lista com limite para ficar leve.

var marks: Array = []   # [pos, raio, cor, semente]
const MAX := 260

func _ready() -> void:
	z_index = -15

func add(p: Vector2, r: float, c: Color) -> void:
	marks.append([p, r, c, randi()])
	if marks.size() > MAX:
		marks.pop_front()
	queue_redraw()

func _draw() -> void:
	var rng := RandomNumberGenerator.new()
	for m in marks:
		rng.seed = m[3]
		var p: Vector2 = m[0]
		var r: float = m[1]
		var c: Color = m[2]
		for i in 6:
			var a := rng.randf() * TAU
			var d := rng.randf() * r * 0.7
			var cc := c
			cc.a *= rng.randf_range(0.5, 1.0)
			draw_circle(p + Vector2(cos(a), sin(a) * 0.6) * d, r * rng.randf_range(0.25, 0.6), cc)
