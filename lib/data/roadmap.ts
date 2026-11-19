import { Node, Edge } from "@xyflow/react";
import statusData from "./roadmap-status.json";

const statuses = statusData as Record<string, "current" | "planned" | "done">;

const buildNode = (
  id: string,
  category: string,
  label: string,
  description?: string,
  details?: string[]
): Node => ({
  id,
  type: "custom",
  position: { x: 0, y: 0 },
  data: { category, label, description, details, status: statuses[id] },
});

const buildEdge = (source: string, target: string, animated = true): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  animated,
  style: { stroke: "#555", strokeWidth: 1.5 },
});

export const initialNodes: Node[] = [
  // --- Mathematics ---
  buildNode("math-root", "Mathematics", "Mathematics Core", "The foundation that makes ML, stats, and finance click."),
  buildNode(
    "math-1",
    "Mathematics",
    "Absolute Fundamentals",
    "Solidifying the baseline of math before advancing.",
    ["Functions & Algebra", "Exponents & Logarithms", "Sequences & Series", "Trigonometry", "Coordinate Geometry"],
  ),
  buildNode(
    "math-2",
    "Mathematics",
    "Calculus",
    "Understanding continuous change and rates.",
    ["Limits & Continuity", "Derivatives & Chain Rule", "Partial & Directional Derivatives", "Multiple Integrals", "Gradients & Taylor Series"]
  ),
  buildNode(
    "math-3",
    "Mathematics",
    "Linear Algebra 🔥",
    "The most important math for ML and Quant.",
    ["Vectors, Matrices, Tensors", "Dot & Cross Products", "Eigenvalues & Eigenvectors", "SVD & Matrix Factorization", "Orthogonality & Projections"]
  ),
  buildNode(
    "math-4",
    "Mathematics",
    "Discrete Mathematics",
    "The underlying logic for computer science.",
    ["Logic & Proofs", "Set Theory", "Combinatorics", "Graph Theory", "Boolean Algebra"]
  ),
  buildNode(
    "math-5",
    "Mathematics",
    "Optimization",
    "Finding the best possible solutions.",
    ["Convex Sets & Functions", "Gradient Descent", "Newton's Method", "Linear & Integer Programming", "Lagrange Multipliers"]
  ),

  // --- Statistics ---
  buildNode("stat-root", "Statistics", "Statistics & Probability", "The uncertainty and prediction brain."),
  buildNode(
    "stat-1",
    "Statistics",
    "Probability",
    "Quantifying uncertainty and randomness.",
    ["Axioms of Probability", "Conditional Prob & Bayes' Theorem", "Random Variables (Discrete/Cont)", "Expected Value & Variance", "Central Limit Theorem"]
  ),
  buildNode(
    "stat-2",
    "Statistics",
    "Distributions",
    "Modeling real-world phenomena.",
    ["Normal, Binomial, Poisson", "Exponential, Gamma", "Student's t, Chi-square", "Joint & Marginal Distributions"]
  ),
  buildNode(
    "stat-3",
    "Statistics",
    "Statistical Inference",
    "Drawing conclusions from data.",
    ["Maximum Likelihood Estimation (MLE)", "Hypothesis Testing & p-values", "Confidence Intervals", "ANOVA", "Regression (Linear, Ridge, Lasso)"]
  ),
  buildNode(
    "stat-4",
    "Statistics",
    "Bayesian Statistics",
    "Updating beliefs based on evidence.",
    ["Prior, Likelihood, Posterior", "Markov Chain Monte Carlo (MCMC)", "Bayesian Networks", "Conjugate Priors"]
  ),

  // --- Computer Science ---
  buildNode("cs-root", "Computer Science", "Computer Science", "The engineering and architecture foundation."),
  buildNode(
    "cs-1",
    "Computer Science",
    "Programming",
    "Mastering languages and memory models.",
    ["Python (Core, OOP, Functional)", "C/C++ (Memory, Pointers)", "Low-level performance & compilation", "TypeScript/Node.js"],
  ),
  buildNode(
    "cs-2",
    "Computer Science",
    "Data Structures & Algorithms",
    "Writing efficient, scalable code.",
    ["Arrays, Linked Lists, Trees", "Graphs, Hash Tables", "Sorting & Searching", "Dynamic Programming", "Big O Time/Space Complexity"]
  ),
  buildNode(
    "cs-3",
    "Computer Science",
    "Systems",
    "How computers and networks actually work.",
    ["Operating Systems (Threads, Memory)", "Networks (TCP/IP, HTTP, DNS)", "Databases (SQL, ACID, NoSQL)", "Caching Strategies"]
  ),
  buildNode(
    "cs-4",
    "Computer Science",
    "Distributed Systems",
    "Designing architectures at global scale.",
    ["Scaling & Partitioning", "Load Balancing", "Consensus Algorithms", "Microservices vs Monoliths", "Docker, K8s, Cloud Infra"]
  ),

  // --- Data Science ---
  buildNode("ds-root", "Data Science", "Data Science", "Python + SQL + Statistics + Analytics"),
  buildNode(
    "ds-1",
    "Data Science",
    "Python Ecosystem",
    "The data manipulation toolbelt.",
    ["NumPy (Vectorization)", "Pandas & Polars (DataFrames)", "Matplotlib & Seaborn (Viz)", "Scikit-Learn API"],
  ),
  buildNode(
    "ds-2",
    "Data Science",
    "SQL Mastery",
    "Extracting and transforming relational data.",
    ["CTEs & Window Functions", "Complex Aggregations", "Query Optimization", "Indexing & Execution Plans"]
  ),
  buildNode(
    "ds-3",
    "Data Science",
    "Data Analysis",
    "Extracting signal from noise.",
    ["Exploratory Data Analysis (EDA)", "Feature Engineering", "A/B Testing & Experimentation", "Dashboarding"]
  ),

  // --- AI / ML ---
  buildNode("ai-root", "AI / ML", "AI & Machine Learning", "The core modeling and intelligence layer."),
  buildNode(
    "ai-1",
    "AI / ML",
    "Classical ML",
    "Foundational algorithms before Deep Learning.",
    ["Supervised (Trees, XGBoost, SVM)", "Unsupervised (K-means, PCA, DBSCAN)", "Ensemble Methods"]
  ),
  buildNode(
    "ai-2",
    "AI / ML",
    "ML Fundamentals",
    "Making sure models actually generalize.",
    ["Cross-Validation", "Bias/Variance Tradeoff", "Regularization (L1/L2)", "Loss Functions", "Evaluation Metrics (ROC-AUC, F1)"]
  ),
  buildNode(
    "ai-3",
    "AI / ML",
    "Deep Learning",
    "Neural networks for complex unstructured data.",
    ["Multi-Layer Perceptrons", "Backpropagation & Optimizers", "CNNs (Vision)", "RNNs & LSTMs (Time-series)"]
  ),
  buildNode(
    "ai-4",
    "AI / ML",
    "Transformers & LLMs 🔥",
    "The modern state-of-the-art in AI.",
    ["Self-Attention Mechanism", "Encoder/Decoder Architectures", "Fine-Tuning (LoRA, QLoRA)", "RLHF & DPO", "Quantization (GGUF, AWQ)"]
  ),
  buildNode(
    "ai-5",
    "AI / ML",
    "AI Engineering",
    "Building actual products with AI.",
    ["RAG Pipelines & Vector DBs", "Agent Workflows & Tool Use", "Prompt Engineering", "Model Serving & Inference", "LangChain/LlamaIndex"],
  ),

  // --- Finance ---
  buildNode("fin-root", "Finance", "Finance", "Corporate finance, markets, and quant foundations."),
  buildNode(
    "fin-1",
    "Finance",
    "Accounting",
    "The language of business.",
    ["Income Statements", "Balance Sheets", "Cash Flow Statements", "Financial Ratios"]
  ),
  buildNode(
    "fin-2",
    "Finance",
    "Corporate Finance",
    "How companies are valued and funded.",
    ["NPV, IRR, WACC", "Capital Structure", "DCF Valuation", "Multiples Valuation"]
  ),
  buildNode(
    "fin-3",
    "Finance",
    "Markets",
    "Where capital flows globally.",
    ["Equities & Bonds", "Derivatives (Options/Futures)", "Interest Rates & Yield Curves", "Monetary & Fiscal Policy"]
  ),
  buildNode(
    "fin-4",
    "Finance",
    "Quantitative Finance",
    "Applying math to market data.",
    ["Sharpe Ratio & Risk Metrics", "CAPM & Portfolio Theory", "Value at Risk (VaR)", "Monte Carlo Simulations", "Black-Scholes & Options Pricing"],
  ),

  // --- Integration / Projects ---
  buildNode("proj-root", "Projects", "Integration Projects", "Building full-stack systems where disciplines merge."),
  buildNode(
    "proj-1",
    "Projects",
    "Project 1: Portfolio Sys",
    "Finance + Statistics + Python",
    ["Ingest market data", "Calculate portfolio risk", "Optimize allocations"]
  ),
  buildNode(
    "proj-2",
    "Projects",
    "Project 2: Data Pipeline",
    "CS + Data Science",
    ["Extract from REST APIs", "Transform into Data Warehouse", "Serve Analytics"]
  ),
  buildNode(
    "proj-3",
    "Projects",
    "Project 3: Pricing Model",
    "Math + ML",
    ["Predict asset prices", "Understand the underlying calculus", "Evaluate model robustness"]
  ),
  buildNode(
    "proj-4",
    "Projects",
    "Project 4: LLM App",
    "AI + CS",
    ["Frontend UI", "Connect to LLM backend", "RAG with Vector DB", "Deploy to production"]
  ),
  buildNode(
    "proj-5",
    "Projects",
    "Project 5: Quant Agent 🔥",
    "AI + Finance + Statistics",
    ["Ingest earnings reports", "Run automated valuation", "Extract sentiment metrics", "Generate trading signals"],
  ),
];

