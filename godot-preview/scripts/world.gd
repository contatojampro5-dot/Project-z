extends Node2D
class_name World
## Chão da cidade (ruas, calçadas, estacionamentos, pátio da faculdade, morro e trilha) e as colisões.
## O mapa segue a foto aérea do Theo: Hospital a oeste, Faculdade no meio, Estádio a leste,
## Mercado do outro lado da avenida e o morro com a casa lá em cima, ao norte.

const BOUNDS := Rect2(0, -1500, 4800, 4700)

# Ruas (asfalto)
const H0 := Rect2(0, 520, 4800, 110)       # rua ao pé do morro
const H1 := Rect2(0, 1600, 4800, 240)      # Av. Celso Garcia (com canteiro central)
const MEDIAN := Rect2(0, 1700, 4800, 40)
const H2 := Rect2(0, 2620, 4800, 110)      # rua dos fundos do mercado
const V1 := Rect2(1500, 520, 170, 2680)
const V2 := Rect2(3050, 520, 170, 2680)
const ROADS := [H0, H1, H2, V1, V2]

# Lugares da história
const HOSPITAL := Rect2(220, 760, 1060, 520)
const FAC_N := Rect2(1760, 700, 1200, 170)
const FAC_W := Rect2(1760, 870, 200, 420)
const FAC_E := Rect2(2760, 870, 200, 420)
const FAC_COURT := Rect2(1960, 870, 800, 600)
const QUADRA := Rect2(2470, 960, 220, 320)
const MERCADO := Rect2(1780, 2120, 760, 300)
const MERCADO_LOT := Rect2(1700, 1860, 1300, 240)
const HOSP_LOT := Rect2(220, 1300, 1060, 280)
const ESTADIO_C := Vector2(4000, 1110)
const ESTADIO_R := Vector2(640, 410)

const TRAIL := [Vector2(3300, 560), Vector2(3280, 300), Vector2(3560, 110), Vector2(3430, -170),
	Vector2(3860, -360), Vector2(3690, -640), Vector2(4060, -840), Vector2(3900, -1080), Vector2(4130, -1240)]
const SUMMIT := Vector2(4130, -1240)

var obstacles: Array[Rect2] = []
var circles: Array = []          # [Vector2 centro, raio]
var low_rects: Array[Rect2] = [] # obstáculos baixos (dá para pular com Espaço)
var morro_poly := PackedVector2Array()
var rng := RandomNumberGenerator.new()
var _canopy: Array = []
var _court_trees: Array = []
var lamps: Array = []            # postes de luz (o diretor acende ao anoitecer)

func _ready() -> void:
	z_index = -20
	rng.seed = 7
	_build_morro()
	# canteiro central com árvores (como na foto)
	var x := 60.0
	while x < 4800:
		if not (abs(x - 1585) < 140 or abs(x - 3135) < 140):
			circles.append([Vector2(x, MEDIAN.get_center().y), 13.0])
		x += 150
	# árvores do pátio da faculdade
	for p in [Vector2(2030, 1340), Vector2(2150, 1380), Vector2(2330, 1330), Vector2(2650, 1390), Vector2(2080, 960)]:
		_court_trees.append(p)
		circles.append([p, 14.0])
	# muro da faculdade com portão no meio (o portão fica aberto)
	obstacles.append(Rect2(1700, 1470, 580, 18))
	obstacles.append(Rect2(2420, 1470, 600, 18))
	# postes de luz ao longo da avenida, da V2 e da rua do morro
	var lx := 100.0
	while lx < 4800:
		if not _near_cross(lx):
			lamps.append(Vector2(lx, H1.position.y - 14))
			lamps.append(Vector2(lx + 160, H1.end.y + 14))
		lx += 340
	var ly := 760.0
	while ly < 2600:
		if not _near_cross_y(ly):
			lamps.append(Vector2(V2.position.x - 14, ly))
			lamps.append(Vector2(V1.end.x + 14, ly + 150))
		ly += 320
	# limites da cidade
	obstacles.append(Rect2(-200, -1700, 200, 5200))
	obstacles.append(Rect2(4800, -1700, 200, 5200))
	obstacles.append(Rect2(-200, 3200, 5200, 200))
	obstacles.append(Rect2(-200, -1700, 5200, 200))
	# cidade ao longe (noroeste, atrás do hospital) — não dá para entrar
	obstacles.append(Rect2(0, -1500, 1900, 2020))
	queue_redraw()

