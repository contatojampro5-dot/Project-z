extends Node2D
class_name ShockRing
## Onda de choque de uma explosão (anel que abre e some).

var max_r := 140.0
var t := 0.0

func _ready() -> void:
	z_index = 7

func _process(delta: float) -> void:
	t += delta / 0.45
	if t >= 1.0:
		queue_free()
	queue_redraw()

func _draw() -> void:
	var r: float = max_r * ease(t, 0.4)
	draw_set_transform(Vector2.ZERO, 0, Vector2(1, 0.55))
	draw_arc(Vector2.ZERO, r, 0, TAU, 48, Color(1.6, 1.3, 1.0, 0.6 * (1.0 - t)), 6.0 * (1.0 - t) + 1.0)
