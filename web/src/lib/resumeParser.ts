import type { CandidateProfile, ParsedResumeResult } from "../types";
import { parseDocxFile } from "./docxParser";
import { parsePdfFile } from "./pdfParser";

const SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "FastAPI",
  "Flask",
  "Django",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "GitHub Actions",
  "AWS",
  "Azure",
  "GCP",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Computer Vision",
  "LLM",
  "RAG",
  "LangChain",
  "LangGraph",
  "FAISS",
  "Vector Search",
  "Embeddings",
  "Transformers",
  "PyTorch",
  "TensorFlow",
  "Scikit-learn",
  "Pandas",
  "NumPy",
  "Spark",
  "Airflow",
  "MLflow",
  "MLOps",
  "Dataiku",
  "OpenAI",
  "Mistral",
  "Gemini",
  "REST API",
  "GraphQL",
  "Power BI",
  "Excel",
  "QGIS",
  "AutoCAD",
  "PVSyst",
  "Pleiades",
  "Energy Audit",
  "Solar PV",
  "Photovoltaic",
  "ISO 50001",
  "Carbon Accounting",
  "Life Cycle Assessment",
  "Thermal Simulation",
  "Building Energy",
  "HVAC",
  "Bloomberg",
  "Reuters Eikon",
  "VBA",
  "Jupyter",
  "Market Data API",
  "Trading",
  "Options Pricing",
  "Derivatives",
  "Market Making",
  "Risk Management",
  "VaR",
  "Stress Testing",
  "Greeks",
  "Backtesting",
  "PnL",
  "Portfolio Management",
  "Pastry",
  "Viennoiserie",
  "Chocolate",
  "HACCP",
  "Catering",
  "Dessert Plating",
  "Bakery",
];

const TARGET_ROLES = [
  "AI Engineer",
  "Applied AI Engineer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Data Analyst",
  "Junior Data Analyst",
  "Data Engineer",
  "LLM Engineer",
  "RAG Engineer",
  "NLP Engineer",
  "Computer Vision Engineer",
  "Software Engineer",
  "Backend Engineer",
  "Full Stack Developer",
  "Energy Engineer",
  "Energy Efficiency Engineer",
  "Renewable Energy Engineer",
  "Solar PV Engineer",
  "Building Energy Engineer",
  "Energy Data Analyst",
  "Sustainability Consultant",
  "Junior Trader",
  "Trading Analyst",
  "Assistant Trader",
  "Quantitative Analyst",
  "Quant Trader",
  "Market Risk Analyst",
  "Investment Analyst",
  "Portfolio Analyst",
  "Market Data Analyst",
  "Chef Patissier",
  "Junior Pastry Chef",
  "Pastry Commis",
  "Bakery Pastry Chef",
  "Chocolate Pastry Chef",
];

const SENIORITY = [
  "junior",
  "graduate",
  "intern",
  "internship",
  "alternance",
  "entry-level",
  "mid-level",
  "senior",
  "lead",
  "principal",
];

const EDUCATION = [
  "Master",
  "MSc",
  "Bachelor",
  "Engineering degree",
  "PhD",
  "computer science",
  "artificial intelligence",
  "data science",
  "machine learning",
];

const LANGUAGES = [
  "French",
  "English",
  "Spanish",
  "German",
  "Italian",
  "Arabic",
  "Portuguese",
  "Mandarin",
  "Français",
  "Anglais",
  "Espagnol",
];

const LOCATION_SIGNALS = [
  "remote",
  "hybrid",
  "onsite",
  "France",
  "Europe",
  "Paris",
  "Lyon",
  "Bordeaux",
  "Toulouse",
  "Lille",
  "Nantes",
  "Marseille",
  "London",
  "Berlin",
  "Amsterdam",
  "Brussels",
];

const DOMAIN_KEYWORDS = [
  "LLM",
  "RAG",
  "NLP",
  "Computer Vision",
  "MLOps",
  "Data Engineering",
  "Analytics",
  "SaaS",
  "Fintech",
  "Health",
  "Healthcare",
  "E-commerce",
  "Search",
  "Recommendation",
  "Automation",
  "Chatbot",
  "Agent",
  "Agents",
  "Vector",
  "Cloud",
  "API",
  "ETL",
  "Energy",
  "Energy Efficiency",
  "Renewable Energy",
  "Solar PV",
  "Photovoltaic",
  "Building Energy",
  "Energy Audit",
  "Carbon",
  "Sustainability",
  "Thermal",
  "HVAC",
  "Finance",
  "Trading",
  "Capital Markets",
  "Quantitative Finance",
  "Asset Management",
  "Derivatives",
  "Equities",
  "Risk Management",
  "Market Data",
  "Portfolio Management",
  "Pastry",
  "Bakery",
  "Hospitality",
  "Catering",
  "Food Production",
  "Event Catering",
];

