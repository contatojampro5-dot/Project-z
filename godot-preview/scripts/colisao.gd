extends RefCounted
class_name Colisao
## Colisão leve no plano do chão (x, z): retângulos (prédios, muros, carros parados), círculos
## (árvores, postes) e a regra do morro (só se anda pela trilha e no topo).

var rets: Array[Rect2] = []
var baixos: Array[Rect2] = []      # dá para pular por cima (carros, barreiras)
var circulos: Array = []           # [Vector2, raio]

func ret(r: Rect2) -> void:
	rets.append(r)

func baixo(r: Rect2) -> int:
	baixos.append(r)
	return baixos.size() - 1

func circ(p: Vector2, r: float) -> void:
	circulos.append([p, r])

func bloqueado(p: Vector2, r: float, ignora_baixo := false) -> bool:
	if not Mapa.LIMITE.has_point(p):
		return true
	if Mapa.no_morro(p):
		if Mapa.dist_trilha(p) > 2.4 and p.distance_to(Mapa.TOPO) > 16.0:
			return true
	for o in rets:
		if o.grow(r).has_point(p):
			return true
	if not ignora_baixo:
		for o in baixos:
			if o.size.x > 0 and o.grow(r).has_point(p):
				return true
	for c in circulos:
		if p.distance_squared_to(c[0]) < (r + c[1]) * (r + c[1]):
			return true
	var e := (p - Mapa.ESTADIO_C) / (Mapa.ESTADIO_R + Vector2(r, r))
	if e.length_squared() < 1.0:
		return true
	return false

func baixo_a_frente(p: Vector2, dir: Vector2) -> bool:
	for k in [0.8, 1.6, 2.4]:
		var q: Vector2 = p + dir * k
		for o in baixos:
			if o.size.x > 0 and o.grow(0.2).has_point(q):
				return true
	return false
