#!/bin/bash
#
# codex-ralph-batch.sh - Run multiple Ralph loops overnight
#
# Usage:
#   ./codex-ralph-batch.sh tasks.yaml
#   ./codex-ralph-batch.sh --from-prompts ./prompts/
#
# Tasks file format (YAML-ish, parsed with bash):
#   # tasks.yaml
#   ---
#   - name: "Phase 1 - Database Models"
#     dir: /path/to/project
#     prompt: "Create SQLAlchemy models for users, posts, comments"
#     max_iterations: 20
#     completion: "MODELS_DONE"
#   
#   - name: "Phase 2 - API Endpoints"  
#     dir: /path/to/project
#     prompt: "Build FastAPI endpoints for all models"
#     max_iterations: 30
#     completion: "API_DONE"
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RALPH_SCRIPT="$SCRIPT_DIR/codex-ralph.sh"

# Task variables (set by parse_task)
task_name=""
task_dir="."
task_prompt=""
task_max_iter=50
task_completion="COMPLETE"

# Global options
DRY_RUN=false
RESUME=true  # Default to resume mode
FORCE_RESTART=false
STATE_FILE=""
CODEX_FLAGS="--full-auto"  # Passed to codex-ralph.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Stats
TOTAL_TASKS=0
COMPLETED_TASKS=0
FAILED_TASKS=0
START_TIME=$(date +%s)

log_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_task_start() {
    echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│${NC} TASK: $1"
    echo -e "${BLUE}│${NC} DIR:  $2"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
}

# ============================================================================
# State file management for resume capability
# ============================================================================

# Initialize state file path based on tasks file
init_state_file() {
    local tasks_file="$1"
    local base_name=$(basename "$tasks_file" | sed 's/\.[^.]*$//')
    local dir_name=$(dirname "$tasks_file")
    
    # Handle case where tasks_file has no directory component
    if [[ "$dir_name" == "." ]] || [[ "$dir_name" == "$tasks_file" ]]; then
        dir_name="."
    fi
    
    STATE_FILE="${dir_name}/.ralph-state-${base_name}.txt"
    
    # If force restart, remove existing state
    if [[ "$FORCE_RESTART" == true ]] && [[ -f "$STATE_FILE" ]]; then
        echo -e "${YELLOW}Removing previous state file (--restart)${NC}"
        rm -f "$STATE_FILE"
    fi
    
    # Create state file if it doesn't exist
    if [[ ! -f "$STATE_FILE" ]]; then
        touch "$STATE_FILE"
    fi
}

# Check if a task has already been completed
is_task_completed() {
    local task_id="$1"  # Typically "task_num:task_name"
    
    if [[ -f "$STATE_FILE" ]]; then
        grep -qF "$task_id" "$STATE_FILE" 2>/dev/null
        return $?
    fi
    return 1  # Not completed
}

# Mark a task as completed
mark_task_completed() {
    local task_id="$1"
    local status="$2"  # "success" or "failed"
    local timestamp=$(date -Iseconds)
    
    echo "${task_id}|${status}|${timestamp}" >> "$STATE_FILE"
}

# Get task ID for tracking
get_task_id() {
    local task_num="$1"
    local task_name="$2"
    # Use both number and name for robust matching
    echo "task_${task_num}:${task_name}"
}

