# PasteTrap

PasteTrap is a small JavaScript cybersecurity awareness project.

## Goal

Teach users not to blindly copy and paste commands or other untrusted text.

## Safety

This project is intentionally harmless:

- No real password is collected.
- No real cookie/token is accessed.
- No real data is sent to a server.
- No pasted command is executed.
- The attacker panel is only a visual simulation.
- The "malicious payload" is a fake marker used by the demo.

## Run

You can simply open `index.html` in a browser.

For clipboard access, browsers may require a secure context. The easiest option is:

```bash
python -m http.server 5500
```

Then open:

http://localhost:5500

## Demo

1. Click **Copy This Text**.
2. Paste into **Paste Analyzer**.
3. The analyzer detects the fake PasteTrap marker.
4. Run the safe simulation.
5. Explain that the project models the *idea* of an unsafe paste without performing actual exfiltration.
