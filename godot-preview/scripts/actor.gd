extends Node2D
class_name Actor
## Base de todo mundo que anda: folha de sprite em 8 direções (0 = leste, 2 = sul, 4 = oeste, 6 = norte),
## colisão com o mundo, empurrão e movimento roteirizado para as cenas.

const ENTITY_SCALE := 0.85   # regra do dono: personagens e infectados 15% menores

var main: Node = null
var vel := Vector2.ZERO
var knock := Vector2.ZERO
var heading := PI * 0.5
var radius := 11.0
var speed := 120.0
var alive := true
var team := "human"
var ghost := false
var sprite: Sprite2D = null
var anims := {}
var anim := ""
var anim_t := 0.0
var anim_done := false
var move_target = null          # Vector2 ou null (movimento roteirizado)
var move_speed := 140.0
var stun := 0.0
var shadow_r := 13.0

signal arrived

static func dir8(h: float) -> int:
	return (int(round(h / (PI / 4.0))) % 8 + 8) % 8

func set_sheet(tex: Texture2D, cell: Vector2, ground: float, cx: float, anim_table: Dictionary, k: float) -> void:
	sprite = Sprite2D.new()
	sprite.texture = tex
	sprite.centered = false
	sprite.hframes = 8
	sprite.vframes = int(tex.get_height() / cell.y)
	sprite.offset = Vector2(-cx, -ground)
	sprite.scale = Vector2(k, k)
	add_child(sprite)
	anims = anim_table
	play(anims.keys()[0])

func play(name: String, restart := false) -> void:
	if not anims.has(name):
		return
	if name == anim and not restart:
		return
	anim = name
	anim_t = 0.0
	anim_done = false

func anim_step(delta: float, rate := 1.0) -> void:
	if sprite == null or anim == "":
		return
	var a: Dictionary = anims[anim]
	anim_t += delta * rate
	var f := int(anim_t * a.fps)
	if a.get("loop", true):
		f = f % int(a.frames)
	else:
		if f >= a.frames - 1:
			anim_done = true
		f = mini(f, a.frames - 1)
	sprite.frame = (int(a.row) + f) * 8 + dir8(heading)

func world() -> World:
	return main.world

## Anda com colisão, deslizando nas paredes.
func move(delta: float) -> void:
	var v := vel + knock
	knock = knock.move_toward(Vector2.ZERO, 1100.0 * delta)
	if v.length_squared() < 0.01:
		return
	var np := position + v * delta
	if ghost:
		position = np
		return
	var w := world()
	if not w.blocked(np, radius):
		position = np
	else:
		var nx := Vector2(np.x, position.y)
		var ny := Vector2(position.x, np.y)
		if abs(v.x) > 0.01 and not w.blocked(nx, radius):
			position = nx
		elif abs(v.y) > 0.01 and not w.blocked(ny, radius):
			position = ny
		elif w.blocked(position, radius):
			# preso (algo apareceu em cima): sai andando
			position = np

## Movimento roteirizado (cenas): devolve a velocidade para chegar no alvo.
func scripted_velocity() -> Vector2:
	if move_target == null:
		return Vector2.ZERO
	var d: Vector2 = move_target - position
	if d.length() < 8.0:
		move_target = null
		arrived.emit()
		return Vector2.ZERO
	return d.normalized() * move_speed

func go_to(p: Vector2, spd := 140.0) -> void:
	move_target = p
	move_speed = spd

func _draw() -> void:
	draw_set_transform(Vector2.ZERO, 0, Vector2(1, 0.42))
	draw_circle(Vector2.ZERO, shadow_r, Color(0, 0, 0, 0.38))
