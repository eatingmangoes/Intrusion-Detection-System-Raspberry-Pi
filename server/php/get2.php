<?php
header('Content-Type: application/json');
require_once 'config2.php';

$query = "SELECT * FROM pi2 ORDER BY timestamp DESC LIMIT 1";
$result = $conn->query($query);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        'gasLevel' => floatval($row['gas_level']),
        'motionDetected' => $row['motion_detected'] == 1,
        'temperature' => floatval($row['temperature']),
        'timestamp' => $row['timestamp']
    ]);
} else {
    echo json_encode([
        'gasLevel' => 0,
        'motionDetected' => false,
        'temperature' => 0,
        'timestamp' => null
    ]);
}

$conn->close();
?>
