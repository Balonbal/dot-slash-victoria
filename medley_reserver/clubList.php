<?php
//TODO Move this to a database
$list = file_get_contents("swimmingClubs.txt");
$clubs = explode("\n", $list);
header("Content-Type: application/json");
print json_encode($clubs);
