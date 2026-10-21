export type Allergen =
  | "dairy"
  | "gluten"
  | "nuts"
  | "peanuts"
  | "shellfish"
  | "fish"
  | "eggs"
  | "soy"
  | "sesame";

export type Kind =
  | "poultry"
  | "meat"
  | "pork"
  | "fish"
  | "shellfish"
  | "dairy"
  | "egg"
  | "plant";

export type Aisle = "Produce" | "Proteins" | "Dairy & eggs" | "Grains" | "Pantry";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type Budget = "low" | "mid" | "high";

export type DietTag =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "gluten-free"
  | "dairy-free"
  | "nut-free";

export type Ingredient = {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  aisle: Aisle;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  allergens: Allergen[];
  kinds: Kind[];
};

export type Art = {
  cloth: string;
  a: string;
  b: string;
  c: string;
};

export type Recipe = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  mealTypes: MealType[];
  budget: Budget;
  beginner: boolean;
  art: Art;
  ingredients: Ingredient[];
  steps: string[];
  note: string;
  diets: DietTag[];
};

export type Nutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

export type Chip = {
  id: string;
  label: string;
  tone?: "hard" | "soft" | "warn";
};

export type Constraints = {
  diets: DietTag[];
  allergies: Allergen[];
  unknownAllergies: string[];
  highProtein: boolean;
  lowFat: boolean;
  lowCarb: boolean;
  maxCalories?: number;
  minCalories?: number;
  minProtein?: number;
  maxFat?: number;
  maxCarbs?: number;
  dailyCalories?: number;
  dailyMinProtein?: number;
  mealsPerDay?: number;
  days?: number;
  plan: boolean;
  mealTypes: MealType[];
  budget?: Budget;
  pantry: string[];
  halalRequested: boolean;
  kosherRequested: boolean;
  medicalTerms: string[];
  eatingDisorder: boolean;
  celiac: boolean;
  chips: Chip[];
  rawText: string;
};

export type WarningNote = {
  tone: "danger" | "info";
  title: string;
  message: string;
};

export type Refusal = {
  title: string;
  message: string;
  suggestion?: string;
  suggestedText?: string;
};

export type Profile = {
  age: string;
  sex: "" | "female" | "male";
  weightKg: string;
  heightCm: string;
  activity: "sedentary" | "light" | "moderate" | "active";
  allergies: Allergen[];
  diets: DietTag[];
  calorieTarget: string;
};

export type ShoppingLine = {
  id: string;
  key: string;
  name: string;
  quantity: number;
  unit: string;
  aisle: Aisle;
  recipes: string[];
  checked: boolean;
};
