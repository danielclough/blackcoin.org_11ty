#!/bin/bash

rm ../src/assets/js/home.js
for file in ./js/*; do
	cat ${file[i]} >> ../src/assets/js/home.js
done