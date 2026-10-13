// Hand-maintained film catalogue. Story text lives in storyTexts.json and
// narration in storyAudio.js (both generated) — keyed by the same `id`.
//
// Illustrations are original storybook artwork themed around the FEELING of
// each film — no licensed characters, stills or actor likenesses.

export const FILMS = [
  {
    id: "ddlj",
    title: "DDLJ",
    year: 1995,
    collection: "classics",
    tagline: "Two friends and the longest, happiest train ride home to Punjab.",
    illustration: require("../../assets/illustrations/ddlj.jpg"),
  },
  {
    id: "sholay",
    title: "Sholay",
    year: 1975,
    collection: "classics",
    tagline: "Jai and Veeru outwit the silliest bandit in all of Ramgarh.",
    illustration: require("../../assets/illustrations/sholay.jpg"),
  },
  {
    id: "kkhh",
    title: "Kuch Kuch Hota Hai",
    year: 1998,
    collection: "classics",
    tagline: "Best friends Rahul and Anjali, and a friendship bracelet that finds its way home.",
    illustration: require("../../assets/illustrations/kkhh.jpg"),
  },
  {
    id: "lagaan",
    title: "Lagaan",
    year: 2001,
    collection: "classics",
    tagline: "Bhuvan's village learns cricket to win the biggest match of all.",
    illustration: require("../../assets/illustrations/lagaan.jpg"),
  },
  {
    id: "3idiots",
    title: "3 Idiots",
    year: 2009,
    collection: "heart",
    tagline: "Rancho and his friends discover that learning is for joy, not marks.",
    illustration: require("../../assets/illustrations/3idiots.jpg"),
  },
  {
    id: "tzp",
    title: "Taare Zameen Par",
    year: 2007,
    collection: "heart",
    tagline: "Ishaan's big imagination finally meets a teacher who sees it.",
    illustration: require("../../assets/illustrations/tzp.jpg"),
  },
  {
    id: "dangal",
    title: "Dangal",
    year: 2016,
    collection: "heart",
    tagline: "Two determined sisters train hard and dream of gold for India.",
    illustration: require("../../assets/illustrations/dangal.jpg"),
  },
  {
    id: "bajrangi",
    title: "Bajrangi Bhaijaan",
    year: 2015,
    collection: "heart",
    tagline: "A big-hearted man helps little Munni find her way back home.",
    illustration: require("../../assets/illustrations/bajrangi.jpg"),
  },
  {
    id: "pathaan",
    title: "Pathaan",
    year: 2023,
    collection: "heroes",
    tagline: "A clever secret agent keeps everyone safe — with brains, not fists.",
    illustration: require("../../assets/illustrations/pathaan.jpg"),
  },
  {
    id: "jawan",
    title: "Jawan",
    year: 2023,
    collection: "heroes",
    tagline: "Vikram and his brilliant team make things fair for everyone.",
    illustration: require("../../assets/illustrations/jawan.jpg"),
  },
];

export const COLLECTIONS = [
  { key: "classics", title: "Timeless classics", subtitle: "The films you grew up with" },
  { key: "heart",    title: "Big hearts",        subtitle: "Stories about kindness and courage" },
  { key: "heroes",   title: "Gentle heroes",     subtitle: "Adventures with no scary bits" },
];
