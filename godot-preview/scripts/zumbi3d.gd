extends Node3D
class_name Zumbi3D
## Infectado em 3D de verdade (como no Project Zomboid): personagens e animações do Mixamo que o Theo baixou
## (assets/mixamo/personagens/*.fbx com corpo e textura; assets/mixamo/*.fbx só com o movimento). Se faltar um
## personagem, monta um corpo feito por código preso nos mesmos ossos.

const BASE := "res://assets/mixamo/s_zombie_idle.fbx"
const PERSONAGENS := ["parasite", "prisoner", "warzombie", "zombiegirl", "copzombie", "yaku"]
const ALTURA := 1.82          # altura do personagem em metros (do pé ao topo da cabeça)
const QUADRIL_ANIM := 0.94    # altura do quadril no esqueleto das animações
## nome lógico -> [arquivo, repete, velocidade natural em m/s (para os pés não deslizarem)]
const ANIMS := {
	"idle": ["s_zombie_idle", true, 0.0], "idle2": ["n_zombie_idle_2", true, 0.0], "idle3": ["n_zombie_scratch_idle", true, 0.0],
	"walk": ["n_walking", true, 0.50], "walk2": ["s_zombie_walk", true, 0.30], "walk3": ["n_walking_2", true, 0.0],
	"run": ["s_zombie_run", true, 2.78], "run2": ["n_zombie_running", true, 2.78],
	"crawl": ["s_zombie_crawl", true, 0.39], "crawl_run": ["s_running_crawl", true, 2.0],
	"attack": ["s_zombie_attack", false, 0.0], "bite": ["s_zombie_biting_2", false, 0.0], "neck_bite": ["s_zombie_neck_bite", false, 0.0],
	"punch": ["n_zombie_punching", false, 0.0], "scream": ["s_zombie_scream", false, 0.0],
	"hit": ["n_zombie_reaction_hit", false, 0.0], "hit2": ["n_zombie_reaction_hit_2", false, 0.0],
	"death": ["s_zombie_death", false, 0.0], "dying": ["s_zombie_dying", false, 0.0],
	"stand_up": ["n_zombie_stand_up", false, 0.0], "agonizing": ["n_zombie_agonizing", true, 0.0],
}
const ESPESSURA := 1.22    # corpo mais encorpado (do mesmo porte das pessoas desenhadas)
const SEM_DESLOCAR := ["walk", "walk2", "walk3", "run", "run2", "crawl", "crawl_run"]   # tira o deslocamento embutido

static var _cena: PackedScene = null
static var _libs := {}
static var _cenas := {}
static var _malhas := {}
static var _skin: Skin = null
static var _mat: StandardMaterial3D = null

var esqueleto: Skeleton3D
var ap: AnimationPlayer
var corpo: MeshInstance3D
var anim := ""
var anim_fim := false
var _var := 0

static func _biblioteca(fator := 1.0) -> AnimationLibrary:
	## fator: quadril do personagem / quadril das animações (o quadril é posição absoluta na animação;
	## sem ajustar, um personagem mais alto afundaria no chão)
	var chave := snappedf(fator, 0.01)
	if _libs.has(chave):
		return _libs[chave]
	var _lib := AnimationLibrary.new()
	_libs[chave] = _lib
	for nome in ANIMS:
		var info: Array = ANIMS[nome]
		var ps: PackedScene = load("res://assets/mixamo/%s.fbx" % info[0])
		var n := ps.instantiate()
		var p: AnimationPlayer = n.find_children("*", "AnimationPlayer", true, false)[0]
		var a: Animation = p.get_animation("mixamo_com").duplicate(true)
		a.loop_mode = Animation.LOOP_LINEAR if info[1] else Animation.LOOP_NONE
		if nome in SEM_DESLOCAR:
			_no_lugar(a)
		if absf(chave - 1.0) > 0.005:
			_escalar_quadril(a, chave)
		_lib.add_animation(nome, a)
		n.free()
	return _lib