const TOOL_KEYWORDS = [
  "Docker",
  "Kubernetes",
  "GitHub Actions",
  "AWS",
  "Azure",
  "GCP",
  "Dataiku",
  "MLflow",
  "FAISS",
  "Power BI",
  "Excel",
  "QGIS",
  "AutoCAD",
  "PVSyst",
  "Pleiades",
  "Bloomberg",
  "Reuters Eikon",
  "VBA",
  "Jupyter",
  "Market Data API",
];
const FRAMEWORK_KEYWORDS = [
  "React",
  "Next.js",
  "FastAPI",
  "Flask",
  "Django",
  "LangChain",
  "LangGraph",
  "PyTorch",
  "TensorFlow",
  "Scikit-learn",
];

const ENERGY_ROLE_TERMS = [
  "energie",
  "energy",
  "efficacite energetique",
  "efficacité énergétique",
  "solaire",
  "photovolta",
  "batiment",
  "bâtiment",
  "cvc",
  "hvac",
  "iso 50001",
  "bilan carbone",
  "thermique",
  "renouvelable",
];

const FINANCE_ROLE_TERMS = [
  "trader",
  "trading",
  "finance de marche",
  "finance de marché",
  "marches actions",
  "marchés actions",
  "marches financiers",
  "marchés financiers",
  "quant",
  "quantitatif",
  "actions",
  "equities",
  "derives",
  "dérivés",
  "options",
  "futures",
  "market making",
  "pnl",
  "var",
  "greeks",
  "bloomberg",
  "reuters",
  "risk",
  "risque",
  "asset management",
  "portfolio",
  "backtesting",
];

