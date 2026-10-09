# Demo website: private S3 bucket + CloudFront CDN, serving the files in /site.
# The GitHub Actions pipeline plans and applies this on every change.

terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Bucket name is passed at init time: terraform init -backend-config="bucket=<TF_STATE_BUCKET>"
  backend "s3" {
    key    = "site/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  site_dir   = "${path.module}/../../site"
  site_files = fileset(local.site_dir, "**")

  content_types = {
    html  = "text/html; charset=utf-8"
    css   = "text/css"
    js    = "application/javascript"
    cjs   = "application/javascript"
    json  = "application/json"
    map   = "application/json"
    svg   = "image/svg+xml"
    png   = "image/png"
    jpg   = "image/jpeg"
    jpeg  = "image/jpeg"
    webp  = "image/webp"
    gif   = "image/gif"
    ico   = "image/x-icon"
    woff  = "font/woff"
    woff2 = "font/woff2"
    pdf   = "application/pdf"
    txt   = "text/plain"
    md    = "text/markdown"
    docx  = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
}

# ---------- Storage ----------

resource "aws_s3_bucket" "site" {
  bucket        = "${var.project}-site-${data.aws_caller_identity.current.account_id}"
  force_destroy = true # lets `terraform destroy` remove it even with files inside
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Each site file is its own resource, so `terraform plan` lists exactly which pages changed.
resource "aws_s3_object" "site" {
  for_each = local.site_files

  bucket       = aws_s3_bucket.site.id
  key          = each.value
  source       = "${local.site_dir}/${each.value}"
  etag         = filemd5("${local.site_dir}/${each.value}")
  content_type = lookup(local.content_types, lower(element(reverse(split(".", each.value)), 0)), "application/octet-stream")
}

# ---------- CDN ----------

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.project}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "${var.project} (${var.environment})"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US/Canada/Europe edges only: cheapest

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS managed "CachingOptimized"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Only this CloudFront distribution may read from the bucket.
data "aws_iam_policy_document" "site_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket     = aws_s3_bucket.site.id
  policy     = data.aws_iam_policy_document.site_bucket.json
  depends_on = [aws_s3_bucket_public_access_block.site]
}
