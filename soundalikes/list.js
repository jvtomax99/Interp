/* The Sound-Alikes list (SOUND_ALIKES): the Sound-Alikes screen and its
   drill (features/sound-alikes.js), global search and Home's tool tile read
   it by name. Loaded by a plain <script src> just before index.html's own
   script, so the name exists before any of the app's code runs. Plain data
   only: no code, and no names from index.html. docs/features/sound-alikes.md */

/* ---------- Sound-Alikes ---------- */

/* Words that sound the same, or nearly, and are spelled differently. On
 * paper they never get confused. Heard in a hallway they do, and the
 * interpreter has nothing but context to pick the meaning: "the ileum"
 * (bowel) and "the ilium" (hip bone) are the same sound.
 *
 * Fields:
 *   id         unique key
 *   lang       'en' heard in English, rendered in Spanish
 *              'es' heard in Spanish, rendered in English
 *   kind       'same' true homophones | 'near' close enough to be misheard
 *   tag        the specialty or area, for search
 *   words      every spelling in the set:
 *                w       the spelling
 *                means   what it means, in English
 *                say     the rendering in the other language
 *                line    one hospital sentence in the heard language
 *                lineTo  that sentence rendered
 *   note       why it matters, or where it is genuinely hard
 *   mw         Merriam-Webster Medical Dictionary entries behind the
 *              medical meanings (merriam-webster.com/medical/<entry>)
 *   rae        Diccionario de la lengua española entries (dle.rae.es/<entry>)
 *   esChecked  false until Jose (staff interpreter) has checked the Spanish.
 *              The card says so while it is false. Flip it per set.
 *
 * Each `line` contains its `w` exactly once, so the drill can blank it out.
 */
