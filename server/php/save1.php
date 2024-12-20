<?php
header('Content-Type: application/json');
require_once 'config1.php';

// Get data from NodeMCU
$gasLevel = isset($_GET['gas']) ? floatval($_GET['gas']) : 0;
$motionDetected = isset($_GET['motion']) ? ($_GET['motion'] === '1' ? 1 : 0) : 0;
$temperature = isset($_GET['temp']) ? floatval($_GET['temp']) : 0;

$query = "INSERT INTO pi1 (gas_level, motion_detected, temperature) 
          VALUES (?, ?, ?)";

$stmt = $conn->prepare($query);
$stmt->bind_param("ddd", $gasLevel, $motionDetected, $temperature);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}

$stmt->close();
$conn->close();
?>
