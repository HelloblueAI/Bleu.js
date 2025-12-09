# ⚡ Hardware Quick Start

## Yes! Hardware Can Be Installed on Your Systems ✅

Bleu OS supports hardware installation. Here's the quick guide:

---

## 🎯 What Hardware Works?

### ✅ Works Out of the Box (No Setup)

- **NVIDIA GPUs** - Just plug in, works!
- **AMD GPUs** - Just plug in, works!
- **NVMe SSDs** - Automatic detection
- **Network Cards** - Auto-configured

### ⚙️ Needs Configuration (5 minutes)

- **Quantum Hardware** - Install SDK + API key
- **Google TPUs** - Configure credentials
- **Specialized Chips** - Install vendor drivers

---

## 🚀 Quick Installation

### 1. Check What You Have

```bash
bash bleu-os/scripts/verify-hardware.sh
```

### 2. Install GPU (if needed)

**NVIDIA:**
```bash
nvidia-smi  # Check if working
# If not: sudo apt-get install -y nvidia-driver-535
```

**AMD:**
```bash
rocminfo  # Check if working
# If not: sudo apt-get install -y rocm-dkms
```

### 3. Install Quantum Hardware (if needed)

**IBM Quantum:**
```bash
pip3 install --break-system-packages qiskit-ibm-provider
export QISKIT_IBM_TOKEN="your-token"
```

**Google Quantum:**
```bash
pip3 install --break-system-packages cirq-google
gcloud auth application-default login
```

### 4. Verify Everything Works

```bash
bash bleu-os/scripts/verify-hardware.sh
```

---

## ✅ That's It!

Your hardware is now installed and ready to use with Bleu OS!

**For detailed guides:**
- [Full Hardware Support](./HARDWARE_SUPPORT.md)
- [Installation Guide](./HARDWARE_INSTALLATION.md)

---

**Hardware installation is easy with Bleu OS!** 🔌🚀