export const initialEdges: Edge[] = [
  // Math connections
  buildEdge("math-root", "math-1"),
  buildEdge("math-1", "math-2"),
  buildEdge("math-2", "math-3"),
  buildEdge("math-1", "math-4"),
  buildEdge("math-2", "math-5"),
  buildEdge("math-3", "math-5"),

  // Stats connections
  buildEdge("stat-root", "stat-1"),
  buildEdge("stat-1", "stat-2"),
  buildEdge("stat-2", "stat-3"),
  buildEdge("stat-1", "stat-4"),

  // CS connections
  buildEdge("cs-root", "cs-1"),
  buildEdge("cs-1", "cs-2"),
  buildEdge("cs-1", "cs-3"),
  buildEdge("cs-3", "cs-4"),

  // DS connections
  buildEdge("ds-root", "ds-1"),
  buildEdge("ds-root", "ds-2"),
  buildEdge("ds-1", "ds-3"),
  buildEdge("ds-2", "ds-3"),

  // AI connections
  buildEdge("ai-root", "ai-1"),
  buildEdge("ai-1", "ai-2"),
  buildEdge("ai-2", "ai-3"),
  buildEdge("ai-3", "ai-4"),
  buildEdge("ai-4", "ai-5"),

  // Finance connections
  buildEdge("fin-root", "fin-1"),
  buildEdge("fin-1", "fin-2"),
  buildEdge("fin-root", "fin-3"),
  buildEdge("fin-2", "fin-4"),
  buildEdge("fin-3", "fin-4"),

  // Inter-domain dependencies (The Stack)
  buildEdge("math-root", "stat-root"),
  buildEdge("math-4", "cs-root"),
  buildEdge("stat-root", "ds-root"),
  buildEdge("cs-root", "ds-root"),
  buildEdge("ds-root", "ai-root"),
  buildEdge("math-3", "ai-root"),
  buildEdge("math-5", "ai-root"),
  buildEdge("ai-root", "fin-root"),
  buildEdge("stat-root", "fin-4"),

  // Projects
  buildEdge("fin-root", "proj-root"),
  buildEdge("ai-root", "proj-root"),
  
  buildEdge("proj-root", "proj-1"),
  buildEdge("proj-root", "proj-2"),
  buildEdge("proj-root", "proj-3"),
  buildEdge("proj-root", "proj-4"),
  buildEdge("proj-root", "proj-5"),
];
