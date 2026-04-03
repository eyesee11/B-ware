const db = require("../config/db");

// Available news outlets - MUST match the domains mapping in trendingController
const AVAILABLE_OUTLETS = [
  "Bloomberg",
  "The Guardian",
  "BBC",
  "Reuters",
  "Wall Street Journal",
  "Financial Times",
];

// Map of outlet names to their NewsAPI domain(s)
const OUTLET_DOMAINS = {
  "Bloomberg": "bloomberg.com",
  "The Guardian": "theguardian.com",
  "BBC": "bbc.co.uk,bbc.com",
  "Reuters": "reuters.com",
  "Wall Street Journal": "wsj.com",
  "Financial Times": "ft.com",
};

// Get user's selected outlets (supports both authenticated and anonymous users)
exports.getUserOutlets = async (req, res) => {
  try {
    // If not authenticated, return empty list with available outlets
    if (!req.user || !req.user.id) {
      return res.json({
        outlets: [],
        available: AVAILABLE_OUTLETS,
      });
    }

    const userId = req.user.id;

    const [outlets] = await db.query(
      "SELECT outlet_name FROM user_outlet_preferences WHERE user_id = ? ORDER BY outlet_name",
      [userId]
    );

    res.json({
      outlets: outlets.map(o => o.outlet_name),
      available: AVAILABLE_OUTLETS,
    });
  } catch (err) {
    console.error("getUserOutlets:", err.message);
    res.status(500).json({ error: "Could not fetch outlets" });
  }
};

// Update user's selected outlets
exports.updateUserOutlets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { outlets } = req.body;

    // Validate outlets
    if (!Array.isArray(outlets)) {
      return res.status(400).json({ error: "outlets must be an array" });
    }

    const invalid = outlets.filter(o => !AVAILABLE_OUTLETS.includes(o));
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Invalid outlets: ${invalid.join(", ")}`,
        available: AVAILABLE_OUTLETS,
      });
    }

    // Delete existing preferences
    await db.query("DELETE FROM user_outlet_preferences WHERE user_id = ?", [userId]);

    // Insert new preferences
    if (outlets.length > 0) {
      const values = outlets.map(outlet => [userId, outlet]);
      await db.query(
        "INSERT INTO user_outlet_preferences (user_id, outlet_name) VALUES ?",
        [values]
      );
    }

    res.json({
      success: true,
      outlets,
    });
  } catch (err) {
    console.error("updateUserOutlets:", err.message);
    res.status(500).json({ error: "Could not update outlets" });
  }
};

// Get all available outlets
exports.getAvailableOutlets = async (req, res) => {
  res.json({
    outlets: AVAILABLE_OUTLETS,
  });
};
