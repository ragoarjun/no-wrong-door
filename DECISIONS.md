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

Understanding the folder and file structure:

1. \_rest_data.json :

- This is raw database-like data behind Source 1.
- It contains the Resident Index serves
- There are 620 resident records
- I shouldn't read this file from our API. From \_rest_service.py

2. \_xml_data.json :

- Same idea but for source 2
- The structure is completely different. And the service turns the data into XML
- Again our application shouldn't directly touch this JSON

3. \_rest_service.py

- This is the actual mock Resident Information System
- This is the thing that our API will call
- It exposes: - GET /residents?page=1 - GET residents/<id> - GET /health
- Main problem is pagination can overlap
- If we just do (all_records += page_records) It is wrong so our future REST adapter needs to understand this behaviour.

4. xml_service.py

- This is the mock Benefits Information System
- It exposes: - GET /records - GET /records/<ref> - GET /health
- It's slow, normal requests can take roughly 0.7 to 2.4 seconds
- It can fail. Default failure rate: 15%
- A failed request can still take time before returning 500
- /health endpoint is deliberately reliable

5. run_both.sh

- This is simply the launcher
- When you run: ./services/run_both.sh:
  - rest_service.py -> localhost:8081
  - xml_service.py -> localhost:8082
- Our future application will essentially have:
  Our API: 3000
- REST : 8081
- XML : 8082

6. DATA-PACK.md

- This is Brite's documentation, not our application
