# DevOps demo: Terraform + GitHub Actions + AWS

A small, real CI/CD pipeline that shows what a DevOps engineer does day to day.
A copy of Cameron's portfolio site in `site/` is deployed to **S3 + CloudFront** by Terraform,
and GitHub Actions runs the Terraform on every pull request and merge.

This is a standalone demo repo. The real portfolio (a different repo, hosted on Amplify) is not connected to it.

```
 laptop                GitHub                                   AWS
 ──────                ──────                                   ───
 edit HTML or .tf
 git push branch ──►   Pull request
                       └► Actions "Plan": fmt / validate / plan ──► reads state (OIDC role)
                          └► bot comments the plan on the PR
                       Review + merge to main
                       └► Actions "Plan" again, then "Apply"
                          (waits for approval on "production") ──► S3 + CloudFront updated
                                                                    └► https://xxxx.cloudfront.net
```

| Folder / file | What it is | Who runs it |
|---|---|---|
| `infra/bootstrap/` | State bucket, GitHub OIDC provider, IAM role for the pipeline | You, once, from your laptop |
| `infra/site/` | Private S3 bucket, CloudFront CDN, every site file as an S3 object | The pipeline |
| `.github/workflows/terraform.yml` | The pipeline | GitHub Actions |
| `.github/workflows/site-checks.yml` | HTML and broken-link checks on every PR | GitHub Actions |

**Expected cost:** a few cents per month or less (S3 storage of a few MB plus light CloudFront traffic, mostly covered by the free tier).
No NAT gateways, load balancers, or databases.

---

## One-time setup

### 1. Bootstrap AWS (from your laptop)

```bash
cd infra/bootstrap
terraform init
terraform apply
```

If it fails with `EntityAlreadyExists ... oidc-provider`, your account already has the GitHub OIDC provider. Re-run with:

```bash
terraform apply -var="create_oidc_provider=false"
```

Note the two outputs, `AWS_ROLE_ARN` and `TF_STATE_BUCKET`.
The bootstrap state stays on your laptop (`infra/bootstrap/terraform.tfstate`, gitignored). Keep it for the teardown at the end.

### 2. Tell GitHub about AWS

Add these as repository **variables** (not secrets; neither one is a password):

```bash
gh variable set AWS_ROLE_ARN --body "<AWS_ROLE_ARN output>"
```

```bash
gh variable set TF_STATE_BUCKET --body "<TF_STATE_BUCKET output>"
```

Or use **GitHub → repo → Settings → Secrets and variables → Actions → Variables**.

### 3. Add the approval gate

**Settings → Environments → New environment → `production`**, then turn on **Required reviewers** and add yourself.
Now every apply pauses with a **Review deployments** button until you approve it.

### 4. Safety net

AWS Console → **Billing → Budgets → Create budget → Zero spend budget** (or a $5 monthly budget) to get emailed if anything costs money.

### 5. First deploy

Open a PR to `main` with these files. The plan will say roughly *"115 to add"*. Merge it, approve the deployment, and
the **Apply** job summary shows the site URL. CloudFront takes about 5 minutes to come online the first time.

---

## Demo script (about 15 minutes)

1. **The ticket.** Create a GitHub Issue: *"Marketing wants the hero headline changed."*
2. **The diagram.** Show the architecture in Lucidchart (or the diagram above). *"This is what we're changing."*
3. **The change.** Create a branch and edit a line in `site/index.html` (the web editor on GitHub is fine).
4. **The pull request.** Open a PR. Show the **Checks** running: HTML check, link check, Terraform plan.
   Open the bot comment: *"1 to change: index.html."* *"This is the preview. Nothing has changed in AWS yet."*
5. **Review & merge.** *"A second person always looks before production changes."*
6. **The approval gate.** Actions tab → the run is waiting → **Review deployments → Approve**.
7. **Live.** The apply goes green, then refresh the CloudFront URL to show the new headline.
8. **Break it on purpose.** Open another PR with broken HTML (e.g. delete a `</div>`) or a typo in a `.tf` file.
   The checks turn red and the merge is blocked. *"Production was never at risk."*
9. **Drift (optional).** In the AWS console, change the CloudFront distribution's *comment*, then re-run the
   workflow (Actions → Terraform → Run workflow). The plan shows Terraform wants to put it back.
   *"Manual changes get caught. That's why we don't click around in the console."*
10. **Rebuild from nothing (optional).** Show `terraform destroy` and `terraform apply` locally:
    *"The whole environment is code, so it can be thrown away and rebuilt identically."*

---

## Teardown (after the demo)

```bash
cd infra/site
terraform init -backend-config="bucket=<TF_STATE_BUCKET>"
terraform destroy
```

```bash
cd ../bootstrap
terraform destroy
```

Destroy `site` first; it uses the role and state bucket that `bootstrap` owns.
