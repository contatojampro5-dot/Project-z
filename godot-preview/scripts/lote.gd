extends RefCounted
class_name Lote
## Junta muitas peças (caixas, quadrados, cilindros) numa malha por material: a cidade inteira
## fica com poucas chamadas de desenho (leve no navegador). UV em metros x `escala`.

var _st := {}       # material -> SurfaceTool
var _esc := {}      # material -> escala da UV

func _tool(m: Material, escala: float) -> SurfaceTool:
	if not _st.has(m):
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		_st[m] = st
		_esc[m] = escala
	return _st[m]

## Quadrado com canto `o` e lados U e V (frente para U x V).
func quad(m: Material, o: Vector3, U: Vector3, V: Vector3, cor := Color.WHITE, uv0 := Vector2.ZERO, uv_metros := true, escala := 1.0) -> void:
	var st := _tool(m, escala)
	var k: float = _esc[m]
	var n := U.cross(V).normalized()
	var lu := U.length() * k if uv_metros else 1.0
	var lv := V.length() * k if uv_metros else 1.0
	var pts := [o, o + V, o + U + V, o, o + U + V, o + U]
	var uvs := [Vector2(0, lv), Vector2(0, 0), Vector2(lu, 0), Vector2(0, lv), Vector2(lu, 0), Vector2(lu, lv)]
	for i in 6:
		st.set_color(cor)
		st.set_normal(n)
		st.set_uv(uv0 + uvs[i])
		st.add_vertex(pts[i])

func tri(m: Material, a: Vector3, b: Vector3, c: Vector3, cor := Color.WHITE) -> void:
	var st := _tool(m, 1.0)
	var n := (b - a).cross(c - a).normalized()
	for v in [a, b, c]:
		st.set_color(cor)
		st.set_normal(-n)
		st.set_uv(Vector2(v.x + v.z, v.y))
		st.add_vertex(v)

## Caixa alinhada (centro da base em `p`), opcionalmente girada em Y.
func caixa(m: Material, p: Vector3, tam: Vector3, giro := 0.0, cor := Color.WHITE, sem_fundo := true, escala := 1.0) -> void:
	var b := Basis(Vector3.UP, giro)
	var hx := b * Vector3(tam.x * 0.5, 0, 0)
	var hz := b * Vector3(0, 0, tam.z * 0.5)
	var up := Vector3(0, tam.y, 0)
	var c0 := p - hx - hz
	quad(m, c0 + hz * 2.0, hx * 2.0, up, cor, Vector2.ZERO, true, escala)          # sul (+z)
	quad(m, c0 + hx * 2.0, -hx * 2.0, up, cor, Vector2.ZERO, true, escala)          # norte (-z)
	quad(m, c0, hz * 2.0, up, cor, Vector2.ZERO, true, escala)                      # oeste (-x)
	quad(m, c0 + hx * 2.0 + hz * 2.0, -hz * 2.0, up, cor, Vector2.ZERO, true, escala)  # leste (+x)
	quad(m, c0 + up + hz * 2.0, hx * 2.0, -hz * 2.0, cor, Vector2.ZERO, true, escala)  # topo
	if not sem_fundo:
		quad(m, c0, hx * 2.0, hz * 2.0, cor, Vector2.ZERO, true, escala)

## Cilindro em pé (base em p) com `lados` faces.
func cilindro(m: Material, p: Vector3, raio: float, alt: float, lados := 8, cor := Color.WHITE, tampa := true) -> void:
	var st := _tool(m, 1.0)
	for i in lados:
		var a0 := TAU * i / lados
		var a1 := TAU * (i + 1) / lados
		var p0 := p + Vector3(cos(a0) * raio, 0, sin(a0) * raio)
		var p1 := p + Vector3(cos(a1) * raio, 0, sin(a1) * raio)
		quad(m, p1, p0 - p1, Vector3(0, alt, 0), cor)
		if tampa:
			var t := Vector3(0, alt, 0)
			for v in [p + t, p0 + t, p1 + t]:
				st.set_color(cor)
				st.set_normal(Vector3.UP)
				st.set_uv(Vector2(v.x, v.z))
				st.add_vertex(v)

## Tubo entre dois pontos (fios, canos, cabos), seção quadrada fina.
func tubo(m: Material, a: Vector3, b: Vector3, r: float, cor := Color.WHITE) -> void:
	var d := (b - a)
	var lado := d.cross(Vector3.UP)
	if lado.length() < 0.001:
		lado = Vector3.RIGHT
	lado = lado.normalized() * r
	var cima := lado.cross(d).normalized() * r
	quad(m, a - lado - cima, d, cima * 2.0, cor)
	quad(m, a + lado + cima, d, -cima * 2.0, cor)
	quad(m, a + lado - cima, d, -lado * 2.0, cor)
	quad(m, a - lado + cima, d, lado * 2.0, cor)

func montar(pai: Node3D, nome := "lote", sombra := true) -> MeshInstance3D:
	var mesh := ArrayMesh.new()
	var i := 0
	for m in _st:
		var st: SurfaceTool = _st[m]
		st.commit(mesh)
		mesh.surface_set_material(i, m)
		i += 1
	var mi := MeshInstance3D.new()
	mi.name = nome
	mi.mesh = mesh
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if sombra else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	pai.add_child(mi)
	_st.clear()
	return mi