static func _escalar_quadril(a: Animation, f: float) -> void:
	var t := a.find_track(NodePath("Skeleton3D:mixamorig_Hips"), Animation.TYPE_POSITION_3D)
	if t < 0:
		return
	for i in a.track_get_key_count(t):
		a.track_set_key_value(t, i, (a.track_get_key_value(t, i) as Vector3) * f)

static func _no_lugar(a: Animation) -> void:
	## o quadril anda para frente na animação: tira o avanço (mantém o balanço) para o jogo mover o corpo
	var t := a.find_track(NodePath("Skeleton3D:mixamorig_Hips"), Animation.TYPE_POSITION_3D)
	if t < 0:
		return
	var k := a.track_get_key_count(t)
	var ini: Vector3 = a.track_get_key_value(t, 0)
	var fim: Vector3 = a.track_get_key_value(t, k - 1)
	var dur := maxf(a.track_get_key_time(t, k - 1), 0.001)
	for i in k:
		var v: Vector3 = a.track_get_key_value(t, i)
		var f := a.track_get_key_time(t, i) / dur
		v.x -= (fim.x - ini.x) * f + ini.x
		v.z -= (fim.z - ini.z) * f + ini.z
		a.track_set_key_value(t, i, v)

func montar(variante := -1, escala := 1.0, quem := "") -> Zumbi3D:
	## quem: um dos PERSONAGENS do Mixamo ("" = sorteia). Sem o arquivo, usa o corpo feito por código.
	if quem == "":
		quem = PERSONAGENS[(variante if variante >= 0 else randi()) % PERSONAGENS.size()]
	var caminho := "res://assets/mixamo/personagens/%s.fbx" % quem
	if ResourceLoader.exists(caminho):
		if not _cenas.has(quem):
			_cenas[quem] = load(caminho)
		var n: Node3D = (_cenas[quem] as PackedScene).instantiate()
		add_child(n)
		esqueleto = n.find_children("*", "Skeleton3D", true, false)[0]
		ap = n.find_children("*", "AnimationPlayer", true, false)[0]
		var qd := esqueleto.get_bone_global_rest(esqueleto.find_bone("mixamorig_Hips")).origin.y
		var topo := esqueleto.find_bone("mixamorig_HeadTop_End")
		var alt := esqueleto.get_bone_global_rest(topo).origin.y if topo >= 0 else qd * 1.85
		ap.add_animation_library("z", _biblioteca(qd / QUADRIL_ANIM))
		n.scale = Vector3.ONE * (ALTURA / alt)
		for mi in n.find_children("*", "MeshInstance3D", true, false):
			corpo = mi if corpo == null else corpo
			(mi as MeshInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	else:
		if _cena == null:
			_cena = load(BASE)
		var n2 := _cena.instantiate()
		add_child(n2)
		esqueleto = n2.find_children("*", "Skeleton3D", true, false)[0]
		ap = n2.find_children("*", "AnimationPlayer", true, false)[0]
		ap.add_animation_library("z", _biblioteca())
		_var = variante if variante >= 0 else randi() % 4
		if _skin == null:
			_skin = esqueleto.create_skin_from_rest_transforms()
		corpo = MeshInstance3D.new()
		corpo.mesh = malha(esqueleto, _var)
		corpo.skin = _skin
		esqueleto.add_child(corpo)
		corpo.skeleton = NodePath("..")
	scale = Vector3.ONE * escala
	ap.animation_finished.connect(func(_n): anim_fim = true)
	tocar("idle")
	ap.seek(randf() * 3.0, true)
	return self

func tocar(nome: String, reinicia := false, mistura := 0.18) -> void:
	if not ANIMS.has(nome):
		return
	if nome == anim and not reinicia:
		return
	anim = nome
	anim_fim = false
	ap.play("z/" + nome, mistura)
	if reinicia:
		ap.seek(0.0, true)

func ritmo(v: float) -> void:
	## velocidade da animação conforme a velocidade do corpo (os pés não deslizam)
	var nat: float = ANIMS[anim][2] if ANIMS.has(anim) else 0.0
	ap.speed_scale = clampf(v / nat, 0.5, 2.4) if nat > 0.0 and v > 0.05 else 1.0

func virar_para(dir: float) -> void:
	## dir: ângulo no chão (0 = +x, PI/2 = +z); o modelo do Mixamo olha para +z
	rotation.y = PI * 0.5 - dir

func ligado(sim: bool, longe := false) -> void:
	## fora da tela a animação para de ser calculada; muito longe, o corpo nem é desenhado (leve no navegador)
	ap.active = sim
	visible = not longe

func clarao(t := 0.12) -> void:
	var ms := find_children("*", "MeshInstance3D", true, false)
	for m in ms:
		(m as MeshInstance3D).material_overlay = _mat_clarao()
	get_tree().create_timer(t, false).timeout.connect(func():
		for m in ms:
			if is_instance_valid(m):
				(m as MeshInstance3D).material_overlay = null)

static var _clarao: StandardMaterial3D = null
static func _mat_clarao() -> StandardMaterial3D:
	if _clarao == null:
		_clarao = StandardMaterial3D.new()
		_clarao.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		_clarao.albedo_color = Color(1, 1, 1, 0.75)
		_clarao.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	return _clarao

# ------------------------------------------------------------------ o corpo (malha presa nos ossos)
const PALETAS := [
	# pele, camisa, calça, sapato
	[Color("7d8a6e"), Color("4f6175"), Color("2a2e38"), Color("1c1a18")],   # operário de camisa azul
	[Color("8f957c"), Color("b3ad9f"), Color("23242a"), Color("151515")],   # executivo de camisa (encardida)
	[Color("889378"), Color("8fa3a1"), Color("8fa3a1"), Color("b9b9b2")],   # paciente de camisola
	[Color("707b63"), Color("7a2224"), Color("34445e"), Color("c9c5bb")],   # torcedor de vermelho e tênis
]

static func malha(sk: Skeleton3D, v: int) -> ArrayMesh:
	if _malhas.has(v):
		return _malhas[v]
	var pal: Array = PALETAS[v % PALETAS.size()]
	var pele: Color = pal[0]
	var camisa: Color = pal[1]
	var calca: Color = pal[2]
	var sapato: Color = pal[3]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var rng := RandomNumberGenerator.new()
	rng.seed = 77 + v
	var P := func(nome: String) -> Vector3: return sk.get_bone_global_rest(sk.find_bone("mixamorig_" + nome)).origin
	var B := func(nome: String) -> int: return sk.find_bone("mixamorig_" + nome)
	# tronco e quadril (cada anel preso no osso da altura dele, para dobrar a coluna)
	_tubo(st, P.call("Hips") + Vector3(0, -0.08, 0), P.call("Spine2") + Vector3(0, 0.16, 0), [0.15, 0.16, 0.17, 0.2, 0.21, 0.17],
		[B.call("Hips"), B.call("Hips"), B.call("Spine"), B.call("Spine1"), B.call("Spine2"), B.call("Spine2")], camisa, rng, 0.35, Vector2(1.0, 0.72))
	_tubo(st, P.call("Hips") + Vector3(0, -0.14, 0), P.call("Hips") + Vector3(0, 0.02, 0), [0.15, 0.16], [B.call("Hips"), B.call("Hips")], calca, rng, 0.0, Vector2(1.0, 0.75))
	_tubo(st, P.call("Neck"), P.call("Head") + Vector3(0, 0.02, 0), [0.055, 0.05], [B.call("Neck"), B.call("Head")], pele, rng, 0.25)
	# cabeça (um pouco caída para frente: o rosto fica no +z)
	var cab: Vector3 = (P.call("Head") + P.call("HeadTop_End")) * 0.5
	_bola(st, cab + Vector3(0, -0.01, 0.012), Vector3(0.105, 0.13, 0.115), B.call("Head"), pele, rng, 0.2)
	if v != 1:
		_bola(st, cab + Vector3(0, 0.05, -0.012), Vector3(0.11, 0.09, 0.118), B.call("Head"), Color("2a221c") if v != 2 else Color("6e6a62"), rng, 0.0)
	for lado in [-1.0, 1.0]:
		_bola(st, cab + Vector3(0.038 * lado, 0.0, 0.104), Vector3(0.02, 0.015, 0.01), B.call("Head"), Color("e8e0c0"), rng, 0.0)
	_bola(st, cab + Vector3(0, -0.065, 0.098), Vector3(0.038, 0.018, 0.012), B.call("Head"), Color("3a0c0c"), rng, 0.0)
	for lado in ["Left", "Right"]:
		# braços: manga curta até o meio do braço, depois pele cinza
		var om: Vector3 = P.call(lado + "Arm")
		var co: Vector3 = P.call(lado + "ForeArm")
		var pu: Vector3 = P.call(lado + "Hand")
		var meio := om.lerp(co, 0.45)
		_tubo(st, om + (om - co).normalized() * 0.03, meio, [0.062, 0.058], [B.call(lado + "Arm"), B.call(lado + "Arm")], camisa, rng, 0.3)
		_tubo(st, meio, co, [0.05, 0.045], [B.call(lado + "Arm"), B.call(lado + "ForeArm")], pele, rng, 0.35)
		_tubo(st, co, pu, [0.045, 0.036], [B.call(lado + "ForeArm"), B.call(lado + "Hand")], pele, rng, 0.35)
		var dedo: Vector3 = P.call(lado + "HandMiddle1") if sk.find_bone("mixamorig_" + lado + "HandMiddle1") >= 0 else pu + (pu - co).normalized() * 0.08
		_tubo(st, pu, dedo + (dedo - pu) * 0.8, [0.038, 0.03], [B.call(lado + "Hand"), B.call(lado + "Hand")], pele.darkened(0.1), rng, 0.2, Vector2(1.0, 0.55))
		_tubo(st, P.call(lado + "Shoulder").lerp(om, 0.3), om, [0.075, 0.068], [B.call(lado + "Shoulder"), B.call(lado + "Arm")], camisa, rng, 0.2)
		# pernas e pés
		var coxa: Vector3 = P.call(lado + "UpLeg")
		var joe: Vector3 = P.call(lado + "Leg")
		var pe: Vector3 = P.call(lado + "Foot")
		var ponta: Vector3 = P.call(lado + "ToeBase")
		_tubo(st, coxa + Vector3(0, 0.04, 0), joe, [0.09, 0.07], [B.call(lado + "UpLeg"), B.call(lado + "Leg")], calca, rng, 0.15)
		_tubo(st, joe, pe, [0.062, 0.05], [B.call(lado + "Leg"), B.call(lado + "Foot")], calca if v != 2 else pele, rng, 0.25)
		var frente := (ponta - pe)
		frente.y = 0.0
		frente = frente.normalized()
		var chao_pe := Vector3(pe.x, 0.045, pe.z)
		_tubo(st, chao_pe - frente * 0.05 + Vector3(0, 0.02, 0), Vector3(ponta.x, 0.04, ponta.z) + frente * 0.07, [0.055, 0.058, 0.05], [B.call(lado + "Foot"), B.call(lado + "Foot"), B.call(lado + "ToeBase")], sapato, rng, 0.0, Vector2(1.0, 0.62))
		_tubo(st, pe + Vector3(0, 0.03, 0), chao_pe + Vector3(0, 0.03, 0), [0.052, 0.054], [B.call(lado + "Foot"), B.call(lado + "Foot")], sapato, rng, 0.0)
	st.generate_normals()
	var m := st.commit()
	if _mat == null:
		_mat = StandardMaterial3D.new()
		_mat.vertex_color_use_as_albedo = true
		_mat.vertex_color_is_srgb = true
		_mat.roughness = 0.95
		_mat.metallic_specular = 0.15
		_mat.rim_enabled = true
		_mat.rim = 0.12
		_mat.rim_tint = 0.8
	m.surface_set_material(0, _mat)
	_malhas[v] = m
	return m

static var _ruido: FastNoiseLite = null

static func _manchas(c: Color, p: Vector3, sangue: float, semente: int) -> Color:
	## sujeira e manchas de sangue em placas (ruído pela posição, não ponto a ponto)
	if _ruido == null:
		_ruido = FastNoiseLite.new()
		_ruido.frequency = 4.5
	var q := p + Vector3(semente * 3.1, semente * 1.7, 0)
	var suj := _ruido.get_noise_3dv(q * 2.5) * 0.5 + 0.5
	var x := c.darkened(suj * 0.22)
	var s := _ruido.get_noise_3dv(q + Vector3(40, 0, 0))
	if sangue > 0.0 and s > 0.42 - sangue * 0.7:
		x = x.lerp(Color("3c0a0a"), clampf((s - (0.42 - sangue * 0.7)) * 4.0, 0.0, 0.9))
	return x

static func _tubo(st: SurfaceTool, a: Vector3, b: Vector3, raios: Array, ossos: Array, cor: Color, rng: RandomNumberGenerator, sangue := 0.2, achata := Vector2.ONE) -> void:
	## tubo com tampas entre a e b; cada anel tem raio e osso próprios (interpolados)
	var lados := 10
	var aneis := maxi(raios.size(), 4)
	var eixo := (b - a)
	var d := eixo.normalized()
	var u := d.cross(Vector3.FORWARD if absf(d.z) < 0.9 else Vector3.RIGHT).normalized()
	var w := d.cross(u).normalized()
	var pts := []
	for i in aneis + 1:
		var f := float(i) / aneis
		var rf := f * (raios.size() - 1)
		var r0: float = raios[int(floorf(rf))]
		var r1: float = raios[mini(int(floorf(rf)) + 1, raios.size() - 1)]
		var r := lerpf(r0, r1, rf - floorf(rf)) * ESPESSURA
		var of := f * (ossos.size() - 1)
		var o0: int = ossos[int(floorf(of))]
		var o1: int = ossos[mini(int(floorf(of)) + 1, ossos.size() - 1)]
		var peso := of - floorf(of)
		var anel := []
		for j in lados:
			var ang := TAU * j / lados
			var p := a + eixo * f + (u * cos(ang) * achata.x + w * sin(ang) * achata.y) * r
			anel.append([p, o0, o1, peso, _manchas(cor, p, sangue, rng.seed)])
		pts.append(anel)
	for i in aneis:
		for j in lados:
			var j2 := (j + 1) % lados
			_tri(st, pts[i][j], pts[i + 1][j], pts[i + 1][j2])
			_tri(st, pts[i][j], pts[i + 1][j2], pts[i][j2])
	# tampas
	var c0 := [a, ossos[0], ossos[0], 0.0, cor]
	var c1 := [b, ossos[-1], ossos[-1], 0.0, cor]
	for j in lados:
		var j2 := (j + 1) % lados
		_tri(st, c0, pts[0][j2], pts[0][j])
		_tri(st, c1, pts[aneis][j], pts[aneis][j2])

static func _bola(st: SurfaceTool, c: Vector3, r: Vector3, osso: int, cor: Color, rng: RandomNumberGenerator, sangue := 0.0) -> void:
	var la := 10
	var an := 7
	var pts := []
	for i in an + 1:
		var t := PI * i / an
		var anel := []
		for j in la:
			var p := TAU * j / la
			var v := c + Vector3(sin(t) * cos(p) * r.x, cos(t) * r.y, sin(t) * sin(p) * r.z)
			anel.append([v, osso, osso, 0.0, _manchas(cor, v, sangue, rng.seed)])
		pts.append(anel)
	for i in an:
		for j in la:
			var j2 := (j + 1) % la
			_tri(st, pts[i][j], pts[i][j2], pts[i + 1][j2])
			_tri(st, pts[i][j], pts[i + 1][j2], pts[i + 1][j])

static func _tri(st: SurfaceTool, a: Array, b: Array, c: Array) -> void:
	for v in [a, c, b]:
		st.set_color(v[4])
		st.set_bones(PackedInt32Array([v[1], v[2], 0, 0]))
		var p: float = v[3]
		st.set_weights(PackedFloat32Array([1.0 - p, p, 0.0, 0.0]))
		st.add_vertex(v[0])
