extends Node2D
## Diretor do prólogo "Dia Zero". Monta a cidade e roda a abertura e os três capítulos, seguindo a
## história oficial (docs/historia.md): Hannah na faculdade → Antônio no mercado → corredor atacando
## a Hadassa → fuga para o morro.

static var act := 0                 # 0 = abertura, 1 = Hannah, 2 = Antônio, 3 = fuga
static var weapon_choice := "extintor"

var auto := false                   # --autotest: o jogo se joga sozinho (para testar)
var shots_dir := ""
var world: World
var decals: Decals
var interior: MercadoInterior
var entities: Node2D
var cam: Camera2D
var tint: CanvasModulate
var hud: Hud
var audio: GameAudio
var mercado: Building
var player: Survivor = null
var hannah: Survivor = null
var antonio: Survivor = null
var hadassa: Survivor = null
var survivors: Array = []
var civilians: Array = []
var zombies: Array = []
var cars: Array = []
var lamp_lights: Array = []
var flee_point := Vector2.INF
var player_input_enabled := false
var cam_follow: Node2D = null
var cam_zoom := 1.1
var cam_offset := Vector2.ZERO
var _grid := {}
const GRID := 96.0
var _caught := false
var _ending := false
var _clock := 0.0
var _day := 0.0

func _ready() -> void:
	randomize()
	var args := OS.get_cmdline_user_args()
	auto = "--autotest" in args
	for a in args:
		if a.begins_with("--shots="):
			shots_dir = a.substr(8)
	if auto:
		Engine.time_scale = 2.5
		print("[autotest] capítulo ", act)
	_setup_input()
	audio = GameAudio.new()
	audio.main = self
	add_child(audio)
	tint = CanvasModulate.new()
	add_child(tint)
	world = World.new()
	add_child(world)
	decals = Decals.new()
	add_child(decals)
	interior = MercadoInterior.new()
	add_child(interior)
	entities = Node2D.new()
	entities.y_sort_enabled = true
	add_child(entities)
	cam = Camera2D.new()
	add_child(cam)
	cam.make_current()
	hud = Hud.new()
	add_child(hud)
	hud.setup(self)
	_build_city()
	if "--rotas" in args:
		_check_routes()
		return
	match act:
		0:
			_setup_act1()
			_run_intro_then_act1()
		1:
			_setup_act1()
			_act1()
		2:
			_setup_act2()
			_act2()
		_:
			_setup_act3()
			_act3()

func _setup_input() -> void:
	var keys := {
		"mover_esq": [KEY_A, KEY_LEFT], "mover_dir": [KEY_D, KEY_RIGHT],
		"mover_cima": [KEY_W, KEY_UP], "mover_baixo": [KEY_S, KEY_DOWN],
		"correr": [KEY_SHIFT], "pular": [KEY_SPACE], "interagir": [KEY_E],
		"atacar": [KEY_F], "pular_fala": [KEY_ENTER, KEY_KP_ENTER], "pausa": [KEY_ESCAPE, KEY_P],
	}
	var pads := {"pular": JOY_BUTTON_A, "interagir": JOY_BUTTON_X, "atacar": JOY_BUTTON_B,
		"correr": JOY_BUTTON_RIGHT_SHOULDER, "pausa": JOY_BUTTON_START, "pular_fala": JOY_BUTTON_Y}
	var axes := {"mover_esq": [JOY_AXIS_LEFT_X, -1.0], "mover_dir": [JOY_AXIS_LEFT_X, 1.0],
		"mover_cima": [JOY_AXIS_LEFT_Y, -1.0], "mover_baixo": [JOY_AXIS_LEFT_Y, 1.0]}
	for a in keys:
		if InputMap.has_action(a):
			continue
		InputMap.add_action(a, 0.25)
		for k in keys[a]:
			var e := InputEventKey.new()
			e.physical_keycode = k
			InputMap.action_add_event(a, e)
		if pads.has(a):
			var jb := InputEventJoypadButton.new()
			jb.button_index = pads[a]
			InputMap.action_add_event(a, jb)
		if axes.has(a):
			var jm := InputEventJoypadMotion.new()
			jm.axis = axes[a][0]
			jm.axis_value = axes[a][1]
			InputMap.action_add_event(a, jm)
	if InputMap.action_get_events("atacar").filter(func(e): return e is InputEventMouseButton).is_empty():
		var mb := InputEventMouseButton.new()
		mb.button_index = MOUSE_BUTTON_LEFT
		InputMap.action_add_event("atacar", mb)

# ======================================================================= cidade
func _bld(r: Rect2, floors: int, kind := "generic", label := "", wall := Color("b8b4a8"), roof := Color("9c9a92"), solid := true) -> Building:
	var b := Building.new().setup(r, floors, kind, label, wall, roof)
	entities.add_child(b)
	if solid:
		world.obstacles.append(r)
	return b

