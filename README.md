# No Wrong Door

A unified Node.js API acting as a single gateway that aggregates records from two disparate backend systems:

- **Resident Information System** (REST/JSON on port `8081`)
- **Benefits Register** (XML on port `8082`)

The public API runs on port `3000` (`GET /api/residents`) and provides automated deduplication, XML parsing, timeout protection, 60-second in-memory caching, circuit breaking, and graceful degradation.

---

## 1. Prerequisites & Required Versions

Ensure the following runtimes are installed before running the project:

- **Node.js**: `v18.0.0` or higher (uses native global `fetch` and `AbortController`)
  ```bash
  node -v
  ```
- **Python**: `3.8` or higher (standard library only; no external `pip` packages required)
  ```bash
  python --version   # or: python3 --version
  ```

---

## 2. Installation

Clone the repository and install the Node.js dependencies from the project root:

This will create a new no-wrong-door folder on your computer.

Important: Git will not automatically open the newly created folder in VS Code or File Explorer. After cloning, manually open the no-wrong-door folder in your preferred editor.

```bash
git clone https://github.com/ragoarjun/no-wrong-door.git
cd no-wrong-door
npm install
```

Windows / PowerShell: If npm install shows an error saying that npm.ps1 cannot be loaded because running scripts is disabled on the system, run:

```bash
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## 3. How to Run the Services (3 Terminals)

Open **three separate terminal windows** in the project root directory and start the services in the following order:

### Terminal 1: Resident Information System (Port 8081)

- **Windows (PowerShell / Command Prompt):**
  ```powershell
  python services\rest_service.py --port 8081
  ```
- **Linux / macOS:**
  ```bash
  python3 services/rest_service.py --port 8081
  ```

**Expected Startup Output:**

```
Resident Index (REST) on http://127.0.0.1:8081
  620 records across 28 pages of 25
```

---

### Terminal 2: Benefits Register (Port 8082 — Day 2: 40% Failure Rate)

- **Windows (PowerShell / Command Prompt):**
  ```powershell
  python services\xml_service.py --port 8082 --failure-rate 0.40
  ```
- **Linux / macOS:**
  ```bash
  python3 services/xml_service.py --port 8082 --failure-rate 0.40
  ```

**Expected Startup Output:**

```
Benefits Register (XML) on http://127.0.0.1:8082
  450 records | failure rate 40% | delay 0.7-2.4s
```

---

### Terminal 3: Node.js Unified API (Port 3000)

```bash
npm start
```

_(Or directly: `node src/app.js`)_

**Expected Startup Output:**

```
API running on http://localhost:3000
```

---

## 4. Calling the Public API

Once all three services are running, access the unified API:

- **In Browser / Postman:**  
  `http://localhost:3000/api/residents`
- **Using cURL:**
  ```bash
  curl http://localhost:3000/api/residents
  ```

---

## 5. Expected API Responses

### Complete Response (`"status": "complete"`)

Returned when both upstream services respond successfully:

```json
{
  "status": "complete",
  "residents": [
    {
      "id": "R-10394",
      "first_name": "Paul",
      "last_name": "Quill",
      "date_of_birth": "1955-06-10",
      "address_line": "261 Sycamore Dr",
      "city": "Weybridge",
      "phone": "555-375-2897",
      "program_status": "Suspended",
      "last_contact": "2025-04-07"
    }
  ],
  "benefits": [
    {
      "Ref": "AS/2024/4702",
      "Name": "EASTWOOD, Donna",
      "Born": "1973-11-18",
      "Addr": "137 Poplar Road",
      "Town": "Ash Hill",
      "BenefitCode": "TRN-1",
      "ReviewDue": "2026-06-25"
    }
  ],
  "sources": {
    "residents": { "status": "success" },
    "benefits": { "status": "success" }
  }
}
```

### Partial Response (`"status": "partial"`)

Returned when the Benefits service fails (40% failure rate, timeout, or open circuit). All **620 resident records** are returned intact, with explicit failure diagnostics in `sources.benefits`:

```json
{
  "status": "partial",
  "residents": [
    {
      "id": "R-10394",
      "first_name": "Paul",
      "last_name": "Quill",
      "date_of_birth": "1955-06-10",
      "address_line": "261 Sycamore Dr",
      "city": "Weybridge",
      "phone": "555-375-2897",
      "program_status": "Suspended",
      "last_contact": "2025-04-07"
    }
  ],
  "benefits": null,
  "sources": {
    "residents": { "status": "success" },
    "benefits": {
      "status": "failed",
      "error": "Benefits service returned 500"
    }
  }
}
```

| Overall Status | Condition                                      | Payload Details                                                     |
| :------------- | :--------------------------------------------- | :------------------------------------------------------------------ |
| **`complete`** | Both sources succeeded                         | `residents` and `benefits` populated                                |
| **`partial`**  | One source failed (e.g., Benefits 500/timeout) | Available data returned; failed source is `null` with error message |
| **`failed`**   | Both sources failed                            | Both sources are `null` with respective error diagnostics           |

---

## 6. Running the Automated Tests

With the backend services running in Terminals 1 and 2, open a **fourth terminal** and execute each test:

### 1. Test Resident Pagination & Deduplication

Verifies that all 28 pages are retrieved and duplicates across page boundaries are stripped, returning exactly 620 unique IDs:

```bash
node tests/testResidentIndex.js
```

**Expected Output:**

```
Total residents: 620
Unique IDs: 620
PASS: All resident IDs are unique
```

---

### 2. Test Benefits Parsing & 60-Second Caching

Verifies XML parsing and validates that subsequent calls within 60 seconds hit the in-memory cache:

```bash
node tests/testBenefitsRegister.js
```

**Expected Output:**

```
TEST FILE STARTED
First request:
Benefits cache miss - calling XML service...
Benefits cache updated
Benefits circuit closed
First request records: 450

Second request:
Benefits cache hit
Second request records: 450
PASS: Cache returned data successfully
```

---

### 3. Test Orchestration & Graceful Degradation

Verifies that `Promise.allSettled()` handles upstream availability states (`complete` / `partial` / `failed`) without throwing uncaught exceptions:

```bash
node tests/testResidentService.js
```

**Expected Output:**

```
Benefits cache hit
Overall: complete
Residents: { status: 'success' }
Benefits: { status: 'success' }
PASS: Unified service returned a valid degradation state
```

---

## 7. Service & Port Quick Reference

| Service               | Host & Port      | Launch Command                                                   | Role                                   |
| :-------------------- | :--------------- | :--------------------------------------------------------------- | :------------------------------------- |
| **Resident Service**  | `localhost:8081` | `python services\rest_service.py --port 8081`                    | Upstream REST API                      |
| **Benefits Register** | `localhost:8082` | `python services\xml_service.py --port 8082 --failure-rate 0.40` | Upstream XML Service (Day 2: 40% fail) |
| **Unified API**       | `localhost:3000` | `npm start`                                                      | Public Gateway (`GET /api/residents`)  |

---

## 8. Documentation References

- For detailed architecture, trade-offs, circuit breaker mechanics, and the decision on identity matching, see [`DECISIONS.md`](DECISIONS.md).
- For development methodology and AI tooling disclosures, see [`AI-USAGE.md`](AI-USAGE.md).
