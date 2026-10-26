extends SceneTree
## lista o que tem em cada FBX do Mixamo (esqueleto, animação, duração)
func _init() -> void:
	var d := DirAccess.open("res://assets/mixamo")
	for f in d.get_files():
		if not f.ends_with(".fbx"):
			continue
		var ps: PackedScene = load("res://assets/mixamo/" + f)
		var n := ps.instantiate()
		var sk: Skeleton3D = n.find_children("*", "Skeleton3D", true, false)[0] if n.find_children("*", "Skeleton3D", true, false).size() > 0 else null
		var ap: AnimationPlayer = n.find_children("*", "AnimationPlayer", true, false)[0] if n.find_children("*", "AnimationPlayer", true, false).size() > 0 else null
		var info := "%s ossos=%d" % [f, sk.get_bone_count() if sk else -1]
		if ap:
			for a in ap.get_animation_list():
				var an := ap.get_animation(a)
				info += "  anim=%s dur=%.2f trilhas=%d" % [a, an.length, an.get_track_count()]
		if sk:
			var h := sk.find_bone("mixamorig_Hips")
			if h < 0:
				h = 0
			info += "  quadril=%s nome0=%s escala=%s" % [sk.get_bone_global_rest(h).origin, sk.get_bone_name(0), sk.global_transform.basis.get_scale() if sk.is_inside_tree() else n.get_child(0).transform.basis.get_scale()]
		print(info)
		n.free()
	quit()
