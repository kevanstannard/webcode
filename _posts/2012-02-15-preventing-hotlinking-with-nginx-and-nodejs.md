---
layout: post
title: Preventing Hotlinking with Nginx and NodeJS
---

If you are running a NodeJS site via Nginx then you may be using `proxy_pass` 
to route requests from Nginx to Node.

If you’d like to also prevent hot linking then you might like to first have a 
read of [Marcel Eichner’s post on preventing hot linking](http://blog.marceleichner.de/post/11609022896/prevent-hotlinking-but-enable-facebook-and-google) 
which this post is based on.

Then you can use a slightly modified version of that code which includes the 
`proxy_pass` directive in both of the location sections.

{% highlight nginx %}
server {
    server_name yourdomain.com www.yourdomain.com;
    location ~* (\.jpg|\.png|\.gif)$ {
        valid_referers none blocked yourdomain.com www.yourdomain.com ~\.google\. ~\.yahoo\. ~\.bing\. ~\.facebook\. ~\.fbcdn\.;
        if ($invalid_referer) {
            return 403;
        }
        proxy_pass http://127.0.0.1:8123;
    }
    location / {
        proxy_pass http://127.0.0.1:8123;
    }
}
{% endhighlight %}


Some notes about this code:

In the `valid_referers` line, **blocked** allows Referers that have been 
blocked by a firewall, **none** allows requests with no Referer.

This is followed by a list of domains and domain patterns that are also allowed.
Google, Bing, etc are allowed for their image bots to access your site.

