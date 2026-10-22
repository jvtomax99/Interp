/* The False Friends list (FALSE_FRIENDS, 101 entries): the False Friends
   screen and its drill, Term Review, the Daily Drill's traps, appointment
   prep, the memory trainer, global search, Ask the Hub and Home's tool
   tile all read it by name. It was in index.html until 2026-10-22
   (docs/split-index.md, phase 2). Loaded by a plain <script src> just
   before index.html's own script, so the name exists before any of the
   app's code runs. Plain data only: no code, and no names from index.html. */

/* ---------- False Friends (falsos amigos) ---------- */

/* Words that look like an English word and mean something else.
 *
 * In ordinary conversation a false friend is embarrassing. In a hospital it
 * changes care. "Constipado" read as "constipated" sends a patient with a
 * head cold toward a bowel workup. "Intoxicado" read as "intoxicated" puts
 * an accidental poisoning in the chart as drunkenness. Those are the two
 * that interpreters are warned about on day one and still hear misread on
 * the floor, which is why this list starts with them.
 *
 * Fields:
 *   es     the Spanish word as the patient says it
 *   looks  the English word it is pretending to be
 *   means  what it actually means
 *   say    how you would really say the English word in Spanish
 *   risk   'critical' changes clinical care | 'high' shifts meaning
 *          materially | 'everyday' general vocabulary
 *   heard  a line the way a patient would say it
 *   trap   the wrong rendering, written out so it can be recognised
 *   truth  the correct rendering
 *   note   regional variation, register, or the reason it is genuinely hard
 *
 * On regional variation: this list says "ask" rather than inventing a rule
 * where usage is genuinely split. Patients here are largely Dominican,
 * Puerto Rican, Colombian, Ecuadorian and Mexican, and several of these
 * words do not travel identically across those countries.
 */
