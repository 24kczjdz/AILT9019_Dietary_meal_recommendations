import {
  ALLERGEN_LABEL,
  HIGH_PROTEIN_G,
  LOW_CARB_G,
  LOW_FAT_G,
  MAX_DAILY_KCAL,
  MIN_DAILY_KCAL,
} from "@/lib/limits";
import type { Allergen, Chip, Constraints, DietTag, MealType, Refusal, WarningNote } from "@/lib/types";

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
};

const ALLERGEN_WORDS: { pattern: RegExp; allergen: Allergen }[] = [
  { pattern: /\b(peanuts?|peanut butter)\b/, allergen: "peanuts" },
  { pattern: /\b(tree nuts?|almonds?|walnuts?|cashews?|pecans?|pistachios?)\b/, allergen: "nuts" },
  { pattern: /\b(shellfish|shrimp|prawns?|crab|lobster)\b/, allergen: "shellfish" },
  { pattern: /\b(dairy|milk|cheese|lactose|yogurt|butter)\b/, allergen: "dairy" },
  { pattern: /\beggs?\b/, allergen: "eggs" },
  { pattern: /\b(fish|salmon|tuna|cod)\b/, allergen: "fish" },
  { pattern: /\b(soy|soya|tofu)\b/, allergen: "soy" },
  { pattern: /\bsesame\b/, allergen: "sesame" },
  { pattern: /\b(gluten|wheat|barley)\b/, allergen: "gluten" },
];

const FOOD_CONFLICTS = [
  "salmon",
  "shrimp",
  "prawn",
  "chicken",
  "beef",
  "turkey",
  "tuna",
  "cod",
  "fish",
  "yogurt",
  "cheese",
  "egg",
  "halloumi",
  "honey",
];

const MEDICAL = [
  "diabetes",
  "diabetic",
  "kidney disease",
  "renal",
  "cancer",
  "insulin",
  "pregnant",
  "pregnancy",
  "prenatal",
  "eating disorder",
  "cholesterol medication",
];

const DISORDER = ["anorexia", "bulimia", "pro-ana", "pro ana", "purge"];

export type ParseResult = {
  constraints: Constraints;
  warnings: WarningNote[];
  refusal: Refusal | null;
};

