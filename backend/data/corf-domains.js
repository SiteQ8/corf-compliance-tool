// ─── CBK CORF v1.0 — Full Domain/Sub-domain Structure ──────────────────────
// Source: Central Bank of Kuwait, Cyber and Operational Resilience Framework, Dec 2025

const CYBER_DOMAINS = [
  {
    id: "CR1", name: "Governance, Risk & Compliance", icon: "⚖️",
    subdomains: [
      { id: "CR1.1", name: "Cyber Resilience Governance & Oversight", controls: 12 },
      { id: "CR1.2", name: "Cybersecurity Risk Management", controls: 18 },
      { id: "CR1.3", name: "Compliance", controls: 8 },
      { id: "CR1.4", name: "Independent Audit", controls: 9 },
      { id: "CR1.5", name: "Workforce Management", controls: 11 },
    ],
  },
  {
    id: "CR2", name: "Technology & Operations", icon: "🖥️",
    subdomains: [
      { id: "CR2.1",  name: "Security Architecture Design", controls: 15 },
      { id: "CR2.2",  name: "Asset Management", controls: 12 },
      { id: "CR2.3",  name: "Infrastructure & Network Security", controls: 28 },
      { id: "CR2.4",  name: "Endpoint & Device Security", controls: 18 },
      { id: "CR2.5",  name: "Email Security", controls: 9 },
      { id: "CR2.6",  name: "Identity & Access Management", controls: 22 },
      { id: "CR2.7",  name: "Cryptography", controls: 10 },
      { id: "CR2.8",  name: "Application Security & Secure SDLC", controls: 21 },
      { id: "CR2.9",  name: "Change & Release Management", controls: 11 },
      { id: "CR2.10", name: "Capacity Management", controls: 7 },
      { id: "CR2.11", name: "Data Protection & Privacy", controls: 19 },
      { id: "CR2.12", name: "Logging, Monitoring & Security Incident Management", controls: 24 },
      { id: "CR2.13", name: "Cybersecurity Testing & Threat Management", controls: 16 },
      { id: "CR2.14", name: "Physical & Environmental Security", controls: 13 },
      { id: "CR2.15", name: "Cyber Threat Intelligence", controls: 11 },
      { id: "CR2.16", name: "Digital Risk Protection", controls: 8 },
    ],
  },
  {
    id: "CR3", name: "Third-Party Risk & Supply Chain", icon: "🔗",
    subdomains: [
      { id: "CR3.1", name: "Third-Party Risk Management (TPRM)", controls: 18 },
      { id: "CR3.2", name: "Supply Chain Management", controls: 12 },
    ],
  },
  {
    id: "CR4", name: "Emerging Technologies", icon: "🤖",
    subdomains: [
      { id: "CR4.1", name: "Advanced Technologies Security (AI/ML/Blockchain/Quantum)", controls: 14 },
      { id: "CR4.2", name: "Cloud Security", controls: 21 },
    ],
  },
  {
    id: "CR5", name: "Payments Security", icon: "💳",
    subdomains: [
      { id: "CR5.1", name: "Common Security Controls for Electronic Payment Systems", controls: 19 },
      { id: "CR5.2", name: "Electronic Payment Transactions Monitoring", controls: 11 },
      { id: "CR5.3", name: "Digital Banking Security", controls: 17 },
      { id: "CR5.4", name: "Payment Card Data Security", controls: 13 },
      { id: "CR5.5", name: "Security of Customer Self-Service Machines", controls: 9 },
      { id: "CR5.6", name: "Contactless Payment Technology Security", controls: 7 },
    ],
  },
  {
    id: "CR6", name: "Operational Resilience", icon: "🔄",
    subdomains: [
      { id: "CR6.1", name: "Business Continuity & Disaster Recovery (BC & DR)", controls: 22 },
      { id: "CR6.2", name: "Cyber Crisis Management", controls: 16 },
    ],
  },
];

