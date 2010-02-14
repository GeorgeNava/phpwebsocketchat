#!php -q
<?php
/* Run from command line > php -q chatserver.php */
error_reporting(E_ALL);
set_time_limit(0);
ob_implicit_flush();

$master  = chatserver();
$sockets = array($master);
$users   = array();
$debug   = false;

while(true){
  $changed = $sockets;
  socket_select($changed,$write=NULL,$except=NULL,NULL);
  foreach($changed as $socket){
    if($socket==$master){
      $client=socket_accept($master);
      if($client<0){ console("socket_accept() failed"); continue; }
      else{ connect($client); }
    }
    else{
      $bytes=@socket_recv($socket,$stream,2048,0);
      if($bytes==0){ disconnect($socket); }
      else{
        $user = getuserbysocket($socket);
        if(!$user->handshake){ dohandshake($user,$stream); }
        else{ process($user,$stream); }
      }
    }
  }
}

/******************** MESSAGING ********************/
function process($user,$msg){
  $msg = unwrap($msg); // remove chr(0) and chr(255)
  say("< ".$msg);
  $parts=explode("|",$msg); // CHAT|NICK|MESSAGE
  $action=strtoupper($parts[0]);
  switch($action){
    case "HELO" : welcome($user,$parts[1],$parts[2]); break; // HELO|NICK|AVATAR
    case "CHAT" : chat($user,$parts[2]); break;              // CHAT|NICK|MESSAGE
    case "PRIV" : break;                                     // TODO: private chat
    case "EXIT" : goodbye($user); break;                     // EXIT|NICK
    default     : console($action." not understood"); break;
  }
}

function welcome($user,$nick,$pic){ 
  $user->nick=$nick;
  $user->pic =$pic;
  $msg = getuserslist();
  send($user,$msg);
  broadcast("HELO|".$nick."|".$pic,$nick);
}

function goodbye($user){ 
  disconnect($user->socket);
}

function chat($user,$msg){ 
  broadcast("CHAT|".$user->nick."|".$msg,$user->nick);
}

function send($user,$msg){ 
  //say("> ".$msg);
  $msg = wrap($msg);
  socket_write($user->socket,$msg,strlen($msg)) or disconnect($user->socket);
} 

function broadcast($msg,$except=null){
  global $users;
  //say(">>".$msg);
  $kill=array();
  foreach($users as $user){
    if($user->nick==$except){ continue; } /* exclude from broadcast */
    $msg = wrap($msg);
    socket_write($user->socket,$msg,strlen($msg)) or $kill[]=$user->socket;
  }
  if(count($kill)>0){
    foreach($kill as $socket){ disconnect($socket); }
  }
}

/******************** CONNECTION ********************/
function chatserver(){
  $address = 'localhost';
  $port    = 12345;
  $maxconn = 999;
     
  $master  = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)  or die("socket_create() failed");
  socket_set_option($master, SOL_SOCKET, SO_REUSEADDR, 1)  or die("socket_option() failed");
  socket_bind($master, $address, $port)                    or die("socket_bind() failed");
  socket_listen($master,20)                                or die("socket_listen() failed");

  echo "---------------\n";
  echo "Server Started : ".date('Y-m-d H:i:s')."\n";
  echo "Max connections: ".$maxconn."\n";
  echo "Master socket  : ".$master."\n";
  echo "Listening on   : ".$address." port ".$port."\n";
  echo "---------------\n";
  
  return $master;
}

function dohandshake($user,$stream){
  console("\nRequesting handshake...");
  console($stream);
  /*        
    GET {resource} HTTP/1.1
    Upgrade: WebSocket
    Connection: Upgrade
    Host: {host}
    Origin: {origin}
    \r\n
  */
  list($resource,$host,$origin) = getheaders($stream);
  //$resource = "/phpwebsocketchat/server.php";
  //$host     = "localhost:12345";
  //$origin   = "http://localhost";
  console("Handshaking...");
  $upgrade  = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
              "Upgrade: WebSocket\r\n" .
              "Connection: Upgrade\r\n" .
              "WebSocket-Origin: " . $origin . "\r\n" .
              "WebSocket-Location: ws://" . $host . $resource . "\r\n" .
              "\r\n";
  socket_write($user->socket,$upgrade.chr(0),strlen($upgrade.chr(0)));
  $user->handshake=true;
  console($upgrade);
  console("Done handshaking...");
  return true;
}

function getheaders($req){
  $req  = substr($req,4); /* RegEx kill babies */
  $res  = substr($req,0,strpos($req," HTTP"));
  $req  = substr($req,strpos($req,"Host:")+6);
  $host = substr($req,0,strpos($req,"\r\n"));
  $req  = substr($req,strpos($req,"Origin:")+8);
  $ori  = substr($req,0,strpos($req,"\r\n"));
  return array($res,$host,$ori);
}

function connect($socket){
  global $sockets,$users;
  $user = new User();
  $user->id = uniqid();
  $user->socket = $socket;
  array_push($users,$user);
  array_push($sockets,$socket);
  console($socket." CONNECTED!");
}

function disconnect($socket){
  global $sockets,$users;
  $found=null;
  $n=count($users);
  for($i=0;$i<$n;$i++){
    if($users[$i]->socket==$socket){ $found=$i; break; }
  }
  if(!is_null($found)){
    $nick=$users[$found]->nick;
    $users[$found]=null; 
    array_splice($users,$found,1); 
    broadcast("EXIT|".$nick,$nick);
  }
  $index = array_search($socket,$sockets);
  socket_close($socket);
  console($socket." DISCONNECTED!");
  if($index>=0){ array_splice($sockets,$index,1); }
}

/******************** USERS ********************/
class User{
  var $id;
  var $nick;
  var $pic;
  var $socket;
  var $handshake;
}

function getuserslist(){
  global $users;
  $lst="LIST";
  foreach($users as $user){ $lst.='|'.$user->nick.':'.$user->pic; }
  return $lst;
}
function getuserbysocket($socket){
  global $users;
  $found=null;
  foreach($users as $user){
    if($user->socket==$socket){ $found=$user; break; }
  }
  return $found;
}

/******************** UTILS ********************/
function     say($msg=""){ echo $msg."\n"; }
function    wrap($msg=""){ return chr(0).$msg.chr(255); }
function  unwrap($msg=""){ return substr($msg,1,strlen($msg)-2); }
function console($msg=""){ global $debug; if($debug){ echo $msg."\n"; } }

?>
