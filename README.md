# Mise

A small web demo that turns a dietary requirement into a shortlist of meals, then a recipe, a shopping checklist, and nutrition that adds up from the ingredient lines.

This slice runs entirely in the browser from a local library of 24 plates. It does not call a recipe API or a language model. It is general food information, not medical advice. Requests under 1,200 kcal a day, and impossible plates such as 500 kcal with 100 g of protein, are refused.

## Run it

```bash
npm install
npm run dev -- --port 4721
```

Open [http://127.0.0.1:4721](http://127.0.0.1:4721).

Try “Low fat, high protein, vegetarian”, a five-day high-protein plan, or “200 calories per day”.

Preferences, saved meals, and the kitchen list stay in the browser. A plan can merge its ingredients into one grocery list. Print or save PDF uses the browser print dialog. The app does not call a recipe API, read barcodes, or send what you type to a model.