const PASTRY_ROLE_TERMS = [
  "patissier",
  "pâtissier",
  "patissiere",
  "pâtissière",
  "patisserie",
  "pâtisserie",
  "viennoiserie",
  "entremets",
  "glacage",
  "glaçage",
  "chocolaterie",
  "ganache",
  "macaron",
  "haccp",
  "laboratoire artisanal",
  "boulangerie",
  "mignardises",
  "desserts",
  "vitrine",
];

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();
    if (cleaned && !seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(text: string, term: string): boolean {
  const boundary = /[a-z0-9+#.]/i.test(term[0]) && /[a-z0-9+#.]/i.test(term.at(-1) ?? "");
  const pattern = boundary ? `(^|[^a-z0-9+#.])${escapeRegExp(term)}([^a-z0-9+#.]|$)` : escapeRegExp(term);
  return new RegExp(pattern, "i").test(text);
}

function detectTerms(text: string, dictionary: string[]): string[] {
  return unique(dictionary.filter((term) => containsTerm(text, term)));
}

function detectExperienceKeywords(text: string): string[] {
  const lines = text.split(/\n|\.|;/).map((line) => line.trim()).filter(Boolean);
  const useful = lines.filter((line) =>
    /(project|projet|experience|internship|stage|alternance|built|developed|created|deployed|automated|pipeline|dashboard|agent|model|api)/i.test(line)
  );
  return unique(useful.map((line) => line.slice(0, 110))).slice(0, 10);
}

function extractKeywords(text: string): string[] {
  const ignored = new Set([
    "with",
    "from",
    "that",
    "this",
    "dans",
    "pour",
    "avec",
    "les",
    "des",
    "and",
    "the",
    "une",
    "resume",
    "experience",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !ignored.has(word));
  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 18)
    .map(([word]) => word);
}

function normalizeRoleFallback(skills: string[], domains: string[]): string[] {
  const text = [...skills, ...domains].join(" ").toLowerCase();
  if (/pastry|patisserie|pâtisserie|bakery|viennoiserie|haccp|catering|dessert/.test(text)) return ["Junior Pastry Chef", "Chef Patissier", "Pastry Commis"];
  if (/trading|trader|finance|capital markets|quantitative finance|derivatives|equities|risk management|market data|portfolio/.test(text)) return ["Trading Analyst", "Junior Trader", "Quantitative Analyst"];
  if (/energy|energie|efficacite energetique|solar pv|photovoltaic|building energy|thermal|hvac|carbon|renewable/.test(text)) return ["Energy Efficiency Engineer", "Renewable Energy Engineer", "Energy Data Analyst"];
  if (/llm|rag|langchain|langgraph|openai|mistral|gemini/.test(text)) return ["LLM Engineer", "Applied AI Engineer"];
  if (/machine learning|pytorch|tensorflow|scikit|mlops/.test(text)) return ["Machine Learning Engineer", "Data Scientist"];
  if (/data analyst|analytics|dashboard|reporting|power bi|kpi/.test(text)) return ["Data Analyst", "Data Scientist"];
  if (/sql|spark|airflow|etl|data/.test(text)) return ["Data Engineer", "Data Scientist"];
  if (/react|typescript|fastapi|django|flask/.test(text)) return ["Full Stack Developer", "Software Engineer"];
  return ["AI Engineer"];
}

export function buildCandidateProfileFromText(text: string, fileName?: string): CandidateProfile {
  const lowerText = text.toLowerCase();
  const energySignals = ENERGY_ROLE_TERMS.some((term) => lowerText.includes(term));
  const financeHitCount = FINANCE_ROLE_TERMS.filter((term) => containsTerm(text, term)).length;
  const financeSignals = financeHitCount >= 2 || /\btrader\b|\btrading\b|finance de march|march[ée]s financiers|march[ée]s actions/.test(lowerText);
  const pastrySignals = PASTRY_ROLE_TERMS.some((term) => lowerText.includes(term));
  const skills = unique([
    ...detectTerms(text, SKILLS),
    ...(energySignals ? ["Energy Audit", "Solar PV", "Photovoltaic", "Carbon Accounting", "Thermal Simulation", "Building Energy", "HVAC"] : []),
    ...(financeSignals ? ["Trading", "Options Pricing", "Derivatives", "Risk Management", "VaR", "Greeks", "Backtesting", "PnL", "Portfolio Management"] : []),
    ...(pastrySignals ? ["Pastry", "Viennoiserie", "Chocolate", "HACCP", "Catering", "Dessert Plating", "Bakery"] : []),
  ]);
  const tools = detectTerms(text, TOOL_KEYWORDS);
  const frameworks = detectTerms(text, FRAMEWORK_KEYWORDS);
  const domains = unique([
    ...detectTerms(text, DOMAIN_KEYWORDS),
    ...(energySignals ? ["Energy", "Energy Efficiency", "Renewable Energy", "Solar PV", "Building Energy", "Carbon", "Sustainability", "Thermal", "HVAC"] : []),
    ...(financeSignals ? ["Finance", "Trading", "Capital Markets", "Quantitative Finance", "Asset Management", "Derivatives", "Equities", "Risk Management", "Market Data", "Portfolio Management"] : []),
    ...(pastrySignals ? ["Pastry", "Bakery", "Hospitality", "Catering", "Food Production", "Event Catering"] : []),
  ]);
  const targetRoles = unique([
    ...detectTerms(text, TARGET_ROLES),
    ...(energySignals ? ["Energy Efficiency Engineer", "Renewable Energy Engineer", "Energy Data Analyst"] : []),
    ...(financeSignals ? ["Trading Analyst", "Junior Trader", "Assistant Trader", "Quantitative Analyst"] : []),
    ...(pastrySignals ? ["Junior Pastry Chef", "Chef Patissier", "Pastry Commis"] : []),
  ]);
  const education = detectTerms(text, EDUCATION);
  const languages = detectTerms(text, LANGUAGES).map((language) => language.replace("Français", "French").replace("Anglais", "English").replace("Espagnol", "Spanish"));
  const senioritySignals = detectTerms(text, SENIORITY);
  const locationSignals = detectTerms(text, LOCATION_SIGNALS);
  const experiences = detectExperienceKeywords(text);
  const createdAt = new Date().toISOString();

  return {
    source: "uploaded_resume",
    fileName,
    rawText: text,
    targetRoles: targetRoles.length ? targetRoles : normalizeRoleFallback(skills, domains),
    skills,
    tools,
    frameworks,
    domains,
    education,
    experiences,
    languages: unique(languages),
    senioritySignals,
    locationSignals,
    keywords: unique([...extractKeywords(text), ...domains.map((domain) => domain.toLowerCase())]).slice(0, 24),
    extractionMethod: "deterministic",
    createdAt,
    updatedAt: createdAt,
  };
}

export async function parseResumeFile(file: File): Promise<ParsedResumeResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mime = file.type.toLowerCase();
  let text = "";
  let format: ParsedResumeResult["format"];

  if (extension === "pdf" || mime.includes("pdf")) {
    format = "pdf";
    text = await parsePdfFile(file);
  } else if (extension === "txt" || mime.startsWith("text/")) {
    format = "txt";
    text = await file.text();
  } else if (extension === "docx" || mime.includes("wordprocessingml")) {
    format = "docx";
    text = await parseDocxFile(file);
  } else {
    throw new Error("Unsupported file type. Please upload PDF or TXT.");
  }

  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    throw new Error("No readable text was found in this file.");
  }

  return {
    profile: buildCandidateProfileFromText(trimmed, file.name),
    textLength: trimmed.length,
    format,
  };
}