func _build_city() -> void:
	Building.focus = null
	_bld(World.HOSPITAL, 5, "hospital", "HOSPITAL", Color("dcd8cd"), Color("aeaca4"))
	_bld(World.FAC_N, 4, "faculdade", "FACULDADE", Color("d6d1c3"), Color("a3a199"))
	_bld(World.FAC_W, 4, "faculdade", "", Color("d6d1c3"), Color("a3a199"))
	_bld(World.FAC_E, 4, "faculdade", "", Color("d6d1c3"), Color("a3a199"))
	mercado = _bld(World.MERCADO, 3, "mercado", "MERCADO", Color("d9d4c6"), Color("8f8d86"), false)
	mercado.hollow = true
	for r in [Rect2(1780, 2120, 300, 14), Rect2(2240, 2120, 300, 14), Rect2(1780, 2406, 370, 14), Rect2(2230, 2406, 310, 14),
			Rect2(1780, 2120, 14, 300), Rect2(2526, 2120, 14, 300), Rect2(2290, 2134, 12, 166),
			Rect2(1830, 2180, 320, 22), Rect2(1830, 2240, 320, 22), Rect2(1830, 2300, 320, 22),
			Rect2(2330, 2150, 190, 40), Rect2(2330, 2196, 50, 34), Rect2(2430, 2248, 80, 28), Rect2(2232, 2160, 36, 74)]:
		world.obstacles.append(r)
	var est := Building.new().setup(Rect2(World.ESTADIO_C - World.ESTADIO_R, World.ESTADIO_R * 2), 3, "estadio", "ESTÁDIO")
	entities.add_child(est)
	# prédios residenciais (3 a 5 andares — regra do dono)
	var tower_walls := [Color("cfc8b8"), Color("b9b2a6"), Color("d8d2c4"), Color("a9a49a"), Color("c4b8a6")]
	var towers := [Rect2(60, 1900, 300, 200), Rect2(470, 1900, 260, 220), Rect2(840, 1900, 300, 200), Rect2(1210, 1920, 220, 180),
		Rect2(60, 2280, 280, 230), Rect2(450, 2300, 360, 200), Rect2(920, 2260, 380, 240),
		Rect2(2640, 2160, 360, 200), Rect2(3290, 1900, 260, 220), Rect2(3650, 1900, 300, 200), Rect2(4050, 1900, 320, 230),
		Rect2(4460, 1900, 300, 200), Rect2(3290, 2300, 350, 240), Rect2(3800, 2330, 300, 220), Rect2(4250, 2300, 420, 250)]
	var i := 0
	for r in towers:
		_bld(r, 3 + (i * 7) % 3, "generic", "", tower_walls[i % tower_walls.size()], Color("8d8b84").lerp(Color("b3b1a8"), (i % 3) / 2.0))
		i += 1
	# casas ao sul da rua de trás
	var x := 40.0
	while x < 4700:
		_bld(Rect2(x, 2790, 130, 100), 2, "casa", "", Color("d8c9b0"), Color("a4513a"))
		_bld(Rect2(x + 40, 2980, 130, 100), 2, "casa", "", Color("cfc1a5"), Color("a4513a"))
		x += 175
	# cidade ao longe (noroeste) e a casa no alto do morro
	for k in 9:
		var rr := Rect2(60 + k * 205, 120 + (k % 3) * 120, 170, 160)
		_bld(rr, 5, "generic", "", Color("a8a69e"), Color("7d7c76"), false)
	_bld(Rect2(4200, -1360, 130, 90), 2, "casa", "", Color("e2d8c6"), Color("a4513a"))
	# carros estacionados
	for k in 12:
		var cx := 1745.0 + k * 92.0
		if k % 3 != 1:
			_parked(Vector2(cx, 1905), PI * 0.5)
		if k % 4 != 2:
			_parked(Vector2(cx + 46, 2055), -PI * 0.5)
	for k in 9:
		if k % 2 == 0:
			_parked(Vector2(270 + k * 110, 1350), PI * 0.5)
	spawn_car(Vector2(700, 1500), 0, "ambulancia")
	spawn_car(Vector2(860, 1500), 0, "ambulancia")
	# postes de luz
	for lp in world.lamps:
		var l := FX.make_light(self, lp + Vector2(0, 30), Color(1.0, 0.82, 0.55), 0.0, 1.5)
		l.z_index = 1
		lamp_lights.append(l)

func _parked(p: Vector2, ang: float) -> void:
	spawn_car(p, ang)

# ======================================================================= gente e coisas
func spawn_civ(p: Vector2, calm := true) -> Civilian:
	var c := Civilian.new().setup(self, calm)
	c.position = p
	entities.add_child(c)
	civilians.append(c)
	return c

func spawn_zombie(p: Vector2, kind := "comum", variant := -1) -> Zombie:
	var z := Zombie.new().setup(self, kind, variant)
	z.position = p
	z.heading = randf() * TAU
	entities.add_child(z)
	zombies.append(z)
	return z

func spawn_car(p: Vector2, ang: float, kind := "carro", col := "") -> Car:
	var c := Car.new().setup(self, p, ang, kind, col)
	entities.add_child(c)
	cars.append(c)
	return c

func spawn_survivor(id: String, p: Vector2) -> Survivor:
	var s := Survivor.new().setup(self, id)
	s.position = p
	entities.add_child(s)
	survivors.append(s)
	s.caught.connect(_on_caught)
	return s

func set_player(s: Survivor) -> void:
	if player:
		player.controlled = false
	player = s
	s.controlled = true
	Building.focus = s
	cam_follow = s
	cam.position = s.position

func wreck(p: Vector2, ang: float, burning := true, kind := "carro") -> Car:
	var c := spawn_car(p, ang, kind)
	c.state = "crashed"
	if burning:
		c.ignite()
	else:
		FX.smoke(c, Vector2(0, -20), 0.7)
	return c

func turn_into_zombie(c: Civilian) -> Zombie:
	if not is_instance_valid(c):
		return null
	var z := spawn_zombie(c.position, "comum", 2 if c.elderly else -1)
	z.heading = c.heading
	z.play("hit", true)
	z.stun = 1.0
	civilians.erase(c)
	c.queue_free()
	return z

func blood(p: Vector2, amount: float) -> void:
	decals.add(p + Vector2(randf_range(-6, 6), randf_range(-4, 4)), randf_range(7, 12) + amount * 0.35, Color(0.33, 0.02, 0.03, 0.78))

func scorch(p: Vector2, r: float) -> void:
	decals.add(p, r, Color(0.04, 0.035, 0.03, 0.72))

# ----------------------------------------------------------------------- consultas
func _rebuild_grid() -> void:
	_grid.clear()
	for list in [civilians, zombies, survivors]:
		for a in list:
			if not is_instance_valid(a):
				continue
			var k := Vector2i(floori(a.position.x / GRID), floori(a.position.y / GRID))
			if not _grid.has(k):
				_grid[k] = []
			_grid[k].append(a)

func actors_near(p: Vector2, r: float) -> Array:
	var out := []
	var c0 := Vector2i(floori((p.x - r) / GRID), floori((p.y - r) / GRID))
	var c1 := Vector2i(floori((p.x + r) / GRID), floori((p.y + r) / GRID))
	for gx in range(c0.x, c1.x + 1):
		for gy in range(c0.y, c1.y + 1):
			var k := Vector2i(gx, gy)
			if _grid.has(k):
				for a in _grid[k]:
					if is_instance_valid(a) and a.position.distance_to(p) <= r:
						out.append(a)
	return out

func nearest_zombie(p: Vector2, r: float) -> Zombie:
	var best: Zombie = null
	var bd := r * r
	for z in zombies:
		if is_instance_valid(z) and z.alive:
			var d := p.distance_squared_to(z.position)
			if d < bd:
				bd = d
				best = z
	return best

