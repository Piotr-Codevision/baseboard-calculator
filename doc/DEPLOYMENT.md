# Deployment Guide: Baseboard Calculator

This guide covers local development setup, production builds, and deployment of the Baseboard Calculator application on **Linux** and **Windows**, either natively (Node.js) or with **Docker**.

## 1. Prerequisites

Choose one of the two approaches:

**Option A: Native (Node.js)**

* **Node.js** v18 or higher ([nodejs.org](https://nodejs.org/))
* **npm** (bundled with Node.js)

Verify your installation:

```bash
node -v
npm -v
```

**Option B: Docker (no local Node.js required)**

* **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux)

Verify your installation:

```bash
docker -v
docker compose version
```

In both cases you need a modern web browser (Chrome, Firefox, Edge, Safari).

---

## 2. Linux (Ubuntu / Debian / Fedora)

### 2.1. Install Node.js

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora:**
```bash
sudo dnf module install nodejs:20/common
```

### 2.2. Project Setup

```bash
# Navigate to project directory
cd baseboard-calculator

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` (or the port shown in the terminal).

### 2.3. Build for Production

```bash
npm run build
```

The optimized static files are generated in the `dist/` directory.

### 2.4. Serve the Production Build Locally

```bash
npm run preview
```

### 2.5. Deploy to a Web Server (Nginx Example)

```bash
sudo cp -r dist/* /var/www/html/baseboard-calculator/
```

Example Nginx server block:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html/baseboard-calculator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 3. Windows, Native (PowerShell or Command Prompt)

### 3.1. Install Node.js

Download and run the installer from [nodejs.org](https://nodejs.org/) (LTS version recommended). The installer includes npm automatically.

### 3.2. Project Setup

```powershell
# Navigate to project directory
cd baseboard-calculator

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` (or the port shown in the terminal).

### 3.3. Build for Production

```powershell
npm run build
```

The optimized static files are generated in the `dist\` directory.

### 3.4. Serve the Production Build Locally

```powershell
npm run preview
```

### 3.5. Deploy to IIS (Internet Information Services)

1. Copy the contents of the `dist\` folder to your IIS site directory (e.g., `C:\inetpub\wwwroot\baseboard-calculator`).
2. Add a `web.config` file in the site root to support client-side routing (SPA fallback):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

3. Restart the IIS site via **IIS Manager** or:

```powershell
iisreset
```

---

## 4. Docker (Windows, also works on Linux/macOS)

With Docker, Node.js does not need to be installed on the host; everything runs inside containers. The commands below are written for **Windows PowerShell**. In Command Prompt, use `%cd%` instead of `${PWD}` and `^` instead of the backtick (`` ` ``) for line continuation. On Linux/macOS, use `$(pwd)` and `\`.

### 4.1. Install Docker Desktop (Windows)

Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) (WSL 2 backend recommended) and start it. Wait until it reports "Engine running".

Pull the Node.js image and verify it:

```powershell
docker pull node:24-slim
docker run --rm node:24-slim node -v
docker run --rm node:24-slim npm -v
```

### 4.2. Development Server in a Container

```powershell
# Navigate to project directory
cd baseboard-calculator

# Install dependencies and start the dev server inside a container
docker run -it --rm `
  -v "${PWD}:/app" `
  -v baseboard_node_modules:/app/node_modules `
  -w /app `
  -p 5173:5173 `
  node:24-slim `
  sh -c "npm install && npm run dev -- --host 0.0.0.0"
```

Notes:

* `-v "${PWD}:/app"` mounts the project into the container.
* The named volume `baseboard_node_modules` keeps Linux-built dependencies separate from your Windows folder (faster, and avoids platform conflicts).
* `--host 0.0.0.0` is required. Without it, Vite listens only on the container's own localhost and the browser on Windows cannot reach it.
* `-p 5173:5173` publishes the port to the host.

Open your browser at `http://localhost:5173`.

If hot reload does not pick up file changes (common when the project is on the Windows filesystem), add `-e CHOKIDAR_USEPOLLING=true` to the command, or keep the project inside the WSL filesystem (e.g., `\\wsl$\Ubuntu\home\<user>\baseboard-calculator`), which is also much faster.

### 4.3. Build for Production in a Container

```powershell
docker run --rm `
  -v "${PWD}:/app" `
  -v baseboard_node_modules:/app/node_modules `
  -w /app `
  node:24-slim `
  sh -c "npm install && npm run build"
```

The optimized static files are generated in the `dist\` directory of your project on the host.

### 4.4. Serve the Production Build Locally (Vite Preview)

```powershell
docker run -it --rm `
  -v "${PWD}:/app" `
  -v baseboard_node_modules:/app/node_modules `
  -w /app `
  -p 4173:4173 `
  node:24-slim `
  sh -c "npm run preview -- --host 0.0.0.0"
```

Open `http://localhost:4173`.

### 4.5. Package as a Production Image (Node build, Nginx serve)

This is the recommended way to run the application permanently. The image contains only the static files and Nginx (a few tens of MB), not Node.js.

1. Create `nginx.conf` in the project root (SPA fallback, equivalent to the IIS `web.config` and the Nginx block above):

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

2. Create a `Dockerfile` in the project root (multi-stage build):

```dockerfile
# Stage 1: build
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

`npm ci` requires a `package-lock.json`. If the project has none, replace it with `npm install`.

3. Create a `.dockerignore` file so local artifacts are not copied into the image:

```
node_modules
dist
.git
```

4. Build and run:

```powershell
docker build -t baseboard-calculator .
docker run -d --name baseboard-calculator -p 8080:80 --restart unless-stopped baseboard-calculator
```

Open `http://localhost:8080`.

5. Manage the container:

```powershell
# View status and logs
docker ps
docker logs baseboard-calculator

# Stop and remove
docker stop baseboard-calculator
docker rm baseboard-calculator

# Rebuild and redeploy after code changes
docker build -t baseboard-calculator .
docker rm -f baseboard-calculator
docker run -d --name baseboard-calculator -p 8080:80 --restart unless-stopped baseboard-calculator
```

### 4.6. Docker Compose (Recommended)

Create `docker-compose.yml` in the project root:

```yaml
services:
  baseboard-calculator:
    build: .
    image: baseboard-calculator:latest
    container_name: baseboard-calculator
    ports:
      - "127.0.0.1:8080:80"
    restart: unless-stopped
```

Usage:

```powershell
# Build (if needed) and start in the background
docker compose up -d --build

# View logs
docker compose logs -f

# Stop without removing
docker compose stop

# Stop and remove
docker compose down
```

Notes:

* `127.0.0.1:8080:80` publishes the app on the local machine only. To make it reachable from other devices on your network, change it to `"8080:80"` (and allow the port in Windows Firewall).
* The application is available at `http://localhost:8080`.

### 4.7. Autostart: Keep the Application Always Available on localhost

To have the application available after every reboot without manual steps, two things must start automatically: the **container** (via a restart policy) and **Docker itself** (via Docker Desktop's startup setting).

**Step 1: Set a restart policy on the container**

If you used the `docker run` command in 4.5 or the Compose file in 4.6, the policy `unless-stopped` is already set. For an existing container, apply it without recreating it:

```powershell
docker update --restart unless-stopped baseboard-calculator
```

Verify:

```powershell
docker inspect -f "{{.HostConfig.RestartPolicy.Name}}" baseboard-calculator
```

Policy overview:

| Policy | Behavior |
|---|---|
| `no` | Default. Never restarts automatically. |
| `on-failure` | Restarts only if the container exits with an error. |
| `always` | Always restarts, including after Docker starts. A manually stopped container is also started again when the Docker daemon restarts. |
| `unless-stopped` | Like `always`, but a container you stopped manually stays stopped. |

Caveat: after `docker compose down` the container no longer exists, so nothing is restarted. Use `docker compose stop` if you only want to pause it, and `docker compose up -d` to bring it back.

**Step 2: Start Docker Desktop automatically on Windows**

1. Open **Docker Desktop** → **Settings** (gear icon) → **General**.
2. Enable **Start Docker Desktop when you sign in to your computer**.
3. Optionally disable **Open Docker Dashboard when Docker Desktop starts** so no window pops up at login.
4. Click **Apply**.

After sign-in, Docker Desktop starts the engine and then starts all containers whose restart policy requires it. Allow up to a minute after login before the page responds.

**Step 3: Test**

Reboot Windows, sign in, wait for the Docker engine to start, then open `http://localhost:8080`.

**Limitation: Docker Desktop starts at user sign-in, not at boot**

If the application must be available even when nobody is logged in (for example, on a machine that reboots unattended after updates), use one of these approaches:

* **Windows auto sign-in:** configure automatic login for the user account (for example, with `netplwiz`; on newer Windows versions you may first need to disable "Require Windows Hello sign-in for Microsoft accounts" in Settings). Consider the security implications, and lock the screen automatically if the machine is in a shared location.
* **Docker Engine inside WSL 2 instead of Docker Desktop (advanced):**
  1. Install a WSL 2 distribution (e.g., Ubuntu) and enable systemd by adding the following to `/etc/wsl.conf` inside the distribution:

     ```ini
     [boot]
     systemd=true
     ```

  2. Install Docker Engine inside the distribution following the official Linux instructions, then enable it:

     ```bash
     sudo systemctl enable docker
     ```

  3. Create a **Task Scheduler** task (trigger: *At startup*, run whether the user is logged on or not) that keeps the distribution running, for example with the action `wsl.exe -d Ubuntu --exec sleep infinity`.
  4. Run the application there with `docker compose up -d` (the `restart: unless-stopped` policy applies). Ports published by containers in WSL 2 are normally reachable at `http://localhost:8080` from Windows.

**Alternative without a restart policy: Task Scheduler at logon**

If you prefer to control startup explicitly, create a Task Scheduler task (trigger: *At log on*, with a delay of about 1 minute) that runs:

```powershell
docker compose -f C:\path\to\baseboard-calculator\docker-compose.yml up -d
```

The delay gives Docker Desktop time to start its engine.

---

## 5. Deploying to Static Hosting Providers (Cross-Platform)

The `dist/` folder produced by `npm run build` (natively, or with the containerized build in section 4.3) can be deployed as-is to any static hosting provider, regardless of the OS used to build it:

* **Vercel:** `vercel --prod` (from project root, after installing Vercel CLI)
* **Netlify:** Drag and drop the `dist/` folder into the Netlify dashboard, or use `netlify deploy --prod --dir=dist`
* **GitHub Pages:** Push the contents of `dist/` to the `gh-pages` branch

The Vercel and Netlify CLIs run on the host and therefore need Node.js installed there. The Netlify drag-and-drop and Git-based options do not.

The Docker image from section 4.5 can also be pushed to a registry (Docker Hub, GitHub Container Registry, Azure Container Registry) and run on any Docker host.

---

## 6. Troubleshooting

| Issue | Resolution |
|---|---|
| `npm: command not found` | Reinstall Node.js and ensure it is added to your system `PATH`. |
| Port `5173` already in use | Stop the conflicting process, or run `npm run dev -- --port 5174`. |
| Blank page after deployment, or 404 on page refresh | Ensure the web server redirects all routes to `index.html` (SPA fallback). The provided `nginx.conf` does this via `try_files`. |
| `npm install` fails with permission errors (Linux) | Avoid using `sudo npm install`; instead fix npm's default directory permissions or use a Node version manager (e.g., `nvm`). |
| `docker` not recognized / cannot connect to the Docker daemon | Start Docker Desktop and wait until it reports "Engine running". Reopen PowerShell if `docker` is still not found. |
| Browser cannot reach `localhost:5173` (dev container) | Start the dev server with `--host 0.0.0.0` and run the container with `-p 5173:5173`. |
| Port already in use (Docker) | Stop the conflicting process or container, or map a different host port, e.g. `-p 5174:5173` or `-p 8081:80`. |
| Hot reload does not work in the dev container | Add `-e CHOKIDAR_USEPOLLING=true` to `docker run`, or move the project into the WSL filesystem. |
| `npm install` is very slow or fails with permission/platform errors in a container | Keep the `baseboard_node_modules` named volume as shown. To reset it: `docker volume rm baseboard_node_modules`. |
| Volume mount appears empty | In Docker Desktop, go to Settings → Resources → File sharing and make sure the drive containing the project is shared (usually not needed with the WSL 2 backend). |
| `npm ci` fails during `docker build` | The project has no `package-lock.json`, or it is out of sync with `package.json`. Run `npm install` locally to regenerate it, or use `npm install` in the Dockerfile. |
| Container name already in use | Remove the old container first: `docker rm -f baseboard-calculator`. |
| Application not available after reboot | Check that Docker Desktop starts at sign-in (section 4.7), that the restart policy is `unless-stopped` (`docker inspect`), and that the container was not removed (`docker ps -a`). |
