<!DOCTYPE html>
<html>
<head>
  <title>Sensor Data</title>
</head>
<body>

<h1>Sensor Data</h1>

<?php
  // Get data from NodeMCU via GET request
  $mqValue = $_GET["mqValue"];
  $motionDetected = $_GET["motionDetected"];

  // Print sensor data
  echo "<p>MQ Value: " . $mqValue . "</p>";
  echo "<p>Motion Detected: " . ($motionDetected == "YES" ? "YES" : "NO") . "</p>";

  // Save data to a text file
  $data = "MQ Value: " . $mqValue . "\n" . "Motion Detected: " . ($motionDetected == "YES" ? "YES" : "NO") . "\n";
  $file = fopen("/var/www/wordpress/labproject/sensor_data.txt", "a");
  fwrite($file, $data);
  fclose($file);

  // Print content of the text file
  echo "<h2>Sensor Data Log</h2>";
  $file = fopen("/var/www/wordpress/labproject/sensor_data.txt", "r");
  while (!feof($file)) {
    echo "<p>" . fgets($file) . "</p>";
  }
  fclose($file);
?>

</body>
</html>
