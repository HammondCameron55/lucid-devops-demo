# Copy these two values into GitHub: Settings -> Secrets and variables -> Actions -> Variables.

output "AWS_ROLE_ARN" {
  value = aws_iam_role.github_actions.arn
}

output "TF_STATE_BUCKET" {
  value = aws_s3_bucket.state.bucket
}
