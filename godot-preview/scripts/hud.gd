extends CanvasLayer
class_name Hud
## Interface do prólogo: objetivo, legendas com retrato, cartões de lugar/hora, faixas de cinema,
## celular da Hannah, câmera de segurança do mercado, luta para se soltar e pausa.

const SPEAKERS := {
	"Hannah": {"color": Color("e8a35a"), "face": "hannah"},
	"Antônio": {"color": Color("e8c547"), "face": "antonio"},
	"Hadassa": {"color": Color("e06a5a"), "face": "hadassa"},
	"Rádio": {"color": Color("9fb4c8"), "face": ""},
}
const FACES := {
	"hannah": ["res://assets/sprites/retrato-hanna.webp", Rect2(215, 40, 250, 250)],
	"antonio": ["res://assets/sprites/retrato-antonio.webp", Rect2(245, 20, 250, 250)],
	"hadassa": ["res://assets/sprites/retrato-hadassa.webp", Rect2(395, 40, 330, 330)],
}

var main: Node = null
var font_title: Font
var font_ui: Font
var font_bold: Font
var card_bg: TextureRect
var font_label: Font     # rótulos curtos (OBJETIVO, nomes, FÔLEGO): Syne espaçada
var root: Control
var vignette: TextureRect
var red: ColorRect
var bars: Array[ColorRect] = []
var obj_box: VBoxContainer
var obj_text: Label
var sub_panel: PanelContainer
var sub_face: TextureRect
var sub_name: Label
var sub_text: Label
var card_box: VBoxContainer
var card_title: Label
var card_sub: Label
var prompt: Label
var hint: Label
var fade: ColorRect
var struggle_box: VBoxContainer
var struggle_bar: ProgressBar
var phone: PanelContainer
var phone_list: VBoxContainer
var cctv: ColorRect
var cctv_label: Label
var gauges: Control
var marker: Control
var photo: TextureRect
var pause_panel: PanelContainer
var end_box: VBoxContainer
var pause_btns := {}
var pause_hint: Label
signal escolheu(id: String)
var waypoint = null
var skip_line := false
var _faces := {}
var _vozes := {}          # texto da fala -> arquivo de voz (ElevenLabs)
var voz: AudioStreamPlayer

func setup(m: Node) -> Hud:
	main = m
	layer = 10
	process_mode = Node.PROCESS_MODE_ALWAYS
	# letras (Afrodite): Instrument Serif nos títulos de cinema, Syne nos rótulos, Manrope no texto
	font_title = _espacada(load("res://assets/fonts/titulo.ttf"), 2)
	font_ui = load("res://assets/fonts/texto.ttf")
	font_bold = load("res://assets/fonts/texto-bold.ttf")
	font_label = _espacada(load("res://assets/fonts/rotulo.ttf"), 3)
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_build()
	voz = AudioStreamPlayer.new()
	voz.volume_db = 2.0
	add_child(voz)
	var f := FileAccess.open("res://assets/audio/vozes/falas.json", FileAccess.READ)
	if f:
		var tab: Dictionary = JSON.parse_string(f.get_as_text())
		for id in tab:
			var arq := "res://assets/audio/vozes/%s.mp3" % id
			if ResourceLoader.exists(arq):
				_vozes[tab[id][1]] = arq
	return self

func _espacada(f: Font, px: int) -> FontVariation:
	var v := FontVariation.new()
	v.base_font = f
	v.spacing_glyph = px
	return v

func _label(text: String, font: Font, size: int, color := Color("ece6d6")) -> Label:
	var l := Label.new()
	l.text = text
	var s := LabelSettings.new()
	s.font = font
	s.font_size = size
	s.font_color = color
	s.shadow_color = Color(0, 0, 0, 0.75)
	s.shadow_size = 4
	s.shadow_offset = Vector2(0, 2)
	l.label_settings = s
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _panel_style(a := 0.72) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.05, 0.055, 0.045, a)
	sb.border_color = Color("e8b10d")
	sb.border_width_left = 3
	sb.content_margin_left = 16
	sb.content_margin_right = 18
	sb.content_margin_top = 10
	sb.content_margin_bottom = 12
	return sb

