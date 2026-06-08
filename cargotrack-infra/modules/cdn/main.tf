locals {
  common_tags = {
    Project   = var.project_name
    ManagedBy = "Terraform"
  }
}

# ---------------------------------------------------------------------------
# WAFv2 Web ACL — scope must be CLOUDFRONT (us-east-1 — matches deployment)
# ---------------------------------------------------------------------------

resource "aws_wafv2_web_acl" "main" {

  name  = "${var.project_name}-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rule 1 — IP reputation list (block known malicious IPs first)
  rule {

    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-AmazonIpReputationList"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2 — Common rule set (OWASP Top 10 baseline)
  rule {

    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3 — Known bad inputs (log4j, SSRF, etc.)
  rule {

    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-KnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4 — SQL injection protection
  rule {

    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-SQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# CloudFront distribution
# ---------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "main" {

  enabled         = true
  is_ipv6_enabled = true
  http_version    = "http2"
  comment         = "${var.project_name} frontend distribution"
  price_class     = "PriceClass_100"

  # Associate WAF
  web_acl_id = aws_wafv2_web_acl.main.arn

  # Origin — external ALB (HTTP only; ALB has no TLS certificate)
  origin {

    origin_id   = "external-alb"
    domain_name = var.alb_dns_name

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behaviour — pass-through (SPA + API, fully dynamic)
  default_cache_behavior {

    target_origin_id       = "external-alb"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    # Forward everything to the origin — no caching
    forwarded_values {
      query_string = true

      headers = ["*"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Default CloudFront certificate (*.cloudfront.net) — no ACM / Route53 required
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}
