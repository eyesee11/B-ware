CREATE DATABASE IF NOT EXISTS bware_ai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bware_ai;

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  UNIQUE NOT NULL,      -- login key, must be unique
    password_hash VARCHAR(255)  NOT NULL,              -- bcrypt hash, never plaintext
    role          ENUM('user','admin') DEFAULT 'user', -- admin can trigger /trending/refresh
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claims (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    original_text    TEXT         NOT NULL,             -- the raw claim text
    claim_hash       CHAR(64)      DEFAULT NULL,         -- sha256 hex of original_text, used for Redis dedup
    extracted_metric VARCHAR(200) DEFAULT NULL,         -- e.g. "GDP growth rate"
    extracted_value  DECIMAL(15,2) DEFAULT NULL,        -- e.g. 7.50
    extracted_year   INT           DEFAULT NULL,        -- e.g. 2024
    credibility_score DECIMAL(5,2) DEFAULT NULL,        -- 0-100 scale (confidence × 100)
    verdict          ENUM('accurate','misleading','false','unverifiable') DEFAULT NULL,
    confidence       FLOAT         DEFAULT NULL,        -- 0.0 → 1.0 from NLP service
    status           ENUM('pending','verified','failed') DEFAULT 'pending',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_claim_hash (claim_hash),                  -- fast lookup for Redis cache dedup check
    INDEX idx_user_created (user_id, created_at),       -- fast history queries per user

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE official_data_cache (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    metric_name  VARCHAR(200) NOT NULL,
    year         INT          NOT NULL,
    value        DECIMAL(15,2) NOT NULL,
    source       VARCHAR(300)  DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_metric_year (metric_name, year)   -- no duplicate entries per metric+year
);

CREATE TABLE verification_log (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    claim_id         INT           NOT NULL,
    official_value   DECIMAL(15,2) DEFAULT NULL,   -- World Bank official number
    claimed_value    DECIMAL(15,2) DEFAULT NULL,   -- what the user's claim said
    difference       DECIMAL(15,2) DEFAULT NULL,   -- abs(official - claimed)
    percentage_error DECIMAL(5,2)  DEFAULT NULL,   -- how wrong the claim is in %
    verdict          ENUM('accurate','misleading','false','unverifiable') NOT NULL,
    tier_used        ENUM('tier1','tier2','tier3')  NOT NULL DEFAULT 'tier1',
    tiers_run        JSON           DEFAULT NULL,  -- e.g. ["tier1","tier2"]
    confidence       DECIMAL(5,4)   DEFAULT NULL,  -- 0.0000 → 1.0000
    explanation      TEXT           DEFAULT NULL,  -- human-readable reason from NLP
    evidence_json    JSON           DEFAULT NULL,  -- evidence array from Tier 2/3
    verified_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_claim_id (claim_id),

    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE TABLE evidence_snippets (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    claim_id       INT           NOT NULL,
    source         VARCHAR(200)  NOT NULL,           -- publisher, e.g. "Reuters"
    title          VARCHAR(500)  DEFAULT NULL,
    snippet        TEXT          NOT NULL,            -- the text scored by NLI
    url            VARCHAR(500)  DEFAULT NULL,
    published_date DATETIME      DEFAULT NULL,
    evidence_type  ENUM('fact_check','news') NOT NULL,
    fetched_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_es_claim (claim_id),

    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE TABLE nli_results (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    claim_id    INT           NOT NULL,
    evidence_id INT           NOT NULL,
    nli_label   ENUM('entailment','contradiction','neutral') NOT NULL,
    nli_score   DECIMAL(6,4)  NOT NULL,             -- model confidence, e.g. 0.8472
    model_used  VARCHAR(100)  DEFAULT 'facebook/bart-large-mnli',
    scored_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id)   REFERENCES claims(id)            ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidence_snippets(id) ON DELETE CASCADE
);

CREATE TABLE tier3_results (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    claim_id     INT           NOT NULL,
    verdict      ENUM('accurate','misleading','false','unverifiable') NOT NULL,
    confidence   DECIMAL(5,4)  NOT NULL,
    explanation  TEXT          NOT NULL,
    sources_used JSON          DEFAULT NULL,         -- e.g. ["World Bank","Reuters"]
    raw_response TEXT          DEFAULT NULL,         -- full LLM output for debugging
    model_used   VARCHAR(100)  DEFAULT 'gemini-1.5-flash',
    analyzed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_claim_tier3 (claim_id),        -- one LLM result per claim max

    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE TABLE trending_stories (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    headline      TEXT         NOT NULL,
    claim_text    TEXT         DEFAULT NULL,         -- extracted verifiable claim
    source_name   VARCHAR(255) DEFAULT NULL,
    source_url    TEXT         DEFAULT NULL,
    published_at  DATETIME     DEFAULT NULL,
    fetched_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    verdict       ENUM('accurate','misleading','false','unverifiable') DEFAULT NULL,
    confidence    FLOAT        DEFAULT NULL,
    danger_score  FLOAT        DEFAULT 0,            -- 0-100, see BACKEND.md for formula
    metric        VARCHAR(100) DEFAULT NULL,
    official_value FLOAT       DEFAULT NULL,
    claimed_value  FLOAT       DEFAULT NULL,
    pct_error      FLOAT       DEFAULT NULL,
    explanation    TEXT        DEFAULT NULL,
    evidence_json  JSON        DEFAULT NULL,
    tier_used      VARCHAR(20) DEFAULT NULL,
    is_active      TINYINT(1)  DEFAULT 1,            -- set to 0 for stories > 48h old
    url_hash       CHAR(32)    DEFAULT NULL,          -- MD5(source_url), indexed for fast dedup check

    INDEX idx_danger   (danger_score),
    INDEX idx_fetched  (fetched_at),
    INDEX idx_active   (is_active),
    INDEX idx_url_hash (url_hash)
);

CREATE TABLE source_stats (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    source_name      VARCHAR(255) UNIQUE NOT NULL,
    total_claims     INT   DEFAULT 0,
    accurate_count   INT   DEFAULT 0,
    misleading_count INT   DEFAULT 0,
    false_count      INT   DEFAULT 0,
    avg_danger_score FLOAT DEFAULT 0,
    last_updated     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SELECT
    table_name,
    table_rows,
    create_time
FROM information_schema.tables
WHERE table_schema = 'bware_ai'
ORDER BY create_time;

