output "web_url" {
  description = "URL of the web Cloud Run service"
  value       = google_cloud_run_v2_service.web.uri
}

output "agent_url" {
  description = "URL of the agent Cloud Run service"
  value       = google_cloud_run_v2_service.agent.uri
}

output "db_connection_name" {
  description = "Cloud SQL connection name (for Cloud SQL proxy)"
  value       = google_sql_database_instance.main.connection_name
}

output "db_ip" {
  description = "Cloud SQL public IP"
  value       = google_sql_database_instance.main.public_ip_address
}

output "artifact_registry" {
  description = "Artifact Registry URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wisestory.repository_id}"
}
