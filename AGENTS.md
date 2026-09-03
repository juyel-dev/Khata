# Project Workflow & Deployment Target

## Deployment Target: Vercel via GitHub Sync
- The primary deployment environment is **Vercel** (connected to the user's GitHub repository).
- The user exports and synchronizes code from Google AI Studio directly to their GitHub repository via the AI Studio Settings menu ("Export to GitHub").
- GitHub automatically triggers the Vercel CI/CD pipeline to build and deploy (`next build`).

## Rules for Future Code Changes
1. **100% Vercel Production Ready**:
   - Every file change, package installation, and configuration MUST pass `next build` (`compile_applet`) with zero errors.
   - Do NOT rely on AI Studio preview-specific quirks, mock layers, or iframe-only workarounds.
   - Ensure clean standard Next.js 15 App Router architecture.
2. **Environment & Secrets**:
   - Any new environment variable must be optional or have safe fallbacks, and must be documented in `.env.example`.
   - Firebase configuration supports both `firebase-applet-config.json` (bundled default) and `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel.
3. **Lint & Build Verification**:
   - Always run `lint_applet` and `compile_applet` after any code edits to ensure the Vercel build succeeds without breaking the user's automated deployments.