const OR_DOMAINS = [
  {
    id: "OR1", name: "Governance & Oversight", icon: "🏛️",
    subdomains: [
      { id: "OR1.1", name: "OR Governance Structure & Oversight", controls: 9 },
      { id: "OR1.2", name: "OR Policy & Strategy", controls: 11 },
      { id: "OR1.3", name: "Compliance", controls: 7 },
    ],
  },
  {
    id: "OR2", name: "Risk & Threat Management", icon: "⚠️",
    subdomains: [
      { id: "OR2.1", name: "Risk Assessment Methodology", controls: 8 },
      { id: "OR2.2", name: "Risk Assessment Process", controls: 12 },
      { id: "OR2.3", name: "Risk Treatment & Reporting", controls: 9 },
    ],
  },
  {
    id: "OR3", name: "Business Continuity Management", icon: "📋",
    subdomains: [
      { id: "OR3.1", name: "Business Impact Analysis (BIA)", controls: 11 },
      { id: "OR3.2", name: "Recovery Strategies", controls: 9 },
      { id: "OR3.3", name: "Business Continuity Plans (BCP)", controls: 14 },
    ],
  },
  {
    id: "OR4", name: "Technology Resilience", icon: "💻",
    subdomains: [
      { id: "OR4.1", name: "Service Management", controls: 8 },
      { id: "OR4.2", name: "Backup & Recovery Management", controls: 11 },
      { id: "OR4.3", name: "Technology & Resilience Capabilities", controls: 9 },
      { id: "OR4.4", name: "Technology Recovery Plans", controls: 7 },
      { id: "OR4.5", name: "Cyber Recovery Plans", controls: 9 },
    ],
  },
  {
    id: "OR5", name: "Third-Party Resilience", icon: "🔗",
    subdomains: [
      { id: "OR5.1", name: "Third-Party Resilience", controls: 0, linked: true, linkRef: "TPRM Domain 5" },
    ],
  },
  {
    id: "OR6", name: "Incident & Crisis Management", icon: "🚨",
    subdomains: [
      { id: "OR6.1", name: "Incident & Crisis Management Governance & Planning", controls: 13 },
      { id: "OR6.2", name: "Communication & Escalation", controls: 9 },
    ],
  },
  {
    id: "OR7", name: "Cyber Resilience", icon: "🛡️",
    subdomains: [
      { id: "OR7.1", name: "Cyber Resilience", controls: 0, linked: true, linkRef: "CR Baselines Domain 6" },
    ],
  },
  {
    id: "OR8", name: "Testing, Training & Continuous Improvement", icon: "🎯",
    subdomains: [
      { id: "OR8.1", name: "Training, Testing & Exercising", controls: 14 },
    ],
  },
];

const TPRM_DOMAINS = [
  {
    id: "TP1", name: "Governance Structure & Oversight", icon: "🏗️",
    subdomains: [
      { id: "TP1.1", name: "TPRM Policy & Strategy", controls: 8 },
      { id: "TP1.2", name: "Roles & Responsibilities", controls: 7 },
      { id: "TP1.3", name: "Board & Senior Management Oversight", controls: 6 },
      { id: "TP1.4", name: "Approvals & Periodic Review", controls: 5 },
    ],
  },
  {
    id: "TP2", name: "Risk Management Framework", icon: "📊",
    subdomains: [
      { id: "TP2.1", name: "Critical Third-Party Service Identification", controls: 7 },
      { id: "TP2.2", name: "Risk Identification & Assessment Methodology", controls: 9 },
      { id: "TP2.3", name: "Dependency Mapping to Critical Processes", controls: 6 },
    ],
  },
  {
    id: "TP3", name: "Contractual Agreements Considerations", icon: "📝",
    subdomains: [
      { id: "TP3.1", name: "Contractual Safeguards", controls: 8 },
      { id: "TP3.2", name: "Legal Binding Agreement", controls: 6 },
      { id: "TP3.3", name: "Regular Monitoring & Assessment", controls: 5 },
      { id: "TP3.4", name: "Health Safety & Environment", controls: 4 },
      { id: "TP3.5", name: "Financial Viability", controls: 5 },
      { id: "TP3.6", name: "Compliance (Geopolitics/Regulatory/Legal)", controls: 7 },
      { id: "TP3.7", name: "Corporate Governance", controls: 5 },
    ],
  },
  {
    id: "TP4", name: "Risk Assessment & Monitoring", icon: "🔍",
    subdomains: [
      { id: "TP4.1", name: "Identification, Assessment & Mitigation", controls: 9 },
      { id: "TP4.2", name: "Risk Classification", controls: 6 },
      { id: "TP4.3", name: "Ongoing Monitoring of Critical Third Parties", controls: 7 },
    ],
  },
  {
    id: "TP5", name: "Business Continuity Management & Disaster Recovery", icon: "🔄",
    subdomains: [
      { id: "TP5.1", name: "Business Continuity Plans", controls: 8 },
      { id: "TP5.2", name: "Data Backup & Replication", controls: 6 },
      { id: "TP5.3", name: "Periodic Testing of DR Capabilities", controls: 5 },
      { id: "TP5.4", name: "Recovery & Restoration Procedures", controls: 6 },
      { id: "TP5.5", name: "Business Continuity Management & Recovery", controls: 5 },
    ],
  },
  {
    id: "TP6", name: "Incident Management", icon: "🚨",
    subdomains: [
      { id: "TP6.1", name: "Incident Detection & Monitoring", controls: 7 },
      { id: "TP6.2", name: "Incident Communication & Escalation Protocols", controls: 6 },
      { id: "TP6.3", name: "Root Cause Analysis", controls: 5 },
    ],
  },
  {
    id: "TP7", name: "Data Protection & Confidentiality", icon: "🔒",
    subdomains: [
      { id: "TP7.1", name: "Data Encryption & Masking", controls: 7 },
      { id: "TP7.2", name: "Data Retention & Disposal", controls: 5 },
      { id: "TP7.3", name: "Data Classification & Handling Policies", controls: 6 },
    ],
  },
  {
    id: "TP8", name: "Sub-Contracting", icon: "👥",
    subdomains: [
      { id: "TP8.1", name: "Disclosure of Sub-contractor & Approval from Regulated Entities", controls: 6 },
      { id: "TP8.2", name: "Monitoring & Oversight", controls: 5 },
    ],
  },
  {
    id: "TP9", name: "Exit Strategy", icon: "🚪",
    subdomains: [
      { id: "TP9.1", name: "Exit Strategy Planning", controls: 8 },
    ],
  },
  {
    id: "TP10", name: "Storage of Data", icon: "💾",
    subdomains: [
      { id: "TP10.1", name: "Data Storage Security", controls: 6 },
      { id: "TP10.2", name: "Storage Lifecycle Management", controls: 5 },
      { id: "TP10.3", name: "Data Integrity & Availability", controls: 5 },
    ],
  },
  {
    id: "TP11", name: "Cross-Border Transaction", icon: "🌐",
    subdomains: [
      { id: "TP11.1", name: "Regulatory & Legal Compliance", controls: 6 },
      { id: "TP11.2", name: "Due Diligence & KYC/AML", controls: 7 },
      { id: "TP11.3", name: "Secure Data Transfers & Privacy", controls: 5 },
      { id: "TP11.4", name: "Monitoring, Reporting & Audit", controls: 6 },
    ],
  },
  {
    id: "TP12", name: "Usage of Cloud Services", icon: "☁️",
    subdomains: [
      { id: "TP12.1", name: "Cloud Security", controls: 9 },
    ],
  },
  {
    id: "TP13", name: "Inter-Affiliates", icon: "🏢",
    subdomains: [
      { id: "TP13.1", name: "Due Diligence & Periodic Review", controls: 6 },
      { id: "TP13.2", name: "Customer Consent", controls: 4 },
      { id: "TP13.3", name: "Foreign Affiliates", controls: 5 },
      { id: "TP13.4", name: "Resource Planning", controls: 4 },
    ],
  },
];

