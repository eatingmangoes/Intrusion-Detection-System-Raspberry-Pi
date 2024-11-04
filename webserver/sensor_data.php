<!DOCTYPE html>
<html>
<head>
  <title>Sensor Data</title>
</head>
<body>

<h1>Sensor Data</h1>

<?php
  $mqValue = $_GET["mqValue"];
  $motionDetected = $_GET["motionDetected"];

  echo "<p id='mqValue'>MQ Value: " . $mqValue . "</p>";
  echo "<p id='motionDetected'>Motion Detected: " . ($motionDetected == "YES" ? "YES" : "NO") . "</p>";

  $data = "MQ Value: " . $mqValue . "\n" . "Motion Detected: " . ($motionDetected == "YES" ? "YES" : "NO") . "\n";
  $file = fopen("/var/www/wordpress/labproject/sensor_data.txt", "a");
  fwrite($file, $data);
  fclose($file);

  echo "<h2>Sensor Data Log</h2>";
  $file = fopen("/var/www/wordpress/labproject/sensor_data.txt", "r");
  while (!feof($file)) {
    echo "<p>" . fgets($file) . "</p>";
  }
  fclose($file);
?>

<script>
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  document.addEventListener("DOMContentLoaded", function() {
    const mqValue = parseInt(document.getElementById("mqValue").innerText.replace("MQ Value: ", ""));
    const motionDetected = document.getElementById("motionDetected").innerText.includes("YES");

    if (motionDetected) {
      if (Notification.permission === "granted") {
        new Notification("Alert!", {
          body: "Motion detected!",
        });
      }
    }

    if (mqValue < 600) {
      if (Notification.permission === "granted") {
        new Notification("Warning!", {
          body: `MQ value is low: ${mqValue}`,
        });
      }
    }
  });
</script>

</body>
</html>
