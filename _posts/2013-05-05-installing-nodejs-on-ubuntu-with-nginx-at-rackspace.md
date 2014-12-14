---
layout: post
title: Installing NodeJS on Ubuntu 12.04 with Nginx at Rackspace
---

Let's assume you are setting up a new site **jabberfoo.com**
at IP address **1.2.3.4**, and that your Node application 
is running on port **8000**.





SSH to the server
-----------------
    
Once you've created your server you can SSH to it using the root login.
    
{% highlight bash %}
ssh root@1.2.3.4
{% endhighlight %}

<div class="tip">

  <p>
    If you're setting this up on a test virtual machine then you might need to
    install SSH.
  </p>
  
  {% highlight bash %}
  apt-get install openssh-server
  {% endhighlight %}

</div>





Create a new user account
-------------------------

Create a new account for logging into the server, which is more secure than
using the root user. Let's create an account named **jabberadmin**

{% highlight bash %}
adduser jabberadmin
{% endhighlight %}

Provide a strong password, but you can leave the other prompts blank. 

Allow this user to run the `sudo` command. Use the
`visudo` command to edit the sudo users file.

{% highlight bash %}
visudo
{% endhighlight %}

Under the line `root ALL=(ALL:ALL) ALL` entry, add the new line

{% highlight bash %}
jabberadmin ALL=(ALL:ALL) ALL
{% endhighlight %}





Login as your new user
----------------------------

{% highlight bash %}
ssh jabberadmin@1.2.3.4
{% endhighlight %}





Disable root login
------------------

Now that you've successfully logged in as the new user, 
you can disable root logins over SSH.


{% highlight bash %}
sudo nano /etc/ssh/sshd_config
{% endhighlight %}

And change the following line

{% highlight bash %}
PermitRootLogin no
{% endhighlight %}

Restart SSH server

{% highlight bash %}
sudo service ssh restart
{% endhighlight %}






Basic Setup
-----------

Perform some basic setup. 

{% highlight bash %}
sudo aptitude update
sudo aptitude install git-core build-essential libssl-dev
{% endhighlight %}


`libssl-dev` is needed to use the crypt node.js package






Other Software
--------------

Some other software you may find useful. 


### Installing MongoDB
    
{% highlight bash %}
sudo aptitude install mongodb
{% endhighlight %}

### Installing PostgreSQL
    
{% highlight bash %}
sudo aptitude install postgresql
{% endhighlight %}

This creates a user **postgres**.
Set the password for this user so we can access the database. 
    
{% highlight bash %}
sudo -u postgres psql postgres
\password postgres
\q
{% endhighlight %}    

To make postgres available externally
    
{% highlight bash %}
cd /etc/postgresql/9.1/main
sudo nano postgresql.conf 
{% endhighlight %}

Find the commented out line that reads

{% highlight bash %}
#listen_addresses = 'localhost'
{% endhighlight %}

Add a line above it that reads

{% highlight bash %}
listen_addresses = '*'
{% endhighlight %}

Then configure who can access the server

{% highlight bash %}
sudo nano pg_hba.conf
{% endhighlight %}

And add the following line at the end of the file.

{% highlight bash %}
host all [postgresql-username] [your-external-ip]/32 md5
{% endhighlight %}

**[postgresql-username]** is the postgresql username.

**[your-external-ip]** is the IP you will be connecting to the server from.

For example if you connect as **postgres** from IP **123.456.789.123**
then you would write. 

{% highlight bash %}
host all postgres 123.456.789.123/32 md5
{% endhighlight %}

Restart postgresql
    
{% highlight bash %}
sudo service postgresql restart
{% endhighlight %}






### And Some Others

If you're going to use bcrypt (for encrypting passwords, for example):

{% highlight bash %}
sudo aptitude install openssl
sudo aptitude install bcrypt
{% endhighlight %}






Set the timezone
----------------

The default timezone will be UTC, which can be checked by running the command
    
{% highlight bash %}
cat /etc/timezone
{% endhighlight %}


If you would like to change the timezone run `dpkg-reconfigure` which will
provide a list of timezones you can choose from.
    
{% highlight bash %}
sudo dpkg-reconfigure tzdata
{% endhighlight %}





Install Node
------------

Now we can clone the node git repository, compile and install it.
    
