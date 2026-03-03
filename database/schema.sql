-- users	   Who submitted the claim
-- claims	   The actual claim text + extracted data
-- official_data_cache	   Real government data we compare against
-- verification_log	      The comparison result


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,   -- unique ID, auto-generated
    name VARCHAR(100) NOT NULL,          -- user's display name
    email VARCHAR(150) UNIQUE NOT NULL,  -- login identifier, must be unique
    password_hash VARCHAR(255) NOT NULL, -- NEVER store plain passwords
    role ENUM('user', 'admin') DEFAULT 'user',  -- controls access level
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- when they signed up
);

CREATE TABLE claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                    -- who submitted this
    original_text TEXT NOT NULL,             -- the raw claim text
    extracted_metric VARCHAR(200),           -- e.g., "GDP growth rate"
    extracted_value DECIMAL(15,2),           -- e.g., 7.50
    extracted_year INT,                      -- e.g., 2024
    credibility_score DECIMAL(5,2),          -- e.g., 85.50
    status ENUM('pending','verified','failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE official_data_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(200) NOT NULL,       -- e.g., "inflation_rate"
    year INT NOT NULL,                       -- e.g., 2024
    value DECIMAL(15,2) NOT NULL,            -- the real official number
    source VARCHAR(300),                     -- where we got it from
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_metric_year (metric_name, year)  -- no duplicate entries
);

CREATE TABLE verification_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL,
    official_value DECIMAL(15,2),
    claimed_value DECIMAL(15,2),
    difference DECIMAL(15,2),
    percentage_error DECIMAL(5,2),
    verdict ENUM('accurate','misleading','false') NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

-- we stored difference and percentage_error to avoid recalculating them every time we display the verification results.



--   After building the full RAV pipeline, we need to persist:
--     - WHICH tier produced the final verdict
--     - WHICH tiers were actually executed (e.g., ["tier1","tier2"])
--     - A human-readable explanation (from any tier)
--     - A unified confidence score (0.0 → 1.0)
--     - The old verdict ENUM is missing 'unverifiable' (Tier 2/3 can return it)

ALTER TABLE verification_log
    ADD COLUMN tier_used ENUM('tier1','tier2','tier3') NOT NULL DEFAULT 'tier1'
        COMMENT 'Which tier produced the final verdict'
        AFTER verdict,

    ADD COLUMN tiers_run JSON DEFAULT NULL
        COMMENT 'Array of tiers actually executed, e.g. ["tier1","tier2"]'
        AFTER tier_used,

    ADD COLUMN confidence DECIMAL(5,4) DEFAULT NULL
        COMMENT 'Unified confidence score 0.0000 → 1.0000'
        AFTER tiers_run,

    ADD COLUMN explanation TEXT DEFAULT NULL
        COMMENT 'Human-readable explanation from the winning tier'
        AFTER confidence,

    MODIFY COLUMN verdict ENUM('accurate','misleading','false','unverifiable') NOT NULL
        COMMENT 'Added unverifiable for cases where no data/evidence exists';


-- EVIDENCE_SNIPPETS
-- Stores each snippet fetched during Tier 2 (from Google Fact Check + NewsAPI).
-- Maps 1:1 to the EvidenceSnippet dataclass in evidence_fetcher.py.
-- Relationship: claims (1) → evidence_snippets (many)

CREATE TABLE evidence_snippets (
    id INT AUTO_INCREMENT PRIMARY KEY,

    claim_id INT NOT NULL
        COMMENT 'Which claim this evidence was fetched for',

    source VARCHAR(200) NOT NULL
        COMMENT 'Publisher name, e.g. "Reuters", "AFP Fact Check"',

    title VARCHAR(500) DEFAULT NULL
        COMMENT 'Article/fact-check title',

    snippet TEXT NOT NULL
        COMMENT 'The actual text snippet scored by NLI',

    url VARCHAR(500) DEFAULT NULL
        COMMENT 'Link to the original article',

    published_date DATETIME DEFAULT NULL
        COMMENT 'When the article was published (from API)',

    evidence_type ENUM('fact_check','news') NOT NULL
        COMMENT 'fact_check = Google Fact Check API, news = NewsAPI',

    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        COMMENT 'When we fetched this snippet',

    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);


-- NLI_RESULTS
-- Stores per-snippet NLI verdicts from Tier 2.
-- Maps 1:1 to the NliResult dataclass in tier2_nli.py.
-- Relationship: evidence_snippets (1) → nli_results (1)
--               claims (1) → nli_results (many)

CREATE TABLE nli_results (
    id INT AUTO_INCREMENT PRIMARY KEY,

    claim_id INT NOT NULL
        COMMENT 'Which claim this NLI result belongs to',

    evidence_id INT NOT NULL
        COMMENT 'Which evidence snippet was scored',

    nli_label ENUM('entailment','contradiction','neutral') NOT NULL
        COMMENT 'The NLI model output label',

    nli_score DECIMAL(6,4) NOT NULL
        COMMENT 'Model confidence for the winning label, e.g. 0.8472',

    model_used VARCHAR(100) DEFAULT 'facebook/bart-large-mnli'
        COMMENT 'Which NLI model produced this result',

    scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidence_snippets(id) ON DELETE CASCADE
);


-- TIER3_RESULTS
-- Stores LLM analysis from Tier 3 (Gemini).
-- Maps 1:1 to the Tier3Result dataclass in tier3_llm.py.
-- Relationship: claims (1) → tier3_results (0 or 1)
--   0 if the claim was resolved at Tier 1 or 2 and never escalated.

CREATE TABLE tier3_results (
    id INT AUTO_INCREMENT PRIMARY KEY,

    claim_id INT NOT NULL
        COMMENT 'Which claim this LLM result belongs to',

    verdict ENUM('accurate','misleading','false','unverifiable') NOT NULL
        COMMENT 'The LLM verdict',

    confidence DECIMAL(5,4) NOT NULL
        COMMENT 'LLM self-reported confidence 0.0000 → 1.0000',

    explanation TEXT NOT NULL
        COMMENT '1-3 sentence explanation from the LLM',

    sources_used JSON DEFAULT NULL
        COMMENT 'Array of source names the LLM cited, e.g. ["World Bank","Reuters"]',

    raw_response TEXT DEFAULT NULL
        COMMENT 'Full raw LLM output for debugging (before JSON parsing)',

    model_used VARCHAR(100) DEFAULT 'gemini-1.5-flash'
        COMMENT 'Which LLM produced this result',

    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,

    -- Each claim should only have ONE Tier 3 result
    UNIQUE KEY unique_claim_tier3 (claim_id)
);