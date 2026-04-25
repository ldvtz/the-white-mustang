@AGENTS.md

---

## Claude Code-Specific Notes

### Git workflow
- Use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, etc.
- Never commit directly to `main` — always use a feature branch.
- Propose a branch name before creating one.

### Before creating files
- Check `components/` for an existing component before creating a new one.
- Check `package.json` before installing a new npm package.
- Check `composables/` before writing new shared logic.

### Supabase types
- If `@/types/supabase.ts` is missing or stale, remind the user to regenerate:
  ```
  npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
  ```
