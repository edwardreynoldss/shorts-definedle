You are an expert React, TypeScript and Remotion developer.



Build a premium YouTube Shorts quiz generator that renders 1080x1920 vertical videos.



The design should feel like a premium iOS app/game, NOT a PowerPoint presentation.



====================================================

TECH STACK

====================================================



\- React

\- TypeScript

\- Remotion

\- Framer Motion (if needed)

\- Modular components

\- Easily configurable through JSON



====================================================

VIDEO STRUCTURE

====================================================



Total video length:

38-42 seconds



Questions:

4



Questions 1-3

\- show definition

\- countdown

\- reveal answer



Question 4

\- bonus question

\- NO answer

\- encourage comments



====================================================

LAYOUT

====================================================



Dark modern UI.



Background:

\- animated gradient

\- subtle floating particles

\- slight vignette

\- premium glassmorphism



Top:



Question indicator



Question 1 / 4



Below:



Large heading



Guess the Word



Middle:



Definition card



Large rounded rectangle



Glassmorphism



Soft shadow



Animated



Bottom:



Circular countdown timer



Large



Animated ring



Countdown number inside



Footer:



Progress dots



Question 1 ● ○ ○ ○



====================================================

COLORS

====================================================



Background:

\#09090B



Card:

rgba(255,255,255,0.08)



Accent:

\#3B82F6



Correct:

\#22C55E



Warning:

\#F59E0B



Text:

White



====================================================

FONTS

====================================================



Use Inter



Weights:

700

600

400



====================================================

ANIMATIONS

====================================================



Everything should animate.



No sudden cuts.



Question transition



Slide up



Fade



Scale



Definition



Fade



Slide



Answer reveal



Card expands



Definition fades out



Answer scales in



Glow animation



Green pulse



Timer



Animated circular progress



Smooth easing



Progress dots



Animate each transition



====================================================

VOICE

====================================================



Assume an MP3 exists for each question.



The definition text should render in sync with the narration.



Example:



Voice:



"A person who travels without a permanent home."



Text should reveal phrase by phrase.



Example



A person



↓



A person who travels



↓



A person who travels without



↓



A person who travels without a permanent home



NOT word by word.



Timing should be configurable.



====================================================

COUNTDOWN

====================================================



Once narration finishes



Wait 300ms



Start 5 second timer



Countdown ring shrinks



Play ticking sound every second



Number decreases



5



4



3



2



1



====================================================

ANSWER REVEAL

====================================================



Timer disappears



Card expands



Definition fades away



Large answer appears



Example



NOMAD



Green



Glow



Scale animation



Confetti particles



Play success sound



Wait 2 seconds



Next question



====================================================

QUESTION 4

====================================================



Everything identical



Except



Instead of answer



Show



Comment your answer below 👇



Then



Answer revealed tomorrow.



====================================================

DATA

====================================================



Read from JSON.



Example



{

&#x20; "questions":\[

&#x20;   {

&#x20;     "definition":"A person who travels without a permanent home.",

&#x20;     "answer":"Nomad",

&#x20;     "voice":"voice1.mp3",

&#x20;     "segments":\[

&#x20;       {

&#x20;         "text":"A person",

&#x20;         "time":0.4

&#x20;       },

&#x20;       {

&#x20;         "text":"who travels",

&#x20;         "time":1.4

&#x20;       },

&#x20;       {

&#x20;         "text":"without a permanent home.",

&#x20;         "time":2.8

&#x20;       }

&#x20;     ]

&#x20;   }

&#x20; ]

}



====================================================

COMPONENTS

====================================================



Build reusable components



AnimatedBackground



QuestionCard



DefinitionRenderer



VoiceSyncText



CircularTimer



AnswerReveal



ProgressDots



TransitionManager



ParticleSystem



====================================================

QUALITY

====================================================



Target something that looks good enough to compete with the top quiz channels on YouTube Shorts.



Everything should feel smooth.



No cheap animations.



No abrupt transitions.



Use spring animations where appropriate.



Keep visual movement on screen at all times.



====================================================

EXTENSIBILITY

====================================================



I should later be able to change the JSON and automatically generate hundreds of videos without touching the code.



The rendering engine should be completely data-driven.



Write clean, production-quality code with comments and good project structure.

