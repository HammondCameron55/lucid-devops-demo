# One-time setup, run from your laptop (not from the pipeline).
# Creates the pieces GitHub Actions needs before it can manage anything itself:
#   1. An S3 bucket to hold Terraform state for infra/site
#   2. GitHub's OIDC identity provider in IAM (so no AWS keys are stored in GitHub)
#   3. An IAM role that only this repo's workflows can assume

terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform-bootstrap"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  account_id   = data.aws_caller_identity.current.account_id
  state_bucket = "${var.project}-tfstate-${local.account_id}"
  oidc_url     = "https://token.actions.githubusercontent.com"
  oidc_arn = (
    var.create_oidc_provider
    ? aws_iam_openid_connect_provider.github[0].arn
    : "arn:aws:iam::${local.account_id}:oidc-provider/token.actions.githubusercontent.com"
  )
}

# ---------- Terraform state bucket ----------

resource "aws_s3_bucket" "state" {
  bucket        = local.state_bucket
  force_destroy = true # demo only: lets the final teardown delete it with state inside
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------- GitHub OIDC provider ----------
# An AWS account can only have one of these. If you already created it
# (e.g. for another project), run with -var="create_oidc_provider=false".

resource "aws_iam_openid_connect_provider" "github" {
  count          = var.create_oidc_provider ? 1 : 0
  url            = local.oidc_url
  client_id_list = ["sts.amazonaws.com"]
  # AWS no longer validates this for GitHub, but the API still requires a value.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# ---------- Role GitHub Actions assumes ----------

data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Only these callers from this one repo may assume the role:
    #   - pull requests (plan), pushes to main (plan), and the "production" environment (apply)
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:pull_request",
        "repo:${var.github_repo}:ref:refs/heads/main",
        "repo:${var.github_repo}:environment:production",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name                 = "${var.project}-github-actions"
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600
}

data "aws_iam_policy_document" "permissions" {
  # Read/write Terraform state.
  statement {
    sid       = "StateBucketList"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.state.arn]
  }
  statement {
    sid       = "StateObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.state.arn}/*"]
  }

  # Manage only buckets whose names start with the project prefix.
  statement {
    sid     = "SiteBuckets"
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${var.project}-site-*",
      "arn:aws:s3:::${var.project}-site-*/*",
    ]
  }

  # CloudFront distributions/OACs can't be scoped by name before they exist.
  statement {
    sid       = "CloudFront"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  statement {
    sid       = "WhoAmI"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_actions" {
  name   = "terraform-site"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.permissions.json
}
