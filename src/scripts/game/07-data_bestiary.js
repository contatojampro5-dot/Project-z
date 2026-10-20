// -- src/data/bestiary.js --

// Ficção do universo PROJECT Z. Atributos são os valores-base no modo Médio.
const entries=[
 ['normal','INFECTADO COMUM','CLASSE I · INFECTADO','zombie','Pessoas comuns atingidas nas primeiras horas do surto. O vírus consumiu suas funções superiores; resta um instinto simples e insistente: perseguir os vivos.','Lento e frágil individualmente, torna-se perigoso quando reúne uma horda.','Não fique parado entre vários infectados.'],
 ['runner','CORREDOR','CLASSE II · VELOCISTA','runner','Muitos foram atletas, corredores ou jovens de grande preparo físico. A mutação preservou seus reflexos e acelerou movimentos de forma descontrolada.','Avança rápido e tem pouca resistência.','Priorize os corredores antes que cerquem você.'],
 ['bomber','EXPLOSIVO','CLASSE III · INSTÁVEL','bomber','A infecção desencadeou o acúmulo de gases e fluidos sob a pele. A pressão interna transforma o corpo numa ameaça instável à menor aproximação.','Acende um alerta antes de explodir em área.','Afaste-se quando o corpo começar a pulsar.'],
 ['spitter','CUSPIDOR','CLASSE III · ARREMESSADOR','spitter','Alguns infectados sofreram deformações na garganta e nas glândulas. Eles expulsam secreções corrosivas contra presas que não conseguem alcançar.','Ataca à distância e tenta manter espaço.','Mova-se lateralmente e reduza a distância com cuidado.'],
 ['tank','TANQUE','CLASSE IV · FORTIFICADO','tank','O vírus engrossou fibras musculares e tecidos de antigos trabalhadores de grande porte. A mutação sacrificou velocidade em troca de uma resistência brutal.','Muito resistente e lento; pode bloquear passagens.','Contorne-o em vez de enfrentar a horda num corredor.'],
 ['summoner','INVOCADOR','CLASSE IV · PROPAGADOR','summoner','Uma mutação rara reorganizou o sistema nervoso do hospedeiro. Seus gritos e sinais químicos atraem infectados próximos, formando enxames ao seu redor.','Convoca reforços enquanto permanece à distância.','Elimine-o antes que a quantidade saia do controle.'],
 ['colossus','O COLOSSO','CHEFE · ANOMALIA DE MASSA','colossus','Observado em hospedeiros originalmente corpulentos ou expostos a cargas virais extremas. O crescimento anormal de massa e ossos produziu uma criatura colossal, de força devastadora.','Prepara investidas poderosas com aviso visual.','Observe a linha de investida, desvie e contra-ataque.'],
 ['hive','A COLMEIA','CHEFE · NÚCLEO DE CONTÁGIO','hive','O corpo infectado deixou de agir como indivíduo. Tornou-se um centro móvel de proliferação, capaz de coordenar hordas e espalhar novas mutações.','Invoca corredores e projéteis em padrões radiais.','Mantenha rotas abertas e não deixe as invocações cercarem você.'],
];
const BESTIARY=Object.freeze(Object.fromEntries(entries.map(([id,name,category,sprite,lore,behavior,tip])=>{
  const source=ENEMY_TYPES[id]||BOSS_TYPES[id];
  return [id,Object.freeze({id,name,category,sprite,lore,behavior,tip,hp:source.hp,damage:source.damage,speed:source.speed,xp:source.xp,boss:!!BOSS_TYPES[id]})];
})));
const BESTIARY_IDS=Object.freeze(Object.keys(BESTIARY));

