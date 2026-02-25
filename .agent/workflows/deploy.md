---
description: How to deploy the VAIN Hotel App to Vercel
---

# Deploy to Vercel

## Prerequisites
- Git author email must be `gkar2ar@gmail.com` (NOT `gkar2@gmail.com`)
- Vercel project: `vain-hotel-app` under team `jorgenekics`

## Steps

// turbo
1. Verify git email is correct:
```bash
git config user.email
```
If it shows `gkar2@gmail.com` or anything other than `gkar2ar@gmail.com`, fix it:
```bash
git config user.email "gkar2ar@gmail.com"
```

// turbo
2. Stage all changes:
```bash
git add -A
```

3. Commit with a descriptive message:
```bash
git commit -m "description of changes"
```

// turbo
4. Amend the commit to use the correct email (if email was wrong before committing):
```bash
git commit --amend --author="gkar2ar <gkar2ar@gmail.com>" --no-edit
```

5. Deploy to Vercel production:
```bash
npx vercel --prod --yes
```

## Troubleshooting

### "Git author must have access to the team" error
This means the git email is wrong. Fix it with:
```bash
git config user.email "gkar2ar@gmail.com"
git commit --amend --author="gkar2ar <gkar2ar@gmail.com>" --no-edit
npx vercel --prod --yes
```

### No git remote configured
If you need to push to GitHub:
```bash
git remote add origin https://github.com/jorgenekics/Vain-Hotel-Palermo.git
git push origin main
```
