param(
  [Parameter(Mandatory=$true)] [string]$RemoteUrl,
  [string]$Branch = 'main',
  [string]$Message = 'Initial commit'
)

# Simple helper to initialize a git repo and push to a remote. Review before running.
if (-not (Test-Path .git)) {
  git init
  Write-Host "Initialized git repository"
} else {
  Write-Host "Git repository already initialized"
}

git add .
git commit -m $Message

$existing = git remote get-url origin 2>$null
if (-not $existing) {
  git remote add origin $RemoteUrl
  Write-Host "Added remote origin $RemoteUrl"
} else {
  Write-Host "Remote origin already set to: $existing"
}

Write-Host "Pushing to $RemoteUrl ($Branch)"
git branch -M $Branch
git push -u origin $Branch

Write-Host "Done. If the push failed, ensure you have permissions and the remote exists."
