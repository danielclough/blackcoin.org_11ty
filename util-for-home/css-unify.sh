#!/bin/bash

rm ../src/assets/css/home.css
for file in ./css/*; do
	cat ${file[i]} >> ../src/assets/css/home.css
done