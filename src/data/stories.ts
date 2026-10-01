/**
 * The stories the home page tells.
 *
 * The hero plays "The voice from the wall" on arrival. Every other section of
 * the home page has its own story, which begins once a visitor has lingered
 * there for a few seconds.
 *
 * Quotations are verbatim from public-domain translations, checked against
 * the texts named in each source line (Project Gutenberg and Wikisource).
 * Scenes marked `kind: 'telling'` are narration in the site's own words, and
 * their source line says what they are told after.
 */
export interface StoryScene {
  numeral: string;
  title: string;
  quote: string;
  source: string;
  href?: string;
  duration: number;
  kind?: 'quote' | 'telling';
}
export interface StoryText {
  id: StoryId;
  title: string;
  /** what the story is about, for screen readers and the caption heading */
  about: string;
  scenes: StoryScene[];
}
export type StoryId = 'cave' | 'delphi' | 'prometheus' | 'knowledge' | 'elephant' | 'writing' | 'wax' | 'theseus' | 'indra' | 'fish';

const jowett = (work: string, at: string) => `Plato, ${work} ${at} · tr. Jowett`;
const paper = { source: 'Abhinav Saxena, “Assertion Without a Speaker”, Episteme (forthcoming)', href: '/publications#assertion-without-a-speaker' };
const saxe = 'John Godfrey Saxe, “The Blind Men and the Elephant” (1872)';
const veitch = (work: string) => `Descartes, ${work} · tr. Veitch`;
const plutarch = 'Plutarch, Life of Theseus 23 · tr. Dryden, ed. Clough';
const giles = 'Zhuangzi, ch. 17 · tr. Herbert A. Giles (1889)';
const indra = 'Told after the Avataṃsaka Sūtra (Huayan Buddhism)';

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const numbered = (scenes: Omit<StoryScene, 'numeral'>[]): StoryScene[] => scenes.map((s, i) => ({ numeral: roman[i], ...s }));