func _build() -> void:
	# foto aérea da abertura
	photo = TextureRect.new()
	photo.set_anchors_preset(Control.PRESET_FULL_RECT)
	photo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	photo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	photo.mouse_filter = Control.MOUSE_FILTER_IGNORE
	photo.visible = false
	root.add_child(photo)
	# câmera de segurança (efeito por cima do mundo)
	cctv = ColorRect.new()
	cctv.set_anchors_preset(Control.PRESET_FULL_RECT)
	cctv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
uniform sampler2D screen_tex : hint_screen_texture, filter_linear;
void fragment() {
	vec2 uv = SCREEN_UV;
	uv.x += sin(uv.y * 40.0 + TIME * 3.0) * 0.0012;
	vec3 c = texture(screen_tex, uv).rgb;
	float g = dot(c, vec3(0.299, 0.587, 0.114)) * 1.25;
	float scan = 0.8 + 0.2 * sin(uv.y * 1100.0);
	float n = fract(sin(dot(uv * 731.0 + TIME, vec2(12.9898, 78.233))) * 43758.5453);
	vec3 col = vec3(g) * vec3(0.82, 1.0, 0.86) * scan + (n - 0.5) * 0.14;
	float v = smoothstep(0.95, 0.35, distance(uv, vec2(0.5)));
	COLOR = vec4(col * v, 1.0);
}
"""
	var mat := ShaderMaterial.new()
	mat.shader = sh
	cctv.material = mat
	cctv.visible = false
	root.add_child(cctv)
	cctv_label = _label("CAM 02 · FRENTE         ● REC", font_bold, 22, Color(1.6, 1.6, 1.5))
	cctv_label.position = Vector2(60, 110)
	cctv.add_child(cctv_label)
	# vinheta e vermelho do coração
	vignette = TextureRect.new()
	vignette.set_anchors_preset(Control.PRESET_FULL_RECT)
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vignette.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	var g := Gradient.new()
	g.set_color(0, Color(0, 0, 0, 0))
	g.set_color(1, Color(0, 0, 0, 0.62))
	g.add_point(0.62, Color(0, 0, 0, 0.06))
	var gt := GradientTexture2D.new()
	gt.gradient = g
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5)
	gt.fill_to = Vector2(1.12, 0.5)
	vignette.texture = gt
	root.add_child(vignette)
	red = ColorRect.new()
	red.set_anchors_preset(Control.PRESET_FULL_RECT)
	red.color = Color(0.6, 0, 0.02, 0)
	red.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(red)
	# faixas de cinema
	for i in 2:
		var b := ColorRect.new()
		b.color = Color.BLACK
		b.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.anchor_right = 1.0
		if i == 1:
			b.anchor_top = 1.0
			b.anchor_bottom = 1.0
		root.add_child(b)
		bars.append(b)
	_set_bars(0.0)
	# objetivo
	obj_box = VBoxContainer.new()
	obj_box.position = Vector2(28, 24)
	obj_box.add_theme_constant_override("separation", 0)
	obj_box.add_child(_label("OBJETIVO", font_label, 15, Color("e8b10d")))
	obj_text = _label("", font_bold, 22)
	obj_box.add_child(obj_text)
	obj_box.visible = false
	root.add_child(obj_box)
	# dica de controles
	hint = _label("", font_ui, 17, Color("c9c3b3"))
	hint.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hint.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	hint.position = Vector2(-28, 28)
	root.add_child(hint)
	# marcador do objetivo e medidores
	marker = Control.new()
	marker.set_anchors_preset(Control.PRESET_FULL_RECT)
	marker.mouse_filter = Control.MOUSE_FILTER_IGNORE
	marker.draw.connect(_draw_marker)
	root.add_child(marker)
	gauges = Control.new()
	gauges.set_anchors_preset(Control.PRESET_FULL_RECT)
	gauges.mouse_filter = Control.MOUSE_FILTER_IGNORE
	gauges.draw.connect(_draw_gauges)
	root.add_child(gauges)
	# legenda
	sub_panel = PanelContainer.new()
	sub_panel.add_theme_stylebox_override("panel", _panel_style())
	sub_panel.anchor_left = 0.5
	sub_panel.anchor_right = 0.5
	sub_panel.anchor_top = 1.0
	sub_panel.anchor_bottom = 1.0
	sub_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	sub_panel.grow_vertical = Control.GROW_DIRECTION_BEGIN
	sub_panel.offset_bottom = -34
	sub_panel.custom_minimum_size = Vector2(640, 0)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 14)
	sub_face = TextureRect.new()
	sub_face.custom_minimum_size = Vector2(72, 72)
	sub_face.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	sub_face.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	hb.add_child(sub_face)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 2)
	sub_name = _label("", font_label, 16)
	sub_text = _label("", font_ui, 23)
	sub_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	sub_text.custom_minimum_size = Vector2(520, 0)
	vb.add_child(sub_name)
	vb.add_child(sub_text)
	hb.add_child(vb)
	sub_panel.add_child(hb)
	sub_panel.visible = false
	root.add_child(sub_panel)
	# aviso de interação
	prompt = _label("", font_bold, 24, Color(1, 0.93, 0.7))
	prompt.anchor_left = 0.5
	prompt.anchor_right = 0.5
	prompt.anchor_top = 1.0
	prompt.anchor_bottom = 1.0
	prompt.grow_horizontal = Control.GROW_DIRECTION_BOTH
	prompt.offset_top = -190
	prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(prompt)
	# luta para se soltar
	struggle_box = VBoxContainer.new()
	struggle_box.anchor_left = 0.5
	struggle_box.anchor_right = 0.5
	struggle_box.anchor_top = 0.62
	struggle_box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	var st := _label("SE SOLTA! Aperte E sem parar", font_label, 26, Color("ff6b5b"))
	st.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	struggle_box.add_child(st)
	struggle_bar = ProgressBar.new()
	struggle_bar.custom_minimum_size = Vector2(360, 18)
	struggle_bar.max_value = 1.0
	struggle_bar.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color("e8b10d")
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0, 0, 0, 0.6)
	struggle_bar.add_theme_stylebox_override("fill", fill)
	struggle_bar.add_theme_stylebox_override("background", bg)
	struggle_box.add_child(struggle_bar)
	struggle_box.visible = false
	root.add_child(struggle_box)
	# celular da Hannah
	phone = PanelContainer.new()
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color("101418")
	ps.border_color = Color("3a3f45")
	ps.set_border_width_all(6)
	ps.set_corner_radius_all(26)
	ps.content_margin_left = 22
	ps.content_margin_right = 22
	ps.content_margin_top = 26
	ps.content_margin_bottom = 26
	phone.add_theme_stylebox_override("panel", ps)
	phone.anchor_left = 1.0
	phone.anchor_right = 1.0
	phone.anchor_top = 0.5
	phone.anchor_bottom = 0.5
	phone.offset_left = -360
	phone.offset_right = -40
	phone.offset_top = -230
	phone.offset_bottom = 230
	phone_list = VBoxContainer.new()
	phone_list.add_theme_constant_override("separation", 10)
	phone.add_child(phone_list)
	phone.visible = false
	root.add_child(phone)
	# cartão de lugar/hora
	card_box = VBoxContainer.new()
	card_box.set_anchors_preset(Control.PRESET_CENTER)
	card_box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	card_box.grow_vertical = Control.GROW_DIRECTION_BOTH
	card_box.alignment = BoxContainer.ALIGNMENT_CENTER
	card_title = _label("", font_title, 70, Color("ece6d6"))
	card_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	card_sub = _label("", font_label, 17, Color("e8b10d"))
	card_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	card_box.add_child(card_title)
	card_box.add_child(card_sub)
	card_box.modulate.a = 0.0
	# faixa escura e macia por trás do título (lê bem sobre qualquer cena)
	card_bg = TextureRect.new()
	var gt_card := GradientTexture2D.new()
	var gr_card := Gradient.new()
	gr_card.offsets = PackedFloat32Array([0.0, 0.5, 1.0])
	gr_card.colors = PackedColorArray([Color(0, 0, 0, 0), Color(0, 0, 0, 0.78), Color(0, 0, 0, 0)])
	gt_card.gradient = gr_card
	gt_card.fill_from = Vector2(0, 0)
	gt_card.fill_to = Vector2(0, 1)
	gt_card.width = 4
	gt_card.height = 128
	card_bg.texture = gt_card
	card_bg.stretch_mode = TextureRect.STRETCH_SCALE
	card_bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	card_bg.anchor_left = 0.0
	card_bg.anchor_right = 1.0
	card_bg.anchor_top = 0.5
	card_bg.anchor_bottom = 0.5
	card_bg.offset_top = -120
	card_bg.offset_bottom = 120
	card_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card_bg.modulate.a = 0.0
	root.add_child(card_bg)
	root.add_child(card_box)
	# fim
	end_box = VBoxContainer.new()
	end_box.set_anchors_preset(Control.PRESET_CENTER)
	end_box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	end_box.grow_vertical = Control.GROW_DIRECTION_BOTH
	end_box.alignment = BoxContainer.ALIGNMENT_CENTER
	end_box.add_theme_constant_override("separation", 6)
	end_box.visible = false
	root.add_child(end_box)
	# escurecer
	fade = ColorRect.new()
	fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	fade.color = Color(0, 0, 0, 1)
	fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(fade)
	_build_pause()

func _build_pause() -> void:
	pause_panel = PanelContainer.new()
	pause_panel.add_theme_stylebox_override("panel", _panel_style(0.92))
	pause_panel.set_anchors_preset(Control.PRESET_CENTER)
	pause_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	pause_panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	vb.add_child(_label("Pausado", font_title, 60, Color("e8b10d")))
	for b in [["Continuar", "continue"], ["Recomeçar capítulo", "restart"], ["Pular capítulo", "skip"], ["Começar do início", "begin"], ["Modo Sobrevivência (ondas)", "ondas"]]:
		var btn := Button.new()
		btn.text = b[0]
		btn.add_theme_font_override("font", font_bold)
		btn.add_theme_font_size_override("font_size", 22)
		btn.custom_minimum_size = Vector2(320, 46)
		btn.pressed.connect(main.on_pause_button.bind(b[1]))
		vb.add_child(btn)
		pause_btns[b[1]] = btn
	pause_hint = _label("WASD/setas: andar · Shift: correr · Espaço: pular\nE: interagir/se soltar · F ou clique: golpear · Enter: pular fala", font_ui, 16, Color("b8b2a2"))
	vb.add_child(pause_hint)
	pause_panel.add_child(vb)
	pause_panel.visible = false
	root.add_child(pause_panel)

# ------------------------------------------------------------------ API usada pelo diretor
func _set_bars(k: float) -> void:
	for i in bars.size():
		var b := bars[i]
		var h := 86.0 * k
		if i == 0:
			b.offset_top = 0
			b.offset_bottom = h
		else:
			b.offset_top = -h
			b.offset_bottom = 0

func letterbox(on: bool, t := 0.8) -> void:
	var tw := create_tween()
	var from := bars[0].offset_bottom / 86.0
	tw.tween_method(_set_bars, from, 1.0 if on else 0.0, t)
	obj_box.modulate.a = 0.0 if on else 1.0

func fade_to(a: float, t := 1.0) -> void:
	var tw := create_tween()
	tw.tween_property(fade, "color:a", a, t)
	await tw.finished

func objective(text: String) -> void:
	obj_box.visible = text != ""
	obj_text.text = text
	if text != "":
		obj_box.modulate.a = 0.0
		create_tween().tween_property(obj_box, "modulate:a", 1.0, 0.5)

func set_hint(text: String) -> void:
	hint.text = text

func card(title: String, sub: String, hold := 2.6) -> void:
	card_title.text = title
	card_sub.text = sub.to_upper()
	# o título de cinema cabe sempre na tela (encolhe se for comprido)
	var tam := 70
	var larg: float = get_viewport().get_visible_rect().size.x - 120.0
	while tam > 36 and font_title.get_string_size(title, HORIZONTAL_ALIGNMENT_LEFT, -1, tam).x > larg:
		tam -= 4
	card_title.label_settings.font_size = tam
	var tw := create_tween()
	tw.tween_property(card_box, "modulate:a", 1.0, 0.8)
	tw.parallel().tween_property(card_bg, "modulate:a", 1.0, 0.8)
	tw.tween_interval(hold)
	tw.tween_property(card_box, "modulate:a", 0.0, 0.8)
	tw.parallel().tween_property(card_bg, "modulate:a", 0.0, 0.8)
	await tw.finished

func _face(id: String) -> Texture2D:
	if id == "":
		return null
	if not _faces.has(id):
		var a := AtlasTexture.new()
		a.atlas = load(FACES[id][0])
		a.region = FACES[id][1]
		_faces[id] = a
	return _faces[id]

## Mostra uma fala e espera (Enter pula).
func say(who: String, text: String, dur := -1.0) -> void:
	var sp: Dictionary = SPEAKERS.get(who, {"color": Color("c9c4b5"), "face": ""})
	sub_name.text = who.to_upper()
	sub_name.label_settings.font_color = sp.color
	sub_text.text = text
	var f := _face(sp.face)
	sub_face.texture = f
	sub_face.visible = f != null
	sub_panel.visible = true
	if dur < 0:
		dur = clamp(1.4 + text.length() * 0.055, 2.0, 6.0)
	# voz gravada (ElevenLabs): toca junto e a legenda espera a fala acabar
	if _vozes.has(text) and not main.auto:
		var st: AudioStream = load(_vozes[text])
		voz.stream = st
		voz.play()
		dur = max(dur * 0.6, st.get_length() + 0.35)
	if main.auto:
		dur = 0.25
	skip_line = false
	var t := 0.0
	while t < dur and not skip_line and is_inside_tree():
		await get_tree().process_frame
		if not get_tree().paused:
			t += get_process_delta_time()
	if skip_line:
		voz.stop()
	sub_panel.visible = false

func show_prompt(text: String) -> void:
	prompt.text = text

func show_phone(lines: Array) -> void:
	for c in phone_list.get_children():
		c.queue_free()
	phone_list.add_child(_label("18:02            ▮▮▯  12%", font_ui, 15, Color("9aa3ab")))
	for l in lines:
		var lb := _label(l[0], font_bold if l[1] else font_ui, 20 if l[1] else 18, Color("ff6b5b") if l[1] else Color("e8e6e0"))
		lb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lb.custom_minimum_size = Vector2(270, 0)
		phone_list.add_child(lb)
	phone.visible = true
	phone.modulate.a = 0
	create_tween().tween_property(phone, "modulate:a", 1.0, 0.4)

func hide_phone() -> void:
	var tw := create_tween()
	tw.tween_property(phone, "modulate:a", 0.0, 0.4)
	tw.tween_callback(func(): phone.visible = false)

func show_end(lines: Array) -> void:
	for c in end_box.get_children():
		c.queue_free()
	for l in lines:
		var lb := _label(l[0], font_title if l[2] else font_bold, l[1], l[3] if l.size() > 3 else Color("ece6d6"))
		lb.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		end_box.add_child(lb)
	end_box.visible = true
	end_box.modulate.a = 0
	create_tween().tween_property(end_box, "modulate:a", 1.0, 1.5)

func _unhandled_input(e: InputEvent) -> void:
	if e.is_action_pressed("pausa"):
		main.toggle_pause()
	elif e.is_action_pressed("pular_fala"):
		skip_line = true

func toggle_pause(on: bool) -> void:
	pause_panel.visible = on
	if on:
		pause_btns["continue"].grab_focus()

## Tela inicial (R50): escolher entre o prólogo e o modo Sobrevivência. Devolve "prologo" ou "ondas".
func menu_inicial(recorde: int) -> String:
	var pn := PanelContainer.new()
	pn.add_theme_stylebox_override("panel", _panel_style(0.86))
	pn.set_anchors_preset(Control.PRESET_CENTER_LEFT)
	pn.grow_vertical = Control.GROW_DIRECTION_BOTH
	pn.position.x = 70
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 12)
	vb.add_child(_label("PROJECT Z", font_title, 96, Color("e8b10d")))
	vb.add_child(_label("ZONA LESTE  ·  SÃO PAULO", font_label, 16, Color("b8b2a2")))
	vb.add_child(_label(" ", font_ui, 8))
	var primeiro: Button = null
	for b in [["Prólogo  ·  Dia Zero", "prologo", "A história do primeiro dia do surto"], ["Sobrevivência  ·  Ondas", "ondas", "Aguente as ondas na Av. dos Tecelões" + ("  ·  recorde: onda %d" % recorde if recorde > 0 else "")]]:
		var btn := Button.new()
		btn.text = b[0]
		btn.add_theme_font_override("font", font_bold)
		btn.add_theme_font_size_override("font_size", 26)
		btn.custom_minimum_size = Vector2(400, 54)
		btn.pressed.connect(func(): escolheu.emit(b[1]))
		vb.add_child(btn)
		vb.add_child(_label(b[2], font_ui, 15, Color("9a958a")))
		if primeiro == null:
			primeiro = btn
	pn.add_child(vb)
	root.add_child(pn)
	pn.modulate.a = 0.0
	create_tween().tween_property(pn, "modulate:a", 1.0, 0.8)
	primeiro.grab_focus()
	var id: String = await escolheu
	pn.queue_free()
	return id

# ------------------------------------------------------------------ desenho
func _process(delta: float) -> void:
	if cctv.visible:
		var seg := int(Time.get_ticks_msec() / 1000) % 60
		cctv_label.text = "CAM 02 · FRENTE      17:5%d:%02d      ● REC\nMORDIDOS %d   ·   LEVANTARAM %d" % [3 + int(Time.get_ticks_msec() / 60000) % 6, seg, main.mordidos, main.viraram]
	marker.queue_redraw()
	gauges.queue_redraw()
	var p: Sobrevivente = main.jogador
	if p and p.tem_coracao and p.bpm > 135 and p.vivo:
		var k: float = clamp((p.bpm - 135.0) / 45.0, 0.0, 1.0)
		red.color.a = k * (0.12 + 0.1 * sin(Time.get_ticks_msec() * 0.012 * (p.bpm / 80.0)))
	else:
		red.color.a = move_toward(red.color.a, 0.0, delta)
	if p and p.agarrado_por != null:
		struggle_box.visible = true
		struggle_bar.value = p.luta
	else:
		struggle_box.visible = false

func _draw_marker() -> void:
	if waypoint == null or main.cam == null or bars[0].offset_bottom > 10:
		return
	var w3: Vector3 = waypoint
	if main.cam.is_position_behind(w3):
		return
	var sp: Vector2 = main.cam.unproject_position(w3) / main.get_viewport().get_visible_rect().size * marker.size
	var size := marker.size
	var c := size * 0.5
	var inside := Rect2(Vector2(40, 40), size - Vector2(80, 80)).has_point(sp)
	var col := Color(1.0, 0.75, 0.1)
	var t := Time.get_ticks_msec() * 0.004
	if inside:
		var bob := sin(t) * 5
		var tip := sp + Vector2(0, -50 + bob)
		marker.draw_colored_polygon(PackedVector2Array([tip, tip + Vector2(-11, -18), tip + Vector2(11, -18)]), col)
		marker.draw_arc(sp, 22 + sin(t * 1.5) * 3, 0, TAU, 28, Color(col, 0.6), 2)
	else:
		var d := (sp - c).normalized()
		var edge: Vector2 = c + d * min((size.x * 0.5 - 50) / max(abs(d.x), 0.001), (size.y * 0.5 - 50) / max(abs(d.y), 0.001))
		var a := d.angle()
		var pts := PackedVector2Array([edge + Vector2.from_angle(a) * 20, edge + Vector2.from_angle(a + 2.5) * 16, edge + Vector2.from_angle(a - 2.5) * 16])
		marker.draw_colored_polygon(pts, col)

func _draw_gauges() -> void:
	var p: Sobrevivente = main.jogador
	if p == null or not p.controlado or bars[0].offset_bottom > 10 or not main.controle_livre:
		return
	var base := Vector2(30, gauges.size.y - 40)
	# fôlego
	gauges.draw_string(font_label, base + Vector2(0, -12), "FÔLEGO", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("c9c3b3"))
	gauges.draw_rect(Rect2(base, Vector2(200, 10)), Color(0, 0, 0, 0.55))
	gauges.draw_rect(Rect2(base, Vector2(200 * p.folego, 10)), Color("e8b10d") if p.folego > 0.25 else Color("d9533f"))
	if p.tem_coracao:
		var beat: float = abs(sin(Time.get_ticks_msec() * 0.001 * PI * p.bpm / 60.0))
		var hc := Color("e05a5a").lerp(Color(2, 0.4, 0.4), clamp((p.bpm - 110) / 60.0, 0, 1))
		var hp := base + Vector2(240, 4)
		gauges.draw_circle(hp, 9 + beat * 3, hc)
		gauges.draw_string(font_bold, hp + Vector2(20, 8), "%d bpm" % int(p.bpm), HORIZONTAL_ALIGNMENT_LEFT, -1, 22, hc)
		if p.bpm > 150:
			gauges.draw_string(font_ui, hp + Vector2(-8, -22), "coração disparado — pare de correr para acalmar", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("ffb3a8"))
