const AI_PROVIDER = process.env.AI_PROVIDER || "heuristic";
const HAS_AI_CREDENTIALS = Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);

const BUG_RULES = [
  { title: "Potential code injection vulnerability", description: "The source uses eval(), which can execute dynamically constructed JavaScript.", severity: "Critical", check: content => findMatch(content, /\beval\s*\(/), explanation: "eval() dynamically executes JavaScript and can introduce code injection vulnerabilities when its input is influenced by untrusted data.", fixHint: "Avoid eval() and replace it with an explicit, safe implementation.", confidence: 95 },
  { title: "Potential unsafe HTML injection", description: "Direct assignment to innerHTML with potentially dynamic content was detected.", severity: "High", check: findDynamicInnerHTML, explanation: "Direct HTML insertion can introduce cross-site scripting vulnerabilities when untrusted or dynamic data is inserted into the page.", fixHint: "Prefer textContent for plain text, or sanitize/validate trusted HTML before inserting it.", confidence: 85 },
  { title: "Potential SQL injection vulnerability", description: "SQL query constructed with string interpolation or concatenation involving user input was detected.", severity: "Critical", check: content => findMatch(content, /(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)[^\n;]*(?:\$\{|\+\s*[^,;]*(?:req\.|request\.|user\.)[^,;]*)/i), explanation: "SQL queries built with user-controlled input via string interpolation or concatenation are vulnerable to SQL injection attacks.", fixHint: "Use parameterized queries or prepared statements to safely handle user input.", confidence: 90 },
  { title: "Potential hardcoded credentials", description: "A hardcoded API key, password, or security token appears to be present in the source code.", severity: "Critical", check: content => findMatch(content, /(?:api[_-]?key|password|secret|token|auth|credential)\s*[:=]\s*["'][\w\-.]{8,}["']/i), explanation: "Hardcoded secrets in source code are exposed to anyone with access to the repository and should be stored securely in environment variables or secret management systems.", fixHint: "Move secrets to environment variables or use a secure secrets management system. Remove from source code.", confidence: 92 },
  { title: "Unsafe child_process execution", description: "child_process execution with potentially user-controlled input was detected.", severity: "High", check: content => findMatch(content, /\b(?:exec|execSync|spawn)\s*\([^\n;]*(?:\$\{|\+\s*[^,;]*(?:req\.|request\.|user\.))/i), explanation: "Executing system commands with user-controlled input can lead to command injection attacks.", fixHint: "Avoid dynamic command construction. Use safe parameter passing mechanisms.", confidence: 88 },
  { title: "Potential unsafe path traversal", description: "File system operations with user-controlled paths without proper validation were detected.", severity: "High", check: content => findMatch(content, /(?:fs\.)?(?:readFileSync|readFile|writeFileSync|writeFile)\s*\([^\n;]*(?:req\.|request\.|user\.)/i), explanation: "File operations using unsanitized user input can lead to path traversal attacks where an attacker accesses files outside the intended directory.", fixHint: "Validate and sanitize all user-provided file paths. Use path normalization and restrict access to a safe directory.", confidence: 82 },
  { title: "Unsafe JSON parsing from user input", description: "JSON.parse() is called on user-controlled input without validation.", severity: "Medium", check: content => findMatch(content, /JSON\.parse\s*\([^\n;]*(?:req\.|request\.|user\.)/i), explanation: "Parsing untrusted JSON can lead to prototype pollution attacks or unexpected behavior if validation is insufficient.", fixHint: "Validate and sanitize user input before parsing. Use schema validation libraries.", confidence: 70 },
  { title: "Weak cryptographic randomness", description: "A weak random function (Math.random()) is used for security-sensitive operations.", severity: "Medium", check: content => findMatch(content, /(?:token|secret|key|password|session|nonce)\s*[^=;]*=\s*[^;]*Math\.random\s*\(\s*\)|Math\.random\s*\(\s*\)\s*\.toString\s*\(\s*36\s*\)/i), explanation: "Math.random() is not cryptographically secure and should not be used for security-sensitive values like tokens or session IDs.", fixHint: "Use a cryptographically secure random generator for security-sensitive values.", confidence: 75 }
];

export const analyzeCodeFile = (fileName, content) => {
  if (typeof fileName !== "string" || typeof content !== "string" || !content.trim()) return [];
  const lines = content.split(/\r?\n/);
  const results = [];
  const seen = new Set();
  for (const rule of BUG_RULES) {
    try {
      const match = rule.check(content);
      if (!match || seen.has(rule.title)) continue;
      const lineNumber = match.lineNumber || 1;
      const oldCode = lines[lineNumber - 1]?.trim() || match.text.trim();
      results.push({ file_name: fileName, line_number: lineNumber, bug_title: rule.title, bug_description: rule.description, severity: rule.severity, suggested_fix: rule.fixHint, ai_response: rule.explanation, old_code: oldCode, new_code: null, generated_patch: null, ai_explanation: null, confidence: rule.confidence, fix_status: "Open", status: "Open", source_code_snippet: getSnippet(lines, lineNumber) });
      seen.add(rule.title);
    } catch (error) {
      console.error(`Rule check error for ${rule.title}:`, error.message);
    }
  }
  return results;
};

export const buildAIRepair = (bugTitle, fileName, content, snippet) => {
  const oldCode = (snippet || "").trim();
  const title = (bugTitle || "").toLowerCase();
  let newCode = "";
  let explanation = "No safe automatic fix was generated for this issue.";
  let confidence = 0;
  let canApply = false;
  if (title.includes("unsafe html") && /\.innerHTML\s*=\s*[^;]+/i.test(oldCode)) {
    newCode = oldCode.replace(/\.innerHTML\s*=/i, ".textContent =");
    explanation = "Replaced innerHTML with textContent because the affected assignment is a plain text assignment.";
    confidence = 85;
    canApply = true;
  } else if (title.includes("weak cryptographic") && /Math\.random\s*\(\s*\)/.test(oldCode) && /\.toString\s*\(\s*36\s*\)/.test(oldCode)) {
    newCode = oldCode.replace(/Math\.random\s*\(\s*\)\s*\.toString\s*\(\s*36\s*\)/, "crypto.randomBytes(16).toString(\"hex\")");
    explanation = "Replaced weak random token generation with cryptographically secure random bytes.";
    confidence = 80;
    canApply = true;
  } else if (AI_PROVIDER !== "heuristic" && HAS_AI_CREDENTIALS) {
    explanation = "The configured AI provider did not return a verified safe source replacement.";
  }
  if (!newCode || normalizeCode(oldCode) === normalizeCode(newCode)) {
    newCode = null;
    canApply = false;
    confidence = 0;
  }
  return { oldCode, newCode, explanation, confidence, generatedPatch: canApply ? createPatch(fileName, oldCode, newCode) : null, canApply };
};

const findMatch = (content, pattern) => {
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    pattern.lastIndex = 0;
    if (pattern.test(lines[index])) return { lineNumber: index + 1, text: lines[index] };
  }
  return null;
};

function findDynamicInnerHTML(content) {
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/\.innerHTML\s*=\s*([^;]+)/i);
    if (match && isLikelyDynamicContent(match[1])) return { lineNumber: index + 1, text: lines[index] };
  }
  return null;
}

const isLikelyDynamicContent = value => /\$\{|\+\s*[a-zA-Z_]\w*|\b(?:req|request|user|input|data|value)\b|\.concat\(|interpolate|format|sprintf/i.test((value || "").trim());
const normalizeCode = code => (code || "").replace(/\s+/g, " ").trim();
const getSnippet = (lines, lineNumber) => lines.slice(Math.max(0, lineNumber - 2), Math.min(lines.length, lineNumber + 1)).join("\n").trim() || lines[0] || "";
const createPatch = (fileName, oldCode, newCode) => [`--- ${fileName}`, `+++ ${fileName}`, "", "BEFORE:", oldCode, "", "AFTER:", newCode].join("\n");
