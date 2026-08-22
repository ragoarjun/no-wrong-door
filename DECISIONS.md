Understanding Problem Statement:

PROBLEM:
If I'm working in a Government benefit office. A person named "Maria" walks in. As a staff member I want to know everything about her.
Currently: (Two completely different system)

- Resident information system
- Benefits information system
  As an employee, I keep switching tabs and and copying information manually.

What I'm gonna build?

1. We are not replacing the old systems.
2. We are building a middle layer between them.
3. No more talking to the old systems directly anymore, only talk to our API
4. Our API contacts both system, collects whatever information it can and returns one clean response.

Challenges:

1. Source 1 (Resident Information):

- Looks good, but the data is paginated.
  Instead of A B C D -> It is A B C C D
- Our API should detect duplicates.

2. Source 2 (Benefits Information):

- Instead of JSON, it returns XML.
- Different Format, different IDs, different naming style
- It's slow and sometimes it returns 500

Does Brite expect Identity Matching?

- They have said "it's a stretch goal"
- No need to merge Maria from REST and Maria from XML
- They are unrealted and no common key

UNIFIED RESIDENT VIEW?

- They are expecting my API to be one doorway.

The floor (Mandatory requirements):

1. Graceful degradation:

- If both systems are working. Success. (Full unified response)
- Now XML fails (Partial unified response)
  - clear message saying XML failed
  - Whyt it failed?
    Missing data and failed data are not the same thing.

2. Retry safe and idempotent:

- If employee clicks maria twice, Should not create Maria Maria - Behave consistently - Same request - No duplicate
  We are doing read operations so repeated GET requests should not mutate anything.

3. Duplicate across pages

- If we simply concatenate arrays:
  1 2 3 4 5 5 6 7 8 9
  Our adapter must remove duplicates using the resident's unique REST id

4. Clean clone

If I have time:

1. Identity matching
2. Caching
3. Circuit breaker

TASK for me:
Build a Node.js API that talks to two unreliable systems, removes REST pagination duplicates, survives XML failures by returning partial data with honest status information, and is structured so each source is independent and easy to modify when the day-two requirement arrives.
