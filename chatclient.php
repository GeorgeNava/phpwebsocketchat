<?php $avatar=md5(uniqid()); ?>
<html>
<head>
<title>PHPWebSocketChat</title>
<link rel="stylesheet" type="text/css" href="style.css">
<script>var myavatar="<?php echo $avatar; ?>";</script>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js"></script> 
<script src="chat.js"></script>
</head>
<body onload="init()">
  <div id="header" class="rd8 sd2">
    <h3><a href=".">PHP WebSocket Chat</a></h3>
  </div>
  <div id="sidebar">
    <div id="roster">
      <h2>People in the room</h2>
      <!--li id="{nick}"><a href="profile/{nick}"><img src="{avatar}"/><h3>{nick}</h3><h4>{age},{sex},{loc}</h4></a></li-->
    </div>
  </div>
  <div id="main">
    <h2 class="title">Welcome to the Lobby</h2>
    <div id="actionbar" class="rd8 sd1">
      <img id="pic" class="avatar" src="error.png">
      <input id="msg" type="textbox" onkeypress="onkey(event)"/>
      <button onclick="send()">Send</button>
    </div>
    <div id="log">
      <!--dl><dt><img src="{avatar}"/></dt><dd>{message}<br/><sub><b>{nick}</b> at {time}</sub></dd></dl-->
    </div>
  </div>
  <div id="footer" class="ru8 su2">
    PHP Websocket Chat - Freely available under the GPL
  </div>
</body>
</html>
