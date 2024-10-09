#!/bin/bash
set -e # Any subsequent(*) commands which fail will cause the shell script to exit immediately

# Create a new builder instance with a specific name
BUILDER_NAME="utilhq-demo-builder"
docker buildx create --name $BUILDER_NAME --use

pkgV=`node -e "console.log(require('./package.json').version.trim())"`
specificVersionTag=cyyapye/utilhq-demo:$pkgV
# Build the docker image + pushes it to registry
docker buildx build --output=type=registry --platform=linux/amd64,linux/arm64 -t cyyapye/utilhq-demo:latest -t $specificVersionTag .

# Cleanup: Stop and remove the builder
docker buildx stop $BUILDER_NAME
docker buildx rm $BUILDER_NAME

echo "Build completed and builder cleaned up."