func nearest_human(p: Vector2, r: float) -> Node2D:
	var best: Node2D = null
	var bd := r * r
	for c in civilians:
		if is_instance_valid(c) and (c.state == "calm" or c.state == "panic"):
			var d := p.distance_squared_to(c.position)
			if d < bd:
				bd = d
				best = c
	for s in survivors:
		if is_instance_valid(s) and s.alive and s.visible and s.z_index < 20:
			var d2 := p.distance_squared_to(s.position) * (0.7 if s.controlled else 1.0)
			if d2 < bd:
				bd = d2
				best = s
	return best

func zombies_near(p: Vector2, r: float) -> int:
	var n := 0
	for z in zombies:
		if is_instance_valid(z) and z.alive and p.distance_squared_to(z.position) < r * r:
			n += 1
	return n

# ======================================================================= laço principal
func _physics_process(delta: float) -> void:
	_clock += delta
	if Engine.get_physics_frames() % 30 == 0:
		zombies = zombies.filter(func(z): return is_instance_valid(z))
		civilians = civilians.filter(func(c): return is_instance_valid(c))
	_rebuild_grid()
	# separação entre pessoas (ninguém fica em cima de ninguém)
	for list in [zombies, civilians, survivors]:
		for a in list:
			if not is_instance_valid(a) or a.ghost:
				continue
			if a is Zombie and not a.alive:
				continue
			if a is Civilian and a.state != "calm" and a.state != "panic":
				continue
			for b in actors_near(a.position, 24):
				if b == a or b.ghost:
					continue
				if b is Zombie and not b.alive:
					continue
				if b is Civilian and b.state != "calm" and b.state != "panic":
					continue
				var d: Vector2 = a.position - b.position
				var m: float = a.radius + b.radius
				var l := d.length()
				if l < m and l > 0.01:
					var push := d / l * (m - l) * 0.5
					if not world.blocked(a.position + push, a.radius):
						a.position += push

func _process(delta: float) -> void:
	if cam_follow and is_instance_valid(cam_follow):
		var look := Vector2.ZERO
		if cam_follow is Survivor:
			look = cam_follow.vel * 0.22
		cam.position = cam.position.lerp(cam_follow.position + look + cam_offset + Vector2(0, -24), clamp(delta * 4.5, 0, 1))
	cam.zoom = cam.zoom.lerp(Vector2(cam_zoom, cam_zoom), clamp(delta * 2.2, 0, 1))
	# camadas de som do ambiente
	var cc := cam.get_screen_center_position()
	var nz := zombies_near(cc, 700)
	audio.set_bed(audio.horde, nz / 10.0, -10.0, delta)
	var np := 0
	for c in civilians:
		if is_instance_valid(c) and c.state == "panic" and c.position.distance_squared_to(cc) < 640000:
			np += 1
	audio.set_bed(audio.panic, np / 12.0, -12.0, delta)
	if player and player.has_heart and player.alive:
		audio.set_bed(audio.heart, (player.heart - 100.0) / 60.0, -4.0, delta)
		audio.heart.pitch_scale = clamp(player.heart / 80.0, 0.9, 2.2)
	else:
		audio.set_bed(audio.heart, 0.0, -4.0, delta)

## Hora do dia: 0 = pôr do sol (como na foto), 1 = noite.
func set_day(k: float, t := 3.0) -> void:
	var tw := create_tween()
	tw.tween_method(_apply_day, _day, k, t)

func _apply_day(k: float) -> void:
	_day = k
	var keys := [[0.0, Color(1.0, 0.86, 0.72)], [0.35, Color(0.9, 0.72, 0.64)], [0.6, Color(0.7, 0.62, 0.74)], [1.0, Color(0.4, 0.41, 0.58)]]
	var col: Color = keys[0][1]
	for i in keys.size() - 1:
		if k >= keys[i][0] and k <= keys[i + 1][0]:
			col = (keys[i][1] as Color).lerp(keys[i + 1][1], (k - keys[i][0]) / (keys[i + 1][0] - keys[i][0]))
		elif k > keys[i + 1][0]:
			col = keys[i + 1][1]
	tint.color = col
	var e: float = clamp((k - 0.25) / 0.5, 0.0, 1.0) * 1.1
	for l in lamp_lights:
		l.energy = e
	for c in cars:
		if is_instance_valid(c) and c._head:
			c._head.energy = 0.4 + e

# ======================================================================= ajudantes do roteiro
func wait(t: float) -> void:
	if auto:
		t = min(t, 0.35)
	var e := 0.0
	while e < t and is_inside_tree():
		await get_tree().process_frame
		if not get_tree().paused:
			e += get_process_delta_time()

func wait_until(cond: Callable, timeout := 8.0) -> void:
	var e := 0.0
	while not cond.call() and e < timeout and is_inside_tree():
		await get_tree().process_frame
		if not get_tree().paused:
			e += get_process_delta_time()

func line(who: String, text: String, dur := -1.0) -> void:
	await hud.say(who, text, dur)

func reach(p: Vector2, r := 60.0) -> void:
	hud.waypoint = p
	var e := 0.0
	while is_instance_valid(player) and player.position.distance_to(p) > r and is_inside_tree():
		await get_tree().process_frame
		e += get_process_delta_time()
		if auto and e > 0.5 and not _caught:
			player.position = p
	hud.waypoint = null

func interact(p: Vector2, r: float, text: String, hold := 0.0) -> void:
	hud.waypoint = p
	while is_inside_tree():
		await get_tree().process_frame
		if auto:
			player.position = p + Vector2(0, 2)
			break
		var near := player.position.distance_to(p) < r and player_input_enabled
		hud.show_prompt("[E] " + text if near else "")
		if near and Input.is_action_just_pressed("interagir"):
			if hold <= 0.0:
				break
			var h := 0.0
			while Input.is_action_pressed("interagir") and h < hold:
				await get_tree().process_frame
				h += get_process_delta_time()
				hud.show_prompt("[E] %s  %d%%" % [text, int(h / hold * 100)])
			if h >= hold:
				break
	hud.show_prompt("")
	hud.waypoint = null

## Começo de cena: tira o controle e solta o jogador se um infectado estiver agarrando.
func cutscene() -> void:
	player_input_enabled = false
	if player:
		player.vel = Vector2.ZERO
		if player.grabbed_by != null:
			var z: Node = player.grabbed_by
			player.grabbed_by = null
			player.grab_cooldown = 2.0
			if is_instance_valid(z):
				z.shoved((z.position - player.position).normalized(), 2.0)

func cam_to(p: Vector2, zoom: float, t: float) -> void:
	cam_follow = null
	var tw := create_tween().set_parallel()
	tw.tween_property(cam, "position", p, t).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tw.tween_property(self, "cam_zoom", zoom, t).set_trans(Tween.TRANS_SINE)

