#!/bin/bash
#
# codex-ralph.sh - Ralph Wiggum technique for OpenAI Codex CLI
#
# "Better to fail predictably than succeed unpredictably"
#
# Usage:
#   ./codex-ralph.sh "Your task prompt" [options]
#
# Options:
#   --max-iterations N       Maximum loop iterations (default: 50)
#   --completion-promise STR String that signals completion (default: "COMPLETE")
#   --cooldown N             Seconds between iterations (default: 5)
#   --log-file PATH          Log file path (default: ./ralph-log.txt)
#   --dry-run                Show what would run without executing
#

set -euo pipefail

# ============================================================================
# Configuration defaults
# ============================================================================
MAX_ITERATIONS=50
COMPLETION_PROMISE="COMPLETE"
COOLDOWN_SECONDS=5
LOG_FILE="./ralph-log.txt"
DRY_RUN=false
PROMPT=""
CODEX_FLAGS="--full-auto"  # Customize based on your Codex version
CODEX_CMD="codex exec"     # Use 'codex exec' for non-interactive mode

# ============================================================================
# Color output
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $1"
    echo "[$timestamp] $1" >> "$LOG_FILE"
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] ✓ $1${NC}"
    echo "[$timestamp] SUCCESS: $1" >> "$LOG_FILE"
}

log_warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] ⚠ $1${NC}"
    echo "[$timestamp] WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ✗ $1${NC}"
    echo "[$timestamp] ERROR: $1" >> "$LOG_FILE"
}

# ============================================================================
# Parse arguments
# ============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --max-iterations)
                MAX_ITERATIONS="$2"
                shift 2
                ;;
            --completion-promise)
                COMPLETION_PROMISE="$2"
                shift 2
                ;;
            --cooldown)
                COOLDOWN_SECONDS="$2"
                shift 2
                ;;
            --log-file)
                LOG_FILE="$2"
                shift 2
                ;;
            --codex-flags)
                CODEX_FLAGS="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                if [[ -z "$PROMPT" ]]; then
                    PROMPT="$1"
                else
                    log_error "Unknown argument: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done

    if [[ -z "$PROMPT" ]]; then
        log_error "No prompt provided"
        show_help
        exit 1
    fi
}

show_help() {
    cat << 'EOF'
codex-ralph.sh - Ralph Wiggum autonomous loops for OpenAI Codex CLI

Usage:
    ./codex-ralph.sh "Your task prompt" [options]

Options:
    --max-iterations N       Maximum loop iterations (default: 50)
    --completion-promise STR String that signals task completion (default: "COMPLETE")
    --cooldown N             Seconds to wait between iterations (default: 5)
    --log-file PATH          Path to log file (default: ./ralph-log.txt)
    --codex-flags FLAGS      Flags to pass to codex (default: "--full-auto")
    --dry-run                Show configuration without executing
    --help, -h               Show this help message

Examples:
    # Basic usage
    ./codex-ralph.sh "Build a REST API for todos. Output COMPLETE when done."

    # With custom settings
    ./codex-ralph.sh "Migrate tests to Vitest" \
        --max-iterations 30 \
        --completion-promise "MIGRATION_DONE" \
        --cooldown 10

    # With custom Codex flags (check 'codex --help' for your version)
    ./codex-ralph.sh "Build feature X" \
        --codex-flags "--full-auto"

    # Multi-phase overnight run
    ./codex-ralph.sh "Phase 1: Set up project structure. Output PHASE1_DONE when complete." \
        --max-iterations 20 \
        --completion-promise "PHASE1_DONE"

Codex CLI Flags:
    Run 'codex exec --help' to see available flags for your version.
    The script uses 'codex exec' for non-interactive execution.
    
    Common options include:
      --full-auto       Sandboxed automatic execution (default)
      -a on-failure     Only ask approval on failures
      -a never          Never ask for approval
      --sandbox <MODE>  read-only, workspace-write, danger-full-access

Philosophy:
    - Don't aim for perfect on first try. Let the loop refine the work.
    - Failures are predictable and informative. Use them to tune prompts.
    - Success depends on writing good prompts, not just having a good model.

EOF
}

