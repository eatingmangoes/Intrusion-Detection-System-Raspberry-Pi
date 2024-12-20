<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'iot_user');
define('DB_PASS', 'vaibhav');
define('DB_NAME', 'modiot');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
	    die("Connection failed: " . $conn->connect_error);
}
?>