func shot(name: String) -> void:
	if shots_dir == "":
		return
	await get_tree().create_timer(1.6).timeout
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	if img:
		img.save_png("%s/%d_%s.png" % [shots_dir, act, name])
		print("[autotest] captura ", name)

func next_act(n: int) -> void:
	await hud.fade_to(1.0, 1.2)
	act = n
	get_tree().reload_current_scene()

func _on_caught() -> void:
	if _caught:
		return
	_caught = true
	player_input_enabled = false
	hud.letterbox(true)
	await wait(1.4)
	await hud.card("VOCÊ FOI PEGO", "Recomeçando o capítulo...", 1.2)
	await hud.fade_to(1.0, 0.8)
	get_tree().reload_current_scene()

func toggle_pause() -> void:
	if _ending:
		return
	get_tree().paused = not get_tree().paused
	hud.toggle_pause(get_tree().paused)

func on_pause_button(id: String) -> void:
	get_tree().paused = false
	hud.toggle_pause(false)
	match id:
		"restart":
			get_tree().reload_current_scene()
		"skip":
			act = min(act + 1, 3) if act > 0 else 2
			get_tree().reload_current_scene()
		"begin":
			act = 0
			get_tree().reload_current_scene()

func _unhandled_input(e: InputEvent) -> void:
	if _ending and e.is_action_pressed("pular_fala"):
		act = 0
		get_tree().reload_current_scene()

# ======================================================================= teste de rotas
## Confere (busca em grade com a colisão real) se dá para andar entre os pontos de cada capítulo.
func _check_routes() -> void:
	var routes := {
		"cap1": [Vector2(2210, 1090), Vector2(2026, 1165), Vector2(2350, 1455), Vector2(2120, 1555), Vector2(1730, 1560)],
		"cap2": [Vector2(2400, 2290), MercadoInterior.DESK + Vector2(0, 34), Vector2(2160, 2152), MercadoInterior.LADDER,
			MercadoInterior.ITEMS["extintor"], MercadoInterior.ITEMS["rodo"], MercadoInterior.ITEMS["pe_de_cabra"], Vector2(1960, 2690)],
		"cap3": [Vector2(2050, 2680), Vector2(1585, 2480), Vector2(3135, 2675), Vector2(3135, 1560), Vector2(3135, 800),
			Vector2(3300, 600), Vector2(3560, 110), Vector2(3860, -360), World.SUMMIT],
	}
	var ok := true
	for name in routes:
		if name == "cap2":
			world.obstacles.append(MercadoInterior.GATE)
		var pts: Array = routes[name]
		for i in pts.size() - 1:
			var good := _walkable(pts[i], pts[i + 1], 11.0)
			print("[rotas] %s  %s -> %s : %s" % [name, pts[i], pts[i + 1], "OK" if good else "BLOQUEADO"])
			ok = ok and good
	print("[rotas] ", "TUDO OK" if ok else "HÁ ROTAS BLOQUEADAS")
	get_tree().quit(0 if ok else 1)

func _walkable(a: Vector2, b: Vector2, r: float) -> bool:
	var step := 8.0
	var start := Vector2i(roundi(a.x / step), roundi(a.y / step))
	var goal := Vector2i(roundi(b.x / step), roundi(b.y / step))
	var seen := {start: true}
	var q: Array[Vector2i] = [start]
	var head := 0
	while head < q.size() and head < 400000:
		var c: Vector2i = q[head]
		head += 1
		if (c - goal).length_squared() <= 9:
			return true
		for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
			var n: Vector2i = c + d
			if seen.has(n):
				continue
			seen[n] = true
			if not world.blocked(Vector2(n) * step, r):
				q.append(n)
	return false

# ======================================================================= abertura
func _run_intro_then_act1() -> void:
	await _intro()
	act = 1
	_act1()

func _intro() -> void:
	player_input_enabled = false
	hud.fade.color.a = 1.0
	hud.photo.texture = load("res://assets/sprites/cidade-aerea.webp")
	hud.photo.visible = true
	hud.photo.pivot_offset = hud.root.size * 0.5
	hud.photo.scale = Vector2.ONE
	var radio := AudioStreamPlayer.new()
	radio.stream = audio.stream("radio", true)
	radio.volume_db = -16
	add_child(radio)
	radio.play()
	var zoom := create_tween()
	zoom.tween_property(hud.photo, "scale", Vector2(1.14, 1.14), 22.0)
	await hud.fade_to(0.0, 2.0)
	shot("abertura")
	await line("Rádio", "...a Secretaria de Saúde pede calma. O número de idosos internados com febre alta subiu de novo nesta terça...")
	await line("Rádio", "...nas redes, boatos ligam os casos a um lote de vacina. O ministério nega. Ninguém sabe dizer de onde vem...")
	await line("Rádio", "...trânsito parado na Celso Garcia. Motoristas relatam acidentes perto do Hospi—")
	radio.stop()
	audio.sfx("impact", null, -10)
	await hud.fade_to(1.0, 0.6)
	zoom.kill()
	hud.photo.texture = load("res://assets/sprites/cidade-aerea-2.webp")
	hud.photo.scale = Vector2(1.1, 1.1)
	create_tween().tween_property(hud.photo, "scale", Vector2.ONE, 9.0)
	await hud.fade_to(0.0, 1.2)
	audio.music("musica_final", -14, 3.0)
	await hud.card("PROJECT Z", "PRÓLOGO  ·  DIA ZERO", 3.0)
	await hud.fade_to(1.0, 1.0)
	hud.photo.visible = false
	cam.position = Vector2(2600, 1300)
	cam.zoom = Vector2(0.38, 0.38)
	cam_zoom = 0.38
	await hud.fade_to(0.0, 1.2)
	cam_to(hannah.position + Vector2(0, -24), 1.55, 6.0)
	await wait(6.0)
	audio.stop_music(2.0)

# ======================================================================= capítulo 1 — Hannah
var _students: Array = []

