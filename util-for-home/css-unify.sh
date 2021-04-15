#!/bin/bash

rm ../assets/css/home.css
for file in ./css/*; do
	cat ${file[i]} >> ../assets/css/home.css
done