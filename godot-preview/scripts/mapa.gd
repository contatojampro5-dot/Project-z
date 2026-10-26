extends RefCounted
class_name Mapa
## Planta da cidade em metros (x = leste, z = sul, y = altura), seguindo a foto aérea do Theo:
## Av. dos Tecelões no meio; ao norte hospital, faculdade e estádio; ao sul o Mercado do Antônio,
## prédios com lojas e casas; atrás de tudo o morro com a trilha e a casa lá em cima.

# ruas (retângulos no chão: x, z, largura, profundidade)
const AV := Rect2(-260, -11, 620, 22)          # Av. dos Tecelões (pista dupla, canteiro no meio)
const CANTEIRO := Rect2(-260, -1, 620, 2)
const V1 := Rect2(-5.5, -155, 11, 300)         # rua do hospital
const V2 := Rect2(194.5, -155, 11, 300)        # rua do estádio
const H0 := Rect2(-260, -155, 620, 10)         # rua ao pé do morro
const H2 := Rect2(-260, 96, 620, 10)           # rua dos fundos do mercado
const RUAS := [AV, V1, V2, H0, H2]
const CALCADA_AV := 4.5
const CALCADA := 3.0

# lugares da história
const HOSPITAL := Rect2(-120, -112, 100, 64)
const HOSP_PS := Vector3(-70, 0, -46)           # entrada do pronto-socorro
const HOSP_HALL := Rect2(-112, -66, 84, 18)     # saguão do PS no térreo (dá para entrar)
const HOSP_PORTA := Vector2(-74, -66)           # x do vão da porta automática (fachada sul, z = -48)
const FAC_N := Rect2(22, -136, 156, 18)
const FAC_W := Rect2(22, -118, 22, 64)          # ala oeste (sala do TCC no térreo)
const FAC_E := Rect2(156, -118, 22, 64)
const FAC_MURO_Z := -20.5
const FAC_PORTAO := Vector2(94, 106)            # x do portão no muro
const SALA_TCC := Rect2(24, -100, 18, 20)       # dentro da ala oeste
const FAC_CORREDOR_Z := -124.0                  # ala norte: corredor (sul) e salas de aula (norte)
const FAC_PORTAS := [60.0, 100.0, 140.0]        # portas da ala norte para o pátio (x)
const TOMADA := Vector3(26.2, 0, -91)
const PORTA_SALA := Vector3(43.5, 0, -86)        # porta da sala para o pátio
const QUADRA := Rect2(110, -100, 28, 40)
const MERCADO := Rect2(70, 40, 56, 30)
const MERCADO_PORTAO := Vector2(90, 106)        # x da porta de aço (frente, z = 40)
const MERCADO_FUNDOS := Vector3(98, 0, 70.6)
const DEPOSITO := Rect2(108, 42, 16, 26)
const MESA_CAMERAS := Vector3(118, 0, 50)
const ESCADA := Vector3(122, 0, 66)
const EXTINTOR := Vector3(96, 0, 68)
const ESTACIONAMENTO := Rect2(66, 16, 70, 22)
const ESTADIO_C := Vector2(282, -82)
const ESTADIO_R := Vector2(62, 44)
const ESTADIO_ALT := 17.0

# morro (relevo) e trilha
const MORRO_Z0 := -160.0
const TRILHA := [Vector2(212, -160), Vector2(208, -182), Vector2(236, -200), Vector2(226, -222), Vector2(258, -240),
	Vector2(244, -262), Vector2(272, -280), Vector2(262, -298), Vector2(280, -310)]
const TOPO := Vector2(280, -310)
const CASA_TOPO := Rect2(288, -326, 14, 10)

const LIMITE := Rect2(-250, -335, 595, 480)

static func altura(x: float, z: float) -> float:
	## altura do chão (o morro sobe ao norte da rua H0)
	if z > MORRO_Z0:
		return 0.0
	var sobe: float = clamp((MORRO_Z0 - z) / 30.0, 0.0, 1.0)
	var morro := 46.0 * exp(-pow((x - 282.0) / 130.0, 2.0) - pow((z + 315.0) / 120.0, 2.0))
	var base := 10.0 * exp(-pow((x - 150.0) / 240.0, 2.0)) * sobe
	var ondas := 2.5 * sin(x * 0.05) * cos(z * 0.07) * sobe
	return (morro * sobe + base + ondas) * sobe

static func dist_trilha(p: Vector2) -> float:
	var best := 1e9
	for i in TRILHA.size() - 1:
		var q := Geometry2D.get_closest_point_to_segment(p, TRILHA[i], TRILHA[i + 1])
		best = min(best, p.distance_to(q))
	return best

static func no_morro(p: Vector2) -> bool:
	return p.y < MORRO_Z0 - 1.0

static func na_rua(p: Vector2) -> bool:
	for r in RUAS:
		if r.has_point(p):
			return true
	return false
