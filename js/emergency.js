/* emergency.js — country selector + crisis resource rendering. No geo-IP. */

import { loadEmergency } from "./data.js";

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function contactHref(resource) {
  if (resource.tel) return `tel:${resource.tel.replace(/[^0-9+]/g, "")}`;
  if (resource.sms) return `sms:${resource.sms.replace(/[^0-9+]/g, "")}`;
  if (resource.url) return resource.url;
  return "#";
}

function resourceCard(r) {
  const contact = r.contact || r.tel || r.sms || "Visit";
  const isLink = !!r.url && !r.tel && !r.sms;
  return `<div class="crisis-resource">
      <div class="crisis-resource__info">
        <h3>${esc(r.name)}</h3>
        <p>${esc(r.description || "")}</p>
      </div>
      <a class="crisis-resource__contact" href="${esc(contactHref(r))}" ${isLink ? 'target="_blank" rel="noopener noreferrer"' : ""}>${esc(contact)}</a>
    </div>`;
}

function render(country, data) {
  const list = document.getElementById("crisis-list");
  const entry = data.countries[country] || data.countries[data.default];
  const resources = [];
  if (entry.emergency) resources.push({ name: "Emergency services", description: "Police, ambulance, fire — immediate danger to life.", contact: entry.emergency, tel: entry.emergency });
  (entry.resources || []).forEach((r) => resources.push(r));
  list.innerHTML = resources.map(resourceCard).join("");
  const heading = document.getElementById("country-heading");
  if (heading) heading.textContent = `Crisis & emergency support — ${entry.name}`;
}

async function init() {
  let data;
  try { data = await loadEmergency(); }
  catch (e) {
    console.error(e);
    document.getElementById("crisis-list").innerHTML = `<div class="empty-state"><p>Couldn't load crisis data. If you're in immediate danger, call your local emergency number now.</p></div>`;
    return;
  }

  const select = document.getElementById("country-select");
  const codes = Object.keys(data.countries);
  select.innerHTML = codes.map((c) => `<option value="${c}">${esc(data.countries[c].name)}</option>`).join("");

  // Default from stored choice, else the data default.
  const saved = localStorage.getItem("awth-country");
  const initial = saved && data.countries[saved] ? saved : data.default;
  select.value = initial;
  render(initial, data);

  select.addEventListener("change", () => {
    localStorage.setItem("awth-country", select.value);
    render(select.value, data);
  });
}

init();
