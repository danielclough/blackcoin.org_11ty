lang=( zh es en hi ar pt bn ru ja jv de ko fr te mr tr ta vi ur nl it hr )
for l in ${lang[@]}; do sed 's/en/$l/g' -i src/$l/$l.json; done