# Parse a simple task definition from a block of text
# Sets global variables: task_name, task_dir, task_prompt, task_max_iter, task_completion
parse_task() {
    local block="$1"
    
    # Reset defaults
    task_name=""
    task_dir="."
    task_prompt=""
    task_max_iter=50
    task_completion="COMPLETE"
    
    local in_prompt=false
    local prompt_lines=""
    local parse_line  # Local variable to avoid clobbering outer 'line'
    
    while IFS= read -r parse_line || [[ -n "$parse_line" ]]; do
        # Skip comments and empty lines (but not in multi-line prompt)
        if [[ "$in_prompt" == false ]]; then
            [[ "$parse_line" =~ ^[[:space:]]*# ]] && continue
        fi
        
        # Check for end of multi-line prompt (new key or end of block)
        if [[ "$in_prompt" == true ]]; then
            if [[ "$parse_line" =~ ^[[:space:]]*(name|dir|max_iterations|completion):[[:space:]]* ]]; then
                in_prompt=false
                task_prompt="$prompt_lines"
            else
                # Continue collecting prompt lines
                prompt_lines="${prompt_lines}${parse_line}"$'\n'
                continue
            fi
        fi
        
        # Parse key: value pairs
        if [[ "$parse_line" =~ ^[[:space:]]*name:[[:space:]]*(.+)$ ]]; then
            task_name="${BASH_REMATCH[1]}"
            # Remove surrounding quotes if present
            task_name="${task_name#\"}"
            task_name="${task_name%\"}"
            task_name="${task_name#\'}"
            task_name="${task_name%\'}"
        elif [[ "$parse_line" =~ ^[[:space:]]*dir:[[:space:]]*(.+)$ ]]; then
            task_dir="${BASH_REMATCH[1]}"
            task_dir="${task_dir%\"}"  # Remove trailing quote if present
            task_dir="${task_dir#\"}"  # Remove leading quote if present
        elif [[ "$parse_line" =~ ^[[:space:]]*prompt:[[:space:]]*\|[[:space:]]*$ ]]; then
            # Multi-line prompt starting with |
            in_prompt=true
            prompt_lines=""
        elif [[ "$parse_line" =~ ^[[:space:]]*prompt:[[:space:]]*\"?(.+)\"?$ ]]; then
            # Single-line prompt
            task_prompt="${BASH_REMATCH[1]//\"/}"
        elif [[ "$parse_line" =~ ^[[:space:]]*max_iterations:[[:space:]]*([0-9]+) ]]; then
            task_max_iter="${BASH_REMATCH[1]}"
        elif [[ "$parse_line" =~ ^[[:space:]]*completion:[[:space:]]*(.+)$ ]]; then
            task_completion="${BASH_REMATCH[1]}"
            # Remove surrounding quotes if present
            task_completion="${task_completion#\"}"
            task_completion="${task_completion%\"}"
            task_completion="${task_completion#\'}"
            task_completion="${task_completion%\'}"
        fi
    done <<< "$block"
    
    # Capture any remaining prompt content
    if [[ "$in_prompt" == true ]] && [[ -n "$prompt_lines" ]]; then
        task_prompt="$prompt_lines"
    fi
    
    # Trim trailing whitespace from prompt
    task_prompt="${task_prompt%"${task_prompt##*[![:space:]]}"}"
}

# Run a single task
run_task() {
    local name="$1"
    local dir="$2"
    local prompt="$3"
    local max_iter="$4"
    local completion="$5"
    local task_num="$6"
    
    local task_id=$(get_task_id "$task_num" "$name")
    
    # Check if already completed (resume mode)
    if [[ "$RESUME" == true ]] && is_task_completed "$task_id"; then
        echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
        echo -e "${CYAN}│${NC} SKIPPING (already completed): $name"
        echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
        COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
        return 0
    fi
    
    log_task_start "$name" "$dir"
    
    # Dry run mode - just show what would happen
    if [[ "$DRY_RUN" == true ]]; then
        echo "  Max iterations: $max_iter"
        echo "  Completion: $completion"
        echo "  Prompt preview: ${prompt:0:100}..."
        echo ""
        COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
        return 0
    fi
    
    local task_start=$(date +%s)
    local log_file="$dir/ralph-task-$task_num.log"
    
    # Expand tilde in directory path
    dir="${dir/#\~/$HOME}"
    
    # Change to task directory
    if [[ ! -d "$dir" ]]; then
        echo -e "${RED}Directory not found: $dir${NC}"
        mark_task_completed "$task_id" "failed:dir_not_found"
        FAILED_TASKS=$((FAILED_TASKS + 1))
        return 1
    fi
    
    pushd "$dir" > /dev/null
    
    # Run Ralph loop
    if "$RALPH_SCRIPT" "$prompt" \
        --max-iterations "$max_iter" \
        --completion-promise "$completion" \
        --codex-flags "$CODEX_FLAGS" \
        --log-file "$log_file"; then
        
        local task_end=$(date +%s)
        local task_duration=$((task_end - task_start))
        echo -e "${GREEN}✓ Task completed in ${task_duration}s${NC}"
        mark_task_completed "$task_id" "success"
        COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
    else
        local task_end=$(date +%s)
        local task_duration=$((task_end - task_start))
        echo -e "${RED}✗ Task failed after ${task_duration}s${NC}"
        echo "  Check log: $log_file"
        mark_task_completed "$task_id" "failed"
        FAILED_TASKS=$((FAILED_TASKS + 1))
    fi
    
    popd > /dev/null
}

# Parse tasks file and run all tasks
run_tasks_from_file() {
    local tasks_file="$1"
    
    if [[ ! -f "$tasks_file" ]]; then
        echo -e "${RED}Tasks file not found: $tasks_file${NC}"
        exit 1
    fi
    
    # Initialize state tracking
    init_state_file "$tasks_file"
    
    log_header "CODEX RALPH BATCH RUNNER"
    echo "Tasks file: $tasks_file"
    echo "State file: $STATE_FILE"
    if [[ "$RESUME" == true ]] && [[ -s "$STATE_FILE" ]]; then
        local completed_count=$(wc -l < "$STATE_FILE" | tr -d ' ')
        echo -e "Resume mode: ${GREEN}${completed_count} task(s) already completed${NC}"
    fi
    echo "Started: $(date)"
    echo ""
    
    local task_num=0
    local in_task=false
    local task_block=""
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        # New task marker
        if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*name: ]]; then
            # Process previous task if exists
            if [[ -n "$task_block" ]]; then
                task_num=$((task_num + 1))
                TOTAL_TASKS=$((TOTAL_TASKS + 1))
                
                parse_task "$task_block"
                
                if [[ -n "$task_prompt" ]]; then
                    run_task "$task_name" "$task_dir" "$task_prompt" \
                             "$task_max_iter" "$task_completion" "$task_num"
                fi
            fi
            
            # Start new task block
            task_block="name: ${line#*name:}"
            in_task=true
        elif [[ "$in_task" == true ]]; then
            task_block="$task_block"$'\n'"$line"
        fi
    done < "$tasks_file"
    
    # Process final task
    if [[ -n "$task_block" ]]; then
        task_num=$((task_num + 1))
        TOTAL_TASKS=$((TOTAL_TASKS + 1))
        
        parse_task "$task_block"
        
        if [[ -n "$task_prompt" ]]; then
            run_task "$task_name" "$task_dir" "$task_prompt" \
                     "$task_max_iter" "$task_completion" "$task_num"
        fi
    fi
}

# Run tasks from a directory of prompt files
run_tasks_from_prompts_dir() {
    local prompts_dir="$1"
    
    if [[ ! -d "$prompts_dir" ]]; then
        echo -e "${RED}Prompts directory not found: $prompts_dir${NC}"
        exit 1
    fi
    
    # Initialize state tracking
    local dir_name=$(basename "$prompts_dir")
    STATE_FILE="${prompts_dir}/.ralph-state-${dir_name}.txt"
    
    if [[ "$FORCE_RESTART" == true ]] && [[ -f "$STATE_FILE" ]]; then
        echo -e "${YELLOW}Removing previous state file (--restart)${NC}"
        rm -f "$STATE_FILE"
    fi
    
    if [[ ! -f "$STATE_FILE" ]]; then
        touch "$STATE_FILE"
    fi
    
    log_header "CODEX RALPH BATCH RUNNER"
    echo "Prompts dir: $prompts_dir"
    echo "State file: $STATE_FILE"
    if [[ "$RESUME" == true ]] && [[ -s "$STATE_FILE" ]]; then
        local completed_count=$(wc -l < "$STATE_FILE" | tr -d ' ')
        echo -e "Resume mode: ${GREEN}${completed_count} task(s) already completed${NC}"
    fi
    echo "Started: $(date)"
    echo ""
    
    local task_num=0
    
    for prompt_file in "$prompts_dir"/*.md "$prompts_dir"/*.txt; do
        [[ -f "$prompt_file" ]] || continue
        
        task_num=$((task_num + 1))
        TOTAL_TASKS=$((TOTAL_TASKS + 1))
        
        local task_name=$(basename "$prompt_file" | sed 's/\.[^.]*$//')
        local task_prompt=$(cat "$prompt_file")
        local task_dir=$(dirname "$prompt_file")
        
        # Check for config in prompt file header
        local max_iter=50
        local completion="COMPLETE"
        
        if head -5 "$prompt_file" | grep -q "max_iterations:"; then
            max_iter=$(head -5 "$prompt_file" | grep "max_iterations:" | sed 's/.*: *//')
        fi
        if head -5 "$prompt_file" | grep -q "completion:"; then
            completion=$(head -5 "$prompt_file" | grep "completion:" | sed 's/.*: *//')
        fi
        
        run_task "$task_name" "$task_dir" "$task_prompt" \
                 "$max_iter" "$completion" "$task_num"
    done
}

# Print summary
print_summary() {
    local end_time=$(date +%s)
    local total_duration=$((end_time - START_TIME))
    local hours=$((total_duration / 3600))
    local minutes=$(((total_duration % 3600) / 60))
    local seconds=$((total_duration % 60))
    
    log_header "BATCH COMPLETE"
    
    echo "Total tasks:     $TOTAL_TASKS"
    echo -e "Completed:       ${GREEN}$COMPLETED_TASKS${NC}"
    echo -e "Failed:          ${RED}$FAILED_TASKS${NC}"
    echo ""
    printf "Total runtime:   %02d:%02d:%02d\n" $hours $minutes $seconds
    echo "Finished:        $(date)"
    
    if [[ $FAILED_TASKS -eq 0 ]]; then
        echo ""
        echo -e "${GREEN}All tasks completed successfully! 🎉${NC}"
    else
        echo ""
        echo -e "${YELLOW}Some tasks failed. Check individual log files for details.${NC}"
    fi
}

# Main
main() {
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 tasks.yaml"
        echo "       $0 --from-prompts ./prompts/"
        echo "       $0 --dry-run tasks.yaml"
        exit 1
    fi
    
    # Parse global options first
    local positional_args=()
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --restart|--fresh)
                FORCE_RESTART=true
                shift
                ;;
            --no-resume)
                RESUME=false
                shift
                ;;
            --codex-flags)
                CODEX_FLAGS="$2"
                shift 2
                ;;
            --help|-h)
                cat << 'EOF'
