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

variable "create_oidc_provider" {
  description = "Set to false if this AWS account already has the GitHub OIDC provider."
  type        = bool
  default     = true
}