func _setup_act1() -> void:
	_apply_day(0.0)
	hannah = spawn_survivor("hannah", Vector2(2210, 1090))
	hannah.heading = PI * 0.5
	set_player(hannah)
	cam_zoom = 1.55
	for p in [Vector2(2120, 1190), Vector2(2150, 1205), Vector2(2330, 1010), Vector2(2560, 1350), Vector2(2600, 1330), Vector2(2010, 1420)]:
		var s := spawn_civ(p)
		_students.append(s)
	# trânsito normal na avenida
	for k in 7:
		var y: float = [1645.0, 1680.0][k % 2]
		var c := spawn_car(Vector2(randf_range(0, 4800), y), 0)
		c.traffic_from = Vector2(-120, y)
		c.drive_to(Vector2(4920, y), randf_range(180, 240))
	for k in 7:
		var y2: float = [1765.0, 1800.0][k % 2]
		var c2 := spawn_car(Vector2(randf_range(0, 4800), y2), PI)
		c2.traffic_from = Vector2(4920, y2)
		c2.drive_to(Vector2(-120, y2), randf_range(180, 240))
	spawn_car(Vector2(2470, 1650), 0, "onibus")
	# pedestres nas calçadas
	for k in 26:
		var side := k % 2 == 0
		spawn_civ(Vector2(randf_range(1700, 3000), 1560 if side else 1870) + Vector2(0, randf_range(-14, 14)))

func _act1() -> void:
	player_input_enabled = false
	cam_follow = hannah
	cam_zoom = 1.55
	if act == 1 and hud.fade.color.a > 0.5:
		hud.fade_to(0.0, 1.0)
	await hud.card("FACULDADE  ·  17:40", "Hannah, 21 anos  ·  dia da apresentação do TCC")
	await line("Hannah", "Banca marcada pras cinco. Já são quase seis.")
	await line("Hannah", "Nem professor, nem grupo. Vou apresentar o TCC pros pombos.")
	await line("Hannah", "E o celular morreu. Claro que morreu.")
	player_input_enabled = true
	hud.set_hint("WASD / setas: andar\nE: interagir\nEsc: pausa")
	hud.objective("Carregue o celular na tomada do banco")
	await interact(Vector2(2026, 1165), 48, "Carregar o celular")
	player_input_enabled = false
	hannah.vel = Vector2.ZERO
	audio.sfx("celular", null, -2)
	await wait(0.7)
	audio.sfx("celular", null, -2)
	hud.show_phone([["Hadassa · 14 chamadas perdidas", true], ["Hadassa: Hannah atende", false],
		["Hadassa: tá um caos aqui no hospital", false], ["Hadassa: fica onde você tá. eu vou te buscar", false]])
	shot("celular")
	await line("Hannah", "Quatorze chamadas? A Hadassa nunca liga quatorze vezes.")
	if _students.size() >= 2:
		_students[0].say("Minha vó passou mal... tô indo pro hospital!", 4)
		_students[0].go_to(Vector2(2350, 1500), 200)
		_students[1].say("Meu pai também. Levaram ele agora!", 4)
		_students[1].go_to(Vector2(2380, 1520), 190)
	await wait(2.6)
	hud.hide_phone()
	_first_crash()
	await wait(0.5)
	await line("Hannah", "Que barulho foi esse?!")
	player_input_enabled = true
	hud.objective("Vá até o portão da faculdade")
	await reach(Vector2(2350, 1455), 60)
	# a cidade vira um caos
	cutscene()
	hud.letterbox(true)
	_chaos_act1()
	cam_to(Vector2(2300, 1700), 0.95, 2.5)
	set_day(0.12, 6.0)
	await wait(2.6)
	shot("caos")
	await line("Alguém", "Ele mordeu ela! Ele MORDEU ela!")
	await line("Hannah", "...Gente?")
	await line("Hannah", "Hadassa. Hospital. Agora.")
	hud.letterbox(false)
	cam_follow = hannah
	cam_zoom = 1.4
	player_input_enabled = true
	audio.music("musica_fuga", -14)
	hud.objective("Corra para o hospital: siga pela calçada para o oeste")
	hud.set_hint("Shift: correr\nEspaço: pular carros e barreiras\nE: se soltar se te agarrarem")
	await reach(Vector2(2120, 1555), 90)
	_ambush()
	await reach(Vector2(1730, 1560), 80)
	cutscene()
	await line("Hannah", "Aguenta, Hadassa. Tô chegando.")
	next_act(2)

func _first_crash() -> void:
	var c := spawn_car(Vector2(3300, 1645), 0, "carro", "1f4e79")
	c.drive_to(Vector2(2400, 1650), 520)
	c.arrived_crash_fire = 1.2

func _chaos_act1() -> void:
	flee_point = Vector2.INF
	# infectados no meio da multidão
	for p in [Vector2(2500, 1700), Vector2(2650, 1770), Vector2(2200, 1880), Vector2(2900, 1650), Vector2(2050, 1690), Vector2(2750, 1880), Vector2(3000, 1800)]:
		spawn_zombie(p, "comum")
	for k in 16:
		var c := spawn_civ(Vector2(randf_range(1800, 3100), randf_range(1600, 1900)), false)
	for c in civilians:
		if c not in _students:
			c.panic()
	# o trânsito para: batidas em sequência
	var k2 := 0
	for car in cars:
		if car.traffic_from != null:
			car.traffic_from = null
			var ahead: Vector2 = car.position + Vector2.from_angle(car.angle) * randf_range(120, 420)
			ahead.x = clamp(ahead.x, 60, 4740)
			car.drive_to(ahead, car.speed)
			car.arrived_crash_fire = randf_range(1.5, 6.0) if k2 % 2 == 0 else -1.0
			car.arrived_explode = randf_range(5.0, 12.0) if k2 % 3 == 0 else -1.0
			k2 += 1
	var pol := spawn_car(Vector2(900, 1800), 0, "viatura")
	pol.siren_sound(true)
	pol.drive_to(Vector2(2120, 1795), 360)
	pol.arrived_crash_fire = -1.0

func _ambush() -> void:
	var c := spawn_car(Vector2(900, 1650), 0, "carro", "d4a017")
	c.drive_to(Vector2(1960, 1575), 560)
	c.arrived_crash_fire = 2.0
	c.arrived_explode = 9.0
	var z := spawn_zombie(Vector2(1880, 1520), "comum", 1)
	z.sight = 500

# ======================================================================= capítulo 2 — Antônio
var funcionarias: Array = []

