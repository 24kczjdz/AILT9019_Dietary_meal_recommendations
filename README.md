# Mise

A small web demo that turns a dietary requirement into a shortlist of meals, then a recipe, a shopping checklist, and nutrition that adds up from the ingredient lines.

This slice runs entirely in the browser from a local library of 24 plates. It does not call a recipe API or a language model. It is general food information, not medical advice. Requests under 1,200 kcal a day, and impossible plates such as 500 kcal with 100 g of protein, are refused.

## Run it

```bash
npm install
npm run dev -- --port 4721
```

Open [http://127.0.0.1:4721](http://127.0.0.1:4721).

The pages run in order: home, search, a photo list, then a recipe with a related YouTube video.

Try “Low fat, high protein, vegetarian”, or “200 calories per day”.

From a recipe you can add ingredients to a kitchen list kept in this browser. The app does not call a recipe API, read barcodes, or send what you type to a model. A related YouTube video sits on each recipe; its method and portions can differ from the page.
