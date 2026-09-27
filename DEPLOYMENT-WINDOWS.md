# Deploying Ruchi Restaurant App on a New Windows Machine

This guide covers how to move your application to a different Windows computer and get it running.

## 1. Prerequisites (Install these on the new machine)

Before you begin, ensure the new computer has the following software installed:

*   **Node.js (LTS Version)**: Download and install from [nodejs.org](https://nodejs.org/).
*   **PostgreSQL**: Download and install from [postgresql.org](https://www.postgresql.org/download/windows/).
    *   **Important**: During installation, remember the **password** you set for the `postgres` user.
    *   Leave the port as default (`5432`).
*   **Git** (Optional): If you want to pull code from GitHub.

## 2. Transfer the Code

You have two options to move your code:

**Option A: Using a USB Drive / Network Share (Manually)**
1.  On your current machine, copy the entire `RuchiV2` project folder.
2.  **Exclude/Delete** these huge folders to save time (they will be recreated):
    *   `node_modules`
    *   `.next`
3.  Paste the folder onto the new machine (e.g., `C:\Apps\RuchiV2`).

**Option B: Using GitHub (Recommended)**
1.  Push your code to a private GitHub repository.
2.  On the new machine, clone it: `git clone <your-repo-url>`.

## 3. Set Up the Database

1.  Open **pgAdmin 4** (installed with PostgreSQL) or a terminal.
2.  **Create the Database**:
    *   Open the Query Tool (or SQL Shell).
    *   Run: `CREATE DATABASE restaurant_db;`
3.  **Import the Schema**:
    *   Open the file `database/schema.sql` from your project folder.
    *   Copy the contents and run them in the Query Tool against the `restaurant_db` database.
    *   **Start with Schema**: Run all SQL queries in `database/schema.sql`.
    *   **Run Migrations**: Run all SQL files in `database/migrations/` in order (or as needed) to ensure the structure is up to date.

## 4. Configure Environment Variables

1.  In the project folder on the new machine, create a new file named `.env.local` (or copy `.env.example` and rename it).
2.  Open it with Notepad and configure your database settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD  <-- Replace this with the password you set in Step 1

# Admin Credentials
ADMIN_EMAIL=admin@restaurant.com
ADMIN_PASSWORD=admin123
```

## 5. Install Dependencies

1.  Open Command Prompt (cmd) or PowerShell.
2.  Navigate to the project folder:
    ```cmd
    cd C:\Apps\RuchiV2
    ```
3.  Install the required software libraries:
    ```cmd
    npm install
    ```

## 6. Run the Application

You can now start the app.

**For Development / Testing:**
*   Double-click the `start_app.bat` file (if you copied it).
*   Or run: `npm run dev`

**For Production (Faster, Stable):**
1.  Build the app once:
    ```cmd
    npm run build
    ```
2.  Start the production server:
    ```cmd
    npm start
    ```
3.  The app will be running at `http://localhost:3000`.

## Troubleshooting

*   **Database Error?** Check your password in `.env.local` and ensure the PostgreSQL service is running in Windows Services.
*   **Missing Modules?** Run `npm install` again.
*   **Port 3000 in use?** Restart the computer or find the process using that port.
