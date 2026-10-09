variable "project" {
  description = "Name prefix for every resource in the demo."
  type        = string
  default     = "lucid-devops-demo"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "github_repo" {
  description = "owner/name of the GitHub repo allowed to assume the role."
  type        = string
  default     = "HammondCameron55/lucid-devops-demo"
}

variable "github_immutable_sub_prefix" {
  description = <<-EOT
    The repo's OIDC subject prefix when GitHub's immutable subject format is on
    (owner and repo with their permanent numeric IDs). Look it up with:
      gh api repos/<owner>/<repo>/actions/oidc/customization/sub
  EOT
  type        = string
  default     = "repo:HammondCameron55@110644424/lucid-devops-demo@1411324985"
}

variable "create_oidc_provider" {
  description = "Set to false if this AWS account already has the GitHub OIDC provider."
  type        = bool
  default     = true
}
