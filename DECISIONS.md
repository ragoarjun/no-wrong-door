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

What I observed by running the services:

1. REST Service:

- /health works and returns a successful response.
- /residents?page=1 returned:
  - page: 1
  - page_size: 25
  - total: 620
  - has_more: true
  - 25 residents in results
- I tested page 1 and page 2.
- Page 1 ended with:
  - R-10594
  - R-10057
- Page 2 started with:
  - R-10594
  - R-10057
- So the duplicate pagination problem is actually happening in the provided service.
- We cannot simply combine all pages.
- We need to keep track of the unique REST id and remove duplicates.

2. XML Service:

- /health works and returns a successful response.
- /records returns XML instead of JSON.
- I tested /records manually.
- One request took approximately 2.04 seconds.
- Another request took approximately 1.23 seconds.
- So the delay is not fixed and the XML service can take noticeable time even when it succeeds.
- The service can also return 500 errors.
- Default failure rate is 15%.
- The failure can happen after the request has already spent time waiting.
- This means our API cannot depend on the XML service always responding successfully.

The two sources have different problems.
REST:

- Data consistency problem.
- Pagination can give us the same record more than once.
  XML:
- Reliability and latency problem.
- It is slow and can fail.
  Our API has to hide these problems from the employee as much as possible while still being honest about missing information.

System Design:

1. Adapter-based design:

- Each source system will have it's own adapter
- REST adapter handles REST pagination and duplicates records
- XML adapter handles XML parsing, slow responses and failures

2. Orchestration Layer:

- A service layer will call both adapters independently.
- Collect whatever information is available.
- It will assemble the final response
- It will handle graceful degradation when one source fails.

3. Single API:

- Node.js + Express will expose the API
- Employees communicates only with our API

4. Source independence:

- REST and XML adapters should not depend on each other.

######### Implementation Descision #########

1. REST Adapter:

- The REST adapter is responsible for communicating with the Resident Information System.
  - getResidentsPage(page)
    - Calls the Resident Information System for a specific page
    - Sends requests to the `/residents?page=<page>` endpoint
    - Returns the residents and pagination information from that page
  - getAllResidents()
    - Retrieves all resident pages
    - Continues while the source reports more pages
    - Uses the resident's unique REST `id` to detect duplicates
    - Returns one clean array of unique residents

2. Benefits Adapter:

- The Benefits adapter is responsible for communicating with the Benefits Register
- It hides the XML format, upstream failures, and timeout behaviour from the rest of the application
  - getBenefitsRecords()
    - Calls the Benefits Register `/records` endpoint
    - Uses `fast-xml-parser` to convert the XML response into a JavaScript object
    - Extracts `BenefitsRegister.Record` and returns it as a simple array
    - Detects HTTP failures such as `500`
    - Uses `AbortController` with a 3-second timeout so a slow upstream service cannot wait indefinitely
    - Converts a timeout into a clear application error
    - Always clears the timeout using `finally`

3. Orchestration service (src/services/residentService.js)

- The orchestration service coordinates the two independent adapters - getUnifiedData() - Calls the Resident and Benefits adapters independently - Uses `Promise.allSettled()` rather than `Promise.all()` - Allows one source to fail without discarding successful data from the other source - Converts technical `fulfilled` / `rejected` results into application-level statuses - Produces `complete`, `partial`, or `failed` overall status - Preserves the error message when a source fails - Uses `null` for unavailable source data rather than treating a failed request as an empty result

How did we handle graceful degradation?

- `Promise.all()` would reject the entire operation when one source fails.
- `Promise.allSettled()` allows both operations to finish independently, so the API can return useful Resident data even when the Benefits Register is unavailable.

########### DAY 2 : Surprise Challenge

- On Day 2, Brite changed the Benefits Register configuration so that it now fails on approximately 40% of requests
- There was no new data or new system. The existing Benefits Register simply became significantly less reliable

We did not redesign the application.
Instead, the existing architecture was tested against the new failure behaviour:

