<?php

$device_info = array(
  "IP Address" => $_SERVER['REMOTE_ADDR'],
  "Date-Time" => date('Y-m-d H:i:s'),
  "User Agent" => $_SERVER['HTTP_USER_AGENT']
);

$webhook_url = "https://discord.com/api/webhooks/1198915546444468274/aCf_8Anhyhhw5AK9d6qD_4-xHR27CYMKu7D1n9Dcas5uGELcvU58WH9f1BVeggKd9X7w";

$data = array(
  "embeds" => array(
    array(
      "title" => "Browser Information",
      "description" => json_encode($device_info),
      "color" => 15844367
    )
  )
);

$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => $webhook_url,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode($data),
  CURLOPT_HTTPHEADER => array(
    "Content-Type: application/json"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}

?>