# ============================================================================
# Build the augmented prompt
# ============================================================================
build_prompt() {
    local iteration=$1
    local last_output_file=$2
    
    local augmented_prompt="$PROMPT

---
ITERATION: $iteration of $MAX_ITERATIONS
COMPLETION SIGNAL: When task is complete, include '$COMPLETION_PROMISE' in your response.

INSTRUCTIONS:
- Review the current state of the codebase
- Continue working toward the goal
- If blocked, document what's preventing progress
- If complete, output: $COMPLETION_PROMISE
"

    # If we have output from last iteration, include context
    if [[ -f "$last_output_file" ]] && [[ -s "$last_output_file" ]]; then
        local last_output=$(tail -c 2000 "$last_output_file")
        augmented_prompt="$augmented_prompt
---
PREVIOUS ITERATION OUTPUT (last 2000 chars):
$last_output
"
    fi

    echo "$augmented_prompt"
}

# ============================================================================
# Check for completion signal in output
# ============================================================================
check_completion() {
    local output_file=$1
    
    if [[ -f "$output_file" ]]; then
        if grep -q "$COMPLETION_PROMISE" "$output_file"; then
            return 0  # Found completion signal
        fi
    fi
    return 1  # Not complete
}

# ============================================================================
# Run a single Codex iteration
# ============================================================================
run_codex_iteration() {
    local iteration=$1
    local prompt="$2"
    local output_file="$3"
    
    log "Running Codex iteration $iteration..."
    
    # Run Codex exec with configured flags
    # shellcheck disable=SC2086
    if $CODEX_CMD $CODEX_FLAGS "$prompt" 2>&1 | tee "$output_file"; then
        return 0
    else
        local exit_code=$?
        log_warning "Codex exited with code $exit_code"
        return $exit_code
    fi
}

# ============================================================================
# Main Ralph loop
# ============================================================================
main() {
    parse_args "$@"
    
    # Initialize log
    echo "========================================" >> "$LOG_FILE"
    echo "Ralph Loop Started: $(date)" >> "$LOG_FILE"
    echo "Prompt: $PROMPT" >> "$LOG_FILE"
    echo "Max Iterations: $MAX_ITERATIONS" >> "$LOG_FILE"
    echo "Completion Promise: $COMPLETION_PROMISE" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    
    log "Starting Ralph loop"
    log "  Max iterations: $MAX_ITERATIONS"
    log "  Completion signal: $COMPLETION_PROMISE"
    log "  Cooldown: ${COOLDOWN_SECONDS}s"
    log "  Codex command: $CODEX_CMD $CODEX_FLAGS"
    log "  Log file: $LOG_FILE"
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN - Would execute with prompt:"
        echo "---"
        build_prompt 1 ""
        echo "---"
        echo ""
        log "Full command: $CODEX_CMD $CODEX_FLAGS \"<prompt>\""
        exit 0
    fi
    
    # Check codex is available
    if ! command -v codex &> /dev/null; then
        log_error "Codex CLI not found. Install with: npm install -g @openai/codex"
        exit 1
    fi
    
    local iteration=0
    local output_dir=$(mktemp -d)
    local last_output=""
    local start_time=$(date +%s)
    
    # Trap to clean up on exit
    trap "rm -rf $output_dir; log 'Ralph loop interrupted'" EXIT
    
    while [[ $iteration -lt $MAX_ITERATIONS ]]; do
        ((iteration++))
        
        local output_file="$output_dir/iteration-$iteration.txt"
        local augmented_prompt=$(build_prompt "$iteration" "$last_output")
        
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log "ITERATION $iteration / $MAX_ITERATIONS"
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Run Codex
        if run_codex_iteration "$iteration" "$augmented_prompt" "$output_file"; then
            log "Iteration $iteration completed"
        else
            log_warning "Iteration $iteration had non-zero exit"
        fi
        
        # Check for completion
        if check_completion "$output_file"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            log_success "TASK COMPLETE!"
            log_success "Completed in $iteration iterations (${duration}s)"
            
            # Copy final state to log
            echo "" >> "$LOG_FILE"
            echo "=== FINAL OUTPUT ===" >> "$LOG_FILE"
            cat "$output_file" >> "$LOG_FILE"
            
            exit 0
        fi
        
        last_output="$output_file"
        
        # Cooldown before next iteration
        if [[ $iteration -lt $MAX_ITERATIONS ]]; then
            log "Cooling down for ${COOLDOWN_SECONDS}s before next iteration..."
            sleep "$COOLDOWN_SECONDS"
        fi
    done
    
    # Max iterations reached without completion
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_error "Max iterations ($MAX_ITERATIONS) reached without completion"
    log "Total runtime: ${duration}s"
    log "Review $LOG_FILE for details"
    
    exit 1
}

main "$@"