{% highlight bash %}
cd /usr/src
sudo git clone http://github.com/joyent/node.git
cd node
{% endhighlight %}

This will clone the trunk of the repository, but you may not want to run
you code on the bleeding edge version of node. Instead you may like to run
on the latest stable tag.
  
To list the available tags run:

{% highlight bash %}
sudo git tag
{% endhighlight %}

Then switch the code to the version you'd like to install.
At the time of writing the latest stable version is v0.10.4

{% highlight bash %}
sudo git checkout v0.10.4
{% endhighlight %}

Next we start building node.

{% highlight bash %}
sudo ./configure
sudo make
sudo make install
{% endhighlight %}

The 'sudo make' command takes around ten minutes to complete,
the other two commands are very quick.







Create a simple test application
--------------------------------

Create a simple hello world application to ensure everything is working so far.

{% highlight bash %}
cd ~
nano helloworld.js
{% endhighlight %}

And enter the following content

{% highlight bash %}
// Load the http module to create an http server.
var http = require('http');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello World\n");
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");
{% endhighlight %}

Run the application manually for now

{% highlight bash %}
node helloworld.js
{% endhighlight %}

This starts the node server on port 8000.

Open your browser and browse to your server at port 8000.
You should see your 'Hello World' message. 
    
{% highlight bash %}
http://1.2.3.4:8000
{% endhighlight %}






Install NPM
-----------

NPM comes with Node now, so there should be nothing to install.






Install Nginx
-------------
  
