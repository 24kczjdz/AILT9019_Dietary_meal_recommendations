# Mise

A web demo that turns a dietary requirement into a shortlist of meals, then a recipe, a shopping checklist, and nutrition that adds up from the ingredient lines.

It runs from a local library of 24 plates. Search, fit scores, and nutrition stay on that library. A free-text request asks a Cloudflare Worker for search tags, then for a score on the plates that already passed the rules. It is general food information, not medical advice.

Repository: https://github.com/24kczjdz/AILT9019_Dietary_meal_recommendations

The repository is public, so the course team can open the code without an account.

## Setup

Install Node.js 22, then from this folder:

```bash
npm install
npm run build
npx serve out -l tcp://0.0.0.0:4721
```

Open http://127.0.0.1:4721

To skip the local install, open the published copy:

https://24kczjdz.github.io/AILT9019_Dietary_meal_recommendations/

## Core path

1. On the home page, choose **Get started**.
2. Type a goal, such as `Low fat, high protein, vegetarian`. Filters and ingredients-at-home chips are optional. They stay selected on their own and are sent with the sentence.
3. Choose **See meals**.
4. The next page lists matching plates with a photo, a short description, calories, protein, a fit score, and why the plate matched.
5. Choose **Open** on one plate.
6. The recipe page shows the photo, nutrition totals, an ingredient table, a checklist, numbered steps, and a YouTube video. **Add to kitchen list** stores the ingredients in this browser.

**Preferences** on Search or Plates can store age, weight, height, activity, diet tags, and allergies. Saved diets and allergies apply on the next search. A saved calorie target is used only for a meal plan.

## How to check the result

Use these inputs and compare the screen with the expected result.

| Input | Expected result |
| --- | --- |
| `Low fat, high protein, vegetarian` | A photo list of plates. Each one is vegetarian, at least about 30 g protein, and at most about 15 g fat. The page shows the tags it applied. |
| Open any plate on that list | Amounts, steps, and a nutrition table. The ingredient rows use the same rounded figures as the totals, so the rows add up to the total. A YouTube player is on the page. Its method can differ from the written steps. |
| `High-protein meal plan for five days` | Five days, three meals on day 1, and one merged grocery list for the whole plan. |
| `200 calories per day` | A refusal. The daily target is below 1,200 kcal. |
| `500 calories and 100 g protein` | A refusal. Those numbers do not fit in one plate. |

A saved plan target under 1,200 kcal is also refused. Preferences explains that an allergy filter is not a guarantee about brands or cross-contact.

## AI recommend and score

A free-text request such as “Italian food” asks the Worker at `https://mise-ai.mealmate-3036588333.workers.dev/ai` for a short phrase and a few search tags taken from words already in the 24-plate library. Plates that pass saved diets and allergies are ordered by how many of those tags appear in the title, summary, or ingredient names; plates with no tag hits are listed separately. Plates that match the tags but break a saved rule stay off that list, with a short note saying why. The same Worker then scores the plates that remain, and each of those cards and the recipe page show an AI mark. The model does not add dishes or change the calorie totals. The library fit score still shows if the Worker does not answer.

To run a copy of that proxy on this computer instead, put the group key in `.env.local` (this file is not committed):

```bash
cp .env.example .env.local
```

Set `AI_API_KEY` in that file, then:

```bash
npm run ai
```

Build with `NEXT_PUBLIC_AI_URL=http://127.0.0.1:4722/ai` if you want the site to call that local server.

Photo and barcode lookup is not available. Use the ingredient chips instead.