export function emptyConstraints(text = ""): Constraints {
  return {
    diets: [],
    allergies: [],
    unknownAllergies: [],
    highProtein: false,
    lowFat: false,
    lowCarb: false,
    mealTypes: [],
    plan: false,
    pantry: [],
    halalRequested: false,
    kosherRequested: false,
    medicalTerms: [],
    eatingDisorder: false,
    celiac: false,
    chips: [],
    rawText: text,
  };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function readNumber(raw: string) {
  const word = NUMBER_WORDS[raw.toLowerCase()];
  if (word) return word;
  return Number(raw.replace(/,/g, ""));
}

function windowBefore(text: string, index: number, size = 36) {
  return text.slice(Math.max(0, index - size), index);
}

function addDiet(constraints: Constraints, diet: DietTag) {
  if (!constraints.diets.includes(diet)) constraints.diets.push(diet);
}

function addAllergy(constraints: Constraints, allergen: Allergen) {
  if (!constraints.allergies.includes(allergen)) constraints.allergies.push(allergen);
}

export function applyPresets(constraints: Constraints, presets: string[]) {
  for (const preset of presets) {
    if (
      preset === "vegetarian" ||
      preset === "vegan" ||
      preset === "pescatarian" ||
      preset === "gluten-free" ||
      preset === "dairy-free" ||
      preset === "nut-free"
    ) {
      addDiet(constraints, preset);
    }
    if (preset === "high-protein") constraints.highProtein = true;
    if (preset === "low-fat") constraints.lowFat = true;
    if (preset === "low-carb") constraints.lowCarb = true;
    if (preset === "under-600" && constraints.maxCalories == null) constraints.maxCalories = 600;
    if (preset === "budget") constraints.budget = "low";
    if (preset === "breakfast" || preset === "lunch" || preset === "dinner") {
      const meal = preset as MealType;
      if (!constraints.mealTypes.includes(meal)) constraints.mealTypes.push(meal);
    }
  }
}

export function parseRequest(text: string, presets: string[] = [], pantry: string[] = []): ParseResult {
  const normalized = text.toLowerCase().replace(/[–—]/g, "-");
  const constraints = emptyConstraints(text.trim());
  const warnings: WarningNote[] = [];

  if (DISORDER.some((term) => normalized.includes(term))) {
    constraints.eatingDisorder = true;
    return {
      constraints,
      warnings,
      refusal: {
        title: "Mise will not build this",
        message:
          "This request asks for help around an eating disorder. Mise will not turn that into meals, portions, or a plan.",
        suggestion: "If you want ordinary food ideas later, ask for something like “high protein lunch” without a harm goal.",
      },
    };
  }

  for (const term of MEDICAL) {
    if (normalized.includes(term)) constraints.medicalTerms.push(term);
  }

  if (/\b(celiac|coeliac)\b/.test(normalized)) {
    constraints.celiac = true;
    addDiet(constraints, "gluten-free");
  }

  if (/\b(vegan|plant-based|plant based)\b/.test(normalized)) addDiet(constraints, "vegan");
  if (/\b(vegetarian|veggie|meatless|no meat)\b/.test(normalized)) addDiet(constraints, "vegetarian");
  if (/\bpescatarian\b/.test(normalized)) addDiet(constraints, "pescatarian");
  if (/\b(gluten-free|gluten free|\bgf\b|no gluten|without gluten)\b/.test(normalized)) {
    addDiet(constraints, "gluten-free");
  }
  if (/\b(dairy-free|dairy free|no dairy|without dairy|lactose)\b/.test(normalized)) {
    addDiet(constraints, "dairy-free");
  }
  if (/\b(nut-free|nut free|no nuts|tree-nut free|tree nut free)\b/.test(normalized)) {
    addDiet(constraints, "nut-free");
  }
  if (/\bhalal\b/.test(normalized)) constraints.halalRequested = true;
  if (/\bkosher\b/.test(normalized)) constraints.kosherRequested = true;

  if (/\b(high[- ]protein|protein-rich|extra protein|lots of protein)\b/.test(normalized)) {
    constraints.highProtein = true;
  }
  if (/\b(low[- ]fat|lean|light on fat)\b/.test(normalized)) constraints.lowFat = true;
  if (/\b(low[- ]carb|lower carb|keto)\b/.test(normalized)) constraints.lowCarb = true;
  if (/\b(cheap|budget|inexpensive|on a budget)\b/.test(normalized)) constraints.budget = "low";

  if (/\bbreakfast\b/.test(normalized)) constraints.mealTypes.push("breakfast");
  if (/\blunch\b/.test(normalized)) constraints.mealTypes.push("lunch");
  if (/\bdinner\b/.test(normalized)) constraints.mealTypes.push("dinner");
  if (/\bsnack\b/.test(normalized)) constraints.mealTypes.push("snack");
  constraints.mealTypes = unique(constraints.mealTypes);

  const mealMatch = normalized.match(
    /\b(one|two|three|four|five|\d+)\s+meals?\s+(?:per|a|each)\s+day\b/,
  );
  if (mealMatch) constraints.mealsPerDay = readNumber(mealMatch[1]);

  const dayMatch = normalized.match(/\b(one|two|three|four|five|six|seven|\d+)\s+days?\b/);
  if (dayMatch) constraints.days = readNumber(dayMatch[1]);

  if (/\bmeal plan\b|\bweekly\b|\bfor the week\b/.test(normalized) || (constraints.days ?? 0) > 1) {
    constraints.plan = true;
  }
  if ((constraints.mealsPerDay ?? 0) >= 2) constraints.plan = true;

  const caloriePattern = /(\d[\d,]*)\s*(?:kcal|calories|calorie|cals)\b/g;
  for (const match of normalized.matchAll(caloriePattern)) {
    const value = readNumber(match[1]);
    if (!Number.isFinite(value)) continue;
    const before = windowBefore(normalized, match.index ?? 0);
    const after = normalized.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 18);
    const perMeal = /per meal|each meal|a meal/.test(`${before} ${after}`);
    const perDay = /per day|a day|daily|each day/.test(`${before} ${after}`) || /per day|a day|daily/.test(normalized);
    const isCap = /less than|under|below|at most|max|no more than|<\s*$/.test(before);
    const isFloor = /at least|more than|minimum|over\s*$/.test(before);

    const dayScope =
      perDay ||
      (!perMeal && (constraints.plan || (constraints.mealsPerDay ?? 0) >= 2) && value >= 1000);

    if (dayScope && !perMeal) {
      constraints.dailyCalories = value;
      continue;
    }

    if (isCap) constraints.maxCalories = value;
    else if (isFloor) constraints.minCalories = value;
    else if (value >= 1000 && !perMeal) constraints.dailyCalories = value;
    else {
      constraints.maxCalories = value;
      constraints.minCalories = Math.round(value * 0.85);
    }
  }

  const proteinPatterns = [
    /(?:at least|more than|minimum|over)\s+(\d+)\s*g(?:rams)?\s*(?:of\s*)?protein/,
    /(\d+)\s*g(?:rams)?\s*(?:of\s*)?protein/,
  ];
  for (const pattern of proteinPatterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const grams = Number(match[1]);
    const index = match.index ?? 0;
    const around = windowBefore(normalized, index, 24) + normalized.slice(index, index + match[0].length + 16);
    const perMeal = /per meal|each meal|a meal/.test(around);
    const perDay = /per day|a day|daily/.test(around);
    if ((perDay || (constraints.dailyCalories && grams >= 70 && !perMeal)) && !perMeal) {
      constraints.dailyMinProtein = grams;
    } else {
      constraints.minProtein = grams;
    }
    break;
  }

  const fatMatch = normalized.match(
    /(?:less than|under|below|at most|max(?:imum)?)\s+(\d+)\s*g(?:rams)?\s*(?:of\s*)?fat/,
  );
  if (fatMatch) constraints.maxFat = Number(fatMatch[1]);

  const carbMatch = normalized.match(
    /(?:less than|under|below|at most)\s+(\d+)\s*g(?:rams)?\s*(?:of\s*)?(?:carbs|carbohydrates)/,
  );
  if (carbMatch) constraints.maxCarbs = Number(carbMatch[1]);

  const allergyLead =
    /(?:allergic to|allergy to|allergies to)\s+([a-z][a-z -]{1,40}?)(?=,|\.|$| and | with )/g;
  for (const match of normalized.matchAll(allergyLead)) {
    rememberAllergy(constraints, match[1].trim());
  }
  const allergyTail = /([a-z][a-z -]{1,30}?)\s+allerg(?:y|ies|ic)/g;
  for (const match of normalized.matchAll(allergyTail)) {
    rememberAllergy(constraints, match[1].trim());
  }

  const avoidance = /(?:\bno\b|\bwithout\b|\bavoid\b)\s+([a-z][a-z -]{1,24})/g;
  for (const match of normalized.matchAll(avoidance)) {
    const phrase = match[1].trim();
    if (/^(more|less|fewer|meat|gluten|dairy|nuts)\b/.test(phrase)) continue;
    if (ALLERGEN_WORDS.some((entry) => entry.pattern.test(phrase))) {
      rememberAllergy(constraints, phrase);
    }
  }

  constraints.pantry = unique([...constraints.pantry, ...pantry]);
  applyPresets(constraints, presets);

  if (conflictsWithVegan(constraints, normalized)) {
    return {
      constraints,
      warnings,
      refusal: {
        title: "Those requirements cancel each other",
        message:
          "A vegan request cannot also require fish, meat, eggs, or dairy. Mise will not pretend one recipe can be both.",
        suggestion: "Drop the animal food, or drop “vegan” and keep a vegetarian or pescatarian filter.",
        suggestedText: "high protein vegetarian",
      },
    };
  }

  if (constraints.plan && constraints.days == null) {
    constraints.days = /\bmeal plan\b|\bweekly\b|\bfor the week\b/.test(normalized) ? 3 : 1;
  }
  if (constraints.plan && constraints.mealsPerDay == null) constraints.mealsPerDay = 3;

  const refusal = safetyRefusal(constraints);
  if (constraints.celiac) {
    warnings.push({
      tone: "danger",
      title: "Gluten-free here is not a celiac guarantee",
      message:
        "Celiac was read as “exclude ingredients tagged with gluten.” The library cannot see cross-contact, shared fryers, or how a product was made.",
    });
  }
  if (constraints.medicalTerms.length > 0 && !refusal) {
    warnings.push({
      tone: "danger",
      title: "Not a plan for a medical condition",
      message: `Mise noticed “${constraints.medicalTerms.join(", ")}” and will not treat it as a clinical target. Any plates below use only the food rules it could read, such as protein, fat, or a diet tag. This is not care for that condition.`,
    });
  }
  if (constraints.halalRequested) {
    warnings.push({
      tone: "danger",
      title: "Halal cannot be verified here",
      message:
        "The library has no certification or slaughter field. Pork, alcohol, and shellfish are excluded, and everything else still needs your own check. Nothing on this page is certified halal.",
    });
    constraints.allergies = unique([...constraints.allergies]);
  }
  if (constraints.kosherRequested) {
    return {
      constraints,
      warnings,
      refusal: {
        title: "Mise cannot mark a meal kosher",
        message:
          "There is no kosher certification, equipment status, or separation data in this library. Showing plates anyway would look like a match. It is not one.",
        suggestion: "Search by the food rules you do want enforced, such as vegetarian or no shellfish, and verify kosher status yourself.",
      },
    };
  }
  if (constraints.unknownAllergies.length > 0) {
    warnings.push({
      tone: "danger",
      title: `${constraints.unknownAllergies.join(", ")} is not a filter`,
      message: `Mise only has structured allergen fields for ${Object.values(ALLERGEN_LABEL).join(", ")}. It will not pretend these results are safe for ${constraints.unknownAllergies.join(", ")}. Read every card as unfiltered for that allergy.`,
    });
  }
  if (constraints.allergies.length > 0) {
    warnings.push({
      tone: "info",
      title: "No identified allergen is not a guarantee",
      message:
        "Known allergens are removed when they appear on an ingredient line. That is not a promise about brands, “may contain” statements, or cross-contact. Check the package.",
    });
  }

  constraints.chips = buildChips(constraints);
  return { constraints, warnings, refusal };
}

