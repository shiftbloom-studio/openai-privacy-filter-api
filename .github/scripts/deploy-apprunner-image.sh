#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <app-runner-service-arn> <image-identifier>" >&2
  exit 2
fi

SERVICE_ARN="$1"
IMAGE_IDENTIFIER="$2"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-central-1}}"
TIMEOUT_SECONDS="${APP_RUNNER_DEPLOY_TIMEOUT_SECONDS:-1200}"
POLL_SECONDS="${APP_RUNNER_DEPLOY_POLL_SECONDS:-15}"

wait_for_service_ready() {
  local elapsed=0
  local status

  while (( elapsed <= TIMEOUT_SECONDS )); do
    status="$(aws apprunner describe-service \
      --region "$AWS_REGION" \
      --service-arn "$SERVICE_ARN" \
      --query "Service.Status" \
      --output text)"

    case "$status" in
      RUNNING)
        return 0
        ;;
      CREATE_FAILED|DELETE_FAILED|DELETED|OPERATION_FAILED)
        echo "App Runner service entered terminal status: $status" >&2
        return 1
        ;;
      *)
        echo "Waiting for App Runner service to become RUNNING. Current status: $status"
        sleep "$POLL_SECONDS"
        elapsed=$((elapsed + POLL_SECONDS))
        ;;
    esac
  done

  echo "Timed out waiting for App Runner service to become RUNNING." >&2
  return 1
}

wait_for_operation() {
  local operation_id="$1"
  local elapsed=0
  local status

  while (( elapsed <= TIMEOUT_SECONDS )); do
    status="$(aws apprunner list-operations \
      --region "$AWS_REGION" \
      --service-arn "$SERVICE_ARN" \
      --query "OperationSummaryList[?Id=='${operation_id}'].Status | [0]" \
      --output text)"

    case "$status" in
      SUCCEEDED)
        wait_for_service_ready
        return 0
        ;;
      FAILED|ROLLBACK_FAILED)
        echo "App Runner operation failed: $operation_id" >&2
        return 1
        ;;
      ""|None)
        echo "Waiting for App Runner operation to appear: $operation_id"
        ;;
      *)
        echo "Waiting for App Runner operation $operation_id. Current status: $status"
        ;;
    esac

    sleep "$POLL_SECONDS"
    elapsed=$((elapsed + POLL_SECONDS))
  done

  echo "Timed out waiting for App Runner operation: $operation_id" >&2
  return 1
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

wait_for_service_ready

source_config="$tmp_dir/source-configuration.json"
updated_config="$tmp_dir/source-configuration-updated.json"

aws apprunner describe-service \
  --region "$AWS_REGION" \
  --service-arn "$SERVICE_ARN" \
  --query "Service.SourceConfiguration" \
  --output json > "$source_config"

jq --arg image "$IMAGE_IDENTIFIER" \
  '.ImageRepository.ImageIdentifier = $image' \
  "$source_config" > "$updated_config"

operation_id="$(aws apprunner update-service \
  --region "$AWS_REGION" \
  --service-arn "$SERVICE_ARN" \
  --source-configuration "file://$updated_config" \
  --query "OperationId" \
  --output text)"

echo "Started App Runner deployment operation: $operation_id"
wait_for_operation "$operation_id"
echo "App Runner deployment completed for image: $IMAGE_IDENTIFIER"
