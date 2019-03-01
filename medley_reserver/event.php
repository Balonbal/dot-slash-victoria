<?php

$toGet = $_GET["doc"];
if (substr($toGet, -4) !== ".xml") die("Invalid file format");
header("Content-Type: text/xml");
print file_get_contents("https://medley.no" . $toGet);