func _build_morro() -> void:
	# contorno irregular do morro (acima da rua H0, do x=1900 para o leste)
	morro_poly.append(Vector2(1900, 520))
	var x := 1900.0
	while x <= 4800:
		morro_poly.append(Vector2(x, 520 - rng.randf_range(0, 18)))
		x += 120
	morro_poly.append(Vector2(4800, -1500))
	morro_poly.append(Vector2(1900, -1500))
	# copas das árvores (deixa a trilha livre)
	var tries := 0
	while _canopy.size() < 900 and tries < 6000:
		tries += 1
		var p := Vector2(rng.randf_range(1920, 4790), rng.randf_range(-1490, 500))
		var d := trail_distance(p)
		if d < 70:
			continue
		if p.distance_to(SUMMIT) < 230:
			continue
		_canopy.append([p, rng.randf_range(16, 34), rng.randf()])

func trail_distance(p: Vector2) -> float:
	var best := 1e9
	for i in TRAIL.size() - 1:
		var a: Vector2 = TRAIL[i]
		var b: Vector2 = TRAIL[i + 1]
		var q := Geometry2D.get_closest_point_to_segment(p, a, b)
		best = min(best, p.distance_to(q))
	return best

func in_morro(p: Vector2) -> bool:
	return p.y < 515 and p.x > 1900

## Colisão de um círculo (pés do personagem) com o mundo.
func blocked(p: Vector2, r: float, ignore_low := false) -> bool:
	if in_morro(p):
		# no morro só se anda pela trilha ou pelo topo
		if trail_distance(p) > 46 and p.distance_to(SUMMIT) > 210:
			return true
	for o in obstacles:
		if o.grow(r).has_point(p):
			return true
	if not ignore_low:
		for o in low_rects:
			if o.grow(r).has_point(p):
				return true
	for c in circles:
		if p.distance_to(c[0]) < r + c[1]:
			return true
	if _in_estadio(p, r):
		return true
	return false

func _in_estadio(p: Vector2, r: float) -> bool:
	var d := (p - ESTADIO_C) / (ESTADIO_R + Vector2(r, r))
	return d.length_squared() < 1.0

## Há algo baixo (carro, barreira) logo à frente para pular?
func low_ahead(p: Vector2, dir: Vector2, dist := 70.0) -> bool:
	for k in [24.0, 44.0, dist]:
		var q: Vector2 = p + dir * k
		for o in low_rects:
			if o.grow(6).has_point(q):
				return true
	return false

func add_low(r: Rect2) -> int:
	low_rects.append(r)
	return low_rects.size() - 1

func on_road(p: Vector2) -> bool:
	for r in ROADS:
		if r.has_point(p):
			return true
	return false

# ---------------------------------------------------------------- desenho do chão
func _draw() -> void:
	var concreto := Color("8c8a80")
	var lote := Color("6c6b64")
	var asfalto := Color("323337")
	var grama := Color("4b6a33")
	draw_rect(BOUNDS, concreto)
	# lotes (miolo das quadras um pouco mais escuro)
	for r in [Rect2(0, 640, 1490, 950), Rect2(1680, 640, 1360, 950), Rect2(3230, 640, 1570, 950),
			Rect2(0, 1850, 1490, 760), Rect2(1680, 1850, 1360, 760), Rect2(3230, 1850, 1570, 760),
			Rect2(0, 2740, 4800, 460)]:
		draw_rect(r.grow(-14), lote)
	# cidade distante (noroeste)
	draw_rect(Rect2(0, -1500, 1900, 2020), Color("2c2e30"))
	# morro
	draw_colored_polygon(morro_poly, grama)
	draw_rect(Rect2(1900, -1500, 2900, 300), Color("3e5a2a"))
	# trilha de terra
	var trail := PackedVector2Array(TRAIL)
	draw_polyline(trail, Color("6e5236"), 64, true)
	draw_polyline(trail, Color("8d6a45"), 46, true)
	draw_circle(SUMMIT, 200, Color("5d7a3b"))
	draw_circle(SUMMIT, 120, Color("8d6a45"))
	# ruas
	for r in ROADS:
		draw_rect(r, asfalto)
	draw_rect(MEDIAN, Color("55703a"))
	draw_rect(Rect2(MEDIAN.position.x, MEDIAN.position.y - 3, MEDIAN.size.x, 3), Color("a9a69a"))
	draw_rect(Rect2(MEDIAN.position.x, MEDIAN.end.y, MEDIAN.size.x, 3), Color("a9a69a"))
	_lane_marks()
	_crosswalks()
	_parking(MERCADO_LOT, true)
	_parking(HOSP_LOT, false)
	# pátio da faculdade
	draw_rect(FAC_COURT, Color("7f7d74"))
	draw_rect(Rect2(1990, 900, 440, 380), grama)
	draw_rect(Rect2(2180, 900, 60, 570), Color("9a978c"))   # caminho até o portão
	draw_rect(QUADRA, Color("3d6f8e"))
	draw_rect(QUADRA.grow(-14), Color("b5683a"))
	draw_rect(QUADRA.grow(-14), Color("e8e2d0"), false, 2)
	draw_line(Vector2(QUADRA.position.x + 14, QUADRA.get_center().y), Vector2(QUADRA.end.x - 14, QUADRA.get_center().y), Color("e8e2d0"), 2)
	draw_arc(QUADRA.get_center(), 30, 0, TAU, 24, Color("e8e2d0"), 2)
	# banco + tomada (onde a Hannah carrega o celular)
	draw_rect(Rect2(1985, 1130, 22, 70), Color("5a4632"))
	# hospital: rampa da emergência e faixa vermelha
	draw_rect(Rect2(560, 1280, 360, 40), Color("9f9b90"))
	draw_rect(Rect2(560, 1316, 360, 6), Color("b32a2a"))
	# entorno do estádio
	draw_set_transform(ESTADIO_C, 0, Vector2(1, ESTADIO_R.y / ESTADIO_R.x))
	draw_circle(Vector2.ZERO, ESTADIO_R.x + 120, Color("7a786f"))
	draw_set_transform(Vector2.ZERO)
	# copas do morro
	for c in _canopy:
		var p: Vector2 = c[0]
		var r: float = c[1]
		draw_circle(p + Vector2(r * 0.45, r * 0.35), r, Color(0, 0, 0, 0.25))
		draw_circle(p, r, Color("2f4a22").lerp(Color("4f7432"), c[2]))
		draw_circle(p - Vector2(r * 0.25, r * 0.3), r * 0.55, Color("5f8a3c").lerp(Color("74a048"), c[2]))
	# postes
	for lp in lamps:
		draw_line(lp, lp + Vector2(22, 10), Color(0, 0, 0, 0.3), 3)
		draw_circle(lp, 4, Color("3b3d40"))
		draw_circle(lp + Vector2(0, -2), 3, Color(1.6, 1.4, 0.9))
	# árvores da cidade (canteiro e pátio)
	for c in circles:
		_tree(c[0], c[1] * 2.1)

