extends Node3D
## Vitrine: monta a cidade e tira fotos de vários ângulos (teste visual, sem roteiro).
## Uso: godot --path godot-preview res://vitrine.tscn -- --pasta=/tmp/fotos [--noite]

func _ready() -> void:
	var pasta := "/tmp"
	var noite := false
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--pasta="):
			pasta = a.substr(8)
		if a == "--noite":
			noite = true
	var amb := Ambiente.new()
	add_child(amb)
	amb.montar()
	if noite:
		amb.aplicar(0.85)
	var col := Colisao.new()
	var t0 := Time.get_ticks_msec()
	var cid := Cidade.new()
	add_child(cid)
	cid.montar(col)
	print("[vitrine] cidade montada em ", Time.get_ticks_msec() - t0, " ms")
	var cam := CameraZ.new()
	add_child(cam)
	cam.livre = true
	Predio.camera = cam
	var poses := [
		["aerea", Vector3(120, 0, -40), -35.0, 32.0, 330.0],
		["avenida", Vector3(60, 0, 0), -45.0, 38.0, 34.0],
		["faculdade", Vector3(80, 0, -60), -45.0, 38.0, 60.0],
		["mercado", Vector3(98, 0, 40), -45.0, 38.0, 40.0],
		["estadio", Vector3(282, 0, -82), -30.0, 30.0, 160.0],
		["morro", Vector3(250, 20, -260), -20.0, 24.0, 160.0],
		["rua_baixa", Vector3(10, 1.5, 14), -60.0, 10.0, 22.0],
		["jogo", Vector3(96, 0, 12), -45.0, 38.0, 30.0],
		["jogo_patio", Vector3(80, 0, -60), -45.0, 38.0, 30.0],
		["estadio_portao", Vector3(214, 0, -82), -45.0, 38.0, 46.0],
		["esquina", Vector3(6, 0, -12), -45.0, 30.0, 16.0],
		["estadio_sul", Vector3(270, 0, -50), -45.0, 30.0, 110.0],
		["mercado_frente", Vector3(98, 0, 36), 160.0, 30.0, 34.0],
		["mercado_fundos", Vector3(96, 0, 70), -45.0, 38.0, 46.0],
		["mercado_dentro", Vector3(96, 0, 56), -45.0, 38.0, 30.0, true],
		["hospital_ps", Vector3(-70, 0, -44), -45.0, 38.0, 40.0],
		["hospital_dentro", Vector3(-70, 0, -57), -45.0, 38.0, 34.0, true],
		["faculdade_dentro", Vector3(100, 0, -128), -45.0, 38.0, 34.0, true],
	]
	var so := ""
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--so="):
			so = a.substr(5)
	var foco := Node3D.new()
	add_child(foco)
	for p in poses:
		if so != "" and not (p[0] in so.split(",")):
			continue
		foco.global_position = p[1]
		Predio.foco = foco if p.size() > 5 else null
		for c in cid.cortes:
			c[0].scale.y = 0.3 if p.size() > 5 and c[1].has_point(Vector2(p[1].x, p[1].z)) else 1.0
		cam.transform = cam.pose_de(p[1], p[2], p[3], p[4])
		for i in (40 if p.size() > 5 else 6):
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png("%s/%s%s.png" % [pasta, p[0], "_noite" if noite else ""])
		print("[vitrine] foto ", p[0])
	get_tree().quit()
