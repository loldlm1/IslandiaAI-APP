#!/usr/bin/env bash
set -euo pipefail

# IslandiaAI system bootstrap for Pop!_OS and Ubuntu 24.04
# - Installs OS packages (build tools, Postgres, image libs)
# - Installs asdf and plugins (nodejs, yarn)
# - Installs pinned Node.js and Yarn versions from .tool-versions
# - Prepares a Next.js toolchain

REPO_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

# Track failures for final report
declare -a SETUP_FAILURES=()

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || return 1
}

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*" >&2; }
err() { echo "[ERROR] $*" >&2; exit 1; }

detect_os() {
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    echo "${ID}${VERSION_ID:+-$VERSION_ID}"
  else
    echo "unknown"
  fi
}

# Determine if we can execute apt-get (root or passwordless sudo)
can_run_apt() {
  if ! require_cmd apt-get; then
    return 1
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    return 0
  fi
  if require_cmd sudo && sudo -n true 2>/dev/null; then
    return 0
  fi
  return 1
}

# Wrapper to run apt-get with appropriate privileges
apt_run() {
  if [[ "$(id -u)" -eq 0 ]]; then
    apt-get "$@"
  elif require_cmd sudo && sudo -n true 2>/dev/null; then
    sudo -n apt-get "$@"
  else
    return 1
  fi
}

# Parse version from `.tool-versions`
tool_version() {
  local tool=$1
  awk -v t="$tool" '$1==t {print $2; exit}' "$REPO_ROOT_DIR/.tool-versions" 2>/dev/null || true
}

# Compare semantic versions (major.minor.patch). Returns 0 if equal
ver_eq() {
  local a=$1 b=$2
  [[ "$a" == "$b" ]]
}

