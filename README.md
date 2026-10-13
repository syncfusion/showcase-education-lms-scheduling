# showcase-education-lms-scheduling
Plan terms, schedule classes, track student progress, and manage course materials in one portal. Built with Scheduler, Gantt Chart, DataGrid, Charts, File Manager, and AI AssistView.

Sample courses, students, and materials load from local fixtures. Edits stay in the browser session. **Reset** in the header restores the sample term. The assistant answers from that session and labels each reply as simulated.

## Pages

- **Dashboard** — enrollment, attendance, and completion for the term
- **Schedule** — weekly timetable grouped by instructor and room
- **Course Plan** — term modules with baseline and critical path
- **Content & Materials** — in-browser library for the term (nothing is written to disk)
- **Students** — roster with attendance and completion

Light and dark themes follow the header toggle.

## Run the app

Node.js `^20.19.0` or `>=22.12.0` is required.

From the repository root:

```sh
cd react
npm install
```

Copy the environment example and add a Syncfusion license key. The app starts without a key and shows the license banner until a valid key is registered. Get a key from [Syncfusion licensing](https://www.syncfusion.com/).

```sh
# Windows
copy .env.example .env

# macOS or Linux
cp .env.example .env
```

Set `VITE_SYNCFUSION_LICENSE_KEY` in `.env`, then start the dev server:

```sh
npm run dev
```

Open [http://localhost:5173/education-lms-scheduling/react/](http://localhost:5173/education-lms-scheduling/react/).

To build and preview a production bundle:

```sh
npm run build
npm run preview
```

The preview server uses the same base path on port 4173: [http://localhost:4173/education-lms-scheduling/react/](http://localhost:4173/education-lms-scheduling/react/).
