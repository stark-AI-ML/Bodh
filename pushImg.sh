#!/bin/bash

# as i have enough of rebuilding img fuck it

echo "Enter version (e.g. 0.1, 0.2, 1.0):"
read version

img="rudreshsingh01/bodhscraper:$version"

docker build -t "$img" .

docker tag "$img" "rudreshsingh01/bodhapi:latest"

docker push "$img"
docker push "rudreshsingh01/bodhapi:latest"