# zerohero
> Easy cross platform zeroconf microservice.

zerohero uses your external hostname to store and lookup servers. Servers hit the add endpoint, and clients hit list. Only for local network applications.

## Routes

### /add/:app/:name/:ip

Add a server to the list. Servers expire after 2 minutes, so hit this endpoint often.

**Example**

`/add/test/localhost/127.0.0.1`

**Response**

```
{"message":"Added!","ip":"127.0.0.1","hostname":"localhost","app":"test","name":"localhost"}
```

### /list/:app

List servers found on the local network.

**Example**

`/list/test`

**Response**

```
[{"ip":"127.0.0.1","id":1,"host":"localhost","name":"localhost","app":"test","date":1464415020}]
```

## Story

I've created many applications where a user would have to enter the IP address of the server. For example, an iOS Netflix remote. You would run the server on your computer, open the iOS app, enter the server's IP address, then you could control Netflix!

The problem is that most people don't know what an IP address is, and they don't want to know. So I tested many zeroconf solutions including UDP broadcasting and Bonjour. I needed a solution that would work for client side JavaScript though. Anything can make an http call, so zerohero was born.

I've used a similar solution for years now, and I finally decided to rewrite it and put it online.
