// Pessoa (sprite em 8 direções) dentro do mundo 3D. O quadro vira de frente para a câmera com o
// pé preso no chão (os sprites foram desenhados vistos de cima a ~36°, igual à câmera do jogo).
// Os parâmetros são por instância: cem pessoas na tela dividem o mesmo material.
shader_type spatial;
render_mode cull_disabled, depth_draw_opaque;

uniform sampler2D folha : source_color, filter_linear_mipmap, repeat_disable;
instance uniform vec4 regiao = vec4(0.0, 0.0, 0.125, 0.125);   // x, y, largura, altura em UV
instance uniform float clarao = 0.0;
instance uniform float escurecer = 0.0;
instance uniform float infeccao = 0.0;     // 0..1: a pele vai ficando cinza-esverdeada e as veias escurecem
global uniform float noite;

void vertex() {
	// billboard com o pé (origem) no chão
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
	MODELVIEW_NORMAL_MATRIX = mat3(MODELVIEW_MATRIX);
}

void fragment() {
	vec4 c = texture(folha, regiao.xy + UV * regiao.zw);
	if (c.a < 0.5) { discard; }
	vec3 cor = c.rgb * (1.0 - escurecer);
	if (infeccao > 0.0) {
		float l = dot(cor, vec3(0.3, 0.59, 0.11));
		vec3 doente = vec3(l * 0.78, l * 0.92, l * 0.72);
		cor = mix(cor, doente, infeccao * 0.85);
	}
	ALBEDO = mix(cor, vec3(1.0), clarao);
	ROUGHNESS = 1.0;
	SPECULAR = 0.05;
	// luz própria fraquinha: o personagem não some no escuro (leitura de jogo)
	EMISSION = cor * (0.12 + 0.10 * noite);
}
