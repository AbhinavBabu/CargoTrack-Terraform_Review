locals {
  tags = {
    Project   = var.project_name
    ManagedBy = "Terraform"
    Purpose   = "Terraform remote state backend"
  }
}

# ---------------------------------------------------------------------------
# S3 State Bucket
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "state" {

  bucket = "${var.project_name}-terraform-state"

  # Prevent accidental destruction of the bucket that holds all state
  lifecycle {
    prevent_destroy = true
  }

  tags = merge(local.tags, { Name = "${var.project_name}-terraform-state" })
}

# Enable versioning — every state write creates a new version, enabling rollback
resource "aws_s3_bucket_versioning" "state" {

  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encrypt state at rest with AES-256 (SSE-S3)
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {

  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access — state must never be publicly reachable
resource "aws_s3_bucket_public_access_block" "state" {

  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------------------------------------------------------------
# DynamoDB Lock Table
# ---------------------------------------------------------------------------

resource "aws_dynamodb_table" "locks" {

  name         = "${var.project_name}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"

  # Terraform requires exactly this attribute name and type for state locking
  hash_key = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.tags, { Name = "${var.project_name}-terraform-locks" })
}
