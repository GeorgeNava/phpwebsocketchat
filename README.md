PHPWEBSOCKETCHAT
================

Based on the first implementation of [WebSockets in PHP](http://github.com/GeorgeNava/phpwebsocket), here comes a **Web Chat** with a little twist.  
It uses little monsters as avatars thanks to gravatar and monster_id.

[Get the code from the download zone!](http://github.com/GeorgeNava/phpwebsocketchat/downloads)

*Again, as of Feb/10 the only browsers that support websockets are [Google Chrome](http://www.google.com/chrome) and Safari nightlies.*

Client side
-----------

	var host = "ws://localhost:12345/phpwebsocketchat/chatserver.php";
	try{
	  socket = new WebSocket(host);
	  socket.onopen    = function(evt){ welcome(); };
	  socket.onmessage = function(evt){ process(evt.data); };
	  socket.onclose   = function(evt){ goodbye(); };
	}
	catch(ex){ log(ex); }

View source code of [chatclient.php](http://github.com/GeorgeNava/phpwebsocketchat/blob/master/chatclient.php)


Server side
-----------

	log("Handshaking...");
	list($resource,$host,$origin) = getheaders($buffer);
	$upgrade = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
			   "Upgrade: WebSocket\r\n" .
			   "Connection: Upgrade\r\n" .
			   "WebSocket-Origin: " . $origin . "\r\n" .
			   "WebSocket-Location: ws://" . $host . $resource . "\r\n" .
			   "\r\n";
	$handshake = true;
	socket_write($socket,$upgrade.chr(0),strlen($upgrade.chr(0)));

View source code of [chatserver.php](http://github.com/GeorgeNava/phpwebsocketchat/blob/master/chatserver.php)

Steps to run the test:
----------------------

* [Download all files](http://github.com/GeorgeNava/phpwebsocketchat/downloads) to a folder in your local server running Apache and PHP.
* From the command line, run the chatserver.php program to listen for socket connections.
* Open Google Chrome (dev build) and point to the chatclient.php page
* Done, your browser now has a full-duplex channel with the server.
* Start chatting with your friends in real time!

WebSockets for the masses!
==========================

Author
------
George Nava

[http://georgenava.appspot.com](http://georgenava.appspot.com)

[http://mylittlehacks.appspot.com](http://mylittlehacks.appspot.com)

[http://twitter.com/georgenava](http://twitter.com/georgenava)
