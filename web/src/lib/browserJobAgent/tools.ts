import type { BrowserAgentToolCall, CandidateProfile, ExternalSearchLink, JobAnalysis } from "../../types";

interface RawPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  url: string;
  published_at: string;
  description: string;
  tags: string[];
}

interface CompanyBoard {
  company: string;
  ats?: "greenhouse" | "lever";
  slug?: string;
  location: string;
  careersUrl: string;
  focus: string[];
}

interface ScoredCompanyBoard {
  board: CompanyBoard;
  score: number;
  reasons: string[];
}

export interface ToolExecutionResult {
  jobs: JobAnalysis[];
  externalSearchLinks?: ExternalSearchLink[];
  count: number;
  error?: string;
}

const JOB_SKILLS: Record<string, string[]> = {
  Python: ["python", "py"],
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  React: ["react", "react.js", "reactjs"],
  "Next.js": ["next.js", "nextjs"],
  FastAPI: ["fastapi"],
  Flask: ["flask"],
  Django: ["django"],
  SQL: ["sql"],
  PostgreSQL: ["postgresql", "postgres"],
  MongoDB: ["mongodb"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes", "k8s"],
  "GitHub Actions": ["github actions", "ci/cd", "ci cd"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure", "azure openai"],
  GCP: ["gcp", "google cloud"],
  "Machine Learning": ["machine learning", "ml"],
  "Deep Learning": ["deep learning"],
  NLP: ["nlp", "natural language processing"],
  "Computer Vision": ["computer vision"],
  LLM: ["llm", "large language model", "large language models", "generative ai", "genai"],
  RAG: ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
  LangChain: ["langchain"],
  LangGraph: ["langgraph"],
  FAISS: ["faiss"],
  "Vector Search": ["vector search", "semantic search", "vector database", "embeddings"],
  Transformers: ["transformers"],
  PyTorch: ["pytorch"],
  TensorFlow: ["tensorflow"],
  "Scikit-learn": ["scikit-learn", "sklearn"],
  Pandas: ["pandas"],
  NumPy: ["numpy"],
  Spark: ["spark", "pyspark"],
  Airflow: ["airflow"],
  MLflow: ["mlflow"],
  MLOps: ["mlops", "model deployment", "model monitoring"],
  OpenAI: ["openai"],
  Mistral: ["mistral"],
  Gemini: ["gemini", "google ai"],
  "REST API": ["rest api", "restful"],
  GraphQL: ["graphql"],
  "Power BI": ["power bi", "dashboard"],
  Excel: ["excel"],
  QGIS: ["qgis", "gis"],
  AutoCAD: ["autocad"],
  PVSyst: ["pvsyst"],
  Pleiades: ["pleiades", "pléiades"],
  "Energy Audit": ["energy audit", "audit energetique", "audit énergétique"],
  "Solar PV": ["solar pv", "solaire pv", "photovoltaique", "photovoltaïque", "photovoltaic"],
  "ISO 50001": ["iso 50001"],
  "Carbon Accounting": ["bilan carbone", "carbon accounting", "scopes 1-2-3", "scope 1", "scope 2", "scope 3"],
  "Thermal Simulation": ["simulation thermique", "thermal simulation", "building simulation"],
  "Building Energy": ["batiment", "bâtiment", "building energy", "decret tertiaire", "décret tertiaire"],
  HVAC: ["hvac", "cvc", "heating", "ventilation"],
  Bloomberg: ["bloomberg", "bloomberg terminal"],
  "Reuters Eikon": ["reuters eikon", "refinitiv", "lseg workspace"],
  VBA: ["vba", "excel vba"],
  Jupyter: ["jupyter", "notebook"],
  Trading: ["trading", "trader", "execution", "marches", "marchés"],
  "Options Pricing": ["options pricing", "pricing options", "prix theorique", "prix théorique"],
  Derivatives: ["derivatives", "derives", "dérivés", "options", "futures"],
  "Market Making": ["market making", "spreads", "liquidity", "liquidite"],
  "Risk Management": ["risk management", "gestion du risque", "risk", "risque"],
  VaR: ["var", "value at risk"],
  "Stress Testing": ["stress testing", "stress tests", "stress test"],
  Greeks: ["greeks", "delta", "gamma", "vega", "theta"],
  Backtesting: ["backtesting", "backtest", "walk-forward"],
  PnL: ["pnl", "p&l", "profit and loss"],
  "Portfolio Management": ["portfolio", "portefeuille", "asset management"],
};

const JOBICY_TAGS: Record<string, string[]> = {
  "AI Engineer": ["python"],
  "Applied AI Engineer": ["python"],
  "LLM Engineer": ["python"],
  "RAG Engineer": ["python"],
  "Data Scientist": ["machine-learning"],
  "Machine Learning Engineer": ["machine-learning"],
  "NLP Engineer": ["machine-learning"],
  "Computer Vision Engineer": ["machine-learning"],
  "Data Engineer": ["python"],
};

const AI_COMPANY_BOARDS: CompanyBoard[] = [
  { company: "OpenAI", ats: "greenhouse", slug: "openai", location: "USA / Remote", careersUrl: "https://openai.com/careers/search/", focus: ["AI", "LLM", "Research", "Product"] },
  { company: "Anthropic", ats: "greenhouse", slug: "anthropic", location: "USA / Europe", careersUrl: "https://www.anthropic.com/jobs", focus: ["AI", "LLM", "Safety", "Research"] },
  { company: "Mistral AI", ats: "greenhouse", slug: "mistralai", location: "Paris / Remote", careersUrl: "https://mistral.ai/careers/", focus: ["AI", "LLM", "Research", "Platform"] },
  { company: "Hugging Face", ats: "greenhouse", slug: "huggingface", location: "Remote / Europe", careersUrl: "https://huggingface.co/jobs", focus: ["AI", "Open source", "ML", "Product"] },
  { company: "Databricks", ats: "greenhouse", slug: "databricks", location: "Global", careersUrl: "https://www.databricks.com/company/careers/open-positions", focus: ["Data", "AI", "ML", "Platform"] },
  { company: "Dataiku", ats: "greenhouse", slug: "dataiku", location: "Paris / Global", careersUrl: "https://www.dataiku.com/careers/", focus: ["Data", "ML", "Enterprise AI"] },
  { company: "Datadog", ats: "greenhouse", slug: "datadog", location: "Paris / Global", careersUrl: "https://careers.datadoghq.com/", focus: ["Observability", "ML", "Cloud", "Platform"] },
  { company: "Scale AI", ats: "greenhouse", slug: "scaleai", location: "USA / Remote", careersUrl: "https://www.scale.com/careers", focus: ["AI data", "LLM", "Applied AI"] },
  { company: "Cohere", ats: "greenhouse", slug: "cohere", location: "Canada / Remote", careersUrl: "https://cohere.com/careers", focus: ["LLM", "NLP", "Enterprise AI"] },
  { company: "Weights & Biases", ats: "greenhouse", slug: "weightsbiases", location: "Remote", careersUrl: "https://wandb.ai/careers", focus: ["MLOps", "Developer tools", "AI"] },
  { company: "LangChain", location: "Remote", careersUrl: "https://www.langchain.com/careers", focus: ["AI agents", "LLM", "Developer tools"] },
  { company: "Pinecone", location: "USA / Remote", careersUrl: "https://www.pinecone.io/careers/", focus: ["Vector database", "RAG", "AI infrastructure"] },
  { company: "Weaviate", location: "Europe / Remote", careersUrl: "https://weaviate.io/company/careers", focus: ["Vector database", "RAG", "Open source"] },
  { company: "Qdrant", location: "Berlin / Remote", careersUrl: "https://qdrant.tech/careers/", focus: ["Vector database", "Rust", "AI infrastructure"] },
  { company: "Modal", location: "USA / Remote", careersUrl: "https://modal.com/careers", focus: ["AI infrastructure", "Python", "Cloud"] },
  { company: "Replicate", location: "Remote", careersUrl: "https://replicate.com/careers", focus: ["AI models", "Developer tools", "ML"] },
  { company: "Together AI", location: "USA / Remote", careersUrl: "https://www.together.ai/careers", focus: ["LLM", "Inference", "AI infrastructure"] },
  { company: "Anyscale", location: "USA / Remote", careersUrl: "https://www.anyscale.com/careers", focus: ["AI infrastructure", "Ray", "ML"] },
  { company: "Cerebras", location: "USA / Remote", careersUrl: "https://www.cerebras.net/careers/", focus: ["AI hardware", "Deep Learning", "ML"] },
  { company: "Groq", location: "USA / Remote", careersUrl: "https://groq.com/careers/", focus: ["AI inference", "Hardware", "LLM"] },
  { company: "Perplexity", location: "USA / Remote", careersUrl: "https://www.perplexity.ai/careers", focus: ["AI search", "LLM", "Product"] },
  { company: "ElevenLabs", location: "Europe / Remote", careersUrl: "https://elevenlabs.io/careers", focus: ["Audio AI", "LLM", "Product"] },
  { company: "Runway", location: "USA / Remote", careersUrl: "https://runwayml.com/careers/", focus: ["Generative AI", "Video", "Research"] },
  { company: "Synthesia", location: "London / Remote", careersUrl: "https://www.synthesia.io/careers", focus: ["Generative AI", "Video", "Product"] },
  { company: "DeepL", location: "Europe / Remote", careersUrl: "https://www.deepl.com/en/careers", focus: ["NLP", "Translation", "AI"] },
  { company: "Dust", location: "Paris / Remote", careersUrl: "https://dust.tt/jobs", focus: ["AI agents", "LLM", "Product"] },
  { company: "Poolside", location: "Paris / Remote", careersUrl: "https://poolside.ai/careers", focus: ["AI coding", "LLM", "Developer tools"] },
  { company: "Nabla", location: "Paris / Remote", careersUrl: "https://www.nabla.com/careers", focus: ["AI", "Healthcare", "LLM"] },
  { company: "Owkin", location: "Paris / Remote", careersUrl: "https://www.owkin.com/careers", focus: ["AI", "Healthcare", "ML"] },
  { company: "Contentsquare", location: "Paris / Global", careersUrl: "https://contentsquare.com/careers/", focus: ["Data", "Product analytics", "ML"] },
  { company: "Criteo", location: "Paris / Global", careersUrl: "https://www.criteo.com/careers/", focus: ["ML", "Ads", "Data"] },
  { company: "Doctolib", location: "Paris / Europe", careersUrl: "https://careers.doctolib.com/", focus: ["Healthtech", "Data", "Product"] },
  { company: "Alan", location: "Paris / Europe", careersUrl: "https://alan.com/careers", focus: ["Healthtech", "Data", "AI"] },
  { company: "Qonto", location: "Paris / Europe", careersUrl: "https://qonto.com/en/careers", focus: ["Fintech", "Data", "Product"] },
  { company: "Ledger", location: "Paris / Global", careersUrl: "https://www.ledger.com/career", focus: ["Security", "Data", "Platform"] },
  { company: "NVIDIA", location: "Global", careersUrl: "https://www.nvidia.com/en-us/about-nvidia/careers/", focus: ["GPU", "AI", "Deep Learning"] },
  { company: "Microsoft AI", location: "Global", careersUrl: "https://jobs.careers.microsoft.com/global/en/search?q=AI%20Engineer", focus: ["AI", "Cloud", "Copilot"] },
  { company: "Meta AI", location: "Global", careersUrl: "https://www.metacareers.com/jobs/?q=AI%20Engineer", focus: ["AI", "Research", "Product"] },
  { company: "Google DeepMind", location: "London / Global", careersUrl: "https://www.google.com/about/careers/applications/jobs/results/?q=AI%20Engineer", focus: ["AI", "Research", "ML"] },
  { company: "EDF", location: "France / Europe", careersUrl: "https://www.edf.fr/edf-recrute", focus: ["Energy", "Renewable Energy", "Nuclear", "Data"] },
  { company: "ENGIE", location: "France / Global", careersUrl: "https://jobs.engie.com/", focus: ["Energy", "Renewable Energy", "Building Energy", "Sustainability"] },
  { company: "TotalEnergies", location: "France / Global", careersUrl: "https://jobs.totalenergies.com/", focus: ["Energy", "Renewable Energy", "Solar PV", "Carbon"] },
  { company: "Schneider Electric", location: "France / Global", careersUrl: "https://www.se.com/ww/en/about-us/careers/overview.jsp", focus: ["Energy Efficiency", "Building Energy", "Automation", "Data"] },
  { company: "Siemens Smart Infrastructure", location: "Europe / Global", careersUrl: "https://jobs.siemens.com/careers", focus: ["Building Energy", "Energy Efficiency", "Automation", "HVAC"] },
  { company: "Dalkia", location: "France", careersUrl: "https://www.dalkia.fr/fr/nous-rejoindre", focus: ["Energy Efficiency", "Building Energy", "HVAC", "Energy"] },
  { company: "IDEX", location: "France", careersUrl: "https://www.idex.fr/recrutement", focus: ["Energy Efficiency", "Building Energy", "HVAC", "Renewable Energy"] },
  { company: "Equans", location: "France / Europe", careersUrl: "https://www.equans.com/careers", focus: ["Energy Efficiency", "Building Energy", "HVAC", "Sustainability"] },
  { company: "Vinci Energies", location: "France / Global", careersUrl: "https://www.vinci-energies.com/en/careers/", focus: ["Energy", "Building Energy", "Automation", "Data"] },
  { company: "Eiffage Energie Systemes", location: "France / Europe", careersUrl: "https://www.eiffageenergiesystemes.com/home/carrieres.html", focus: ["Energy", "Building Energy", "Renewable Energy", "HVAC"] },
  { company: "Bouygues Energies & Services", location: "France / Europe", careersUrl: "https://www.bouygues-es.com/carrieres", focus: ["Energy Efficiency", "Building Energy", "Sustainability", "HVAC"] },
  { company: "Enedis", location: "France", careersUrl: "https://www.enedis.fr/recrute", focus: ["Energy", "Grid", "Data", "Renewable Energy"] },
  { company: "RTE", location: "France", careersUrl: "https://www.rte-france.com/carrieres", focus: ["Energy", "Grid", "Renewable Energy", "Data"] },
  { company: "Voltalia", location: "France / Global", careersUrl: "https://www.voltalia.com/careers", focus: ["Renewable Energy", "Solar PV", "Wind", "Energy"] },
  { company: "Neoen", location: "France / Global", careersUrl: "https://neoen.com/en/careers/", focus: ["Renewable Energy", "Solar PV", "Storage", "Energy"] },
  { company: "Akuo", location: "France / Global", careersUrl: "https://www.akuoenergy.com/en/careers", focus: ["Renewable Energy", "Solar PV", "Energy"] },
  { company: "GreenYellow", location: "France / Global", careersUrl: "https://www.greenyellow.com/en/careers/", focus: ["Solar PV", "Energy Efficiency", "Renewable Energy"] },
  { company: "Tenergie", location: "France", careersUrl: "https://tenergie.fr/recrutement/", focus: ["Solar PV", "Renewable Energy", "Energy"] },
  { company: "Urbasolar", location: "France", careersUrl: "https://urbasolar.com/recrutement/", focus: ["Solar PV", "Renewable Energy", "Energy"] },
  { company: "Photosol", location: "France", careersUrl: "https://www.photosol.fr/carrieres/", focus: ["Solar PV", "Renewable Energy", "Energy"] },
  { company: "Q ENERGY France", location: "France / Europe", careersUrl: "https://qenergy.eu/fr/carrieres/", focus: ["Renewable Energy", "Solar PV", "Wind", "Storage"] },
  { company: "BayWa r.e.", location: "Europe / Global", careersUrl: "https://www.baywa-re.com/en/career", focus: ["Renewable Energy", "Solar PV", "Wind", "Storage"] },
  { company: "Sun'R", location: "France", careersUrl: "https://www.sunr.fr/carrieres/", focus: ["Solar PV", "Renewable Energy", "Agrivoltaics"] },
  { company: "Effy", location: "France", careersUrl: "https://www.effy.fr/recrutement", focus: ["Energy Efficiency", "Building Energy", "Sustainability"] },
  { company: "Hellio", location: "France", careersUrl: "https://www.hellio.com/recrutement", focus: ["Energy Efficiency", "Building Energy", "CEE"] },
  { company: "Deepki", location: "Paris / Europe", careersUrl: "https://www.deepki.com/careers/", focus: ["Building Energy", "Carbon", "Sustainability", "Data"] },
  { company: "Greenly", location: "Paris / Europe", careersUrl: "https://greenly.earth/en-us/careers", focus: ["Carbon", "Sustainability", "Data"] },
  { company: "Sweep", location: "Paris / Remote", careersUrl: "https://www.sweep.net/careers", focus: ["Carbon", "Sustainability", "Data"] },
  { company: "Carbone 4", location: "Paris / France", careersUrl: "https://www.carbone4.com/carrieres", focus: ["Carbon", "Sustainability", "Energy"] },
  { company: "Enerdata", location: "Grenoble / France", careersUrl: "https://www.enerdata.net/about-us/careers.html", focus: ["Energy", "Data", "Carbon", "Analytics"] },
  { company: "Izivia", location: "France", careersUrl: "https://www.izivia.com/recrutement", focus: ["Energy", "Electric Mobility", "Grid"] },
  { company: "SUEZ", location: "France / Global", careersUrl: "https://www.suez.com/fr/carrieres", focus: ["Sustainability", "Energy", "Carbon", "Data"] },
  { company: "Veolia", location: "France / Global", careersUrl: "https://www.veolia.com/fr/carrieres", focus: ["Energy", "Sustainability", "Carbon", "Data"] },
  { company: "BNP Paribas CIB", location: "Paris / Global", careersUrl: "https://group.bnpparibas/en/careers", focus: ["Finance", "Trading", "Capital Markets", "Risk Management"] },
  { company: "Societe Generale CIB", location: "Paris / Global", careersUrl: "https://careers.societegenerale.com/en", focus: ["Finance", "Trading", "Derivatives", "Risk Management"] },
  { company: "Natixis CIB", location: "Paris / Global", careersUrl: "https://recrutement.natixis.com/en/", focus: ["Finance", "Capital Markets", "Trading", "Asset Management"] },
  { company: "Credit Agricole CIB", location: "Paris / Global", careersUrl: "https://jobs.ca-cib.com/", focus: ["Finance", "Capital Markets", "Derivatives", "Risk Management"] },
  { company: "Amundi", location: "Paris / Global", careersUrl: "https://www.amundi.com/globaldistributor/careers", focus: ["Asset Management", "Portfolio Management", "Risk Management", "Finance"] },
  { company: "AXA Investment Managers", location: "Paris / Global", careersUrl: "https://careers.axa-im.com/", focus: ["Asset Management", "Portfolio Management", "Risk Management", "Finance"] },
  { company: "Euronext", location: "Paris / Europe", careersUrl: "https://www.euronext.com/en/about/careers", focus: ["Trading", "Market Data", "Capital Markets", "Exchange"] },
  { company: "LSEG", location: "Paris / London / Global", careersUrl: "https://www.lseg.com/en/careers", focus: ["Market Data", "Capital Markets", "Finance", "Data"] },
  { company: "Bloomberg", location: "Paris / London / Global", careersUrl: "https://www.bloomberg.com/careers", focus: ["Market Data", "Finance", "Trading", "Data"] },
  { company: "Murex", location: "Paris / Global", careersUrl: "https://www.murex.com/careers", focus: ["Capital Markets", "Derivatives", "Risk Management", "Trading"] },
  { company: "Adenza", location: "Paris / Global", careersUrl: "https://www.adenza.com/careers/", focus: ["Capital Markets", "Derivatives", "Risk Management", "Trading"] },
  { company: "Squarepoint Capital", location: "Paris / London / Global", careersUrl: "https://www.squarepoint-capital.com/careers", focus: ["Quantitative Finance", "Trading", "Market Data", "Risk Management"] },
  { company: "Qube Research & Technologies", location: "Paris / London / Global", careersUrl: "https://www.qube-rt.com/careers/", focus: ["Quantitative Finance", "Trading", "Market Data", "Data"] },
  { company: "Millennium", location: "Paris / London / Global", careersUrl: "https://www.mlp.com/careers/", focus: ["Trading", "Portfolio Management", "Risk Management", "Quantitative Finance"] },
  { company: "Citadel Securities", location: "London / Global", careersUrl: "https://www.citadelsecurities.com/careers/", focus: ["Trading", "Market Making", "Quantitative Finance", "Market Data"] },
  { company: "Jane Street", location: "London / Global", careersUrl: "https://www.janestreet.com/join-jane-street/", focus: ["Trading", "Market Making", "Quantitative Finance", "Derivatives"] },
  { company: "Optiver", location: "Amsterdam / London / Global", careersUrl: "https://optiver.com/working-at-optiver/career-opportunities/", focus: ["Trading", "Market Making", "Options Pricing", "Risk Management"] },
  { company: "Flow Traders", location: "Amsterdam / Global", careersUrl: "https://www.flowtraders.com/careers", focus: ["Trading", "Market Making", "Equities", "Risk Management"] },
  { company: "IMC Trading", location: "Amsterdam / Global", careersUrl: "https://www.imc.com/careers/", focus: ["Trading", "Market Making", "Quantitative Finance", "Derivatives"] },
  { company: "DRW", location: "London / Global", careersUrl: "https://drw.com/work-at-drw/listings/", focus: ["Trading", "Derivatives", "Risk Management", "Quantitative Finance"] },
];

const COMPANY_SIGNAL_ALIASES: Record<string, string[]> = {
  AI: ["ai", "artificial intelligence", "generative ai", "genai"],
  LLM: ["llm", "large language model", "gpt", "transformer", "prompt engineering"],
  RAG: ["rag", "retrieval", "vector search", "embedding", "faiss", "semantic search"],
  ML: ["machine learning", "ml", "scikit", "tensorflow", "pytorch", "model"],
  MLOps: ["mlops", "mlflow", "model deployment", "monitoring", "wandb"],
  "Developer tools": ["developer tools", "devtools", "api", "sdk", "python", "typescript"],
  "AI agents": ["agent", "agents", "langchain", "langgraph", "tool calling", "automation"],
  "Vector database": ["vector database", "pinecone", "weaviate", "qdrant", "embedding"],
  Healthcare: ["healthcare", "health", "medical", "clinical", "doctolib", "nabla"],
  Fintech: ["fintech", "banking", "payment", "finance", "qonto"],
  Security: ["security", "cybersecurity", "ledger", "crypto", "blockchain"],
  Cloud: ["cloud", "aws", "azure", "gcp", "kubernetes", "docker"],
  Data: ["data", "sql", "analytics", "pandas", "spark", "airflow"],
  Research: ["research", "phd", "paper", "deep learning", "computer vision", "nlp"],
  Product: ["product", "frontend", "react", "user", "saas"],
  "Open source": ["open source", "github", "oss"],
  "AI infrastructure": ["infrastructure", "inference", "serving", "gpu", "distributed"],
  Energy: ["energy", "energie", "énergie", "electricite", "electricity", "gaz"],
  "Energy Efficiency": ["energy efficiency", "efficacite energetique", "efficacité énergétique", "sobriete", "sobriété", "cee"],
  "Renewable Energy": ["renewable energy", "energies renouvelables", "énergies renouvelables", "solar", "wind"],
  "Solar PV": ["solar pv", "solaire pv", "photovoltaique", "photovoltaïque", "pvsyst", "autoconsommation"],
  Photovoltaic: ["photovoltaic", "photovoltaique", "photovoltaïque", "solaire"],
  "Building Energy": ["building energy", "batiment", "bâtiment", "decret tertiaire", "décret tertiaire", "gtb"],
  Carbon: ["carbon", "bilan carbone", "scope 1", "scope 2", "scope 3", "acv"],
  Sustainability: ["sustainability", "durable", "sobriete", "sobriété", "environnement"],
  Thermal: ["thermal", "thermique", "simulation thermique", "pleiades"],
  HVAC: ["hvac", "cvc", "chauffage", "ventilation"],
  Grid: ["grid", "reseau", "réseau", "electricity", "enedis", "rte"],
  Storage: ["storage", "batterie", "battery", "stockage"],
  Finance: ["finance", "financial", "banking", "banque", "marches financiers", "marchés financiers"],
  Trading: ["trading", "trader", "execution", "desk", "market making"],
  "Capital Markets": ["capital markets", "marches actions", "marchés actions", "fixed income", "equities"],
  "Quantitative Finance": ["quant", "quantitative", "backtesting", "sharpe", "drawdown", "momentum", "mean reversion"],
  "Asset Management": ["asset management", "gestion d'actifs", "gerants", "gérants"],
  Derivatives: ["derivatives", "derives", "dérivés", "options", "futures", "greeks", "delta"],
  Equities: ["equities", "actions", "etf", "indices"],
  "Risk Management": ["risk", "risque", "var", "stress tests", "drawdown", "exposure", "exposition"],
  "Market Data": ["market data", "bloomberg", "reuters", "eikon", "refinitiv"],
  "Portfolio Management": ["portfolio", "portefeuille", "pnl", "p&l", "position"],
  "Market Making": ["market making", "spreads", "liquidity", "carnet d'ordres"],
  "Options Pricing": ["options pricing", "pricing options", "volatilite", "volatilité", "implied volatility"],
  Exchange: ["exchange", "euronext", "clearing", "listing"],
  Investment: ["investment", "investissement", "investment analyst"],
};

function stripHtml(value: string): string {
  const element = document.createElement("div");
  element.innerHTML = value;
  return (element.textContent ?? element.innerText ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsAlias(haystack: string, alias: string): boolean {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i").test(haystack);
}

function extractJobSkills(...texts: string[]): string[] {
  const haystack = normalize(texts.join(" "));
  return Object.entries(JOB_SKILLS)
    .filter(([, aliases]) => aliases.some((alias) => containsAlias(haystack, alias)))
    .map(([skill]) => skill)
    .sort();
}

function buildJobAnalysis(posting: RawPosting, profile: CandidateProfile): JobAnalysis {
  const required = extractJobSkills(posting.title, posting.description, posting.tags.join(" "));
  const owned = new Set([...profile.skills, ...profile.tools, ...profile.frameworks].map((skill) => normalize(skill)));
  const matched = required.filter((skill) => owned.has(normalize(skill)));
  const missing = required.filter((skill) => !owned.has(normalize(skill)));
  const core = required.slice(0, 4).join(", ") || "AI/data skills";
  const matchedText = matched.slice(0, 4).join(", ") || "AI/data projects";
  const missingText = missing.length ? ` I would also prepare around ${missing.slice(0, 2).join(" and ")}.` : "";

  return {
    id: posting.id,
    title: posting.title,
    company: posting.company,
    location: posting.location,
    source: posting.source,
    url: posting.url,
    published_at: posting.published_at,
    match_score: 0,
    priority: "low",
    raw_description: posting.description,
    required_skills: required,
    matched_skills: matched,
    missing_skills: missing,
    rule_based_summary: `${posting.title} at ${posting.company}, focused on ${core}. Location: ${posting.location}.`,
    rule_based_application_sentence: `I would connect my profile around ${matchedText} to ${posting.company}'s ${posting.title} role.${missingText}`,
    score_explanation: [
      `Browser agent found this job via ${posting.source}.`,
      `${matched.length} of ${required.length} extracted skills match the active profile.`,
    ],
  };
}

async function fetchJson(url: string, timeoutMs = 14000): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function parseRemotive(payload: unknown, limit: number): RawPosting[] {
  const jobs = typeof payload === "object" && payload && "jobs" in payload && Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.slice(0, limit).map((item: Record<string, unknown>) => {
    const tags = Array.isArray(item.tags) ? item.tags.map(String) : item.tags ? [String(item.tags)] : [];
    return {
      id: `browser-remotive-${String(item.id ?? item.url ?? item.title)}`,
      title: String(item.title ?? "Untitled role"),
      company: String(item.company_name ?? "Unknown company"),
      location: String(item.candidate_required_location ?? item.job_type ?? "Remote"),
      source: "Remotive live",
      url: String(item.url ?? item.job_url ?? "https://remotive.com/remote-jobs"),
      published_at: String(item.publication_date ?? new Date().toISOString()).slice(0, 10),
      description: stripHtml(String(item.description ?? "")),
      tags,
    };
  });
}

function parseJobicy(payload: unknown, limit: number): RawPosting[] {
  const jobs = typeof payload === "object" && payload && "jobs" in payload && Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.slice(0, limit).map((item: Record<string, unknown>) => {
    const industries = Array.isArray(item.jobIndustry) ? item.jobIndustry.map(String) : item.jobIndustry ? [String(item.jobIndustry)] : [];
    const jobTypes = Array.isArray(item.jobType) ? item.jobType.map(String) : [];
    return {
      id: `browser-jobicy-${String(item.id ?? item.jobSlug ?? item.url ?? item.jobTitle)}`,
      title: String(item.jobTitle ?? "Untitled role"),
      company: String(item.companyName ?? "Unknown company"),
      location: String(item.jobGeo ?? "Remote"),
      source: "Jobicy live",
      url: String(item.url ?? "https://jobicy.com/"),
      published_at: String(item.pubDate ?? item.published_at ?? new Date().toISOString()).slice(0, 10),
      description: stripHtml(String(item.jobDescription ?? item.jobExcerpt ?? "")),
      tags: [...industries, ...jobTypes, String(item.jobLevel ?? "")].filter(Boolean),
    };
  });
}

function parseRemoteOk(payload: unknown, limit: number): RawPosting[] {
  const rows = Array.isArray(payload) ? payload : [];
  return rows
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && "position" in item)
    .slice(0, limit)
    .map((item) => {
      const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
      const company = String(item.company ?? "Unknown company");
      const title = String(item.position ?? "Untitled role");
      return {
        id: `browser-remoteok-${String(item.id ?? item.slug ?? item.url ?? title)}`,
        title,
        company,
        location: String(item.location ?? "Remote"),
        source: "RemoteOK live",
        url: String(item.url ?? `https://remoteok.com/remote-jobs/${encodeURIComponent(title)}`),
        published_at: String(item.date ?? new Date().toISOString()).slice(0, 10),
        description: stripHtml(String(item.description ?? [title, company, tags.join(" ")].join(" "))),
        tags,
      };
    });
}

function parseArbeitnow(payload: unknown, limit: number): RawPosting[] {
  const jobs = typeof payload === "object" && payload && "data" in payload && Array.isArray(payload.data) ? payload.data : [];
  return jobs.slice(0, limit).map((item: Record<string, unknown>) => {
    const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
    const createdAt = Number(item.created_at ?? 0);
    const publishedAt = createdAt > 0 ? new Date(createdAt * 1000).toISOString() : new Date().toISOString();
    return {
      id: `browser-arbeitnow-${String(item.slug ?? item.url ?? item.title)}`,
      title: String(item.title ?? "Untitled role"),
      company: String(item.company_name ?? "Unknown company"),
      location: String(item.location ?? "Remote / Europe"),
      source: "Arbeitnow live",
      url: String(item.url ?? "https://www.arbeitnow.com/"),
      published_at: publishedAt.slice(0, 10),
      description: stripHtml(String(item.description ?? "")),
      tags,
    };
  });
}

function postingMatchesQuery(posting: RawPosting, query: string, profile: CandidateProfile): boolean {
  const queryTerms = normalize(query).split(" ").filter((term) => term.length > 2);
  const profileTerms = [...profile.skills, ...profile.tools, ...profile.frameworks, ...profile.domains]
    .map(normalize)
    .filter((term) => term.length > 2)
    .slice(0, 16);
  const haystack = normalize([posting.title, posting.company, posting.location, posting.description, posting.tags.join(" ")].join(" "));
  return [...queryTerms, ...profileTerms].some((term) => haystack.includes(term));
}

function profileSignalText(profile: CandidateProfile, role: string): string {
  return normalize([
    role,
    ...profile.targetRoles,
    ...profile.skills,
    ...profile.tools,
    ...profile.frameworks,
    ...profile.domains,
    ...profile.education,
    ...profile.experiences,
    ...profile.senioritySignals,
    ...profile.locationSignals,
    ...profile.keywords,
    profile.rawText ?? "",
  ].join(" "));
}

function signalAliases(signal: string): string[] {
  return [signal, ...(COMPANY_SIGNAL_ALIASES[signal] ?? [])].map(normalize).filter(Boolean);
}

function scoreCompanyBoard(board: CompanyBoard, profile: CandidateProfile, role: string): ScoredCompanyBoard {
  const profileText = profileSignalText(profile, role);
  const roleText = normalize(role);
  const locationText = normalize(profile.locationSignals.join(" "));
  const reasons: string[] = [];
  let score = 0;

  for (const focus of board.focus) {
    const matchedAlias = signalAliases(focus).find((alias) => alias.length > 1 && profileText.includes(alias));
    if (matchedAlias) {
      score += 12;
      reasons.push(focus);
    }
  }

  if (/ai|llm|machine learning|ml|data|rag/.test(roleText) && board.focus.some((focus) => /ai|llm|ml|data|rag|research/i.test(focus))) {
    score += 10;
  }
  if (/engineer|developer|software/.test(roleText) && board.focus.some((focus) => /platform|developer tools|infrastructure|cloud|open source/i.test(focus))) {
    score += 6;
  }
  if (/france|paris|europe|remote/.test(locationText) && /paris|europe|remote|global/i.test(board.location)) {
    score += 5;
    reasons.push(board.location);
  }
  if (board.ats) {
    score += 3;
  }

  return {
    board,
    score,
    reasons: [...new Set(reasons)].slice(0, 4),
  };
}

function selectCompanyBoardsForProfile(profile: CandidateProfile, role: string, limit: number): ScoredCompanyBoard[] {
  const selected = AI_COMPANY_BOARDS
    .map((board) => scoreCompanyBoard(board, profile, role))
    .sort((a, b) => b.score - a.score || a.board.company.localeCompare(b.board.company));

  const relevant = selected.filter((item) => item.score > 0);
  return (relevant.length ? relevant : selected).slice(0, limit);
}

function parseGreenhouseJobs(payload: unknown, board: CompanyBoard, limit: number): RawPosting[] {
  const jobs = typeof payload === "object" && payload && "jobs" in payload && Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.slice(0, limit).map((item: Record<string, unknown>) => {
    const location = typeof item.location === "object" && item.location && "name" in item.location
      ? String((item.location as Record<string, unknown>).name)
      : board.location;
    return {
      id: `company-greenhouse-${board.slug}-${String(item.id ?? item.absolute_url ?? item.title)}`,
      title: String(item.title ?? "Untitled role"),
      company: board.company,
      location,
      source: `${board.company} careers`,
      url: String(item.absolute_url ?? board.careersUrl),
      published_at: String(item.updated_at ?? new Date().toISOString()).slice(0, 10),
      description: stripHtml(String(item.content ?? "")),
      tags: board.focus,
    };
  });
}

function parseLeverJobs(payload: unknown, board: CompanyBoard, limit: number): RawPosting[] {
  const jobs = Array.isArray(payload) ? payload : [];
  return jobs.slice(0, limit).map((item: Record<string, unknown>) => {
    const categories = typeof item.categories === "object" && item.categories ? item.categories as Record<string, unknown> : {};
    const lists = Array.isArray(item.lists)
      ? item.lists.flatMap((list) => {
        if (typeof list !== "object" || !list) return [];
        const content = (list as Record<string, unknown>).content;
        return Array.isArray(content) ? content.map(String) : [];
      })
      : [];
    const createdAt = Number(item.createdAt ?? 0);
    return {
      id: `company-lever-${board.slug}-${String(item.id ?? item.hostedUrl ?? item.text)}`,
      title: String(item.text ?? "Untitled role"),
      company: board.company,
      location: String(categories.location ?? board.location),
      source: `${board.company} careers`,
      url: String(item.hostedUrl ?? item.applyUrl ?? board.careersUrl),
      published_at: createdAt > 0 ? new Date(createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      description: stripHtml(String(item.descriptionPlain ?? item.description ?? lists.join(" "))),
      tags: [...board.focus, String(categories.team ?? ""), String(categories.commitment ?? "")].filter(Boolean),
    };
  });
}

async function fetchCompanyBoard(board: CompanyBoard, query: string, profile: CandidateProfile, limit: number): Promise<JobAnalysis[]> {
  if (!board.ats || !board.slug) return [];
  const url = board.ats === "greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=true`
    : `https://api.lever.co/v0/postings/${encodeURIComponent(board.slug)}?mode=json`;
  const payload = await fetchJson(url, 7000);
  const postings = board.ats === "greenhouse"
    ? parseGreenhouseJobs(payload, board, 80)
    : parseLeverJobs(payload, board, 80);
  return postings
    .filter((posting) => postingMatchesQuery(posting, query, profile))
    .slice(0, limit)
    .map((posting) => buildJobAnalysis(posting, profile));
}

async function searchCompanyBoards(query: string, profile: CandidateProfile, limit: number): Promise<JobAnalysis[]> {
  const atsBoards = selectCompanyBoardsForProfile(profile, query, 24)
    .map((item) => item.board)
    .filter((board) => board.ats && board.slug);
  const perBoardLimit = Math.max(2, Math.ceil(limit / Math.max(1, atsBoards.length)));
  const results = await Promise.allSettled(
    atsBoards.map((board) => fetchCompanyBoard(board, query, profile, perBoardLimit))
  );
  return results
    .flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .slice(0, limit);
}

function buildCompanyCareerLinks(query: string, profile: CandidateProfile, limit: number): ExternalSearchLink[] {
  const role = query || profile.targetRoles[0] || "AI Engineer";
  const location = profile.locationSignals.find(Boolean) ?? "remote Europe";
  if (profile.companyTargets?.length) {
    return profile.companyTargets.slice(0, limit).map((target, index) => {
      const searchQuery = target.searchQuery || `${target.name} careers ${role} ${location}`;
      return {
        id: `llm-company-target-${normalize(target.name).replace(/[^a-z0-9]+/g, "-")}-${index}`,
        source: `${target.name} career search`,
        title: `${target.name}: ${role}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        query: role,
        location,
        description: `Generated by WebLLM from your CV: ${target.reason}`,
      };
    });
  }
  return selectCompanyBoardsForProfile(profile, role, limit).map(({ board, reasons }, index) => ({
    id: `company-career-${normalize(board.company).replace(/[^a-z0-9]+/g, "-")}-${index}`,
    source: `${board.company} careers`,
    title: `${board.company}: ${role}`,
    url: board.careersUrl,
    query: role,
    location: board.location || location,
    description: reasons.length
      ? `Selected from your CV signals: ${reasons.join(", ")}. Focus: ${board.focus.join(", ")}.`
      : `Direct company career page. Focus: ${board.focus.join(", ")}.`,
  }));
}

function buildWebSearchLinks(query: string, profile: CandidateProfile, limit: number): ExternalSearchLink[] {
  const location = profile.locationSignals.find(Boolean) ?? "remote Europe";
  const role = query || profile.targetRoles[0] || "AI Engineer";
  const searchTerms = `${role} ${location} job`;
  const boards = [
    {
      source: "Google search",
      company: "Google",
      title: `Google jobs search: ${role}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${searchTerms} site:linkedin.com/jobs OR site:welcometothejungle.com OR site:indeed.com`)}`,
      description: "Open a targeted Google search across major job boards. Useful when public APIs do not cover enough offers.",
    },
    {
      source: "LinkedIn search",
      company: "LinkedIn",
      title: `LinkedIn jobs search: ${role}`,
      url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}&location=${encodeURIComponent(location)}`,
      description: "Open LinkedIn Jobs with the current role and location. LinkedIn cannot be scraped from GitHub Pages.",
    },
    {
      source: "Indeed search",
      company: "Indeed",
      title: `Indeed jobs search: ${role}`,
      url: `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}&l=${encodeURIComponent(location)}`,
      description: "Open Indeed with the current role and location. Results are reviewed on the job board.",
    },
    {
      source: "Welcome to the Jungle search",
      company: "Welcome to the Jungle",
      title: `Welcome to the Jungle search: ${role}`,
      url: `https://www.welcometothejungle.com/en/jobs?query=${encodeURIComponent(role)}&aroundQuery=${encodeURIComponent(location)}`,
      description: "Open Welcome to the Jungle for Europe/France-friendly searches.",
    },
    {
      source: "Wellfound search",
      company: "Wellfound",
      title: `Wellfound startup jobs: ${role}`,
      url: `https://wellfound.com/jobs?query=${encodeURIComponent(role)}`,
      description: "Open Wellfound for startup AI and software roles.",
    },
    {
      source: "Y Combinator search",
      company: "Y Combinator",
      title: `YC startup jobs: ${role}`,
      url: `https://www.ycombinator.com/jobs?query=${encodeURIComponent(role)}`,
      description: "Open YC Work at a Startup for fast-growing technical roles.",
    },
  ];

  const companyLinks = buildCompanyCareerLinks(role, profile, Math.max(0, limit - boards.length));
  const boardLinks = boards.slice(0, limit).map((posting, index) => ({
    id: `browser-web-search-${normalize(posting.source).replace(/\s+/g, "-")}-${index}`,
    source: posting.source,
    title: posting.title,
    url: posting.url,
    query: role,
    location,
    description: posting.description,
  }));
  return [...boardLinks, ...companyLinks].slice(0, limit);
}

function staticMatches(staticJobs: JobAnalysis[], query: string, limit: number): JobAnalysis[] {
  const normalized = normalize(query);
  return staticJobs
    .filter((job) => {
      if (!normalized) return true;
      return normalize([job.title, job.company, job.location, job.source, job.raw_description, ...job.required_skills].join(" ")).includes(normalized);
    })
    .slice(0, limit);
}

export async function executeAgentTool(
  call: BrowserAgentToolCall,
  profile: CandidateProfile,
  staticJobs: JobAnalysis[]
): Promise<ToolExecutionResult> {
  const query = call.args.query ?? "AI Engineer";
  const limit = call.args.limit ?? 10;
  try {
    if (call.tool === "search_static_jobs") {
      const jobs = staticMatches(staticJobs, query, limit);
      return { jobs, count: jobs.length };
    }
    if (call.tool === "search_remotive") {
      const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=${limit}`;
      const payload = await fetchJson(url);
      const jobs = parseRemotive(payload, limit).map((posting) => buildJobAnalysis(posting, profile));
      return { jobs, count: jobs.length };
    }
    if (call.tool === "search_jobicy") {
      const tags = JOBICY_TAGS[query] ?? ["python"];
      const all: JobAnalysis[] = [];
      for (const tag of tags) {
        const url = `https://jobicy.com/api/v2/remote-jobs?count=${limit}&tag=${encodeURIComponent(tag)}`;
        const payload = await fetchJson(url);
        all.push(...parseJobicy(payload, limit).map((posting) => buildJobAnalysis(posting, profile)));
      }
      return { jobs: all.slice(0, limit), count: all.slice(0, limit).length };
    }
    if (call.tool === "search_remoteok") {
      const url = "https://remoteok.com/api";
      const payload = await fetchJson(url);
      const postings = parseRemoteOk(payload, 100).filter((posting) => {
        const haystack = normalize([posting.title, posting.company, posting.location, posting.description, posting.tags.join(" ")].join(" "));
        return normalize(query).split(" ").some((term) => term.length > 2 && haystack.includes(term));
      });
      const jobs = postings.slice(0, limit).map((posting) => buildJobAnalysis(posting, profile));
      return { jobs, count: jobs.length };
    }
    if (call.tool === "search_arbeitnow") {
      const url = "https://www.arbeitnow.com/api/job-board-api";
      const payload = await fetchJson(url);
      const postings = parseArbeitnow(payload, 100).filter((posting) => {
        const haystack = normalize([posting.title, posting.company, posting.location, posting.description, posting.tags.join(" ")].join(" "));
        return normalize(query).split(" ").some((term) => term.length > 2 && haystack.includes(term));
      });
      const jobs = postings.slice(0, limit).map((posting) => buildJobAnalysis(posting, profile));
      return { jobs, count: jobs.length };
    }
    if (call.tool === "search_company_boards") {
      if (profile.companyTargets?.length) {
        const externalSearchLinks = buildCompanyCareerLinks(query, profile, 30);
        return { jobs: [], externalSearchLinks, count: externalSearchLinks.length };
      }
      const jobs = await searchCompanyBoards(query, profile, limit);
      const externalSearchLinks = buildCompanyCareerLinks(query, profile, 36);
      return { jobs, externalSearchLinks, count: jobs.length };
    }
    if (call.tool === "build_web_search_links") {
      const externalSearchLinks = buildWebSearchLinks(query, profile, Math.min(limit, 6));
      return { jobs: [], externalSearchLinks, count: externalSearchLinks.length };
    }
    return { jobs: [], count: 0, error: `Unsupported tool: ${call.tool}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      jobs: [],
      count: 0,
      error: `${call.tool} failed for "${query}". Browser APIs may be blocked by CORS or rate limits. ${reason}`,
    };
  }
}
