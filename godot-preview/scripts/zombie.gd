extends Actor
class_name Zombie
## Infectado (comum ou corredor) com as folhas do jogo web.

const CELL := Vector2(64, 72)
const ANIMS := {
	"walk": {"row": 0, "frames": 8, "fps": 8, "loop": true},
	"attack": {"row": 8, "frames": 7, "fps": 12, "loop": true},
	"hit": {"row": 15, "frames": 4, "fps": 12, "loop": false},
	"death": {"row": 19, "frames": 9, "fps": 10, "loop": false},
}
const SHEETS := {
	"comum": ["comum-operario", "comum-executivo", "comum-paciente"],
	"corredor": ["corredor-atleta"],
}
static var _tex := {}

var kind := "comum"
var hp := 2
var target: Node2D = null
var feeding := 0.0
var holding: Node = null
var sight := 380.0
var horde := false            # persegue o jogador de qualquer distância
var wander := Vector2.ZERO
var think := 0.0
var corpse_t := 0.0
var flash := 0.0
var groan_t := 0.0

func setup(m: Node, k := "comum", variant := -1) -> Zombie:
	main = m
	kind = k
	team = "zombie"
	var list: Array = SHEETS[k]
	var name: String = list[variant if variant >= 0 else randi() % list.size()]
	if not _tex.has(name):
		_tex[name] = load("res://assets/sprites/%s.webp" % name)
	set_sheet(_tex[name], CELL, 60.0, 32.0, ANIMS, ENTITY_SCALE)
	if k == "corredor":
		speed = randf_range(170, 190)
		hp = 3
		sight = 650.0
	else:
		speed = randf_range(42, 62)
		hp = 2
	groan_t = randf_range(2, 9)
	return self

func _physics_process(delta: float) -> void:
	if not alive:
		anim_step(delta)
		corpse_t += delta
		if corpse_t > 25.0:
			modulate.a = max(0.0, modulate.a - delta * 0.3)
			if modulate.a <= 0.0:
				queue_free()
		return
	stun = max(0.0, stun - delta)
	flash = max(0.0, flash - delta)
	think -= delta
	groan_t -= delta
	if groan_t <= 0:
		groan_t = randf_range(4, 12)
		main.audio.groan(position, kind)
	# agarrando alguém
	if holding != null:
		if not is_instance_valid(holding) or holding.grabbed_by != self:
			holding = null
		else:
			vel = Vector2.ZERO
			heading = (holding.position - position).angle()
			position = position.lerp(holding.position - Vector2.from_angle(heading) * 18, delta * 8)
			play("attack")
			anim_step(delta)
			return
	if feeding > 0:
		feeding -= delta
		vel = Vector2.ZERO
		play("attack")
		anim_step(delta, 0.6)
		move(delta)
		return
	if stun > 0:
		vel = vel.move_toward(Vector2.ZERO, 400 * delta)
		move(delta)
		anim_step(delta, 0.5)
		return
	if think <= 0:
		think = randf_range(0.2, 0.45)
		target = main.nearest_human(position, 99999.0 if horde else sight)
		if target == null and wander == Vector2.ZERO or randf() < 0.05:
			wander = position + Vector2.from_angle(randf() * TAU) * randf_range(60, 200)
	var want := Vector2.ZERO
	if move_target != null:
		want = scripted_velocity().normalized()
	elif target != null and is_instance_valid(target):
		var d := target.position - position
		var dist := d.length()
		want = d / max(dist, 0.01)
		if dist < radius + 14 + 6:
			_reach(target)
	elif wander != Vector2.ZERO:
		var d2 := wander - position
		if d2.length() < 10:
			wander = Vector2.ZERO
		else:
			want = d2.normalized() * 0.45
	var spd := speed if move_target == null else move_speed
	vel = vel.lerp(want * spd, clamp(delta * 6.0, 0, 1))
	if want.length() > 0.05:
		heading = lerp_angle(heading, want.angle(), clamp(delta * 8.0, 0, 1))
	move(delta)
	if anim != "hit" or anim_done:
		play("walk")
	anim_step(delta, clamp(vel.length() / 55.0, 0.4, 2.2))

func _reach(t: Node2D) -> void:
	if t is Civilian:
		if t.state != "down" and t.state != "dead":
			t.bitten(self)
			feeding = randf_range(1.6, 2.6)
			main.audio.sfx("z_attack", position, -6)
	elif t is Survivor:
		if t.controlled:
			if t.grab(self):
				holding = t
		elif t.alive:
			# Hadassa (ou quem acompanha) empurra o infectado
			shoved((position - t.position).normalized(), 1.0)

func shoved(dir: Vector2, power := 1.0) -> void:
	holding = null
	knock = dir * 320.0 * power
	stun = 0.8 * power
	play("hit", true)

func hit(dmg: int, dir: Vector2) -> void:
	if not alive:
		return
	hp -= dmg
	flash = 0.1
	knock = dir * (260.0 if kind == "comum" else 340.0)
	stun = 0.45
	holding = null
	main.audio.sfx("impact", position, -2, 0.2)
	main.blood(position, 10)
	play("hit", true)
	if hp <= 0:
		die()

func die() -> void:
	alive = false
	holding = null
	vel = Vector2.ZERO
	play("death", true)
	main.audio.sfx("z_death", position, -4)
	main.blood(position, 22)
	z_index = -1