func _setup_act2() -> void:
	_apply_day(0.3)
	antonio = spawn_survivor("antonio", Vector2(2400, 2290))
	antonio.heading = 0
	set_player(antonio)
	cam_zoom = 1.65
	var radio := Node2D.new()
	radio.position = MercadoInterior.DESK
	add_child(radio)
	audio.loop_at("radio", radio, -14)
	# lá fora: caos já começou
	for p in [Vector2(2420, 1662), Vector2(2120, 1795), Vector2(3100, 1680), Vector2(1400, 1770), Vector2(2800, 1790)]:
		wreck(p, randf_range(-0.4, 0.4) + (0.0 if p.y < 1720 else PI), true)
	for p in [Vector2(1900, 1640), Vector2(2650, 1660), Vector2(3400, 1800)]:
		wreck(p, randf_range(-0.6, 0.6), false)
	for k in 12:
		spawn_zombie(Vector2(randf_range(1200, 3300), randf_range(1600, 1850)))
	for k in 22:
		spawn_civ(Vector2(randf_range(1200, 3300), randf_range(1560, 1880)), false)
	for p in [Vector2(2110, 2070), Vector2(2190, 2082)]:
		var f := spawn_civ(p)
		f.shirt = Color("b8232a")
		f.pants = Color("2a3140")
		f.elderly = false
		f.will_turn = false
		f.speed = 160
		funcionarias.append(f)

func _act2() -> void:
	player_input_enabled = false
	cam_follow = antonio
	hud.fade_to(0.0, 1.0)
	await hud.card("MERCADO  ·  17:52", "Antônio, 27 anos  ·  ex-sargento bombeiro, dono do mercado")
	await line("Antônio", "Arroz, feijão, óleo... quem compra tanto óleo numa terça?")
	await line("Rádio", "...hospitais da Zona Leste operam com lotação máxima. A orientação é evitar...")
	await line("Antônio", "Lotação máxima. E eu aqui contando lata de óleo.")
	audio.scream(Vector2(2150, 2060), true)
	await line("Antônio", "...Que gritaria é essa lá na frente?")
	player_input_enabled = true
	hud.set_hint("WASD / setas: andar\nE: interagir\nEsc: pausa")
	hud.objective("Olhe as câmeras de segurança")
	await interact(MercadoInterior.DESK + Vector2(0, 34), 50, "Ver as câmeras")
	player_input_enabled = false
	antonio.vel = Vector2.ZERO
	# câmera de segurança: o ataque às funcionárias
	Building.focus = null
	hud.letterbox(true, 0.01)
	hud.cctv.visible = true
	cam_follow = null
	cam.position = Vector2(2160, 1990)
	cam_zoom = 1.7
	cam.zoom = Vector2(1.7, 1.7)
	var z1 := spawn_zombie(Vector2(2020, 1890), "comum", 2)
	var z2 := spawn_zombie(Vector2(2330, 1880), "comum", 0)
	funcionarias[0].say("Moço? O senhor tá bem?", 3)
	await wait(1.0)
	shot("cctv")
	await wait_until(func(): return funcionarias[0].state == "down", 8)
	await line("Antônio", "Não... não, não, não...")
	await wait_until(func(): return funcionarias[1].state == "down", 6)
	antonio.heart = 172
	await wait(0.8)
	hud.cctv.visible = false
	cam.position = antonio.position
	cam_follow = antonio
	cam_zoom = 1.65
	Building.focus = antonio
	await _breathing()
	await line("Antônio", "Respira, Antônio. Igual no quartel. Quatro segundos.")
	# elas levantam
	Building.focus = null
	hud.cctv.visible = true
	cam_follow = null
	cam.position = Vector2(2160, 1990)
	cam.zoom = Vector2(1.7, 1.7)
	cam_zoom = 1.7
	for z in [z1, z2]:
		if is_instance_valid(z):
			z.go_to(Vector2(2150, 1700), 50)
	await wait(1.0)
	var r1 := turn_into_zombie(funcionarias[0])
	await wait(0.9)
	var r2 := turn_into_zombie(funcionarias[1])
	for r in [r1, r2]:
		if r:
			r.go_to(Vector2(2250 + randf_range(-80, 80), 1660), 45)
	await line("Antônio", "Elas... levantaram?")
	await wait(1.6)
	hud.cctv.visible = false
	hud.letterbox(false, 0.3)
	cam.position = antonio.position
	cam_follow = antonio
	Building.focus = antonio
	for z in [z1, z2, r1, r2]:
		if is_instance_valid(z):
			z.move_target = null
	await line("Antônio", "O portão. O PORTÃO!")
	player_input_enabled = true
	hud.objective("Baixe o portão de aço da frente")
	await interact(Vector2(2160, 2152), 54, "Baixar o portão (segure)", 1.0)
	audio.sfx("portao", Vector2(2160, 2120), 2)
	create_tween().tween_property(interior, "gate", 1.0, 1.3)
	world.obstacles.append(MercadoInterior.GATE)
	await line("Antônio", "Pronto. Pronto. Ninguém entra, ninguém sai.")
	hud.objective("Suba no telhado pela escada do depósito")
	await interact(MercadoInterior.LADDER, 46, "Subir no telhado")
	await _roof_scene()
	await _save_hadassa()
	next_act(3)

func _breathing() -> void:
	hud.breath.visible = true
	hud.breath_value = 0.0
	var cycles := 0
	while cycles < 3 and is_inside_tree():
		hud.breath_phase = "in"
		while hud.breath_value < 1.0:
			await get_tree().process_frame
			var d := get_process_delta_time()
			if Input.is_action_pressed("pular") or auto:
				hud.breath_value += d / 1.5
			else:
				hud.breath_value = max(0.0, hud.breath_value - d * 0.3)
		hud.breath_phase = "out"
		while hud.breath_value > 0.0:
			await get_tree().process_frame
			if not Input.is_action_pressed("pular") or auto:
				hud.breath_value -= get_process_delta_time() / 1.7
		cycles += 1
		antonio.heart = max(90.0, antonio.heart - 26.0)
	hud.breath.visible = false

