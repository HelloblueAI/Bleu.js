#!/bin/bash

# Create a configuration file for CloudWatch agent
cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "nginx-error",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "nginx-access",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    },
    "metrics": {
        "metrics_collected": {
            "mem": {
                "measurement": [
                    "mem_used",
                    "mem_cached",
                    "mem_total",
                    "mem_free"
                ]
            },
            "disk": {
                "measurement": [
                    "used",
                    "total",
                    "free"
                ],
                "resources": [
                    "/"
                ]
            },
            "net": {
                "measurement": [
                    "net_packets_recv",
                    "net_packets_sent",
                    "net_bytes_recv",
                    "net_bytes_sent"
                ]
            },
            "statsd": {
                "service_address": ":8125",
                "metrics_collection_interval": 10,
                "metrics_aggregation_interval": 60
            }
        }
    }
}
EOF

# Start and enable the CloudWatch agent
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent
