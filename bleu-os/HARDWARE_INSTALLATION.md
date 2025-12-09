# 🔌 Hardware Installation Guide for Bleu OS

## Quick Reference

This guide shows how to install and configure hardware on Bleu OS systems.

---

## 🎯 Supported Hardware

### ✅ Pre-Supported (Works Out of Box)

- **NVIDIA GPUs** - CUDA drivers pre-installed
- **AMD GPUs** - ROCm drivers pre-installed
- **Intel GPUs** - Graphics drivers pre-installed
- **NVMe SSDs** - Kernel support included
- **High-Speed Network** - Drivers included

### ⚙️ Requires Configuration

- **Quantum Hardware** - Cloud access (install SDK + configure)
- **Google TPUs** - Cloud access (configure credentials)
- **Specialized AI Chips** - Install vendor drivers

---

## 📋 Installation Steps

### Step 1: Identify Your Hardware

```bash
# Run hardware detection
bash bleu-os/scripts/verify-hardware.sh

# Or manually check
lscpu                    # CPU info
nvidia-smi              # NVIDIA GPU
rocminfo                # AMD GPU
lspci | grep VGA        # All GPUs
lsblk                   # Storage devices
```

### Step 2: Install Hardware-Specific Drivers

#### For NVIDIA GPUs

```bash
# Check if drivers are installed
nvidia-smi

# If not installed:
sudo apt-get update
sudo apt-get install -y nvidia-driver-535
sudo reboot

# Verify after reboot
nvidia-smi
```

#### For AMD GPUs

```bash
# Check if ROCm is installed
rocminfo

# If not installed:
sudo apt-get update
sudo apt-get install -y rocm-dkms
sudo reboot

# Verify after reboot
rocminfo
```

#### For Quantum Hardware

**IBM Quantum:**
```bash
# Install SDK
pip3 install --break-system-packages qiskit-ibm-provider

# Get token from: https://quantum-computing.ibm.com/
export QISKIT_IBM_TOKEN="your-token-here"

# Test
python3 -c "from qiskit_ibm_provider import IBMProvider; print('IBM Quantum ready!')"
```

**Google Quantum:**
```bash
# Install SDK
pip3 install --break-system-packages cirq-google

# Authenticate
gcloud auth application-default login

# Test
python3 -c "import cirq_google; print('Google Quantum ready!')"
```

**IonQ:**
```bash
# Install SDK
pip3 install --break-system-packages qiskit-ionq

# Get API key from: https://ionq.com/
export IONQ_API_KEY="your-api-key"

# Test
python3 -c "from qiskit_ionq import IonQProvider; print('IonQ ready!')"
```

### Step 3: Verify Hardware Works

```bash
# Run verification script
bash bleu-os/scripts/verify-hardware.sh

# Or test manually
python3 -c "import torch; print('CUDA:', torch.cuda.is_available())"
python3 -c "from qiskit_ibm_provider import IBMProvider; print('IBM Quantum:', 'ready')"
```

---

## 🔧 Common Hardware Configurations

### Multi-GPU Setup

```bash
# Check all GPUs
nvidia-smi

# Use specific GPU in code
export CUDA_VISIBLE_DEVICES=0  # Use GPU 0
export CUDA_VISIBLE_DEVICES=1  # Use GPU 1
export CUDA_VISIBLE_DEVICES=0,1  # Use both GPUs
```

### Quantum Hardware Configuration

**Create config file:** `/etc/bleu-os/quantum.conf`

```ini
[ibm_quantum]
enabled=true
token=your-token-here

[google_quantum]
enabled=true
project_id=your-project-id

[ionq]
enabled=true
api_key=your-api-key
```

### GPU Performance Tuning

```bash
# Set performance mode
sudo nvidia-smi -pm 1
sudo nvidia-smi -pl 350  # Set power limit (adjust for your GPU)

# Monitor GPU
watch -n 1 nvidia-smi
```

---

## 📚 Hardware-Specific Guides

### NVIDIA GPU
- [Full NVIDIA Setup Guide](./docs/HARDWARE_NVIDIA.md)
- Driver installation
- CUDA toolkit setup
- Multi-GPU configuration
- Performance optimization

### Quantum Hardware
- [IBM Quantum Setup](./docs/HARDWARE_IBM_QUANTUM.md)
- [Google Quantum Setup](./docs/HARDWARE_GOOGLE_QUANTUM.md)
- [IonQ Setup](./docs/HARDWARE_IONQ.md)

### TPU Setup
- [Google TPU Guide](./docs/HARDWARE_TPU.md)

---

## ✅ Verification Checklist

After installing hardware, verify:

- [ ] Hardware detected by system
- [ ] Drivers installed and working
- [ ] SDKs/libraries installed
- [ ] Credentials configured (for cloud hardware)
- [ ] Test script runs successfully
- [ ] Performance as expected

---

## 🆘 Troubleshooting

### GPU Not Detected

```bash
# Check if GPU is visible
lspci | grep -i nvidia
lspci | grep -i amd

# Reinstall drivers
sudo apt-get remove --purge nvidia-*
sudo apt-get install -y nvidia-driver-535
sudo reboot
```

### Quantum Hardware Connection Failed

```bash
# Check credentials
echo $QISKIT_IBM_TOKEN
echo $IONQ_API_KEY

# Test connection
python3 -c "from qiskit_ibm_provider import IBMProvider; IBMProvider()"
```

### Performance Issues

```bash
# Check GPU utilization
nvidia-smi dmon

# Check CPU/GPU temperature
sensors

# Optimize system
sudo cpupower frequency-set -g performance
```

---

## 📞 Support

- **Hardware Issues:** GitHub Issues
- **Driver Problems:** Hardware vendor support
- **Configuration Help:** Documentation

---

**Your hardware is ready to use with Bleu OS!** 🔌🚀