func _roof_scene() -> void:
	player_input_enabled = false
	hud.letterbox(true)
	await hud.fade_to(1.0, 0.5)
	antonio.position = Vector2(2300, 2140)
	antonio.sprite.position.y = -mercado.H
	antonio.z_index = 30
	antonio.heading = -PI * 0.5
	mercado.hollow = false
	Building.focus = null
	cam.position = Vector2(2200, 1880)
	cam_zoom = 0.9
	cam.zoom = Vector2(0.9, 0.9)
	cam_follow = null
	set_day(0.42, 8.0)
	await hud.fade_to(0.0, 0.7)
	var ex: Car = cars.filter(func(c): return is_instance_valid(c) and c.state == "burning").pick_random()
	if ex:
		ex.explode()
	await line("Antônio", "Meu Deus... a cidade inteira.")
	# ele vê a Hannah passando (ela segue para o hospital, como no capítulo 1)
	var hn := spawn_survivor("hannah", Vector2(2350, 1565))
	hn.go_to(Vector2(1200, 1565), 230)
	shot("telhado")
	await wait(1.6)
	await line("Antônio", "Aquela ali... é a irmã da Hadassa? Correndo pro lado do hospital...")
	# e então a Hadassa
	hadassa = spawn_survivor("hadassa", Vector2(1250, 1880))
	hadassa.invulnerable = true
	hadassa.go_to(Vector2(1590, 1900), 240)
	cam_to(Vector2(1750, 2250), 0.8, 2.5)
	var group: Array = []
	for k in 5:
		var g := spawn_zombie(Vector2(2050 + k * 40, 2680 + (k % 2) * 30))
		g.sight = 0.0
		group.append(g)
	await line("Antônio", "...Hadassa?")
	await wait_until(func(): return hadassa.move_target == null, 4)
	hadassa.go_to(Vector2(1590, 2675), 240)
	var runner := spawn_zombie(Vector2(1200, 1900), "corredor")
	runner.go_to(Vector2(1590, 2640), 200)
	await line("Antônio", "Não, não, não! Por aí não!")
	await wait_until(func(): return hadassa.move_target == null, 4)
	hadassa.go_to(Vector2(1960, 2690), 220)
	await wait(1.2)
	if is_instance_valid(hn):
		hn.queue_free()
		survivors.erase(hn)
	await hud.fade_to(1.0, 0.5)
	# de volta lá embaixo
	antonio.sprite.position.y = 0
	antonio.z_index = 0
	antonio.position = Vector2(2190, 2392)
	antonio.heading = -PI * 0.5
	mercado.hollow = true
	Building.focus = antonio
	cam.position = antonio.position
	cam_follow = antonio
	cam_zoom = 1.5
	hadassa.move_target = null
	hadassa.position = Vector2(1960, 2690)
	runner.move_target = null
	runner.position = Vector2(1880, 2700)
	runner.sight = 900
	for g in group:
		g.sight = 380
		g.speed = 40
	_rescue_runner = runner
	await hud.fade_to(0.0, 0.5)
	hud.letterbox(false)

var _rescue_runner: Zombie = null

func _save_hadassa() -> void:
	player_input_enabled = true
	hud.objective("Pegue alguma coisa para se defender")
	interior.items_visible = true
	var chosen := ""
	while chosen == "" and is_inside_tree():
		await get_tree().process_frame
		if auto:
			chosen = weapon_choice
			break
		var txt := ""
		for id in MercadoInterior.ITEMS:
			if antonio.position.distance_to(MercadoInterior.ITEMS[id]) < 38:
				txt = "[E] Pegar: " + MercadoInterior.ITEM_NAMES[id]
				if Input.is_action_just_pressed("interagir"):
					chosen = id
		hud.show_prompt(txt)
		hud.waypoint = MercadoInterior.ITEMS["rodo"]
	hud.show_prompt("")
	hud.waypoint = null
	weapon_choice = chosen
	antonio.weapon = chosen
	interior.taken = chosen
	interior.items_visible = false
	await line("Antônio", {"extintor": "Extintor. Quinze anos de bombeiro pra chegar nisso.",
		"rodo": "Um rodo. Sério, Antônio? Um RODO.", "pe_de_cabra": "Pé de cabra. Isso. Isso serve."}[chosen])
	hud.objective("Salve a Hadassa!  (F ou clique para golpear)")
	hud.set_hint("F / clique: golpear\nShift: correr\nE: se soltar")
	audio.music("musica_fuga", -13)
	var shouted := false
	var e := 0.0
	while is_instance_valid(_rescue_runner) and _rescue_runner.alive and is_inside_tree():
		await get_tree().process_frame
		e += get_process_delta_time()
		hud.waypoint = _rescue_runner.position
		if not shouted and antonio.position.distance_to(hadassa.position) < 360:
			shouted = true
			line("Antônio", "HADASSA! CORRE!", 1.6)
		if auto and e > 1.0:
			_rescue_runner.die()
	hud.waypoint = null
	cutscene()
	for z in zombies:
		if is_instance_valid(z) and z.alive and z.position.distance_to(antonio.position) < 500:
			z.shoved((z.position - antonio.position).normalized(), 3.0)
			z.sight = 0.0
	hud.letterbox(true)
	hadassa.heading = (antonio.position - hadassa.position).angle()
	hadassa.go_to(antonio.position + (hadassa.position - antonio.position).normalized() * 50, 120)
	shot("resgate")
	await line("Hadassa", "Antônio?!")
	await line("Antônio", "Eu... eu nem sei o que eu fiz.")
	await line("Hadassa", "A Hannah! Eu não acho a minha irmã. Ela não atende!")
	await line("Antônio", "Eu vi ela! Lá de cima. Correndo pro lado do hospital!")
	await line("Hadassa", "Então é pra lá que a gente vai.")

# ======================================================================= capítulo 3 — fuga para o morro
func _setup_act3() -> void:
	_apply_day(0.55)
	antonio = spawn_survivor("antonio", Vector2(2050, 2680))
	antonio.weapon = weapon_choice
	set_player(antonio)
	antonio.heading = PI
	hadassa = spawn_survivor("hadassa", Vector2(2000, 2700))
	hadassa.invulnerable = true
	hadassa.follow = antonio
	cam_zoom = 1.35
	for p in [Vector2(2420, 1662), Vector2(2120, 1795), Vector2(3100, 1680), Vector2(1400, 1770), Vector2(2800, 1790), Vector2(3600, 1650), Vector2(900, 1660)]:
		wreck(p, randf_range(-0.4, 0.4) + (0.0 if p.y < 1720 else PI), randf() < 0.7)
	for k in 18:
		spawn_zombie(Vector2(randf_range(600, 3800), randf_range(1600, 1880)))
	for k in 5:
		spawn_zombie(Vector2(randf_range(2300, 3000), randf_range(2650, 2720)))
	for k in 18:
		spawn_civ(Vector2(randf_range(800, 3800), randf_range(1560, 1880)), false)