const SOUND_ALIKES = [
  /* ---- Heard in English: true homophones ---- */
  {
    id:'heel', lang:'en', kind:'same', tag:'Orthopedics / Wound care', esChecked:false,
    words:[
      { w:"heel", means:"the back of the foot", say:"el talón",
        line:"She has a pressure sore on her left heel.", lineTo:"Tiene una úlcera por presión en el talón izquierdo." },
      { w:"heal", means:"to get better, to close (a wound)", say:"cicatrizar, sanar",
        line:"The incision should heal in about two weeks.", lineTo:"La incisión debería cicatrizar en unas dos semanas." },
      { w:"he'll", means:"he will", say:"él va a (futuro)",
        line:"He'll need someone to drive him home.", lineTo:"Va a necesitar que alguien lo lleve a casa." },
    ],
    note:"Three spellings, one sound. In wound care heel and heal turn up in the same sentence.",
    mw:['heel','heal']
  },
  {
    id:'vein', lang:'en', kind:'same', tag:'Vascular / IV', esChecked:false,
    words:[
      { w:"vein", means:"a blood vessel that carries blood to the heart", say:"la vena",
        line:"The nurse could not find a good vein for the IV.", lineTo:"La enfermera no pudo encontrar una buena vena para el suero." },
      { w:"vain", means:"useless; or too proud of one's looks", say:"en vano, inútil",
        line:"All our efforts were in vain.", lineTo:"Todos nuestros esfuerzos fueron en vano." },
    ],
    note:"Vein is the one you will hear on the floor. Vain mostly turns up in \"in vain\", which a family member may use about a resuscitation.",
    mw:['vein']
  },
  {
    id:'ileum', lang:'en', kind:'same', tag:'GI / Orthopedics', esChecked:false,
    words:[
      { w:"ileum", means:"the last part of the small intestine", say:"el íleon",
        line:"The scan shows inflammation in the ileum.", lineTo:"La tomografía muestra inflamación en el íleon." },
      { w:"ilium", means:"the large upper bone of the pelvis", say:"el ilion (hueso ilíaco)",
        line:"The fracture runs through the ilium.", lineTo:"La fractura atraviesa el ilion." },
    ],
    note:"Identical in speech, and both live low in the abdomen. Only context tells you: Crohn's, bowel, obstruction point to the ileum; fracture, pelvis, bone graft to the ilium. If the doctor's context doesn't settle it, ask.",
    mw:['ileum','ilium']
  },
  {
    id:'mucus', lang:'en', kind:'same', tag:'Pulmonary / ENT', esChecked:false,
    words:[
      { w:"mucus", means:"the slimy fluid itself (noun)", say:"el moco, la mucosidad",
        line:"Are you coughing up any mucus?", lineTo:"¿Está expectorando moco?" },
      { w:"mucous", means:"producing or covered with mucus (adjective)", say:"mucoso, mucosa",
        line:"It irritates the mucous membranes of the nose.", lineTo:"Irrita las membranas mucosas de la nariz." },
    ],
    note:"One is the substance, the other describes tissue. Rendering \"mucous membrane\" as \"membrana de moco\" sounds wrong to a Spanish-speaking clinician.",
    mw:['mucus','mucous']
  },
  {
    id:'callus', lang:'en', kind:'same', tag:'Podiatry / Orthopedics', esChecked:false,
    words:[
      { w:"callus", means:"thickened skin; or new bone around a healing fracture", say:"el callo; el callo óseo",
        line:"The X-ray shows a callus forming around the break.", lineTo:"La radiografía muestra que se está formando un callo óseo alrededor de la fractura." },
      { w:"callous", means:"unfeeling, insensitive", say:"insensible, cruel",
        line:"My father felt the doctor was callous with him.", lineTo:"Mi padre sintió que el médico fue insensible con él." },
    ],
    note:"Callus has two medical meanings itself: the skin one and the bone one. Callous is a complaint about someone, and may come up in a grievance.",
    mw:['callus']
  },
  {
    id:'humerus', lang:'en', kind:'same', tag:'Orthopedics', esChecked:false,
    words:[
      { w:"humerus", means:"the bone of the upper arm", say:"el húmero",
        line:"She broke her humerus when she fell.", lineTo:"Se fracturó el húmero cuando se cayó." },
      { w:"humorous", means:"funny", say:"gracioso, chistoso",
        line:"He tries to keep it humorous so the kids stay calm.", lineTo:"Trata de mantenerlo gracioso para que los niños se queden tranquilos." },
    ],
    note:"Easy on paper, a real stumble at speed: the brain hears the everyday word first.",
    mw:['humerus']
  },
  {
    id:'pleural', lang:'en', kind:'same', tag:'Pulmonary', esChecked:false,
    words:[
      { w:"pleural", means:"of the pleura, the lining around the lungs", say:"pleural",
        line:"There is fluid in the pleural space.", lineTo:"Hay líquido en el espacio pleural." },
      { w:"plural", means:"more than one", say:"plural, varios",
        line:"Just to be clear, it was plural, more than one tumor.", lineTo:"Para que quede claro, eran varios, más de un tumor." },
    ],
    note:"Pleural effusion, pleural tap, pleural catheter: the medical one is far more frequent in a hospital.",
    mw:['pleural','pleura']
  },
  {
    id:'aural', lang:'en', kind:'same', tag:'ENT / Pharmacy', esChecked:false,
    words:[
      { w:"aural", means:"of the ear", say:"ótico, por el oído",
        line:"These are aural drops, they go in the ear.", lineTo:"Estas son gotas óticas, van en el oído." },
      { w:"oral", means:"by mouth", say:"oral, por la boca",
        line:"Take the oral antibiotic twice a day.", lineTo:"Tome el antibiótico oral dos veces al día." },
    ],
    note:"In many American accents these are the same sound, and both are routes for medicine. Ear drops by mouth is a medication error. Clinicians often say \"otic\" for this reason; if you hear aural/oral about a medicine, make sure which.",
    mw:['aural','oral','otic']
  },
  {
    id:'cord', lang:'en', kind:'same', tag:'Neurology / OB', esChecked:false,
    words:[
      { w:"cord", means:"spinal cord, umbilical cord, vocal cords", say:"la médula (espinal); el cordón (umbilical); las cuerdas (vocales)",
        line:"The MRI shows pressure on the spinal cord.", lineTo:"La resonancia muestra presión sobre la médula espinal." },
      { w:"chord", means:"musical notes played together", say:"el acorde",
        line:"He can still play every chord on his guitar.", lineTo:"Todavía puede tocar todos los acordes en su guitarra." },
    ],
    note:"The real trap is inside cord itself: spinal cord is médula, not cordón. Vocal cords are cuerdas vocales.",
    mw:['spinal cord','umbilical cord','vocal cord']
  },
  {
    id:'dye', lang:'en', kind:'same', tag:'Radiology', esChecked:false,
    words:[
      { w:"dye", means:"contrast for a scan", say:"el contraste, el medio de contraste",
        line:"We will inject a dye so the vessels show up.", lineTo:"Le vamos a inyectar un contraste para que se vean los vasos." },
      { w:"die", means:"to stop living", say:"morir",
        line:"Is my mother going to die?", lineTo:"¿Mi mamá se va a morir?" },
    ],
    note:"\"Dye\" before a scan heard as \"die\" frightens a patient for no reason. Radiology staff say dye and contrast interchangeably; render it as contraste.",
    mw:['dye','contrast medium']
  },
  {
    id:'site', lang:'en', kind:'same', tag:'Nursing / Surgery / Ophthalmology', esChecked:false,
    words:[
      { w:"site", means:"a place on the body (IV site, surgical site)", say:"el sitio, la zona",
        line:"Tell us if the IV site gets red or swollen.", lineTo:"Avísenos si el sitio del suero se pone rojo o hinchado." },
      { w:"sight", means:"vision, the ability to see", say:"la vista",
        line:"Diabetes can damage your sight.", lineTo:"La diabetes puede dañarle la vista." },
    ],
    note:"Both are clinical. \"Cite\" is a third spelling but rare in a patient room.",
    mw:['sight']
  },
  {
    id:'weak', lang:'en', kind:'same', tag:'Symptoms / Dosing', esChecked:false,
    words:[
      { w:"weak", means:"without strength", say:"débil",
        line:"I have felt weak since I started the new pill.", lineTo:"Me he sentido débil desde que empecé la pastilla nueva." },
      { w:"week", means:"seven days", say:"la semana",
        line:"Come back in one week to check the stitches.", lineTo:"Regrese en una semana para revisarle los puntos." },
    ],
    note:"Short, common, and both turn up in the same history: \"weak for a week\".",
    mw:[]
  },
  {
    id:'ate', lang:'en', kind:'same', tag:'Pre-op / NPO', esChecked:false,
    words:[
      { w:"ate", means:"past of eat", say:"comió",
        line:"What time was it when you last ate?", lineTo:"¿A qué hora comió por última vez?" },
      { w:"eight", means:"the number 8", say:"ocho",
        line:"Your surgery is at eight tomorrow morning.", lineTo:"Su cirugía es mañana a las ocho de la mañana." },
    ],
    note:"Before surgery, \"when you ate\" and \"at eight\" arrive in the same breath. Getting the time wrong cancels the case or risks aspiration.",
    mw:[]
  },
  {
    id:'four', lang:'en', kind:'same', tag:'Dosing', esChecked:false,
    words:[
      { w:"four", means:"the number 4", say:"cuatro",
        line:"Take one tablet every four hours.", lineTo:"Tome una tableta cada cuatro horas." },
      { w:"for", means:"preposition: for a time, for a reason", say:"por, durante, para",
        line:"Keep the dressing on for a day.", lineTo:"Déjese el vendaje puesto durante un día." },
    ],
    note:"\"Take it for four days\": both in one instruction. Dosing numbers deserve a check-back with the provider when there is any doubt.",
    mw:[]
  },
  {
    id:'gait', lang:'en', kind:'same', tag:'Neurology / PT', esChecked:false,
    words:[
      { w:"gait", means:"the way a person walks", say:"la marcha, la forma de caminar",
        line:"His gait has become slow and shuffling.", lineTo:"Su forma de caminar se ha vuelto lenta y arrastrando los pies." },
      { w:"gate", means:"a door in a fence or at an airport", say:"la puerta, el portón",
        line:"She fell by the gate in front of the house.", lineTo:"Se cayó junto al portón de la casa." },
    ],
    note:"Gait is a neurology and physical therapy word that patients rarely know. A gait exam is an \"examen de la marcha\".",
    mw:['gait']
  },
  {
    id:'hoarse', lang:'en', kind:'same', tag:'ENT', esChecked:false,
    words:[
      { w:"hoarse", means:"a rough, strained voice", say:"ronco, afónico",
        line:"Your voice may be hoarse after the breathing tube.", lineTo:"Es posible que tenga la voz ronca después del tubo para respirar." },
      { w:"horse", means:"the animal", say:"el caballo",
        line:"He was thrown off a horse last weekend.", lineTo:"Se cayó de un caballo el fin de semana pasado." },
    ],
    note:"Afónico is losing the voice entirely; ronco is rough. Pick by what the provider describes.",
    mw:['hoarse','hoarseness']
  },
  {
    id:'tic', lang:'en', kind:'same', tag:'Neurology / Infectious disease', esChecked:false,
    words:[
      { w:"tic", means:"a sudden repeated movement or sound", say:"el tic",
        line:"The tic in his eye gets worse when he is stressed.", lineTo:"El tic del ojo se le empeora cuando está estresado." },
      { w:"tick", means:"the small biting insect (Lyme disease)", say:"la garrapata",
        line:"Did you find a tick on your skin after the hike?", lineTo:"¿Encontró una garrapata en la piel después de la caminata?" },
    ],
    note:"A neurology word and a Lyme-disease word with one sound. Pediatrics hears both.",
    mw:['tic','tick']
  },
  {
    id:'muscle', lang:'en', kind:'same', tag:'Allergy / Orthopedics', esChecked:false,
    words:[
      { w:"muscle", means:"the tissue that moves the body", say:"el músculo",
        line:"I pulled a muscle in my back.", lineTo:"Me di un tirón en un músculo de la espalda." },
      { w:"mussel", means:"the shellfish", say:"el mejillón",
        line:"He is allergic to shrimp and mussel.", lineTo:"Es alérgico al camarón y al mejillón." },
    ],
    note:"An allergy history is where this matters: a shellfish allergy rendered as a muscle complaint is lost from the chart.",
    mw:['muscle']
  },
  {
    id:'dose', lang:'en', kind:'same', tag:'Pharmacy / Sleep', esChecked:false,
    words:[
      { w:"dose", means:"an amount of medicine", say:"la dosis",
        line:"We will lower the dose starting tonight.", lineTo:"Vamos a bajar la dosis a partir de esta noche." },
      { w:"doze", means:"to sleep lightly", say:"dormitar, quedarse dormido",
        line:"She tends to doze off after lunch.", lineTo:"Suele quedarse dormida después del almuerzo." },
    ],
    note:"Sedating medicines bring both words into one conversation: \"after this dose you may doze\".",
    mw:['dose']
  },
  {
    id:'patients', lang:'en', kind:'same', tag:'General', esChecked:false,
    words:[
      { w:"patients", means:"people being treated", say:"los pacientes",
        line:"The doctor has three patients before you.", lineTo:"El médico tiene tres pacientes antes que usted." },
      { w:"patience", means:"the ability to wait calmly", say:"la paciencia",
        line:"Thank you for your patience, the room is almost ready.", lineTo:"Gracias por su paciencia, la habitación está casi lista." },
    ],
    note:"Everyday, but you will hear both in every waiting room.",
    mw:[]
  },
  {
    id:'palate', lang:'en', kind:'same', tag:'ENT / Dental / Pediatrics', esChecked:false,
    words:[
      { w:"palate", means:"the roof of the mouth", say:"el paladar",
        line:"The baby was born with a cleft palate.", lineTo:"El bebé nació con paladar hendido." },
      { w:"palette", means:"a painter's board of colors", say:"la paleta",
        line:"She brought her paint palette to the playroom.", lineTo:"Trajo su paleta de pinturas a la sala de juegos." },
    ],
    note:"Pallet (a wooden platform) is a third spelling. Cleft palate is also called \"labio y paladar hendido\" when the lip is involved.",
    mw:['palate','cleft palate']
  },
  {
    id:'route', lang:'en', kind:'same', tag:'Pharmacy / Dental', esChecked:false,
    words:[
      { w:"route", means:"the way a medicine is given (IV, by mouth)", say:"la vía (de administración)",
        line:"We will switch the route from IV to by mouth.", lineTo:"Vamos a cambiar la vía de intravenosa a oral." },
      { w:"root", means:"the part of a tooth or nerve under the surface", say:"la raíz",
        line:"You need a root canal on that tooth.", lineTo:"Necesita un tratamiento de conducto en esa muela." },
    ],
    note:"Many American speakers say route like root (others say it like \"rout\"). A root canal is \"tratamiento de conducto\" or \"endodoncia\", not a literal \"canal de raíz\".",
    mw:['route','root canal']
  },
  {
    id:'discrete', lang:'en', kind:'same', tag:'Dermatology / Radiology', esChecked:false,
    words:[
      { w:"discrete", means:"separate, distinct (a lesion with clear edges)", say:"bien delimitado, separado",
        line:"There is a small discrete nodule in the right lung.", lineTo:"Hay un nódulo pequeño y bien delimitado en el pulmón derecho." },
      { w:"discreet", means:"careful not to draw attention", say:"discreto",
        line:"Please be discreet, my family doesn't know yet.", lineTo:"Por favor sea discreto, mi familia todavía no sabe." },
    ],
    note:"Discrete in a report is a description, not a feeling. \"Discreto\" in Spanish means discreet, and in medical Spanish also \"slight\" (una discreta mejoría), so the literal rendering of discrete misleads.",
    mw:['discrete']
  },
  {
    id:'elicit', lang:'en', kind:'same', tag:'Neurology / Behavioral health', esChecked:false,
    words:[
      { w:"elicit", means:"to bring out (a reflex, a response)", say:"provocar, obtener",
        line:"I am going to try to elicit a reflex in your knee.", lineTo:"Voy a tratar de provocarle un reflejo en la rodilla." },
      { w:"illicit", means:"illegal (drugs)", say:"ilícito, ilegal",
        line:"Do you use any illicit drugs?", lineTo:"¿Consume alguna droga ilícita?" },
    ],
    note:"In most accents the two are identical. The illicit-drugs question is routine at intake; a patient who mishears it as something else answers the wrong question.",
    mw:['elicit']
  },
  {
    id:'waist', lang:'en', kind:'same', tag:'General / GI', esChecked:false,
    words:[
      { w:"waist", means:"the middle of the body", say:"la cintura",
        line:"Undress from the waist up, please.", lineTo:"Desvístase de la cintura para arriba, por favor." },
      { w:"waste", means:"what the body gets rid of; or to throw away", say:"los desechos; desperdiciar",
        line:"The kidneys filter waste out of the blood.", lineTo:"Los riñones filtran los desechos de la sangre." },
    ],
    note:"\"From the waist down\" and \"body waste\" are both exam-room phrases.",
    mw:[]
  },
  {
    id:'bear', lang:'en', kind:'same', tag:'Orthopedics / PT', esChecked:false,
    words:[
      { w:"bear", means:"to carry, support (weight-bearing)", say:"apoyar (peso), soportar",
        line:"Do not bear weight on that leg for six weeks.", lineTo:"No apoye peso en esa pierna durante seis semanas." },
      { w:"bare", means:"uncovered, naked", say:"descubierto, sin nada",
        line:"Put the patch on bare, clean skin.", lineTo:"Póngase el parche sobre la piel limpia y descubierta." },
    ],
    note:"Weight-bearing orders (\"non-weight-bearing\", \"partial weight-bearing\") are some of the most important instructions in orthopedics. Render them as apoyar.",
    mw:['weight-bearing']
  },
  {
    id:'tract', lang:'en', kind:'same', tag:'Urology / GI', esChecked:false,
    words:[
      { w:"tract", means:"a system of organs (urinary tract, GI tract)", say:"las vías (urinarias), el tubo (digestivo)",
        line:"It looks like a urinary tract infection.", lineTo:"Parece una infección de las vías urinarias." },
      { w:"tracked", means:"followed, monitored", say:"dio seguimiento, registró",
        line:"We tracked her sugars for a week.", lineTo:"Le dimos seguimiento al azúcar durante una semana." },
    ],
    note:"Urinary tract is \"vías urinarias\", not \"tracto\", for most patients (tracto urinario is clinical register).",
    mw:['urinary tract','gastrointestinal tract']
  },

  /* ---- Heard in English: near sound-alikes ---- */
  {
    id:'prostate', lang:'en', kind:'near', tag:'Urology', esChecked:false,
    words:[
      { w:"prostate", means:"the gland below the bladder in men", say:"la próstata",
        line:"Your prostate is a little enlarged.", lineTo:"Tiene la próstata un poco agrandada." },
      { w:"prostrate", means:"lying face down; or overcome, exhausted", say:"postrado, tendido boca abajo",
        line:"He was found prostrate on the bathroom floor.", lineTo:"Lo encontraron tendido boca abajo en el piso del baño." },
    ],
    note:"Many speakers say \"prostrate\" when they mean the gland. Context almost always settles it; postrado in Spanish also means bedridden, so don't import it by accident.",
    mw:['prostate','prostrate']
  },
  {
    id:'perineal', lang:'en', kind:'near', tag:'OB / Orthopedics / Neurology', esChecked:false,
    words:[
      { w:"perineal", means:"of the perineum, between the genitals and the anus", say:"perineal",
        line:"You may have some perineal soreness after the delivery.", lineTo:"Es posible que tenga dolor en el perineo después del parto." },
      { w:"peroneal", means:"of the outer lower leg (the peroneal nerve, the fibula side)", say:"peroneo",
        line:"The peroneal nerve is why your foot drops.", lineTo:"El nervio peroneo es la causa de que se le caiga el pie." },
    ],
    note:"One letter apart and spoken fast. Nothing in common clinically: one is pelvic, the other is the outer leg (also called \"fibular\").",
    mw:['perineal','peroneal']
  },
  {
    id:'dysphagia', lang:'en', kind:'near', tag:'Neurology / Speech / Pathology', esChecked:false,
    words:[
      { w:"dysphagia", means:"difficulty swallowing", say:"disfagia, dificultad para tragar",
        line:"After the stroke she has dysphagia, so no thin liquids.", lineTo:"Después del derrame tiene dificultad para tragar, así que nada de líquidos ralos." },
      { w:"dysphasia", means:"difficulty with language (speaking or understanding)", say:"disfasia, dificultad para hablar o entender",
        line:"His dysphasia makes it hard for him to find words.", lineTo:"La disfasia le hace difícil encontrar las palabras." },
      { w:"dysplasia", means:"abnormal cells or development (often precancerous)", say:"displasia",
        line:"The biopsy showed mild dysplasia.", lineTo:"La biopsia mostró una displasia leve." },
    ],
    note:"All three come up after a stroke or in oncology, and the patient's family hears only \"dis-something\". Swallowing vs language decides the diet order. Say the plain-language version where the patient needs it.",
    mw:['dysphagia','dysphasia','dysplasia']
  },
  {
    id:'hypotension', lang:'en', kind:'near', tag:'Cardiology / ICU', esChecked:false,
    words:[
      { w:"hypotension", means:"low blood pressure", say:"hipotensión, presión baja",
        line:"The medicine can cause hypotension, so stand up slowly.", lineTo:"El medicamento puede causar presión baja, así que levántese despacio." },
      { w:"hypertension", means:"high blood pressure", say:"hipertensión, presión alta",
        line:"Your hypertension is well controlled now.", lineTo:"Su presión alta ya está bien controlada." },
    ],
    note:"Two letters apart, opposite meanings, opposite treatment. Mumbled or over a monitor alarm they are easy to swap. Render as presión baja / presión alta for a patient: it removes the trap.",
    mw:['hypotension','hypertension']
  },
  {
    id:'hypoglycemia', lang:'en', kind:'near', tag:'Endocrinology', esChecked:false,
    words:[
      { w:"hypoglycemia", means:"low blood sugar", say:"hipoglucemia, azúcar baja",
        line:"If you feel shaky and sweaty, it may be hypoglycemia.", lineTo:"Si se siente tembloroso y sudado, puede ser que tenga el azúcar baja." },
      { w:"hyperglycemia", means:"high blood sugar", say:"hiperglucemia, azúcar alta",
        line:"The steroids can cause hyperglycemia for a few days.", lineTo:"Los esteroides pueden subirle el azúcar por unos días." },
    ],
    note:"Same trap as hypo/hypertension, and the treatment is opposite: sugar for one, insulin for the other.",
    mw:['hypoglycemia','hyperglycemia']
  },
  {
    id:'ureter', lang:'en', kind:'near', tag:'Urology', esChecked:false,
    words:[
      { w:"ureter", means:"the tube from each kidney to the bladder", say:"el uréter",
        line:"The stone is stuck in the left ureter.", lineTo:"La piedra está atorada en el uréter izquierdo." },
      { w:"urethra", means:"the tube from the bladder to the outside", say:"la uretra",
        line:"The catheter goes through the urethra into the bladder.", lineTo:"La sonda pasa por la uretra hasta la vejiga." },
    ],
    note:"Doctors themselves swap these. The Spanish is close too (uréter / uretra), so the rendering carries the same risk: make the stress clear.",
    mw:['ureter','urethra']
  },
  {
    id:'abduction', lang:'en', kind:'near', tag:'Orthopedics / PT', esChecked:false,
    words:[
      { w:"abduction", means:"moving a limb away from the body", say:"abducción, separar del cuerpo",
        line:"Avoid abduction of the hip for now.", lineTo:"Por ahora evite separar la pierna del cuerpo." },
      { w:"adduction", means:"moving a limb toward the body", say:"aducción, acercar al cuerpo",
        line:"Adduction past the midline can dislocate the new hip.", lineTo:"Cruzar la pierna más allá del centro del cuerpo puede dislocar la cadera nueva." },
    ],
    note:"Hip precautions after surgery depend on which one. Clinicians often spell them out (\"A-B duction\"); in Spanish the plain description is safer than the technical word.",
    mw:['abduction','adduction']
  },
  {
    id:'fifteen', lang:'en', kind:'near', tag:'Dosing', esChecked:false,
    words:[
      { w:"fifteen", means:"15", say:"quince",
        line:"Take fifteen milligrams in the morning.", lineTo:"Tome quince miligramos por la mañana." },
      { w:"fifty", means:"50", say:"cincuenta",
        line:"Your heart rate was fifty when you were asleep.", lineTo:"Su ritmo cardíaco estaba en cincuenta cuando estaba dormido." },
    ],
    note:"Thirteen/thirty, fourteen/forty, sixteen/sixty and so on. A tenfold error in a dose. If there is any doubt, check back: \"one-five or five-zero?\"",
    mw:[]
  },
  {
    id:'lymph', lang:'en', kind:'near', tag:'Oncology / Orthopedics', esChecked:false,
    words:[
      { w:"lymph", means:"the fluid of the immune system (lymph node)", say:"linfa; ganglio linfático",
        line:"We will check the lymph nodes under your arm.", lineTo:"Vamos a revisar los ganglios linfáticos debajo del brazo." },
      { w:"limp", means:"walking unevenly", say:"cojear, cojera",
        line:"He has had a limp since the accident.", lineTo:"Cojea desde el accidente." },
    ],
    note:"Lymph node is \"ganglio\" for patients, not \"nodo\".",
    mw:['lymph','lymph node','limp']
  },
  {
    id:'affect', lang:'en', kind:'near', tag:'Behavioral health', esChecked:false,
    words:[
      { w:"affect", means:"(noun, psychiatry) the emotion a person shows", say:"el afecto, la expresión emocional",
        line:"The patient has a flat affect today.", lineTo:"El paciente tiene el afecto aplanado hoy." },
      { w:"effect", means:"a result (side effect)", say:"el efecto",
        line:"Drowsiness is a common side effect.", lineTo:"La somnolencia es un efecto secundario común." },
    ],
    note:"In psychiatry affect is a noun said with the stress first (AF-fect), which sounds like effect. \"Flat affect\" is an observation, not a side effect.",
    mw:['affect','side effect']
  },

  /* ---- Heard in Spanish ---- */
  {
    id:'vaso', lang:'es', kind:'same', tag:'Abdomen / Hematology', esChecked:false,
    words:[
      { w:"vaso", means:"a drinking glass; or a blood vessel", say:"glass; (blood) vessel",
        line:"Me tomé un vaso de agua antes del examen.", lineTo:"I drank a glass of water before the test." },
      { w:"bazo", means:"the spleen", say:"spleen",
        line:"El médico dice que tengo el bazo inflamado.", lineTo:"The doctor says my spleen is enlarged." },
    ],
    note:"B and v are the same sound in Spanish, and with seseo z sounds like s, so vaso and bazo are identical for almost every patient here. Vaso is also a blood vessel (vasos sanguíneos).",
    rae:['vaso','bazo'], mw:['spleen']
  },
  {
    id:'coser', lang:'es', kind:'same', tag:'Wound care / Nutrition', esChecked:false,
    words:[
      { w:"coser", means:"to sew, to stitch", say:"to stitch, to sew",
        line:"Me tuvieron que coser la herida.", lineTo:"They had to stitch the wound." },
      { w:"cocer", means:"to cook, to boil", say:"to cook, to boil",
        line:"Hay que cocer bien la carne.", lineTo:"The meat has to be cooked well." },
    ],
    note:"With seseo (all of Latin America, and the Canaries) these sound the same. Coser is far more likely in a hospital; patients more often say \"darme puntos\".",
    rae:['coser','cocer']
  },
  {
    id:'tubo', lang:'es', kind:'same', tag:'General', esChecked:false,
    words:[
      { w:"tubo", means:"a tube", say:"tube",
        line:"Le pusieron un tubo para respirar.", lineTo:"They put a breathing tube in." },
      { w:"tuvo", means:"had (past of tener)", say:"had",
        line:"Mi papá tuvo un infarto el año pasado.", lineTo:"My father had a heart attack last year." },
    ],
    note:"B and v are one sound, so these are identical. Grammar usually settles it at once, but at speed in a family history the brain can grab the wrong one.",
    rae:['tubo','tener']
  },
  {
    id:'sien', lang:'es', kind:'same', tag:'Neurology / Headache', esChecked:false,
    words:[
      { w:"sien", means:"the temple (side of the head)", say:"temple",
        line:"Me duele la sien del lado derecho.", lineTo:"My right temple hurts." },
      { w:"cien", means:"one hundred", say:"one hundred",
        line:"Tenía la presión en cien.", lineTo:"My blood pressure was at one hundred." },
    ],
    note:"With seseo these are the same sound. Headache histories and vital signs put both in one conversation.",
    rae:['sien','cien'], mw:['temple']
  },
  {
    id:'taza', lang:'es', kind:'same', tag:'Dosing / Nutrition', esChecked:false,
    words:[
      { w:"taza", means:"a cup", say:"cup",
        line:"Le doy media taza de leche en la noche.", lineTo:"I give him half a cup of milk at night." },
      { w:"tasa", means:"a rate", say:"rate",
        line:"La tasa de filtración de los riñones está baja.", lineTo:"The kidney filtration rate is low." },
    ],
    note:"With seseo these are identical. A cup is a measure a parent uses for formula or medicine; tasa is the provider's word (filtration rate, heart rate is usually frecuencia).",
    rae:['taza','tasa'], mw:['glomerular filtration rate']
  },
  {
    id:'hierba', lang:'es', kind:'same', tag:'Pharmacy / Home remedies', esChecked:false,
    words:[
      { w:"hierba", means:"an herb, a plant (herbal tea, remedy)", say:"herb",
        line:"Le estoy dando una hierba para los nervios.", lineTo:"I am giving him an herb for his nerves." },
      { w:"hierva", means:"(that it) boils: from hervir", say:"boil",
        line:"Espere a que hierva el agua para preparar el biberón.", lineTo:"Wait for the water to boil to make the bottle." },
    ],
    note:"Herbal remedies matter for drug interactions, so ask which herb. B and v are one sound, so only grammar separates these.",
    rae:['hierba','hervir']
  },
  {
    id:'vello', lang:'es', kind:'same', tag:'Dermatology / Endocrinology', esChecked:false,
    words:[
      { w:"vello", means:"fine body hair", say:"body hair",
        line:"Me está saliendo mucho vello en la cara.", lineTo:"I am growing a lot of hair on my face." },
      { w:"bello", means:"beautiful", say:"beautiful",
        line:"Es un bebé muy bello.", lineTo:"He is a very beautiful baby." },
    ],
    note:"New facial or body hair in a woman is a symptom (endocrinology). Hearing a compliment instead loses it.",
    rae:['vello','bello'], mw:['hirsutism']
  },
  {
    id:'ingerir', lang:'es', kind:'same', tag:'Toxicology / Pharmacy', esChecked:false,
    words:[
      { w:"ingirió", means:"swallowed, ingested (from ingerir)", say:"swallowed, ingested",
        line:"El niño ingirió unas pastillas de la abuela.", lineTo:"The child swallowed some of his grandmother's pills." },
      { w:"injirió", means:"interfered (from injerir, rare)", say:"interfered",
        line:"Ella no se injirió en la decisión.", lineTo:"She did not interfere in the decision." },
    ],
    note:"G before i or e and j are one sound. Injerir is rare in speech; the point is to recognise ingerir in a poisoning call and render it as swallowed.",
    rae:['ingerir','injerir'], mw:['ingest']
  },
];
