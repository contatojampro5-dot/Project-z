extends Node3D
class_name Pessoa
## Base de quem anda: sprite em 8 direções (folhas do laboratório) no mundo 3D, colisão no chão,
## empurrão, sombra e movimento de cena. Direção 0 = direita da tela, 2 = virado para a câmera.

## metros por pixel da folha. O boneco ocupa ~108 px da célula (da cabeça ao pé) e já vem desenhado
## visto de cima: o quadro virado para a câmera mede a altura APARENTE de uma pessoa de ~1,75 m
## (conferido ao lado de uma caixa de 1,72 m, de uma porta de 2,1 m e de um sedã). Antes era 0,0245 e as
## pessoas ficavam com quase o dobro do tamanho certo (o Theo notou a desproporção).
const PX := 0.0148
const CELULA := 128.0
const CHAO := 108.0
const ESCALA_INFECTADO := 0.85 * 1.0 / 0.95   # regra do dono: zumbis 15% menores (os sobreviventes um pouco maiores)
static var _folhas := {}
static var _mats := {}
static var _indice := {}
static var _shader: Shader = null
static var _sombra_mat: StandardMaterial3D = null
static var camera: Camera3D = null

var cena: Node = null
var variante := ""
var anims := {}
var anim := ""
var anim_t := 0.0
var anim_fim := false
var dir := PI * 0.5            # direção para onde olha (ângulo no chão: 0 = +x, PI/2 = +z)
var vel := Vector3.ZERO
var empurrao := Vector3.ZERO
var raio := 0.32
var vivo := true
var fantasma := false
var atordoado := 0.0
var alvo_cena = null            # Vector3 (movimento roteirizado)
var vel_cena := 2.0
var tamanho := 1.0
var altura_pulo := 0.0
var quadro: MeshInstance3D
var sombra: MeshInstance3D
signal chegou

static func indice() -> Dictionary:
	if _indice.is_empty():
		var f := FileAccess.open("res://assets/folhas/folhas.json", FileAccess.READ)
		_indice = JSON.parse_string(f.get_as_text())
	return _indice

static func _mat_de(tex: Texture2D) -> ShaderMaterial:
	if not _mats.has(tex):
		if _shader == null:
			_shader = load("res://shaders/sprite_pessoa.gdshader")
		var m := ShaderMaterial.new()
		m.shader = _shader
		m.set_shader_parameter("folha", tex)
		_mats[tex] = m
	return _mats[tex]

func vestir(v: String, escala := 1.0) -> void:
	variante = v
	tamanho = escala
	anims.clear()
	var meta: Dictionary = indice()[v]["anims"]
	for a in meta:
		var nome := "%s__%s" % [v, a]
		if not _folhas.has(nome):
			_folhas[nome] = load("res://assets/folhas/%s.webp" % nome)
		anims[a] = {"tex": _folhas[nome], "frames": int(meta[a]["frames"]), "fps": float(meta[a]["fps"]), "loop": bool(meta[a]["loop"])}
	if quadro == null:
		quadro = MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(CELULA, CELULA) * PX * escala
		q.center_offset = Vector3(0, (CHAO - CELULA * 0.5) * PX * escala, 0)
		quadro.mesh = q
		quadro.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(quadro)
		sombra = MeshInstance3D.new()
		var s := QuadMesh.new()
		s.size = Vector2(0.85, 0.6) * escala
		sombra.mesh = s
		if _sombra_mat == null:
			_sombra_mat = StandardMaterial3D.new()
			_sombra_mat.albedo_texture = Predio.tex("brilho.png")
			_sombra_mat.albedo_color = Color(0, 0, 0, 0.55)
			_sombra_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			_sombra_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		sombra.material_override = _sombra_mat
		sombra.rotation.x = -PI * 0.5
		sombra.position.y = 0.04
		sombra.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(sombra)
	tocar(anims.keys()[0], true)

func tocar(nome: String, reinicia := false) -> void:
	if not anims.has(nome):
		return
	if nome == anim and not reinicia:
		return
	anim = nome
	anim_t = 0.0
	anim_fim = false
	quadro.material_override = _mat_de(anims[nome]["tex"])

func animar(delta: float, ritmo := 1.0) -> void:
	if anim == "" or quadro == null:
		return
	var a: Dictionary = anims[anim]
	anim_t += delta * ritmo
	var f := int(anim_t * a["fps"])
	if a["loop"]:
		f = f % int(a["frames"])
	else:
		if f >= a["frames"] - 1:
			anim_fim = true
		f = mini(f, a["frames"] - 1)
	var d := _dir_tela()
	quadro.set_instance_shader_parameter("regiao", Vector4(d / 8.0, float(f) / a["frames"], 1.0 / 8.0, 1.0 / a["frames"]))
	quadro.position.y = altura_pulo

func _dir_tela() -> int:
	if camera == null:
		return 2
	var b := camera.global_transform.basis
	var dir_v := Vector3(cos(dir), 0, sin(dir))
	var direita := Vector3(b.x.x, 0, b.x.z).normalized()
	var para_cam := Vector3(b.z.x, 0, b.z.z).normalized()
	var a := atan2(dir_v.dot(para_cam), dir_v.dot(direita))
	return (int(round(a / (PI / 4.0))) % 8 + 8) % 8

func clarao(t := 0.12) -> void:
	quadro.set_instance_shader_parameter("clarao", 0.9)
	get_tree().create_timer(t, false).timeout.connect(func(): if is_instance_valid(quadro): quadro.set_instance_shader_parameter("clarao", 0.0))

# ------------------------------------------------------------------ movimento
func chao2() -> Vector2:
	return Vector2(global_position.x, global_position.z)

func mover(delta: float) -> void:
	var v := vel + empurrao
	empurrao = empurrao.move_toward(Vector3.ZERO, 30.0 * delta)
	if v.length_squared() > 0.0001:
		var p := chao2()
		var n := p + Vector2(v.x, v.z) * delta
		var c: Colisao = cena.col
		if fantasma or not c.bloqueado(n, raio):
			p = n
		else:
			var nx := Vector2(n.x, p.y)
			var nz := Vector2(p.x, n.y)
			if absf(v.x) > 0.01 and not c.bloqueado(nx, raio):
				p = nx
			elif absf(v.z) > 0.01 and not c.bloqueado(nz, raio):
				p = nz
			elif c.bloqueado(p, raio):
				p = n
		global_position = Vector3(p.x, Mapa.altura(p.x, p.y) + (0.15 if _na_calcada(p) else 0.0), p.y)

func _na_calcada(p: Vector2) -> bool:
	if Mapa.no_morro(p):
		return false
	return not Mapa.na_rua(p) and absf(p.y) < 16.0

func vel_cena_agora() -> Vector3:
	if alvo_cena == null:
		return Vector3.ZERO
	var d: Vector3 = alvo_cena - global_position
	d.y = 0
	if d.length() < 0.25:
		alvo_cena = null
		chegou.emit()
		return Vector3.ZERO
	return d.normalized() * vel_cena

func ir(p: Vector3, v := 2.0) -> void:
	alvo_cena = p
	vel_cena = v

func olhar(p: Vector3) -> void:
	var d := p - global_position
	dir = atan2(d.z, d.x)

func empurrado(forca: Vector3, atordoa := 0.5) -> void:
	empurrao = Vector3(forca.x, 0, forca.z)
	atordoado = max(atordoado, atordoa)

func atropelado(forca: Vector3, _carro: Node) -> void:
	empurrado(forca * 0.8 + Vector3(randf_range(-2, 2), 0, randf_range(-2, 2)), 0.8)