func _act3() -> void:
	player_input_enabled = false
	cam_follow = antonio
	hud.fade_to(0.0, 1.0)
	await hud.card("AV. CELSO GARCIA  ·  18:10", "Antônio e Hadassa")
	player_input_enabled = true
	audio.music("musica_fuga", -12)
	hud.set_hint("Shift: correr  ·  Espaço: pular\nF / clique: golpear  ·  E: se soltar")
	hud.objective("Vá para o hospital (oeste, pela V1)")
	set_day(0.7, 40.0)
	await reach(Vector2(1585, 2480), 100)
	# engavetamento e a horda vindo do hospital
	cutscene()
	hud.letterbox(true)
	cam_to(Vector2(1585, 2000), 0.95, 1.6)
	var bus := spawn_car(Vector2(400, 1650), 0, "onibus")
	bus.drive_to(Vector2(1520, 1700), 600)
	bus.arrived_crash_fire = 0.3
	bus.arrived_explode = 1.4
	for p in [Vector2(1550, 1890), Vector2(1630, 1905)]:
		var v := spawn_car(p, randf_range(-0.3, 0.3), "viatura")
		v.state = "crashed"
		v.siren_sound(p.x < 1600)
	world.obstacles.append(Rect2(1500, 1880, 170, 40))
	var fire_wall := Node2D.new()
	entities.add_child(fire_wall)
	for fx in [1520.0, 1585.0, 1650.0]:
		FX.fire(fire_wall, Vector2(fx, 1900), 1.1)
	var horde: Array = []
	for k in 22:
		var z := spawn_zombie(Vector2(randf_range(1350, 1850), randf_range(1560, 1760)), "comum")
		horde.append(z)
	await wait(1.8)
	shot("engavetamento")
	await line("Hadassa", "Por aqui não dá!")
	await line("Antônio", "O morro! Tem uma trilha atrás do estádio!")
	for z in horde:
		z.horde = true
		z.speed *= 1.25
	hud.letterbox(false)
	cam_follow = antonio
	player_input_enabled = true
	hud.objective("Fuja para o morro: a trilha fica atrás do estádio")
	await reach(Vector2(3135, 2675), 110)
	_pursuers(6)
	await reach(Vector2(3135, 1560), 110)
	_stadium_burst()
	var heli := Aircraft.new().setup(self, "heli", [Vector2(2400, 900), Vector2(3300, 1500), Vector2(4300, 2400), Vector2(5400, 3200)], 330)
	add_child(heli)
	line("Hadassa", "Ei! AQUI! AQUI EMBAIXO!", 2.2)
	_pursuers(5, true)
	await reach(Vector2(3135, 800), 110)
	line("Antônio", "Eles não vão parar... CORRE!", 1.8)
	await reach(Vector2(3300, 600), 90)
	var jet := Aircraft.new().setup(self, "jato", [Vector2(-300, 400), Vector2(2600, 900), Vector2(5600, 1400)], 1200)
	add_child(jet)
	_distant_bombs(5)
	await reach(Vector2(3560, 110), 90)
	line("Hadassa", "Não para! Não para agora!", 2.0)
	await reach(Vector2(3860, -360), 100)
	await reach(World.SUMMIT, 140)
	await _ending_scene()

func _pursuers(n: int, with_runner := false) -> void:
	var back := -Vector2.from_angle(player.heading)
	for k in n:
		var p: Vector2 = player.position + back * randf_range(650, 800) + back.orthogonal() * randf_range(-250, 250)
		if world.blocked(p, 12):
			continue
		var z := spawn_zombie(p, "corredor" if with_runner and k == 0 else "comum")
		z.horde = true
		z.speed *= 1.3 if z.kind == "comum" else 0.9

func _stadium_burst() -> void:
	flee_point = Vector2(2200, 2200)
	for k in 34:
		var p := Vector2(3320 + randf_range(-20, 40), randf_range(820, 1420))
		var c := spawn_civ(p, false)
		c.knock = Vector2(-randf_range(150, 300), 0)
	for k in 6:
		spawn_zombie(Vector2(3360 + randf_range(0, 40), randf_range(850, 1400)))
	audio.scream(Vector2(3330, 1100), true)
	audio.sfx("people_04", Vector2(3330, 1100), 4)

func _distant_bombs(n: int) -> void:
	for k in n:
		get_tree().create_timer(1.0 + k * 1.3, false).timeout.connect(func():
			var p := Vector2(randf_range(100, 1700), randf_range(-1300, 400))
			FX.explosion(entities, p, 2.2)
			audio.sfx("explosion_01", p, 8, 0.2))

func _ending_scene() -> void:
	cutscene()
	_ending = false
	hud.objective("")
	hud.set_hint("")
	hud.letterbox(true)
	for z in zombies:
		if is_instance_valid(z) and z.alive:
			z.horde = false
			z.sight = 0.0
			z.target = null
			if z.position.y < 600:
				z.go_to(Vector2(3300, 700), 40)
	antonio.go_to(World.SUMMIT + Vector2(-60, 10), 110)
	hadassa.follow = null
	hadassa.go_to(World.SUMMIT + Vector2(-10, 30), 110)
	audio.music("musica_final", -10, 3.0)
	set_day(1.0, 8.0)
	cam_to(Vector2(3000, 700), 0.32, 8.0)
	# a cidade queimando lá embaixo
	for k in 14:
		var p := Vector2(randf_range(200, 4600), randf_range(700, 3000))
		if world.on_road(p):
			FX.fire(entities, p, randf_range(1.2, 2.0))
	_distant_bombs(8)
	var heli2 := Aircraft.new().setup(self, "heli", [Vector2(400, 2600), Vector2(2400, 1700), Vector2(5200, 900)], 300)
	add_child(heli2)
	await wait(5.0)
	shot("final")
	await line("Hadassa", "A Hannah tá lá embaixo, Antônio.")
	await line("Antônio", "Eu sei.")
	await line("Antônio", "A gente vai achar ela. Eu prometo.")
	await line("Hadassa", "...Vou cobrar.")
	await wait(1.5)
	hud.show_end([["PROJECT Z", 104, true, Color("e8b10d")], ["PRÓLOGO  ·  DIA ZERO", 28, false],
		[" ", 14, false], ["Hannah — sozinha, a caminho do hospital.", 23, false],
		["San — ninguém sabe onde ele está.", 23, false], [" ", 14, false], ["CONTINUA...", 44, true],
		[" ", 20, false], ["Enter: jogar de novo", 18, false, Color("9a958a")]])
	_ending = true
	if auto:
		await wait(0.5)
		shot("fim")
		print("[autotest] OK — prólogo completo")
		get_tree().quit(0)