Set up Nginx which will proxy requests to Node. 
Stackoverflow has some reasons on
[why you would use Nginx with node](http://stackoverflow.com/questions/3186333/what-is-the-benefit-of-using-nginx-for-node-js).

{% highlight bash %}
sudo aptitude install nginx
{% endhighlight %}

Change to the Nginx sites-available directory 

{% highlight bash %}
cd /etc/nginx/sites-available/
{% endhighlight %}

To configure our site we copy the default Nginx site 

{% highlight bash %}
sudo cp default jabberfoo.com
{% endhighlight %}

Now we edit the new site configuration file
    
{% highlight bash %}
sudo nano jabberfoo.com     
{% endhighlight %}

Edit the section at the top of the file

{% highlight bash %}
# You may add here your
#server {
#    ...
#}
# statements for each of your virtual hosts
{% endhighlight %}

Change it to read:

{% highlight bash %}
# You may add here your
server {

  server_name jabberfoo.com www.jabberfoo.com;

  location / {
    proxy_pass http://127.0.0.1:8000;
  }

}
# statements for each of your virtual hosts
{% endhighlight %}

If you want to redirect your www domain to a no-www domain then add a couple of extra lines

{% highlight bash %}
# You may add here your
server {

  server_name jabberfoo.com www.jabberfoo.com;

  location / {
    proxy_pass http://127.0.0.1:8000;
  }

  if ($host = 'www.jabberfoo.com' ) {
    rewrite  ^/(.*)$  http://jabberfoo.com/$1  permanent;
  }

}
# statements for each of your virtual hosts
{% endhighlight %}

Next, enable the site by creating a symbolic link in the sites-enabled directory

{% highlight bash %}
cd ..
sudo ln -s /etc/nginx/sites-available/jabberfoo.com ./sites-enabled/jabberfoo.com
{% endhighlight %}


<div class="tip">
    
  <p>
    If you change the Nginx config file you can pick up the changes
    by restarting Nginx:
  </p>
   
  {% highlight bash %}
  sudo service nginx restart
  {% endhighlight %}

</div>


<div class="tip">
    
  <p>
    If you haven't delegated your domain names to your server yet,
    you can add them to your local hosts file for testing.
  </p>
        
  {% highlight bash %}
  1.2.3.4    jabberfoo.com
  1.2.3.4    www.jabberfoo.com
  {% endhighlight %}

</div>


<div class="tip">

  <p>
    If you will be uploading files then you may need to add a setting to the nginx.conf file.
    This may prevent 'Nginx 413 Request Entity Too Large' errors.
  </p>
  
  {% highlight bash %}
  sudo nano /etc/nginx/nginx.conf
  {% endhighlight %}
  
  <p>
    Then in the http section add the following line to set a 2MB file size limit.
  </p>
  
  {% highlight bash %}
  client_max_body_size 2M;
  {% endhighlight %}

</div>

And restart nginx to pick up the changes
    
{% highlight bash %}
sudo service nginx restart
{% endhighlight %}







Create a new account for node
-----------------------------

Our node process will run under this account which has less privileges than the root user

{% highlight bash %}
sudo adduser node
{% endhighlight %}

Provide a strong password, but you can leave the other prompts blank.

Our node user will not have sudo privileges.





Create the Jabberfoo website
----------------------------

We will create our website using the **node** user account 
so lets switch to that user now so that the files we create will have permissions
that the node user can access.

Enter the following and provide the password for the node user.
    
{% highlight bash %}
su node
{% endhighlight %}

Now we'll create a sample jabberfoo website
    
{% highlight bash %}
cd /home/node
mkdir jabberfoo
cd jabberfoo
nano app.js
{% endhighlight %}

And add the following content (same as above, but with the message changed).

{% highlight bash %}
// Load the http module to create an http server.
var http = require('http');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello Jabberfoo\n");
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");
{% endhighlight %}

Run it manually
    
{% highlight bash %}
node app.js
{% endhighlight %}

And visit it in your browser to ensure it works

{% highlight bash %}
http://1.2.3.4:8000/
{% endhighlight %}

Stop the program and return back to our **jabberfooadmin** user again.

{% highlight bash %}
exit
whoami
{% endhighlight %}






Install Upstart
---------------

Upstart provides us with start and stop commands for the site,
but can also restart the node app if it crashes.

{% highlight bash %}
sudo aptitude install upstart
{% endhighlight %}




Create the Upstart config file
------------------------------

{% highlight bash %}
sudo nano /etc/init/jabberfoo.conf
{% endhighlight %}

And add the following content
    
{% highlight bash %}
description "jabberfoo.com upstart script"
author "jabberadmin"

start on (local-filesystems and net-device-up IFACE=eth0)
stop on shutdown

respawn

script
    export HOME="/home/node"
    exec sudo -u node /usr/local/bin/node /home/node/jabberfoo/app.js >> /var/log/jabberfoo.log 2>&1
end script
{% endhighlight %}




<div class="tip">

  <p>    
    If your application is running using the 
    <a href="http://expressjs.com/">Express framework</a>
    then you will need to run your application in <b>production</b> mode.
  </p>
  
  <p>    
    Add <b>NODE_ENV=production</b> to the exec line:
  </p>
      
  {% highlight bash %}
  exec sudo -u node NODE_ENV=production /usr/local/bin/node /home/node/jabberfoo/app.js >> /var/log/jabberfoo.log 2>&1
  {% endhighlight %}
    
</div>

Now you can use the following commands to start and stop the jabberfoo node application.
    
{% highlight bash %}
sudo start jabberfoo
sudo stop jabberfoo
{% endhighlight %}

In addition, the site should start automatically when the server is booted.
  
  




Install a firewall
------------------

We'll be configuring [UFW](https://help.ubuntu.com/10.04/serverguide/C/firewall.html)
using some [info from 1000umbrellas](http://1000umbrellas.com/2010/04/29/how-to-set-up-the-firewall-using-ufw-on-ubuntu-lucid-lynx-server).

UFW is pre-installed with Ubuntu, so no need to install
  
Deny all incoming, allow all outgoing.

{% highlight bash %}
sudo ufw default deny incoming
sudo ufw default allow outgoing
{% endhighlight %}

Allow ssh and web access.

{% highlight bash %}
sudo ufw allow ssh
sudo ufw allow www
{% endhighlight %}

If you are allowing access to postgresql then also allow that.

{% highlight bash %}
sudo ufw allow 5432
{% endhighlight %}

Enable it.

This may say that current ssh connections may be disrupted, but providing
you have allowed ssh then everything should be fine.
  
{% highlight bash %}
sudo ufw enable
{% endhighlight %}

Check the firewall is running:

{% highlight bash %}
sudo ufw status
{% endhighlight %}

You should see output something like:
  
{% highlight bash %}
Status: active

To                         Action      From
--                         ------      ----
22                         ALLOW       Anywhere
80                         ALLOW       Anywhere
{% endhighlight %}


