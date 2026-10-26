// Chão natural do morro e canteiros: mistura grama e terra pela cor do vértice (vermelho = terra).
shader_type spatial;
uniform sampler2D grama : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D terra : source_color, filter_linear_mipmap, repeat_enable;
uniform float escala = 0.12;
varying vec3 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec2 p = wpos.xz * escala;
	vec3 g = texture(grama, p).rgb;
	vec3 t = texture(terra, p * 1.3).rgb;
	ALBEDO = mix(g, t, clamp(COLOR.r, 0.0, 1.0)) * (0.85 + 0.15 * COLOR.g);
	ROUGHNESS = 1.0;
}
