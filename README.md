# CodeSync

CodeSync is a browser-based code editor for running Python, JavaScript, TypeScript, and Java. The React frontend sends code to a FastAPI backend, which runs it in an isolated Docker container.

## Requirements

- Git
- Node.js and npm
- Python 3.10 or newer
- Docker Desktop (Windows/macOS) or Docker Engine (Linux), running locally

## Get the project

Clone the repository using its Git URL, then enter the project folder:

```sh
git clone <repository-url>
cd Codesync
```

Replace `<repository-url>` with the clone URL for this repository. If you already have the project folder, skip these commands.

## Set up and run

Install and start the frontend in one terminal:

```sh
cd frontend
npm ci
npm run dev
```

The Vite development server is available at `http://localhost:5173`.

Start the backend in a second terminal from the project root. On Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

On macOS:

```sh
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Open `http://localhost:5173` in your browser. Keep Docker running while using the code runner. The first run of a language may take longer because Docker needs to download its runner image.

The backend listens on `http://localhost:8000`, which is the API address configured by the frontend in `frontend/src/api.js`.

## Project structure

```text
backend/    FastAPI API and Docker-based code runner
database/   Database-related project files
frontend/   React application built with Vite
```

## Contributing

1. Create a branch for your change: `git switch your-change`.
2. Make and locally.
3. Commit with a clear message and push your branch.
4. Open a pull request describing what changed and how you checked it.

For frontend checks `npm run dev` from `frontend/`. For backend changes, make sure the API starts and try running code for the affected language through the app.
