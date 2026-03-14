#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Build Frontend
cd frontend
npm install
npm run build
cd ..

# 3. Create necessary folders
mkdir -p uploads
mkdir -p database
