# Finance Dashboard

A simple personal finance dashboard built with plain HTML, CSS and JavaScript. Add income and expenses, filter by month, see a spending chart by category, and export your data to CSV. Everything is saved in your browser, so there is no server and no account.

## Features
- Add and delete income and expense transactions
- Live totals: income, expenses and balance
- Filter by month, or view all months
- Expenses by category chart (pure CSS, no chart library)
- Export the current view to CSV
- Responsive layout and automatic dark mode
- Data saved with `localStorage`

## How to run
1. Download or clone this repository.
2. Open `index.html` in your browser. No installation needed.

## Project structure
```
index.html   page structure
style.css    layout, colors, dark mode
app.js       logic: storage, rendering, filters, CSV export
```

## What I practiced
- DOM manipulation and event handling
- Saving and loading data with `localStorage`
- Safe rendering of user input (`textContent` instead of `innerHTML`)
- Filtering, grouping and summing data with `filter` and `reduce`
- Responsive CSS with Grid and Flexbox

## Roadmap
- [ ] Backend API to store the data in a database
- [ ] User login
- [ ] Edit transactions
- [ ] Monthly budget limits per category
- [ ] Multiple currencies

## Author
Holma Focna Fudug