const FALSE_FRIENDS = [
  {
    es:"constipado", looks:"constipated", means:"congested — blocked up with a head cold",
    say:"estreñido", risk:"critical", tag:"ENT / GI",
    heard:"Llevo tres días constipado.",
    trap:"I have been constipated for three days.",
    truth:"I have had a stuffy nose for three days.",
    note:"The one most likely to send a patient toward the wrong workup. Usage is genuinely split: in Spain and much of Latin America it is nasal congestion, but some speakers do use constipación for the bowel sense. If context does not settle it, ask — do not pick."
  },
  {
    es:"intoxicado", looks:"intoxicated", means:"poisoned — usually food, a chemical, or a medication",
    say:"ebrio, borracho", risk:"critical", tag:"Toxicology",
    heard:"Mi hijo está intoxicado, comió algo malo.",
    trap:"My son is intoxicated, he ate something bad.",
    truth:"My son has food poisoning, he ate something bad.",
    note:"English intoxicated is read as drunk almost every time. Spanish intoxicado means poisoned by something. Rendering it as drunk puts the wrong cause in the chart and can delay a toxicology workup."
  },
  {
    es:"embarazada", looks:"embarrassed", means:"pregnant",
    say:"avergonzada, apenada", risk:"critical", tag:"OB",
    heard:"Estoy embarazada.",
    trap:"I am embarrassed.",
    truth:"I am pregnant.",
    note:"The textbook example, and still worth drilling: it decides imaging, medication and triage. Note apenada is the usual word for embarrassed across the Caribbean."
  },
  {
    es:"molestia", looks:"molestation", means:"discomfort, a bother, a mild ache",
    say:"abuso sexual", risk:"critical", tag:"Symptoms",
    heard:"Siento una molestia en el pecho.",
    trap:"I feel molested in my chest.",
    truth:"I feel some discomfort in my chest.",
    note:"Molestia is one of the most common symptom words in Spanish and almost always means mild discomfort. Reaching for the English cognate here creates a safeguarding allegation out of nothing."
  },
  {
    es:"once", looks:"once (one time)", means:"eleven",
    say:"una vez", risk:"critical", tag:"Dosing",
    heard:"Me dijeron que tome once pastillas.",
    trap:"They told me to take the pills once.",
    truth:"They told me to take eleven pills.",
    note:"A dosing error hiding inside a two-syllable word. Worth reading back any number you hear in a medication instruction, in both languages."
  },
  {
    es:"preservativo", looks:"preservative", means:"condom",
    say:"conservante", risk:"critical", tag:"Sexual health",
    heard:"No usamos preservativo.",
    trap:"We do not use preservatives.",
    truth:"We do not use condoms.",
    note:"Turns a sexual-history answer into a diet answer. Condón is also widely understood and is the more common word in Mexico and the Caribbean."
  },
  {
    es:"droga", looks:"drug (medication)", means:"illicit drug",
    say:"medicamento, medicina", risk:"critical", tag:"Medications",
    heard:"No tomo ninguna droga.",
    trap:"I do not take any drugs — heard as: I take no medications.",
    truth:"I do not use any illicit drugs.",
    note:"Asking a patient about sus drogas reads as an accusation and will shut the history down. Ask about medicamentos for the medication list, and drogas only when you mean substance use."
  },
  {
    es:"ampolla", looks:"ampoule only", means:"blister — and also an ampoule",
    say:"depends on sense", risk:"critical", tag:"Dermatology / Meds",
    heard:"Me salió una ampolla en el pie.",
    trap:"An ampoule came out on my foot.",
    truth:"I got a blister on my foot.",
    note:"Genuinely both. In a wound-care conversation it is a blister; on a medication order it is an ampoule. Let the setting decide, and confirm if it could be either."
  },
  {
    es:"desorden", looks:"disorder (medical)", means:"mess, disarray",
    say:"trastorno", risk:"high", tag:"Psych / Neuro",
    heard:"El doctor dice que tengo un desorden.",
    trap:"The doctor says I have a disorder.",
    truth:"Usually: the doctor says I have a condition — but confirm which one.",
    note:"Going into Spanish, a bipolar disorder is trastorno bipolar, never desorden bipolar. Desorden is the state of a messy room. Eating disorder is trastorno alimentario."
  },
  {
    es:"condición", looks:"condition (illness)", means:"a stipulation, a term, a state",
    say:"afección, enfermedad, padecimiento", risk:"high", tag:"Clinical",
    heard:"¿Tiene alguna condición?",
    trap:"Do you have any conditions? — heard as terms or requirements",
    truth:"Do you have any medical conditions?",
    note:"Widely used in US Spanish under English influence, so many patients here will understand it. Afección or enfermedad is safer with a patient who has recently arrived."
  },
  {
    es:"severo", looks:"severe", means:"strict, harsh (of a person)",
    say:"grave, intenso, fuerte", risk:"high", tag:"Symptoms",
    heard:"Un dolor severo.",
    trap:"Passable, but it is not how most patients describe pain.",
    truth:"Dolor intenso, dolor fuerte, dolor grave.",
    note:"The RAE now accepts severo for illness because usage pushed it there, so this is a preference rather than an error. Going into Spanish, dolor fuerte or dolor intenso is what a patient actually says."
  },
  {
    es:"injuria", looks:"injury", means:"an insult, slander",
    say:"lesión, herida", risk:"high", tag:"Trauma",
    heard:"Injuria renal aguda.",
    trap:"Kidney insult.",
    truth:"Acute kidney injury.",
    note:"The subtle one. In lay speech injuria is an insult. In clinical Spanish it is a real technical term — injuria renal, injuria pulmonar. Register decides. A patient describing a fall means lesión or herida."
  },
  {
    es:"sano", looks:"sane", means:"healthy",
    say:"cuerdo, en sus cabales", risk:"high", tag:"Psych",
    heard:"Mi papá está sano.",
    trap:"My father is sane.",
    truth:"My father is healthy.",
    note:"Turns a general-health answer into a psychiatric one. Sano y salvo is safe and sound."
  },
  {
    es:"complexión", looks:"complexion (skin)", means:"build, body type",
    say:"cutis, tez", risk:"high", tag:"Exam",
    heard:"Es de complexión delgada.",
    trap:"He has a thin complexion.",
    truth:"He has a slim build.",
    note:"Describes the frame, not the face. For skin tone or quality use cutis or tez."
  },
  {
    es:"lívido", looks:"livid (furious)", means:"pale, or bluish",
    say:"furioso, enojadísimo", risk:"high", tag:"Exam",
    heard:"Estaba lívido.",
    trap:"He was livid.",
    truth:"He was pale.",
    note:"A description of colour, not mood — and a clinically meaningful one. Reading it as anger loses a sign."
  },
  {
    es:"aborto", looks:"abortion only", means:"abortion, or miscarriage",
    say:"aborto espontáneo = miscarriage", risk:"critical", tag:"OB",
    heard:"Tuve dos abortos.",
    trap:"I had two abortions.",
    truth:"Ask: aborto espontáneo (miscarriage) or aborto provocado (termination)?",
    note:"Not a false friend so much as a word that collapses two very different histories into one. The OB history, and how the conversation should be handled, depend on which is meant. Ask."
  },
  {
    es:"regla", looks:"rule", means:"menstrual period (colloquial)",
    say:"norma (for rule)", risk:"high", tag:"OB",
    heard:"No me ha bajado la regla.",
    trap:"The rule has not come down for me.",
    truth:"I have missed my period.",
    note:"Regla, período and menstruación all appear. Bajar is the verb patients use, not venir."
  },
  {
    es:"aparato", looks:"apparatus, device", means:"body system",
    say:"dispositivo (for a device)", risk:"high", tag:"Anatomy",
    heard:"Problemas del aparato digestivo.",
    trap:"Problems with the digestive apparatus.",
    truth:"Problems with the digestive system.",
    note:"Aparato digestivo, aparato respiratorio, aparato reproductor. It can also mean a device such as a hearing aid, so context decides."
  },
  {
    es:"sensible", looks:"sensible", means:"sensitive",
    say:"sensato, razonable", risk:"high", tag:"Exam",
    heard:"Tengo la piel muy sensible.",
    trap:"I have very sensible skin.",
    truth:"I have very sensitive skin.",
    note:"Also used for emotionally sensitive. Sensato is the word for level-headed."
  },
  {
    es:"soportar", looks:"to support", means:"to endure, to put up with",
    say:"apoyar, sostener", risk:"high", tag:"Symptoms",
    heard:"No soporto el dolor.",
    trap:"I do not support the pain.",
    truth:"I cannot stand the pain.",
    note:"A direct pain-severity statement. Going into Spanish, supporting a patient emotionally is apoyar; holding weight is sostener."
  },
  {
    es:"atender", looks:"to attend (an event)", means:"to see to, to care for",
    say:"asistir a", risk:"high", tag:"Care",
    heard:"¿Quién me va a atender?",
    trap:"Who is going to attend me?",
    truth:"Who is going to see me?",
    note:"Pairs with its mirror image below: asistir means to attend, atender means to care for. They are each other's trap."
  },
  {
    es:"asistir", looks:"to assist", means:"to attend, to be present at",
    say:"ayudar", risk:"high", tag:"Care",
    heard:"No pude asistir a la cita.",
    trap:"I could not assist at the appointment.",
    truth:"I could not make it to the appointment.",
    note:"Asistir a una cita is to show up for it. To assist someone is ayudar."
  },
  {
    es:"discutir", looks:"to discuss", means:"to argue",
    say:"hablar de, tratar, comentar", risk:"high", tag:"Communication",
    heard:"Quiero discutir esto con el doctor.",
    trap:"May pass, but it can land as: I want to argue with the doctor.",
    truth:"I want to talk this over with the doctor.",
    note:"Going into Spanish especially: the doctor wants to discuss your results is quiere hablar de sus resultados, not quiere discutir sus resultados."
  },
  {
    es:"remover", looks:"to remove", means:"to stir",
    say:"quitar, extirpar, sacar", risk:"high", tag:"Surgery",
    heard:"Hay que remover la mezcla.",
    trap:"You have to remove the mixture.",
    truth:"You have to stir the mixture.",
    note:"Removing a tumour is extirpar or sacar. Remover el tumor sounds like stirring it."
  },
  {
    es:"introducir", looks:"to introduce (a person)", means:"to insert",
    say:"presentar", risk:"high", tag:"Procedures",
    heard:"Le voy a introducir el catéter.",
    trap:"I am going to introduce the catheter to you.",
    truth:"I am going to insert the catheter.",
    note:"Introducing yourself to a patient is presentarse, never introducirse."
  },
  {
    es:"realizar", looks:"to realize", means:"to carry out, to perform",
    say:"darse cuenta", risk:"high", tag:"Procedures",
    heard:"Vamos a realizar una biopsia.",
    trap:"We are going to realize a biopsy.",
    truth:"We are going to perform a biopsy.",
    note:"To realize something in the sense of noticing it is darse cuenta."
  },
  {
    es:"actualmente", looks:"actually", means:"currently, at present",
    say:"en realidad, de hecho", risk:"high", tag:"History",
    heard:"Actualmente no tomo nada.",
    trap:"Actually I do not take anything.",
    truth:"I am not taking anything at the moment.",
    note:"Changes a current-medications answer into a contradiction. En realidad is actually."
  },
  {
    es:"eventualmente", looks:"eventually", means:"possibly, occasionally",
    say:"finalmente, con el tiempo", risk:"high", tag:"History",
    heard:"Eventualmente me duele.",
    trap:"Eventually it hurts.",
    truth:"It hurts now and then.",
    note:"Frequency, not sequence. A symptom that happens occasionally is very different from one that will happen in the end."
  },
  {
    es:"pariente", looks:"parent", means:"relative",
    say:"padre y madre, padres", risk:"high", tag:"History",
    heard:"Tengo un pariente con diabetes.",
    trap:"My parent has diabetes.",
    truth:"I have a relative with diabetes.",
    note:"Changes a family history from first-degree to any degree, which is exactly the distinction the question is asking about. Ask which relative."
  },
  {
    es:"compromiso", looks:"compromise", means:"commitment, obligation",
    say:"acuerdo, concesión", risk:"high", tag:"Clinical",
    heard:"Hay compromiso pulmonar.",
    trap:"There is pulmonary compromise — which happens to be right here.",
    truth:"There is lung involvement.",
    note:"Clinically comprometido does mean involved or impaired, so the cognate can work. Socially it means a commitment: tengo un compromiso is I have a prior engagement, not I have a compromise."
  },
  {
    es:"asumir", looks:"to assume (suppose)", means:"to take on, to take charge of",
    say:"suponer, dar por hecho", risk:"everyday", tag:"Communication",
    heard:"Asumió el cuidado de su madre.",
    trap:"He assumed the care of his mother.",
    truth:"He took over caring for his mother.",
    note:"To assume in the sense of guessing is suponer."
  },
  {
    es:"pretender", looks:"to pretend", means:"to intend, to aim to",
    say:"fingir, aparentar", risk:"everyday", tag:"Communication",
    heard:"¿Qué pretende hacer?",
    trap:"What are you pretending to do?",
    truth:"What are you planning to do?",
    note:"To pretend to be asleep is fingir or hacerse el dormido."
  },
  {
    es:"recordar", looks:"to record", means:"to remember, to remind",
    say:"grabar, registrar, anotar", risk:"everyday", tag:"Communication",
    heard:"No recuerdo la fecha.",
    trap:"I am not recording the date.",
    truth:"I do not remember the date.",
    note:"Recording a conversation is grabar; writing it in the chart is registrar or anotar."
  },
  {
    es:"envolver", looks:"to involve", means:"to wrap",
    say:"involucrar, implicar", risk:"everyday", tag:"Care",
    heard:"Envuelva la herida.",
    trap:"Involve the wound.",
    truth:"Wrap the wound.",
    note:"Involving the family in a decision is involucrar a la familia."
  },
  {
    es:"aplicar", looks:"to apply (for something)", means:"to apply (a substance), to put on",
    say:"solicitar, presentar una solicitud", risk:"everyday", tag:"Care",
    heard:"Aplique la crema dos veces al día.",
    trap:"Apply for the cream twice a day.",
    truth:"Put the cream on twice a day.",
    note:"Applying for insurance or benefits is solicitar. Aplicar para un trabajo is an anglicism you will hear here, but solicitar is the standard form."
  },
  {
    es:"asistencia", looks:"assistance", means:"attendance",
    say:"ayuda, apoyo", risk:"everyday", tag:"Care",
    heard:"La asistencia fue baja.",
    trap:"The assistance was low.",
    truth:"Attendance was low.",
    note:"Asistencia médica does mean medical care, so the cognate is not always wrong. In a scheduling or class context it is attendance."
  },
  {
    es:"argumento", looks:"argument (quarrel)", means:"reasoning, plot, storyline",
    say:"discusión, pelea", risk:"everyday", tag:"Communication",
    heard:"Tuvieron un argumento.",
    trap:"They had an argument — in the sense of a fight.",
    truth:"They had a line of reasoning. A quarrel is una discusión.",
    note:"The quarrel sense is discusión or pelea."
  },
  {
    es:"éxito", looks:"exit", means:"success",
    say:"salida", risk:"everyday", tag:"Everyday",
    heard:"La cirugía fue un éxito.",
    trap:"The surgery was an exit.",
    truth:"The surgery was a success.",
    note:"Emergency exit is salida de emergencia."
  },
  {
    es:"largo", looks:"large", means:"long",
    say:"grande", risk:"everyday", tag:"Exam",
    heard:"Una cicatriz larga.",
    trap:"A large scar.",
    truth:"A long scar.",
    note:"Size is grande. Length is largo. On a wound description the two say different things."
  },
  {
    es:"vaso", looks:"vase", means:"drinking glass — and, in anatomy, a vessel",
    say:"florero", risk:"everyday", tag:"Anatomy",
    heard:"Tome un vaso de agua.",
    trap:"Drink a vase of water.",
    truth:"Drink a glass of water.",
    note:"Vaso sanguíneo is a blood vessel, so in anatomy the cognate is right. A vase for flowers is a florero."
  },
  {
    es:"librería", looks:"library", means:"bookstore",
    say:"biblioteca", risk:"everyday", tag:"Everyday",
    heard:"Está en la librería.",
    trap:"It is at the library.",
    truth:"It is at the bookstore.",
    note:"Comes up in discharge instructions and community-resource conversations."
  },
  {
    es:"colegio", looks:"college", means:"school (primary or secondary)",
    say:"universidad", risk:"everyday", tag:"Everyday",
    heard:"Mi hija va al colegio.",
    trap:"My daughter goes to college.",
    truth:"My daughter goes to school.",
    note:"Changes a paediatric patient into an adult one. College is universidad."
  },
  {
    es:"lectura", looks:"lecture", means:"reading",
    say:"conferencia, charla", risk:"everyday", tag:"Everyday",
    heard:"La lectura de la presión.",
    trap:"The lecture of the blood pressure.",
    truth:"The blood pressure reading.",
    note:"A talk or lecture is una conferencia or una charla."
  },
  {
    es:"bizarro", looks:"bizarre", means:"brave, gallant (traditional)",
    say:"extraño, raro", risk:"everyday", tag:"Everyday",
    heard:"Un caso bizarro.",
    trap:"A bizarre case.",
    truth:"Traditionally: a gallant case. Increasingly used as bizarre.",
    note:"Honest split. English influence has pushed bizarro toward strange in everyday Latin American speech, and the RAE has acknowledged it. Extraño or raro is unambiguous."
  },
  {
    es:"fábrica", looks:"fabric", means:"factory",
    say:"tela", risk:"everyday", tag:"Everyday",
    heard:"Trabajo en una fábrica.",
    trap:"I work in fabric.",
    truth:"I work in a factory.",
    note:"Occupational history matters for exposure. Fabric is tela."
  },
  {
    es:"carpeta", looks:"carpet", means:"folder",
    say:"alfombra", risk:"everyday", tag:"Everyday",
    heard:"Traiga la carpeta.",
    trap:"Bring the carpet.",
    truth:"Bring the folder.",
    note:"Comes up when a patient is asked to bring their records."
  },
  {
    es:"sopa", looks:"soap", means:"soup",
    say:"jabón", risk:"everyday", tag:"Everyday",
    heard:"Solo puede tomar sopa.",
    trap:"He can only drink soap.",
    truth:"He can only have soup.",
    note:"Turns up in diet instructions, where it matters."
  },
  {
    es:"crudo", looks:"crude", means:"raw — and, in Mexico, hungover",
    say:"grosero (for crude speech)", risk:"everyday", tag:"Diet",
    heard:"Lo comí crudo.",
    trap:"I ate it crude.",
    truth:"I ate it raw.",
    note:"Relevant to a food-poisoning history. Estar crudo is to be hungover in Mexican Spanish."
  },
  {
    es:"molestar", looks:"to molest", means:"to bother, to annoy, to disturb",
    say:"abusar sexualmente de", risk:"critical", tag:"Communication",
    heard:"No quiero molestar a la enfermera.",
    trap:"I do not want to molest the nurse.",
    truth:"I do not want to bother the nurse.",
    note:"The verb behind molestia, and the same warning applies. Molestar is ordinary politeness — perdone la molestia is sorry to trouble you."
  },
  {
    es:"actual", looks:"actual", means:"current, present-day",
    say:"real, verdadero", risk:"high", tag:"History",
    heard:"Mi peso actual es 70 kilos.",
    trap:"My actual weight is 70 kilos.",
    truth:"My current weight is 70 kilos.",
    note:"Close enough to pass unnoticed, which is what makes it risky on a chart: current weight and true weight are different claims."
  },
  {
    es:"disgusto", looks:"disgust", means:"annoyance, upset, a falling-out",
    say:"asco, repugnancia", risk:"everyday", tag:"Communication",
    heard:"Se llevó un disgusto.",
    trap:"She was disgusted.",
    truth:"She was upset.",
    note:"Physical disgust or nausea at something is asco. Estar a disgusto is to be uncomfortable or ill at ease."
  },
  {
    es:"contestar", looks:"to contest", means:"to answer, to reply",
    say:"impugnar, disputar", risk:"everyday", tag:"Communication",
    heard:"No contestó el teléfono.",
    trap:"He did not contest the phone.",
    truth:"He did not answer the phone.",
    note:"Contesting a bill or a decision is impugnar or disputar."
  },
  {
    es:"desgracia", looks:"disgrace", means:"misfortune, a tragedy",
    say:"deshonra, vergüenza", risk:"everyday", tag:"Communication",
    heard:"Fue una desgracia.",
    trap:"It was a disgrace.",
    truth:"It was a tragedy.",
    note:"Por desgracia means unfortunately. A disgrace in the shameful sense is una deshonra."
  },
  {
    es:"receta", looks:"recipe", means:"prescription",
    say:"receta de cocina", risk:"critical", tag:"Medications",
    heard:"Perdí la receta que me dio el doctor.",
    trap:"I lost the recipe the doctor gave me.",
    truth:"I lost the prescription the doctor gave me.",
    note:"Receta is both, and the kitchen sense is the one an English ear reaches for. In a pharmacy conversation it is always the prescription."
  },
  {
    es:"seno", looks:"sinus only", means:"breast — and also a sinus",
    say:"depends on sense", risk:"critical", tag:"Imaging / OB",
    heard:"Me duelen los senos.",
    trap:"My sinuses hurt.",
    truth:"My breasts hurt — unless she means senos paranasales.",
    note:"Genuinely both, and they order completely different imaging. Senos paranasales is explicit for sinuses. If the sentence does not settle it, ask before it reaches a requisition."
  },
  {
    es:"accidente cerebrovascular", looks:"an accident", means:"a stroke",
    say:"accidente (for a mishap)", risk:"critical", tag:"Neuro",
    heard:"Mi esposo tuvo un accidente cerebrovascular.",
    trap:"My husband had an accident — heard as a fall or a crash.",
    truth:"My husband had a stroke.",
    note:"Often shortened to ACV. Dropping cerebrovascular turns a stroke history into a trauma history, and the two send triage in opposite directions."
  },
  {
    es:"derrame", looks:"drainage", means:"a bleed, or a collection of fluid",
    say:"drenaje", risk:"critical", tag:"Neuro / Pulm",
    heard:"Tuvo un derrame.",
    trap:"He had some drainage.",
    truth:"He had a stroke — derrame cerebral. Confirm which kind.",
    note:"Derrame cerebral is a stroke or brain bleed; derrame pleural is a pleural effusion. Alone it means a spill. Never render it as drainage."
  },
  {
    es:"excitado", looks:"excited", means:"sexually aroused",
    say:"emocionado, entusiasmado", risk:"critical", tag:"Communication",
    heard:"El niño estaba muy excitado.",
    trap:"The child was very aroused.",
    truth:"The child was very worked up.",
    note:"Going into Spanish this is the dangerous direction: telling a patient estoy excitado for I am excited is a serious misstep. Use emocionado."
  },
  {
    es:"demandar", looks:"to demand", means:"to sue",
    say:"exigir, reclamar", risk:"critical", tag:"Legal",
    heard:"Voy a demandar al hospital.",
    trap:"I am going to demand from the hospital.",
    truth:"I am going to sue the hospital.",
    note:"A stated intention to sue is a different conversation from a request, and it has to reach the chart as what it is. Una demanda is a lawsuit."
  },
  {
    es:"denunciar", looks:"to denounce", means:"to report to the authorities",
    say:"criticar públicamente", risk:"critical", tag:"Legal / Safeguarding",
    heard:"Quiero denunciar lo que pasó.",
    trap:"I want to denounce what happened.",
    truth:"I want to report what happened.",
    note:"Carries no sense of grandstanding — it is the ordinary word for filing a report about abuse, violence or a crime. Rendering it as denounce makes a safeguarding disclosure sound like a complaint."
  },
  {
    es:"intervención", looks:"intervention", means:"an operation, a procedure",
    say:"intervención (for addiction) is not used this way", risk:"critical", tag:"Surgery",
    heard:"Le van a hacer una intervención.",
    trap:"They are going to do an intervention.",
    truth:"He is going to have an operation.",
    note:"Spanish has no equivalent of the family-confrontation sense of intervention. Intervención quirúrgica is surgery."
  },
  {
    es:"bulto", looks:"bulk", means:"a lump",
    say:"volumen, grueso", risk:"critical", tag:"Exam",
    heard:"Me encontré un bulto.",
    trap:"I found some bulk.",
    truth:"I found a lump.",
    note:"A patient reporting a bulto is reporting a mass. Nothing about it is vague."
  },
  {
    es:"inflamado", looks:"inflamed", means:"swollen",
    say:"con inflamación (for true inflammation)", risk:"critical", tag:"Exam",
    heard:"Tengo el pie inflamado.",
    trap:"My foot is inflamed — heard as an inflammatory process.",
    truth:"My foot is swollen.",
    note:"Most patients mean swelling, not inflammation. Rendering it as inflamed can suggest infection or an inflammatory condition that nobody described."
  },
  {
    es:"alta", looks:"high", means:"discharge from hospital",
    say:"alto, elevado", risk:"critical", tag:"Admin",
    heard:"Ya me dieron de alta.",
    trap:"They already gave me high.",
    truth:"I have already been discharged.",
    note:"Dar de alta is to discharge; darse de alta is to register. The adjective alta meaning high is a different word doing a different job in the sentence."
  },
  {
    es:"ingreso", looks:"income", means:"hospital admission — and also income",
    say:"depends on sense", risk:"critical", tag:"Admin",
    heard:"Fue un ingreso de urgencia.",
    trap:"It was an emergency income.",
    truth:"It was an emergency admission.",
    note:"Both senses are real and both come up in the same interview — admissions history and financial screening. Let the surrounding sentence decide."
  },
  {
    es:"ardor", looks:"ardour, passion", means:"burning",
    say:"pasión, entusiasmo", risk:"high", tag:"Symptoms",
    heard:"Siento ardor al orinar.",
    trap:"I feel passion when I urinate.",
    truth:"I have burning when I urinate.",
    note:"A straightforward symptom word. Ardor de estómago is heartburn."
  },
  {
    es:"acidez", looks:"acidity (a lab value)", means:"heartburn",
    say:"acidez (in chemistry) is fine", risk:"high", tag:"GI",
    heard:"Tengo mucha acidez.",
    trap:"I have high acidity.",
    truth:"I get a lot of heartburn.",
    note:"From a patient it is reflux, not a measurement. Agruras is the common Mexican word for the same thing."
  },
  {
    es:"entumecido", looks:"entombed", means:"numb",
    say:"sepultado", risk:"high", tag:"Neuro",
    heard:"Tengo la mano entumecida.",
    trap:"My hand is entombed.",
    truth:"My hand is numb.",
    note:"Adormecido is the other common word for the same sensation — literally the limb has fallen asleep."
  },
  {
    es:"estómago", looks:"stomach (the organ)", means:"the whole belly, in patient speech",
    say:"el estómago (organ) vs el abdomen", risk:"high", tag:"GI",
    heard:"Me duele el estómago.",
    trap:"My stomach hurts — heard as epigastric.",
    truth:"My belly hurts. Ask where.",
    note:"Patients use estómago for anything between the ribs and the hips. Localising the pain is the interpreter's cue to let the clinician ask, not to guess."
  },
  {
    es:"crisis", looks:"a crisis", means:"an attack, an episode",
    say:"emergencia, situación grave", risk:"high", tag:"Clinical",
    heard:"Le dio una crisis asmática.",
    trap:"He had an asthma crisis.",
    truth:"He had an asthma attack.",
    note:"Crisis convulsiva is a seizure, crisis hipertensiva is a hypertensive emergency. English crisis sounds more catastrophic than the Spanish word usually is."
  },
  {
    es:"ataque", looks:"an attack (assault)", means:"an episode — cardiac, seizure, or panic",
    say:"agresión, asalto", risk:"high", tag:"Clinical",
    heard:"Le dio un ataque.",
    trap:"He was attacked.",
    truth:"He had an attack — ask what kind.",
    note:"On its own it is ambiguous even in Spanish: ataque al corazón, ataque epiléptico, ataque de nervios and ataque de ansiedad are four different events. Ask before choosing."
  },
  {
    es:"pulmonía", looks:"pulmonary (adjective)", means:"pneumonia",
    say:"pulmonar", risk:"high", tag:"Pulm",
    heard:"Tuvo pulmonía el invierno pasado.",
    trap:"He had something pulmonary last winter.",
    truth:"He had pneumonia last winter.",
    note:"Pulmonía is the everyday word, neumonía the clinical one. Both mean pneumonia — a specific diagnosis, not a general chest problem."
  },
  {
    es:"calentura", looks:"warmth", means:"fever — and in some regions, lust",
    say:"fiebre", risk:"high", tag:"Symptoms",
    heard:"El niño tiene calentura.",
    trap:"The child is warm.",
    truth:"The child has a fever.",
    note:"From a parent about a child it is fever, every time. The other sense exists in some countries, which is a reason to use fiebre yourself rather than a reason to hesitate over what a parent means."
  },
  {
    es:"seguro", looks:"sure, safe", means:"insurance",
    say:"seguro also means safe — context decides", risk:"high", tag:"Admin",
    heard:"No tengo seguro.",
    trap:"I am not sure.",
    truth:"I do not have insurance.",
    note:"Tengo seguro is I have coverage; estoy seguro is I am sure. The noun and the adjective look identical and only the sentence separates them."
  },
  {
    es:"póliza", looks:"police", means:"an insurance policy",
    say:"policía", risk:"high", tag:"Admin",
    heard:"Traje mi póliza.",
    trap:"I brought the police.",
    truth:"I brought my insurance policy.",
    note:"One letter and one stress mark apart from policía, and they turn up in very different conversations."
  },
  {
    es:"alumbramiento", looks:"lighting, illumination", means:"delivery of the placenta",
    say:"iluminación", risk:"high", tag:"OB",
    heard:"El alumbramiento fue rápido.",
    trap:"The lighting was quick.",
    truth:"The placenta was delivered quickly.",
    note:"Used loosely for childbirth as a whole, but in clinical Spanish it is specifically the third stage of labour. Parto is the birth itself."
  },
  {
    es:"parto", looks:"part", means:"childbirth, delivery",
    say:"parte", risk:"high", tag:"OB",
    heard:"Fue un parto difícil.",
    trap:"It was a difficult part.",
    truth:"It was a difficult delivery.",
    note:"Trabajo de parto is labour; sala de partos is the delivery room."
  },
  {
    es:"vejiga", looks:"vesicle", means:"bladder — and also a blister",
    say:"depends on sense", risk:"high", tag:"Anatomy",
    heard:"Tengo una vejiga en el pie.",
    trap:"I have a bladder in my foot.",
    truth:"I have a blister on my foot.",
    note:"Overlaps with ampolla for the blister sense. In anatomy, vejiga on its own is the bladder."
  },
  {
    es:"pecho", looks:"chest only", means:"chest — and also breast",
    say:"tórax, or seno / mama", risk:"high", tag:"Anatomy",
    heard:"Me duele el pecho.",
    trap:"Confidently rendering it either way.",
    truth:"My chest hurts — or my breast hurts. Ask.",
    note:"Dar el pecho is to breastfeed. Cardiac chest pain and breast pain are not the same complaint, and pecho does not distinguish them."
  },
  {
    es:"registrar", looks:"to register", means:"to search",
    say:"inscribir, registrarse", risk:"high", tag:"Admin",
    heard:"Me registraron en la entrada.",
    trap:"They registered me at the entrance.",
    truth:"They searched me at the entrance.",
    note:"Registrarse (reflexive) is to sign in. Registrar a alguien is to search them — a different experience to describe."
  },
  {
    es:"resumir", looks:"to resume", means:"to summarize",
    say:"reanudar", risk:"high", tag:"Communication",
    heard:"Voy a resumir lo que dijo.",
    trap:"I am going to resume what he said.",
    truth:"I am going to summarize what he said.",
    note:"To resume a treatment after a pause is reanudar."
  },
  {
    es:"tratar", looks:"to treat only", means:"to treat — and, with de, to try",
    say:"intentar", risk:"high", tag:"Clinical",
    heard:"Traté de tomarlo.",
    trap:"I treated myself by taking it.",
    truth:"I tried to take it.",
    note:"Tratar de + verb is to try. Without de it is to treat or to deal with. A medication-adherence answer can hinge on the preposition."
  },
  {
    es:"padecer", looks:"to pass away", means:"to suffer from a condition",
    say:"fallecer, morir", risk:"high", tag:"History",
    heard:"Padece del corazón.",
    trap:"He passed from the heart.",
    truth:"He has heart trouble.",
    note:"Padecimiento is a condition or ailment. Nothing in the word implies death."
  },
  {
    es:"aviso", looks:"advice", means:"a notice, a warning",
    say:"consejo", risk:"everyday", tag:"Communication",
    heard:"Me llegó un aviso del hospital.",
    trap:"I got some advice from the hospital.",
    truth:"I got a notice from the hospital.",
    note:"Advice is consejo. Avisar is to let someone know, not to advise them."
  },
  {
    es:"advertir", looks:"to advertise", means:"to warn",
    say:"anunciar, publicitar", risk:"everyday", tag:"Communication",
    heard:"Le advirtieron del riesgo.",
    trap:"They advertised the risk to him.",
    truth:"They warned him about the risk.",
    note:"Turns a documented warning into marketing, which matters when consent is the subject."
  },
  {
    es:"simpático", looks:"sympathetic", means:"friendly, likeable",
    say:"comprensivo, solidario", risk:"everyday", tag:"Communication",
    heard:"El doctor fue muy simpático.",
    trap:"The doctor was very sympathetic.",
    truth:"The doctor was very pleasant.",
    note:"A comment on manner, not on compassion. The sympathetic nervous system is sistema nervioso simpático, which is a separate technical use."
  },
  {
    es:"comprensivo", looks:"comprehensive", means:"understanding",
    say:"completo, exhaustivo", risk:"everyday", tag:"Communication",
    heard:"Necesito un doctor comprensivo.",
    trap:"I need a comprehensive doctor.",
    truth:"I need an understanding doctor.",
    note:"A comprehensive exam is un examen completo."
  },
  {
    es:"educado", looks:"educated", means:"polite, well-mannered",
    say:"culto, con estudios", risk:"everyday", tag:"Communication",
    heard:"Es un muchacho muy educado.",
    trap:"He is a very educated boy.",
    truth:"He is a very polite boy.",
    note:"A comment on manners, not schooling. Educational level is nivel de estudios."
  },
  {
    es:"formal", looks:"formal", means:"reliable, dependable",
    say:"formal (in dress or register) also exists", risk:"everyday", tag:"Communication",
    heard:"Es una persona muy formal.",
    trap:"He is a very formal person.",
    truth:"He is a very reliable person.",
    note:"Its opposite carries the load: informal means unreliable, not casual."
  },
  {
    es:"particular", looks:"particular, specific", means:"private",
    say:"específico, concreto", risk:"everyday", tag:"Admin",
    heard:"Lo vi con un médico particular.",
    trap:"I saw a particular doctor.",
    truth:"I saw a private doctor.",
    note:"Consulta particular is a private practice — relevant to where prior records live."
  },
  {
    es:"suceso", looks:"success", means:"an event, an occurrence",
    say:"éxito", risk:"everyday", tag:"Communication",
    heard:"Fue un suceso inesperado.",
    trap:"It was an unexpected success.",
    truth:"It was an unexpected event.",
    note:"Pairs with éxito, which is the real word for success. Suceder is to happen."
  },
  {
    es:"embarazoso", looks:"pregnant (by association)", means:"embarrassing, awkward",
    say:"embarazada (pregnant)", risk:"everyday", tag:"Communication",
    heard:"Fue una situación embarazosa.",
    trap:"It was a pregnant situation.",
    truth:"It was an awkward situation.",
    note:"The adjective everyone expects embarazada to be. Worth knowing precisely because the famous trap makes people over-correct."
  },
  {
    es:"emocionante", looks:"emotional", means:"exciting, moving",
    say:"emotivo, sentimental", risk:"everyday", tag:"Communication",
    heard:"Fue muy emocionante.",
    trap:"It was very emotional.",
    truth:"It was very exciting.",
    note:"Emocionado is excited, not emotional. The safer word for emotionally affected is afectado."
  },
  {
    es:"probar", looks:"to probe", means:"to try, to taste, to test",
    say:"sondear, examinar", risk:"everyday", tag:"Clinical",
    heard:"Vamos a probar otro medicamento.",
    trap:"We are going to probe another medication.",
    truth:"We are going to try another medication.",
    note:"Probarse la ropa is to try clothes on. Nothing invasive is implied."
  },
  {
    es:"blando", looks:"bland", means:"soft",
    say:"soso, sin sal", risk:"everyday", tag:"Diet",
    heard:"Me pusieron dieta blanda.",
    trap:"They put me on a bland diet.",
    truth:"They put me on a soft diet.",
    note:"A soft diet is about texture, a bland diet about seasoning, and they are ordered for different reasons. Bland in the flavourless sense is soso."
  },
  {
    es:"cita", looks:"to cite, a citation", means:"an appointment",
    say:"citar (to quote)", risk:"everyday", tag:"Admin",
    heard:"Tengo cita el martes.",
    trap:"I have a citation on Tuesday.",
    truth:"I have an appointment on Tuesday.",
    note:"Citación is the legal summons. Cita on its own is an appointment or a date."
  },
  {
    es:"carta", looks:"card, cart", means:"a letter",
    say:"tarjeta", risk:"everyday", tag:"Admin",
    heard:"Me mandaron una carta.",
    trap:"They sent me a card.",
    truth:"They sent me a letter.",
    note:"Insurance card is tarjeta de seguro. A letter from the hospital is what carta means."
  },
  {
    es:"planta", looks:"plant", means:"floor of a building — and the sole of the foot",
    say:"fábrica (industrial plant)", risk:"everyday", tag:"Anatomy / Admin",
    heard:"Está en la tercera planta.",
    trap:"He is at the third plant.",
    truth:"He is on the third floor.",
    note:"Planta del pie is the sole. Both senses turn up in a hospital, one in directions and one on an exam."
  },
  {
    es:"sala", looks:"salon", means:"a room or ward",
    say:"salón de belleza", risk:"everyday", tag:"Admin",
    heard:"Está en la sala de espera.",
    trap:"He is in the waiting salon.",
    truth:"He is in the waiting room.",
    note:"Sala de partos, sala de operaciones, sala de emergencias — the building blocks of hospital directions."
  },
  {
    es:"ropa", looks:"rope", means:"clothing",
    say:"cuerda, soga", risk:"everyday", tag:"Everyday",
    heard:"Quítese la ropa, por favor.",
    trap:"Take off the rope, please.",
    truth:"Please take off your clothes.",
    note:"Turns up in every exam-room instruction there is."
  },
  {
    es:"quejarse", looks:"to quake", means:"to complain",
    say:"temblar", risk:"everyday", tag:"Symptoms",
    heard:"Se queja de dolor.",
    trap:"He quakes with pain.",
    truth:"He complains of pain.",
    note:"Se queja de is the standard way a family member reports a symptom on someone else's behalf."
  },
];
