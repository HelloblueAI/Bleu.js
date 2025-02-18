#!/bin/bash
DB_CMD="mongod --config ./config/mongodb.conf"
BACKUP_DIR="./backup/$(date +%Y%m%d)"

start() {
    $DB_CMD
}

stop() {
    pkill mongod
}

backup() {
    mkdir -p $BACKUP_DIR
    mongodump --authenticationDatabase admin -u egg-admin -p Redmond8665 --out $BACKUP_DIR
    tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
    rm -rf $BACKUP_DIR
    find ./backup -name "*.tar.gz" -mtime +7 -delete
}

case "$1" in
    start) start ;;
    stop) stop ;;
    restart) stop; start ;;
    backup) backup ;;
    *) echo "Usage: $0 {start|stop|restart|backup}" ;;
esac
