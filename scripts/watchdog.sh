#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/watchdog.sh -t <tmux-pane> -n <max-continues> [options]

Options:
  -t <pane>    tmux pane target, for example: mysession:0.0
  -n <count>   maximum number of auto-continue rounds
  -i <secs>    polling interval in seconds, default: 15
  -q <count>   unchanged polling rounds before kicking, default: 8
  -m <text>    message to send, default: continue
  -l <path>    log file path, default: /tmp/codex-watchdog.log
  -s <lines>   number of pane history lines to inspect, default: 120
  -b <regex>   block regex; if matched, watchdog stops instead of kicking
  -h           show this help

Examples:
  scripts/watchdog.sh -t dev:0.0 -n 5
  scripts/watchdog.sh -t dev:0.0 -n 3 -i 10 -q 6 -m "继续"
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

is_integer() {
  [[ "${1:-}" =~ ^[0-9]+$ ]]
}

log() {
  local message="$1"
  local now
  now="$(date '+%F %T')"
  echo "$now $message" | tee -a "$LOG_FILE"
}

PANE=""
MAX_CONTINUES=""
INTERVAL=15
QUIET_ROUNDS=8
MESSAGE="continue"
LOG_FILE="/tmp/codex-watchdog.log"
SNAPSHOT_LINES=120
BLOCK_REGEX='password|confirm|permission denied|login|overwrite'

while getopts ":t:n:i:q:m:l:s:b:h" opt; do
  case "$opt" in
    t) PANE="$OPTARG" ;;
    n) MAX_CONTINUES="$OPTARG" ;;
    i) INTERVAL="$OPTARG" ;;
    q) QUIET_ROUNDS="$OPTARG" ;;
    m) MESSAGE="$OPTARG" ;;
    l) LOG_FILE="$OPTARG" ;;
    s) SNAPSHOT_LINES="$OPTARG" ;;
    b) BLOCK_REGEX="$OPTARG" ;;
    h)
      usage
      exit 0
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      usage >&2
      exit 1
      ;;
    \?)
      echo "Unknown option: -$OPTARG" >&2
      usage >&2
      exit 1
      ;;
  esac
done

shift $((OPTIND - 1))

if [[ -n "${1:-}" || -n "${2:-}" ]]; then
  echo "Unexpected positional arguments." >&2
  usage >&2
  exit 1
fi

if [[ -z "$PANE" || -z "$MAX_CONTINUES" ]]; then
  echo "Both -t and -n are required." >&2
  usage >&2
  exit 1
fi

for value_name in MAX_CONTINUES INTERVAL QUIET_ROUNDS SNAPSHOT_LINES; do
  value="${!value_name}"
  if ! is_integer "$value"; then
    echo "$value_name must be a non-negative integer, got: $value" >&2
    exit 1
  fi
done

require_cmd tmux
require_cmd sha1sum
require_cmd awk
require_cmd tee

last_hash=""
stable_rounds=0
continues_sent=0

log "watchdog start pane=$PANE max_continues=$MAX_CONTINUES interval=${INTERVAL}s quiet_rounds=$QUIET_ROUNDS message=$MESSAGE"

while true; do
  pane_dead="$(tmux display-message -p -t "$PANE" '#{pane_dead}' 2>/dev/null || echo 1)"
  if [[ "$pane_dead" == "1" ]]; then
    log "pane dead, stop"
    break
  fi

  snapshot="$(tmux capture-pane -p -J -t "$PANE" -S "-$SNAPSHOT_LINES")"

  if [[ -n "$BLOCK_REGEX" ]] && printf '%s\n' "$snapshot" | grep -Eiq "$BLOCK_REGEX"; then
    log "blocked by regex match, stop"
    break
  fi

  current_hash="$(printf '%s' "$snapshot" | sha1sum | awk '{print $1}')"

  if [[ "$current_hash" == "$last_hash" ]]; then
    stable_rounds=$((stable_rounds + 1))
  else
    stable_rounds=0
    last_hash="$current_hash"
  fi

  if [[ "$stable_rounds" -ge "$QUIET_ROUNDS" ]]; then
    if [[ "$continues_sent" -ge "$MAX_CONTINUES" ]]; then
      log "max continues reached, stop"
      break
    fi

    tmux send-keys -t "$PANE" "$MESSAGE" Enter
    continues_sent=$((continues_sent + 1))
    stable_rounds=0
    log "kick #$continues_sent sent"
  fi

  sleep "$INTERVAL"
done

log "watchdog exit continues_sent=$continues_sent"
