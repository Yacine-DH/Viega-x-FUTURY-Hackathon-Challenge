# System Prompt: Project "Viega Intelligent Compass" 
## Data Ingestion Endpoints & Scraper Targeting (Pure Python)


### 1. Global Certifications (Coefficient: 1.0)
*Target: Public certification directories for Geberit, TECE, NIBCO, Conex Bänninger, SCHELL, Aliaxis, aalberts.*
* **DVGW (Germany/EU):** `https://www.dvgw-cert.com/en/certificated-products-companies/directory-of-products.html`
  * *Method:* `requests` POST/GET search queries.
* **WRAS (UK):** `https://www.wrasapprovals.co.uk/approvals-directory/`
* **NSF (Global/US):** `https://info.nsf.org/Certified/`

### 2. Global Patents (Coefficient: 1.0)
*Target: R&D trajectory via corporate `assignee` searches (e.g., "Geberit International AG").*
* **EPO Open Patent Services (OPS):** `https://developers.epo.org/`
  * *Method:* Official REST API. Highly structured JSON response. Extract abstract only.
* **Google Patents API:** Use `google-patent-scraper` library or SerpApi.

### 3. Regulations, Norms & Green Certs (Coefficient: 1.0)
*Target: Mandatory legal changes forcing immediate product adaptation.*
* **EUR-Lex (EU Law):** `https://eur-lex.europa.eu/`
  * *Method:* RSS feeds / API filtering for "Directives" + "building materials" or "water quality".
* **VDI-Richtlinien (Germany):** `https://www.vdi.de/richtlinien` (Monitor VDI 6023).
* **Ökobaudat (EPDs):** `https://www.oekobaudat.de/en.html`
  * *Method:* Open API for querying Environmental Product Declarations (CO2 metrics).

### 4. Competitor IR & PR (Coefficient: 1.0)
*Target: Official ad-hoc financial announcements and product PR.*
* **EU Competitors (Geberit, Aalberts, Aliaxis):**
  * *Method:* `BeautifulSoup4` or `feedparser` targeting exact investor relations URLs (e.g., `https://www.geberit.com/investors/`).
* **US Competitors (NIBCO):**
  * *Method:* SEC EDGAR Database via `sec-api` Python package (`https://www.sec.gov/edgar/searchedgar/companysearch.html`).

### 5. Global Commodities & Raw Materials (Coefficient: 0.8)
*Target: Cost/Supply signals driving material pivots.*
* **Trading Economics API:** `https://tradingeconomics.com/api/`
  * *Method:* Fetch index pricing percentage shifts for Copper and Industrial Polymers.
* **London Metal Exchange (LME):** `https://www.lme.com/` (Scrape daily closing price for Copper).

### 6. Geopolitical & Tariff Alerts (Coefficient: 0.7)
*Target: Political risk tracking without social media hallucination.*
* **NewsAPI / Event Registry:** `https://newsapi.org/` or `https://eventregistry.org/`
  * *Method:* Python API wrapper. Strict boolean keyword queries: `"building materials tariff"`, `"supply chain disruption copper"`, `"European construction tax"`.

### 7. Public Tenders & Gov Demand (Coefficient: 0.8)
*Target: Verified, massive government project spending.*
* **TED (Tenders Electronic Daily - EU):** `https://ted.europa.eu/`
  * *Method:* Official TED API. Search strictly using sanitary/plumbing CPV codes (e.g., `45330000`).
* **DTVP / Bund.de (Germany):** `https://www.dtvp.de/`

---

**Instructions:**
Acknowledge receipt of this targeted ingestion list. Confirm that you understand the 3-day timestamp filter requirement for all upcoming scripts. Stand by for my instruction on which API or web scraper we will build first.