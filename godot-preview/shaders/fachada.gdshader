// Fachada de prédio paulistano: o atlas tem 8 materiais de parede (linhas) x 8 janelas (colunas).
// UV da malha em metros (x ao longo da parede, y a partir do chão). COLOR.r = térreo com lojas,
// COLOR.g = semente do prédio, COLOR.b = linha do material. À noite, parte das janelas acende.
// "fade" > 0 vaza o prédio em padrão de pontinhos quando o personagem passa atrás (regra do dono).
shader_type spatial;
render_mode cull_back;

global uniform float noite;
global uniform vec2 foco_tela;     // onde o personagem está na tela (pixels)
global uniform float raio_tela;    // raio do buraco de visão
uniform sampler2D atlas : source_color, filter_linear_mipmap, repeat_disable;
uniform sampler2D atlas_luz : filter_linear_mipmap, repeat_disable;
uniform sampler2D lojas : source_color, filter_linear_mipmap, repeat_disable;
uniform sampler2D lojas_luz : filter_linear_mipmap, repeat_disable;
uniform float andares = 4.0;
uniform float fade = 0.0;          // buraco de visão em volta do personagem (prédio na frente dele)
uniform float dentro = 0.0;        // o personagem está dentro: o prédio some
uniform float queimado = 0.0;
const float VAO = 4.0;
const float ANDAR = 3.0;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bayer4(vec2 p) {
	int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0));
	int i = x + y * 4;
	float m[16] = float[](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
	return (m[i] + 0.5) / 16.0;
}

void fragment() {
	if (dentro > 0.0 && bayer4(FRAGCOORD.xy) < dentro) { discard; }
	if (fade > 0.0) {
		float d = distance(FRAGCOORD.xy, foco_tela);
		float k = smoothstep(raio_tela, raio_tela * 0.55, d) * fade;
		if (bayer4(FRAGCOORD.xy) < k) { discard; }
	}
	float semente = COLOR.g * 97.0;
	float vao = floor(UV.x / VAO);
	float andar = floor(UV.y / ANDAR);
	vec2 l = vec2(fract(UV.x / VAO), 1.0 - fract(UV.y / ANDAR));
	float h = hash(vec2(vao, andar) + semente);
	vec3 cor;
	float luz = 0.0;
	if (UV.y >= andares * ANDAR) {
		// platibanda (acima do último andar): só parede
		vec2 a = (vec2(7.0, floor(COLOR.b * 7.99)) + vec2(0.85, 0.06)) / 8.0;
		cor = texture(atlas, a).rgb * 0.92;
	} else if (COLOR.r > 0.5 && andar < 0.5) {
		float loja = floor(hash(vec2(floor(UV.x / 5.0), semente)) * 7.99);
		vec2 ll = vec2(fract(UV.x / 5.0), l.y);
		vec2 a = (vec2(mod(loja, 4.0), floor(loja / 4.0)) + ll) / vec2(4.0, 2.0);
		cor = texture(lojas, a).rgb;
		luz = texture(lojas_luz, a).r * (0.5 + 0.5 * noite);
	} else {
		float col = floor(h * 7.99);
		if (col == 5.0 && h > 0.72) { col = 0.0; }   // poucas janelas quebradas
		vec2 a = (vec2(col, floor(COLOR.b * 7.99)) + l) / 8.0;
		cor = texture(atlas, a).rgb;
		float acesa = step(0.55, hash(vec2(vao * 3.1, andar * 7.7) + semente * 1.3));
		luz = texture(atlas_luz, a).r * acesa * noite;
	}
	cor = mix(cor, cor * vec3(0.18, 0.16, 0.15), queimado);
	ALBEDO = cor;
	ROUGHNESS = 0.92;
	EMISSION = vec3(1.0, 0.72, 0.42) * luz * 1.6 * (1.0 - queimado);
}
