/* The User Guide's answers: GUIDE_SECTIONS and GUIDE_TOPICS. The guide
   screen, global search, Home's User Guide tile and Dr. Smiley's "how do
   I..." answers all read them by name. They were in index.html until
   2026-10-21 (docs/split-index.md, phase 2); here, the guide edit every
   visible change makes (AGENTS.md) no longer collides in index.html.
   Loaded by a plain <script src> just before index.html's own script, so
   both names exist before any of the app's code runs. Plain data only: no
   code, and no names from index.html. */

/* ---------- The guide ----------
   This was a twenty-slide tour you swiped through in order. That shape only
   works if you read it once, front to back, before you need it — and nobody
   does. People arrive at a guide mid-shift with one question, so the guide is
   now a list of questions.

   Every entry is titled the way someone would actually ask it out loud, and
   answered in the words they'd use. No "Progressive Web App", no "chevron",
   no keyboard shortcuts as the primary instruction. Directions are physical:
   bottom of the screen, top-left corner. ---------- */

const GUIDE_SECTIONS = [
  { id: 'start',   name: 'Getting started',        color: '#2E8BD0' },
  { id: 'ask',     name: 'Asking Dr. Smiley',      color: '#252E6D' },
  { id: 'find',    name: 'Finding a word',         color: '#0F5FA6' },
  { id: 'prep',    name: 'Before an appointment',  color: '#7C6A9C' },
  { id: 'change',  name: 'Adding and fixing words', color: '#B2456E' },
  { id: 'team',    name: 'Working with your team', color: '#35A97A' },
  { id: 'study',   name: 'Studying',               color: '#8B6D3F' },
  { id: 'trouble', name: 'When something goes wrong', color: '#C24E3A' },
  { id: 'out',     name: 'Getting your work out',  color: '#6F97AC' },
  { id: 'rule',    name: 'The one rule',           color: '#2F5D62' },
];

