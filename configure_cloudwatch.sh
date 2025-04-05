#!/bin/bash

# Create the CloudWatch agent configuration directory
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/

# Create the configuration file with enhanced settings
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "root",
        "logfile": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "nginx-error",
                        "log_stream_name": "{instance_id}-{hostname}",
                        "retention_in_days": 14,
                        "timestamp_format": "%Y/%m/%d %H:%M:%S"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "nginx-access",
                        "log_stream_name": "{instance_id}-{hostname}",
                        "retention_in_days": 14,
                        "timestamp_format": "%d/%b/%Y:%H:%M:%S %z"
                    },
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "system-messages",
                        "log_stream_name": "{instance_id}-{hostname}",
                        "retention_in_days": 14
                    }
                ]
            }
        },
        "force_flush_interval": 15
    },
    "metrics": {
        "namespace": "CustomMetrics",
        "metrics_collected": {
            "cpu": {
                "resources": ["*"],
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_user",
                    "cpu_usage_system",
                    "cpu_usage_iowait"
                ],
                "totalcpu": true,
                "metrics_collection_interval": 60
            },
            "mem": {
                "measurement": [
                    "mem_used_percent",
                    "mem_total",
                    "mem_used",
                    "mem_cached",
                    "mem_buffered",
                    "mem_available"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "resources": ["/", "/var"],
                "measurement": [
                    "disk_used_percent",
                    "disk_used",
                    "disk_free",
                    "disk_total",
                    "disk_inodes_free",
                    "disk_inodes_used"
                ],
                "ignore_file_system_types": ["sysfs", "devtmpfs"],
                "metrics_collection_interval": 60
            },
            "diskio": {
                "resources": ["*"],
                "measurement": [
                    "reads",
                    "writes",
                    "read_bytes",
                    "write_bytes",
                    "read_time",
                    "write_time",
                    "io_time"
                ],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": [
                    "swap_used_percent",
                    "swap_used",
                    "swap_free"
                ]
            },
            "net": {
                "resources": ["*"],
                "measurement": [
                    "bytes_sent",
                    "bytes_recv",
                    "packets_sent",
                    "packets_recv",
                    "drop_in",
                    "drop_out",
                    "err_in",
                    "err_out"
                ]
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait",
                    "tcp_close_wait"
                ]
            },
            "processes": {
                "measurement": [
                    "running",
                    "sleeping",
                    "dead"
                ]
            }
        },
        "aggregation_dimensions": [
            ["InstanceId"],
            ["InstanceId", "InstanceType"],
            []
        ]
    }
}
EOF

# Set proper permissions
sudo chown -R root:root /opt/aws/amazon-cloudwatch-agent/etc/
sudo chmod 644 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Stop the agent if it's running
sudo systemctl stop amazon-cloudwatch-agent

# Validate the configuration
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Start the agent
sudo systemctl start amazon-cloudwatch-agent

# Wait a moment to ensure the service is started
sleep 2

# Check the status
sudo systemctl status amazon-cloudwatch-agent

echo "Enhanced CloudWatch agent configuration completed!"
