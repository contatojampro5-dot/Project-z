extends Camera3D
class_name CameraZ
## Câmera estilo Project Zomboid: alta, inclinada ~38° (a mesma dos sprites) e na diagonal, seguindo
## o personagem com um pouco de antecipação. Para as cenas, voa entre posições com suavidade.
## Sem tremor de tela (regra do dono).

const INCLINACAO := 38.0
var giro := -45.0            # graus em volta do eixo Y (diagonal)
var distancia := 30.0
var alvo: Node3D = null
var foco := Vector3.ZERO
var antecipa := Vector3.ZERO
var livre := false            # true = a cena controla a câmera
var _tw: Tween

func _ready() -> void:
	fov = 30.0
	near = 0.5
	far = 900.0
	current = true

const ZOOM := 0.75             # todas as distâncias de câmera (as pessoas ficaram em escala real, a câmera chega mais perto)

func pose_de(f: Vector3, g: float, inc: float, dist: float) -> Transform3D:
	var b := Basis(Vector3.UP, deg_to_rad(g)) * Basis(Vector3.RIGHT, deg_to_rad(-inc))
	var pos := f + b * Vector3(0, 0, dist * ZOOM)
	return Transform3D(b, pos)

func _process(delta: float) -> void:
	if livre:
		return
	if alvo and is_instance_valid(alvo):
		var v := Vector3.ZERO
		if "vel" in alvo:
			v = alvo.vel
		antecipa = antecipa.lerp(v * 0.45, clamp(delta * 2.0, 0, 1))
		foco = foco.lerp(alvo.global_position + antecipa + Vector3(0, 1.0, 0), clamp(delta * 5.0, 0, 1))
	transform = pose_de(foco, giro, INCLINACAO, distancia)

## Voo de cena: vai até (foco, giro, inclinação, distância) em `t` segundos.
func voar(f: Vector3, g: float, inc: float, dist: float, t: float, trans := Tween.TRANS_SINE) -> Tween:
	livre = true
	if _tw:
		_tw.kill()
	var de := transform
	var para := pose_de(f, g, inc, dist)
	_tw = create_tween()
	_tw.tween_method(func(k: float): transform = de.interpolate_with(para, k), 0.0, 1.0, t).set_trans(trans).set_ease(Tween.EASE_IN_OUT)
	return _tw

func seguir(a: Node3D, dist := 30.0, g := -45.0) -> void:
	alvo = a
	distancia = dist
	giro = g
	foco = a.global_position + Vector3(0, 1.0, 0)
	livre = false

## Volta a seguir com transição suave (sem salto).
func voltar(a: Node3D, dist := 30.0, g := -45.0, t := 1.6) -> void:
	alvo = a
	var f := a.global_position + Vector3(0, 1.0, 0)
	await voar(f, g, INCLINACAO, dist, t).finished
	foco = f
	distancia = dist
	giro = g
	livre = false
