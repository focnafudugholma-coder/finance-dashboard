# Finance Dashboard

A simple personal finance dashboard built with plain HTML, CSS and JavaScript. Add income and expenses, filter by month, see a spending chart by category, and export your data to CSV. It works on its own (data saved in your browser) or connected to my [Finance API](https://github.com/focnafudugholma-coder/finance-api) (data saved in a SQLite database).

## Features
- Add and delete income and expense transactions
- Live totals: income, expenses and balance
- Filter by month, or view all months
- Expenses by category chart (pure CSS, no chart library)
- Export the current view to CSV
- Responsive layout and automatic dark mode
- Two modes: connects to the Finance API when it is running, otherwise saves data with `localStorage`

## How to run
1. Download or clone this repository.
2. Open `index.html` in your browser. No installation needed.

## Using it with the Finance API
1. Start the API from the `finance-api` repository (`npm install`, then `npm start`). It runs at `http://localhost:3000`.
2. Open this dashboard from the same computer (open `index.html`, or use `http://localhost`).
3. The badge at the top shows **Connected to the Finance API**. Your data is now stored in the database.

If the API is not running (or the dashboard is opened from the public website), it automatically uses local mode.

## Project structure
```
index.html   page structure
style.css    layout, colors, dark mode
app.js       logic: storage, rendering, filters, CSV export
```

## What I practiced
- DOM manipulation and event handling
- Saving and loading data with `localStorage`
- Calling a REST API with `fetch` (async/await, error handling, timeout, fallback)
- Safe rendering of user input (`textContent` instead of `innerHTML`)
- Filtering, grouping and summing data with `filter` and `reduce`
- Responsive CSS with Grid and Flexbox

## Roadmap
- [x] Backend API to store the data in a database ([finance-api](https://github.com/focnafudugholma-coder/finance-api))
- [ ] User login
- [ ] Edit transactions
- [ ] Monthly budget limits per category
- [ ] Multiple currencies

## Author
Holma Focna Fudug
