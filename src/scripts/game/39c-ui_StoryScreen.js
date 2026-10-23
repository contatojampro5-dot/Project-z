// R33c · Calíope — tela HISTÓRIA do menu. Texto tirado de docs/historia.md (cânone do Theo);
// só entram fatos definidos. Modo história, cutscenes e o resto da trama chegam depois.
const PZ_STORY_CHAPTERS=Object.freeze([
  ['ANTES','Duas irmãs',"Hadassa e Hanna perderam os pais num acidente de carro quando ainda eram crianças. Passaram por um pequeno lar de acolhimento até serem adotadas juntas por uma família do interior de São Paulo. Hanna crescia arteira, curiosa e inventiva; Hadassa cuidava dela e a protegia."],
  ['ANTES','A cidade grande',"Já adultas, as duas se mudam para a capital. Hadassa, 26 anos, vira enfermeira. Hanna, 21, termina a faculdade de química e física. Antônio, ex-sargento bombeiro afastado por uma arritmia no coração, abre um mercado perto da faculdade — e Hadassa, que estudou com ele, vira freguesa. Ele nunca teve coragem de chamá-la para sair."],
  ['RUMORES','Depois da pandemia',"A vida parecia ter voltado ao normal. Mas circulavam boatos: uma doença incubada, mutações, falhas em tratamentos feitos às pressas. Ninguém sabia o que era verdade. Até hoje ninguém sabe."],
  ['O DIA','A apresentação do TCC',"Hanna chega para apresentar o TCC, mas os professores não aparecem. Os dois colegas de grupo recebem ligações desesperadas — alguém da família passando mal — e vão embora. O celular dela está sem bateria. Quando liga o carregador, vê as chamadas perdidas de Hadassa. Então vem o estrondo: lá fora, carros batidos, gente correndo em todas as direções e ninguém entendendo nada."],
  ['O DIA','O mercado',"No depósito, Antônio olha as câmeras e vê infectados atacando suas duas funcionárias. Escondido, controlando a respiração, assiste às duas se levantarem já transformadas. Ele baixa o portão, sobe para olhar a rua e vê a cidade desabando: batidas, explosões, multidões fugindo."],
  ['O DIA','O primeiro corredor',"Do alto, Antônio avista Hadassa correndo direto para um grupo de infectados, procurando a irmã. Com medo e com o coração no limite, ele desce. Um infectado rápido demais vem atrás dela; Antônio grita para ela correr e enfrenta a criatura até ela parar de se mover."],
  ['A FUGA','Para longe da cidade',"As irmãs se desencontram no caos. Cercados, Antônio e Hadassa são forçados a subir a montanha. O caminho leva à fazenda do Seu João, o primeiro refúgio — e à missão de encontrar outros sobreviventes e levá-los para lá."]
]);
const PZ_STORY_PEOPLE=Object.freeze([
  ['antonio','27 anos · ex-bombeiro',"Dono de um mercado perto da faculdade. Nervoso, engraçado e com o coração fraco — mas, quando alguém precisa, ele vai."],
  ['hadassa','26 anos · enfermeira',"A irmã mais velha. Sempre protegeu Hanna. Estava terminando o plantão no hospital quando tudo desmoronou."],
  ['hanna','21 anos · química e física',"Gênio desde criança, cria dispositivos improvisados. O pai serviu ao Exército; o TCC dela era sobre defesa e tecnologia."],
  ['san','21 anos · ex-lutador',"Brincalhão, questiona as medalhas e a vida. A história dele ainda vai ser contada."]
]);
function pzStoryMarkup(){
  const people=PZ_STORY_PEOPLE.map(([id,role,text])=>{
    const c=CRONOS_CHARACTERS.find(x=>x.id===id);if(!c)return '';
    const art=PZ_CHAR_ART[id]?`<img src="${PZ_CHAR_ART[id]}" alt="" decoding="async" draggable="false">`:pzCharFigure(c,'bust','-st');
    return `<div class="pz-story-person" style="--char-color:${c.tint}"><div class="pz-story-face" aria-hidden="true">${art}</div><div><b>${c.name}</b><small>${role}</small><p>${text}</p></div></div>`;
  }).join('');
  const chapters=PZ_STORY_CHAPTERS.map(([era,title,text],i)=>`<li class="pz-story-chapter"><span class="pz-story-num">${String(i+1).padStart(2,'0')}</span><div><small>${era}</small><h3>${title}</h3><p>${text}</p></div></li>`).join('');
  return `<div class="pz-story"><span class="modal-kicker">PROJECT Z / HISTÓRIA</span><h2>HISTÓRIA<span>.</span></h2>
    <p class="pz-story-lead">Zona Leste de São Paulo. Num dia comum, as pessoas mais velhas começam a passar mal. Em poucas horas, a cidade inteira para de fazer sentido.</p>
    <section class="pz-story-block"><span class="pz-story-label">SOBREVIVENTES</span><div class="pz-story-people">${people}</div></section>
    <section class="pz-story-block"><span class="pz-story-label">CRONOLOGIA</span><ol class="pz-story-timeline">${chapters}</ol></section>
    <section class="pz-story-block pz-story-origin"><span class="pz-story-label">A ORIGEM</span><p>Ninguém sabe de onde veio. Uns não acreditam na ameaça, outros falam de um vírus que ficou adormecido depois da pandemia, outros culpam uma vacina feita às pressas. Nem todo mundo reage igual: há quem resista e há quem sofra mutações — como os <b>corredores</b> e os <b>inchados</b>.</p></section>
    <p class="pz-story-foot">O modo história completo, com cutscenes, chega em atualizações futuras.</p></div>`;
}
