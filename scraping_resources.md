

**Primary Directive:** Social media (Reddit, YouTube, anonymous forums) is strictly excluded. The Intelligence Engine calculates decisions based on a mathematical formula: `(Core Pillar Data * 1.0) + (Enrichment Data * Coefficient) = Decision Confidence Score`.

---

## PART 1: THE 7 CORE HARD-FACT PILLARS (Coefficient Weight: 1.0)
*This is the foundational data. It is legally binding, audited, or scientifically measured.*

### 1. Global Certification Registries (The "Imminent Launch" Signal)
* **Sources & URLs:** DVGW (`cert.dvgw-cert.com`), WRAS (`wrasapprovals.co.uk`), NSF (`info.nsf.org/Certified/`).
* **Target:** `Geberit`, `TECE`, `NIBCO`, `Conex Bänninger`, `SCHELL`, `Aliaxis`, `aalberts`.
* **Extraction Schema:** `Certificate_ID` (PK), `Issuer`, `Manufacturer`, `Product_Category`, `Issue_Date`, `Source_URL`.
* **Presentation Rationale (Why):** These are legally mandated tests. A new certificate provides 100% factual proof that a competitor product is fully developed and launching imminently.

### 2. Global Patent Databases (The "R&D Trajectory" Signal)
* **Sources & URLs:** Google Patents API (`patents.google.com`), EPO Open Patent Services (`data.epo.org`).
* **Target:** Corporate legal entities (e.g., `assignee:"Geberit International AG"`).
* **Extraction Schema:** `Patent_ID` (PK), `Jurisdiction`, `Filing_Date`, `Title`, `Abstract_Only`, `Source_URL`.
* **Presentation Rationale (Why):** Reveals exactly where a competitor is investing their R&D budget, allowing us to map their 3-5 year technology roadmap.

### 3. Corporate Investor Relations & SEC Filings (The "Financial Truth" Signal)
* **Sources & URLs:** Competitor IR Pages, SEC EDGAR Database (`sec.gov/edgar`).
* **Target:** Ad-Hoc announcements, Q-Reports, M&A press releases.
* **Extraction Schema:** `URL_Hash` (PK), `Date`, `Headline`, `Financial_Metrics` (Extracted exact numbers via NER), `Source_URL`.
* **Presentation Rationale (Why):** Publicly traded companies are legally bound by securities laws. Financial data and M&A activity announced here are audited facts.

### 4. Government Recall Databases (The "Catastrophic Failure" Signal)
* **Sources & URLs:** EU Safety Gate (`ec.europa.eu/safety-gate-alerts`), US CPSC (`cpsc.gov/Recalls`).
* **Target:** Plumbing, HVAC, and building material categories.
* **Extraction Schema:** `Recall_ID` (PK), `Brand`, `Defect_Type`, `Risk_Level`, `Action_Required`, `Source_URL`.
* **Presentation Rationale (Why):** Replaces noisy anonymous complaints with legally verified product failures, highlighting massive competitor vulnerabilities.

### 5. B2B Wholesaler E-Commerce (The "Pricing Dynamics" Signal)
* **Sources & URLs:** `reuter.com`, `megabad.com`, GC-Gruppe, `ferguson.com`.
* **Target:** Competitor press systems and pre-wall technology.
* **Extraction Schema:** `SKU` (PK), `Brand`, `Category`, `Current_Price`, `Timestamp`.
* **Presentation Rationale (Why):** Tracking B2B pricing weekly calculates a "Pricing Volatility Score."

### 6. Legislative Trackers (The "Regulatory Shift" Signal)
* **Sources & URLs:** EUR-Lex (`eur-lex.europa.eu`).
* **Target:** Directives on water quality, lead-free mandates, and sustainability.
* **Extraction Schema:** `Directive_ID` (PK), `Status`, `Implementation_Date`, `Impacted_Materials`, `Source_URL`.
* **Presentation Rationale (Why):** Anticipating regulatory bans gives Viega a first-mover advantage to pivot ahead of the competition.

### 7. Trade Journal Tests (The "Professional Quality" Signal)
* **Sources & URLs:** IKZ-Haustechnik (`ikz.de`), PM Mag (`pmmag.com`).
* **Target:** Verified professional tool/product reviews.
* **Extraction Schema:** `Review_URL_Hash` (PK), `Product`, `Professional_Rating`, `Pros`, `Cons`, `Source_URL`.
* **Presentation Rationale (Why):** Ingests structured reviews from master plumbers, providing exact technical feedback.

---

## PART 2: DATA ENRICHMENTS & PREDICTION (Coefficient Weights: 0.3 - 0.7)
*These sources identify trends, demand, and future movements. Because they are predictive rather than absolute guarantees, they carry a lower mathematical multiplier.*

### 8. Public Tenders & Government Demand
* **Sources & URLs:** TED (EU), DTVP/Bund.de/Vergabe24 (DE), GovWin (US).
* **Target:** CPV-Codes (e.g., 45330000 for plumbing/sanitary work).
* **Extraction Schema:** `Tender_ID` (PK), `Budget`, `Requirements` (e.g., lead-free), `Deadline`. 
* **Coefficient Weight:** `0.7` (High probability of revenue).
* **Presentation Rationale:** Identifies massive spikes in institutional demand for specific system types.

### 9. Norms, Standards & Green Certifications (EPDs)
* **Sources & URLs:** DIN, CEN, ISO, VDI (esp. VDI 6023), DGNB, LEED, BREEAM, Ökobaudat.
* **Target:** Drafts of new hygiene norms and CO2 footprint databases.
* **Extraction Schema:** `Standard_ID` (PK), `Metric_Change`, `CO2_Value`, `Target_Material`.
* **Coefficient Weight:** `0.6` (Forces market adaptation).
* **Presentation Rationale:** If VDI 6023 changes, or LEED lowers water limits, Viega must immediately calculate compliance gaps against competitors.

### 10. Startup VC Funding & Incubators
* **Sources & URLs:** Crunchbase, PitchBook, Plug and Play Real Estate, BuiltWorld.
* **Target:** "Water Tech", "PropTech", "Construction Tech".
* **Extraction Schema:** `Startup_Name` (PK), `Funding_Amount`, `Tech_Focus` (e.g., H2 sensors), `Investors`.
* **Coefficient Weight:** `0.5` (Indicates market belief, but startups can fail).
* **Presentation Rationale:** Tracks where venture capital is flowing to identify potential M&A (Merger & Acquisition) targets for Viega.