function rememberAllergy(constraints: Constraints, phrase: string) {
  const known = ALLERGEN_WORDS.find((entry) => entry.pattern.test(phrase));
  if (known) {
    addAllergy(constraints, known.allergen);
    if (known.allergen === "nuts" || known.allergen === "peanuts") addDiet(constraints, "nut-free");
    if (known.allergen === "dairy") addDiet(constraints, "dairy-free");
    if (known.allergen === "gluten") addDiet(constraints, "gluten-free");
    return;
  }
  if (/\b(nuts?)\b/.test(phrase)) {
    addAllergy(constraints, "nuts");
    addAllergy(constraints, "peanuts");
    addDiet(constraints, "nut-free");
    return;
  }
  const cleaned = phrase.replace(/\b(the|a|an|very|severe|dangerous)\b/g, "").trim();
  if (cleaned && !constraints.unknownAllergies.includes(cleaned)) {
    constraints.unknownAllergies.push(cleaned);
  }
}

function safetyRefusal(constraints: Constraints): Refusal | null {
  if (constraints.medicalTerms.length > 0 && constraints.chips.length === 0 && !hasFoodRule(constraints)) {
    return {
      title: "Mise does not plan for a medical condition",
      message:
        "The request names a health condition and no separate food rule. Mise will not invent a therapeutic diet.",
      suggestion: "A clinician or dietitian should do that. You can still ask for a general pattern such as “vegetarian, high protein.”",
      suggestedText: "vegetarian high protein",
    };
  }

  if (constraints.dailyCalories != null && constraints.dailyCalories < MIN_DAILY_KCAL) {
    return {
      title: "That daily target is below the floor",
      message: `${constraints.dailyCalories.toLocaleString()} kcal a day is under ${MIN_DAILY_KCAL.toLocaleString()} kcal. Mise will not build a plan that low.`,
      suggestion: `Try a day of at least ${MIN_DAILY_KCAL.toLocaleString()} kcal, or talk with a clinician if you are on a supervised plan.`,
      suggestedText: "three meals per day, about 1,800 kcal",
    };
  }

  if (constraints.dailyCalories != null && constraints.dailyCalories > MAX_DAILY_KCAL) {
    return {
      title: "That daily target is above what Mise will plan",
      message: `${constraints.dailyCalories.toLocaleString()} kcal a day is over ${MAX_DAILY_KCAL.toLocaleString()} kcal, so this request stops here.`,
      suggestion: `Try a target under ${MAX_DAILY_KCAL.toLocaleString()} kcal.`,
      suggestedText: "three meals per day, about 2,400 kcal",
    };
  }

  const mealBudget =
    constraints.maxCalories ??
    (constraints.dailyCalories && constraints.mealsPerDay
      ? Math.round(constraints.dailyCalories / constraints.mealsPerDay)
      : undefined);

  if (constraints.minProtein != null && mealBudget != null) {
    const proteinKcal = constraints.minProtein * 4;
    if (proteinKcal > mealBudget * 0.65 || (constraints.minProtein >= 80 && mealBudget <= 700)) {
      return {
        title: "Those numbers do not fit in one plate",
        message: `${constraints.minProtein} g of protein is about ${proteinKcal} kcal from protein alone. That does not leave a realistic remainder inside about ${mealBudget} kcal.`,
        suggestion: "Lower the protein, or raise the calories. A single plate around 35–50 g of protein is a more ordinary high-protein meal.",
        suggestedText: "at least 40 g protein and less than 600 kcal",
      };
    }
  }

  if (
    constraints.maxCalories != null &&
    constraints.maxCalories < 200 &&
    !constraints.mealTypes.includes("snack") &&
    constraints.dailyCalories == null
  ) {
    return {
      title: "That is too small to call a meal",
      message: `A full plate under ${constraints.maxCalories} kcal is below what Mise will recommend.`,
      suggestion: "Ask for a snack, or raise the calorie allowance.",
      suggestedText: "high protein snack under 400 kcal",
    };
  }

  if (constraints.dailyMinProtein != null && constraints.dailyCalories != null) {
    const proteinKcal = constraints.dailyMinProtein * 4;
    if (proteinKcal > constraints.dailyCalories * 0.6) {
      return {
        title: "That daily protein target does not fit",
        message: `${constraints.dailyMinProtein} g of protein is about ${proteinKcal} kcal, which is most of a ${constraints.dailyCalories} kcal day and leaves too little room for the rest of the food.`,
        suggestion: "Lower the protein target or raise the calories.",
      };
    }
  }

  return null;
}