codex-ralph-batch.sh - Run multiple Ralph loops overnight

Usage:
    ./codex-ralph-batch.sh tasks.yaml
    ./codex-ralph-batch.sh --from-prompts ./prompts/
    ./codex-ralph-batch.sh --dry-run tasks.yaml
    ./codex-ralph-batch.sh --restart tasks.yaml

Options:
    --dry-run           Show what would run without executing
    --restart           Start fresh, ignoring any previous progress
    --no-resume         Disable resume (re-run all tasks)
    --codex-flags FLAGS Flags to pass to codex (default: "--full-auto")
    --help, -h          Show this help message

Codex CLI Flags:
    Run 'codex --help' to see available flags for your version.
    Example: --codex-flags "--full-auto"

Resume Capability:
    By default, the script tracks completed tasks in a state file
    (.ralph-state-<name>.txt). If interrupted, simply re-run the
    same command to resume from where you left off.

    State file location: Same directory as your tasks.yaml
    
    To start completely fresh:
        ./codex-ralph-batch.sh --restart tasks.yaml

Tasks file format (tasks.yaml):
    - name: "Phase 1 - Setup"
      dir: /path/to/project
      prompt: "Initialize project with TypeScript, ESLint, Prettier"
      max_iterations: 15
      completion: "SETUP_DONE"
    
    - name: "Phase 2 - Core Features"
      dir: /path/to/project  
      prompt: "Implement core business logic"
      max_iterations: 30
      completion: "CORE_DONE"

Or use individual prompt files in a directory:
    prompts/
    ├── 01-setup.md
    ├── 02-models.md
    └── 03-api.md

Each prompt file can include config in header:
    <!-- max_iterations: 25 -->
    <!-- completion: PHASE_DONE -->
    
    Build the REST API endpoints...

EOF
            exit 0
            ;;
            --from-prompts)
                shift
                [[ -z "${1:-}" ]] && { echo "Missing prompts directory"; exit 1; }
                positional_args+=("--from-prompts" "$1")
                shift
                ;;
            *)
                positional_args+=("$1")
                shift
                ;;
        esac
    done
    
    # Process positional arguments
    if [[ ${#positional_args[@]} -eq 0 ]]; then
        echo "No tasks file specified"
        exit 1
    fi
    
    set -- "${positional_args[@]}"
    
    case "$1" in
        --from-prompts)
            run_tasks_from_prompts_dir "$2"
            ;;
        *)
            run_tasks_from_file "$1"
            ;;
    esac
    
    print_summary
}

main "$@"
