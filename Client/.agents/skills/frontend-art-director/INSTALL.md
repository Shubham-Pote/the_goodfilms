# Installing Frontend Art Director in Codex

Unzip the package. Copy the entire `frontend-art-director` folder (containing `SKILL.md` and `references/`) to one of the following locations:

- **For a specific project (recommended):** `<project-root>/.agents/skills/frontend-art-director/`
- **For your user account (all projects):** `~/.agents/skills/frontend-art-director/` if supported by your Codex build, or use the user-level skills directory shown in your Codex documentation/settings.

Windows PowerShell example, run in your project root (after extracting the ZIP to Downloads):

```powershell
New-Item -ItemType Directory -Force .agents\skills | Out-Null
Copy-Item -Recurse "$HOME\Downloads\frontend-art-director" .agents\skills\
```

Restart or reopen the Codex session. Check that the skill appears in the available skill list (if your Codex interface shows one). Invoke it with a message such as:

```text
Use $frontend-art-director in Rescue mode. Inspect our existing frontend, establish a distinctive design direction, and redesign the weakest screens. Use our installed Taste Skill, GSAP, React Bits and shadcn where useful. Inspect actual browser screenshots, iterate on quality, and preserve all existing features. Make design decisions autonomously.
```

This skill **does not install or connect** Taste Skill, GSAP, React Bits, shadcn MCP or browser inspection by itself. Those must already be present, or Codex should work with available alternatives and disclose limitations.
