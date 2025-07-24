#!/bin/bash

echo "🚀 Starting Local Testnet Environment"
echo "===================================="

# Check if Hardhat is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Start Hardhat network in background
echo "📡 Starting Hardhat local network..."
npx hardhat node --port 8545 &
HARDHAT_PID=$!

# Wait for network to start
sleep 5

# Deploy contracts
echo "📦 Deploying contracts to local network..."
npx hardhat run scripts/deploy-testnet.js --network localhost

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Local testnet setup completed successfully!"
    echo "📍 Network URL: http://localhost:8545"
    echo "🆔 Chain ID: 1337"
    echo "💡 Use 'kill $HARDHAT_PID' to stop the network"
    
    # Keep script running
    echo "🔄 Testnet is running... Press Ctrl+C to stop"
    wait $HARDHAT_PID
else
    echo "❌ Contract deployment failed"
    kill $HARDHAT_PID
    exit 1
fi