function hasFoodRule(constraints: Constraints) {
  return (
    constraints.diets.length > 0 ||
    constraints.allergies.length > 0 ||
    constraints.highProtein ||
    constraints.lowFat ||
    constraints.lowCarb ||
    constraints.maxCalories != null ||
    constraints.minProtein != null ||
    constraints.maxFat != null ||
    constraints.dailyCalories != null ||
    constraints.mealTypes.length > 0 ||
    constraints.budget != null
  );
}

function buildChips(constraints: Constraints): Chip[] {
  const chips: Chip[] = [];
  const dietLabel: Record<DietTag, string> = {
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    pescatarian: "Pescatarian",
    "gluten-free": "Gluten-free",
    "dairy-free": "Dairy-free",
    "nut-free": "No peanuts or tree nuts",
  };
  for (const diet of constraints.diets) chips.push({ id: diet, label: dietLabel[diet], tone: "hard" });
  for (const allergy of constraints.allergies) {
    if (constraints.diets.includes("nut-free") && (allergy === "nuts" || allergy === "peanuts")) continue;
    if (constraints.diets.includes("dairy-free") && allergy === "dairy") continue;
    if (constraints.diets.includes("gluten-free") && allergy === "gluten") continue;
    chips.push({
      id: `allergy-${allergy}`,
      label: `No ${ALLERGEN_LABEL[allergy]}`,
      tone: "hard",
    });
  }
  if (constraints.highProtein) {
    chips.push({ id: "high-protein", label: `High protein · ${HIGH_PROTEIN_G} g or more`, tone: "soft" });
  }
  if (constraints.lowFat) chips.push({ id: "low-fat", label: `Low fat · ${LOW_FAT_G} g or less`, tone: "soft" });
  if (constraints.lowCarb) chips.push({ id: "low-carb", label: `Low carb · ${LOW_CARB_G} g or less`, tone: "soft" });
  if (constraints.minProtein != null) {
    chips.push({ id: "min-protein", label: `At least ${constraints.minProtein} g protein`, tone: "hard" });
  }
  if (constraints.dailyMinProtein != null) {
    chips.push({
      id: "daily-protein",
      label: `At least ${constraints.dailyMinProtein} g protein in the day`,
      tone: "hard",
    });
  }
  if (constraints.maxFat != null) chips.push({ id: "max-fat", label: `At most ${constraints.maxFat} g fat`, tone: "hard" });
  if (constraints.maxCarbs != null) {
    chips.push({ id: "max-carbs", label: `At most ${constraints.maxCarbs} g carbs`, tone: "hard" });
  }
  if (constraints.maxCalories != null) {
    chips.push({ id: "max-kcal", label: `At most ${constraints.maxCalories} kcal · 10% band`, tone: "hard" });
  }
  if (constraints.minCalories != null && constraints.dailyCalories == null) {
    chips.push({ id: "min-kcal", label: `Around ${constraints.minCalories} kcal or more`, tone: "soft" });
  }
  if (constraints.dailyCalories != null) {
    chips.push({ id: "daily-kcal", label: `About ${constraints.dailyCalories} kcal in the day`, tone: "hard" });
  }
  if (constraints.mealsPerDay) {
    chips.push({ id: "meals", label: `${constraints.mealsPerDay} meals`, tone: "soft" });
  }
  if (constraints.days) chips.push({ id: "days", label: `${constraints.days} day${constraints.days === 1 ? "" : "s"}`, tone: "soft" });
  for (const meal of constraints.mealTypes) chips.push({ id: meal, label: capitalize(meal), tone: "soft" });
  if (constraints.budget === "low") {
    chips.push({ id: "budget", label: "Prefers a lower grocery bill", tone: "soft" });
  }
  if (constraints.pantry.length) {
    chips.push({ id: "pantry", label: `Uses ${constraints.pantry.join(", ")} if it can`, tone: "soft" });
  }
  for (const unknown of constraints.unknownAllergies) {
    chips.push({ id: `unknown-${unknown}`, label: `${capitalize(unknown)} · not filtered`, tone: "warn" });
  }
  if (constraints.halalRequested) {
    chips.push({ id: "halal", label: "Pork, alcohol, and shellfish excluded · not certified", tone: "warn" });
  }
  return chips;
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export function syncChips(constraints: Constraints) {
  constraints.chips = buildChips(constraints);
  return constraints;
}

function conflictsWithVegan(constraints: Constraints, text: string) {
  if (!constraints.diets.includes("vegan")) return false;
  return FOOD_CONFLICTS.some((food) => {
    const match = new RegExp(`\\b${food}\\b`).exec(text);
    if (!match || match.index == null) return false;
    const before = text.slice(Math.max(0, match.index - 12), match.index);
    return !/\b(no|without|avoid|allergic)\b/.test(before);
  });
}
