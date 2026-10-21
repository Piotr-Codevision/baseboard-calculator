# Product Context & Development Guide: Interior Designer Baseboard Calculator

## 1. Product Overview

The **Baseboard Calculator** is a lightweight, intuitive web application designed specifically for interior designers. Its primary purpose is to help designers quickly calculate the minimum number of standard-length baseboards (skirting boards) required to cover a room or project's wall lengths, accounting for custom inputs, multiple segments, and strict aesthetic cutting rules.

## 2. Key Features & Requirements

### 2.1. Wall Length Management (Table-like View)

* **Interactive Table:** Users can view, add, edit, and delete individual wall lengths.
* **Flexible Entries:** Designers can add 1 or more wall lengths dynamically.
* **Row Details:** Each entry can include a custom label (e.g., "Living Room - North Wall"), length measurement, quantity of identical walls, and optional notes.

### 2.2. Baseboard Configuration

* **Global Base Length Field:** A separate, prominent input field (outside the table) to set the standard constant length of a single baseboard piece (e.g., default: $240\text{ cm}$).
* **Unit Support:** Ability to seamlessly switch or display measurements in centimeters ($\text{cm}$), meters ($\text{m}$), or inches ($\text{in}$).

### 2.3. Check & Calculation Feature

* **Live Calculation Trigger:** A dedicated check/calculate feature that processes all entered wall lengths and instantly checks/displays how many baseboards are needed to cover all the walls.
* **Summary Dashboard:** Displays total wall length, total baseboard stock required, estimated waste percentage, and breakdown per room/wall.

### 2.4. Strict Aesthetic Cutting Rule (Unbroken Segments)

* **No Unsightly Splicing:** Each distinct wall section must ideally be covered by a single continuous baseboard piece whenever it fits within the stock length.
* **Example:** If a wall measures $125\text{ cm}$ and standard baseboard stock is $240\text{ cm}$, the algorithm must allocate one full or cut piece of $125\text{ cm}$ to that wall directly, rather than piecing it together from small scraps (e.g., $50\text{ cm} + 60\text{ cm} + 15\text{ cm}$). Splicing multiple small pieces together on a single wall surface is strictly prohibited for aesthetic reasons.

### 2.5. Localization (Multilanguage Support)

* **Base Languages:** English (default) and Polish (`en` / `pl`).
* **Architecture:** Fully internationalized UI text using a lightweight translation dictionary or standard localization framework so additional languages can be added easily.

### 2.6. Testing Requirements

* **Business Logic Tests:** Unit tests covering the core baseboard calculation engine (validating the aesthetic non-splicing rule, stock minimization, and edge cases).
* **UI & Interaction Tests:** Component/End-to-End tests verifying user interactions, table data entry, language switching, and calculation triggers.

### 2.7. Platform & Technology Constraints

* **Cross-Platform Availability:** Must run seamlessly on Windows, Linux, and macOS.
* **Free & Open Stack:** Built entirely using free, open-source technologies, libraries, and frameworks (e.g., React / Vite, Tailwind CSS, Vitest / React Testing Library).

---

## 3. Installation & Deployment Guide

### Prerequisites
* Install **Node.js** (v18 or higher recommended) from [nodejs.org](https://nodejs.org/).
* (Optional, for container-based workflows) Install **Docker**:
  * **Windows:** Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/). Requires WSL 2 backend (enabled automatically by the installer on modern Windows 10/11). After installation, verify with:
    ```powershell
    docker --version
    docker run hello-world
    ```
  * **Linux (Ubuntu / Debian):**
    ```bash
    # Install Docker Engine via the official convenience script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    # Allow running docker without sudo (log out/in after this)
    sudo usermod -aG docker $USER

    # Verify installation
    docker --version
    docker run hello-world
    ```
  * **Linux (Fedora):**
    ```bash
    sudo dnf -y install dnf-plugins-core
    sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
    sudo dnf install docker-ce docker-ce-cli containerd.io
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
    ```

### 3.1. Local Development Setup

#### For Windows (PowerShell or Command Prompt):
```powershell
# Clone or open project directory
cd baseboard-calculator

# Install dependencies
npm install

# Start local development server
npm run dev
```

#### For Linux (Ubuntu / Debian / Fedora):
```bash
# Clone or open project directory
cd baseboard-calculator

# Install dependencies
npm install

# Start local development server
npm run dev
```
*Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).*

### 3.2. Building for Production & Deployment
```bash
# Build static files for deployment
npm run build
```
* The output will be generated in the `dist/` folder, which can be deployed to any static web hosting provider (e.g., Vercel, Netlify, GitHub Pages, or a local Nginx/Apache server).

### 3.3. Deployment via Docker Container

The project includes a multi-stage `Dockerfile` (build the app with Node, then serve the static `dist/` output with Nginx) plus an `nginx.conf` configured for SPA client-side routing, and a `.dockerignore` to keep the build context small.

#### Build the Docker image
Run from the project root (works identically on Windows, Linux, and macOS once Docker is installed):
```bash
docker build -t baseboard-calculator .
```

#### Run the container
```bash
docker run -d --name baseboard-calculator -p 8080:80 baseboard-calculator
```
*Open your browser and navigate to `http://localhost:8080`.*

#### Stop / remove the container
```bash
docker stop baseboard-calculator
docker rm baseboard-calculator
```

#### Optional: docker-compose
If you prefer `docker-compose`, create a `docker-compose.yml` alongside the `Dockerfile`:
```yaml
services:
  baseboard-calculator:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```
Then run:
```bash
docker compose up -d --build
```

#### Notes
* The image is built in two stages: a `node:18-alpine` stage runs `npm ci` and `npm run build`; the final stage copies only the compiled `dist/` assets into a lightweight `nginx:1.27-alpine` image, keeping the production image small and free of Node.js/toolchain dependencies.
* `nginx.conf` includes a `try_files` fallback to `index.html` so client-side routes resolve correctly on refresh/deep links.
* Rebuild the image (`docker build ...`) whenever source code or dependencies change — the container itself contains no development tooling.

---

## 4. Recommended Tech Stack

* **Frontend Framework:** React (with Vite)
* **Styling:** Tailwind CSS
* **Testing:** Vitest & React Testing Library

## 5. Development Instructions for Claude

When prompting Claude for future development phases, refer to this document. The upcoming steps will include:
1. Implementing the UI wireframe and core interactive table with local storage.
2. Adding localization dictionaries (`en` / `pl`).
3. Writing and integrating the core calculation engine conforming to the un-spliced wall rule along with automated unit and UI tests.