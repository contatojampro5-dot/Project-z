extends Node3D
class_name Ambiente
## Céu, sol, neblina, cor de cinema e a passagem do pôr do sol para a noite (Hélio).
## hora: 0 = pôr do sol dourado (como na foto do Theo), 1 = noite.

var sol: DirectionalLight3D
var lua: DirectionalLight3D
var env: Environment
var ceu: ProceduralSkyMaterial
var hora := 0.0
var neblina := 1.0            # multiplicador da neblina (o final abre a vista da cidade)
static var noite := 0.0          # 0 = dia, 1 = noite (lido pelos postes, faróis e refletores)

func montar() -> Ambiente:
	ceu = ProceduralSkyMaterial.new()
	var sky := Sky.new()
	sky.sky_material = ceu
	env = Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 0.95
	env.tonemap_white = 6.0
	env.glow_enabled = true
	env.glow_intensity = 0.9
	env.glow_strength = 1.0
	env.glow_bloom = 0.06
	env.glow_hdr_threshold = 0.9
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT
	env.fog_enabled = true
	env.fog_mode = Environment.FOG_MODE_EXPONENTIAL
	env.fog_density = 0.0016
	env.fog_sky_affect = 0.25
	env.fog_aerial_perspective = 0.4
	env.adjustment_enabled = true
	env.adjustment_contrast = 1.14
	env.adjustment_saturation = 1.0
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sol = DirectionalLight3D.new()
	sol.shadow_enabled = true
	sol.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sol.directional_shadow_max_distance = 140.0
	sol.shadow_blur = 1.4
	add_child(sol)
	lua = DirectionalLight3D.new()
	lua.light_color = Color(0.55, 0.65, 0.95)
	lua.rotation_degrees = Vector3(-55, 150, 0)
	lua.light_energy = 0.0
	add_child(lua)
	aplicar(0.0)
	return self

func aplicar(h: float) -> void:
	hora = clamp(h, 0.0, 1.0)
	# sol baixo a oeste, descendo
	var alt: float = lerp(14.0, -6.0, hora)
	sol.rotation_degrees = Vector3(-alt, -78.0, 0)
	sol.light_color = Color(1.0, 0.74, 0.5).lerp(Color(0.95, 0.4, 0.28), hora)
	sol.light_energy = lerp(2.2, 0.0, smoothstep(0.0, 0.75, hora))
	lua.light_energy = lerp(0.0, 0.32, smoothstep(0.5, 1.0, hora))
	ceu.sky_top_color = Color(0.32, 0.36, 0.55).lerp(Color(0.03, 0.04, 0.1), hora)
	ceu.sky_horizon_color = Color(0.98, 0.62, 0.4).lerp(Color(0.32, 0.12, 0.12), hora)
	ceu.ground_horizon_color = Color(0.5, 0.42, 0.42).lerp(Color(0.1, 0.06, 0.06), hora)
	ceu.ground_bottom_color = Color(0.2, 0.17, 0.15).lerp(Color(0.02, 0.02, 0.03), hora)
	ceu.sun_angle_max = 18.0
	ceu.sky_energy_multiplier = lerp(1.0, 0.35, hora)
	env.ambient_light_color = Color(0.42, 0.48, 0.72).lerp(Color(0.3, 0.34, 0.56), hora)
	env.ambient_light_energy = lerp(0.75, 0.62, hora)
	env.fog_light_color = Color(0.62, 0.52, 0.55).lerp(Color(0.12, 0.09, 0.12), hora)
	env.fog_density = lerp(0.0016, 0.0022, hora) * neblina
	env.glow_intensity = lerp(0.8, 1.3, hora)
	noite = smoothstep(0.25, 0.8, hora)
	RenderingServer.global_shader_parameter_set("noite", noite)

func passar(para: float, tempo: float) -> void:
	var tw := create_tween()
	tw.tween_method(aplicar, hora, para, tempo)
