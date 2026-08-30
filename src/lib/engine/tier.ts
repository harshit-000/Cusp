import type { Tier } from "@/config/schema";

/**
 * Best-effort tier classification for an employer name (used for discovery jobs
 * whose company isn't in the config). Heuristic + India-focused; the important
 * job is catching service/staffing firms so they can be filtered out.
 */

const PRODUCT_MNC = [
  "google", "microsoft", "amazon", "aws", "meta", "facebook", "apple", "adobe",
  "atlassian", "uber", "stripe", "salesforce", "oracle", "nvidia", "mastercard",
  "visa", "paypal", "walmart", "mongodb", "databricks", "servicenow", "vmware",
  "cisco", "intuit", "expedia", "booking", "linkedin", "netflix", "sap", "dell",
  "intel", "qualcomm", "samsung", "goldman", "jpmorgan", "deutsche bank", "uber",
];

const BIG_STARTUP = [
  "razorpay", "swiggy", "zomato", "cred", "groww", "phonepe", "meesho", "zerodha",
  "postman", "freshworks", "zepto", "sharechat", "dream11", "unacademy", "byju",
  "ola", "flipkart", "paytm", "navi", "browserstack", "hasura", "chargebee",
  "innovaccer", "notion", "ramp", "linear", "hackerrank", "zeta", "angelone",
  "cars24", "urban company", "physicswallah", "rapido", "pine labs", "juspay",
  "spinny", "upstox", "slice", "khatabook", "mamaearth", "dunzo",
];

const SERVICE = [
  "tcs", "tata consultancy", "infosys", "wipro", "accenture", "cognizant",
  "capgemini", "tech mahindra", "hcl", "ibm", "deloitte", "ernst", "kpmg", "pwc",
  "mindtree", "ltimindtree", "mphasis", "hexaware", "persistent", "birlasoft",
  "dxc", "genpact", "wns", "concentrix", "nagarro", "zensar", "coforge", "cybage",
  "virtusa", "sonata", "happiest minds", "randstad", "adecco", "teamlease",
  "quess", "consultancy", "consulting", "staffing", "recruit", "manpower",
  "solutions private", "technologies private", "infotech", "systems private",
];

export function classifyEmployer(name: string): Tier {
  const n = name.toLowerCase();
  if (SERVICE.some((k) => n.includes(k))) return "service";
  if (PRODUCT_MNC.some((k) => n.includes(k))) return "product_mnc";
  if (BIG_STARTUP.some((k) => n.includes(k))) return "big_startup";
  return "small_startup";
}
