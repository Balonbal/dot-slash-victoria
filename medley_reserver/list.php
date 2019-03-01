<?php
$url = "http://medley.no/tidsjekk/stevneoppsett.asmx/VisStevneoppsett?FraNr=1&FraDato=";
$url .= date("Ymd");
header("Content-Type: text/xml");
print file_get_contents($url);

