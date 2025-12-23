const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const content = document.getElementById("content");

function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
}

function esc(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderProfile(user, country, rates, news) {
    const langs = country.languages && country.languages.length ? country.languages.join(", ") : "N/A";

    const newsCards = (news || [])
        .map(a => {
            const img = a.image
                ? `<img src="${esc(a.image)}" alt="news" style="width:100%; max-height:220px; object-fit:cover; border-radius:12px; border:1px solid #1f2937; margin:10px 0;" />`
                : "";
            const link = a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noreferrer">Open article</a>` : "";
            const src = a.source ? `<div style="opacity:.8; margin-top:6px;">Source: ${esc(a.source)}</div>` : "";
            return `
        <div class="card">
          <h3 style="margin-top:0;">${esc(a.title)}</h3>
          ${img}
          <div>${esc(a.description)}</div>
          <div style="margin-top:10px;">${link}</div>
          ${src}
        </div>
      `;
        })
        .join("");

    content.innerHTML = `
    <div class="card">
      <div style="display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap;">
        <img src="${esc(user.picture)}" alt="Profile" style="width:130px; height:130px; border-radius:14px; object-fit:cover; border:1px solid #1f2937;" />
        <div style="min-width:240px;">
          <h2 style="margin:0 0 10px 0;">${esc(user.firstName)} ${esc(user.lastName)}</h2>
          <div><b>Gender:</b> ${esc(user.gender)}</div>
          <div><b>Age:</b> ${esc(user.age)}</div>
          <div><b>Date of birth:</b> ${esc(formatDate(user.dob))}</div>
          <div style="margin-top:10px;">
            <div><b>City:</b> ${esc(user.city)}</div>
            <div><b>Country:</b> ${esc(user.country)}</div>
            <div><b>Full address:</b> ${esc(user.address)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h3 style="margin:0;">Country Info</h3>
        ${country.flag ? `<img src="${esc(country.flag)}" alt="Flag" style="height:34px; border-radius:6px; border:1px solid #1f2937;" />` : ""}
      </div>
      <div style="margin-top:10px;">
        <div><b>Country name:</b> ${esc(country.name)}</div>
        <div><b>Capital:</b> ${esc(country.capital)}</div>
        <div><b>Official language(s):</b> ${esc(langs)}</div>
        <div><b>Currency:</b> ${esc(country.currency)}</div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">Exchange Rates</h3>
      <div>1 ${esc(rates.base || country.currency)} = ${esc(rates.USD)} USD</div>
      <div>1 ${esc(rates.base || country.currency)} = ${esc(rates.KZT)} KZT</div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">Top 5 News (EN)</h3>
      <div style="opacity:.85;">Query: ${esc(user.country)}</div>
    </div>

    ${newsCards || `<div class="card">No news found (check NEWS_API_KEY or quota).</div>`}
  `;
}

async function getProfile() {
    statusEl.textContent = "Loading user + country + rates + news...";
    content.innerHTML = "";

    try {
        const res = await fetch("/api/profile");
        const data = await res.json();

        if (!data.ok) {
            statusEl.textContent = data.message || "Error";
            return;
        }

        statusEl.textContent = "Done";
        renderProfile(data.user, data.country, data.rates, data.news);
    } catch (e) {
        statusEl.textContent = "Request failed";
    }
}

btn.addEventListener("click", getProfile);
