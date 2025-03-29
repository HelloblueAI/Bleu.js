import fcntl
import os
import pickle
import shutil
import time

import numpy as np
from sklearn.preprocessing import StandardScaler

SCALER_PATH = "scaler.pkl"
TEMP_SCALER_PATH = "scaler.pkl.tmp"
LOCK_FILE = "scaler.lock"

rng = np.random.default_rng(seed=42)
X = rng.random((1000, 10))

try:
    with open(LOCK_FILE, "w") as lockfile:
        fcntl.flock(lockfile, fcntl.LOCK_EX)

        # Train a new scaler
        scaler = StandardScaler()
        scaler.fit(X)

        # ✅ Save as temp file
        with open(TEMP_SCALER_PATH, "wb") as f:
            pickle.dump(scaler, f, protocol=pickle.HIGHEST_PROTOCOL)

        # ✅ Ensure temp file exists before proceeding
        retries = 3
        while retries > 0:
            if os.path.exists(TEMP_SCALER_PATH):
                break
            time.sleep(0.5)
            retries -= 1

        # ✅ Move temp file safely
        shutil.move(TEMP_SCALER_PATH, SCALER_PATH)
        print(f"✅ Scaler saved successfully as {SCALER_PATH} with protocol {pickle.HIGHEST_PROTOCOL}")

except Exception as e:
    if os.path.exists(TEMP_SCALER_PATH):
        os.remove(TEMP_SCALER_PATH)
    print(f"❌ ERROR: Scaler save failed, preventing corruption. {e}")

finally:
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)
