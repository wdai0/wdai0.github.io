---
layout: post
title: "pull requests"
---

## Pull Request Workflow with Merge

**Workflow Steps:**

1. **Create a Feature Branch**: Start from the latest `main` branch, create a new branch for your feature or bug fix.

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature-branch
   ```

2. **Make Changes**: Implement your feature or fix and commit your changes to this branch.

3. **Push Feature Branch**: Push your branch to the remote repository.

   ```bash
   git push origin feature-branch
   ```

4. **Create Pull Request**: On GitHub, create a new pull request from your feature branch to the `main` branch.

5. **Review and Discuss**: Team members review the changes, discuss, and possibly request modifications.

6. **Merge Pull Request**: Once approved, merge the pull request into `main` using GitHub's merge option. This creates a merge commit.

**Best Use Case for Merge:**

- **Collaborative Projects**: When maintaining a comprehensive history of changes and contributions is more important than having a linear commit history. The merge workflow preserves the context of changes, including how features were integrated over time.

## Pull Request Workflow with Rebase

**Workflow Steps:**

1. **Create a Feature Branch**: Just like with merging, you start by creating a new branch off of `main`.

2. **Make Changes**: Work on your feature or bug fix and commit these changes.

3. **Fetch Latest Changes**: Before integrating your changes, fetch the latest updates from `main`.

   ```bash
   git fetch origin
   ```

4. **Rebase onto Main**: Rebase your feature branch onto the latest `main` to create a linear history.

   ```bash
   git rebase origin/main
   ```

   Resolve any conflicts that arise during the rebase.

5. **Force Push (If Necessary)**: After a successful rebase, you may need to force push your branch if you've already pushed it before rebasing.

   ```bash
   git push origin feature-branch --force
   ```

6. **Create Pull Request**: Create a pull request for your rebased feature branch into `main`.

7. **Review and Discuss**: The review process is the same; team members may review and request changes.

8. **Merge Pull Request**: Once the pull request is approved, merge it into `main`. Given the rebase, this merge is often a fast-forward merge, meaning no merge commit is created.

**Best Use Case for Rebase:**

- **Individual Contributions or Feature-Specific Branches**: Ideal when working on individual contributions or when it's crucial to maintain a clean, linear history. Rebasing is best used in scenarios where a clear project narrative is preferred, and the branch is not shared with others, to avoid complications from rewriting history.
