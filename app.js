// Finance Dashboard - plain JavaScript, no libraries.
// Two modes:
//   "api"   -> data is stored by the Finance API (SQLite database)
//   "local" -> data is stored in this browser with localStorage

const STORAGE_KEY = "finance-dashboard-v1";
const API_URL = "http://localhost:3000";
const CATEGORIES = ["Salary", "Housing", "Food", "Transport", "Health", "Education", "Entertainment", "Savings", "Other"];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const $ = (id) => document.getElementById(id);
let mode = "local";
let localTransactions = loadLocal();
let lastList = []; // transactions currently on screen (used by the CSV export)

// ---------- local storage ----------
function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localTransactions));
  } catch (e) {
    showError("Could not save data in this browser.");
  }
}

// ---------- API ----------
async function api(path, options) {
  const res = await fetch(API_URL + path, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors || [data.error]).join(", "));
  return data;
}

// Uses the API only when this page is opened on the same computer (localhost or a file)
// and the API answers. Otherwise it falls back to local mode.
async function detectMode() {
  const isLocalPage = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  if (!isLocalPage) return "local";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(API_URL + "/api/health", { signal: controller.signal });
    clearTimeout(timer);
    return res.ok ? "api" : "local";
  } catch (e) {
    return "local";
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

function currentMonth() {
  return $("all").checked ? "" : $("month").value;
}

// Same calculation the API does, used in local mode.
function summarize(list) {
  let income = 0;
  let expenses = 0;
  const byCategory = {};
  list.forEach((t) => {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expenses += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  });
  return {
    income,
    expenses,
    balance: Math.round((income - expenses) * 100) / 100,
    expensesByCategory: Object.entries(byCategory)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
  };
}

async function getData() {
  const month = currentMonth();
  if (mode === "api") {
    const query = month ? "?month=" + month : "";
    const [list, summary] = await Promise.all([api("/api/transactions" + query), api("/api/summary" + query)]);
    return { list, summary };
  }
  const list = localTransactions
    .filter((t) => !month || t.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
  return { list, summary: summarize(list) };
}

// ---------- actions ----------
async function addTransaction() {
  const description = $("description").value.trim();
  const amount = parseFloat($("amount").value);
  const date = $("date").value;

  if (!description) return showError("Please enter a description.");
  if (!(amount > 0)) return showError("Amount must be greater than zero.");
  if (!date) return showError("Please choose a date.");

  const tx = {
    description,
    amount: Math.round(amount * 100) / 100,
    type: $("type").value,
    category: $("category").value,
    date,
  };

  try {
    if (mode === "api") {
      await api("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
    } else {
      localTransactions.push({ id: Date.now() + Math.random(), ...tx });
      saveLocal();
    }
    showError("");
    $("description").value = "";
    $("amount").value = "";
    await render();
  } catch (e) {
    showError(e.message);
  }
}

async function deleteTransaction(id) {
  try {
    if (mode === "api") {
      await api("/api/transactions/" + id, { method: "DELETE" });
    } else {
      localTransactions = localTransactions.filter((t) => t.id !== id);
      saveLocal();
    }
    await render();
  } catch (e) {
    showError(e.message);
  }
}

function clearAll() {
  if (localTransactions.length === 0) return;
  if (confirm("Delete ALL transactions saved in this browser? This cannot be undone.")) {
    localTransactions = [];
    saveLocal();
    render();
  }
}

function exportCsv() {
  const rows = [["Date", "Description", "Category", "Type", "Amount"]];
  lastList.forEach((t) => rows.push([t.date, t.description, t.category, t.type, t.amount.toFixed(2)]));
  const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ---------- rendering ----------
async function render() {
  try {
    const { list, summary } = await getData();
    lastList = list;

    $("income").textContent = money.format(summary.income);
    $("expenses").textContent = money.format(summary.expenses);
    $("balance").textContent = money.format(summary.balance);
    $("balance").className = summary.balance < 0 ? "negative" : "positive";

    renderList(list);
    renderChart(summary.expensesByCategory);
  } catch (e) {
    showError("Could not load data: " + e.message);
  }
}

function renderList(list) {
  const tbody = $("list");
  tbody.textContent = "";
  $("empty").style.display = list.length ? "none" : "block";

  list.forEach((t) => {
    const tr = document.createElement("tr");
    [t.date, t.description, t.category].forEach((text) => {
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

function renderChart(entries) {
  const chart = $("chart");
  chart.textContent = "";
  $("chart-empty").style.display = entries.length ? "none" : "block";
  if (!entries.length) return;

  const max = entries[0].total;
  entries.forEach(({ category, total }) => {
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
async function init() {
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

  mode = await detectMode();
  if (mode === "api") {
    $("mode").textContent = "Connected to the Finance API. Data is saved in the database.";
    $("clear").style.display = "none"; // "Clear all" only applies to browser data
  } else {
    $("mode").textContent = "Local mode. Data is saved in this browser.";
  }
  await render();
}

init();
