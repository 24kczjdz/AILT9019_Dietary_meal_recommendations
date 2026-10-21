export type RecipeMedia = {
  youtubeId: string;
  youtubeTitle: string;
};

/** Related public cooking videos. The video method can differ from the recipe on the page. */
export const media: Record<string, RecipeMedia> = {
  "lemon-herb-turkey": {
    youtubeId: "tuHNo2qkQWg",
    youtubeTitle: "How to Make Lemon Herb Roasted Turkey",
  },
  "berry-yogurt-bowl": {
    youtubeId: "g8LE5vF-_J8",
    youtubeTitle: "Yogurt breakfast bowl",
  },
  "tofu-edamame-greens": {
    youtubeId: "IpvwUAu2rKE",
    youtubeTitle: "Tofu broccoli stir fry",
  },
  "lentil-tomato-bowl": {
    youtubeId: "D2f55GZ7v2Y",
    youtubeTitle: "Mediterranean lentil soup",
  },
  "salmon-potato-tray": {
    youtubeId: "1ooEYowKmG0",
    youtubeTitle: "One pan salmon and potatoes",
  },
  "shrimp-zucchini": {
    youtubeId: "IkR52TZbYDs",
    youtubeTitle: "Shrimp and zucchini stir fry",
  },
  "egg-white-scramble": {
    youtubeId: "Se5I7u_nnts",
    youtubeTitle: "Egg white veggie scramble",
  },
  "chickpea-spinach-curry": {
    youtubeId: "wsvfA0YOLUs",
    youtubeTitle: "Chickpea spinach curry",
  },
  "cottage-caprese": {
    youtubeId: "UQUbttCrGt4",
    youtubeTitle: "Cottage cheese caprese toast",
  },
  "sweet-potato-black-bean": {
    youtubeId: "_jYDXrz1uYs",
    youtubeTitle: "Sweet potato black bean bowls",
  },
  "beef-broccoli": {
    youtubeId: "BBABeZjlRM8",
    youtubeTitle: "Beef and broccoli stir fry",
  },
  "peanut-butter-oats": {
    youtubeId: "YIS9Y1xqGdQ",
    youtubeTitle: "Peanut butter overnight oats",
  },
  "miso-cod-rice": {
    youtubeId: "6Kw1QdfhXPU",
    youtubeTitle: "Miso black cod at home",
  },
  "turkey-chili": {
    youtubeId: "msChF4tLnsI",
    youtubeTitle: "Easy turkey chili",
  },
  "quinoa-pepper": {
    youtubeId: "OtSorCdBJ6o",
    youtubeTitle: "Quinoa stuffed bell peppers",
  },
  "tofu-scramble": {
    youtubeId: "Vc5pZ-PY-H8",
    youtubeTitle: "How to make tofu scramble",
  },
  "chicken-rice-soup": {
    youtubeId: "akWPO0MrrUU",
    youtubeTitle: "Chicken and rice soup",
  },
  "halloumi-grain-plate": {
    youtubeId: "UNlcyf_meug",
    youtubeTitle: "Halloumi grain bowl",
  },
  "tuna-bean-salad": {
    youtubeId: "7FiNrcqcXh0",
    youtubeTitle: "Tuna bean salad",
  },
  "peanut-noodle-tofu": {
    youtubeId: "6EPmgmjISM0",
    youtubeTitle: "Peanut noodles with tofu",
  },
  "vegetable-omelette": {
    youtubeId: "qR5T8MQTEIo",
    youtubeTitle: "Vegetable egg omelette",
  },
  "turkey-zucchini-meatballs": {
    youtubeId: "iMXn8u17VTo",
    youtubeTitle: "Turkey meatballs with zucchini noodles",
  },
  "mushroom-barley-soup": {
    youtubeId: "TxnDNv4OByI",
    youtubeTitle: "Mushroom barley soup",
  },
  "greek-chicken-salad": {
    youtubeId: "Tc7ttfjKi9k",
    youtubeTitle: "Greek chicken salad bowl",
  },
};

export function photoSrc(id: string) {
  return `/photos/${id}.jpg`;
}
