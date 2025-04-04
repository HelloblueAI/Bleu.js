#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_NAME="bleujs"
ENV_NAME="bleujs-prod"
REGION="us-east-1"
ALERT_EMAIL="alerts@bleujs.com"
CPU_THRESHOLD=80
ERROR_RATE_THRESHOLD=1
RESPONSE_TIME_THRESHOLD=1000  # milliseconds
REVENUE_THRESHOLD=1000  # minimum daily revenue in USD

# Initialize monitoring
init_monitoring() {
    echo -e "${YELLOW}Initializing monitoring system...${NC}"
    
    # Create CloudWatch alarms for critical metrics
    create_cloudwatch_alarms
    
    # Set up SNS topic for alerts
    setup_sns_alerts
    
    # Configure auto-scaling based on revenue metrics
    setup_revenue_scaling
}

# Create CloudWatch alarms
create_cloudwatch_alarms() {
    echo -e "${YELLOW}Setting up CloudWatch alarms...${NC}"
    
    # CPU Utilization Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-cpu-utilization" \
        --alarm-description "CPU utilization is too high" \
        --metric-name CPUUtilization \
        --namespace AWS/EC2 \
        --statistic Average \
        --period 300 \
        --threshold ${CPU_THRESHOLD} \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions ${SNS_TOPIC_ARN} \
        --dimensions Name=EnvironmentName,Value=${ENV_NAME}
    
    # Error Rate Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-error-rate" \
        --alarm-description "Error rate is too high" \
        --metric-name HTTPCode_Target_5XX_Count \
        --namespace AWS/ApplicationELB \
        --statistic Sum \
        --period 300 \
        --threshold ${ERROR_RATE_THRESHOLD} \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 1 \
        --alarm-actions ${SNS_TOPIC_ARN} \
        --dimensions Name=EnvironmentName,Value=${ENV_NAME}
    
    # Response Time Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-response-time" \
        --alarm-description "Response time is too high" \
        --metric-name TargetResponseTime \
        --namespace AWS/ApplicationELB \
        --statistic Average \
        --period 300 \
        --threshold ${RESPONSE_TIME_THRESHOLD} \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions ${SNS_TOPIC_ARN} \
        --dimensions Name=EnvironmentName,Value=${ENV_NAME}
}

# Set up SNS alerts
setup_sns_alerts() {
    echo -e "${YELLOW}Setting up SNS alerts...${NC}"
    
    # Create SNS topic
    SNS_TOPIC_ARN=$(aws sns create-topic \
        --name "${APP_NAME}-alerts" \
        --query 'TopicArn' \
        --output text)
    
    # Subscribe to alerts
    aws sns subscribe \
        --topic-arn ${SNS_TOPIC_ARN} \
        --protocol email \
        --notification-endpoint ${ALERT_EMAIL}
}

# Set up revenue-based scaling
setup_revenue_scaling() {
    echo -e "${YELLOW}Setting up revenue-based scaling...${NC}"
    
    # Create custom metric for revenue
    aws cloudwatch put-metric-data \
        --namespace ${APP_NAME} \
        --metric-name DailyRevenue \
        --value 0 \
        --unit Dollars \
        --dimensions Name=EnvironmentName,Value=${ENV_NAME}
    
    # Create alarm for revenue threshold
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-revenue-threshold" \
        --alarm-description "Daily revenue below threshold" \
        --metric-name DailyRevenue \
        --namespace ${APP_NAME} \
        --statistic Average \
        --period 86400 \
        --threshold ${REVENUE_THRESHOLD} \
        --comparison-operator LessThanThreshold \
        --evaluation-periods 1 \
        --alarm-actions ${SNS_TOPIC_ARN} \
        --dimensions Name=EnvironmentName,Value=${ENV_NAME}
}

# Monitor application health
monitor_health() {
    echo -e "${YELLOW}Monitoring application health...${NC}"
    
    while true; do
        # Check environment status
        local status=$(aws elasticbeanstalk describe-environments \
            --environment-names "${ENV_NAME}" \
            --query 'Environments[0].Status' \
            --output text)
        
        # Check health status
        local health=$(aws elasticbeanstalk describe-environments \
            --environment-names "${ENV_NAME}" \
            --query 'Environments[0].Health' \
            --output text)
        
        echo -e "${YELLOW}Status: $status, Health: $health${NC}"
        
        # Check CPU utilization
        local cpu_util=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/EC2 \
            --metric-name CPUUtilization \
            --dimensions Name=EnvironmentName,Value=${ENV_NAME} \
            --start-time "$(date -u -v-5M +%FT%TZ)" \
            --end-time "$(date -u +%FT%TZ)" \
            --period 300 \
            --statistics Average \
            --query 'Datapoints[0].Average' \
            --output text)
        
        echo -e "${YELLOW}CPU Utilization: $cpu_util%${NC}"
        
        # Check error rate
        local error_rate=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/ApplicationELB \
            --metric-name HTTPCode_Target_5XX_Count \
            --dimensions Name=EnvironmentName,Value=${ENV_NAME} \
            --start-time "$(date -u -v-5M +%FT%TZ)" \
            --end-time "$(date -u +%FT%TZ)" \
            --period 300 \
            --statistics Sum \
            --query 'Datapoints[0].Sum' \
            --output text)
        
        echo -e "${YELLOW}Error Rate: $error_rate${NC}"
        
        # Check response time
        local response_time=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/ApplicationELB \
            --metric-name TargetResponseTime \
            --dimensions Name=EnvironmentName,Value=${ENV_NAME} \
            --start-time "$(date -u -v-5M +%FT%TZ)" \
            --end-time "$(date -u +%FT%TZ)" \
            --period 300 \
            --statistics Average \
            --query 'Datapoints[0].Average' \
            --output text)
        
        echo -e "${YELLOW}Response Time: ${response_time}ms${NC}"
        
        # Check daily revenue
        local daily_revenue=$(aws cloudwatch get-metric-statistics \
            --namespace ${APP_NAME} \
            --metric-name DailyRevenue \
            --dimensions Name=EnvironmentName,Value=${ENV_NAME} \
            --start-time "$(date -u -v-1D +%FT%TZ)" \
            --end-time "$(date -u +%FT%TZ)" \
            --period 86400 \
            --statistics Average \
            --query 'Datapoints[0].Average' \
            --output text)
        
        echo -e "${YELLOW}Daily Revenue: $${daily_revenue}${NC}"
        
        # Alert if any metrics are concerning
        if (( $(echo "$cpu_util > $CPU_THRESHOLD" | bc -l) )); then
            send_alert "High CPU utilization: ${cpu_util}%"
        fi
        
        if (( $(echo "$error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
            send_alert "High error rate: ${error_rate}"
        fi
        
        if (( $(echo "$response_time > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
            send_alert "High response time: ${response_time}ms"
        fi
        
        if (( $(echo "$daily_revenue < $REVENUE_THRESHOLD" | bc -l) )); then
            send_alert "Low daily revenue: $${daily_revenue}"
        fi
        
        sleep 300  # Check every 5 minutes
    done
}

# Send alert
send_alert() {
    local message=$1
    echo -e "${RED}ALERT: $message${NC}"
    
    aws sns publish \
        --topic-arn ${SNS_TOPIC_ARN} \
        --message "$message" \
        --subject "${APP_NAME} Alert"
}

# Main monitoring process
main() {
    init_monitoring
    monitor_health
}

# Run main function
main 