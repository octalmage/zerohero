var restify = require("restify");
var dns = require("dns");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database(":memory:");

var server = restify.createServer(
{
	name: "ZeroHero Server",
	version: "0.0.1"
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

createHostsTable();

server.get("/add/:app/:name/:ip", function(req, res)
{
	var ip = getRemoteIP(req, res);

	dns.lookupService(ip, 80, function(err, hostname, service)
	{
		addHost(hostname, req.params.ip, req.params.name, req.params.app);
		
		res.send({message: "Added!", ip: req.params.ip, hostname: hostname, app: req.params.app, name: req.params.name});
	});
});

server.get("/list/:app", function(req, res)
{
	var ip = getRemoteIP(req, res);
	
	dns.lookupService(ip, 80, function(err, hostname, service)
	{
		var results = [];
		
		//Records are only valid for 5 minutes.
		var tsCheck = Math.round((new Date()).getTime() / 1000) - 60 * 5;
		
		db.each("SELECT DISTINCT ip, rowid AS id, host, name, app, date FROM hosts WHERE date > ? AND app = ? AND host = ? ORDER BY date DESC", tsCheck, req.params.app, hostname, function(err, row)
		{
			var dup = 0;
			for (var x in results)
			{
				if (results[x].ip === row.ip) dup = 1;
			}
			
			if (!dup)
			{
				results.push(row);
			}
			
			
		}, function()
		{
			res.send(results);
		});
	});
});

//Delete expired hosts ever 2 minutes.
setInterval(deleteExpiredHosts, 120000);

server.get("/test", function(req, res)
{
	res.send("works!");
});

server.get("/", function(req, res)
{
	var body = '<html><body><h1>zerohero</h1></body></html>';
	res.writeHead(200, {
		'Content-Length': Buffer.byteLength(body),
		'Content-Type': 'text/html'
	});
	res.write(body);
	res.end();
});

var port = process.env.PORT || 8080;

server.listen(port, function()
{
	console.log("%s listening at %s", server.name, server.url);
});

/**
 * Get the users IP address, with proxy support.
 * @param  {string} req Restify request.
 * @param  {string} res Restify response.
 * @return {string}     The remote IP.
 */
function getRemoteIP(req, res)
{
	var ip;
	
	//Support proxies.
	if (req.headers['x-forwarded-for'])
	{
		ip = req.headers['x-forwarded-for'];
	}
	else 
	{
		ip = res.connection.remoteAddress;
	}
	
	return ip;
}

/**
 * Delete hosts that are more than 5 minutes old.
 */
function deleteExpiredHosts()
{
	console.log("Removing expired hosts.");
	var tsCheck = Math.round((new Date()).getTime() / 1000) - 60 * 5;
	
	db.serialize(function()
	{
		db.run("DELETE FROM hosts WHERE date < ?", tsCheck, function()
		{
			console.log(this);
		});
	});
}

/**
 * Create the hosts table.
 */
function createHostsTable()
{
	db.serialize(function()
	{
		db.run("CREATE TABLE IF NOT EXISTS `hosts` (`host` text NOT NULL, `date` int(32) NOT NULL,`ip` text NOT NULL, `app` text NOT NULL,`name` text NOT NULL );");
	});
}

/**
 * Add a new host.
 * @param {string} host ISP hostname.
 * @param {string} ip   Local IP of the server.
 * @param {string} name Local hostname.
 * @param {string} app  The app submitting the host.
 */
function addHost(host, ip, name, app)
{
	var ts = Math.round((new Date()).getTime() / 1000);

	db.serialize(function()
	{
		db.run("INSERT INTO hosts (host,ip,name, app, date) VALUES (?, ?, ?, ?, ?);", host, ip, name, app, ts);
	});
}

/**
 * Close our database.
 */
function closeDatabase()
{
	db.close();
}
