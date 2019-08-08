<?php

$toGet = $_GET["doc"];
if (substr($toGet, -4) !== ".xml") die("Invalid file format");
header("Content-Type: text/xml; charset=iso-8859-1");
print file_get_contents("https://medley.no" . $toGet);

