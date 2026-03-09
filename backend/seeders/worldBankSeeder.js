// this script fetches economic data of India from World Bank API
// and stores it in official_data_cache table

// run this once before starting the project
// command: npm run seed (inside backend folder)

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const axios = require("axios");
const db = require("../config/db");

// list of indicators we want to store
const INDICATORS = [
  { name: "gdp_growth_rate", code: "NY.GDP.MKTP.KD.ZG", label: "GDP growth" },
  { name: "inflation_rate", code: "FP.CPI.TOTL.ZG", label: "Inflation rate" },
  { name: "unemployment_rate", code: "SL.UEM.TOTL.ZS", label: "Unemployment rate" },
  { name: "population", code: "SP.POP.TOTL", label: "Population" },
  { name: "gdp_usd", code: "NY.GDP.MKTP.CD", label: "GDP (USD)" },
  { name: "gdp_per_capita_usd", code: "NY.GDP.PCAP.CD", label: "GDP per capita" },
  { name: "literacy_rate", code: "SE.ADT.LITR.ZS", label: "Literacy rate" },
  { name: "poverty_rate", code: "SI.POV.NAHC", label: "Poverty rate" },
];

const COUNTRY = "IN";
const BASE_URL = "https://api.worldbank.org/v2";


// function to fetch indicator data from world bank
async function fetchIndicator(indicator) {

  const { data } = await axios.get(
    `${BASE_URL}/country/${COUNTRY}/indicator/${indicator.code}`,
    {
      params: {
        format: "json",
        per_page: 30,
        mrv: 30,
      },
      timeout: 15000,
    }
  );

  // world bank api returns [meta, actualData]
  const records = data[1];

  if (!Array.isArray(records)) return [];

  return records
    .filter((r) => r.value !== null)
    .map((r) => ({
      metric_name: indicator.name,
      year: parseInt(r.date),
      value: parseFloat(r.value),
      source: `World Bank - ${indicator.label}`,
    }));
}


// main seed function
async function seed() {

  console.log("Fetching data from World Bank API...");

  let inserted = 0;
  let failed = 0;

  for (const indicator of INDICATORS) {

    try {

      const records = await fetchIndicator(indicator);

      for (const r of records) {

        await db.query(
          `INSERT INTO official_data_cache (metric_name, year, value, source)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             value = VALUES(value),
             source = VALUES(source),
             last_updated = NOW()`,
          [r.metric_name, r.year, r.value, r.source]
        );

        inserted++;

      }

      console.log(`OK ${indicator.name}: ${records.length} rows`);

    } catch (err) {

      console.error(`FAIL ${indicator.name}: ${err.message}`);

      failed++;

    }

  }

  console.log(`\nDone. Total rows inserted/updated: ${inserted}`);
  console.log(`Failed indicators: ${failed}`);

  await db.end();

  process.exit(failed > 0 ? 1 : 0);
}

seed().catch((err) => {
  console.error("Seeder crashed:", err.message);
  process.exit(1);
});