im looking for a way to visualize what my claude code and claude agent skd agents building/working on my machine are doing - specifically being able to see the agent thinking, tool calls, my messaages and eventually all the messages and session info for the claude code agent teams

dropping some inspiration that we ideally reverse engineer to build our own version, important that it looks and feel beautiful similar to bensbites cookbook url

inspiration
- https://cookbook.bensbites.com/cookbook/reverse-engineering-features/session/#msg-0 --> looking for a UI/UX just like this
- https://github.com/bentossell/ralph-loop-ui --> which looks related to the cookbook

i build something similar in the past but wasn't that great - might be worth looking at here ~/dev-shared/playground/sideline

for viewing the agent teams output, we might want to borrow the approach/implementation (while ideally keeping the ui from ben tossell) from this repo: https://github.com/disler/claude-code-hooks-multi-agent-observability