export const stories: Record<StoryId, StoryText> = {
  cave: {
    id: 'cave', title: 'The voice from the wall', about: 'Plato’s cave, and a wall that speaks without a speaker',
    scenes: numbered([
      { title: 'The fire', duration: 10, source: jowett('Republic VII,', '514b'), quote: 'Above and behind them a fire is blazing at a distance, and between the fire and the prisoners there is a raised way…' },
      { title: 'The shadows', duration: 16, source: jowett('Republic VII,', '515a'), quote: 'Like ourselves, I replied; and they see only their own shadows, or the shadows of one another, which the fire throws on the opposite wall of the cave?' },
      { title: 'The echo', duration: 11, source: jowett('Republic VII,', '515b'), quote: 'And suppose further that the prison had an echo which came from the other side, would they not be sure to fancy when one of the passers-by spoke that the voice which they heard came from the passing shadow?' },
      { title: 'The turning', duration: 8, source: jowett('Republic VII,', '515c'), quote: '…compelled suddenly to stand up and turn his neck round and walk and look towards the light, he will suffer sharp pains; the glare will distress him…' },
      { title: 'The sun', duration: 12, source: jowett('Republic VII,', '516b'), quote: 'Last of all he will be able to see the sun … and he will contemplate him as he is.' },
      { title: 'The telling', duration: 15, ...paper, quote: 'Testimonial chains are a social epistemic technology because their links preserve warrant: A tells B, B tells C, and C can end with warrant tracing to A.' },
      { title: 'The new wall', duration: 14, ...paper, quote: 'Chains of LLM-generated text reposted by users do not preserve warrant as chains of human testimony do. They preserve text.' },
      { title: 'Coda', duration: 12, ...paper, quote: 'A practice that mistakes such an instrument for a speaker is in trouble in proportion to how heavily the instrument is used, and an accurate description does its own corrective work.' },
    ]),
  },

  delphi: {
    id: 'delphi', title: 'The oracle at Delphi', about: 'how Socrates found out what his wisdom was',
    scenes: numbered([
      { title: 'The oracle', duration: 11, source: jowett('Apology', '21a'), quote: '…he asked the oracle to tell him whether anyone was wiser than I was, and the Pythian prophetess answered, that there was no man wiser.' },
      { title: 'The riddle', duration: 10, source: jowett('Apology', '21b'), quote: 'What can the god mean? and what is the interpretation of his riddle? for I know that I have no wisdom, small or great.' },
      { title: 'The examination', duration: 13, source: jowett('Apology', '21d'), quote: '…he knows nothing, and thinks that he knows; I neither know nor think that I know.' },
      { title: 'The wisest', duration: 10, source: jowett('Apology', '23b'), quote: 'He, O men, is the wisest, who, like Socrates, knows that his wisdom is in truth worth nothing.' },
      { title: 'The examined life', duration: 10, source: jowett('Apology', '38a'), quote: '…the unexamined life is not worth living' },
    ]),
  },

  prometheus: {
    id: 'prometheus', title: 'The gift of fire', about: 'why the arts were not enough without justice',
    scenes: numbered([
      { title: 'The making', duration: 11, source: jowett('Protagoras', '320d'), quote: '…the gods fashioned them out of earth and fire and various mixtures of both elements in the interior of the earth' },
      { title: 'The gifts', duration: 11, source: jowett('Protagoras', '320e'), quote: 'There were some to whom he gave strength without swiftness, while he equipped the weaker with swiftness' },
      { title: 'The forgotten', duration: 10, source: jowett('Protagoras', '321c'), quote: '…man alone was naked and shoeless, and had neither bed nor arms of defence.' },
      { title: 'The theft', duration: 11, source: jowett('Protagoras', '321d'), quote: '…Prometheus, not knowing how he could devise his salvation, stole the mechanical arts of Hephaestus and Athene, and fire with them … and gave them to man.' },
      { title: 'The cities', duration: 11, source: jowett('Protagoras', '322b'), quote: '…when they were gathered together, having no art of government, they evil intreated one another, and were again in process of dispersion and destruction.' },
      { title: 'Reverence and justice', duration: 13, source: jowett('Protagoras', '322d'), quote: '‘To all,’ said Zeus; ‘I should like them all to have a share; for cities cannot exist, if a few only share in the virtues, as in the arts.’' },
    ]),
  },

  knowledge: {
    id: 'knowledge', title: 'What is knowledge?', about: 'the oldest question in epistemology, from Plato to a stopped clock',
    scenes: numbered([
      { title: 'The question', duration: 9, source: jowett('Theaetetus', '146a'), quote: 'Herein lies the difficulty which I can never solve to my satisfaction—What is knowledge? Can we answer that question?' },
      { title: 'The road to Larisa', duration: 12, source: jowett('Meno', '97a'), quote: 'If a man knew the way to Larisa, or anywhere else, and went to the place and led others thither, would he not be a right and good guide?' },
      { title: 'Right opinion', duration: 10, source: jowett('Meno', '97b'), quote: 'And a person who had a right opinion about the way, but had never been and did not know, might be a good guide also, might he not?' },
      { title: 'The statues of Daedalus', duration: 14, source: jowett('Meno', '97e–98a'), quote: '…true opinions: while they abide with us they are beautiful and fruitful, but they run away out of the human soul, and do not remain long, and therefore they are not of much value until they are fastened by the tie of the cause' },
      { title: 'The stopped clock', duration: 13, kind: 'telling', source: 'Told after Bertrand Russell (1948) and Edmund Gettier, “Is Justified True Belief Knowledge?” (1963)', quote: 'Twenty-three centuries later the tie itself came under suspicion. A man glances at a clock that stopped, unknown to him, exactly twelve hours ago. It shows the right time. His belief is true, and he has a good reason for it. Does he know what time it is?' },
      { title: 'Still open', duration: 10, source: jowett('Theaetetus', '210a'), quote: 'And so, Theaetetus, knowledge is neither sensation nor true opinion, nor yet definition and explanation accompanying and added to true opinion?' },
    ]),
  },

  elephant: {
    id: 'elephant', title: 'The blind men and the elephant', about: 'one creature, known in parts',
    scenes: numbered([
      { title: 'Six men of Indostan', duration: 11, source: `${saxe}, after the Indian parable (Udāna 6.4)`, quote: 'It was six men of Indostan\nTo learning much inclined,\nWho went to see the Elephant\n(Though all of them were blind),\nThat each by observation\nMight satisfy his mind.' },
      { title: 'The side', duration: 7, source: saxe, quote: 'The First approached the Elephant,\nAnd happening to fall\nAgainst his broad and sturdy side,\nAt once began to bawl:\n“God bless me!—but the Elephant\nIs very like a wall!”' },
      { title: 'The tusk', duration: 7, source: saxe, quote: 'The Second, feeling of the tusk,\nCried: “Ho!—what have we here\nSo very round and smooth and sharp?\nTo me ’t is mighty clear\nThis wonder of an Elephant\nIs very like a spear!”' },
      { title: 'The trunk', duration: 7, source: saxe, quote: 'The Third approached the animal,\nAnd happening to take\nThe squirming trunk within his hands,\nThus boldly up and spake:\n“I see,” quoth he, “the Elephant\nIs very like a snake!”' },
      { title: 'The knee', duration: 7, source: saxe, quote: 'The Fourth reached out his eager hand,\nAnd felt about the knee.\n“What most this wondrous beast is like\nIs mighty plain,” quoth he;\n“’T is clear enough the Elephant\nIs very like a tree!”' },
      { title: 'The ear', duration: 7, source: saxe, quote: 'The Fifth, who chanced to touch the ear,\nSaid: “E’en the blindest man\nCan tell what this resembles most;\nDeny the fact who can,\nThis marvel of an Elephant\nIs very like a fan!”' },
      { title: 'The tail', duration: 7, source: saxe, quote: 'The Sixth no sooner had begun\nAbout the beast to grope,\nThan, seizing on the swinging tail\nThat fell within his scope,\n“I see,” quoth he, “the Elephant\nIs very like a rope!”' },
      { title: 'Partly in the right', duration: 12, source: saxe, quote: 'And so these men of Indostan\nDisputed loud and long,\nEach in his own opinion\nExceeding stiff and strong,\nThough each was partly in the right,\nAnd all were in the wrong!' },
    ]),
  },

  writing: {
    id: 'writing', title: 'The invention of writing', about: 'a god’s gift of letters, and a king’s doubts about it',
    scenes: numbered([
      { title: 'Theuth', duration: 13, source: jowett('Phaedrus', '274c–d'), quote: '…there was a famous old god, whose name was Theuth; the bird which is called the Ibis is sacred to him, and he was the inventor of many arts, such as arithmetic and calculation and geometry and astronomy and draughts and dice, but his great discovery was the use of letters.' },
      { title: 'The gift', duration: 10, source: jowett('Phaedrus', '274e'), quote: 'This, said Theuth, will make the Egyptians wiser and give them better memories; it is a specific both for the memory and for the wit.' },
      { title: 'The king’s reply', duration: 13, source: jowett('Phaedrus', '275a'), quote: '…this discovery of yours will create forgetfulness in the learners’ souls, because they will not use their memories; they will trust to the external written characters and not remember of themselves.' },
      { title: 'The semblance', duration: 11, source: jowett('Phaedrus', '275a–b'), quote: '…they will be hearers of many things and will have learned nothing; they will appear to be omniscient and will generally know nothing' },
      { title: 'The silent painting', duration: 12, source: jowett('Phaedrus', '275d'), quote: 'I cannot help feeling, Phaedrus, that writing is unfortunately like painting; for the creations of the painter have the attitude of life, and yet if you ask them a question they preserve a solemn silence.' },
      { title: 'One unvarying answer', duration: 11, source: jowett('Phaedrus', '275d'), quote: 'You would imagine that they had intelligence, but if you want to know anything and put a question to one of them, the speaker always gives one unvarying answer.' },
    ]),
  },

  wax: {
    id: 'wax', title: 'The piece of wax', about: 'what Descartes found when he thought a thing through',
    scenes: numbered([
      { title: 'Seclusion', duration: 10, source: veitch('Discourse on the Method, Part II'), quote: '…I remained the whole day in seclusion, with full opportunity to occupy my attention with my own thoughts.' },
      { title: 'The wax', duration: 11, source: veitch('Meditations II'), quote: 'Take, for example, this piece of wax; it is quite fresh, having been but recently taken from the beehive; it has not yet lost the sweetness of the honey it contained' },
      { title: 'Near the fire', duration: 12, source: veitch('Meditations II'), quote: 'But, while I am speaking, let it be placed near the fire—what remained of the taste exhales, the smell evaporates, the color changes, its figure is destroyed, its size increases, it becomes liquid, it grows hot' },
      { title: 'The same wax', duration: 10, source: veitch('Meditations II'), quote: 'Does the same wax still remain after this change? It must be admitted that it does remain; no one doubts it, or judges otherwise.' },
      { title: 'The mind alone', duration: 10, source: veitch('Meditations II'), quote: 'I must, therefore, admit that I cannot even comprehend by imagination what the piece of wax is, and that it is the mind alone … which perceives it.' },
      { title: 'From the window', duration: 13, source: veitch('Meditations II'), quote: '…what do I see from the window beyond hats and cloaks that might cover artificial machines, whose motions might be determined by springs? But I judge that there are human beings from these appearances' },
    ]),
  },

  theseus: {
    id: 'theseus', title: 'The ship of Theseus', about: 'whether a thing survives the replacement of all its parts',
    scenes: numbered([
      { title: 'The ship', duration: 11, source: plutarch, quote: 'The ship wherein Theseus and the youth of Athens returned had thirty oars, and was preserved by the Athenians down even to the time of Demetrius Phalereus' },
      { title: 'Plank by plank', duration: 14, source: plutarch, quote: '…for they took away the old planks as they decayed, putting in new and stronger timber in their place' },
      { title: 'The question', duration: 13, source: plutarch, quote: '…insomuch that this ship became a standing example among the philosophers, for the logical question as to things that grow; one side holding that the ship remained the same, and the other contending that it was not the same.' },
      { title: 'A second ship', duration: 12, kind: 'telling', source: 'Told after Thomas Hobbes, De Corpore (1655), II.11.7', quote: 'Hobbes pressed the puzzle further. Suppose the old planks had been kept, and someone built a ship out of them. Now two ships can claim to be the one Theseus sailed.' },
      { title: 'Your turn', duration: 8, kind: 'telling', source: 'Philosophy Lab · Ship of Theseus, Digital', href: '/lab/ship-of-theseus-digital', quote: 'Where would you draw the line? The lab has a version of the puzzle you can run.' },
    ]),
  },

  indra: {
    id: 'indra', title: 'Indra’s net', about: 'a net in which every jewel reflects every other',
    scenes: numbered([
      { title: 'The net', duration: 11, kind: 'telling', source: indra, quote: 'Over the palace of the god Indra hangs a net that has no edge. At every knot in it hangs a jewel.' },
      { title: 'The jewel', duration: 11, kind: 'telling', source: indra, quote: 'Look into any one of the jewels and you will see every other jewel reflected in it, and in each reflection, all the others again.' },
      { title: 'One touch', duration: 11, kind: 'telling', source: indra, quote: 'Nothing in the net stands alone. Touch one jewel, and the whole net answers.' },
      { title: 'The map', duration: 10, kind: 'telling', source: indra, href: '/ideas', quote: 'So it may be with ideas: each holds every other within it. The concept map draws a small corner of the net.' },
    ]),
  },

  fish: {
    id: 'fish', title: 'The happy fish', about: 'two friends on a bridge, arguing about what can be known of another mind',
    scenes: numbered([
      { title: 'On the bridge', duration: 12, source: giles, quote: 'Chuang Tzŭ and Hui Tzŭ had strolled on to the bridge over the Hao, when the former observed, “See how the minnows are darting about! That is the pleasure of fishes.”' },
      { title: 'Hui Tzŭ', duration: 9, source: giles, quote: '“You not being a fish yourself,” said Hui Tzŭ, “how can you possibly know in what consists the pleasure of fishes?”' },
      { title: 'Chuang Tzŭ', duration: 8, source: giles, quote: '“And you not being I,” retorted Chuang Tzŭ, “how can you know that I do not know?”' },
      { title: 'Hui Tzŭ', duration: 10, source: giles, quote: '“If I, not being you, cannot know what you know,” urged Hui Tzŭ, “it follows that you, not being a fish, cannot know in what consists the pleasure of fishes.”' },
      { title: 'From the bridge', duration: 12, source: giles, quote: '“Let us go back,” said Chuang Tzŭ, “to your original question. You asked me how I knew in what consists the pleasure of fishes. Your very question shows that you knew I knew. I knew it from my own feelings on this bridge.”' },
    ]),
  },
};

/** What the wall "says" in the cave's scene VII: assertion-shaped sentences about an arbitrary proposition p. */
export const wallText = [
  'It is well established that p.',
  'Sources agree that p.',
  'The answer, in short, is p.',
  'I can confirm that p.',
  'As is widely known, p.',
  'To summarise: p.',
];
