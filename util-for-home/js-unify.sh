#!/bin/bash

rm ../assets/js/home.js
for file in ./js/*; do
	cat ${file[i]} >> ../assets/js/home.js
done