# AI Usage

The following AI tools were used during the development of this project.

## ChatGPT Go

I used ChatGPT Go to understand the problem statement and break down the requirements.

It helped me design the overall system architecture, including the adapter-based approach, orchestration layer, API layer, and graceful degradation strategy.

I also used it to discuss optimization techniques in the implementation. For example, it suggested using a JavaScript `Set` for tracking Resident IDs during pagination. This provides average O(1) lookup instead of repeatedly searching an array with O(n) lookup, which makes duplicate detection more efficient.

I also used ChatGPT Go for debugging, test design, and improving the project documentation.

## Google Gemini Pro

I used Google Gemini Pro as a final review tool for the implementation.

I asked it to review the code for possible bugs, edge cases, and opportunities for future improvement.

## Antigravity IDE

I used Antigravity IDE to run and verify the project during development.

The three test files in the `tests` directory were created with the help of Antigravity IDE and were executed against the provided mock services to verify the implementation.

## Documentation

ChatGPT Go was also used to help structure and improve the presentation of the project's documentation, including:

- `README.md`
- `DECISIONS.md`
- `AI-USAGE.md`

## Final Note

I built the project and made the final implementation decisions myself. AI tools were used as supporting tools throughout the process to improve accuracy, explore solutions, review the implementation, and make the development process more efficient.

The goal was not to blindly generate the project, but to use these tools where they were useful while understanding, running, testing, and verifying the final implementation myself.
