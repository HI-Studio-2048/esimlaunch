# Git Workflow Guide - Dual Repository Setup

## 📋 Repository Structure

This project uses **two separate Git repositories**:

1. **Monorepo (esimlaunch)**: Contains backend, frontend, and all documentation
   - Repository: `https://github.com/EzzaWan/esimlaunch.git`
   - Location: `C:\Users\Ezza\esimlaunch\`
   - Contains: `backend/`, `esim-connect-hub/`, `esimaccess docs/`, documentation files

2. **Frontend-only (esim-connect-hub)**: Contains only the React frontend (for Lovable)
   - Repository: `https://github.com/ezzacheapesims/esim-connect-hub.git`
   - Location: `C:\Users\Ezza\esimlaunch\esim-connect-hub\`
   - Contains: React/Vite frontend application only

## 🔄 How to Push Commits

### Option 1: Push to Monorepo (Recommended for most changes)

Use this when:
- Making changes to backend
- Making changes to frontend AND backend
- Adding/updating documentation
- Adding eSIM Access docs
- Making changes that affect both parts of the project

**Steps:**
```powershell
# Navigate to monorepo root
cd C:\Users\Ezza\esimlaunch

# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your descriptive commit message"

# Push to monorepo
git push origin main
```

**Example:**
```powershell
cd C:\Users\Ezza\esimlaunch
git add .
git commit -m "Add new API endpoint for package management"
git push origin main
```

---

### Option 2: Push to Frontend-Only Repository (For Lovable)

Use this when:
- Making **only** frontend changes
- Working through Lovable platform
- Need to sync frontend changes to Lovable's repository

**Steps:**
```powershell
# Navigate to frontend directory
cd C:\Users\Ezza\esimlaunch\esim-connect-hub

# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your descriptive commit message"

# Push to frontend-only repo
git push origin main
```

**Example:**
```powershell
cd C:\Users\Ezza\esimlaunch\esim-connect-hub
git add .
git commit -m "Update Dashboard UI with new components"
git push origin main
```

---

### Option 3: Push to Both Repositories

Use this when you want to keep both repositories in sync after making frontend changes.

**Steps:**
```powershell
# 1. First, push to frontend-only repo
cd C:\Users\Ezza\esimlaunch\esim-connect-hub
git add .
git commit -m "Your descriptive commit message"
git push origin main

# 2. Then, push to monorepo
cd C:\Users\Ezza\esimlaunch
git add .
git commit -m "Your descriptive commit message"
git push origin main
```

---

## ⚠️ Important Notes

### Nested Git Repository
- The `esim-connect-hub` folder has its own `.git` directory (nested repository)
- The monorepo's `.gitignore` excludes `esim-connect-hub/.git/` to prevent tracking it
- This allows both repositories to coexist without conflicts

### When to Use Which Repository

| Change Type | Push To | Why |
|------------|---------|-----|
| Backend code changes | Monorepo only | Backend only exists in monorepo |
| Frontend code changes | Both (or frontend-only) | Frontend exists in both repos |
| Documentation updates | Monorepo only | Docs only in monorepo |
| eSIM Access docs | Monorepo only | Docs only in monorepo |
| Both backend + frontend | Monorepo only | Complete project update |

### Checking Current Status

**Check monorepo status:**
```powershell
cd C:\Users\Ezza\esimlaunch
git status
```

**Check frontend-only repo status:**
```powershell
cd C:\Users\Ezza\esimlaunch\esim-connect-hub
git status
```

### Viewing Commit History

**Monorepo commits:**
```powershell
cd C:\Users\Ezza\esimlaunch
git log --oneline -10
```

**Frontend-only repo commits:**
```powershell
cd C:\Users\Ezza\esimlaunch\esim-connect-hub
git log --oneline -10
```

---

## 🔍 Quick Reference Commands

### Monorepo Commands
```powershell
# Navigate
cd C:\Users\Ezza\esimlaunch

# Status
git status

# Add all
git add .

# Commit
git commit -m "Message"

# Push
git push origin main

# Pull latest
git pull origin main
```

### Frontend-Only Repo Commands
```powershell
# Navigate
cd C:\Users\Ezza\esimlaunch\esim-connect-hub

# Status
git status

# Add all
git add .

# Commit
git commit -m "Message"

# Push
git push origin main

# Pull latest
git pull origin main
```

---

## 🚨 Troubleshooting

### Issue: "Updates were rejected because the remote contains work that you do not have locally"

**Solution:**
```powershell
# Pull first, then push
git pull origin main --allow-unrelated-histories
# Resolve any conflicts, then:
git push origin main
```

### Issue: Merge conflicts when pulling

**Solution:**
```powershell
# If you want to keep your local version:
git checkout --ours .
git add .
git commit -m "Resolve conflicts: keep local version"
git push origin main

# If you want to keep remote version:
git checkout --theirs .
git add .
git commit -m "Resolve conflicts: keep remote version"
git push origin main
```

### Issue: Accidentally committed to wrong repository

**Solution:**
```powershell
# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Navigate to correct repository and commit there
cd C:\Users\Ezza\esimlaunch  # or esim-connect-hub
git add .
git commit -m "Your message"
git push origin main
```

---

## 📝 Best Practices

1. **Always check `git status`** before committing to ensure you're in the right repository
2. **Use descriptive commit messages** that explain what changed
3. **Push to monorepo** for most changes (it's the source of truth)
4. **Push to frontend-only repo** when working specifically with Lovable
5. **Keep both repos in sync** if you're actively using both platforms

---

## 🔗 Repository URLs

- **Monorepo**: https://github.com/EzzaWan/esimlaunch
- **Frontend-only**: https://github.com/ezzacheapesims/esim-connect-hub

---

## 📌 Quick Decision Tree

```
Making changes?
│
├─ Backend changes only?
│  └─> Push to MONOREPO only
│
├─ Frontend changes only?
│  ├─> Working with Lovable?
│  │   └─> Push to FRONTEND-ONLY repo
│  │
│  └─> Not using Lovable?
│      └─> Push to MONOREPO only
│
├─ Both backend + frontend?
│  └─> Push to MONOREPO only
│
└─ Documentation changes?
   └─> Push to MONOREPO only
```

---

*Last updated: 2026-02-04*







