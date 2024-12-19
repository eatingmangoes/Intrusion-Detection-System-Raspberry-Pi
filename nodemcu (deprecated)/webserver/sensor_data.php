<!DOCTYPE html>
<html>
<head>
  <title>Sensor Data</title>
</head>
<body>

<h1>Sensor Data</h1>

<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
date_default_timezone_set('Asia/Dubai');

$host = "localhost";
$user = "iot_user";
$pass = "dbpass";
$db = "iotdata";

$con = mysqli_connect($host, $user, $pass, $db);
if (!$con) {
    die("Failed to connect to Database: " . mysqli_connect_error() . "<br>");
}

if(isset($_GET['mqValue']) && isset($_GET['motionDetected'])) {
    $mqValue = $_GET['mqValue'];
    $motionDetected = $_GET['motionDetected'] == "YES" ? "YES" : "NO";
    $date = date('d-m-Y');
    $time = date('H:i:s');

    echo "<p id='mqValue'>MQ Value: " . $mqValue . "</p>";
    echo "<p id='motionDetected'>Motion Detected: " . $motionDetected . "</p>";

    $sql = "INSERT INTO sensor_data (date, time, mq_value, motion_detected) VALUES ('$date', '$time', '$mqValue', '$motionDetected')";
    if(mysqli_query($con, $sql)) {
        echo "Data inserted successfully<br>";
    } else {
        echo "Failed to insert data: " . mysqli_error($con) . "<br>";
    }
} else {
    echo "MQ Value and Motion Detected values are not set.<br>";
}

echo "<h2>Sensor Data Log</h2>";
$sql = "SELECT date, time, mq_value, motion_detected FROM sensor_data ORDER BY id DESC";
$result = mysqli_query($con, $sql);
if ($result && mysqli_num_rows($result) > 0) {
    while($row = mysqli_fetch_assoc($result)) {
        echo "<p>Date: " . $row['date'] . ", Time: " . $row['time'] . ", MQ Value: " . $row['mq_value'] . ", Motion Detected: " . $row['motion_detected'] . "</p>";
    }
} else {
    echo "No sensor data available.<br>";
}

mysqli_close($con);
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
