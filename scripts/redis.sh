#!/usr/bin/env sh
set -e

docker stop $(docker ps -a -q)

sudo mkdir -p /sys/fs/cgroup/systemd

{
  if findmnt "sys/fs/cgroup/systemd" >/dev/null
  then
    echo "Trying to mount /sys/fs/cgroup/systemd..."
    sudo mount -t cgroup -o none,name=systemd cgroup /sys/fs/cgroup/systemd
  fi
}

docker run -p 6379:6379 redis/redis-stack-server:latest
