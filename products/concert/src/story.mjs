export const CAST = {
  nora: {name:'Nora', role:'Coautora · l’altra meitat de la cançó', image:'nora-guarded', listening:'nora-listening'},
  lia: {name:'Lia', role:'Cantant · a un pas d’estrenar-se sola', image:'lia-guarded', listening:'lia-receptive'},
  bruno: {name:'Bruno', role:'Producció · el directe no espera', image:'bruno', listening:'bruno'}
};
export const OPENING = [
  {who:'',text:'Cinc minuts abans de tancar el directe.',cue:'Els aplaudiments travessen la cortina. Nora deixa el micròfon damunt d’un flight case.'},
  {who:'bruno',text:'Hem anat llargs. Antena ens deixa quatre minuts: el single o la vostra cançó. Totes dues, no.'},
  {who:'nora',text:'Doncs el single. Jo no surto.'},
  {who:'lia',text:'No em facis això ara. Havíem de parlar després.'},
  {who:'nora',text:'Després de què? De la cançó o de la gira que ja tens preparada?',cue:'Lia mira el programa plegat que Nora duu a la mà.'},
  {who:'bruno',text:'Tu portes el programa. Jo necessito saber qui puja. No puc fer-los dir que sí.'}
];
export const NODES = {
 N0:{who:'nora',line:'Si canto amb ella, demà tothom dirà que no passa res. I sí que passa.',choices:[
  ['meaning','Què no vols que el públic entengui?','Que em quedo. No vull fer una última cançó que sembli una promesa de totes les següents.','N1',['boundary']],
  ['sheet','Què has vist al programa?','“Lia. Gira en solitari.” Jo encara esperava que decidíssim juntes què faríem. Em va dir: “Després del concert decidim què fem amb nosaltres.”','N2',['phrase']],
  ['goodbye','Si fos un comiat de veritat, voldries cantar?','Potser. Però un comiat no és cantar i tornar a esperar al camerino.','N1',['boundary']]]},
 N1:{who:'nora',line:'Puc fer una última cançó. No puc continuar fent veure que encara no hem decidit res.',choices:[
  ['terms','Quines condicions vols que li traslladi?','Que se’n va una sòcia, no una substituta enfadada. La cançó també és meva. I que no anunciï que continuem. Això sí que li pots dir.','N3',['offer']],
  ['private','Ho vols dir davant de tothom?','Si ella ho reconeix en privat i no ven una reconciliació, potser no cal fer-ho aquesta nit. Però demà hem de revisar juntes què expliquem.','N3',['private']],
  ['promise','Et prometo que tornarà a parlar de fer la gira juntes.','Si de veritat ho tornarà a considerar, escoltaré la proposta. Però no em facis pujar per tornar-me a dir que ja estava decidit.','N3',['promise']]]},
 N2:{who:'nora',line:'Jo hi vaig sentir una porta oberta.',choices:[
  ['residency','Què vas deixar pendent esperant aquesta conversa?','Una residència. Vaig deixar passar la data. Ella sabia que me l’havien ofert; no li vaig dir que l’havia rebutjada.','N2b',['residency']],
  ['departure','Què necessites decidir avui, encara que no cantis?','Que deixo el projecte. Que aquesta vegada “després” no sigui una altra manera de dir-me que esperi.','N1',['boundary']],
  ['respect','Puc defensar això sense entrar en res personal.','Sí. No necessites explicar la meva vida per respectar el que t’estic demanant.','N1',[]]]},
 N2b:{who:'nora',line:'I no esperava només una gira.',choices:[
  ['kiss','Si vols explicar-m’ho, t’escolto.','Ens vam fer un petó. Fa dos anys. Per mi no va acabar allà. Per ella… no ho sé. Això es queda aquí, si us plau.','N1',['kiss']],
  ['enough','No cal que m’expliquis més per prendre’t seriosament.','Gràcies. Comença per no prometre’m una altra espera.','N1',[]]]},
 N3:{who:'nora',line:'Vull saber què s’està proposant de veritat abans de tornar a agafar aquest micròfon.',choices:[
  ['relay','Li trasllado només les teves condicions professionals.','D’acord. Una última cançó. No un sí a continuar.','hub',['relay'],'offer'],
  ['hear','Primer vull escoltar què proposa ella.','D’acord. Però no li diguis que he acceptat.','hub',[]],
  ['repair','He promès massa sobre la gira. No ho puc garantir.','Llavors retira-ho. Si canto, vull que s’entengui que és un comiat. No vull tornar a sortir d’aquí amb dues versions.','hub',['repair'],'promise'] ]},
 L0:{who:'lia',line:'Fa mesos que preparo aquest single. Però si surto sola ara, semblarà que l’he esborrada. Si no surto, sembla que no pugui existir sense ella.',choices:[
  ['chronology','Ja havies decidit la gira quan vau parlar?','Vaig autoritzar que la preparessin. Abans, sí. Volia explicar-l’hi després del concert. Vaig dir “nosaltres” perquè no sabia com dir “jo”.','L1',['date','phrase','acknowledgement']],
  ['cost','Què perds si avui no estrenes el single?','Aquest directe. La banda, la premsa, l’estrena junts. La cançó no desapareix demà. Però aquest moment sí.','L1',['cost']],
  ['keep','Què vols conservar d’ella?','La manera com em mira abans de començar. Sap quan no arribo a una nota. Però no li puc oferir que tot continuï igual.','L1',['dependence']]]},
 L1:{who:'lia',line:'No sé com deixar-la marxar sense fer veure que no m’importa.',choices:[
  ['listen','Escoltaré què estaria disposada a fer ella.','Fes-ho. Però no li prometis una gira que no estic oferint.','hub',[]],
  ['relay_lia','Nora ofereix una última cançó, sense continuar.','Una última? Jo creia que només cantaria si aturava la gira. D’acord. Aleshores hem de parlar de què diríem.','hub',['relay'],'offer'],
  ['plan','Vull preparar un pla amb tu.','Vine. Digues què em proposes, sabent què deixem fora.','brief',[]]]},
 B0:{who:'bruno',line:'Repertori, qui canta i què diem abans. Amb això puc treballar.',choices:[
  ['date','Quan es va autoritzar la gira?','Fa tres dies. Mira l’hora d’aquesta ordre de preparació. Jo no era a la conversa que van tenir després.','B1',['date']],
  ['encore','Poden cantar fora d’antena?','El recinte ens deixa una cançó curta després. El públic d’aquí la veuria. El de casa, no. I necessito el sí de totes dues.','B1',['encore']],
  ['ready','Mantén les dues entrades preparades.','Preparades, sí. En antena només n’entrarà una.','hub',[]]]},
 B1:{who:'bruno',line:'Jo mantinc les dues entrades. Tu necessites un acord.',choices:[
  ['contrast','Vull contrastar l’ordre de la gira amb Lia.','Parla amb ella. L’ordre no explica tota la conversa.','C1',[],'contradiction'],
  ['done','Ja tinc prou per proposar un tancament.','Quan estigui acceptat, em dones entrada.','hub',[]]]},
 C1:{who:'lia',line:'Que encara estava obert. Ho sé. No li vaig dir una cosa que podia haver-li dit. Però tampoc li puc oferir ara una vida que no vull.',choices:[
  ['own','Això sí que pots assumir-ho davant seu.','Sí. Sense prometre-li el contrari demà.','hub',['acknowledgement']],
  ['tonight','Ara necessitem decidir què pots oferir aquesta nit.','Parlem-ne.','brief',['acknowledgement']]]},
 C2:{who:'nora',line:'Necessito sentir-l’hi dir a ella. Però això sí que és diferent de demanar-me que no espatlli el concert.',choices:[
  ['include','Ho inclouré en el que li proposi.','Vull sentir un final clar, no una altra cosa que depengui de demà.','N1',['ackRelayed']],
  ['norescue','No et demanaré que surtis per arreglar-li la nit.','Puc voler cantar per mi, també. No em treguis aquesta possibilitat.','N1',['ackRelayed']]]}
};
export const FACTS = {
 boundary:['Una última cançó no pot prometre continuïtat.','Nora'],
 offer:['Nora permet traslladar les seves condicions professionals: comiat, autoria i cap promesa de continuar.','Nora · oferta condicionada'],
 phrase:['“Després del concert decidim què fem amb nosaltres.”','Conversa sobre el futur'],
 date:['La gira en solitari es va autoritzar fa tres dies, abans d’aquella conversa.','Ordre de preparació / Lia'],
 residency:['Nora va deixar passar una residència esperant la conversa. Lia no sap que l’ha rebutjada.','Nora · conversa privada'],
 kiss:['Un petó fa dos anys. Nora encara hi veu una possibilitat. T’ha demanat confidencialitat.','Nora · confidencial'],
 private:['Nora consideraria separar-se en privat, si demà revisen juntes què expliquen.','Nora · condició'],
 cost:['El single perdria aquesta estrena televisada. La cançó seguiria existint demà.','Lia'],
 dependence:['Lia vol conservar la complicitat musical, però no pot oferir continuar igual.','Lia'],
 encore:['Un bis fora d’antena és possible si totes dues ho accepten. A casa no es veuria.','Bruno'],
 acknowledgement:['Lia reconeix haver deixat una porta oberta quan ja preparava la gira sola.','Lia']
};
export const PROGRAMS = {
 solo:{title:'El single de Lia',short:'Single en solitari',cost:'El comiat compartit queda fora del directe.',intro:'Avui començo una etapa diferent. Gràcies, Nora, per les cançons que hem fet possibles.',terms:['Lia actua sola i estrena el single.','Agraïment real a Nora com a coautora.','Cap excusa, suport o reconciliació atribuïda a Nora.'],image:'ending-solo'},
 public:{title:'Un comiat juntes',short:'Duet de comiat',cost:'El single perd l’estrena d’avui. La separació es fa pública.',intro:'Aquesta és la primera cançó que vam escriure juntes. Avui tanquem aquesta etapa. Gràcies, Nora.',terms:['La cançó compartida ocupa els quatre minuts.','Comiat professional públic, sense detalls íntims.','Autoria reconeguda i cap promesa de continuar.'],image:'ending-duet'},
 private:{title:'La cançó, sense anunciar el final',short:'Duet · separació en privat',cost:'El single queda fora. El públic no sabrà la separació fins demà.',intro:'Aquesta cançó la vam escriure juntes. Nora, és tan teva com meva.',terms:['Lia reconeix ara, en privat, que Nora deixa el projecte.','Introducció neutral i verídica; cap promesa de continuar.','Demà revisaran juntes el comunicat abans de publicar-lo.'],image:'ending-duet'}
};
