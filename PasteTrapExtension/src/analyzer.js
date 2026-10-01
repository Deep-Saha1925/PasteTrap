// PasteTrap analyzer: decides whether a piece of text looks like a command an
// attacker wants you to paste into a terminal / Run dialog (ClickFix style).
// Pure functions, no DOM access, so it can be unit-tested in Node.
(function (root) {
  "use strict";

  // weight = how strongly the pattern suggests malicious intent.
  const RULES = [
    { id: "ps-encoded", weight: 50, re: /powershell[^\n]*\s-(e|enc|encodedcommand)\b/i,
      why: "PowerShell running an encoded (hidden) command." },
    { id: "ps-hidden", weight: 35, re: /powershell[^\n]*-(w|windowstyle)\s+hidden/i,
      why: "PowerShell launched with a hidden window." },
    { id: "ps-download-exec", weight: 55, re: /\b(iex|invoke-expression)\b|downloadstring|downloadfile|\b(iwr|irm|invoke-webrequest|invoke-restmethod)\b/i,
      why: "Downloads and/or executes code from the internet via PowerShell." },
    { id: "mshta", weight: 55, re: /\bmshta(\.exe)?\b[^\n]*(https?:|javascript:|vbscript:)/i,
      why: "mshta can run remote scripts; a favourite malware launcher." },
    { id: "lolbin-download", weight: 50, re: /\b(certutil[^\n]*-urlcache|bitsadmin[^\n]*\/transfer|regsvr32[^\n]*\/i:\s*https?:|rundll32[^\n]*javascript:)/i,
      why: "Windows built-in tool abused to fetch or run remote code." },
    { id: "cmd-chain", weight: 25, re: /\bcmd(\.exe)?\s+\/[ck]\b/i,
      why: "Runs a command through cmd.exe." },
    { id: "pipe-to-shell", weight: 55, re: /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i,
      why: "Downloads a script and pipes it straight into a shell." },
    { id: "b64-to-shell", weight: 55, re: /base64\s+(-d|--decode)[^\n]*\|\s*(ba|z)?sh\b|echo\s+[A-Za-z0-9+/=]{40,}\s*\|\s*base64/i,
      why: "Decodes hidden base64 content and runs it." },
    { id: "osascript", weight: 40, re: /\bosascript\s+-e\b|\bcurl\b[^\n]*-o\s+\S+[^\n]*&&\s*chmod\s+\+x/i,
      why: "macOS script / download-and-execute chain." },
    { id: "run-dialog-lure", weight: 40,
      re: /(win(dows)?\s*(key)?\s*\+\s*r\b|press\s+(the\s+)?windows\s+key)|(open\s+(the\s+)?(run|terminal|powershell))/i,
      why: "Text instructs you to open Run/Terminal and paste something." },
    { id: "fake-captcha", weight: 30,
      re: /(i['’]?m not a robot|verify (that )?you are (a )?human|captcha)[\s\S]{0,300}(ctrl\s*\+\s*v|paste)/i,
      why: "Fake CAPTCHA / verification text asking you to paste a command." },
    { id: "remote-url-exec", weight: 20, re: /https?:\/\/[^\s'"]+\.(ps1|bat|vbs|hta|sh|exe|msi)\b/i,
      why: "References a remote script/executable file." }
  ];

  function normalize(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  function riskFor(score) {
    return score >= 50 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  }

  function analyze(text) {
    text = String(text || "");
    const reasons = [];
    let score = 0;
    for (const rule of RULES) {
      if (rule.re.test(text)) { score += rule.weight; reasons.push(rule.why); }
    }
    // Multi-line payloads execute immediately when pasted in many terminals.
    if (reasons.length && /\n/.test(text.trim())) {
      score += 10;
      reasons.push("Multi-line content: terminals may execute it the moment you paste.");
    }
    // Command followed by a long run of padding / comment to hide it from view.
    if (reasons.length && /(\s{40,}|#\s*[^\n]{0,80}(human|robot|verif|captcha))/i.test(text)) {
      score += 15;
      reasons.push("Padding or fake comment appended to disguise the command.");
    }
    score = Math.min(score, 100);
    return { score, risk: riskFor(score), reasons };
  }

  const api = { analyze, normalize, riskFor, RULES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PasteTrapAnalyzer = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
