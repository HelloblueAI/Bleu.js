# Docker setup after OS upgrade (e.g. Pop!_OS)

If you upgraded your OS and reinstalled Docker, follow these steps so the Bleu.js stack runs without `sudo`.

## 1. One-time: fix Docker permission

Docker is installed and the daemon is running, but your user must be in the `docker` group to use it without sudo.

**Run once (you’ll need your password):**

```bash
sudo usermod -aG docker "$USER"
```

**Then either:**

- **Option A:** Log out and log back in (or reboot), or  
- **Option B:** In the same terminal, run:  
  `newgrp docker`  
  (only that terminal will have the new group until you log out/in)

**Check:**

```bash
docker info
```

If that runs without “permission denied”, you’re done with this step.

## 2. Verify and start the Bleu.js stack

From the project root:

```bash
# Start all services (MongoDB, Redis, backend, core-engine, eggs-generator, frontend)
docker compose up -d --build

# Check that containers are running
docker compose ps

# Optional: run the verification script
./scripts/docker-verify-and-run.sh
```

## 3. Quick health check

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:4003  
- **Mongo Express:** http://localhost:8081  
- **Backend health:** http://localhost:4003/health  

## 4. If something fails

- **Permission denied on docker.sock**  
  You’re not in the `docker` group yet. Do step 1 again, then log out and back in (or `newgrp docker` in a new terminal).

- **Containers exit or won’t start**  
  Check logs:  
  `docker compose logs -f`

- **Port already in use**  
  Stop other things using 3000, 4003, 6000, 8081, 27017, 6379, or change ports in `docker-compose.yml`.

- **Build errors**  
  Rebuild from scratch:  
  `docker compose build --no-cache`  
  then `docker compose up -d`.
