#!/bin/bash
echo "Checking and closing existing processes..."

for port in 3001 3002 3003; do
  lsof -ti tcp:$port | xargs -r kill -9
done

# Wait until all ports are free
for port in 3001 3002 3003; do
  while lsof -ti tcp:$port >/dev/null; do
    echo "Waiting for port $port to be free..."
    sleep 0.5
  done
done

echo "Existing processes cleared."
echo "Starting all nodes..."

# Start Node 1 in the background (& means background)
nohup env HTTP_PORT=3001 node server.js >node1.log 2>&1 &

sleep 1

# Start Node 2 in the background
nohup env HTTP_PORT=3002 PEERS=ws://localhost:3001 node server.js >node2.log 2>&1 &

sleep 1

# Start Node 3 in the background
nohup env HTTP_PORT=3003 PEERS=ws://localhost:3001,ws://localhost:3002 node server.js >node3.log 2>&1 &

echo "All blockchain nodes started!"
echo "Logs are saved in node1.log, node2.log, and node3.log"

read -n 1 -s -r -p "Press any key to stop all nodes..."

for port in 3001 3002 3003; do
  lsof -ti tcp:$port | xargs -r kill -9
done

echo
echo "All nodes stopped."

