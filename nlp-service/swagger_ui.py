"""
swagger_ui.py — Swagger UI customisation for the B-ware NLP Service

Keeps all documentation metadata and dark-theme HTML out of main.py.

Exports:
  tags_metadata   — list of tag group definitions consumed by FastAPI()
  get_swagger_html() — returns the full dark-theme Swagger HTML page as a string
"""

# =============================================================================
# TAG GROUPS — define coloured section headers in Swagger UI
# =============================================================================

tags_metadata = [
    {
        "name": "Core Extraction",
        "description": "**Single and batch claim extraction.** Feed raw text and get back "
                       "a structured breakdown of the economic metric, numeric value, year, "
                       "and a confidence score."
    },
    {
        "name": "Paragraph Analysis",
        "description": "**Smart paragraph-level analysis.** Automatically splits a block of text "
                       "into sentences, scores each sentence for how likely it is to be a "
                       "verifiable economic claim, and runs extraction only on high-probability ones."
    },
    {
        "name": "Service Info",
        "description": "**Health checks and metadata.** Use `/health` to verify the service is "
                       "running and `/metrics` to see the full list of supported economic indicators."
    },
]


# =============================================================================
# DARK-THEME SWAGGER HTML
# =============================================================================

def get_swagger_html() -> str:
    """
    Return the full dark-theme Swagger UI HTML page as a string.
    Called by the /docs route in main.py.
    """
    return """<!DOCTYPE html>
<html>
<head>
  <title>B-ware NLP Service — API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    /* ── Base ─────────────────────────────────────────────── */
    body, .swagger-ui {
      background: #0f0f1a !important;
      color: #c9d1d9;
    }

    /* ── Top bar ──────────────────────────────────────────── */
    .swagger-ui .topbar {
      background: #161b22 !important;
      border-bottom: 1px solid #30363d;
      padding: 10px 0;
    }
    .swagger-ui .topbar .download-url-wrapper { display: none; }

    /* ── Info block (title + description) ────────────────── */
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title {
      color: #58a6ff;
      font-size: 2rem;
      font-weight: 700;
    }
    .swagger-ui .info .title small {
      background: #1f6feb;
      color: #fff;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 0.75rem;
      vertical-align: middle;
      margin-left: 8px;
    }
    .swagger-ui .info p,
    .swagger-ui .info li,
    .swagger-ui .info td,
    .swagger-ui .info th {
      color: #8b949e !important;
    }
    .swagger-ui .info a { color: #58a6ff !important; }
    .swagger-ui .info code {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 4px;
      color: #79c0ff;
      padding: 1px 5px;
    }
    .swagger-ui .info pre {
      background: #161b22 !important;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 14px;
    }
    .swagger-ui .info table {
      border-collapse: collapse;
      width: 100%;
    }
    .swagger-ui .info th {
      background: #161b22;
      border: 1px solid #30363d;
      padding: 6px 12px;
      color: #58a6ff !important;
    }
    .swagger-ui .info td {
      border: 1px solid #30363d;
      padding: 6px 12px;
    }
    .swagger-ui .info hr {
      border-color: #30363d;
      margin: 20px 0;
    }

    /* ── Tag group headers ────────────────────────────────── */
    .swagger-ui .opblock-tag {
      border-bottom: 1px solid #30363d;
      color: #c9d1d9 !important;
      font-size: 1.1rem;
    }
    .swagger-ui .opblock-tag:hover {
      background: #161b22 !important;
    }
    .swagger-ui .opblock-tag-section h3 { color: #c9d1d9; }
    .swagger-ui .opblock-tag small {
      color: #8b949e;
      font-weight: 400;
    }

    /* ── Operation blocks (GET / POST) ───────────────────── */
    .swagger-ui .opblock {
      background: #161b22 !important;
      border: 1px solid #30363d !important;
      border-radius: 6px;
      margin-bottom: 8px;
      box-shadow: none !important;
    }
    .swagger-ui .opblock .opblock-summary {
      border-bottom: 1px solid #30363d;
    }
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 4px;
      font-weight: 700;
      min-width: 70px;
      text-align: center;
    }
    /* POST — blue */
    .swagger-ui .opblock.opblock-post {
      border-left: 3px solid #1f6feb !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #1f6feb;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary {
      background: rgba(31, 111, 235, 0.08) !important;
    }
    /* GET — green */
    .swagger-ui .opblock.opblock-get {
      border-left: 3px solid #2ea043 !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #2ea043;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary {
      background: rgba(46, 160, 67, 0.08) !important;
    }
    .swagger-ui .opblock-summary-description {
      color: #8b949e;
    }
    .swagger-ui .opblock-summary-path {
      color: #c9d1d9 !important;
    }
    .swagger-ui .opblock-body {
      background: #0d1117 !important;
    }

    /* ── Expand/collapse content ──────────────────────────── */
    .swagger-ui .opblock-description-wrapper p,
    .swagger-ui .opblock-description-wrapper li,
    .swagger-ui .opblock-description-wrapper td {
      color: #8b949e;
    }
    .swagger-ui .opblock-description-wrapper table {
      border-collapse: collapse;
      width: 100%;
    }
    .swagger-ui .opblock-description-wrapper th {
      background: #161b22;
      border: 1px solid #30363d;
      color: #58a6ff;
      padding: 5px 10px;
    }
    .swagger-ui .opblock-description-wrapper td {
      border: 1px solid #30363d;
      padding: 5px 10px;
    }
    .swagger-ui .opblock-description-wrapper code {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 4px;
      color: #79c0ff;
      padding: 1px 5px;
    }

    /* ── Parameters & request body ───────────────────────── */
    .swagger-ui .parameters-col_description p { color: #8b949e; }
    .swagger-ui .parameter__name { color: #c9d1d9; }
    .swagger-ui .parameter__type { color: #79c0ff; }
    .swagger-ui .parameter__in  { color: #8b949e; }
    .swagger-ui table thead tr th {
      background: #161b22;
      border-bottom: 1px solid #30363d;
      color: #8b949e;
    }
    .swagger-ui table tbody tr td {
      background: transparent;
      border-bottom: 1px solid #21262d;
      color: #c9d1d9;
    }
    .swagger-ui .body-param__text,
    .swagger-ui textarea {
      background: #0d1117 !important;
      border: 1px solid #30363d !important;
      border-radius: 6px;
      color: #c9d1d9 !important;
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 0.85rem;
    }
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=search],
    .swagger-ui input[type=email] {
      background: #0d1117 !important;
      border: 1px solid #30363d !important;
      border-radius: 6px;
      color: #c9d1d9 !important;
      padding: 6px 10px;
    }
    .swagger-ui select {
      background: #0d1117 !important;
      border: 1px solid #30363d !important;
      color: #c9d1d9 !important;
    }

    /* ── Buttons ──────────────────────────────────────────── */
    .swagger-ui .btn {
      border-radius: 6px;
      font-weight: 600;
    }
    .swagger-ui .btn.execute {
      background: #1f6feb !important;
      border-color: #1f6feb !important;
      color: #fff !important;
    }
    .swagger-ui .btn.execute:hover {
      background: #388bfd !important;
      border-color: #388bfd !important;
    }
    .swagger-ui .btn.btn-clear {
      border-color: #30363d !important;
      color: #8b949e !important;
    }
    .swagger-ui .btn-group .btn:first-child {
      background: #161b22;
      color: #c9d1d9;
      border: 1px solid #30363d;
    }
    .swagger-ui .try-out__btn {
      border-color: #2ea043 !important;
      color: #2ea043 !important;
      border-radius: 6px;
    }
    .swagger-ui .try-out__btn:hover {
      background: rgba(46, 160, 67, 0.1) !important;
    }
    .swagger-ui .expand-operation svg { fill: #8b949e; }
    .swagger-ui .arrow { fill: #8b949e !important; }

    /* ── Response section ────────────────────────────────── */
    .swagger-ui .responses-inner { background: #0d1117; }
    .swagger-ui .response-col_status { color: #56d364; }
    .swagger-ui .response-col_description__inner p { color: #8b949e; }
    .swagger-ui .highlight-code {
      background: #0d1117 !important;
      border-radius: 6px;
    }
    .swagger-ui .response td:first-child { color: #56d364; }
    .swagger-ui table.responses-table thead tr th {
      color: #8b949e;
      background: #161b22;
    }

    /* ── Models / Schemas section ────────────────────────── */
    .swagger-ui section.models {
      background: #161b22 !important;
      border: 1px solid #30363d !important;
      border-radius: 6px;
    }
    .swagger-ui section.models h4 { color: #c9d1d9 !important; }
    .swagger-ui section.models .model-container {
      background: #0d1117 !important;
      border-radius: 4px;
      margin: 4px 0;
    }
    .swagger-ui .model-title { color: #58a6ff; }
    .swagger-ui .model .property { color: #79c0ff; }
    .swagger-ui .model .property.primitive { color: #56d364; }
    .swagger-ui .prop-type { color: #79c0ff; }
    .swagger-ui .prop-format { color: #8b949e; }
    .swagger-ui .model-toggle { background: #30363d; }

    /* ── Filter / search bar ─────────────────────────────── */
    .swagger-ui .filter-container {
      background: #161b22;
      padding: 8px 20px;
      border-bottom: 1px solid #30363d;
    }
    .swagger-ui .filter-container .operation-filter-input {
      background: #0d1117 !important;
      border: 1px solid #30363d !important;
      border-radius: 6px;
      color: #c9d1d9 !important;
      padding: 8px 12px;
      width: 100%;
      box-sizing: border-box;
    }

    /* ── Loading / misc ──────────────────────────────────── */
    .swagger-ui .loading-container { background: #0f0f1a; }
    .swagger-ui .scheme-container {
      background: #161b22 !important;
      border-bottom: 1px solid #30363d;
      box-shadow: none;
    }
    .swagger-ui .servers-title,
    .swagger-ui .schemes-title { color: #8b949e; }
    .swagger-ui .servers > label select { background: #0d1117; color: #c9d1d9; }

    /* ── Scrollbar ───────────────────────────────────────── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #0d1117; }
    ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #58a6ff; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        syntaxHighlight: { theme: "monokai" },
        defaultModelsExpandDepth: 2,
        docExpansion: "list"
      })
    }
  </script>
</body>
</html>"""
