extends Node2D
class_name Building
## Prédio em caixa pseudo-3D (câmera alta ao sul): fachada sul + telhado deslocado para cima.
## Regra do dono: prédios de 3 a 5 andares, translúcidos só quando o personagem passa atrás.

const FLOOR_H := 24.0
static var focus: Node2D = null
static var font_title: Font = null

var rect: Rect2
var floors := 4
var kind := "generic"
var label := ""
var wall := Color("b8b4a8")
var roof := Color("9c9a92")
var hollow := false   # true = dá para entrar (o telhado some quando o foco está dentro)
var H := 0.0
var _lit: Array = []
var _alpha := 1.0

func setup(r: Rect2, f: int, k := "generic", lbl := "", wall_c := Color("b8b4a8"), roof_c := Color("9c9a92")) -> Building:
	rect = r
	floors = clampi(f, 1, 5)
	kind = k
	label = lbl
	wall = wall_c
	roof = roof_c
	H = floors * FLOOR_H
	if kind == "estadio":
		H = 70.0
	position = Vector2(r.position.x, r.end.y)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(r.position.x * 13 + r.position.y * 7)
	var cols := int(r.size.x / 26.0)
	for i in floors * cols:
		_lit.append(rng.randf() < 0.42)
	if font_title == null:
		font_title = load("res://assets/fonts/titulo.ttf")
	return self

func screen_rect() -> Rect2:
	return Rect2(rect.position.x, rect.position.y - H, rect.size.x, rect.size.y + H)

func _process(delta: float) -> void:
	var target := 1.0
	if focus and is_instance_valid(focus):
		var p := focus.global_position
		if hollow and rect.has_point(p):
			target = 0.0
		elif screen_rect().grow(-4).has_point(p) and p.y < rect.end.y - 2:
			target = 0.35
	_alpha = move_toward(_alpha, target, delta * 3.0)
	modulate.a = _alpha

func _draw() -> void:
	if kind == "estadio":
		_draw_estadio()
		return
	var w := rect.size.x
	var h := rect.size.y
	# sombra para o leste (sol se pondo a oeste)
	var sh := PackedVector2Array([Vector2(w, -h), Vector2(w + H * 0.9, -h + H * 0.25), Vector2(w + H * 0.9, H * 0.25), Vector2(w, 0)])
	draw_colored_polygon(sh, Color(0, 0, 0, 0.28))
	# fachada sul
	var face := Rect2(0, -H, w, H)
	draw_rect(face, wall.darkened(0.18))
	draw_rect(Rect2(0, -4, w, 4), wall.darkened(0.45))
	# janelas
	var cols := int(w / 26.0)
	var idx := 0
	for f in floors:
		for c in cols:
			var lit: bool = _lit[idx] if idx < _lit.size() else false
			idx += 1
			var wx := 8 + c * 26
			var wy := -H + 6 + f * FLOOR_H
			if wx + 12 > w - 4:
				continue
			var col := Color(2.0, 1.55, 0.8) if lit else Color("3a4450")
			draw_rect(Rect2(wx, wy, 12, 12), col)
	# telhado
	var top := Rect2(0, -h - H, w, h)
	draw_rect(top, roof)
	draw_rect(top, roof.lightened(0.25), false, 3)
	_roof_details(top)
	# placa na fachada
	if label != "":
		var fs := 26 if w > 500 else 18
		var tw := font_title.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
		var plate := Rect2(w * 0.5 - tw * 0.5 - 14, -H + 4, tw + 28, fs + 8)
		var plate_c := Color("1b1d20")
		if kind == "mercado":
			plate_c = Color("8e1a1a")
			draw_rect(Rect2(0, -H, w, 6), Color("c0262a"))
		draw_rect(plate, plate_c)
		draw_string(font_title, Vector2(plate.position.x + 14, plate.position.y + fs + 1), label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(2.2, 2.1, 1.9))

