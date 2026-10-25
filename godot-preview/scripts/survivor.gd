extends Actor
class_name Survivor
## Hannah, Antônio e Hadassa. Um deles é controlado pelo jogador; os outros seguem roteiro ou acompanham.

const CELL := Vector2(75, 75)
const ANIMS := {
	"idle": {"row": 0, "frames": 6, "fps": 5, "loop": true},
	"walk": {"row": 6, "frames": 8, "fps": 10, "loop": true},
	"hit": {"row": 14, "frames": 4, "fps": 12, "loop": false},
	"death": {"row": 18, "frames": 10, "fps": 9, "loop": false},
	"run": {"row": 34, "frames": 8, "fps": 13, "loop": true},
	"swing": {"row": 42, "frames": 4, "fps": 14, "loop": false},
}
const SURV_SIZE := 1.12      # sobreviventes um pouco maiores que os infectados (igual ao jogo web)

var who := "hannah"
var display_name := "Hannah"
var controlled := false
var walk_speed := 135.0
var run_speed := 235.0
var stamina := 1.0
var running := false
var jump_t := -1.0
var jump_dir := Vector2.ZERO
var grabbed_by: Node = null
var grab_progress := 0.0
var grab_timer := 0.0
var grab_cooldown := 0.0
var weapon := ""
var attack_cd := 0.0
var swing_t := -1.0
var follow: Node2D = null
var heart := 78.0            # Antônio: batimentos (condição cardíaca)
var has_heart := false
var invulnerable := false
var footstep_t := 0.0

signal grabbed
signal escaped
signal caught

func setup(m: Node, id: String) -> Survivor:
	main = m
	who = id
	display_name = {"hannah": "Hannah", "antonio": "Antônio", "hadassa": "Hadassa"}[id]
	var tex: Texture2D = load("res://assets/sprites/%s_pistol.webp" % {"hannah": "hanna"}.get(id, id))
	set_sheet(tex, CELL, 63.0, 37.5, ANIMS, ENTITY_SCALE * SURV_SIZE)
	radius = 11.0
	shadow_r = 14.0
	if id == "antonio":
		has_heart = true
		run_speed = 225.0
	if id == "hadassa":
		run_speed = 240.0
	return self

func _physics_process(delta: float) -> void:
	if not alive:
		anim_step(delta)
		return
	grab_cooldown = max(0.0, grab_cooldown - delta)
	attack_cd = max(0.0, attack_cd - delta)
	stun = max(0.0, stun - delta)
	if grabbed_by != null:
		_struggle(delta)
		anim_step(delta)
		return
	if jump_t >= 0.0:
		_jump_step(delta)
		return
	var want := Vector2.ZERO
	if controlled and main.player_input_enabled:
		want = Input.get_vector("mover_esq", "mover_dir", "mover_cima", "mover_baixo")
		running = Input.is_action_pressed("correr") and stamina > 0.05 and want.length() > 0.1
		if Input.is_action_just_pressed("pular"):
			_try_jump(want)
		if Input.is_action_just_pressed("atacar") and weapon != "":
			attack()
	elif move_target != null:
		var sv := scripted_velocity()
		want = sv / max(1.0, move_speed)
		running = move_speed > 170
	elif follow != null and is_instance_valid(follow):
		var d := follow.position - position
		var dist := d.length()
		if dist > 70:
			want = d / dist
			running = dist > 140 or (follow is Survivor and follow.running)
		if dist > 700:
			position = follow.position - d.normalized() * 60
	var spd := (run_speed if running else walk_speed)
	if move_target != null and not controlled:
		spd = move_speed
	if has_heart and heart > 150:
		spd *= 0.82
	vel = want.limit_length(1.0) * spd
	if stun > 0:
		vel *= 0.3
	if want.length() > 0.1:
		heading = want.angle()
	# fôlego e coração
	if running and vel.length() > 10:
		stamina = max(0.0, stamina - delta * (0.16 if not has_heart else 0.22))
	else:
		stamina = min(1.0, stamina + delta * (0.22 if heart < 140 else 0.08))
	if has_heart:
		var near: int = main.zombies_near(position, 260)
		var target_bpm := 76.0 + (55.0 if running else 0.0) + near * 9.0
		heart = move_toward(heart, min(target_bpm, 185.0), delta * (14.0 if target_bpm > heart else 7.0))
	move(delta)
	if swing_t >= 0.0:
		swing_t += delta
		if anim_done:
			swing_t = -1.0
	elif vel.length() > 170:
		play("run")
	elif vel.length() > 10:
		play("walk")
	else:
		play("idle")
	anim_step(delta)
	if vel.length() > 10:
		footstep_t -= delta * (vel.length() / 140.0)
		if footstep_t <= 0 and controlled:
			footstep_t = 0.42
	queue_redraw()

