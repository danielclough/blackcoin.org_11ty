lang=( zh es hi ar pt bn ru ja jv de ko fr te mr tr ta vi ur nl it hr )
for l in ${lang[@]}; do cp src/en/donations.html src/${l}/donations.html ; done
for l in ${lang[@]}; do cp src/en/donations.html src/${l}/faq.html ; done