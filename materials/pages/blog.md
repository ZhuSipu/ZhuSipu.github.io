---
layout: page
title: blog
permalink: /blog/
description: Short essays, notes, and reflections in text form.
nav: false
nav_order: 4
---

{% assign blog_posts = site.pages | where: 'blog_post', true | sort: 'date' | reverse %}
{% include blog_posts.liquid posts=blog_posts %}
