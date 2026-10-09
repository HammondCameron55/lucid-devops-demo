variable "project" {
  description = "Name prefix; must match infra/bootstrap so the pipeline role is allowed to manage the bucket."
  type        = string
  default     = "lucid-devops-demo"
}

variable "environment" {
  type    = string
  default = "demo"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}
