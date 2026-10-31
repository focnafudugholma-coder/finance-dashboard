// Finance Dashboard - plain JavaScript, no libraries.
// Data is saved in the browser with localStorage.

const STORAGE_KEY = "finance-dashboard-v1";
const CATEGORIES = ["Salary", "Housing", "Food", "Transport", "Health", "Education", "Entertainment", "Savings", "Other"];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const $ = (id) => document.getElementById(id);
let transactions = loadData();

// ---------- storage ----------
function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    showError("Could not save data in this browser.");
  }
}

// ---------- helpers ----------
function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function showError(message) {
  $("error").textContent = message;
}

function getVisible() {
  const showAll = $("all").checked;
  const month = $("month").value;
  return transactions
    .filter((t) => showAll || !month || t.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ---------- actions ----------
function addTransaction() {
  const description = $("description").value.trim();
  const amount = parseFloat($("amount").value);
  const date = $("date").value;

  if (!description) return showError("Please enter a description.");
  if (!(amount > 0)) return showError("Amount must be greater than zero.");
  if (!date) return showError("Please choose a date.");

  transactions.push({
    id: Date.now() + Math.random(),
    description,
    amount: Math.round(amount * 100) / 100,
    type: $("type").value,
    category: $("category").value,
    date,
  });
  saveData();
  showError("");
  $("description").value = "";
  $("amount").value = "";
  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
  render();
}

function clearAll() {
  if (transactions.length === 0) return;
  if (confirm("Delete ALL transactions? This cannot be undone.")) {
    transactions = [];
    saveData();
    render();
  }
}

function exportCsv() {
  const rows = [["Date", "Description", "Category", "Type", "Amount"]];
  getVisible().forEach((t) => rows.push([t.date, t.description, t.category, t.type, t.amount.toFixed(2)]));
  const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ---------- rendering ----------
function render() {
  const visible = getVisible();

  const income = visible.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = visible.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  $("income").textContent = money.format(income);
  $("expenses").textContent = money.format(expenses);
  const balance = income - expenses;
  $("balance").textContent = money.format(balance);
  $("balance").className = balance < 0 ? "negative" : "positive";

  renderList(visible);
  renderChart(visible);
}

function renderList(visible) {
  const tbody = $("list");
  tbody.textContent = "";
  $("empty").style.display = visible.length ? "none" : "block";

  visible.forEach((t) => {
    const tr = document.createElement("tr");
    const cells = [t.date, t.description, t.category];
    cells.forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text; // textContent keeps user text safe from HTML injection
      tr.appendChild(td);
    });

    const amountTd = document.createElement("td");
    amountTd.className = "right " + (t.type === "income" ? "positive" : "negative");
    amountTd.textContent = (t.type === "income" ? "+" : "-") + money.format(t.amount);
    tr.appendChild(amountTd);

    const delTd = document.createElement("td");
    delTd.className = "delete";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.setAttribute("aria-label", "Delete " + t.description);
    btn.addEventListener("click", () => deleteTransaction(t.id));
    delTd.appendChild(btn);
    tr.appendChild(delTd);

    tbody.appendChild(tr);
  });
}

function renderChart(visible) {
  const chart = $("chart");
  chart.textContent = "";

  const totals = {};
  visible.filter((t) => t.type === "expense").forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  $("chart-empty").style.display = entries.length ? "none" : "block";
  if (!entries.length) return;

  const max = entries[0][1];
  entries.forEach(([category, total]) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const name = document.createElement("span");
    name.textContent = category;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = (total / max) * 100 + "%";
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = money.format(total);

    row.append(name, track, value);
    chart.appendChild(row);
  });
}

// ---------- start ----------
function init() {
  CATEGORIES.forEach((c) => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    $("category").appendChild(option);
  });
  $("date").value = todayLocal();
  $("month").value = todayLocal().slice(0, 7);

  $("add").addEventListener("click", addTransaction);
  $("description").addEventListener("keydown", (e) => { if (e.key === "Enter") addTransaction(); });
  $("amount").addEventListener("keydown", (e) => { if (e.key === "Enter") addTransaction(); });
  $("month").addEventListener("change", render);
  $("all").addEventListener("change", render);
  $("export").addEventListener("click", exportCsv);
  $("clear").addEventListener("click", clearAll);
  render();
}

init();