func _try_jump(want: Vector2) -> void:
	var dir := want.normalized() if want.length() > 0.1 else Vector2.from_angle(heading)
	jump_dir = dir
	jump_t = 0.0
	if world().low_ahead(position, dir, 80):
		ghost = true   # pula por cima do carro/barreira
	main.audio.sfx("golpe", position, -12, 0.3)

func _jump_step(delta: float) -> void:
	jump_t += delta
	var dur := 0.5
	var k := jump_t / dur
	var spd := 270.0
	var np := position + jump_dir * spd * delta
	if ghost or not world().blocked(np, radius):
		position = np
	sprite.position.y = -sin(PI * clamp(k, 0, 1)) * 26.0
	play("run")
	anim_step(delta, 0.5)
	if k >= 1.0:
		jump_t = -1.0
		sprite.position.y = 0
		if ghost and world().blocked(position, radius, true):
			# ainda em cima do carro: termina de passar
			jump_t = 0.6
			return
		ghost = false

## Infectado agarrou: aperte E sem parar para se soltar.
func grab(z: Node) -> bool:
	if grabbed_by != null or grab_cooldown > 0 or jump_t >= 0 or invulnerable:
		return false
	grabbed_by = z
	grab_progress = 0.25
	grab_timer = 3.2 if who != "antonio" else 3.6
	play("hit", true)
	main.audio.sfx("hurt", position, -2)
	grabbed.emit()
	return true

func _struggle(delta: float) -> void:
	vel = Vector2.ZERO
	grab_timer -= delta
	grab_progress = max(0.0, grab_progress - delta * 0.18)
	if (controlled and Input.is_action_just_pressed("interagir")) or (main.auto and randf() < 0.3) or not controlled:
		grab_progress += 0.11 if controlled else 0.05
		knock = Vector2.from_angle(randf() * TAU) * 30
	if grab_progress >= 1.0:
		var z: Node = grabbed_by
		grabbed_by = null
		grab_cooldown = 1.6
		if is_instance_valid(z):
			z.shoved((z.position - position).normalized(), 2.0)
		escaped.emit()
	elif grab_timer <= 0:
		grabbed_by = null
		alive = false
		play("death", true)
		caught.emit()

func attack() -> void:
	if attack_cd > 0:
		return
	attack_cd = 0.55
	swing_t = 0.0
	play("swing", true)
	main.audio.sfx("golpe", position, -4, 0.15)
	var fwd := Vector2.from_angle(heading)
	for z in main.zombies:
		if not z.alive:
			continue
		var d: Vector2 = z.position - position
		if d.length() < 62 and fwd.dot(d.normalized()) > 0.2:
			z.hit(1, d.normalized())

func _draw() -> void:
	super._draw()
	if weapon == "" or not alive:
		return
	# objeto improvisado na mão (desenhado por cima do sprite)
	var fwd := Vector2.from_angle(heading)
	var side := fwd.orthogonal()
	var swing := 0.0
	if swing_t >= 0.0:
		swing = sin(clamp(swing_t / 0.28, 0, 1) * PI) * 1.4
	var hand := fwd * 12 + side * 6 + Vector2(0, -26)
	var tip_dir := fwd.rotated(-0.9 + swing)
	match weapon:
		"extintor":
			var a := hand
			var b := hand + tip_dir * 22
			draw_line(a, b, Color("b51f1f"), 9)
			draw_line(b, b + tip_dir * 4, Color("2a2a2a"), 5)
	if swing_t >= 0.0 and swing_t < 0.2:
		draw_arc(Vector2(0, -22), 50, heading - 1.0, heading + 1.0, 12, Color(1, 1, 1, 0.35 * (1.0 - swing_t / 0.2)), 4)
