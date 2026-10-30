$ErrorActionPreference = "Stop"

npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }