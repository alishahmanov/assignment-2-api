const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
    res.json({ ok: true, message: "Server is running" });
});

app.get("/api/profile", async (req, res) => {
    try {
        const userResp = await axios.get("https://randomuser.me/api/");
        const u = userResp.data.results[0];

        const user = {
            firstName: u.name.first,
            lastName: u.name.last,
            gender: u.gender,
            picture: u.picture.large,
            age: u.dob.age,
            dob: u.dob.date,
            city: u.location.city,
            country: u.location.country,
            address: `${u.location.street.name} ${u.location.street.number}`,
        };

        let country = {
            name: user.country,
            capital: "N/A",
            languages: [],
            currency: "N/A",
            flag: "",
        };

        try {
            const countryUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(
                user.country
            )}?fullText=true`;
            const countryResp = await axios.get(countryUrl, {
                headers: { "X-API-KEY": process.env.REST_COUNTRIES_API_KEY || "" },
            });
            const c = Array.isArray(countryResp.data) ? countryResp.data[0] : null;

            if (c) {
                country = {
                    name: c.name?.common || user.country,
                    capital: Array.isArray(c.capital) ? c.capital[0] : (c.capital || "N/A"),
                    languages: c.languages ? Object.values(c.languages) : [],
                    currency: c.currencies ? Object.keys(c.currencies)[0] : "N/A",
                    flag: c.flags?.png || c.flags?.svg || "",
                };
            }
        } catch (e) {}

        let rates = { base: country.currency, USD: "N/A", KZT: "N/A" };
        if (country.currency && country.currency !== "N/A" && process.env.EXCHANGE_RATE_API_KEY) {
            try {
                const rateUrl = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${country.currency}`;
                const rateResp = await axios.get(rateUrl);
                rates = {
                    base: country.currency,
                    USD: rateResp.data.conversion_rates?.USD ?? "N/A",
                    KZT: rateResp.data.conversion_rates?.KZT ?? "N/A",
                };
            } catch (e) {}
        }

        let news = [];
        if (process.env.NEWS_API_KEY) {
            try {
                const q = user.country;
                const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
                    q
                )}&language=en&pageSize=20&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;

                const newsResp = await axios.get(newsUrl);
                const articles = Array.isArray(newsResp.data.articles) ? newsResp.data.articles : [];
                const qLower = q.toLowerCase();

                const mustContain = articles.filter(a => (a.title || "").toLowerCase().includes(qLower));
                const fallback = articles.filter(a => !(a.title || "").toLowerCase().includes(qLower));
                const picked = [...mustContain, ...fallback].slice(0, 5);

                news = picked.map(a => ({
                    title: a.title || "No title",
                    image: a.urlToImage || "",
                    description: a.description || "",
                    url: a.url || "",
                    source: a.source?.name || "",
                }));
            } catch (e) {}
        }

        res.json({ ok: true, user, country, rates, news });
    } catch (e) {
        res.status(500).json({ ok: false, message: "Failed to build profile" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
