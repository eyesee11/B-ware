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
