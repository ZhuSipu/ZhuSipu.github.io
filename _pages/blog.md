---
layout: page
title: blog
blog_home: true
blog_title: Unbuilts
permalink: /blog/
description: history, reality, and other unfinished structures
nav: true
nav_order: 4
---

{% assign blog_posts = site.pages | where: 'blog_post', true | sort: 'date' | reverse %}
{% include blog_posts.liquid posts=blog_posts %}