func _tree(p: Vector2, r: float) -> void:
	draw_circle(p + Vector2(r * 0.5, r * 0.3), r, Color(0, 0, 0, 0.28))
	draw_circle(p - Vector2(0, 10), r, Color("2f5226"))
	draw_circle(p - Vector2(r * 0.25, 10 + r * 0.3), r * 0.6, Color("4d7a35"))

func _lane_marks() -> void:
	var branco := Color("d8d3c0")
	var amarelo := Color("d9b13b")
	# avenida: faixas tracejadas em cada pista
	for y in [1650.0, 1790.0]:
		var x := 0.0
		while x < 4800:
			if not _near_cross(x):
				draw_rect(Rect2(x, y, 40, 4), branco)
			x += 80
	draw_rect(Rect2(0, H1.position.y + 4, 4800, 3), branco)
	draw_rect(Rect2(0, H1.end.y - 7, 4800, 3), branco)
	for r in [H0, H2]:
		var x2 := 0.0
		while x2 < 4800:
			if not _near_cross(x2):
				draw_rect(Rect2(x2, r.get_center().y - 2, 50, 4), amarelo)
			x2 += 90
	for r in [V1, V2]:
		var y2 := 520.0
		while y2 < 3200:
			if not _near_cross_y(y2):
				draw_rect(Rect2(r.get_center().x - 2, y2, 4, 50), amarelo)
			y2 += 90

func _near_cross(x: float) -> bool:
	return (x > V1.position.x - 60 and x < V1.end.x + 20) or (x > V2.position.x - 60 and x < V2.end.x + 20)

func _near_cross_y(y: float) -> bool:
	for r in [H0, H1, H2]:
		if y > r.position.y - 60 and y < r.end.y + 20:
			return true
	return false

func _crosswalks() -> void:
	var c := Color("e3dfcf")
	for v in [V1, V2]:
		for h in [H0, H1, H2]:
			# faixas atravessando a rua vertical (acima e abaixo da horizontal)
			for yy in [h.position.y - 46, h.end.y + 8]:
				var x: float = v.position.x + 8
				while x < v.end.x - 10:
					draw_rect(Rect2(x, yy, 12, 38), c)
					x += 22
			# faixas atravessando a horizontal (à esquerda e à direita)
			for xx in [v.position.x - 46, v.end.x + 8]:
				var y: float = h.position.y + 8
				while y < h.end.y - 10:
					if not MEDIAN.has_point(Vector2(xx, y)):
						draw_rect(Rect2(xx, y, 38, 12), c)
					y += 22

func _parking(r: Rect2, vertical: bool) -> void:
	draw_rect(r, Color("44464a"))
	var c := Color("bdb9aa")
	var x := r.position.x + 20
	while x < r.end.x - 20:
		draw_rect(Rect2(x, r.position.y + 10, 3, 70), c)
		draw_rect(Rect2(x, r.end.y - 80, 3, 70), c)
		x += 46