const MATURITY_LEVELS = [
  { level: 0, label: "Not Assessed", color: "#4a5568" },
  { level: 1, label: "Initial",      color: "#ef4444", description: "Reactive and unstructured. No formal documentation or consistent implementation." },
  { level: 2, label: "Ad-hoc",       color: "#f97316", description: "Basic, fragmented, inconsistent practices. Significant gaps remain." },
  { level: 3, label: "Baseline",     color: "#eab308", description: "Risk-based, documented, regularly maintained. Structured and compliant." },
  { level: 4, label: "Advanced",     color: "#22c55e", description: "Proactive integration with business goals, automation, continuous improvement." },
  { level: 5, label: "Innovative",   color: "#3b82f6", description: "AI-driven, anticipatory, real-time capabilities. Contributes to sector-wide innovation." },
];

const TIERING_DIMENSIONS = [
  { id: "totalAssets",     label: "Total Assets (KWD M)",       type: "number",  dimension: "Financial Scale" },
  { id: "marketShare",     label: "Market Share (%)",            type: "number",  dimension: "Market Share" },
  { id: "branches",        label: "Number of Branches/Channels", type: "number",  dimension: "Branch Network" },
  { id: "customers",       label: "Customer Base (thousands)",   type: "number",  dimension: "Customer Base" },
  { id: "servicesBreadth", label: "Breadth of Services",         type: "select",  dimension: "Services",
    options: ["retail", "retail_corporate", "retail_corporate_investment", "full_service"] },
  { id: "isFMI",           label: "Designated FMI Operator",     type: "boolean", dimension: "Infrastructure Role" },
  { id: "cloudAdoption",   label: "Cloud Adoption Level",        type: "select",  dimension: "Tech Complexity",
    options: ["none", "low", "medium", "high"] },
  { id: "aiMlUsage",       label: "AI/ML Usage",                 type: "select",  dimension: "Tech Complexity",
    options: ["none", "limited", "moderate", "extensive"] },
  { id: "thirdPartyDeps",  label: "Third-Party Dependencies",    type: "select",  dimension: "Outsourcing",
    options: ["low", "medium", "high"] },
  { id: "cyberHistory",    label: "Regulatory/Audit History",    type: "select",  dimension: "Supervisory History",
    options: ["clean", "minor_findings", "material_findings", "incidents"] },
  { id: "cyberWorkforce",  label: "Dedicated Cyber FTEs",        type: "number",  dimension: "Cyber Workforce" },
];

module.exports = { CYBER_DOMAINS, OR_DOMAINS, TPRM_DOMAINS, MATURITY_LEVELS, TIERING_DIMENSIONS };