const GUIDE_TOPICS = [
  { id:'promo', section:'start', k:'video promo watch film movie clip minute 1 minute one minute introduction intro overview what is show someone new hire ceo explain the app', q:'What is Interpreter Hub? Watch the 1-minute video', a:`
    <div class="gd-video"><video src="media/hub-promo.mp4" poster="media/hub-promo.jpg" playsinline webkit-playsinline preload="none" aria-label="Interpreter Hub in one minute"></video></div>
    <p>A one-minute film about the Hub, made in 3D: why the right word matters, then the glossary, Translate, Doctor Prep, False Friends, the Daily Drill, CoreCHI Practice, Team Chat, the 3D Body, notifications, your knowledge brain and Ask Dr. Smiley. It plays with sound. Tap the square-corners button for full screen, and the <b>X</b> at the top right to come back.</p>
    <p>It's handy for showing someone new what the app does. To send it, tap <b>Copy link</b> below and paste it in Chat or a text.</p>
    <p>On Home, the hello banner always has a round <b>Watch</b> bubble in its bottom-right corner. Its ring of colours turns until you've watched the video once, then holds still.</p>` },

  { id:'opening', section:'start', k:'opening badge lanyard start intro log in login link account sign in scan tap enter welcome splash launch sound beep chime title staff per diem coordinator replay turn off skip pavilion music song harp violin piano quiet silent mute morning evening night light time of day dark blue gold photo picture my face replace dr smiley pins pin enamel lanyard badges earned achievements awards', q:'What is the badge that shows when the Hub starts?', a:`
    <p>On a phone, every time the Hub starts, your staff badge drops in on its lanyard in front of the Helena Theurer Pavilion. Tap the badge: it scans on the reader, turns green, Dr. Smiley winks, it says <b>Welcome in</b> with your first name, and a green ring opens into Home.</p>
    <p>Soft music (harp, piano and violin, made for the Hub) plays with the opening and fades out once you're on Home. iPhones don't let an app make any sound before you touch the screen, so on an iPhone the opening first says <b>Tap to enter</b>: tap anywhere, the music starts and the badge drops in. On a phone that allows sound right away, the music starts by itself and there's no Tap to enter. It's quiet, and it stays silent when your iPhone's silent switch is on. With <b>Sound</b> off in More there's no Tap to enter either.</p>
    <p>The light on the pavilion follows your phone's clock: warm morning light from 5 to 11, daylight from 11 to 4, and a blue evening from 4 pm through the night.</p>
    <p>In a hurry? Tap anywhere before the badge has arrived (after <b>Tap to enter</b>, if you see it) and you go straight to Home. It doesn't play when you open the Hub from a notification, or when you come back to it from another app without it restarting.</p>
    <p>Not signed in to an account on this phone yet? A <b>Log in or link your account</b> button shows under the badge. Tap it and the opening closes onto the sign-in: <b>Your account</b> in More if this phone is already in the team, or <b>Sign in with email</b> on the team-code screen if it isn't. Once you're signed in it doesn't show any more.</p>
    <p>The badge shows your first name and the first letter of your last name (from your name in the app), and your badge title. Dr. Smiley is in the photo spot unless you put your own photo there (below). It has no barcode or number: it is not an ID.</p>
    <p>To change it, open <b>More</b> (bottom right) and tap <b>Opening</b>, under <b>You</b>: turn <b>Badge opening</b> off or on, turn the <b>Sound</b> (the music, a beep and a chime) off or on, turn on <b>My photo on the badge</b>, type your <b>Badge title</b> (Staff Interpreter unless you change it: Per Diem Interpreter, Coordinator…), or tap <b>Replay the opening</b>. These stay on your phone.</p>
    <p><b>My photo on the badge</b> uses the photo you added with your name (tap your initial at the top right to add one; it's the same one your team sees in Team Chat, and one you added on another phone signed in to your account works too). It's off unless you turn it on. With it on, Dr. Smiley steps off the badge: he stands by the reader and waves while your badge comes down, then grins and waves when it turns green. A square photo fills the tall spot, so a little of each side is trimmed: a face works best.</p>
    <p>With <b>Still</b> chosen for Dr. Smiley, or Reduce Motion on your phone, nothing drifts or swings: the badge is already hanging, and the tap goes straight to green.</p>
    <p><b>Pins on your lanyard.</b> Every CoreCHI practice badge you earn (First steps, Century, Week strong and the rest, up to eight) becomes an enamel pin on the lanyard, the first one lowest by the clip. A badge you earned since the last time you opened the Hub clicks onto the strap as your badge settles, with a little sparkle, once on each phone. Your badges follow your account, so your pins show on every phone you sign in on. Once your badge has arrived, tap the lanyard where the pins hang to see them all: each one's name, what earned it and the day. Tap <b>Back to your badge</b> (or anywhere around the card) and the badge is still waiting for its tap.` },

  { id:'account', section:'start', k:'account sign in signin log in login link your account opening badge email code six digits 6 numbers two phones second phone new phone sync same name different name which one is you merge keep photo picture follow progress practice score streak badges settings dark mode region sync now synced not synced sign out signout gmail spam junk term review record due missed', q:'How do I use the Hub on two phones as the same person?', a:`
    <p>Sign in with your email. Tap <b>Log in or link your account</b> under the badge when the Hub starts, or open <b>More</b> (bottom right) and tap <b>Your account</b>, under <b>You</b>. Type your email and tap <b>Send me a code</b>. A few seconds later an email from the Hub arrives with 6 numbers in it. Go back to the Hub, type them in and tap <b>Sign in</b>. No password.</p>
    <p>Do the same on your other phone, with the same email. Both phones are now you: your name, and the photo filed under it, follow you. Change your name on one phone and the other picks it up the next time it opens. In <b>Team Chat</b>, messages you send while signed in show your photo even if you sent them under a shorter name ("Ana R" and "Ana Rivera" are one face). Messages sent before you signed in still match by their exact name.</p>
    <p>If the phone you sign in on goes by a different name than your account (say <b>Ana R</b> on one phone, <b>Ana Rivera</b> on the other), the Hub asks <b>Which one is you?</b> and shows both, each with its photo. The one you pick becomes your name, your photo and your settings on every phone. Your practice from both phones is kept either way. Picked the wrong one? Tap your initial at the top right and type the name you want.</p>
    <p>Your progress follows you too: CoreCHI practice (every question, your streak, your badges), the memory trainer, the Daily Drill, your campus and the knowledge brain's count. Your <b>Term Review</b> record too: which terms are due, which you missed, how many times you've seen each. The first time you sign in on a phone, the record kept under that phone's name joins your account's (for each term, the more recent answer wins). Sign out and the phone goes back to the record under its name. So do your settings: dark mode, your region and the opening's settings. What Dr. Smiley remembers about you (language, answer length, study focus, how he moves) stays on each phone, on purpose. The Hub saves them when it opens and when you leave it. If both phones changed something, the two are joined, nothing is counted twice, and nothing is wiped. Two phones open at the same moment don't update each other live; the other one catches up the next time it opens.</p>
    <p>To check it, open <b>More</b> and tap <b>Your account</b>, under <b>You</b>: it says when your progress last synced, or why it didn't, and <b>Sync now</b> tries again right away.</p>
    <p>The code works for 10 minutes, only on the phone where you asked for it, and it allows 5 tries. Not in your inbox? Look in Spam or Junk. Hospital email sometimes holds automated mail, so a personal email is usually faster.</p>
    <p>On a new phone or a computer you don't need the team code once you have an account: on the screen that asks for the team code, tap <b>Have an account? Sign in with email</b>, type your email, then the 6 numbers. The very first time, you join with the team code, then sign in from More.</p>
    <p><b>Sign out of this phone</b> keeps the phone in the team and keeps your name on it. It only stops being your account.</p>
    <p>If it says email sign-in isn't switched on yet, the Hub's owner still has a setting to add. Let them know.</p>` },

  { id:'tool-banners', section:'start', k:'banner banners colour color top title header translate term review ask hub doctor directory pin flies fly new look picture', q:'Why do Translate, Term Review, Ask and the Doctor Directory have a colour banner?', a:`
    <p>They open under the same kind of colour banner as the glossary domains: the screen's name, its picture, and one line about it, like <b>435 due</b> on Term Review or the number of doctors on the Doctor Directory.</p>
    <p>When you open one from Home, its picture flies up from the tile you tapped into the banner. With <b>Still</b> chosen for Dr. Smiley, or Reduce Motion on your phone, it's simply there.</p>
    <p>A few buttons moved onto the banners: <b>+ Add</b> on the Doctor Directory sits beside the count, and on Ask the Hub, <b>What I remember</b> and <b>New</b> (a new conversation) are on the banner. Once you're talking with Dr. Smiley, his face takes the picture's place.</p>` },
  { id:'pins', section:'start', k:'pins pictures icons look new 3d soft changed different art heart brain picture style images', q:'Why do the pictures on Home look different?', a:`
    <p>The pictures on Home, in the menu and in the guide (the heart, the brain, Translate, Team Chat and the rest) were redrawn in a new soft 3D style: rounded shapes, gentle light, the app's own colors. They still mean the same things and sit in the same places.</p>
    <p>The small icons match too: the tab bar at the bottom, the side menu, All Tools and the icons you can pick for a new domain. Recently deleted now shows a trash can.</p>` },
  { id:'name', section:'start', k:'name who signature attribution credit initials identify myself profile photo picture avatar', q:'How do I put my name on my work?', a:`
    <p>So your teammates can see who added or changed something. You only do this once on each phone.</p>
    <ol>
      <li>Tap the round button with your initial in the <b>top-right corner</b>. If there's no name yet, it shows a little person.</li>
      <li>Type your name.</li>
      <li>Tap <b>Save</b>.</li>
    </ol>
    <p>From then on your name goes on your chat messages, the terms you add or edit, and your practice. You can add a photo there too, and choose how it's framed (below). It's optional, and your team sees it beside your messages in Team Chat.</p>` },
  { id:'photo', section:'start', k:'photo picture profile avatar face cut cropped crop adjust move zoom pinch frame fit head chin badge selfie change', q:'How do I adjust my photo?', a:`
    <p>When you add a photo of yourself, the Hub lets you frame it before it's saved.</p>
    <ol>
      <li>Tap the round button with your initial in the <b>top-right corner</b>, then tap the round photo spot next to your name.</li>
      <li>Pick a photo. <b>Adjust your photo</b> opens.</li>
      <li>Drag the photo to move it. Pinch, or use the slider, to zoom in.</li>
      <li>Check the two small previews: <b>Team Chat</b> shows it round, <b>Your badge</b> (the opening, with My photo on the badge) shows it tall, with a little of each side trimmed.</li>
      <li>Tap <b>Save</b>, then <b>Save</b> on your name.</li>
    </ol>
    <p>To change how it's framed later, tap your photo and pick it again. <b>Cancel</b> keeps the photo you had.</p>` },

  { id:'namelight', section:'start', k:'name written light ball pen navy glow home greeting hello animation writing signature turn off stop', q:'Why is my name written in light on Home?', a:`
    <p>When you open the app, a small <b>navy light</b> writes your name in the Home greeting, letter by letter, the way a pen would, while Dr. Smiley says hello. It takes a few seconds, then your name stays as usual. With no name set, it writes <b>Welcome</b>.</p>
    <p>It plays each time you open the app or come back to it, and when you set or change your name. Not every time you go back to Home.</p>
    <p>To turn it off, tap your initial in the <b>top-right corner</b> and set <b>How Dr. Smiley moves</b> to <b>Still</b>. If your phone is set to reduce motion, it's always off.</p>` },

  { id:'invite', section:'start', k:'team code invite lock locked sign in login password access new phone get in join team only', q:'The Hub is asking for a team code', a:`
    <p>The Hub is only for the interpreter team, so it asks for the team code. Jose shares it, and any teammate can tell you what it is.</p>
    <ol>
      <li>Type the code on the lock screen. Capitals and the dash don't matter.</li>
      <li>Tap <b>Open the Hub</b>.</li>
    </ol>
    <p>You only do this once on each phone.</p>
    <p>If the Hub says the code didn't work, or that the team code changed, ask Jose or a teammate for the current one.</p>` },

  { id:'install', section:'start', k:'install download app icon home screen shortcut add safari chrome', q:'How do I put this on my phone like a real app?', a:`
    <p>You don't need the App Store. It takes about ten seconds, and afterwards it opens full screen with its own icon, like any other app.</p>
    <p><b>iPhone</b></p>
    <ol>
      <li>Open the app in Safari.</li>
      <li>Tap the <b>Share</b> button at the bottom: the square with an arrow pointing up.</li>
      <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
      <li>Tap <b>Add</b>.</li>
    </ol>
    <p><b>Android</b></p>
    <ol>
      <li>Open the app in Chrome.</li>
      <li>Tap the three dots in the corner.</li>
      <li>Tap <b>Install app</b>.</li>
    </ol>` },

  { id:'more', section:'start', k:'more menu list long where tools settings groups study doctors reference you domains find missing moved translate chat numbers due new', q:'What is in More?', a:`
    <p><b>More</b> (bottom right) holds every tool that isn't in the bar, in groups:</p>
    <ol>
      <li><b>Ask the Hub</b> at the top.</li>
      <li><b>Study</b>: CoreCHI Practice, Term Review, False Friends, Sound-Alikes, Code of Ethics, Training &amp; Events.</li>
      <li><b>Doctors</b>: Doctor Prep, Doctor Directory, Provider Pictures, Find a Doctor and MediFind. <b>Open</b> beside the heading shows the Doctors page.</li>
      <li><b>Reference</b>: <b>Terminology domains</b> (every domain, as tiles), Professional Resources, 3D Body, Link Directory, this guide and Recent Updates.</li>
      <li><b>You</b>: your account, Notifications, the opening, the voice and mic check, the smoothness meter, Recently deleted.</li>
    </ol>
    <p>Translate and Chat are in the bar, so they aren't repeated here. A number appears only when something needs you: terms you've reviewed that are due again, or new trainings since you last looked. A ↗ means it opens a website.</p>` },

  { id:'around', section:'start', k:'lost navigate menu buttons where tabs bar bottom find my way dark mode night moon top', q:'Where is everything?', a:`
    <p>Five buttons sit in a bar across the <b>bottom of the screen</b>, and they are always there:</p>
    <ol>
      <li><b>Home</b>: the starting page.</li>
      <li><b>Search</b>: looks through everything in the app.</li>
      <li><b>Translate</b>: look up a word you don't have yet.</li>
      <li><b>Chat</b>: your team.</li>
      <li><b>More</b>: everything else, in groups: <b>Study</b> (practice, Term Review, False Friends…), <b>Doctors</b>, <b>Reference</b> (every domain, 3D Body, this guide) and <b>You</b> (your account and settings).</li>
    </ol>
    <p>Scroll down and the bar gets thinner: just the icons, and every button still works with one tap. Scroll back up and the names come back.</p>
    <p><b>Dr. Smiley</b> sits beside that bar on the right, with <b>Ask</b> under him. Tap him to ask a question. On Home he’s in the greeting instead.</p>
    <p>Across the <b>top</b>: the moon switches dark mode on and off, the bell shows what the team changed, and your initial opens your name and settings.</p>
    <p>If you ever feel lost, tap <b>Home</b>. The arrow in the top-left corner takes you back one step.</p>` },

  { id:'tabbar', section:'start', k:'tab bar bottom bar thinner slim smaller shrinks shrink collapses collapse names gone icons only disappears pill capsule scrolling', q:'Why does the bar at the bottom get thinner?', a:`
    <p>When you scroll down, the bar at the bottom gets thinner so you see more of the page. It keeps all five buttons, just without their names: the house is <b>Home</b>, the magnifying glass <b>Search</b>, EN/ES <b>Translate</b>, the bubbles <b>Chat</b> and the signpost <b>More</b>. One tap on any of them works, thin or not.</p>
    <p>The names come back when you scroll up a little, when you reach the top or the very bottom of a page, and on every new page you open.</p>
    <p>It only changes when you scroll on purpose. Reading without touching the screen, or nudging the page a little, leaves it as it is. Dr. Smiley gets a little smaller with it.</p>` },
  { id:'askwhat', section:'ask', k:'ask the hub dr smiley doctor smiley assistant ai question chatbot help character', q:'Who is Dr. Smiley, and what can I ask him?', a:`
    <p>Dr. Smiley is the Hub's interpreter assistant. Ask him the way you'd ask a teammate: <i>How do I explain “ejection fraction”?</i> or <i>“Embarazada” or “embarrassed”?</i></p>
    <p>To ask him, tap him beside the tab bar (or his round button at the top right on a computer): a small panel opens right there, over the page you're on. You can also tap the smiley in the Home greeting, or go to <b>More</b> → <b>Ask the Hub</b> for the full screen.</p>
    <p>He answers from the Hub first: your glossary, False Friends, the Doctor Directory, the Code of Ethics and this guide. Every answer is labeled:</p>
    <ul>
      <li><b>From the Hub</b>: it comes from your team's own entries. Tap a source under it to see the entry.</li>
      <li><b>Not from the Hub</b>: general knowledge. It says <b>Double-check it</b>, and you should.</li>
      <li><b>Your correction · not checked</b>: it uses something you told him in this conversation. The team hasn't checked it.</li>
    </ul>
    <p>You can follow up the way you would with a teammate: <i>Make it simpler.</i> <i>Now in Spanish.</i> See <b>Can I ask a follow-up, or start over?</b></p>
    <p>He can also open things for you: a briefing, practice, a term. Tap the button he offers. He only says it's done once the screen is open.</p>` },

  { id:'askcards', section:'ask', k:'answer card english spanish bilingual side by side compare comparison difference checklist practice sources source loading stopped offline failed error new answer scroll dr smiley', q:'What are the cards in Dr. Smiley’s answers?', a:`
    <p>Each answer starts with <b>Dr. Smiley</b> and how sure it is (<b>From the Hub</b> or <b>Not from the Hub</b>), then the headline. When it fits, there's one card:</p>
    <ul>
      <li><b>A term</b>: the glossary's English (<b>EN</b>) and Spanish (<b>ES</b>), and its domain.</li>
      <li><b>Two terms</b>: side by side, for “What's the difference between that and the previous term?” A False Friend shows the Spanish word next to the English it looks like.</li>
      <li><b>A briefing</b>: a short checklist of what's in it.</li>
      <li><b>Practice</b>: the terms you're still learning, with what your Term Review record says (<i>Missed last time</i>, <i>Due today</i>). Tap one to see its Spanish.</li>
    </ul>
    <p>The cards only use the Hub's own entries, your briefing and your record. Any other answer is plain text. Under the answer, <b>Sources</b> opens the entry it came from.</p>
    <p>While he looks something up you'll see <b>Looking it up in the Hub…</b> and <b>Stop</b>. A stopped question, one waiting for a connection, or one that failed each says so, with what to do next. If you scroll up to reread while an answer arrives, you stay where you are and a <b>New answer</b> button takes you to it.</p>` },

  { id:'askquick', section:'ask', k:'ask quick panel dock bubble popup without leaving page close draft typing keyboard ring dot red blue busy dr smiley tap him', q:'How do I ask Dr. Smiley without leaving the page?', a:`
    <p>Tap Dr. Smiley beside the tab bar (on a computer, his round button at the top right). A small <b>Ask the Hub</b> panel opens just above him, over the page you're on.</p>
    <ol>
      <li>Type your question in the box and tap the arrow.</li>
      <li>The answer shows in the panel. A long one scrolls inside it.</li>
      <li>To close it, tap <b>✕</b>, tap him again, or tap anywhere outside. What you typed stays in the box for next time.</li>
    </ol>
    <p>While he looks it up, the panel says <b>Looking it up…</b> and you can tap <b>Stop</b>. You can close the panel and keep working: a ring turns around him until the answer is in, then a <b>blue dot</b> means it's waiting for you. If something goes wrong, the panel's edge turns red and offers <b>Try again</b>.</p>
    <p>It's the same conversation as the Ask screen. To see all of it, tap the arrows at the top of the panel, or go to <b>More</b> → <b>Ask the Hub</b>.</p>` },

  { id:'askexplain', section:'ask', k:'explain term plain spanish patient words simple dr smiley card menu', q:'How do I get a term explained in plain words?', a:`
    <ol>
      <li>Tap <b>⋯</b> on the term's card, then <b>Explain with Dr. Smiley</b>. On a computer it's a button on the card.</li>
      <li>Ask opens with that term picked. You'll see it just above the box.</li>
      <li>Tap <b>Explain</b>, or type your own question about it.</li>
      <li>In the 3D Body, a part's card has <b>Ask Dr. Smiley</b> too: he gets that part's checked names and explanation.</li>
    </ol>
    <p>You get the glossary entry, a plain way to say it to a patient, and where the entry came from.</p>` },

  { id:'askfollow', section:'ask', k:'follow up follow-up that it previous simpler easier spanish english again difference compare go back prep conversation new start over stop cancel', q:'Can I ask a follow-up, or start over?', a:`
    <p>Yes. Talk to him the way you would to a teammate:</p>
    <ul>
      <li><i>Make it simpler.</i> or <i>Now in Spanish.</i> He redoes his last answer.</li>
      <li><i>What's the difference between that and the previous term?</i> He keeps track of the terms you've talked about.</li>
      <li><i>Go back to my appointment prep.</i> He offers the briefing you were on.</li>
    </ul>
    <p>Above the box he shows what <b>that</b> means right now. If it could mean two things, he asks which one, with a button for each. If there's nothing to go on, he says so instead of guessing.</p>
    <p><b>Now in Spanish</b> lasts for this conversation only. To keep it, tap <b>Use Spanish in every conversation</b>.</p>
    <p><b>Stop</b>, next to the dots while he works, cancels a question. <b>New</b>, on Ask's banner at the top, starts a new conversation; what you asked him to remember stays.</p>` },

  { id:'askcorrect', section:'ask', k:'wrong answer incorrect correct this fix dr smiley teach improve team note approve', q:'Dr. Smiley got something wrong', a:`
    <p>Tap <b>Correct this</b> under the answer and write what works better. For example: <i>Many of our patients understand “azúcar en la sangre” better. Say that first.</i></p>
    <p>Your note goes to Jose. Nothing changes until he approves it. Once he does, it becomes a <b>team note</b> that Dr. Smiley uses for everyone, with your name on it.</p>
    <p>You can also just tell him in the conversation: <i>No, here we say “eco”.</i> He uses it for the rest of the conversation and labels those answers <b>Your correction · not checked</b>. It reaches the team only if you tap <b>Send to Jose for review</b> and he approves it.</p>
    <p>If the answer was useful, tap <b>Helpful</b>.</p>` },

  { id:'askremember', section:'ask', k:'remember preferences settings spanish english brief short detailed answers focus forget memory what do you remember', q:'Can he remember how I like my answers?', a:`
    <p>Yes. Just tell him:</p>
    <ul>
      <li><i>Remember I prefer brief answers.</i></li>
      <li><i>From now on explain things in Spanish.</i></li>
      <li><i>I'm studying oncology.</i></li>
    </ul>
    <p>He only says it's saved once it really is. To see or change what he remembers, tap <b>What I remember</b> on Ask's banner at the top, or in your name settings. Each choice has a <b>Forget</b> button.</p>
    <p>It stays <b>on this phone</b>, under the name set on it. Nothing goes to the team. If someone else sets their name on a shared phone, they start fresh.</p>` },

  { id:'askmoves', section:'ask', k:'animation moving distracting calm still focused lively motion turn off hide dr smiley follows wink laugh nod expressions brows eyebrows face faces surprised sad worried doubtful squash stretch spring bounce cheer quiz bounce wince streak right wrong answer', q:'Can I make Dr. Smiley move less, or hide him?', a:`
    <p>Tap your initial in the <b>top-right corner</b>. Under <b>How Dr. Smiley moves</b>, pick one:</p>
    <ul>
      <li><b>Lively</b>: his full expressions. A delighted hello, a nod when something is saved or right, a thoughtful look, a laugh when you do well, now and then a wink. His eyes follow your finger and he reacts to the team. His brows move with his face: up when he looks up or laughs, one raised while he thinks, and turned up softly in the middle when he isn't sure of an answer or is encouraging you. He acts, too: when he cheers or says hello he crouches and springs, squashing a little as he dips and stretching as he goes up, a quick eyebrow flash when he says hello, a startled look before he giggles when you hold him, an "aha" lift when a thought lands, and a worried look, then a reassuring smile, if the connection drops. He has faces for those moments: wide eyes and an "O" mouth when he's surprised, a tight mouth when he's worried, a doubtful squint when an answer comes from general knowledge instead of the Hub (check it), and a brief sad look when he couldn't help. In a CoreCHI quiz he sits in the dock and reacts to each answer: a little bounce when you're right, a small wince and then a kind smile when you're wrong, a laugh at 3, 5 and 10 right in a row, and a surprised look, then a cheer, on the first answer of a 3-, 7-, 14- or 30-day streak.</li>
      <li><b>Focused</b>: the same gestures, smaller and calmer, only for what you're doing. His brows move less. No laughing, no squash and stretch and no little sparkles.</li>
      <li><b>Still</b>: he doesn't move. A reaction shows as one still face, then his usual one. Your name on Home is simply there, without the light writing it.</li>
    </ul>
    <p>To take him off every page, turn off <b>Dr. Smiley follows me</b> on the same screen. You can still reach him from <b>More</b> → <b>Ask the Hub</b>.</p>
    <p>If your phone is set to reduce motion, he's always still.</p>` },

  { id:'brain', section:'ask', k:'brain humc brain 3d double tap double-tap head dr smiley hello home secret hidden scan map code how the app is built connectome network graph figures matrix not patient data', q:'What is the brain when I double-tap Dr. Smiley?', a:`
    <p>On Home, <b>double-tap Dr. Smiley's head</b> in the hello to open the <b>HUMC Brain</b>: a 3D picture of how this app is built. A single tap still opens Ask the Hub, and press and hold still pets him.</p>
    <p>Each glowing dot is one part of the app, sized by how big it is. Each line is one part using another. Parts that belong together sit in the same area: the shared core everything relies on in the middle, Dr. Smiley's moves on the top strip, Ask the Hub at the front.</p>
    <ul>
      <li><b>Turn it</b>: drag. <b>Zoom</b>: pinch.</li>
      <li><b>Tap a dot</b> to see that part's details and what it connects to. Tap a colour at the bottom to light up one area.</li>
      <li>Tap <b>Full workup</b> for charts: every connection in one grid, the busiest parts, and where the app's size goes.</li>
    </ul>
    <p>It looks like a scan and uses medical words for fun, but it's <b>not patient data</b> and not a medical image. It's the app's own code. Close it with the <b>X</b> at the top right or the Back button.</p>` },

  { id:'search', section:'find', k:'search look up find lookup word term', q:'How do I look up a word?', a:`
    <ol>
      <li>Tap <b>Search</b> at the bottom, or the search box on Home.</li>
      <li>Type any part of the word, in English or Spanish.</li>
      <li>Tap the result you want.</li>
    </ol>
    <p>You don't need the whole word. Typing <b>hemo</b> will find <i>hemorragia</i>. Search also finds doctors and answers from this guide.</p>` },

  { id:'accents', section:'find', k:'accent accents acento tilde enye typing keyboard special characters', q:'Do I have to type the accents?', a:`
    <p><b>No.</b> Type it the easy way.</p>
    <p>Searching <b>embolia</b> finds <i>embolía</i>. <b>medula</b> finds <i>médula ósea</i>. <b>nino</b> finds <i>niño</i>.</p>
    <p>It works the other way too, so it doesn't matter which way you type it.</p>` },

  { id:'notfound', section:'find', k:'missing cannot find not there nothing no results empty', q:"I know the word is in there, but I can't find it", a:`
    <p>Three things to try, in this order:</p>
    <ol>
      <li><b>Use the Search button at the bottom.</b> The search box <i>inside</i> a domain only looks in that one domain. The Search button looks everywhere.</li>
      <li><b>Try the other language.</b> If English isn't finding it, type the Spanish.</li>
      <li><b>Type less.</b> A shorter piece of the word matches more.</li>
    </ol>
    <p>Still nothing? It may not be there yet. That makes it a good one to add.</p>` },

  { id:'subgroups', section:'find', k:'subgroup subgroups folder section heading collapsed open hematology leukemia closed hidden up to parent all domains tiles tile grid', q:'Where are the smaller groups inside a domain?', a:`
    <p>Some domains have subgroups. Oncology, for example, has Hematology, Leukemia and Radiation. They're listed first, as headings, and start closed.</p>
    <ul>
      <li>Tap a <b>heading</b> to peek at its words right there.</li>
      <li>Tap <b>Open</b> on the heading to go into that subgroup.</li>
      <li>Inside one, <b>Up to Oncology</b> takes you to the parent. The arrow in the top-left still goes back one step.</li>
    </ul>
    <p>When you search, the groups with matches open by themselves.</p>
    <p><b>All domains</b> shows each domain as a colour tile with its picture. A <b>+</b> number on a tile counts its subgroups, and its terms count includes theirs. Tap a tile to open the domain; the arrow in the top-left brings you back to the tiles.</p>` },

  { id:'hear', section:'find', k:'hear listen audio sound speak pronounce pronunciation voice out loud', q:'How do I hear a word out loud?', a:`
    <p>Tap the small <b>speaker</b> button on the term's card. English and Spanish each have their own.</p>` },

  { id:'slang', section:'find', k:'slang profanity curse swear bad words vulgar hidden blurred strong words reveal', q:'Why are some slang words blurred?', a:`
    <p>In <b>Slang &amp; Profanity</b>, the strongest words are hidden until you tap them. That way the screen is safe to open next to a patient.</p>
    <p>Tap a card to reveal it. To show them all, turn off <b>Hide strong words</b> at the top of that domain. The setting stays on this phone only.</p>` },

  { id:'briefing', section:'prep', k:'briefing prep me prepare appointment specialty covering heading to words ready flashcards before', q:"I'm heading to an appointment. How do I prepare fast?", a:`
    <p>Ask Dr. Smiley: <i>I'm covering oncology. Prep me.</i> Or tap <b>Prep me for an appointment</b> in Ask and pick the specialty. Adding the doctor is optional.</p>
    <p>Your briefing has:</p>
    <ul>
      <li><b>Words to have ready</b>: about two minutes of cards. Tap a card to see the Spanish, then <b>Got it</b> or <b>Again</b>. The words you're still learning come first.</li>
      <li><b>Traps to watch</b>: the False Friends most likely to come up.</li>
      <li><b>Your doctor</b>: what Doctor Prep found, if you named one.</li>
    </ul>
    <p>Leave and come back and it picks up where you were.</p>` },

  { id:'appt', section:'prep', k:'start the appointment in appointment screen awake timer quick lookup during done', q:'What does “Start the appointment” do?', a:`
    <p>It turns the phone into a quick reference for while you're in the room:</p>
    <ul>
      <li>The screen stays on, as long as your phone allows it.</li>
      <li>One box looks up any word in English or Spanish, starting with that specialty. It warns you when a word is a False Friend.</li>
      <li>Dr. Smiley calms down and only blinks.</li>
    </ul>
    <p>Tap <b>Done</b> when you're finished. Afterwards, <b>Add new words</b> on the briefing is a good place to save anything you met in the room.</p>` },

  { id:'docprep', section:'prep', k:'doctor prep prepare appointment unknown specialty research before', q:"I have an appointment with a doctor I don’t know", a:`
    <p>Use <b>Doctor Prep</b>, on Home or under <b>More</b>. Every Doctor Prep button opens the research screen directly.</p>
    <ol>
      <li>Type the doctor's name.</li>
      <li>Add the specialty or hospital if you know it. It helps find the right person.</li>
      <li>Tap <b>Research</b> and give it a moment.</li>
    </ol>
    <p>You get their specialty and a list of terminology likely to come up, from the everyday words through to drug names and the false friends that catch people out. The doctor is saved in the Doctor Directory for the whole team.</p>
    <p><b>Doctors</b> is the broader hub for Doctor Prep and the Doctor Directory. A specialty-based appointment briefing is separate: ask Dr. Smiley to prep you for that specialty.</p>` },

  { id:'doctors', section:'prep', k:'doctors hub doctor prep research directory saved doctor tools menu', q:'What is Doctors?', a:`
    <p>Open <b>More</b> and tap <b>Open</b> beside the <b>Doctors</b> heading on a phone, or choose <b>Doctors</b> in the sidebar on a computer. It brings the two doctor tools together:</p>
    <ul>
      <li><b>Doctor Prep</b>: research a provider by name and prepare the terminology likely to come up.</li>
      <li><b>Doctor Directory</b>: open the research the team has saved, with their tips and photos.</li>
    </ul>
    <p>If you want to research someone now, choose <b>Doctor Prep</b> directly on Home or under <b>More</b>. For a specialty-based appointment briefing, ask Dr. Smiley to prep you for that specialty.</p>` },

  { id:'directory', section:'prep', k:'doctor directory list doctors notes sort menu specialty a-z alphabetical last name recent letters group other places count region north south', q:'What is the Doctor Directory?', a:`
    <p>A shared list of every doctor your team has looked up. Open <b>Doctors</b> → <b>Doctor Directory</b>, or choose <b>Doctor Directory</b> under <b>More</b>.</p>
    <p>It opens on your region's doctors. Tap <b>North</b>, <b>South</b> or <b>All</b> above the list to switch; a search always looks through every region. A doctor's region comes from where they work: tap the pencil, then <b>Where</b>. A doctor with no place yet shows in both regions. The number beside the title is how many doctors are in the list you’re looking at.</p>
    <p><b>Sort: Place</b>, at the right under the regions, is a menu: tap it to arrange the list by <b>Place</b> (where they work), <b>Specialty</b> (what they practice; a pediatric neurologist is under Neurology) or <b>A–Z</b> (by last name). In a long A–Z list, tap or slide along the letters on the right edge to jump. Your choice is kept on this phone. Every place has its own heading, even one with a single doctor, and each one folds. In Specialty, specialties with one or two doctors are together under <b>Other specialties</b>. Tap a bigger group’s heading to fold it away, or <b>Collapse all</b> beside Sort.</p>
    <p><b>Recent</b> shows the last doctors you opened on this phone; tap one to go straight to their page.</p>
    <p>Two to a row, each card shows their picture (or their specialty’s pin with their initials), specialty, floor (when it’s on file), and how many <b>terms</b>, <b>traps</b> (false friends, in red) and <b>tips</b> they have. No research yet? Tap <b>+ Prep terms</b> to look them up in Doctor Prep.</p>
    <p>Tap <b>+ Add</b> on the banner at the top, beside the number of doctors, to add a doctor. If the list finds possible duplicates or doctors on the old terminology, a yellow <b>things to tidy</b> button opens them in one place. To delete a doctor, open their page, tap the pencil, then <b>Delete</b>.</p>
    <p>Tap a doctor to open their page. The useful part is what you add by hand: tap <b>Add tip</b> and note how they phrase things, what they always explain, anything a newer interpreter would want to know before walking in.</p>` },

  { id:'doctorgaps', section:'prep', k:'needs info missing floor place research prep terms incomplete fill in gaps doctor directory filter', q:'How do I find doctors with missing information?', a:`
    <p>In the <b>Doctor Directory</b>, the small <b>need info</b> chip with an orange dot, under North, South and All, counts the doctors missing a specific place, a floor or prep terms. It counts the doctors you’re looking at: your region, or what you searched for.</p>
    <p>Tap it to show only those doctors. Each card says what’s missing, for example <b>Missing: floor, prep terms</b>. Tap a doctor, then the pencil, to add the place or floor. For prep terms, tap <b>+ Prep terms</b> on the card.</p>
    <p>While it’s on, the chip reads <b>Needs info</b> with the count and an <b>✕</b>, and the title says how many need info. Tap the chip to go back to the full list. Photos don’t count as missing: plenty of doctors will never have one.</p>` },

  { id:'doctorpage', section:'prep', k:'doctor page terms tabs core procedures drugs anatomy false friends team terms hear listen speak english spanish start appointment flashcards tip research again glossary', q:'What is on a doctor’s page?', a:`
    <p>Tap a doctor in the <b>Doctor Directory</b>. At the top: their name, specialty and picture (or their specialty’s pin with their initials). Under it, how many prep terms there are, <b>Where</b> they work, and the first <b>Team tip</b> with how many there are (tap it to read them all).</p>
    <p>The tabs show the terms one group at a time: <b>Core</b>, <b>Procedures</b>, <b>Drugs</b>, <b>Anatomy</b>, <b>False friends</b> (in red) and <b>Team terms</b>, the ones your team added by hand. The tabs stay at the top while you scroll. Tap <b>EN</b> or <b>ES</b> on a term to hear it, or <b>+ Glossary</b> to keep it. Terms Doctor Prep found say <b>From Doctor Prep, not checked by the team</b>: check them before you rely on them. <b>Research again</b> updates what Doctor Prep found; your tips, photo and team terms are kept.</p>
    <p>The bar at the bottom: <b>Start appointment</b> (with this doctor; if you’re already in one with them, it takes you back to it), <b>Flashcards</b> (the briefing for their specialty) and <b>Add tip</b>. The pencil at the top edits the doctor: name, specialty, where, photo.</p>
    <p>No connection? The page shows what this phone has saved; the doctor’s prep terms come back once the directory loads.</p>` },

  { id:'teamtips', section:'prep', k:'team tips tip notes note doctor directory add edit delete my own quirks phrase before walking in', q:'How do team tips on a doctor work?', a:`
    <p>A tip is what a teammate should know before walking in with this doctor: how they phrase things, what they always explain, how they like the interpreter to stand. Open the doctor’s page and tap <b>Add tip</b> at the bottom, or the yellow <b>Team tip</b> card.</p>
    <p>The sheet shows every tip, oldest first, with who wrote it and when. Write yours in the box and tap <b>Add tip</b>. Your own tips have <b>Edit</b> and <b>Delete</b>; other people’s you can read but not change. If two of you add a tip at the same moment, both are kept.</p>
    <p>A doctor’s old single note shows as the first tip. Anyone can edit or delete that one, as before. Notes are no longer on the doctor’s edit sheet; tips are where they live now.</p>
    <p>Tips are shared with the whole team. Never put patient details in one.</p>` },

  { id:'places', section:'prep', k:'where location place hospital building site office clinic group icon picture change add new place region move north south other places pencil doctor directory provider pictures floor suite unit', q:'How do I set where a doctor or provider works?', a:`
    <p>On the doctor’s or the provider’s sheet, tap <b>Where</b>. A list of places opens: your region’s first, then the other region’s, then any others. Search by name, or tap <b>Add a place</b> for one that isn’t there (give it a name and pick North or South). The floor, suite or room (for a provider, the department or unit) goes in the box under it.</p>
    <p>To put a place in the right region, tap the pencil beside it in that list, pick <b>North</b> or <b>South</b> and tap <b>Save</b>. Its doctors move to that region’s list for everyone. The network’s own hospitals have no pencil: their region is fixed.</p>
    <p>Each place has a picture, from the same set as the Home pins. Tap the picture beside a place’s name in the Doctor Directory to change it. The places and pictures are shared: what you add or change, the whole team sees, in Provider Pictures too.</p>` },

  { id:'providers', section:'prep', k:'provider pictures photos healthcare providers face name specialty facility hospital where place unit department', q:'What is Provider Pictures?', a:`
    <p><b>Provider Pictures</b> helps you put a face to a name. Open it from Home or under <b>More</b>.</p>
    <p>Search by name, specialty, place or unit. Tap a photo to see it full screen. To add someone your team works with, tap <b>+ Add provider</b>.</p>
    <p>Where they work is picked from the same list of places as the doctors (tap <b>Where</b>, then the place, or <b>Add a place</b>), so a hospital's doctors and providers sit under the same heading with the same icon. <b>Department or unit</b> is a line of your own, like "Infusion, 2nd floor".</p>
    <p>Use <b>Doctor Prep</b> to research a doctor. Use <b>Doctor Directory</b> for the research and notes your team has already saved.</p>` },

  { id:'falsefriends', section:'prep', k:'false friends cognates traps embarazada constipado misleading similar words drill', q:'What are False Friends?', a:`
    <p>Words that look like English but mean something else, like <i>embarazada</i> (pregnant, not embarrassed). Each one says what it looks like, what it really means and what to say instead.</p>
    <p>Open <b>False Friends</b> from Home or <b>More</b>. <b>Study</b> lists them all, and <b>Drill</b> quizzes you on them.</p>` },

  { id:'soundalikes', section:'prep', k:'sound alikes soundalikes homophones groups practise drill by ear study the list sound the same heel heal ileum ilium vaso bazo hear listen drill speaker pronounce misheard hypotension hypertension', q:'What are Sound-Alikes?', a:`
    <p>Words that sound the same, or nearly, but mean different things, like <i>ileum</i> (bowel) and <i>ilium</i> (hip bone), or <i>vaso</i> and <i>bazo</i>. When you hear one, context is all you have to pick the right meaning.</p>
    <p>Open <b>Sound-Alikes</b> from Home or <b>More</b>. The blue card at the top plays one pair: tap its speaker to hear that <i>ileum</i> and <i>ilium</i> match. <b>Drill by ear</b> drills every set, and <b>Study the list</b> shows them all.</p>
    <p>Under <b>Your groups</b> there are three: <b>Sound the same</b>, <b>Sound close</b> and <b>Heard in Spanish</b>. <b>List</b> shows that group, and <b>Practise</b> drills just that group. In the list, tap a speaker to hear a word or its sentence, or <b>Hear them all</b>. <b>All groups</b> takes you back.</p>
    <p>In a drill the phone says a sentence and you pick the right rendering for the sound-alike in it. <b>Hear again</b> and <b>Slower</b> replay it; <b>Show the words</b> shows the sentence with the word blanked out, for a noisy hallway or a phone with no voice. <b>Exit</b> leaves the drill.</p>
    <p>It uses your phone's own voice, and nothing is saved. The renderings are marked until a staff interpreter has checked them.</p>` },

  { id:'credits', section:'team', k:'credit credits idea ideas domain domains glossary terms by banner whose idea thanks thank who came up with suggested suggestion double tap double-tap title tag lightbulb purple owner give credit edit remove', q:'Whose idea was this screen?', a:`
    <p>Some screens carry a small purple tag under their title, like <b>Sylvia's idea</b> on Sound-Alikes. It names the teammate who came up with that screen, wrote what is in it, checked its Spanish or tested it.</p>
    <p>A glossary domain or subgroup can carry one too, on its colour banner under the number of terms, like <b>Terms by Sylvia</b> on Hematology: who came up with it, suggested it (<b>Created at Sylvia's suggestion</b>), added its terms, checked their Spanish or reviewed them.</p>
    <p>Tap the tag, or double-tap the screen's title, to see the card: their name, what they said when they suggested it, and who gave the credit. <b>Close</b>, or a tap outside it, puts it away.</p>
    <p><b>Owners:</b> double-tap any screen's title, or a domain's name on its banner, to give it a credit. Type the name, add their words if they want them shown, pick what the credit is for, and tap <b>Save</b>. Ask the person first. To change one, open its card and tap <b>Edit</b>; <b>Remove</b> is in there too.</p>
    <p>A credit belongs to the screen with that title. A group's drill or list has a title of its own, so it shows no tag. A domain's credit belongs to that domain alone, not its parent or its subgroups, and stays if the domain is renamed.</p>` },

  { id:'lookup', section:'prep', k:'look up source medlineplus reference link definition web check card button', q:'What does “Look up” on a card do?', a:`
    <p>It searches trusted medical sites for that term right now, in English and Spanish, and shows the pages it found with a short preview. Use it to check a definition or find a patient-friendly page.</p>
    <p>If a teammate saved a link on the term, <b>Source</b> opens that exact page.</p>` },

  { id:'translate', section:'prep', k:'translate translation ai lookup unknown word', q:'What is Translate, and when should I not use it?', a:`
    <p>It looks in your team's glossary first. If nothing's there, it gives you a breakdown: the clinical wording, a plain-language version for a patient, notes on how formal it sounds, how it changes by country, and a warning if it's a false friend.</p>
    <p><b>Use it to prepare and to build the glossary.</b> It is a reference, not an interpreter, and it is never a substitute for you in the room.</p>` },

  { id:'add', section:'change', k:'add new create enter put in word term', q:'How do I add a word?', a:`
    <ol>
      <li>Open the domain it belongs to and tap <b>+ Add</b>, beside the search box at the bottom of its colored banner. Or tap <b>Add Term</b> on Home.</li>
      <li>Fill in the English, the Spanish, and a short definition.</li>
      <li>Check the domain is right, then tap <b>Save</b>.</li>
    </ol>
    <p>Everyone on the team sees it within a few seconds. You don't need to tell them.</p>` },

  { id:'edit', section:'change', k:'edit change fix correct update wrong mistake pencil dots menu', q:'How do I fix a word that is wrong?', a:`
    <p>Tap <b>⋯</b> on the term's card, then <b>Edit term</b>. Make your change and tap <b>Save</b>. On a computer, the pencil on the card does the same.</p>
    <p>Anyone on the team can fix anything. Nothing is locked, and every change is kept in the term's history.</p>` },

  { id:'secondlook', section:'change', k:'second look warning popup box message appeared check suggestion false friend', q:'A box appeared after I saved. What is it?', a:`
    <p>It's called <b>A second look</b>. It only shows up when there might be something worth checking: a false friend, a word that already exists under another domain, or wording a patient wouldn't use.</p>
    <p><b>Your term is already saved.</b> The box cannot undo that and cannot change anything on its own.</p>
    <ul>
      <li>Tap <b>Looks right</b> if you're happy. You're the interpreter, it isn't.</li>
      <li>Tap <b>Edit the term</b> if it caught something real.</li>
    </ul>
    <p>Most of the time you'll never see it.</p>` },

  { id:'history', section:'change', k:'history previous version old undo revert restore who changed', q:'Can I see what a word said before someone changed it?', a:`
    <p>Yes. The last ten versions of every term are kept.</p>
    <ol>
      <li>Tap <b>⋯</b> on the term's card, then <b>Edit term</b>.</li>
      <li>Tap <b>View edit history</b>.</li>
      <li>You'll see who changed it and when. You can put an older version back.</li>
    </ol>` },

  { id:'deleted', section:'change', k:'delete deleted undo restore trash bin recover accident gone', q:'I deleted something by accident', a:`
    <p>It isn't gone.</p>
    <p>Right after deleting, a small bar appears at the bottom with an <b>Undo</b> button. That's the fastest way back.</p>
    <p>If you missed it, open <b>More</b> → <b>Recently deleted</b>. Everything stays there for 30 days.</p>` },

  { id:'attach', section:'change', k:'attach attachment photo picture image pdf file document upload paperclip', q:'Can I attach a photo or a PDF to a word?', a:`
    <p>Yes. A diagram, a consent form, a photo of a whiteboard.</p>
    <p>Tap <b>⋯</b> on the term's card, then <b>Attach photo or PDF</b>, and pick the file. It appears on the card for everyone.</p>` },

  { id:'domain', section:'change', k:'new domain create category list rename color pin icon edit domain specialty', q:'How do I start a new domain, or rename one?', a:`
    <p><b>New domain:</b> tap <b>+ New</b> next to Medical Terminology on Home. Or, inside any domain, tap <b>⋯</b> in its colored banner, then <b>New domain</b>.</p>
    <p><b>Rename it, or change its color or pin:</b> open the domain, tap <b>⋯</b> in its banner, then <b>Edit</b> and the domain's name.</p>` },

  { id:'regions', section:'team', k:'region regions north south shore humc channel channels everyone separate group team doctors directory my region pins pinned events top bar hackensack meridian health', q:'What are North and South?', a:`
    <p>The Hub is shared by two interpreter teams: the <b>North</b> region (the HUMC side) and the <b>South</b> region (the Shore side). Nobody is walled off: everyone can read everything.</p>
    <p>Your region decides a few things. <b>Team Chat</b> has three channels, <b>Everyone</b>, <b>North</b> and <b>South</b>; Everyone and your region notify you, and the other region's channel only shows a count on its tab. A pin belongs to the channel it was pinned in: Everyone's pins show in every channel, a region's only in its own. The <b>Doctor Directory</b> opens on your region's doctors; tap <b>All</b> to see every doctor, and a search always looks through all of them.</p>
    <p>Under the Hub's name at the top, North reads <b>Hackensack University Medical Center</b> and South reads <b>Hackensack Meridian Health</b>. An event someone adds to <b>Training &amp; Events</b> can carry a North or South tag; everyone still sees it.</p>
    <p>Pick your region under your initial in the top-right corner, or when Chat or the Doctor Directory asks.</p>` },

  { id:'chat', section:'team', k:'chat message text team talk send photo channel everyone north south', q:'How do I message the team?', a:`
    <p>Tap <b>Chat</b> at the bottom. Pick a channel at the top: <b>Everyone</b> reaches both regions, <b>North</b> or <b>South</b> just that region (anyone can still read it). Type and send, like any messaging app.</p>
    <p>The <b>paperclip</b> sends photos or a PDF. Tap a photo to see it full screen.</p>` },

  { id:'chattitles', section:'team', k:'admin administrator developer supervisor title tag badge name leader owner liz lind fabiola jose language services who runs chat ribbon star give title account team access impostor fake', q:'What are the Administrator and Supervisor tags in Chat?', a:`
    <p>Some names in <b>Team Chat</b> have a title under them, so you can tell who leads the team.</p>
    <p><b>Administrator</b> (a small outlined tag) is Fabiola, and anyone who joined the Hub with the <b>owner code</b>. <b>Developer</b> is Jose Vazquez, who builds the app. <b>Supervisor of Language Services</b> (a blue ribbon with a star) is Liz Lind.</p>
    <p>A title can also belong to someone's <b>account</b>: the owner gives it on <b>Team access</b> (the <b>Title</b> button beside anyone signed in with their email). Then it shows only on messages from that account, on every phone, and typing that person's name on another phone no longer gets it. Messages they sent before signing in lose it too, and messages from two different phones under the same name never run together under one title.</p>
    <p>In Chat, titles show above other people’s messages, not your own. Your own title shows on <b>Home</b>, in a ribbon under the heart line beneath your name.</p>` },

  { id:'mention', section:'team', k:'mention tag notify attention at symbol someone specific person', q:'How do I get one person’s attention?', a:`
    <ol>
      <li>Type <b>@</b> in the message box.</li>
      <li>A list of names appears. Tap the one you want.</li>
      <li>Finish your message and send.</li>
    </ol>
    <p>Their name shows up highlighted, and the message stands out for them when they open Chat.</p>` },

  { id:'pin', section:'team', k:'pin pinned announcement important update top of chat keep notice region north south channel', q:'How do I pin something important for everyone?', a:`
    <p>In Team Chat, tap the <b>pin</b> at the top and write the update, like a new CE requirement or a changed protocol.</p>
    <p>Pinned updates stay in a bar at the top of Chat, so they don't get lost in the scroll. Tap the bar to see them all. Anyone can unpin one when it's no longer needed.</p>
    <p>A pin goes where you are. Pinned in <b>Everyone</b>, it shows in every channel; pinned in <b>North</b> or <b>South</b>, only in that channel, marked "North only" or "South only". The sheet says which before you pin.</p>` },

  { id:'notifications', section:'team', k:'notifications push notify alert alerts closed lock screen badge phone banner sound iphone home screen send owner administrator message team broadcast test not arriving not working', q:'How do I get notifications on my phone?', a:`
    <ol>
      <li>Open <b>More</b> → <b>Notifications</b>.</li>
      <li>Tap <b>Turn on notifications</b> and allow them when your phone asks.</li>
      <li>Pick what you hear about: <b>Team Chat</b> (Everyone, your region, and anything that @mentions you), <b>Training &amp; Events</b> (new CE and webinars) and <b>Team updates</b> (terms added or edited).</li>
    </ol>
    <p>Team Chat and training arrive like any app’s notifications, even with the Hub closed, and the Hub’s icon shows how many are waiting. Tap one to open that screen. Team updates only show while the Hub is open.</p>
    <p><b>On iPhone</b> they only work from the Home Screen app (iOS 16.4 or later): in Safari tap <b>Share</b> → <b>Add to Home Screen</b>, open the Hub from its icon, then turn them on there.</p>
    <p>Not arriving? On the same screen tap <b>Send me a test</b> and lock the phone. If it doesn’t show, check the phone’s Settings → Notifications → Interpreter Hub, or tap <b>Turn off</b> and turn them on again.</p>
    <p><b>Owners</b> (phones that joined with the owner code) also see <b>Send to the team</b> there: write a title and a message and it goes to every phone with notifications on. The last ones sent are listed under <b>From the team</b> for everyone.</p>` },

  { id:'updates', section:'team', k:'bell notification updates activity feed what changed news', q:'What is the bell at the top of the screen?', a:`
    <p>It tells you what your teammates have changed: terms added, terms edited, announcements posted.</p>
    <p>Tap it to read them. You can also find the full list under <b>More</b> → <b>Recent Updates</b>.</p>` },

  { id:'practice', section:'study', k:'practice quiz test exam corechi cchi study certification ready readiness dashboard scores trend chart focus next weakest campus buildings city game hospital streak flame squash spring press daylight cherry blossom flowers fountain 3d three-d rotate turn spin zoom pinch finished preview parallax depth drag time of day sun sunrise sunset night moon hour slider now toy model ambulance emergency traffic light signal stop sign lane one-way crosswalk pedestrians people walking doors wheelchair helicopter helipad atlantic street visitors parking garage employee garage gate entrance floors height link pavilion helena theurer jurist medical plaza tap a person people bench plaza word glossary term review show got it missed it weather sun rainbow sky streak days in a row', q:'How do I practice for the CoreCHI exam?', a:`
    <p>Open <b>More</b> → <b>CoreCHI Practice</b> and start a quiz.</p>
    <p>Questions are spread across the five official exam areas in the same proportions as the real thing. At the top is <b>your HUMC campus</b>: the whole medical center as a little toy model on a floating board in soft daylight, every building where it really stands, laid out from OpenStreetMap's building outlines (© OpenStreetMap contributors), with the streets around it: Prospect Avenue in front, Atlantic Street on the left, Second Street at the back. Each exam area is one building (Ethics the George Link Jr. Pavilion at the end of the main drive, with the helipad on its roof; Terminology the Helena Theurer Pavilion, the big curved glass tower at the back; U.S. Health Systems the Jurist Research Center, the brick building on the left of the drive; Encounter John Theurer Cancer Center, at the back on the left across Second Street; Cultural Responsiveness the Medical Plaza, the maroon tower on the right of the drive). A building starts in plain white, like an unpainted model, and fills with its real colours from the ground up as you master it; warm lights come on in the floors you've mastered. After practice that moved you up, you'll see the colour climb the building a floor at a time, with a little flash at the top. The big number is how ready you are. Each building's badge shows its exam area and how much of it is painted. Tap a building or its badge to pick it: it shows in full colour, the rest of the campus dims, and a card under the picture names the exam area with its number of questions and its share of the exam. Tap <b>Practise</b> (or the same building again) to start; tap the empty campus or the × to put it back. Tap <b>3D</b> at the bottom left of the picture to explore the same real campus full screen: drag with one finger to move over it, pinch to zoom, twist two fingers to turn it, slide two fingers up or down to tilt, tap a building to fly to it and see its card with <b>Practise</b>, and the round arrow button takes you back to the front view. Turn on <b>See it finished</b> to see how it will look once you have mastered every area (in 3D each building stands as tall as the share you have learned). When you finish an area (every one of its questions known), its building celebrates once: fireworks over the roof right after the last of the paint goes on, a <b>Finished</b> ribbon under its badge for that visit, and the badge turns gold with a star for good. The sun in 3D is where the real sun is over HUMC at that hour today: up behind the campus in the morning, to the south at midday, setting behind you in the evening, and the light, the shadows and the sky follow it, with the windows lit at night. Slide the <b>time bar</b> at the bottom to see the campus at any hour; <b>Now</b> puts it back on your clock. The × or Back closes it. Dr. Smiley stands by the one worth painting next, and <b>Play</b> starts what's next. The campus is alive: cars come up the drive to the drop-off at Link Pavilion, turn round and leave, and drive along the streets round the campus in their own lanes, an ambulance drives up Atlantic Street with its lights going, pulls up at the emergency entrance and opens its back doors, a car backs out of a spot on the top deck of the Visitors Parking garage and heads off down the aisle, a helicopter lands on Link Pavilion's helipad, people walk the sidewalks and cross at the crosswalks, nurses come out of the Jurist building and walk to Link Pavilion, people sit on the benches by the street and stand about chatting, turning now and then, a flock of birds crosses the sky, the flags wave and the fountain plays. In <b>3D</b> the cars parked in the lots, on the garage roofs and along the drive are the same little toy models, and the cars (little toy sedans, SUVs, vans, taxis and an ambulance) drive like real traffic: they keep to the right-hand lane, go the way the map says (the main drive is one-way: in on the right, round behind the fountain, out on the left), turn on a curve, come to a full stop at the stop signs, obey the traffic light where Prospect Avenue meets Essex Street, stop for anyone crossing in front of them, wait their turn at corners and never bump into each other. The ambulance turns off Atlantic Street into the emergency department's court, waits at the doors, then leaves down Atlantic. The people in 3D walk like real people too, legs and arms swinging in step: they keep to their side of the sidewalk and step aside for someone coming the other way, never walk through anyone, cross only at the crosswalks after waiting at the curb for a gap in the traffic, and come out of and go into real doors (Link Pavilion's revolving door in the drive-through, Jurist's, Medical Plaza's, the Cancer Center's). A couple walks side by side and falls into single file to pass a tree, a child follows a step behind a parent, a wheelchair goes slowly with the one pushing it, and people wait and chat by the main entrance and outside the emergency department's doors. Cars and people passing behind a building go out of sight until they come out the other side. Each building in 3D has the number of floors the hospital and the firms that built it give for it, where they give one (the Helena Theurer Pavilion nine, the Medical Plaza nine, the Jurist building five), and the garages have their gates where the driveways meet them, two of the Employee garage's on Second Street, one right under the pavilion's bridge. The sky and the board's shadow behind it sit at their own depth: they slide a little as you scroll past, and when you drag a finger sideways across the picture they move behind the buildings and spring back when you let go (a drag never picks a building). It all pauses while the campus is off screen. Under it, <b>Your scores</b> draws a line through your last 12 sessions: tap a point to see that session's score and date, tap it again to go back to the latest. <b>Focus next</b> names the area costing you the most on the exam, with <b>Practise it</b> to start on it. Press and hold any card and it tips toward your finger, then springs back when you let go.</p>
    <p><b>The people on the campus have a word for you.</b> Tap the group standing by the bench, on the plaza or on the path (three small dots float over the group holding today's word) and someone asks you a term from your glossary in English. Say it in Spanish, tap <b>Show</b> to see it, then <b>Got it</b> or <b>Missed it</b>: your answer is saved like a Term Review answer, so your knowledge brain and your due list move. It does not count toward the day's questions or your streak; those are for the exam questions. Tap a building's wall and you still get the building.</p>
    <p>The campus's ambulance, helicopter and benches are 3D models made with Meshy (meshy.ai) and slimmed down in Blender so they stay smooth on a phone, and the leaves on its trees are painted from a Meshy tree; the cherry trees are in full sakura blossom.</p>
    <p><b>The sky follows your streak.</b> Study three days in a row and the sun comes out at the left of the sky; seven days and a rainbow arcs over the campus. Nothing bad ever happens to the sky: a missed day just means plain daylight, and the next streak brings the sun back.</p>
    <p>Right under the campus, <b>Your domains</b> lists one row per building: how much of its question bank you've learned, how often you got it right in your sessions, and a <b>Practise</b> button. After each quiz you'll see which areas you're strongest and weakest in, which is the part worth paying attention to.</p>
    <p>The buttons here give a little springy squash when you press them, and the flame next to your study streak flickers. If your phone is set to reduce motion, they stay still.</p>
    <p>These are practice questions written for studying. They are not real exam questions.</p>` },

  { id:'review', section:'study', k:'review flashcards study memorize spaced repetition drill still learning practice five terms session specialty pause resume mistakes', q:'What is Term Review?', a:`
    <p>Short practice sessions from your own glossary, under <b>More</b> → <b>Term Review</b>.</p>
    <ol>
      <li>Pick a specialty (or all of them) and a length: 5, 10 or 15 terms.</li>
      <li>Terms you missed come first, then the ones due for review, with something new for variety. Each card says why it's there, like <b>Missed last time</b> or <b>Due: last seen 4 days ago</b>.</li>
      <li>Type the Spanish and tap <b>Check</b>, or tap <b>Show answer</b> and say whether you had it.</li>
    </ol>
    <p>Missed one? He says what tells it apart, and <b>Try it again later</b> brings it back a few cards on. At the end you see what moved up a step and your mistakes, with <b>Practise these again</b>. Your recent mistakes are also on the Term Review page.</p>
    <p><b>Pause</b> keeps your place on this phone, even if the app closes. Ask Dr. Smiley to <i>practice five terms I'm still learning</i> and he opens Term Review with just those.</p>` },

  { id:'knowledgebrain', section:'study', k:'knowledge brain my brain your knowledge 3d term review top small turning session summary glow see it in your brain terms dots lit light up dark known learning missed due practise practice coverage weakest progress over time corechi tile', q:'What is my knowledge brain?', a:`
    <p>Open <b>Term Review</b>: the small turning brain at the top is yours. Tap it to open it full screen. You can also open it from <b>CoreCHI Practice</b>, on the <b>Your knowledge brain</b> tile. It's your glossary drawn as a 3D brain: every dot is a term, each domain is one area.</p>
    <p>A dot <b>lights up</b> as you get the term right in Term Review, the Daily Drill and Doctor Prep flashcards. <b>Faint</b>: not practised yet. <b>Red</b>: missed last time. <b>Dim</b>: due again. A term counts as known after three right answers in a row.</p>
    <ul>
      <li><b>Turn it</b>: drag. <b>Zoom</b>: pinch.</li>
      <li><b>Tap a domain</b> at the bottom (or a row under Your progress) to see what to practise first, then <b>Practise</b> to start Term Review on it.</li>
      <li><b>Tap a dot</b> to see that term and how you're doing, then <b>Open the card</b>.</li>
      <li><b>After a Term Review session</b>, the summary shows that session in your brain: the terms you got right glow on one by one, the ones you missed flash red. Tap <b>See it in your brain</b> to open the full brain turned to those terms.</li>
      <li><b>Your progress</b> below the brain: your domains weakest first, what you missed or is due, and a line of terms known over time. That line starts the day you first open it; one count a day is kept on your phone.</li>
    </ul>
    <p>It shows only <b>your own</b> record. It's separate from the brain you get by double-tapping Dr. Smiley's head, which is a map of the app's own code. Close it with the <b>X</b> at the top right or the Back button.</p>` },

  { id:'reviewcheck', section:'study', k:'term review check answer accent accents capital wrong right spanish variant alternative regional compare self check saved not saved', q:'How does Term Review check my Spanish?', a:`
    <p>Against your team's glossary, never a guess.</p>
    <ul>
      <li><b>Accents and capitals</b> don't make an answer wrong. If an accent is missing, he shows how it's written.</li>
      <li><b>Other wordings in the glossary</b> count too: another entry for the same English term, or a word in brackets like <i>Guayabo (Resaca)</i>.</li>
      <li><b>Not sure?</b> If your answer is close, is another entry's Spanish, or is a regional word, he shows yours next to the glossary's and you decide: <b>Same meaning, count it</b> or <b>I missed it</b>.</li>
      <li><b>Wrong</b> only when it's blank, “no sé”, or the false friend for that term.</li>
    </ul>
    <p>An answer counts once it's saved. Offline it's kept on this phone and sent later. If it couldn't be saved, the card says so with <b>Try saving again</b>.</p>` },

  { id:'warmup', section:'study', k:'daily drill warm up warmup daily question streak today home card rounds level trap false friend listen hear write judgment call timer score personal best', q:'What is the Daily Drill on Home?', a:`
    <p>Three short rounds a day, about two minutes. Tap the <b>Daily Drill</b> card on Home.</p>
    <ol>
      <li><b>Catch the trap</b>: a patient's line in Spanish with a false friend in it (“Mi hijo está intoxicado…”). Type how you'd say it in English. Using the trap word (“intoxicated”) is a miss; otherwise compare yours with the accurate rendering and decide.</li>
      <li><b>Hear it, write it</b>: a glossary term, one you're still learning when there is one. Write the Spanish. It's checked like Term Review and goes into your record.</li>
      <li><b>The judgment call</b>: a CoreCHI question on your role, the encounter or culture, with the explanation after.</li>
    </ol>
    <p>Then your score and time. Get all three right and tomorrow moves up a level: <b>Reading</b>, <b>Listening</b> (the term is heard first), <b>Consecutive</b> (the patient's line too) and <b>Under pressure</b> (a clock on every round). Miss two and it eases back. Nothing plays out loud until you tap <b>Play</b>, and the words are always a tap away.</p>
    <p>Close it halfway and it keeps your place. Finish on the days you work and the dots fill in, so you can see your streak.</p>` },

  { id:'rank', section:'study', k:'level rank points dr smiley resident career team points score progress outfit hat', q:'Why does Dr. Smiley have a level?', a:`
    <p>That's the <b>team's</b> score, not yours. Every term anyone adds and every practice question anyone answers earns a point, and as the points add up Dr. Smiley moves up a rank and gets something new to wear, like a scrub cap or a head mirror.</p>
    <p>Tap his card on Home to see the ranks and who helped this week.</p>` },

  { id:'ethics', section:'study', k:'code of ethics ncihc cchi principles confidentiality impartiality standards professional conduct', q:'Where is the Code of Ethics?', a:`
    <p><b>More</b> → <b>Code of Ethics</b>. It has the key principles and the conduct that's not allowed, in plain words, most with an example of what it looks like in practice.</p>
    <p>These are short summaries based on the NCIHC and CCHI codes, not the official text.</p>` },

  { id:'events', section:'study', k:'training events ce continuing education credits webinar conference hours region north south tag', q:'Where do I find CE and training opportunities?', a:`
    <p><b>More</b> → <b>Training &amp; Events</b> lists upcoming continuing-education opportunities. CHIA, CCHI and NCIHC are checked once a day and new items appear on their own. Cross-Cultural Communications blocks automated checks, so their trainings show up only when someone adds them with <b>+ Add</b>. When you add one, <b>For</b> can mark it North or South (a local in-service, say); it gets a small tag and everyone still sees it. For a requirement the whole team needs to see, pin it in Team Chat.</p>` },

  { id:'body', section:'study', k:'3d body anatomy model organ muscle bone heart rotate zoom human atlas', q:'What is 3D Body?', a:`
    <p>A model of the human body you can turn and zoom. Tap any part to see its card. It's handy when a doctor points to something you can't picture.</p>
    <p>Open it from Home or <b>More</b> → <b>3D Body</b>. The first time, it downloads about 33&nbsp;MB, so Wi-Fi is best. It's quicker after that.</p>
    <p>For 30 common structures (the heart, liver, kidney, femur and others) the card gives the English and Spanish names and what it is. See “What does a body part’s card show?”</p>` },
  { id:'bodycard', section:'study', k:'3d body card spanish name body part organ bone anatomy pronounce hear practice glossary dr smiley sources riñón corazón', q:'What does a body part’s card show?', a:`
    <ol>
      <li>In the 3D Body, tap a part, or tap the magnifier and type its name.</li>
      <li>The card shows the <b>English name</b>, the <b>Spanish name</b> under it, and one or two sentences on what it is. Tap <b>EN</b> or <b>ES</b> to hear it.</li>
      <li><b>Open glossary</b> and <b>Practice this term</b> work when the Hub glossary has that word. <b>Ask Dr. Smiley</b> always works; he gets the card with your question.</li>
      <li>Tap <b>⌃</b> for more: notes on the Spanish, and <b>Sources</b>. Tap <b>Isolate</b> to see the part on its own.</li>
    </ol>
    <p>The names and explanations were checked against the Clínica Universidad de Navarra medical dictionary and the National Cancer Institute; each card lists its own sources. Parts outside those 30 show <b>Spanish name not added yet</b> and a note <b>About this body system</b> instead.</p>
    <p>Tapping Practice doesn't count as an answer: only what you answer in Term Review is saved. Back brings you to the same part, view and card.</p>` },

  { id:'zoom', section:'trouble', k:'zoom text small bigger larger font size magnify pinch double tap read see', q:'The text is too small. Can I zoom in?', a:`
    <p>Yes: <b>pinch with two fingers</b> to zoom in, and pinch back to zoom out.</p>
    <p>A double tap doesn't zoom. That way two quick taps on a button never jump the whole screen.</p>` },

  { id:'offline', section:'trouble', k:'offline no signal wifi data connection basement elevator internet down airplane', q:'Can I use it where there is no signal?', a:`
    <p><b>Looking things up: yes.</b> The glossary is stored on your phone, so a basement or an older wing is fine.</p>
    <p><b>Adding or changing something: also yes.</b> It's saved on your phone and sent up on its own the moment you have signal again. You don't have to remember to do anything.</p>
    <p><b>Dr. Smiley: partly.</b> He can still open your briefing, your practice and a term's glossary entry. Other questions wait on the phone and are asked by themselves once you're back online. Tapping <b>New</b> on Ask's banner (a new conversation) drops the ones still waiting.</p>
    <p>Translate, Doctor Prep and Look up need a connection.</p>` },

  { id:'waiting', section:'trouble', k:'offline waiting sync unsent pending saved not sent stuck sending', q:'It says “Offline — 1 change waiting”', a:`
    <p>That's the app being honest with you. Your change is <b>saved on this phone</b> and is waiting for a connection.</p>
    <p>You don't need to do anything. When you're back on wifi or data it sends by itself and the message disappears.</p>
    <p><b>Please don't retype it.</b> You'd end up with two copies.</p>` },

  { id:'unsent', section:'trouble', k:'didn’t sync didnt sync unsent failed error red warning storage full queue full review changes', q:'It says a change “didn’t sync”', a:`
    <p>The team's database refused it, so it's being kept on this phone instead of lost.</p>
    <ol>
      <li>Tap the message at the top of the screen.</li>
      <li>You'll see each change that's waiting, with what it was. Tap <b>Send again</b>, <b>Copy</b> to keep what you wrote, or <b>Discard</b>.</li>
    </ol>
    <p>If it says the phone's storage is full, or the browser won't let the Hub save, free some space or stop using a private window. Until then, new changes can't be kept offline.</p>` },

  { id:'smoothness', section:'trouble', k:'smooth smoothness slow laggy lag choppy stutter jerky jank frames fps dropped meter measure speed performance hitch hitches tap taps delay slow tap', q:'The app feels choppy. Can I measure it?', a:`
    <p>Yes, on your own phone. It counts the frames the app shows late.</p>
    <ol>
      <li>Open <b>More</b> and tap <b>Smoothness meter</b>, under <b>You</b>.</li>
      <li>Tap <b>Measure smoothness</b>. A small timer appears at the top of the screen.</li>
      <li>Use the app the way that feels choppy: scroll Home, open a domain, open the chat.</li>
      <li>Tap the timer to stop. The results open.</li>
    </ol>
    <p>The big number is milliseconds of hitches per second. Apple's mark: under 5 is smooth, over 10 feels choppy. Below it you see the same for each screen and while scrolling, then the longest stalls: when each one came (time into the run, how long after a scroll, how long after the app opened) and what the app was doing then, such as the tab bar tucking or a new greeting word. "Nothing named" means the phone was busy drawing.</p>
    <p>Last come your <b>Taps</b>: every tap in the run, timed from when your finger lifts. "Wait" is how long until the app starts on it, "drawn" how long until the next screen is on view. The six slowest are listed with where you were and what you tapped.</p>
    <p>To compare two versions, do the same steps each time. Each run keeps its build number, and the last four are listed under <b>More</b> → <b>Smoothness meter</b>. <b>Copy numbers</b> puts a run's results in a message. Turn Low Power Mode off first: it halves the frames.</p>` },
  { id:'memory', section:'study', k:'memory trainer consecutive span notes speaker doctor nurse patient family who is talking note-taking listen render retention short-term memory long lines chunks flag line voice paulina samantha', q:'How does the Memory trainer work?', a:`
    <p>Practice for consecutive interpreting. The phone reads a line out loud, a provider in English or a patient in Spanish, with the words hidden. You say it in the other language, out loud, then check yourself.</p>
    <ol>
      <li>Open <b>CoreCHI Practice</b> and scroll to <b>Consecutive</b>. Tap <b>Start</b> on the Memory trainer.</li>
      <li>Pick <b>Both ways</b>, <b>To Spanish</b> or <b>To English</b>. Turn <b>Notes</b> on if you want to use your notepad, and <b>Record me</b> on to hear yourself afterwards.</li>
      <li>Tap <b>Start</b> and listen. The ring fills while the line plays. Beside it stand the two people in the room, little clay-toy figures: the doctor or a nurse on the left, the patient or a family member on the right. The one saying the line leans in; the other waits.</li>
      <li>When it says <b>Your turn</b>, say the whole line in the other language. Then tap <b>Show the rendering</b>.</li>
      <li>The model rendering comes in parts. Tap every part you dropped or changed, then tap <b>Next line</b>.</li>
    </ol>
    <p>With <b>Record me</b> on, the mic records only during your turn. After the rendering, tap <b>Mine</b> to hear yourself and <b>Model</b> to hear the model rendering read aloud. Your take is dropped when the next line starts and is never sent anywhere.</p>
    <p>Three clean lines in a row and the next one is a few words longer. Two misses in a row and it gets shorter. Your <b>span</b> is the longest line you've held clean; lines done with notes count apart from memory only.</p>
    <p>Under <b>Start</b>, <b>Your span, by week</b> draws your longest clean line each week for the last 8 weeks. Tap a point to read that week. With notes shows as a second, lighter line.</p>
    <p>With <b>Auto-mark</b> on, the phone listens to your turn and, when you tap Show the rendering, marks the parts it didn't hear ("not heard") and shows what it heard. It can be wrong, a synonym for example, so check the marks and tap to change any. Apple may process what you say, so practise away from patients. It's off unless you turn it on.</p>
    <p>If a line is wrong or sounds odd, tap <b>Flag this line</b> after the rendering and say why. Flags are read before the lines are changed.</p>
    <p>Your progress stays on this phone. Record me is off unless you turn it on. Near patients, use earbuds.</p>
    <p>The doctor, nurse and visitor were made as 3D models with Meshy (meshy.ai) from Jose's drawings.</p>` },
  { id:'voicecheck', section:'trouble', k:'voice mic microphone record recording speech to text dictation listen hear speak audio check test memory trainer', q:'What is the Voice and mic check?', a:`
    <p>A quick test of what your phone can do with sound: the Spanish and English voices, recording yourself, and turning speech into text. It shows what the <b>Memory trainer</b> can use on your phone, and what it may add later.</p>
    <ol>
      <li>Open <b>More</b> and tap <b>Voice and mic check</b>, under <b>You</b>.</li>
      <li>Do the four steps on the sheet. The phone asks before it uses the microphone. If the voice is quieter after recording, tap <b>Try the volume fix</b>.</li>
      <li>Tap <b>Copy results</b> and paste them into a chat.</li>
    </ol>
    <p>The Hub saves nothing and sends nothing: the recording is dropped when you close the sheet. The speech-to-text step may send what you say to Apple, so do it away from patients.</p>` },
  { id:'stale', section:'trouble', k:'old outdated stale refresh reload update stuck not updating version build number slow wifi white blank open opening start', q:'The app looks out of date', a:`
    <p>Leave the app (go to your Home Screen), then come back to it. If it still looks old, close it completely and open it again.</p>
    <p>On slow Wi-Fi the app doesn't wait: after a second it opens the copy saved on your phone. So right after an update you may see the previous version once. The new one downloads in the background and is there the next time you leave the app and come back. It never reloads while you're using it.</p>
    <p>To see which version you have, open <b>More</b> and scroll to the very bottom. The build number is there.</p>` },

  { id:'noname', section:'trouble', k:'name missing anonymous someone unknown attribution blank', q:'My name is not showing on my edits', a:`
    <p>The app doesn't know who you are yet on this phone.</p>
    <p>Tap the round button in the <b>top-right corner</b>, type your name and tap <b>Save</b>. Edits from now on will carry it.</p>` },

  { id:'print', section:'out', k:'print pdf paper printout export sheet handout', q:'How do I print a list, or save it as a PDF?', a:`
    <p>Open the domain you want, tap <b>⋯</b> in its colored banner, then <b>Export as PDF</b>. You get a clean printable sheet with none of the app's buttons on it.</p>
    <p>Handy for a new interpreter's first week, or for studying on paper.</p>` },

  { id:'bulk', section:'out', k:'csv excel spreadsheet bulk many at once import export mass edit', q:'I need to change a lot of words at once', a:`
    <ol>
      <li>Open the domain, tap <b>⋯</b> in its banner, then <b>Export as spreadsheet</b>.</li>
      <li>Edit it in Excel or Google Sheets.</li>
      <li>Tap <b>⋯</b> again, then <b>Import from spreadsheet</b>, and choose the file you edited.</li>
    </ol>
    <p>Before anything is saved you get a preview of exactly what will change. Nothing happens until you confirm.</p>` },

  { id:'privacy', section:'rule', k:'hipaa privacy patient confidential phi private rules safety mrn', q:'What must never go in this app?', a:`
    <p><b>Anything that identifies a patient.</b> No names, no dates of birth, no medical record numbers, no room numbers tied to a person.</p>
    <p>This applies everywhere: terms, definitions, notes, chat messages, doctor tips and questions to Dr. Smiley. If a question looks like it has patient details, Ask stops and warns you before sending, and Dr. Smiley won't remember them.</p>
    <p>Describe the situation if you need to. Never the person.</p>` },
];