ensure_apt_packages() {
  # Refresh package metadata first so candidate checks are accurate
  if can_run_apt; then
    info "Refreshing apt package metadata"
    apt_run update -y
  else
    warn "Insufficient privileges to refresh apt metadata; proceeding best-effort"
  fi

  # Install only missing packages to speed up container boots
  local wanted_pkgs=(
    build-essential git curl ca-certificates gnupg lsb-release
    openssl libssl-dev zlib1g-dev libreadline-dev libyaml-dev
    libpq-dev pkg-config imagemagick libffi-dev libxml2-dev libxslt1-dev
    autoconf bison libgdbm-dev libncurses5-dev libncursesw5-dev
    libjemalloc-dev python3 python3-venv
    postgresql postgresql-contrib
  )

  # Headless Chrome dependencies required for Selenium system specs
  local chrome_libs=(
    libatk1.0-0
    libatk-bridge2.0-0
    libdrm2
    libgbm1
    libglib2.0-0
    libgtk-3-0
    libnss3
    libpango-1.0-0
    libpangocairo-1.0-0
    libx11-xcb1
    libxcomposite1
    libxcursor1
    libxdamage1
    libxfixes3
    libxinerama1
    libxkbcommon0
    libxrandr2
    libxrender1
    libxshmfence1
    libxss1
    libxtst6
    libwayland-client0
    libwayland-cursor0
    libwayland-egl1
    libxcb-dri3-0
    libxcb-present0
    libxcb-sync1
    libxcb-xfixes0
  )
  wanted_pkgs+=("${chrome_libs[@]}")

  # Handle ALSA library transition on newer Ubuntus (libasound2 -> libasound2t64)
  # Prefer an installable candidate rather than matching by name, since
  # libasound2 may be virtual and not directly installable on 24.04+.
  local _alsa_candidate
  _alsa_candidate="$(apt-cache policy libasound2t64 2>/dev/null | awk '/Candidate:/ {print $2}')"
  if [[ -n "${_alsa_candidate:-}" && "${_alsa_candidate}" != "(none)" ]]; then
    wanted_pkgs+=(libasound2t64)
  else
    _alsa_candidate="$(apt-cache policy libasound2 2>/dev/null | awk '/Candidate:/ {print $2}')"
    if [[ -n "${_alsa_candidate:-}" && "${_alsa_candidate}" != "(none)" ]]; then
      wanted_pkgs+=(libasound2)
    else
      warn "Neither libasound2t64 nor libasound2 is installable on this system."
    fi
  fi

  if apt-cache show libglu1-mesa >/dev/null 2>&1; then
    wanted_pkgs+=(libglu1-mesa)
  fi
  
  # Add Chromium packages for Capybara/Selenium system tests
  # Select installable candidates to avoid apt failures across Ubuntu versions
  local _cand
  local _chrome_pkg=""
  local _driver_pkg=""

  _cand="$(apt-cache policy chromium-browser 2>/dev/null | awk '/Candidate:/ {print $2}')"
  if [[ -n "${_cand:-}" && "${_cand}" != "(none)" ]]; then
    _chrome_pkg="chromium-browser"
  else
    _cand="$(apt-cache policy chromium 2>/dev/null | awk '/Candidate:/ {print $2}')"
    if [[ -n "${_cand:-}" && "${_cand}" != "(none)" ]]; then
      _chrome_pkg="chromium"
    fi
  fi

  _cand="$(apt-cache policy chromium-chromedriver 2>/dev/null | awk '/Candidate:/ {print $2}')"
  if [[ -n "${_cand:-}" && "${_cand}" != "(none)" ]]; then
    _driver_pkg="chromium-chromedriver"
  else
    _cand="$(apt-cache policy chromium-driver 2>/dev/null | awk '/Candidate:/ {print $2}')"
    if [[ -n "${_cand:-}" && "${_cand}" != "(none)" ]]; then
      _driver_pkg="chromium-driver"
    fi
  fi

  if [[ -n "${_chrome_pkg}" ]]; then
    wanted_pkgs+=("${_chrome_pkg}")
  fi
  if [[ -n "${_driver_pkg}" ]]; then
    wanted_pkgs+=("${_driver_pkg}")
  fi

  local missing=()
  for pkg in "${wanted_pkgs[@]}"; do
    dpkg -s "$pkg" >/dev/null 2>&1 || missing+=("$pkg")
  done

  if (( ${#missing[@]} > 0 )); then
    if can_run_apt; then
      info "Installing missing apt packages: ${missing[*]}"
      apt_run update -y
      DEBIAN_FRONTEND=noninteractive apt_run install -y "${missing[@]}"
    else
      warn "Cannot install packages (no root/sudo). Missing: ${missing[*]}"
      SETUP_FAILURES+=("apt install skipped - insufficient privileges")
    fi
  else
    info "All required apt packages already present."
  fi
}

ensure_asdf() {
  if require_cmd asdf; then
    info "asdf already installed"
    return
  fi

  # Check if directory exists but command not available (needs sourcing)
  if [[ -d "$HOME/.asdf" ]]; then
    info "asdf directory exists, sourcing asdf.sh..."
    . "$HOME/.asdf/asdf.sh"
    if require_cmd asdf; then
      info "asdf now available"
      return
    fi
    warn "asdf directory exists but appears incomplete, removing and reinstalling..."
    rm -rf "$HOME/.asdf"
  fi

  info "Installing asdf..."
  git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0
  # shell integration (bash & zsh)
  if [[ -n "${BASH_VERSION:-}" ]]; then
    if ! grep -qs "\.\s\+\~/.asdf/asdf.sh" ~/.bashrc; then
      echo -e '\n. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
      echo '. "$HOME/.asdf/completions/asdf.bash"' >> ~/.bashrc
    fi
  fi
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    if ! grep -qs "\.\s\+\~/.asdf/asdf.sh" ~/.zshrc; then
      echo -e '\n. "$HOME/.asdf/asdf.sh"' >> ~/.zshrc
    fi
  fi
  # current shell
  . "$HOME/.asdf/asdf.sh"
}

ensure_asdf_plugins() {
  info "Ensuring asdf plugins (nodejs, yarn)..."
  asdf plugin list | grep -q '^nodejs$' || asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
  asdf plugin list | grep -q '^yarn$' || asdf plugin add yarn https://github.com/twuni/asdf-yarn.git

  # Node.js plugin requires release team keys for source tarball verification
  bash -c "${ASDF_DIR:-$HOME/.asdf}/plugins/nodejs/bin/import-release-team-keyring" || true
}

ensure_tool_versions() {
  if [[ ! -f "$REPO_ROOT_DIR/.tool-versions" ]]; then
    warn ".tool-versions not found at $REPO_ROOT_DIR — creating with defaults"
    cat > "$REPO_ROOT_DIR/.tool-versions" <<'EOF'
nodejs 20.17.0
yarn 1.22.22
EOF
  fi
  info "Installing tools from .tool-versions (granular check)..."

  # Parse versions from .tool-versions
  local want_node want_yarn
  want_node="$(tool_version nodejs)"
  want_yarn="$(tool_version yarn)"

  # Detect current system versions
  local sys_node sys_yarn
  if require_cmd node; then sys_node="$(node -v 2>/dev/null | sed 's/^v//')"; fi
  if require_cmd yarn; then sys_yarn="$(yarn -v 2>/dev/null || true)"; fi

  # Install only missing or mismatched versions
  if [[ -n "${want_node}" ]]; then
    if [[ -n "${sys_node}" ]] && ver_eq "${sys_node}" "${want_node}"; then
      info "Node.js ${want_node} already available in system"
    else
      info "Installing Node.js ${want_node} via asdf (current: ${sys_node:-none})..."
      asdf install nodejs "${want_node}"
    fi
  fi

  if [[ -n "${want_yarn}" ]]; then
    if [[ -n "${sys_yarn}" ]] && ver_eq "${sys_yarn}" "${want_yarn}"; then
      info "Yarn ${want_yarn} already available in system"
    else
      info "Installing Yarn ${want_yarn} via asdf (current: ${sys_yarn:-none})..."
      asdf install yarn "${want_yarn}"
    fi
  fi
}

verify_postgres_packages() {
  if ! require_cmd psql; then
    warn "PostgreSQL client tools (psql) not installed."
    SETUP_FAILURES+=("PostgreSQL packages - psql command not available")
    return 1
  fi
  info "PostgreSQL packages installed successfully."
  return 0
}

verify_chromium_packages() {
  local chrome_bin=""
  local driver_bin=""
  
  # Check for Chrome/Chromium binary
  if require_cmd chromium-browser; then
    chrome_bin="chromium-browser"
  elif require_cmd chromium; then
    chrome_bin="chromium"
  elif require_cmd google-chrome; then
    chrome_bin="google-chrome"
  fi
  
  # Check for chromedriver
  if require_cmd chromedriver; then
    driver_bin="chromedriver"
  elif require_cmd chromium-chromedriver; then
    driver_bin="chromium-chromedriver"
  fi
  
  if [[ -n "$chrome_bin" && -n "$driver_bin" ]]; then
    info "Chrome/Chromium ($chrome_bin) and driver ($driver_bin) installed successfully."
    return 0
  elif [[ -n "$chrome_bin" ]]; then
    warn "Chrome/Chromium found but chromedriver missing. System tests may fail."
    SETUP_FAILURES+=("Chromium packages - driver not available (found: $chrome_bin)")
    return 1
  else
    warn "Chrome/Chromium not installed. System tests requiring JavaScript will be skipped."
    SETUP_FAILURES+=("Chromium packages - browser not available")
    return 1
  fi
}

print_final_status() {
  local want_node=$1
  local sys_node=$2
  local use_asdf_node=$3
  local want_yarn=$4
  local sys_yarn=$5
  local use_asdf_yarn=$6

  echo ""
  echo "=========================================="
  echo "SETUP COMPLETE - STATUS REPORT"
  echo "=========================================="
  echo ""
  echo "[INFO] Runtime summary:"
  echo "  node: want=${want_node:-unset}, system=${sys_node:-none}, via=$([[ ${use_asdf_node:-1} -eq 0 ]] && echo system || echo asdf)"
  echo "  yarn: want=${want_yarn:-unset}, system=${sys_yarn:-none}, via=$([[ ${use_asdf_yarn:-1} -eq 0 ]] && echo system || echo asdf)"
  echo ""

  if (( ${#SETUP_FAILURES[@]} == 0 )); then
    echo "✓ ALL SYSTEMS OPERATIONAL"
    echo ""
    echo "System dependencies installed. Next steps:"
    echo "  - Run ./scripts/setup_after_container.sh to configure PostgreSQL"
    echo "  - Run yarn install"
    echo "  - Run yarn dev"
    echo ""
    echo "Note: Open a new shell or run 'source ~/.asdf/asdf.sh' if using asdf."
  else
    echo "⚠ ISSUES DETECTED - ATTENTION REQUIRED"
    echo ""
    echo "The following components need attention:"
    for i in "${!SETUP_FAILURES[@]}"; do
      echo "  $((i+1)). ${SETUP_FAILURES[$i]}"
    done
    echo ""
    echo "Please resolve the above issues before proceeding."
    echo ""
  fi
  echo "=========================================="
}

main() {
  local os_id
  os_id=$(detect_os)
  info "Detected OS: $os_id"
  case "$os_id" in
    ubuntu-24.04|pop-24.04|ubuntu-24.10|pop-24.10|ubuntu-24.*|pop-24.*)
      ensure_apt_packages ;;
    ubuntu-*|pop-*)
      warn "This script is tested for 24.04; attempting on $os_id"; ensure_apt_packages ;;
    *)
      warn "Unknown OS ($os_id). Attempting Debian/Ubuntu-compatible steps."
      ensure_apt_packages ;;
  esac

  # Determine desired versions
  local want_node want_yarn
  want_node="$(tool_version nodejs)"
  want_yarn="$(tool_version yarn)"

  # Detect system versions
  local sys_node sys_yarn
  if require_cmd node; then sys_node="$(node -v 2>/dev/null | sed 's/^v//')"; fi
  if require_cmd yarn; then sys_yarn="$(yarn -v 2>/dev/null || true)"; fi

  local use_asdf_node=1 use_asdf_yarn=1
  if [[ -n "${sys_node:-}" && -n "${want_node:-}" ]] && ver_eq "${sys_node}" "${want_node}"; then use_asdf_node=0; fi
  if [[ -n "${sys_yarn:-}" && -n "${want_yarn:-}" ]] && ver_eq "${sys_yarn}" "${want_yarn}"; then use_asdf_yarn=0; fi

  if [[ "${SKIP_RUNTIMES:-0}" == "1" ]]; then
    info "SKIP_RUNTIMES=1 → skipping asdf runtime installation"
    use_asdf_node=0
    use_asdf_yarn=0
  else
    if (( use_asdf_node == 0 && use_asdf_yarn == 0 )); then
      info "Node.js and Yarn already match .tool-versions; skipping asdf installation."
      verify_postgres_packages || true
      verify_chromium_packages || true
      print_final_status "${want_node}" "${sys_node}" "${use_asdf_node}" "${want_yarn}" "${sys_yarn}" "${use_asdf_yarn}"
      return 0
    fi

    info "Using asdf for runtimes that don't match system versions"
    ensure_asdf
    # shellcheck source=/dev/null
    . "$HOME/.asdf/asdf.sh"
    ensure_asdf_plugins
    ensure_tool_versions

    if require_cmd node; then sys_node="$(node -v 2>/dev/null | sed 's/^v//')"; fi
    if require_cmd yarn; then sys_yarn="$(yarn -v 2>/dev/null || true)"; fi
  fi

  verify_postgres_packages || true  # Don't fail the entire script
  verify_chromium_packages || true  # Don't fail the entire script

  print_final_status "${want_node}" "${sys_node}" "${use_asdf_node}" "${want_yarn}" "${sys_yarn}" "${use_asdf_yarn}"
  return 0

}

main "$@"
