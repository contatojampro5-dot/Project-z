extends Node2D
class_name MercadoInterior
## Dentro do mercado do Antônio: prateleiras, depósito, mesa das câmeras, escada do telhado,
## portão de aço da frente e os objetos improvisados perto da porta dos fundos.

const R := Rect2(1780, 2120, 760, 300)
const GATE := Rect2(2080, 2112, 160, 18)
const DESK := Vector2(2470, 2262)
const LADDER := Vector2(2500, 2392)
const BACKDOOR := Vector2(2190, 2440)
const ITEMS := {"extintor": Vector2(2090, 2385), "rodo": Vector2(2150, 2370), "pe_de_cabra": Vector2(2250, 2385)}
const ITEM_NAMES := {"extintor": "Extintor", "rodo": "Rodo", "pe_de_cabra": "Pé de cabra"}

var gate := 0.0           # 0 aberto, 1 fechado
var items_visible := true
var taken := ""
var monitor_on := true
var _t := 0.0

func _ready() -> void:
	z_index = -14

func _process(delta: float) -> void:
	_t += delta
	queue_redraw()

func _draw() -> void:
	# piso
	draw_rect(R, Color("cfc9b8"))
	var x := R.position.x
	while x < R.end.x:
		draw_line(Vector2(x, R.position.y), Vector2(x, R.end.y), Color("bdb6a3"), 1)
		x += 30
	# paredes (vista de cima)
	var wall := Color("5a5248")
	draw_rect(Rect2(R.position, Vector2(300, 14)), wall)
	draw_rect(Rect2(Vector2(2240, R.position.y), Vector2(300, 14)), wall)
	draw_rect(Rect2(Vector2(R.position.x, R.end.y - 14), Vector2(370, 14)), wall)
	draw_rect(Rect2(Vector2(2230, R.end.y - 14), Vector2(310, 14)), wall)
	draw_rect(Rect2(R.position, Vector2(14, R.size.y)), wall)
	draw_rect(Rect2(Vector2(R.end.x - 14, R.position.y), Vector2(14, R.size.y)), wall)
	draw_rect(Rect2(2290, 2134, 12, 166), wall)   # parede do depósito
	# prateleiras com produtos
	var cols := [Color("c0392b"), Color("f1c40f"), Color("27ae60"), Color("2980b9"), Color("e67e22"), Color("ecf0f1")]
	for sy in [2180.0, 2240.0, 2300.0]:
		draw_rect(Rect2(1830, sy, 320, 22), Color("7d6a55"))
		var px := 1834.0
		var i := 0
		while px < 2146:
			draw_rect(Rect2(px, sy + 3, 8, 16), cols[(i * 7 + int(sy)) % cols.size()])
			px += 11
			i += 1
	# caixas registradoras
	draw_rect(Rect2(2232, 2160, 36, 24), Color("3d3d3d"))
	draw_rect(Rect2(2232, 2210, 36, 24), Color("3d3d3d"))
	# depósito: caixas
	for b in [Rect2(2330, 2150, 60, 40), Rect2(2400, 2150, 50, 40), Rect2(2460, 2150, 60, 40), Rect2(2330, 2196, 50, 34)]:
		draw_rect(b, Color("a77b4f"))
		draw_rect(b, Color("7a5634"), false, 2)
		draw_line(b.position + Vector2(b.size.x * 0.5, 0), b.position + Vector2(b.size.x * 0.5, b.size.y), Color("c99b62"), 2)
	# mesa das câmeras
	draw_rect(Rect2(DESK - Vector2(40, 14), Vector2(80, 28)), Color("4b3a2a"))
	var glow := Color(1.4, 1.7, 1.5) if monitor_on else Color("1a1a1a")
	for k in 3:
		draw_rect(Rect2(DESK + Vector2(-34 + k * 24, -12), Vector2(20, 14)), glow if monitor_on and fmod(_t + k, 3.0) > 0.2 else Color("223"))
	# escada do telhado
	draw_rect(Rect2(LADDER - Vector2(12, 26), Vector2(24, 40)), Color("6d6d6d"), false, 3)
	for k in 5:
		draw_line(LADDER + Vector2(-12, -22 + k * 8), LADDER + Vector2(12, -22 + k * 8), Color("8a8a8a"), 2)
	# portão de aço (frente)
	if gate > 0.01:
		var g := Rect2(GATE.position, Vector2(GATE.size.x, GATE.size.y))
		draw_rect(g, Color("8e9399"))
		var n := int(16 * gate)
		for k in n:
			draw_line(Vector2(g.position.x + k * 10, g.position.y), Vector2(g.position.x + k * 10, g.end.y), Color("6b7076"), 2)
	# objetos improvisados
	if items_visible:
		for id in ITEMS:
			if id == taken:
				continue
			var p: Vector2 = ITEMS[id]
			var pulse := 0.6 + 0.4 * sin(_t * 4.0)
			draw_arc(p, 18, 0, TAU, 20, Color(1.8, 1.5, 0.6, pulse), 2)
			match id:
				"extintor":
					draw_rect(Rect2(p - Vector2(5, 12), Vector2(10, 22)), Color("b51f1f"))
				"rodo":
					draw_line(p + Vector2(-14, 10), p + Vector2(12, -10), Color("c9a44a"), 3)
					draw_line(p + Vector2(8, -16), p + Vector2(18, -4), Color("2a6ad0"), 5)
				"pe_de_cabra":
					draw_line(p + Vector2(-12, 8), p + Vector2(12, -8), Color("3a3d42"), 4)