func _roof_details(top: Rect2) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = int(rect.position.x)
	match kind:
		"hospital":
			var c := top.get_center()
			draw_circle(c, 70, Color("5d5f63"))
			draw_arc(c, 62, 0, TAU, 40, Color("e8e4d6"), 4)
			draw_rect(Rect2(c.x - 26, c.y - 30, 10, 60), Color("e8e4d6"))
			draw_rect(Rect2(c.x + 16, c.y - 30, 10, 60), Color("e8e4d6"))
			draw_rect(Rect2(c.x - 16, c.y - 5, 32, 10), Color("e8e4d6"))
			_ac_units(rng, top, 6)
		"faculdade":
			var y := top.position.y + 14
			while y < top.end.y - 30:
				draw_rect(Rect2(top.position.x + 16, y, top.size.x - 32, 16), Color("27364a"))
				y += 30
		"mercado":
			_ac_units(rng, top, 8)
		"casa":
			draw_rect(top, Color("a4513a"))
			draw_line(Vector2(top.position.x + 6, top.get_center().y), Vector2(top.end.x - 6, top.get_center().y), Color("7a3826"), 3)
			for i in 6:
				var yy := top.position.y + (i + 1) * top.size.y / 7.0
				draw_line(Vector2(top.position.x + 2, yy), Vector2(top.end.x - 2, yy), Color("8f4532"), 1)
		_:
			_ac_units(rng, top, 2)
			draw_rect(Rect2(top.position.x + top.size.x * 0.6, top.position.y + 10, 30, 22), Color("6f7377"))

func _ac_units(rng: RandomNumberGenerator, top: Rect2, n: int) -> void:
	for i in n:
		var p := Vector2(rng.randf_range(top.position.x + 10, top.end.x - 40), rng.randf_range(top.position.y + 10, top.end.y - 30))
		draw_rect(Rect2(p, Vector2(28, 18)), Color("8a8c8e"))
		draw_rect(Rect2(p + Vector2(4, 4), Vector2(10, 10)), Color("5b5e61"))

func _ellipse(c: Vector2, r: Vector2, from := 0.0, to := TAU, n := 64) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in n + 1:
		var a: float = lerp(from, to, float(i) / n)
		pts.append(c + Vector2(cos(a) * r.x, sin(a) * r.y))
	return pts

func _draw_estadio() -> void:
	# coordenadas locais: centro do estádio relativo à posição (que fica no pé da elipse)
	var R := rect.size * 0.5
	var c := Vector2(R.x, -R.y)
	# fachada (metade de baixo, entre o chão e o anel do telhado)
	var low := _ellipse(c, R, 0, PI, 48)
	var up := _ellipse(c - Vector2(0, H), R, PI, 0, 48)
	var face := PackedVector2Array(low)
	face.append_array(up)
	draw_colored_polygon(face, Color("8d8f92"))
	# arcos/portões na fachada
	for i in 12:
		var a := PI * (i + 0.5) / 12.0
		var p := c + Vector2(cos(a) * R.x, sin(a) * R.y)
		draw_rect(Rect2(p.x - 10, p.y - H * 0.55, 20, H * 0.5), Color("3b3d40"))
	# anel do telhado
	draw_colored_polygon(_ellipse(c - Vector2(0, H), R), Color("c7c8c4"))
	draw_colored_polygon(_ellipse(c - Vector2(0, H * 0.75), R * 0.86), Color("7c2328"))
	draw_colored_polygon(_ellipse(c - Vector2(0, H * 0.55), R * 0.76), Color("23345e"))
	# gramado
	var pc := c - Vector2(0, H * 0.35)
	var pr := R * 0.62
	draw_colored_polygon(_ellipse(pc, pr), Color("3f8a36"))
	var x0 := pc.x - pr.x * 0.8
	var i2 := 0
	while x0 < pc.x + pr.x * 0.8:
		if i2 % 2 == 0:
			draw_rect(Rect2(x0, pc.y - pr.y * 0.62, 50, pr.y * 1.24), Color("4a9a40"))
		x0 += 50
		i2 += 1
	draw_rect(Rect2(pc.x - pr.x * 0.8, pc.y - pr.y * 0.62, pr.x * 1.6, pr.y * 1.24), Color("e9e6d8"), false, 3)
	draw_line(Vector2(pc.x, pc.y - pr.y * 0.62), Vector2(pc.x, pc.y + pr.y * 0.62), Color("e9e6d8"), 3)
	draw_arc(pc, 50, 0, TAU, 32, Color("e9e6d8"), 3)
	if label != "":
		draw_string(font_title, c + Vector2(-60, R.y - 12), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 30, Color(2.2, 2.1, 1.9))
