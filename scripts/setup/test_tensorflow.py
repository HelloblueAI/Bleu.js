import tensorflow as tf

print("TensorFlow version:", tf.__version__)
print("Python executable:", tf.sysconfig.get_build_info()["executable"])
print("Num GPUs Available:", len(tf.config.list_physical_devices("GPU")))
