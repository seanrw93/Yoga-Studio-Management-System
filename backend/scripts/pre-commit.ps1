$ErrorActionPreference = "Stop"

npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run format:check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }