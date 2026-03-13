terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ---------------------------------------------------------------------------
# APIs
# ---------------------------------------------------------------------------
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# ---------------------------------------------------------------------------
# Artifact Registry
# ---------------------------------------------------------------------------
resource "google_artifact_registry_repository" "wisestory" {
  location      = var.region
  repository_id = "wisestory"
  format        = "DOCKER"
  description   = "Wisestory container images"

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# Cloud SQL (PostgreSQL 16 + pgvector)
# ---------------------------------------------------------------------------
resource "google_sql_database_instance" "main" {
  name             = "wisestory-db"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    edition           = "ENTERPRISE"

    database_flags {
      name  = "cloudsql.enable_pgvector"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = false

  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "wisestory" {
  name     = "wisestory"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "wisestory" {
  name     = "wisestory"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# ---------------------------------------------------------------------------
# Secret Manager
# ---------------------------------------------------------------------------
locals {
  secrets = {
    DATABASE_URL          = "postgresql://wisestory:${var.db_password}@/${google_sql_database.wisestory.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
    BETTER_AUTH_SECRET    = var.better_auth_secret
    GOOGLE_CLIENT_ID      = var.google_client_id
    GOOGLE_CLIENT_SECRET  = var.google_client_secret
    GOOGLE_API_KEY        = var.google_api_key
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  secret_id = each.key

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "secrets" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value
}

# ---------------------------------------------------------------------------
# Service Accounts
# ---------------------------------------------------------------------------
resource "google_service_account" "web" {
  account_id   = "wisestory-web"
  display_name = "Wisestory Web Service"
}

resource "google_service_account" "agent" {
  account_id   = "wisestory-agent"
  display_name = "Wisestory Agent Service"
}

# Grant both SAs access to secrets
resource "google_secret_manager_secret_iam_member" "web_secrets" {
  for_each  = google_secret_manager_secret.secrets
  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.web.email}"
}

resource "google_secret_manager_secret_iam_member" "agent_secrets" {
  for_each  = { for k, v in google_secret_manager_secret.secrets : k => v if contains(["DATABASE_URL", "GOOGLE_API_KEY"], k) }
  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.agent.email}"
}

# Grant both SAs Cloud SQL client access
resource "google_project_iam_member" "web_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.web.email}"
}

resource "google_project_iam_member" "agent_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.agent.email}"
}

# ---------------------------------------------------------------------------
# Cloud Run — Web
# ---------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "web" {
  name     = "wisestory-web"
  location = var.region

  template {
    service_account = google_service_account.web.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wisestory.repository_id}/wisestory-web:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "AGENT_SERVICE_URL"
        value = google_cloud_run_v2_service.agent.uri
      }
      env {
        name  = "BETTER_AUTH_URL"
        value = "" # Updated after first deploy via deploy.sh
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["DATABASE_URL"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "BETTER_AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["BETTER_AUTH_SECRET"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GOOGLE_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["GOOGLE_CLIENT_ID"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GOOGLE_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["GOOGLE_CLIENT_SECRET"].secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.secrets,
  ]

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].containers[0].env,
    ]
  }
}

# Public access for web
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------------------------------------------------------------------------
# Cloud Run — Agent Service
# ---------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "agent" {
  name     = "wisestory-agent"
  location = var.region

  template {
    service_account = google_service_account.agent.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    timeout = "300s"

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wisestory.repository_id}/wisestory-agent:latest"

      ports {
        container_port = 3001
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "3001"
      }
      env {
        name  = "GOOGLE_GENAI_USE_VERTEXAI"
        value = "FALSE"
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["DATABASE_URL"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GOOGLE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["GOOGLE_API_KEY"].secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.secrets,
  ]

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Web service can invoke agent service
resource "google_cloud_run_v2_service_iam_member" "agent_invoker" {
  name     = google_cloud_run_v2_service.agent.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.web.email}"
}