- The Benefits Register remained isolated behind `src/adapters/benefitsRegister.js`.
- `getBenefitsRecords()` continues to detect HTTP failures and timeouts.
- `src/services/residentService.js` continues to call both adapters independently.
- `getUnifiedData()` uses `Promise.allSettled()` so one failed source does not reject the entire operation.
- The service returns `complete` when both sources succeed.
- The service returns `partial` when one source fails.
- The successful source's data is still returned.
- The failed source is reported with its failure reason.

########### API LAYER

- After the adapters and orchestration service were working, an Express API layer was added.
- The API runs on port 3000.
- The API acts as the single doorway between the employee and the two source systems.

1. `src/app.js`

- Creates the Express application.
- Configures JSON handling.
- Keeps the root endpoint `/` to confirm that the API is running.
- Mounts the resident routes under `/api`.
- Starts the application on port 3000.

2. `src/routes/residentRoutes.js`

- Defines the public API route.
- `GET /api/residents` calls `getUnifiedData()`.
- Returns the unified result as JSON.
- The route itself does not contain source-specific logic.
- Pagination, duplicate handling, XML parsing, timeout handling, and graceful degradation remain inside their respective layers.

The request flow is:

Client
→ `GET /api/residents`
→ `residentRoutes.js`
→ `getUnifiedData()`
→ Resident Adapter + Benefits Adapter
→ Unified Response

########### INTEGRATION TESTING

The complete application was tested through the public API after connecting the adapters, orchestration layer, and Express route.

The following scenarios were verified:

1. Both services working:

- Residents → success
- Benefits → success
- Overall → `complete`

2. Benefits service failing:

- Residents → success
- Benefits → failed
- Overall → `partial`
- Resident data is still returned.
- The Benefits failure and its reason are reported.

3. Resident service failing:

- Residents → failed
- Benefits → success
- Overall → `partial`
- Benefits data is still returned.
- The Resident failure is reported.

4. Both services failing:

- Residents → failed
- Benefits → failed
- Overall → `failed`

This confirmed that the API does not depend on both upstream systems being available at the same time.

########### IDEMPOTENCY TESTING

- The API currently performs read-only GET operations.
- No request creates or modifies persistent data.
- The same API request was repeated several times through the browser.
- The response continued to behave consistently and no records were created or accumulated.
- This confirms that repeated reads are safe and do not introduce duplicate data.

########### OPTIONAL RESILIENCE IMPROVEMENTS

1. Caching:

- Added an in-memory cache for Benefits Register records.
- Cache TTL is 60 seconds.
- A 60-second TTL was chosen because the Benefits Register is slow, while allowing a small amount of acceptable data staleness.
- Successful Benefits responses are cached.
- HTTP failures, timeouts, and parsing failures are never cached.
- The cache is intentionally in-memory because the cached data is temporary and does not need to survive an application restart.

2. Circuit Breaker:

- Added a circuit breaker around the Benefits Register.
- After 3 consecutive failures, the circuit changes from `CLOSED` to `OPEN`.
- While `OPEN`, requests do not call the Benefits Register for 30 seconds.
- After 30 seconds, the circuit enters `HALF-OPEN` and allows one recovery request.
- A successful recovery closes the circuit.
- A failed recovery opens the circuit again.
- When the circuit is open, the API still returns a `partial` response when Resident data is available.
- This preserves the existing graceful degradation behaviour while preventing repeated calls to an unhealthy upstream service.

########### IDENTITY MATCHING DECISION

- Identity matching was intentionally not implemented.
- The Resident Index and Benefits Register use unrelated identifiers and do not provide a shared key.
- The problem statement explicitly identifies cross-source identity matching as a stretch goal rather than part of the mandatory floor.
- Attempting to match records using names, dates of birth, or addresses could create incorrect matches and introduce false information into the unified response.
- With the remaining development time, reliability, graceful degradation, caching, circuit breaking, testing, and clean-clone readiness provide more defensible value than speculative identity matching.
