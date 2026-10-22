# Making a 3D film from code: the lessons

Written for Jose while we made the first film (`BRIEF.md`). Read them in
order. Each lesson is one step of the guide "Claude + Blender: Make 3D
Motion Graphics From Code".

## Lesson 1: the big idea, and the brief

**A video is a flipbook.** It's just pictures shown fast. Our film has 30
pictures every second. 12 seconds is 360 pictures. Each picture is called
a frame.

**Claude doesn't draw the pictures.** Claude writes a program. The program
answers one question: "What does the screen look like at frame 147?" Ask
it 360 times and you get 360 pictures. Blender is the camera that takes
each picture.

**That is why fixes are cheap.** If one jump is too high, you change one
number. Then you redo only the frames with that jump, not the whole film.

**One file holds every time and every place.** It's called
`timeline.py`. It says things like: "the Save button is at this spot" and
"he lands on Save at second 7.5". The screens, the 3D and the sound all
read that same file. So when he lands, the click sound and the button glow
happen at the exact same moment. Nobody has to line them up by hand.

**The brief is the order you give.** A vague order ("make a cool video")
gets a vague film. A brief is a production order with six parts:

| Part | Question it answers |
|---|---|
| BRAND | Who is the hero, what app, what does he build, where? |
| FORMAT | How big, how fast, how long? |
| BEATS | What happens at each second? |
| CAMERA | Where do we look? |
| LOOK | What light and colours? |
| CHECKS | How do we test before the long render? |

**Only BRAND changes between films.** The other five parts are a recipe
that already works. For a new film, you copy `BRIEF-TEMPLATE.md` and fill
in BRAND.

**The one rule for BEATS:** every jump must change something you can see.
A jump that changes nothing is a wasted second.

**Spot the broken beat.** Ask of every button: "What do I see change on
the result?" If the answer is "nothing new appears", cut that button.
Team Chat with **Open, Scroll, Read, Close** fails: scrolling and reading
add nothing to anything being built. Doctor Prep with **Name, Specialty,
Research, False friends, Save** passes: each press adds a new piece to
the page (even "Research" makes the tabs appear).
